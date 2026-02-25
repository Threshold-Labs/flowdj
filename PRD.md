# FlowDJ — Product Requirements Document

**Version:** 0.2 (Feb 2026)
**Status:** Prototype, seeking feedback
**Author:** Ryan St. Pierre

---

## Vision

Music that responds to your momentum. FlowDJ generates continuous, evolving audio that adapts to your work rhythm — typing speed, voice energy, project context — creating a biofeedback loop between productivity and sound. Drift off-topic and the music nudges you back through subconscious musical tension.

## Target Users

1. **Knowledge workers** who use music to focus but find playlists distracting or repetitive
2. **Writers / thinkers** who want background audio that responds to their creative state
3. **Developers** who want focus music tied to their actual project context
4. **Mobile users** who want adaptive focus music on the go (car, commute, walking)

## Core Thesis

> Every productivity tool measures *output*. FlowDJ measures *attention* and turns it into something you can feel. The music IS the feedback — not a notification, not a chart you check later.

---

## What's Shipped (v0.2)

### Generative Audio Engine
- Pure Web Audio API — runs on any device, no server required, no downloads
- **6 distinct sound palettes** with per-vibe instrument design:
  | Vibe | Bass | Pad | Lead | Percussion | Character |
  |------|------|-----|------|------------|-----------|
  | Chill | Sine + sub | FM warm triangle | Bell | Soft kick, closed hat | Laid-back, Lo-fi feel |
  | Deep Focus | Sine + sub | FM airy sine (2:1) | Pluck triangle | Click, shaker | Minimal, spacious |
  | Energy | Sawtooth + sub | FM square stabs | Bright saw | Hard kick w/ transient, open hat, snare | Driving, punchy |
  | Dreamy | Sine + sub | FM glass sine (3:1) | Soft bell | Soft kick, brush | Ethereal, floating |
  | Dark | Triangle + sub | FM metallic saw (7:1) | Square | Deep kick, metallic hat | Brooding, tense |
  | Jazz | Walking triangle + sub | FM Rhodes sine (1.5:1) | Muted triangle | Jazz kick, ride cymbal, snare | Organic, swinging |
- **FM synthesis** on all pads — modulator oscillators create Rhodes, bell, glass, and metallic timbres
- Sub bass oscillator for weight across all vibes
- **Tempo-synced delay** with filtered feedback (per-vibe time/feedback/mix)
- **Filter LFO** — slow modulation on pad filter for evolving texture
- **Noise texture layer** — subtle vinyl/air atmosphere, varies per vibe
- **Swing timing** — offbeat delay for human feel (0–25% per vibe)
- **Extended harmony** — triads, 7th chords, sus chords, add9, power chords
- **Motif-based melody** — lead develops short phrases with transposition, not random notes
- Walking bass in jazz mode (passing tones on every beat)
- 6 percussion styles per instrument (kick: soft/hard/deep/click/jazz; hat: closed/open/ride/brush/shaker/metallic)
- Snare with body tone + noise rattle
- Impulse response reverb, dynamics compression, master chain

### Flow Tracking
- **Typing → Music:** Keystroke-driven flow score (0–100) with exponential decay, rolling WPM (10s window), burst detection (5 rapid keys = 1.5x), streak tracking
- **Voice → Music:** Mic energy (RMS) feeds flow score via getUserMedia + AnalyserNode. Works in all browsers. Talking, humming, thinking aloud all build momentum.
- **Voice commands (Chrome/Edge):** Continuous SpeechRecognition with auto-restart. "More bass", "speed up", "make it dreamy", etc.
- Flow zones: Idle → Warming → Flow → Peak with milestone reward tones
- Flow sparkline (2-minute rolling history)

### Project Focus System
- 11 project profiles mapped to real workstreams (Threshold, DropIn, Agent Infra, Productivity, Research, Events, General)
- Workstream-grouped project select with firewall indicators
- Per-project focus keywords + drift keywords
- Real-time text analysis on rolling 80-word window → focus score (0–100)
- **Musical drift response:**
  - Tritone dissonance oscillator fades in when off-topic
  - Pad detuning creates unease
  - Warmth/complexity/space shift to make the mix feel "wrong"
- **Visual drift cues:** workspace border glow, visualizer hue shift, keyword highlighting
- **Refocus reward:** arpeggiated resolution chord when coming back on-topic
- Auto-switches vibe + sound palette when changing projects
- Custom project creation modal

### Infrastructure
- Single-tab enforcement via BroadcastChannel API (last tab to play wins, others auto-pause)
- Firefox-compatible (async AudioContext.resume, fallback reverb, non-zero initial gains)
- Responsive layout (sidebar collapses on mobile)
- Zero dependencies, single HTML file (~1800 lines)

---

## Upcoming Features

### Phase 1: Mobile & On-the-Go (next)

**Problem:** The current UI assumes a desktop workspace with a typing area. Mobile users (car, commute, walking) need flow to come from voice and motion, not typing.

#### 1.1 — Mobile-First UI
- [ ] Fullscreen mobile layout: large play button, visualizer fills screen, swipe to change vibes
- [ ] Touch-friendly controls: no tiny buttons, gesture-based (swipe up = energy, swipe down = chill)
- [ ] Lock screen / background audio support (Media Session API)
- [ ] PWA manifest + service worker for offline use and home screen install
- [ ] Wake lock API to prevent screen sleep during sessions

#### 1.2 — Motion as Flow Input
- [ ] DeviceMotion API: walking cadence, driving acceleration as flow signal
- [ ] Accelerometer-driven BPM sync (walking pace → music tempo)
- [ ] Gyroscope-based gestures: tilt phone to shift vibe

#### 1.3 — Voice-Only Mode
- [ ] Mode where mic is the sole input (no workspace/textarea)
- [ ] "Hey DJ" wake word for hands-free commands
- [ ] Ambient sound detection: typing on laptop nearby, conversation energy
- [ ] Automatic mic gain normalization (car noise vs. quiet room)

#### 1.4 — Session Persistence
- [ ] localStorage: save/resume sessions, vibe preferences, project history
- [ ] Session stats on pause: duration, peak flow, time in zone, focus breakdown
- [ ] "Your session" summary card shareable as image

**Open questions:**
- Should motion input replace or blend with voice input?
- How aggressive should BPM sync to walking pace be? (Direct sync vs. influence)
- Do we need different vibe presets for mobile? (Driving vs. walking vs. gym)

---

### Phase 2: Attention Telemetry

**Problem:** Flow data is ephemeral — lost when the tab closes. Users want to understand their attention patterns over time, and other tools could consume this data.

#### 2.1 — Attention Event Stream
- [ ] Structured `AttentionEvent` emitted every 5s:
  ```
  {
    timestamp, project_id, flow_score, focus_score,
    zone, focus_state, wpm, voice_energy,
    active_vibe, music_params: { energy, complexity, warmth, space, bpm }
  }
  ```
- [ ] Publish via BroadcastChannel (other tabs/apps can subscribe)
- [ ] Optional SSE/WebSocket endpoint for external consumers

#### 2.2 — Attention Journal
- [ ] Timestamped log of zone transitions, project switches, focus state changes
- [ ] Export: JSON / CSV of full session timeline
- [ ] memory-keeper MCP integration: save session summaries as context items

#### 2.3 — Dashboard
- [ ] Time-per-project breakdown (pie chart)
- [ ] Flow heatmap by hour of day (when are you most productive?)
- [ ] Focus score trends over sessions
- [ ] "Best flow" highlights: longest streak, highest sustained flow

**Open questions:**
- Where does telemetry data live? IndexedDB? External service?
- Privacy: attention data is sensitive. What's the data retention policy?
- Should the dashboard be a separate page or integrated into the sidebar?

---

### Phase 3: Spotify Integration

**Problem:** The generative engine sounds distinctive but not *personal*. Users want music that reflects their taste, and sometimes they want real tracks mixed in.

**Dependency: Threshold SDK**

Threshold is moving to a formal SDK. FlowDJ's Spotify integration should be built on top of that SDK rather than directly wiring to `threshold-react` internals. This makes FlowDJ an **early dogfooding consumer** — using the SDK in a real, external project will surface integration friction, missing abstractions, and DX issues before they harden.

**What this means in practice:**
- FlowDJ imports from `@threshold-labs/sdk` (or equivalent) to handle OAuth, token management, and source adapters
- Threshold must be running (or its hosted service reachable) for authenticated features to work
- Any friction FlowDJ hits becomes a filed issue against the SDK — this is intentional

**Why this matters beyond FlowDJ:**
The SDK is the right abstraction for the broader shared auth layer vision. Once it exists, DropIn, event-hub, karakeep, and other projects can consume it the same way — single OAuth flow, shared token store, users authenticate once. FlowDJ is the first concrete test of whether that works.

This is tracked as a cross-project decision in PROJECT-MAP.md. See `~/Projects/PROJECT-MAP.md` → Integration Map → Shared Auth Layer.

**Existing assets:** PKCE OAuth flow + Spotify credentials exist in threshold-react (to be migrated into SDK).

#### 3.1 — Taste Profile
- [ ] OAuth PKCE login (reuse threshold-react pattern)
- [ ] Fetch top artists, tracks, genres, audio features
- [ ] Build taste profile: preferred energy, valence, genres, artists
- [ ] Map Spotify audio features to synth parameters:
  | Spotify Feature | FlowDJ Parameter |
  |----------------|-------------------|
  | `danceability` | energy, BPM |
  | `valence` | warmth, key (major vs minor) |
  | `acousticness` | pad timbre (analog vs digital) |
  | `energy` | complexity, drive |
  | `instrumentalness` | lead volume |
- [ ] Genre-aware scale/chord selection (user's top genres → musical palettes)

#### 3.2 — Sound Palette Personalization
- [ ] Lo-fi listener → vinyl crackle, Rhodes, tape saturation
- [ ] Electronic listener → FM synthesis, acid bass, glitch percussion
- [ ] Jazz listener → walking bass, brush drums, extended chords
- [ ] Ambient listener → granular textures, long reverbs
- [ ] Hybrid: blend multiple genre influences based on listening ratios

#### 3.3 — Real Track Mixing (Premium)
- [ ] Spotify Web Playback SDK for actual track playback
- [ ] Crossfade between generative audio and real tracks
- [ ] Match tracks to current flow state using audio features
- [ ] "Focus playlist" mode: auto-queue tracks at target energy

#### 3.4 — Podcast Nudges
- [ ] Surface relevant podcast clips as attention callbacks
- [ ] "You've been off-topic for 2 mins — here's a 30s clip to refocus"

**Open questions:**
- Free tier (no playback SDK) — what's the value prop? Just taste-informed synth?
- How to handle expired tokens gracefully without disrupting flow?
- Legal: can we analyze audio features and display them?
- **SDK readiness:** What's the minimum SDK surface FlowDJ needs to unblock Spotify integration? (OAuth init, token retrieval, source adapter for Spotify audio features). Can we define this as a milestone for the SDK team?
- **Dogfooding feedback loop:** How do we capture SDK friction from FlowDJ? Filed GitHub issues? A specific label? This should be a formal channel, not ad-hoc.
- **User funnel:** If FlowDJ is someone's first touch with the Threshold ecosystem, what should the auth UX feel like? "Sign in with Threshold" vs. transparent Spotify-only OAuth?

---

### Phase 4: External Attention Sources

**Problem:** Typing and voice only capture attention when you're actively in the FlowDJ tab. Real focus happens across many apps.

#### 4.1 — Active Context Detection
- [ ] Browser extension: detect active tab URL, map to project
- [ ] Desktop app (Electron/Tauri): active window tracking
- [ ] Auto-select project based on detected context (VS Code → dev project, Google Docs → writing)

#### 4.2 — Git as Flow Signal
- [ ] Monitor commit frequency, lines changed, branch switches
- [ ] Git activity feeds flow score (complement to typing)
- [ ] "Commit streak" bonuses

#### 4.3 — Calendar Awareness
- [ ] Google Calendar / iCal integration
- [ ] Upcoming meeting → music shifts to "wrap up" mode (BPM decreases, complexity drops)
- [ ] Post-meeting → "re-entry" mode (gentle ramp back to focus)

#### 4.4 — Pomodoro Mode
- [ ] 25-min focus blocks with natural musical arcs
- [ ] Build phase (0–20 min): gradually increasing energy
- [ ] Peak (20–23 min): sustained high energy
- [ ] Wind-down (23–25 min): deceleration cue
- [ ] Break music: completely different palette (nature sounds, ambient)

**Open questions:**
- Extension vs. desktop app? Extension is lower friction but limited.
- How to handle context switches that aren't project switches? (Email isn't a "project")
- Pomodoro: rigid 25/5 or adaptive based on detected flow?

---

### Phase 5: Social & Multiplayer

#### 5.1 — Shared Sessions
- [ ] Co-working rooms with synced generative music
- [ ] Combined flow score from all participants
- [ ] "The room is in flow" — collective momentum

#### 5.2 — Team Dashboard
- [ ] Anonymized flow state of team members
- [ ] "Vibe check" — broadcast current state to Slack/Discord
- [ ] Team flow heatmap: when is the team most productive together?

**Open questions:**
- Real-time sync protocol? WebRTC for audio, WebSocket for state?
- Privacy: opt-in per session? Always anonymous?
- Does shared music help or hurt individual flow?

---

### Phase 6: Advanced Audio (Research)

#### 6.1 — On-Device AI Audio
- [ ] Stable Audio Open Small via ONNX/WebGPU for style-varied generation
- [ ] Fallback: enhanced Web Audio API engine (current approach)
- [ ] Hybrid: AI generates short motifs, Web Audio API loops/evolves them

#### 6.2 — Environment Adaptation
- [ ] Analyze ambient sound (coffee shop, office, traffic) via mic
- [ ] Adapt music to complement or mask environment
- [ ] "Noise canceling" mode: generate inverse-frequency content

#### 6.3 — Spatial Audio
- [ ] Binaural beats for deeper immersion (Web Audio API panner)
- [ ] HRTF-based spatial placement of instruments

#### 6.4 — Circadian Rhythm
- [ ] Time-of-day automatic vibe shifting
- [ ] Morning: bright, energizing → Afternoon: focused, steady → Evening: warm, winding down

---

## Architecture

### Current Stack
```
Single HTML file (index.html)
├── Web Audio API (synthesis, effects, analysis)
├── getUserMedia (mic input)
├── SpeechRecognition API (voice commands, Chrome/Edge)
├── BroadcastChannel API (tab coordination)
├── Canvas 2D (visualizer, sparkline)
└── Zero dependencies
```

### Data Model

```typescript
interface AttentionEvent {
  timestamp: string           // ISO8601
  project_id: string
  flow_score: number          // 0-100
  focus_score: number         // 0-100
  zone: 'idle' | 'warming' | 'flow' | 'peak'
  focus_state: 'on-task' | 'focused' | 'drifting' | 'off-topic'
  wpm: number
  voice_energy: number        // 0-1
  active_vibe: string
  music_params: {
    energy: number
    complexity: number
    warmth: number
    space: number
    bpm: number
  }
}

interface ProjectProfile {
  id: string
  name: string
  workstream: string
  keywords: string[]          // on-topic terms
  driftWords: string[]        // known distractors
  vibe: string                // preferred base vibe
  soundPalette?: string       // personalized sound set
  firewall: 'client' | 'internal' | 'research' | 'open'
  spotifyPlaylist?: string    // linked Spotify playlist
}
```

### Spotify Integration Pattern
- Reuse PKCE OAuth from `threshold-react/lib/integrations/sources/music/spotify-client.ts`
- Credentials in `threshold-react/.env.local`
- Scopes: `user-top-read`, `user-library-read`, `user-read-recently-played`, `streaming`
- Web Playback SDK for track playback (requires Premium)

### AI Audio Research (for Phase 6)
| Model | Size | Latency | Notes |
|-------|------|---------|-------|
| Stable Audio Open Small | Smallest | ~7s mobile | Best for on-device |
| Magenta RealTime | 800M params | Streaming | Purpose-built for real-time |
| ACE-Step 1.5 | 3.5B, <4GB VRAM | <2s on A100 | Needs local server |
| DiffRhythm | Latent diffusion | 18x faster than MusicGen | 8GB VRAM minimum |

---

## Success Metrics

| Metric | How to Measure | Target |
|--------|---------------|--------|
| Session length | Time from play to pause | >20 min average |
| Flow time | % of session in Flow or Peak zone | >40% |
| Return rate | Sessions per week per user | >3 |
| Refocus speed | Time from "drifting" to "on-task" | <90 seconds |
| Vibe switching | How often users change vibes | <2x per session (they find their fit) |
| Mobile sessions | % of sessions on mobile | >30% after Phase 1 |

---

## Open Design Questions

1. **Identity:** Is FlowDJ a productivity tool, a music app, or a wellness product? The answer shapes everything from pricing to marketing.

2. **Attention ethics:** We're measuring attention in real-time. What are the ethical boundaries? Should we ever *withhold* the data from the user? Should employers never see it?

3. **Sound ceiling:** The Web Audio API engine is surprisingly capable now with FM synthesis and effects, but it has a timbre ceiling. When does "good enough" become "needs AI"? Is the current quality sufficient for the core use case?

4. **Single file vs. framework:** Currently a single HTML file (~1800 lines). At what point do we need a build system? The zero-dependency story is compelling for distribution.

5. **Monetization:** Free tool? Freemium (Spotify integration = paid)? Open source with hosted premium features?

6. **Platform:** Web-only forever? Native app for deeper OS integration (background audio, system-level attention tracking)?
