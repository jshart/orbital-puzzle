# Orbital Puzzle // Space Mechanics Prototype

A 2D orbital mechanics puzzle simulation game built on game-scale Newtonian gravity, planetary axial rotation boosts, and deterministic slingshot trajectories.

Zero runtime dependencies. Pure vanilla HTML5, Canvas, and Web Audio API. Runs 100% in the browser.

---

## 🚀 Quick Start & Hosting Requirements

* **Local Run:** Run `python serve.py` from the project root (opens automatically in your default browser at `http://localhost:8000`).
* **Manual Server:** Or run `python -m http.server 8000` and visit **[http://localhost:8000](http://localhost:8000)**.
* **Hosting Requirements:**
  * **No server-side code or runtime backend:** All gravity simulation, Runge-Kutta 4th order numerical integration, trajectory forward prediction, and audio synthesis run 100% client-side inside the user's browser.
  * **Zero server dependencies:** Can be hosted on any static web host, CDN, or object store (GitHub Pages, Cloudflare Pages, Netlify, Vercel, AWS S3, etc.).

---

## 🌌 2-Tier Astronomical Architecture

To eliminate visual clutter from deeply nested orbital hierarchies (where star + planet + moon + station rendered as an unreadable knot at high zoom), the game is structured across two distinct architectural scale tiers:

1. **Tier 3: Planetary & Moon Subsystems (Chapter 1 · Levels 1–4):**
   * A Terrestrial Planet or Gas Giant (e.g. Terra, Zeus, Cronus) serves as the central anchor gravity well.
   * Moons and orbital stations orbit cleanly around the primary planet.
2. **Tier 2: Interplanetary Solar Systems (Chapter 2 · Levels 5–8):**
   * A central star (Sol) sits at the center, orbited by primary planets (Astra, Ares, Aphrodite, Zeus) and deep-space spaceports.
3. **Chapter 3: Master Class Multi-Body Systems (Levels 9–10):**
   * High-level interplanetary trajectories featuring chained gravity assists and interplanetary-to-Jovian orbital captures.
4. **Sandbox Mode (Level 0):**
   * Complete 8-planet solar system with right-click custom waypoint placement.

*(This hierarchy provides architectural optionality for future expansion to **Tier 1: Galactic Sector View** featuring binary stars and supermassive black holes).*

---

## 🎯 Target Rendezvous & Capture System

1. **Chrono Time Pips (Timing Ruler):**
   * Periodic timestamp markers (`+5s`, `+10s`, `+15s`...) are rendered along the predicted flight arc and the target's orbit.
   * Allows intuitive visual timing estimation: players can instantly see whether they are arriving ahead of or behind the target.
2. **Arrival Node Ghost:**
   * A holographic ghost of the target station is rendered at the point of closest orbital approach, displaying:
     - Target future position at time $t_{\text{closest}}$.
     - Dashed tether line connecting the craft's periapsis to the target.
     - Telemetry badge indicating either automated clamp capture or required braking $\Delta v_{\text{rel}}$.
3. **Merged SOI Capture & Auto-Braking:**
   * Target waypoints define a Sphere of Influence ($R \approx 30\text{ AU}$) and relative velocity threshold ($v_{\text{rel}} \le 16\text{--}24\text{ m/s}$).
   * **Passive Hohmann Arrival:** Arriving inside the capture envelope with relative speed below the threshold automatically locks and docks (100% fuel bonus).
   * **Target-Relative Braking:** Entering the SOI with excess relative speed activates **Target Braking**. Holding `[SPACE]` or `[S]` fires thrusters directly opposite the relative drift vector $\vec{v}_{\text{rel}} = \vec{v}_{\text{craft}} - \vec{v}_{\text{target}}$ until docking speed is reached.

---

## 🏆 Verified Campaign Levels & Solutions

Every single level is mathematically verified and tested with deterministic solutions stored in `src/levels.js`:

| Level | Name | Tier / Subsystem | Solution Parameters | Expected Flight |
| :--- | :--- | :--- | :--- | :--- |
| **0** | **Solar System Sandbox** | Full 8 Planets + Moons | $T = 2.2\text{s}$, Thrust $27\text{ m/s}$ | $12.8\text{s}$ flight to Europa, $\Delta v_{\text{rel}} = 17.7\text{ m/s}$ |
| **1** | **Orbital Jump** | **Chapter 1 (Tier 3)** · Terra Subsystem | $T = 6.5\text{s}$, Thrust $32\text{ m/s}$ | $3.7\text{s}$ flight, $\Delta v_{\text{rel}} = 16.6\text{ m/s}$ |
| **2** | **The Moon Bridge** | **Chapter 1 (Tier 3)** · Terra & Luna Subsystem | $T = 3.0\text{s}$, Thrust $32\text{ m/s}$ | $68.5\text{s}$ flight, $\Delta v_{\text{rel}} = 17.5\text{ m/s}$ |
| **3** | **Jovian Resonance** | **Chapter 1 (Tier 3)** · Zeus & Io Subsystem | $T = 16.0\text{s}$, Thrust $14\text{ m/s}$ | $6.6\text{s}$ flight, $\Delta v_{\text{rel}} = 14.7\text{ m/s}$ |
| **4** | **Cronus Ring Run** | **Chapter 1 (Tier 3)** · Cronus & Titan Subsystem | $T = 25.0\text{s}$, Thrust $24\text{ m/s}$ | $5.8\text{s}$ flight, $\Delta v_{\text{rel}} = 11.1\text{ m/s}$ |
| **5** | **Inner Solar Leap** | **Chapter 2 (Tier 2)** · Sol & Astra | $T = 18.0\text{s}$, Thrust $26\text{ m/s}$ | $16.8\text{s}$ flight, $\Delta v_{\text{rel}} = 15.0\text{ m/s}$ |
| **6** | **Martian Slingshot** | **Chapter 2 (Tier 2)** · Sol, Terra & Ares | $T = 52.0\text{s}$, Thrust $26\text{ m/s}$ | $14.7\text{s}$ flight, $\Delta v_{\text{rel}} = 14.6\text{ m/s}$ (Ares $39.6\text{ AU}$ flyby) |
| **7** | **Retrograde Vortex** | **Chapter 2 (Tier 2)** · Sol, Terra & Aphrodite Retrograde | $T = 23.5\text{s}$, Thrust $22\text{ m/s}$ | $44.8\text{s}$ flight, $\Delta v_{\text{rel}} = 9.6\text{ m/s}$ |
| **8** | **Jovian Catapult** | **Chapter 2 (Tier 2)** · Sol, Terra & Zeus | $T = 20.5\text{s}$, Thrust $24\text{ m/s}$ | $72.2\text{s}$ flight, $\Delta v_{\text{rel}} = 13.9\text{ m/s}$ |
| **9** | **Triple Assist** | **Chapter 3** · Master Class (Sol, Terra, Ares, Zeus) | $T = 21.0\text{s}$, Thrust $30\text{ m/s}$ | $57.8\text{s}$ flight, $\Delta v_{\text{rel}} = 14.3\text{ m/s}$ (Ares $54\text{ AU}$ + Zeus $156\text{ AU}$) |
| **10** | **Grand Jovian Tour** | **Chapter 3** · Sol-to-Zeus Orbit Capture | $T = 20.0\text{s}$, Thrust $24\text{ m/s}$ | $32.2\text{s}$ flight, $\Delta v_{\text{rel}} = 6.3\text{ m/s}$ |

---

## 🎮 Controls & Shortcuts Reference

| Input | Action | Context |
| :--- | :--- | :--- |
| **`Space`** | Toggle Simulation Pause / Play / Sweep | Normal |
| **`Hold [Space] / [S]`** | Brake against target relative drift | Flying inside target SOI |
| **`L`** | Launch Rocket | Docked |
| **`R`** | Reset Mission to Launchpad | Always |
| **`Q` / `E`** | Previous / Next Mission | Always |
| **`H`** | Open / Close Flight Manual (Pauses game) | Always |
| **`◀` / `▶` Buttons (Scrubber)** | Step launch time by $\pm 0.1\text{s}$ (click or hold) | Docked |
| **`Left` / `Right Arrow` (or `A` / `D`)** | Micro-step launch window by $\pm 0.1\text{s}$ | Docked |
| **`▶ SWEEP` / `❚❚ PAUSE`** | Toggle automated launch angle sweep | Docked |
| **`◀` / `▶` Buttons (Thrust)** | Step booster thrust by $\pm 1\text{ m/s}$ (click or hold) | Docked |
| **`Up` / `Down Arrow`** | Step booster thrust by $\pm 1\text{ m/s}$ | Docked |
| **Hold `[P]` / `[W]`** | Fire forward Prograde RCS Thrusters | Flying |
| **Hold `[O]` / `[S]`** | Fire reverse Retrograde RCS Thrusters | Flying |
| **`＋` / `－` (or `+` / `-`)** | Precision camera zoom in / out | Camera Controls |
| **`C` / `CENTER`** | Recenter camera view | Camera Controls |
| **Right-Click Map** | Drop custom static waypoint | Sandbox Mode |
| **`Escape`** | Cancel custom waypoint placement / Close modal | Always |
| **Mouse Left / Middle Drag** | Pan Camera Viewport | Always |
| **Mouse Scroll Wheel** | Zoom In / Out Smoothly | Always |

---

## 🔍 Zoom-Invariant HUD & Vector Rendering

In standard Canvas scaling, zooming in increases line thickness. Orbital Puzzle implements an inverse zoom scaling matrix:
$$\text{invZoom} = \frac{1}{\max(0.01, \text{zoom})}$$
All orbit lines, SOI dashed circles, trajectory predictions, velocity arrows, time pips, and in-world labels maintain a clean, crisp $1.0\text{px}$–$1.5\text{px}$ screen-space line thickness at any zoom factor ($0.12\times$ to $2.5\times$).

---

## 🏗️ Architecture & File Structure

```
Orbital Puzzle/
├── index.html          # Web UI layout, HUD panels, and modular bootstrap
├── style.css           # Glassmorphism cybernetic UI styling
├── serve.py            # Local Python dev server
├── README.md           # Documentation, quick start, verified solution table
├── SPEC.md             # Detailed engineering specification
├── HANDOVER.md         # Handover notes, GitHub setup, roadmap for next chat
├── .gitignore          # Ignores temp logs, browser profiles, and scratch scripts
└── src/
    ├── celestial.js    # CelestialBody class (orbits, rotation, gravity, rings, orbit paths)
    ├── game.js         # GameEngine loop, inputs, adaptive zoom, HUD sync
    ├── levels.js       # 10 verified campaign levels across 2 tiers + Sandbox builder
    ├── physics.js      # RK4 integrator, time pips, arrival node ghost, sub-step interpolation
    ├── rocket.js       # Rocket state machine, continuous RCS, target braking physics
    ├── sound.js        # Procedural Web Audio API engine rumble & chord chimes
    ├── vector.js       # 2D Vector math library
    └── waypoint.js     # Target waypoint class with SOI and relative velocity checks
```
