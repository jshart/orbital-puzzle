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
├── galactic_demo.html  # Tier 1 Galactic Sector distribution prototype
├── style.css           # Glassmorphism cybernetic UI theme, HUD badges, custom range sliders
├── serve.py            # Zero-dependency local dev server (auto-launches browser on port 8000, accepts target page)
├── README.md           # Quickstart guide, hosting requirements, level catalog, controls
├── SPEC.md             # Complete engineering & mathematical specification
├── HANDOVER.md         # This handover document & snapshot guide
├── .gitignore          # Ignores temp logs, browser profiles, and scratch scripts
├── research/           # Stellar astrophysics & exoplanet population research
│   ├── stellar_population_by_spectral_class.md
│   └── exoplanet_host_stars_by_spectral_class.md
└── src/
    ├── vector.js       # Vector2 math library (add, sub, scale, dot, dist, normalize, angle)
    ├── celestial.js    # CelestialBody class (Keplerian orbits, axial spin, gravity well SOI, rings)
    ├── waypoint.js     # Target waypoint class (orbital motion, capture SOI, relative velocity)
    ├── physics.js      # Runge-Kutta 4th order integrator (rk4Step), trajectory predictor, ghost analysis
    ├── rocket.js       # Spacecraft physics, fuel consumption, launch vector calculation, RCS thrusters
    ├── sound.js        # Procedural Web Audio API sound synthesizer (thrust rumble, chime chords)
    ├── levels.js       # 10 campaign level configurations across 2 tiers + Sandbox system builder
    ├── game.js         # Core GameEngine loop, decoupled update/render, camera pan/zoom, input handlers
    └── galactic/       # Tier 1 Galactic Sector modules
        ├── stellar_types.js    # 12 spectral classes, physical constants, colors, gameplay mechanics
        ├── distribution.js    # Real-world vs Game-friendly models, continuous blend slider, PRNG
        ├── galactic_sector.js # Procedural 2D sector generator with binary barycenters & galactic drift
        ├── stellar_renderer.js# Specialized Canvas renderer (pulsar beams, accretion disks, photon rings)
        └── galactic_demo.js   # Interactive demo app controller with RK4 test slingshot probe
    └── continuum/       # Cosmic Continuum Multi-Scale modules
        ├── continuum_scenes.js # 3-Tier scene configurations (Galactic, Solar, Planetary)
        ├── continuum_director.js# State machine, patched-conics vector hand-off, auto-braking
        └── continuum_demo.js   # Interactive application controller, cross-fades, audio chimes
```

### Key Technical Patterns:
1. **Zero-Dependency Static Client:** Runs entirely client-side. Can be deployed to GitHub Pages, Cloudflare Pages, Netlify, or Vercel with zero build step.
2. **Deterministic Physics Rails:** Celestial body positions are pure functions of time $t$: $\vec{r}(t) = \vec{r}_{\text{parent}}(t) + R \begin{pmatrix} \cos(\theta_0 + \omega t) \\ \sin(\theta_0 + \omega t) \end{pmatrix}$.
3. **Decoupled Physics Integration:** Fixed timestep loop with accumulator clamping (`clampedDt = Math.min(dt, 0.05)`, max 5 sub-steps per frame) eliminates death spirals and ensures 60 FPS responsiveness.
4. **Adaptive Canvas Rasterization:** All visual HUD elements, dashed tracks, vector arrows, and labels multiply pixel dimensions by `invZoom = 1 / zoom`, keeping screen lines constant in pixel width while planets grow or shrink naturally with zoom.

---

## 5. Hosting & Deployment

- **Live GitHub Pages Links:**
  - **Main Game (Chapters 1–3 + Sandbox):** **[https://jshart.github.io/orbital-puzzle/](https://jshart.github.io/orbital-puzzle/)**
  - **Cosmic Continuum Journey Prototype:** **[https://jshart.github.io/orbital-puzzle/continuum_demo.html](https://jshart.github.io/orbital-puzzle/continuum_demo.html)**
  - **Tier 1 Galactic Sector Prototype:** **[https://jshart.github.io/orbital-puzzle/galactic_demo.html](https://jshart.github.io/orbital-puzzle/galactic_demo.html)**
- **GitHub Pages Configuration:**
  - Source: Deploy from branch (`main` / root).
  - Automatically updates on each `git push origin main`.
- **Local Testing:**
  - `python serve.py` (opens main game at `http://localhost:8000/`)
  - `python serve.py continuum_demo.html` (opens cosmic continuum journey at `http://localhost:8000/continuum_demo.html`)
  - `python serve.py galactic_demo.html` (opens galactic sector demo at `http://localhost:8000/galactic_demo.html`)

### 5.3 Multi-Scale Continuum Flight Demo Status:
- ✅ **Stage 1 (Galactic Sector):** Camera remains centered on Sagittarius Prime (SMBH) with wide 65-system framing. The Interstellar Guidance Controller (IGC) steers probe with lateral ion burns against SMBH pull, reaching Sol Prime SOI in $25.7\text{s}$.
- ✅ **Seamless Focal Transition 1 ➔ 2:** Outgoing Galactic sector centers on Sol Prime at canvas center $(w/2, h/2)$ and incoming Solar scene centers on Sol $(0, 0)$ at canvas center $(w/2, h/2)$. The galactic cluster smoothly cross-fades into the solar system with zero coordinate collision, zero star overlap, and zero offset ghosting. Radial entry angle ($\approx 159^\circ$) and velocity heading ($\approx 4^\circ$) are strictly preserved.
- ✅ **Stage 2 (Sol Interplanetary):** Predictive Lead-Pursuit MCC continuously guides the probe toward Terra's predicted orbital intercept position ($t_{\text{go}} = d_{\text{terra}} / v_{\text{probe}}$) while throttling speed ($v \le 24\text{ m/s}$) to prevent hyperbolic blowout around the Sun. Reaches Terra SOI in $9.6\text{s}$.
- ✅ **Continuous Orbital Clocks & Seamless Transition 2 ➔ 3:** Subsystem clocks (`this.solarTime` and `this.planetaryTime`) advance continuously throughout transitions, preventing planetary orbits from regressing backwards in time. Solar scene centers on Terra at $(w/2, h/2)$ and Planetary scene centers on Terra $(0, 0)$ at $(w/2, h/2)$, cross-fading smoothly with Luna and Station Alpha fading into view.
- ✅ **Stage 3 (Terra & Luna Subsystem):** Approach guidance lines up Station Alpha, followed by terminal target-relative RCS reverse thrust to scrub drift speed below $18\text{ m/s}$.
- ✅ **Stage 4 (Terminal Docking & Celebration Loop):** When clamped at Station Alpha, the simulation maintains its active render loop: Terra and Station Alpha continue smooth orbital rotation, animated green docking clamp rings pulse around Station Alpha, and a victory debrief modal presents transit times and a "REPLAY JOURNEY" button.
- ✅ **Complete Journey Verified:** Total transit time $\approx 38.6\text{s}$ with 100% mathematical reproducibility across runs.

---

## 6. Automated Regression Test Suite

An automated, zero-config test suite is configured with `pytest` (`pytest.ini`):

| Test Module | Coverage | Status |
| :--- | :--- | :--- |
| `tests/test_vector.py` | Vector2 algebra, distance, angle calculation, and `lerp` | **100% PASSED (5/5)** |
| `tests/test_celestial_eval.py` | Analytical Keplerian orbits and hierarchical moon transforms across time $t$ | **100% PASSED (3/3)** |
| `tests/test_galactic_generation.py` | Mulberry32 PRNG determinism, 65-star sector, central SMBH at (0, 0), Sol Prime | **100% PASSED (2/2)** |
| `tests/test_continuum_transitions.py` | Entry angle & heading preservation, MCC intercept simulation, terminal braking | **100% PASSED (3/3)** |
| `tests/test_continuum_e2e_cdp.py` | **Headless Chrome CDP test**: boots real Chrome, verifies 0 console errors, verifies progression through all 3 tiers into terminal docking | **100% PASSED (1/1)** |

**Running Tests:**
```bash
python -m pytest
```
*Full suite completes in $\approx 17\text{s}$ with 14 passed tests.*

---

## 7. Next Session Starting Point: Transitioning from Demo to Actual Gameplay

In this session, we proved out the multi-scale continuum pipeline (Tier 1 Galaxy ➔ Tier 2 Solar ➔ Tier 3 Moon) with deterministic transitions, focal-centered camera cross-fades, and zero visual artifacts.

### 7.1 Architecture Assessment: Generic Engine vs. Demo Scaffolding
- **Generic Engine Core (100% Reusable):**
  - **Patched-Conics State Hand-off:** Arbitrary relative entry polar coordinates $(\theta_{\text{entry}}, \phi_{\text{heading}}, v_{\text{rel}})$ calculated dynamically for any target.
  - **Focal-Centered Viewport Cross-Fade:** Both outgoing and incoming scenes center their respective focal body at $(w/2, h/2)$, guaranteeing zero visual jump or star/planet overlap regardless of coordinate magnitudes.
  - **Predictive Lead-Pursuit Guidance (MCC):** Proved across 16 arbitrary entry angles across $360^\circ$ in the test suite; dynamically predicts Keplerian orbital positions on the fly.
  - **Continuous Subsystem Clocks:** Dedicated clocks advance continuously, preventing temporal discontinuities.
- **Demo Scaffolding (To Generalize in Next Session):**
  - Replaces the hardcoded linear 1-way route (`Sagittarius Prime ➔ Sol Prime ➔ Terra ➔ Station Alpha`) with a dynamic **Hierarchical Scene Graph (Tree)**:
    `Universe ➔ Sector (65 Stars) ➔ Star Systems (N Planets) ➔ Planetary Subsystems (M Satellites)`
  - Replaces 1-way inward transitions with **Bidirectional Navigation**: inward SOI capture ($d \le R_{\text{soi}}$) and outward hyperbolic escape ($r > R_{\text{escape}}$).

### 7.2 Key Focus Areas for Next Session:
1. **Player Control & Interaction Across Scales:**
   - **Manual vs. Assisted Guidance:** Introduce player controls (flight vector adjustments, burn dials, ejection window selection) while retaining optional guidance assists (IGC / MCC flight directors).
   - **$\Delta v$ / Fuel Budgeting:** Add fuel consumption mechanics across tiers, challenging players to chain slingshots (e.g. Ares / Zeus assists) to conserve propellant for final orbital insertion.
2. **Gameplay Objectives & Level Structure:**
   - **Continuum Mission Profiles:**
     - *Interstellar Probe Deployment:* Launch from an outer star system, navigate the galactic core, and insert into a target star's planetary system.
     - *Planetary Colonization / Supply Route:* Establishing efficient multi-scale trajectories with strict transit time and fuel constraints.
     - *Extreme Environment Hazards:* Pulsar radiation cones, black hole accretion disk grazing, and asteroid field crossings.
3. **Player-Controlled Scale Navigation:**
   - Allow players to seamlessly zoom or pan between tiers during planning, inspecting planetary launch windows from the galactic map before initiating the mission.
   - Interactive maneuver node placement across intermediate orbital transfer corridors.

---

## 8. Performance, Scaling & Language Migration Roadmap

A comprehensive architectural analysis evaluating future scaling constraints of the current HTML5/JS prototype against **Rust**, **C/C++**, and **Python** has been integrated into **[SPEC.md §10](file:///c:/Users/jsh27/OneDrive/Documents/GitHub/Antigrav/Orbital%20Puzzle/SPEC.md#L196)**.

### Key Conclusions:
1. **Current JS Boundaries:** V8 garbage collection pauses, single-threaded locks during Monte Carlo trajectory sweeps (e.g. 25,000 candidate orbits), and CPU Canvas 2D rasterization limits for dense particle/asteroid fields.
2. **Why Rust is the Target Architecture:**
   - **Fearless Concurrency (`rayon`):** Parallelizing trajectory sweeps across all CPU cores with compile-time data race prevention.
   - **First-Class Wasm + WebGPU (`wgpu` / `macroquad` / `bevy`):** Unified codebase deploying to native desktop binaries (Vulkan/DirectX 12) AND zero-install WebAssembly in browser.
   - **Zero GC & Memory Determinism:** Complete frame-timing consistency.
   - **Type-Level Dimensional Safety:** Newtypes for astronomical coordinates/units and typestates for spacecraft stages.
3. **Phased Evolution Strategy:**
   - **Phase 1 (Active):** Continue rapid gameplay & continuum mechanics iteration in JS/HTML5.
   - **Phase 2 (Hybrid Acceleration):** Offload RK4 integration and trajectory prediction to a Rust Wasm module (`wasm-bindgen`).
   - **Phase 3 (Production Engine):** Full native desktop and WebGPU port in Rust (Bevy or Macroquad).

---

## 9. Game Design Evolution & Mechanical Progression Models

A comprehensive exploration of game design paradigms bridging authentic orbital simulation with compelling gameplay loops has been documented in **[SPEC.md §11](file:///c:/Users/jsh27/OneDrive/Documents/GitHub/Antigrav/Orbital%20Puzzle/SPEC.md#L256)**:

### 9.1 Resolving the "Simulation vs. Exploration Friction"
* **The Conflict:** In open-ended exploration/resource loops (*No Man's Sky*, *Elite*), manual celestial navigation quickly degenerates into repetitive errand friction when players must compute and wait for the same launch windows dozens of times.
* **The Breakthrough Paradigm:** **"Record Once, Route Forever" & Infrastructure Taming Physics.** Players manually execute challenging "Proving Flights" (slingshots, launch windows, braking burns); once verified, routes convert into automated shipping lanes or are streamlined by mega-infrastructure.

### 9.2 Four High-Level Concepts Detailed in SPEC.md:
1. **The Celestial Logistics Tycoon (Riff 1):** Manual survey flights certified into automated periodic cargo lanes (*Factorio* / *Slipways* in space).
2. **The Frontier Industrialist / Scale Ascension (Riff 2):** Starting as a lone chemical rocket pioneer, unlocking mega-engineering primitives to permanently tame physics at each tier:
   - *Tier 3 (Planetary):* Orbital Skyhooks, Lunar Mass Drivers, Lagrange Propellant Depots.
   - *Tier 2 (Interplanetary):* Aldrin Cyclers (perpetual-motion transit buses), Asteroid Nudge Redirects, Sol Laser Sail Arrays.
   - *Tier 1 (Galactic):* Supermassive Black Hole (Sagittarius Prime) gravitational catapults, Pulsar slingshots, Interstellar Relay Gates.
3. **The Orbital Rescue & Salvage Agency (Riff 3):** Tactical, high-urgency crisis missions with decaying orbits, tumbling derelicts, and salvage-funded tug upgrades.
4. **Clockwork Transit & Orbital Timetable Dispatcher (Riff 4):** Synchronizing supply flows with deterministic planetary synodic alignment windows using orbital buffer depots.

---

## 10. Autonomous Execution & Server Launch Protocol (Operational Rule)

> [!IMPORTANT]
> **Always Launch & Link Dev Servers Automatically:**
> - When creating, testing, or demonstrating code, prototypes, or demos, the AI assistant **must always automatically execute the command to launch the local development server** (`python serve.py [target]`) in the background as a daemon process.
> - The assistant **must always present direct, clickable HTTP links** (e.g. `http://localhost:8000/continuum_demo.html` or `http://localhost:8000/`) so the user never has to manually start servers or switch terminal windows.

---

## 11. Tier 1 Galactic Sector & Multi-Scale Nebula Implementation

### 11.1 Key Achievements:
- **Default Clustered Disc Morphology with Continuous Full-Disk Distribution:**
  - Transitioned the default sector morphology to the **Clustered Disc** model (`legacy`), while keeping the multi-arm spiral available as an alternative in the UI dropdown.
  - Eliminated dense artificial cluster concentration: stars are distributed across a central core bulge ($15\%$) and a smooth, continuous $360^\circ$ galactic disk ($85\%$) spanning $R \in [260, 1800\text{ AU}]$.
  - Rejection sampling ($d_{\text{min}} = 50\text{ AU}$) operates across the entire disk, eliminating star crowding and overlap while ensuring no empty, disconnected voids.
  - Every star receives a catalog designation based on its galactic quadrant (`ORI`, `CYG`, `CAR`, `VEL`, `PER`, `CEN`, `AQU`, `SGR`) without requiring artificial spatial clumping.
  - Sol Prime is deterministically anchored at index 1 at $R \approx 720\text{ AU}$, $\theta \approx 0.68\text{ rad}$.
- **Natural Clustered Disc Nebula & Dust Architecture (`CLUSTERED_DISC_NEBULA`):**
  - **Central Molecular Zone (CMZ Bulge Glow):** Warm amber, gold, and crimson ionized gas envelope surrounding the central supermassive black hole anchor.
  - **Distributed Emission Nurseries:** 16 star-forming nebulae distributed smoothly across all quadrants and radial zones of the disk across 7 distinct spectral palettes (Orion Cyan, Carina Rose, Eagle Emerald, Cygnus Indigo, Tarantula Amber, Lagoon Lavender, Cobalt Blue). Additive `screen` compositing blends overlapping puffs into organic fractal cloud contours that rotate in Keplerian synchrony with galactic motion.
  - **Curved Dark Silhouette Absorption Lanes:** 10 serpentine dust filaments and dark globules rendered via `source-over` compositing across $R = 250\text{--}1450\text{ AU}$, cutting dark silhouettes through background stars and emission glow.
  - **Broad Diffuse Interstellar Medium (ISM) Disk Haze:** 24 soft, broad ambient puffs spanning the entire galactic plane, wrapping the galaxy in a unified, luminous cosmic atmosphere with zero empty voids.
- **Square-Root Damped Apparent Sizing:**
  - $\text{basePhysicalR} = \min(12.0, 2.2 + 1.35 \cdot \sqrt{R_{\text{star}}})$.
  - Screen clamp ($1.1\text{--}2.0\text{px}$) keeps stars sharp and compact at macro zoom ($0.22\times$), while physical radius smoothly bounds stars at sector zoom ($0.75\text{--}1.5\times$), maintaining a comfortable $\sim 90\text{px}$ visual buffer between neighboring systems.
- **Precision Navigation & Controls:**
  - HUD zoom buttons (`[－]` and `[＋]`), mouse wheel, presets (`MACRO 22%`, `SECTOR 75%`), keyboard shortcuts (`+`, `-`, `C`).
  - Dynamic star lock tracking with automatic centering compensation and visual tracking badge (`🎯 LOCKED: [NAME]`).
  - Interactive Nebula toggle checkbox and live opacity slider.
- **Automated Verification:**
  - Comprehensive CDP test suite (`tests/test_galactic_demo_cdp.py`) verifies page initialization, 180 stars, disc and spiral morphology switching, nebula puff count, apparent size scaling, tracking lock, star population slider, zoom buttons/presets, and nebula toggle/opacity slider with zero console errors.



