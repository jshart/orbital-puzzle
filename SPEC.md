# Orbital Puzzle - Game Design & Technical Specification

## 1. Concept Overview
**Orbital Puzzle** is a top-down 2D puzzle simulation game grounded in orbital mechanics. Players launch spacecraft from rotating celestial bodies, leverage gravitational flybys (slingshots), and execute timed burns to rendezvous with orbiting or stationary stations across distinct tiers of astronomical scale.

The game is structured with a clear **2-Tier Astronomical Architecture**:
1. **Tier 3 (Planetary & Moon Subsystems):** Focused framing where a Gas Giant or Terrestrial Planet is the central massive anchor and moons/stations orbit cleanly without solar clutter.
2. **Tier 2 (Interplanetary Solar Scale):** Grand solar system framing where a central star is orbited by primary planets.
*(Designed to allow future extension to **Tier 1 Galactic Sector Scale** with binary stars and supermassive black holes).*

---

## 2. Core Gameplay Loop
1. **Analyze System:** Observe orbital radii, axial rotation directions, and target orbital tracks.
2. **Launch Window Timing (Scrubber):** Drag or micro-step the launch window scrubber ($T = 0$ to $90\text{s}$) with `[◀ / ▶]` single-step buttons or `[A / D]` keys to rotate the launch pad toward the ejection corridor.
3. **Booster Thrust Configuration:** Dial booster thrust ($10$ to $65\text{ m/s}$) with fine-step buttons `[▲ / ▼]` or arrow keys.
4. **Trajectory & Slingshots:** Trajectory projections feature **Chrono Time Pips** (`+5s`, `+10s`, `+15s`) and **Arrival Node Ghosts** (showing target position at closest approach with relative speed readouts).
5. **Rendezvous & SOI Capture:**
   - **Passive Clamp Capture:** Arriving within the target's Sphere of Influence ($R \approx 30\text{ AU}$) with relative velocity $v_{\text{rel}} \le v_{\text{limit}}$ automatically locks and docks.
   - **Target-Relative Braking:** Arriving within the target's SOI with $v_{\text{rel}} > v_{\text{limit}}$ enables continuous Target Braking (`HOLD [SPACE] OR [S]`), firing thrusters directly opposing the relative velocity vector until capture speed is attained.
6. **Resolution:**
   - **Success:** Target waypoint captured / docked.
   - **Failure:** Surface collision, fuel exhaustion, or deep-space escape.

---

## 3. Physics & Mechanics

### 3.1 Celestial System (Deterministic Rails)
* **Tier 3 Subsystems:** Central body is a planet (e.g., Terra, Zeus, Cronus); orbiting bodies are moons and stations.
* **Tier 2 Systems:** Central body is a star (Sol); orbiting bodies are primary planets.
* **Axial Rotation:** Bodies rotate on their axis at angular velocity $\omega_{\text{rot}}$. Surface launch pads rotate smoothly across time.
* **Faint Orbital Paths:** Faint dashed astronomical paths (`[4, 6]`, alpha 0.16) render for primary orbiting bodies.

### 3.2 Rocket Launch Velocity
When docked on a planet's surface of radius $R_{\text{body}}$ at angle $\theta(t) = \omega_{\text{rot}} \cdot t + \theta_0$:
$$\vec{v}_{\text{launch}} = \vec{v}_{\text{body\_orbit}} + \vec{v}_{\text{surface\_spin}} + \vec{v}_{\text{booster}}$$
* **Orbital Velocity ($\vec{v}_{\text{body\_orbit}}$):** Parent body's motion through space.
* **Surface Tangential Boost ($\vec{v}_{\text{surface\_spin}}$):**
  $$\vec{v}_{\text{surface\_spin}} = \omega_{\text{rot}} \cdot R_{\text{body}} \cdot \hat{t}$$
* **Booster Impulse ($\vec{v}_{\text{booster}}$):** Rocket booster normal to surface.

### 3.3 Gravitational Acceleration & Numerical Integration
* Gravitational acceleration in flight:
  $$\vec{a}(t) = \sum_{i} \frac{G \cdot M_i}{\left( |\vec{r}_i(t) - \vec{r}_{\text{rocket}}(t)|^2 + \epsilon^2 \right)^{3/2}} \left( \vec{r}_i(t) - \vec{r}_{\text{rocket}}(t) \right)$$
  Where $G = 1.0$ and softening parameter $\epsilon = 3.5$ prevents numerical singularities during close surface skimming.
* **Integrator:** Runge-Kutta 4th Order (`rk4Step`) at fixed 50Hz physics step (`dt = 0.02s`) for deterministic, drift-free orbital mechanics.

### 3.4 Predictive Trajectory & Rendezvous Visualization
* **Chrono Time Pips:** Rendered every 5 seconds along both the predicted flight path and the target's orbit, allowing players to visually compare flight timing against target travel.
* **Arrival Node Ghost:** Translucent hologram of the target rendered at the closest orbital approach point, featuring:
  - Target position at time $t_{\text{closest}}$.
  - Approach tether line connecting craft periapsis to target.
  - Telemetry badge indicating clamp capture status or required braking $\Delta v_{\text{rel}}$.
* **Encounter Ghosts:** Renders future planetary positions at close gravitational flyby points (`⚡ [BODY] FLYBY (T+XX.Xs)`).
* **Sub-Step Linear Interpolation:** Calculates exact waypoint capture timestamps without discrete stepping jitter.

### 3.5 Merged Capture & Target Braking
* Waypoint objects define `captureRadius` ($28\text{--}36\text{ AU}$) and `maxCaptureSpeed` ($16\text{--}24\text{ m/s}$).
* When inside the target's SOI, if $v_{\text{rel}} > v_{\text{limit}}$, thrusters automatically vector against $\vec{v}_{\text{rel}} = \vec{v}_{\text{craft}} - \vec{v}_{\text{target}}$.
* Holding `[SPACE]` or `[S]` burns RCS fuel to scrub relative velocity into capture range.

---

## 4. Campaign Level Structure & Solutions

### Chapter 1: Planetary & Moon Subsystems (Tier 3)
* **Level 1: Orbital Jump (Terra Subsystem)**
  * Anchor: Terra ($M = 12000$). Target: Station Alpha ($R = 110\text{ AU}$, $v = 0.095$).
  * Solution: $T = 6.5\text{s}$, Thrust $32\text{ m/s}$, Flight $3.7\text{s}$, Rel Speed $16.6\text{ m/s}$.
* **Level 2: The Moon Bridge (Terra & Luna Subsystem)**
  * Anchor: Terra ($M = 12000$) + Luna ($M = 2200$). Target: High Orbital Gate ($R = 240\text{ AU}$).
  * Solution: $T = 3.0\text{s}$, Thrust $32\text{ m/s}$, Flight $68.5\text{s}$, Rel Speed $17.5\text{ m/s}$.
* **Level 3: Jovian Resonance (Zeus & Io Subsystem)**
  * Anchor: Zeus ($M = 24000$) + Io ($M = 1600$, Launch Site). Target: Jovian Outpost ($R = 200\text{ AU}$).
  * Solution: $T = 16.0\text{s}$, Thrust $14\text{ m/s}$, Flight $6.6\text{s}$, Rel Speed $14.7\text{ m/s}$.
* **Level 4: Cronus Ring Run (Cronus & Titan Subsystem)**
  * Anchor: Cronus ($M = 20000$, Rings) + Titan ($M = 1800$, Launch Site). Target: Ring Station ($R = 110\text{ AU}$).
  * Solution: $T = 25.0\text{s}$, Thrust $24\text{ m/s}$, Flight $5.8\text{s}$, Rel Speed $11.1\text{ m/s}$.

### Chapter 2: Interplanetary Solar Systems (Tier 2)
* **Level 5: Inner Solar Leap (Sol & Astra)**
  * Anchor: Star Sol ($M = 38000$) + Astra ($M = 4600$). Target: Deep Space Beacon ($R = 340\text{ AU}$).
  * Solution: $T = 18.0\text{s}$, Thrust $26\text{ m/s}$, Flight $16.8\text{s}$, Rel Speed $15.0\text{ m/s}$.
* **Level 6: Martian Slingshot (Sol, Terra & Ares)**
  * Anchor: Sol ($M = 42000$) + Terra + Ares. Target: Asteroid Belt Spaceport ($R = 470\text{ AU}$).
  * Solution: $T = 52.0\text{s}$, Thrust $26\text{ m/s}$, Flight $14.7\text{s}$, Rel Speed $14.6\text{ m/s}$ (close flyby of Ares at $39.6\text{ AU}$, deep inside $122.4\text{ AU}$ SOI).
* **Level 7: Retrograde Vortex (Sol, Terra & Aphrodite Retrograde)**
  * Anchor: Sol ($M = 40000$) + Terra + Aphrodite ($\omega_{\text{rot}} = -0.15$). Target: Heliostation ($R = 155\text{ AU}$).
  * Solution: $T = 23.5\text{s}$, Thrust $22\text{ m/s}$, Flight $44.8\text{s}$, Rel Speed $9.6\text{ m/s}$.
* **Level 8: Jovian Catapult (Sol, Terra & Zeus)**
  * Anchor: Sol ($M = 44000$) + Terra + Zeus ($M = 25000$). Target: Kuiper Gate ($R = 680\text{ AU}$).
  * Solution: $T = 20.5\text{s}$, Thrust $24\text{ m/s}$, Flight $72.2\text{s}$, Rel Speed $13.9\text{ m/s}$.

### Chapter 3: Master Class Multi-Body Systems
* **Level 9: Triple Assist (Sol, Terra, Ares & Zeus)**
  * Anchor: Sol ($M = 46000$) + Terra + Ares + Zeus. Target: Frontier Array ($R = 600\text{ AU}$).
  * Solution: $T = 21.0\text{s}$, Thrust $30\text{ m/s}$, Flight $57.8\text{s}$, Rel Speed $14.3\text{ m/s}$ (chained flybys past Ares at $54\text{ AU}$ and Zeus at $156\text{ AU}$).
* **Level 10: Grand Jovian Tour (Sol-to-Zeus Insertion)**
  * Anchor: Sol ($M = 46000$) + Terra + Ares + Zeus. Target: Zeus Orbit Station ($R = 62\text{ AU}$ around Zeus).
  * Solution: $T = 20.0\text{s}$, Thrust $24\text{ m/s}$, Flight $32.2\text{s}$, Rel Speed $6.3\text{ m/s}$.

### Sandbox Mode (Level 0)
* Full 8-planet Solar System with gas giants and 8 orbiting moons.
* Right-click anywhere on the map to place custom waypoints.
* Verified Solution: $T = 2.2\text{s}$, Thrust $27\text{ m/s}$ ($12.8\text{s}$ flight to Europa at Jupiter, Rel Speed $17.7\text{ m/s}$).

---

## 5. UI & Technical Architecture

```
Orbital Puzzle/
├── index.html          # Web UI layout & modular script bootstrapping
├── style.css           # Glassmorphism cybernetic UI styling
├── serve.py            # Local Python dev server (supports target page argument)
├── README.md           # Documentation, quick start, verified solution table
├── SPEC.md             # This design & technical specification
├── galactic_demo.html   # Tier 1 Galactic Sector distribution prototype
├── continuum_demo.html  # Multi-Scale Cosmic Continuum prototype (Galactic -> Solar -> Moon)
└── src/
    ├── celestial.js     # CelestialBody class (orbits, rotation, gravity, rings)
    ├── game.js          # GameEngine loop, inputs, adaptive zoom, HUD sync
    ├── levels.js        # 10 verified campaign levels + Sandbox builder
    ├── physics.js       # RK4 integrator, ghost detection, time pips, sub-step interpolation
    ├── rocket.js        # Rocket state machine, continuous RCS, target braking physics
    ├── sound.js         # Procedural Web Audio API engine rumble & chord chimes
    ├── vector.js        # 2D Vector math library
    ├── waypoint.js      # Target waypoint class with SOI and relative velocity checks
    ├── galactic/        # Tier 1 Galactic Sector modules (distribution, renderer, sector generator)
    └── continuum/       # Cosmic Continuum modules (director, scenes, scale transitions)

---

## 6. Development & Autonomous Execution Protocol
* **Autonomous Server Launching:** Whenever writing, testing, or demonstrating code, prototypes, or side demos, the AI pair programmer **MUST always automatically launch the local development server** (`python serve.py [target]`) in the background. The user should never have to manually run terminal commands to start web servers.
* **Direct Clickable URLs:** Responses must always provide direct, clickable markdown links (e.g. `http://localhost:8000/continuum_demo.html`, `http://localhost:8000/galactic_demo.html`, or `http://localhost:8000/`) so the user can immediately jump into the live application with one click.

---

## 7. Cosmic Continuum Multi-Scale Architecture (Demo Mode)
* **Deterministic Sector & Orbits:** 65-star sector generated using Mulberry32 PRNG (seed `1042`) with analytical Keplerian orbits ($\theta(t) = \theta_0 + \omega t$).
* **Closed-Loop Proportional Navigation Guidance:**
  - **Stage 1 (Galactic):** Interstellar Guidance Controller (IGC) steers probe with lateral acceleration against Sagittarius Prime (SMBH mass 220,000) to reliably enter Sol Prime's SOI boundary ($R \le 135\text{ AU}$).
  - **Stage 2 (Solar):** Predictive Lead-Pursuit Mid-Course Correction (MCC) guides probe to Terra's future orbital position ($t_{\text{go}} = d_{\text{terra}} / v_{\text{probe}}$) with periapsis speed regulation ($v \le 24\text{ m/s}$) to guarantee Terra SOI entry ($R \le 65\text{ AU}$).
  - **Stage 3 (Planetary):** Terminal approach steering towards Station Alpha + target-relative RCS braking inside capture radius to achieve clamp docking lock ($v_{\text{rel}} \le 18\text{ m/s}$).
  - **Stage 4 (Terminal Docking & Celebration):** Live orbital rendering loop continues post-docking with pulsating clamp rings, debrief statistics modal, and restart capability.
* **Focal-Centered Cross-Fade Transitions:**
  - Preserves exact relative entry angle $\theta_{\text{entry}} = \text{atan2}(y_{\text{probe}} - y_{\text{body}}, x_{\text{probe}} - x_{\text{body}})$ and velocity heading $\theta_{\text{vel}} = \text{atan2}(v_y, v_x)$ across scale transitions.
  - Anchors destination celestial bodies (Sol Prime ➔ Sol at $(w/2, h/2)$; Terra ➔ Terra at $(w/2, h/2)$) in screen center during cross-fades, eliminating coordinate collisions and duplicate offset drawings.
* **Continuous Subsystem Clocks:**
  - Dedicated clocks (`this.solarTime` and `this.planetaryTime`) advance continuously during transitions, preventing celestial orbits from regressing backwards in time.

---

## 8. Automated Regression Test Suite
* Zero-configuration automated test suite managed via `pytest` (`pytest.ini`):
  1. `tests/test_vector.py`: Vector2 primitives, linear interpolation (`lerp`), and angle conversions.
  2. `tests/test_celestial_eval.py`: Analytical Keplerian orbit positions and hierarchical parent-child transforms.
  3. `tests/test_galactic_generation.py`: Mulberry32 PRNG reproducibility and 65-star sector structure.
  4. `tests/test_continuum_transitions.py`: Entry angle conservation, predictive MCC guidance, and docking math.
  5. `tests/test_continuum_e2e_cdp.py`: Headless Chrome DevTools Protocol (CDP) live end-to-end browser test verifying zero console exceptions, 3-tier traversal, and docking completion.
* **Execution:** `python -m pytest` executes all 14 tests in $\approx 17\text{s}$ with 100% pass rate.

