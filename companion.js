#!/usr/bin/env node
/**
 * FlowDJ Local Companion
 *
 * Bridges project-control's attention data to FlowDJ via a CORS-enabled local
 * HTTP endpoint. FlowDJ polls this every 15s to know: what are you working on,
 * are you focused or drifting?
 *
 * Usage:  node companion.js
 * Serves: http://localhost:7331/
 *
 * This is phase 1 of Threshold local-context integration. Phase 2: project-control
 * becomes a Threshold source with connect tokens, works from any machine.
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PC_PORT        = 9111;   // project-control dashboard
const COMPANION_PORT = 7331;
const POLL_MS        = 20_000; // poll every 20s

// ── App classification by bundle ID ──────────────────────────────────────────

const BROWSER = new Set([
  'org.mozilla.firefox', 'org.mozilla.firefoxdeveloperedition',
  'com.google.Chrome', 'com.apple.Safari', 'com.brave.Browser',
  'org.chromium.Chromium', 'com.microsoft.edgemac',
]);
const TERMINAL = new Set([
  'com.googlecode.iterm2', 'com.apple.Terminal', 'com.microsoft.VSCode',
  'com.jetbrains.intellij', 'com.sublimetext.4', 'com.github.atom',
  'dev.warp.Warp-Stable',
]);
const DISTRACTION = new Set([
  'net.whatsapp.WhatsApp', 'com.tinyspeck.slackmacgap',
  'com.apple.MobileSMS', 'com.twitter.twitter-mac',
  'com.discord.Discord',
]);

// ── State ─────────────────────────────────────────────────────────────────────

let state = {
  connected: false,
  error: null,
  activeProject: null,
  focus: { score: 50, label: 'unknown', switchRate: null, deepWorkBlocks: null },
  drift: { detected: false, reason: null, recentBrowserSecs: 0 },
  apps: { browser: 0, terminal: 0, communication: 0 },
  updatedAt: null,
};

let prevSnap = null; // { ts, browserSecs, terminalSecs }

// ── Helpers ───────────────────────────────────────────────────────────────────

function pcFetch(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: 'localhost', port: PC_PORT, path, method },
      res => {
        let body = '';
        res.on('data', d => (body += d));
        res.on('end', () => {
          try { resolve(JSON.parse(body)); }
          catch (e) { reject(new Error('Invalid JSON from project-control')); }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

function focusScore({ switchRate = 0, deepWorkBlocks = 0, browserSecs, terminalSecs, recentBrowserSecs }) {
  let s = 50;
  // Deep work blocks: uninterrupted sessions are the gold standard
  if (deepWorkBlocks >= 7) s += 20;
  else if (deepWorkBlocks >= 3) s += 10;
  else if (deepWorkBlocks === 0) s -= 5;

  // Switch rate: context switches per hour — lower = better
  if (switchRate < 20)      s += 20;
  else if (switchRate < 40) s += 10;
  else if (switchRate > 80) s -= 20;
  else if (switchRate > 60) s -= 10;

  // Daily terminal vs browser ratio (coarse)
  const total = browserSecs + terminalSecs + 1;
  if (terminalSecs / total > 0.6) s += 10;
  else if (terminalSecs / total < 0.25) s -= 10;

  // Recent browser delta — strongest real-time signal
  // If browser gained >15s since last poll (20s window) = you're browsing right now
  if (recentBrowserSecs > 15) s -= 30;
  else if (recentBrowserSecs > 7)  s -= 15;

  return Math.max(0, Math.min(100, Math.round(s)));
}

function scoreLabel(s) {
  if (s >= 70) return 'deep-work';
  if (s >= 50) return 'focused';
  if (s >= 30) return 'drifting';
  return 'distracted';
}

// ── Poll ──────────────────────────────────────────────────────────────────────

async function poll() {
  try {
    // Force project-control to re-read Screen Time (best effort — ignore errors)
    await pcFetch('/api/attention/scan', 'POST').catch(() => {});

    const data = await pcFetch('/api/attention');
    const snap = data.snapshot;
    if (!snap) throw new Error('Empty snapshot');

    // Classify apps
    let browserSecs = 0, terminalSecs = 0, communicationSecs = 0;
    for (const app of snap.apps || []) {
      if (BROWSER.has(app.bundleId))     browserSecs      += app.totalSeconds;
      if (TERMINAL.has(app.bundleId))    terminalSecs     += app.totalSeconds;
      if (DISTRACTION.has(app.bundleId)) communicationSecs += app.totalSeconds;
    }

    // Delta — how many seconds did the browser accumulate since last poll?
    let recentBrowserSecs = 0;
    const now = { ts: Date.now(), browserSecs, terminalSecs };
    if (prevSnap) {
      const ageSec = (now.ts - prevSnap.ts) / 1000;
      if (ageSec < 90) recentBrowserSecs = Math.max(0, browserSecs - prevSnap.browserSecs);
    }
    prevSnap = now;

    // Scores
    const score = focusScore({
      switchRate: snap.switchRate   || 0,
      deepWorkBlocks: snap.deepWorkBlocks || 0,
      browserSecs, terminalSecs, recentBrowserSecs,
    });

    const driftDetected  = score < 40 || recentBrowserSecs > 15;
    const browserHeavy   = browserSecs > terminalSecs;
    let driftReason = null;
    if (recentBrowserSecs > 15)       driftReason = 'browsing';
    else if ((snap.switchRate || 0) > 80) driftReason = 'context-switching';
    else if (browserHeavy)            driftReason = 'browser-heavy';

    // Active project — top project from Claude Code sessions today
    let activeProject = null;
    if (snap.topProject) {
      const slug = snap.topProject;
      const name = slug.split('/').pop();
      const proj = (snap.projects || []).find(p => p.slug === slug);
      activeProject = { slug, name, path: proj?.path || null };
    }

    state = {
      connected: true,
      error: null,
      activeProject,
      focus: { score, label: scoreLabel(score), switchRate: snap.switchRate, deepWorkBlocks: snap.deepWorkBlocks },
      drift: { detected: driftDetected, reason: driftReason, recentBrowserSecs: Math.round(recentBrowserSecs) },
      apps: { browser: browserSecs, terminal: terminalSecs, communication: communicationSecs },
      updatedAt: snap.timestamp,
    };

    process.stdout.write(
      `\r[${new Date().toLocaleTimeString()}]  project=${activeProject?.name || 'none'.padEnd(20)}  focus=${String(score).padStart(3)}  drift=${driftDetected ? (driftReason || 'yes') : 'no'.padEnd(20)}  `
    );
  } catch (e) {
    state = { ...state, connected: false, error: e.message };
    process.stdout.write(`\r[${new Date().toLocaleTimeString()}]  project-control unreachable: ${e.message}    `);
  }
}

// ── Server ────────────────────────────────────────────────────────────────────

const HTML_FILE = path.join(__dirname, 'index.html');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // Serve the app at / — avoids mixed-content issues (HTTP page → HTTP API)
  if (req.url === '/' || req.url === '/index.html') {
    try {
      const html = fs.readFileSync(HTML_FILE, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } catch (e) {
      res.writeHead(500); res.end('index.html not found next to companion.js');
    }
    return;
  }

  // Companion data endpoint
  if (req.url === '/api') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(state));
    return;
  }

  res.writeHead(404); res.end('Not found');
});

// ── Boot ──────────────────────────────────────────────────────────────────────

poll();
setInterval(poll, POLL_MS);

server.listen(COMPANION_PORT, 'localhost', () => {
  console.log(`\nFlowDJ companion  →  http://localhost:${COMPANION_PORT}/`);
  console.log(`Polling project-control  →  http://localhost:${PC_PORT}/\n`);
});
