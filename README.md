# FlowDJ

**Music that responds to your work rhythm.**

FlowDJ generates continuous, evolving audio that adapts to how fast you're typing, how much you're talking, and what project you're working on. Drift off-topic and the music creates subconscious tension to nudge you back. Get into flow and the music builds with you.

**[Try it → flowdj.pages.dev](https://flowdj.pages.dev)**

---

## What it demonstrates

FlowDJ is a Threshold Labs example app showing two SDK integration patterns:

**Pattern 1 — Signal Push:** FlowDJ computes a real-time attention signal (flow score, zone, WPM, focus state, active project, music params) and pushes it to Threshold every 5 seconds. Raw data stays local — only the derived heuristic is transmitted.

**Spotify via connect token:** When a user connects their Spotify account through Threshold, FlowDJ retrieves an access token to fetch their taste profile (top tracks, audio features) and uses it to personalize the generative synth — valence → warmth, energy → drive, acousticness → space. The result is also pushed as a `spotify-taste` signal for Threshold to correlate with other sources.

See [`@threshold-labs/integration`](https://github.com/Threshold-Labs/threshold-sdk) for the full SDK contract.

---

## How it works

```
typing speed ─┐
voice energy  ─┼─→ flow score (0-100) ─→ music params (BPM, energy, complexity)
mic level     ─┘

active project ─→ focus score (0-100) ─→ drift detection ─→ musical tension

Spotify taste  ─→ synth personalization ─→ spotify-taste signal push
```

All audio runs in the browser via Web Audio API — no server, no downloads, works on any device including mobile.

---

## Sound engine

Six generative palettes, each with distinct FM synthesis, percussion, and groove:

| Vibe | Character | Scale | Swing |
|------|-----------|-------|-------|
| Chill | Warm triangle pad, soft kick, closed hat | Natural minor | 12% |
| Deep Focus | Airy sine pad, shaker, click kick | Minor pentatonic | 0% |
| Energy | Saw bass, square stabs, hard kick + snare | Major | 0% |
| Dreamy | Glass FM pad, brush drums | Japanese in-scale | 15% |
| Dark | Metallic FM, deep sub kick, Phrygian mode | Phrygian | 5% |
| Jazz | FM Rhodes, ride cymbal, walking bass | Dorian | 25% |

---

## Running locally

No build step. Open `index.html` directly or serve it:

```bash
# Python
python3 -m http.server 8088

# Docker
docker compose up
# → http://localhost:8088
```

### Connect to Threshold

1. Register your app at [thresholdlabs.io/ecosystem](https://thresholdlabs.io/ecosystem) to get an app token
2. Replace `THRESHOLD_APP_TOKEN` and `THRESHOLD_APP_ID` in `index.html`
3. For Spotify: connect at [thresholdlabs.io/integrations](https://thresholdlabs.io/integrations), copy your connect token into the app

### project-control companion (optional)

If you're running [project-control](https://github.com/Threshold-Labs/project-control), the local companion bridge auto-detects what you're working on:

```bash
node companion.js
# → serves http://localhost:7331
# FlowDJ polls this every 15s and auto-selects the active project
```

---

## Signal shape

FlowDJ pushes to `POST /api/signals/ai-dj` — schema from [`contract.ts`](https://github.com/Threshold-Labs/threshold-sdk/blob/main/src/contract.ts):

```ts
{
  flowScore:     number,        // 0-100, typing/voice momentum
  zone:          'idle' | 'warming' | 'flow' | 'peak',
  wpm:           number,
  voiceEnergy:   number,        // 0-1, mic RMS
  activeProject: string | null, // e.g. "sideslip", "dropin"
  focusScore:    number | null, // 0-100, on-topic score
  focusState:    'on-task' | 'focused' | 'drifting' | 'off-topic' | null,
  activeVibe:    string,
  musicParams:   { energy, complexity, warmth, space, bpm },
  pushedAt:      string,        // ISO 8601
}
```

---

## Stack

- Web Audio API (synthesis, effects, analysis)
- getUserMedia (mic input / voice energy)
- SpeechRecognition API (voice commands, Chrome/Edge)
- Spotify Web Playback SDK (real track playback, Premium required)
- BroadcastChannel API (single-tab enforcement)
- `@threshold-labs/integration` (signal push, connect token auth)

Zero npm dependencies. Single HTML file.

---

## Roadmap

See [PRD.md](./PRD.md) for the full roadmap. Next up: mobile-first UI (PWA, DeviceMotion API, lock screen audio), attention telemetry dashboard, and Phase 4 external attention sources (git activity, calendar awareness).

Issues and discussion: [github.com/Threshold-Labs/threshold-sdk](https://github.com/Threshold-Labs/threshold-sdk)
