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
  * Solution: $T = 20.5\text{s}$, Thrust $28\text{ m/s}$, Flight $28.9\text{s}$, Rel Speed $14.6\text{ m/s}$.
* **Level 7: Retrograde Vortex (Sol, Terra & Aphrodite Retrograde)**
  * Anchor: Sol ($M = 40000$) + Terra + Aphrodite ($\omega_{\text{rot}} = -0.15$). Target: Heliostation ($R = 155\text{ AU}$).
  * Solution: $T = 23.5\text{s}$, Thrust $22\text{ m/s}$, Flight $44.8\text{s}$, Rel Speed $9.6\text{ m/s}$.
* **Level 8: Jovian Catapult (Sol, Terra & Zeus)**
  * Anchor: Sol ($M = 44000$) + Terra + Zeus ($M = 25000$). Target: Kuiper Gate ($R = 680\text{ AU}$).
  * Solution: $T = 20.5\text{s}$, Thrust $24\text{ m/s}$, Flight $72.2\text{s}$, Rel Speed $13.9\text{ m/s}$.

### Chapter 3: Master Class Multi-Body Systems
* **Level 9: Triple Assist (Sol, Terra, Ares & Zeus)**
  * Anchor: Sol ($M = 46000$) + Terra + Ares + Zeus. Target: Frontier Array ($R = 660\text{ AU}$).
  * Solution: $T = 20.5\text{s}$, Thrust $30\text{ m/s}$, Flight $38.4\text{s}$, Rel Speed $17.2\text{ m/s}$.
* **Level 10: Grand Jovian Tour (Sol-to-Zeus Insertion)**
  * Anchor: Sol ($M = 46000$) + Terra + Ares + Zeus. Target: Zeus Orbit Station ($R = 62\text{ AU}$ around Zeus).
  * Solution: $T = 20.0\text{s}$, Thrust $24\text{ m/s}$, Flight $32.2\text{s}$, Rel Speed $6.3\text{ m/s}$.

### Sandbox Mode (Level 0)
* Full 8-planet Solar System with gas giants and 8 orbiting moons.
* Right-click anywhere on the map to place custom waypoints.
* Verified Solution: $T = 1.5\text{s}$, Thrust $28\text{ m/s}$ ($49.5\text{s}$ flight to Europa).

---

## 5. UI & Technical Architecture

```
Orbital Puzzle/
├── index.html          # Web UI layout & modular script bootstrapping
├── style.css           # Glassmorphism cybernetic UI styling
├── serve.py            # Local Python dev server
├── README.md           # Documentation, quick start, verified solution table
├── SPEC.md             # This design & technical specification
└── src/
    ├── celestial.js    # CelestialBody class (orbits, rotation, gravity, rings)
    ├── game.js         # GameEngine loop, inputs, adaptive zoom, HUD sync
    ├── levels.js       # 10 verified campaign levels + Sandbox builder
    ├── physics.js      # RK4 integrator, ghost detection, time pips, sub-step interpolation
    ├── rocket.js       # Rocket state machine, continuous RCS, target braking physics
    ├── sound.js        # Procedural Web Audio API engine rumble & chord chimes
    ├── vector.js       # 2D Vector math library
    └── waypoint.js     # Target waypoint class with SOI and relative velocity checks
```
