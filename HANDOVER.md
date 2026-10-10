# Orbital Puzzle // Project Handover & Prototype Documentation

**Date:** October 10, 2026  
**Status:** Initial Prototype Verified & Complete  
**Engine Stack:** Pure Vanilla HTML5 / ES6 JavaScript / Canvas 2D / Web Audio API (Zero external dependencies)

---

## 1. Project Snapshot

The **Orbital Puzzle** prototype is a deterministic 2D space mechanics puzzle simulation game grounded in game-scale Newtonian gravity, planetary axial rotation boosts, and orbital rendezvous.

### Current Implementation State:
- ✅ **Decoupled Physics Engine:** Fixed 50Hz Runge-Kutta 4th Order (`rk4Step`) integrator with clamped accumulator, preventing frame-drop death spirals or thread freezes.
- ✅ **2-Tier Scale Hierarchy:**
  - **Tier 3 (Planetary & Moon Subsystems):** Levels 1–4 focus on planetary anchors (Terra, Zeus, Cronus) and their orbiting moons/stations.
  - **Tier 2 (Interplanetary Solar Systems):** Levels 5–8 focus on interplanetary transfers orbiting central star Sol.
  - **Chapter 3 (Master Class):** Levels 9–10 feature multi-body gravity slingshots and Jovian orbital captures.
  - **Chapter 0 (Sandbox):** Full 8-planet system with dynamic right-click waypoint placement.
- ✅ **10 Verified Levels + Sandbox:** All 11 missions have deterministic, mathematically verified solutions with authentic SOI flybys (including Level 6 Martian Slingshot at $39.6\text{ AU}$ and Level 9 Chained Dual Slingshots past Ares at $54\text{ AU}$ and Zeus at $156\text{ AU}$).
- ✅ **In-Game Flight Manual & Instructions:** In-game modal overlay (`[H]` key / navbar button) displaying complete flight manual, pausing simulation when opened.
- ✅ **Default Paused Scrub Bar & Sweep Toggle:** Launch window scrubber defaults to paused state; toggle between manual stepping (`◀` / `▶` / `A` / `D`) and automated sweep (`▶ SWEEP` button or `[SPACE]`).
- ✅ **Camera Precision Zoom Controls:** Step buttons (`[－]` / `[＋]`), live zoom readout, and `[CENTER]` recenter button (`+` / `-` / `C` keys) in bottom console.
- ✅ **Interactive Solution Auto-Dialing:** One-click `AUTO-DIAL SOLUTION ⚡` button inside hint advisory dials verified launch time and thrust for instant demo simulation.
- ✅ **Extended Trajectory Horizon:** Trajectory prediction horizon increased to 1050 steps ($84\text{s}$), ensuring long-range missions (L2, L8, L9) project completely to target docking.
- ✅ **Rendezvous & Intercept Aids:**
  - **Chrono Time Pips:** Synchronized $+5\text{s}, +10\text{s}, +15\text{s}$ rulers on both rocket trajectory and target orbit.
  - **Arrival Node Ghost:** Hologram at closest orbital approach with approach tether and relative velocity telemetry.
  - **Encounter Ghosts:** Future celestial positions and periapsis tags rendered at close flybys (`⚡ [BODY] FLYBY (T+XX.Xs)`).
  - **Merged SOI Capture & Target Braking:** Passive clamp docking for Hohmann arrivals; hold `[SPACE]` or `[S]` inside SOI to burn against relative drift vector $\vec{v}_{\text{rel}}$.
- ✅ **Zoom-Invariant HUD & Line Scaling:** All orbit tracks, SOI boundaries, trajectory paths, velocity arrows, pips, and labels scale with $\text{invZoom} = 1 / \text{zoom}$, maintaining crisp $1.0\text{px}$–$1.5\text{px}$ screen-space line thickness at any zoom level ($0.12\times$ to $2.5\times$).
- ✅ **Precision Launch Controls:** Fine-step buttons (`◀` / `▶`) with single-click and hold-to-repeat for both the Launch Window Scrubber and Booster Thrust dial.
- ✅ **Monotonic Countdown Telemetry:** HUD displays `★ DOCK IN X.Xs (ETA T+YY.Ys)` countdown during active flight.

---

## 2. GitHub Setup Instructions

The local folder has already been initialized as a Git repository (`git init`) with a clean `.gitignore`.

### Step 1: Create a Blank Repository on GitHub
1. Open your browser and go to: **[https://github.com/new](https://github.com/new)** (logged in as `jshart`).
2. Set **Repository name**: e.g., `orbital-puzzle` (or any name you prefer).
3. Set visibility to **Public** or **Private**.
4. **Important:** Leave **"Add a README file"**, **"Add .gitignore"**, and **"Choose a license"** **UNCHECKED** (the local project already has these configured).
5. Click **Create repository**.

### Step 2: Push Local Code to GitHub
Run the following commands in PowerShell from the project root directory (`c:\Users\jsh27\OneDrive\Documents\GitHub\Antigrav\Orbital Puzzle`):

```powershell
# 1. Stage all prototype files
git add .

# 2. Create the initial commit
git commit -m "Initial prototype: Orbital Dynamics Puzzle Game"

# 3. Rename branch to main (if not already)
git branch -M main

# 4. Link your remote repository (replace with your chosen repo name)
git remote add origin https://github.com/jshart/orbital-puzzle.git

# 5. Push to GitHub
git push -u origin main
```

*(Because your Windows Git Credential Manager is already authenticated for GitHub from your previous projects, this will push directly without asking for passwords).*

---

## 3. Verified Level Catalog & Solutions

| Level | Name | Tier / Scale | Solution Parameters | Expected Flight |
| :---: | :--- | :--- | :--- | :--- |
| **0** | **Solar System Sandbox** | Full 8 Planets + Moons | $T = 2.2\text{s}$, Thrust $27\text{ m/s}$ | $12.8\text{s}$ flight to Europa, $\Delta v_{\text{rel}} = 17.7\text{ m/s}$ |
| **1** | **Orbital Jump** | Chapter 1 (Tier 3) · Terra | $T = 6.5\text{s}$, Thrust $32\text{ m/s}$ | $3.7\text{s}$ flight, $\Delta v_{\text{rel}} = 16.6\text{ m/s}$ |
| **2** | **The Moon Bridge** | Chapter 1 (Tier 3) · Terra & Luna | $T = 3.0\text{s}$, Thrust $32\text{ m/s}$ | $68.5\text{s}$ flight, $\Delta v_{\text{rel}} = 17.5\text{ m/s}$ |
| **3** | **Jovian Resonance** | Chapter 1 (Tier 3) · Zeus & Io | $T = 16.0\text{s}$, Thrust $14\text{ m/s}$ | $6.6\text{s}$ flight, $\Delta v_{\text{rel}} = 14.7\text{ m/s}$ |
| **4** | **Cronus Ring Run** | Chapter 1 (Tier 3) · Cronus & Titan | $T = 25.0\text{s}$, Thrust $24\text{ m/s}$ | $5.8\text{s}$ flight, $\Delta v_{\text{rel}} = 11.1\text{ m/s}$ |
| **5** | **Inner Solar Leap** | Chapter 2 (Tier 2) · Sol & Astra | $T = 18.0\text{s}$, Thrust $26\text{ m/s}$ | $16.8\text{s}$ flight, $\Delta v_{\text{rel}} = 15.0\text{ m/s}$ |
| **6** | **Martian Slingshot** | Chapter 2 (Tier 2) · Sol, Terra & Ares | $T = 52.0\text{s}$, Thrust $26\text{ m/s}$ | $14.7\text{s}$ flight, $\Delta v_{\text{rel}} = 14.6\text{ m/s}$ (Ares $39.6\text{ AU}$ flyby) |
| **7** | **Retrograde Vortex** | Chapter 2 (Tier 2) · Sol, Terra & Aphrodite | $T = 23.5\text{s}$, Thrust $22\text{ m/s}$ | $44.8\text{s}$ flight, $\Delta v_{\text{rel}} = 9.6\text{ m/s}$ |
| **8** | **Jovian Catapult** | Chapter 2 (Tier 2) · Sol, Terra & Zeus | $T = 20.5\text{s}$, Thrust $24\text{ m/s}$ | $72.2\text{s}$ flight, $\Delta v_{\text{rel}} = 13.9\text{ m/s}$ |
| **9** | **Triple Assist** | Chapter 3 · Sol, Terra, Ares & Zeus | $T = 21.0\text{s}$, Thrust $30\text{ m/s}$ | $57.8\text{s}$ flight, $\Delta v_{\text{rel}} = 14.3\text{ m/s}$ (Ares $54\text{ AU}$ + Zeus $156\text{ AU}$) |
| **10** | **Grand Jovian Tour** | Chapter 3 · Sol-to-Zeus Insertion | $T = 20.0\text{s}$, Thrust $24\text{ m/s}$ | $32.2\text{s}$ flight, $\Delta v_{\text{rel}} = 6.3\text{ m/s}$ |

---

## 4. Architecture & Codebase Map

```
Orbital Puzzle/
├── index.html          # Semantic HTML5 layout, HUD telemetry panels, modular bootstrap script
├── style.css           # Glassmorphism cybernetic UI theme, HUD badges, custom range sliders
├── serve.py            # Zero-dependency local dev server (auto-launches browser on port 8000)
├── README.md           # Quickstart guide, hosting requirements, level catalog, controls
├── SPEC.md             # Complete engineering & mathematical specification
├── HANDOVER.md         # This handover document & snapshot guide
├── .gitignore          # Ignores temp logs, browser profiles, and scratch scripts
└── src/
    ├── vector.js       # Vector2 math library (add, sub, scale, dot, dist, normalize, angle)
    ├── celestial.js    # CelestialBody class (Keplerian orbits, axial spin, gravity well SOI, rings)
    ├── waypoint.js     # Target waypoint class (orbital motion, capture SOI, relative velocity)
    ├── physics.js      # Runge-Kutta 4th order integrator (rk4Step), trajectory predictor, ghost analysis
    ├── rocket.js       # Spacecraft physics, fuel consumption, launch vector calculation, RCS thrusters
    ├── sound.js        # Procedural Web Audio API sound synthesizer (thrust rumble, chime chords)
    ├── levels.js       # 10 campaign level configurations across 2 tiers + Sandbox system builder
    └── game.js         # Core GameEngine loop, decoupled update/render, camera pan/zoom, input handlers
```

### Key Technical Patterns:
1. **Zero-Dependency Static Client:** Runs entirely client-side. Can be deployed to GitHub Pages, Cloudflare Pages, Netlify, or Vercel with zero build step.
2. **Deterministic Physics Rails:** Celestial body positions are pure functions of time $t$: $\vec{r}(t) = \vec{r}_{\text{parent}}(t) + R \begin{pmatrix} \cos(\theta_0 + \omega t) \\ \sin(\theta_0 + \omega t) \end{pmatrix}$.
3. **Decoupled Physics Integration:** Fixed timestep loop with accumulator clamping (`clampedDt = Math.min(dt, 0.05)`, max 5 sub-steps per frame) eliminates death spirals and ensures 60 FPS responsiveness.
4. **Adaptive Canvas Rasterization:** All visual HUD elements, dashed tracks, vector arrows, and labels multiply pixel dimensions by `invZoom = 1 / zoom`, keeping screen lines constant in pixel width while planets grow or shrink naturally with zoom.

---

## 5. Hosting & Deployment

- **GitHub Pages Deployment:**
  Once pushed to GitHub, go to **Settings > Pages > Build and deployment > Source: Deploy from a branch (`main` / root)**.
  The game will be live instantly at `https://jshart.github.io/orbital-puzzle/`.
- **Local Testing:**
  Run `python serve.py` from the root folder.

---

## 6. Future Expansion Roadmap (For Next Chat)

1. **Tier 1 (Galactic Sector Scale):**
   - Add a high-level tier featuring binary star systems, black hole event horizons / gravitational lensing, and hyper-velocity slingshots.
2. **Engine Reuse for Alternative Genres:**
   - *Strategy / Supply Route Simulation:* Establishing stable periodic cargo orbits between planetary colonies.
   - *Exploration / Survey Mode:* Navigating unknown star clusters with fog-of-war gravity mapping.
3. **Audio & Visual Polish:**
   - Add an Audio Mute/Volume slider in the HUD.
   - Particle plume glow variations and screen shake on high-thrust burns.
4. **Interactive Level Editor:**
   - UI tool for placing custom planets, stars, and orbits, exportable to JSON or URL query strings for sharing.
