# Orbital Puzzle // Flight Operations Manual & Instructions

Welcome to **Orbital Puzzle**, a deterministic 2D spaceflight mechanics simulation game. Your mission is to launch spacecraft from rotating planetary surfaces, exploit celestial orbital momentum, execute gravitational slingshots (flybys), and dock with target stations across the solar system.

---

## 1. Core Mission Objective

Every mission presents a system of celestial bodies (stars, planets, and moons) along with a target waypoint (station, gate, or beacon).

* **Success:** Enter the target waypoint's Sphere of Influence (SOI) at or below the maximum capture speed ($\Delta v_{\text{rel}} \le v_{\text{limit}}$).
* **Failure:** Surface collision with any celestial body, exhaustion of RCS fuel, or escaping into deep space.

> [!TIP]
> **Want a Demo? (Interactive Example Solutions)**  
> If you want to see how any mission is solved, look at the **FLIGHT ADVISORY** on the right side of the screen: click **SHOW HINT**, and then click **AUTO-DIAL SOLUTION ⚡**. This automatically dials in the mathematically verified launch window time and booster thrust. You can then click **LAUNCH ROCKET [L]** (or **▶ SWEEP**) to watch the flight simulation demo run!

---

## 2. The 3-Step Launch Sequence

### Step 1: Launch Window Timing (Scrubber)
* Celestial bodies rotate continuously on their axes. Surface launch pads inherit this rotational motion:
  $$\vec{v}_{\text{launch}} = \vec{v}_{\text{body\_orbit}} + \vec{v}_{\text{surface\_spin}} + \vec{v}_{\text{booster}}$$
* **Tangential Surface Boost:** A rotating planet acts as a natural catapult, adding free velocity in the direction of its spin.
* **Scrubber Operation:**
  * The launch scrubber defaults to a **paused** state on mission start.
  * **Manual Stepping:** Use the fine-step buttons `[◀]` / `[▶]` or keyboard keys `[A]` / `[D]` to step in $\pm 0.1\text{s}$ increments, or drag the scrubber bar directly to inspect your trajectory at any point in time.
  * **Automated Sweep:** Click `[▶ SWEEP]` or press `[SPACE]` while docked to run time forward automatically and watch your ejection angle sweep across space. Click `[❚❚ PAUSE]` or press `[SPACE]` again to freeze time at your desired corridor.

### Step 2: Booster Impulse Configuration
* Set your rocket booster thrust ($10$ to $65\text{ m/s}$) using the fine-step buttons `[▲]` / `[▼]` or the thrust dial.
* Higher thrust provides greater escape velocity from deep gravity wells, while calibrated lower thrust allows closer planetary flybys for gravitational assists.

### Step 3: Trajectory Analysis & Launch
* The cyan predictive trajectory displays your complete flight path ahead of time:
  * **Chrono Time Pips:** Synchronized $+5\text{s}, +10\text{s}, +15\text{s}$ markers appear along both your flight trajectory and the target's orbit, allowing you to visually verify whether you and the target will arrive at the intercept point at the same moment.
  * **Arrival Node Ghost:** A holographic projection of the target at closest approach reveals your rendezvous distance and relative speed ($\Delta v_{\text{rel}}$).
* When your trajectory aligns with the target, press **`LAUNCH ROCKET`** or `[L]`.

---

## 3. Rendezvous & Docking Mechanics

### Passive Clamp Capture
When your spacecraft enters the target waypoint's Sphere of Influence (SOI, pulsing green ring) with relative speed $\le$ capture threshold (typically $16$–$24\text{ m/s}$), docking clamps automatically engage and the mission is accomplished.

### Target-Relative Braking
If you arrive inside the target's SOI moving too fast ($\Delta v_{\text{rel}} > v_{\text{limit}}$):
* The waypoint ring glows amber and displays `BRAKE TO CAPTURE`.
* **Hold `[SPACE]` or `[S]`** inside the SOI to fire braking thrusters.
* The flight computer automatically vectors your thrusters directly opposing the relative drift vector ($\vec{v}_{\text{rel}} = \vec{v}_{\text{craft}} - \vec{v}_{\text{target}}$) until capture velocity is reached.

---

## 4. Mid-Course RCS Trim Thrusters

While in active flight, you can spend RCS fuel to fine-tune your trajectory:
* **Prograde Trim (`Hold [W] or [P]`):** Fires thrusters forward along your current velocity vector to speed up and expand your orbit.
* **Retrograde Trim (`Hold [S] or [O]`):** Fires thrusters backward against your current velocity vector to slow down and drop your orbit.

---

## 5. Controls Cheatsheet

| Key / Control | Function | Context |
| :--- | :--- | :--- |
| **`[L]`** | Launch Rocket | While Docked |
| **`[SPACE]`** | Toggle Scrub Sweep / Pause | While Docked |
| **`[SPACE]`** (Hold) | Target-Relative Braking Burn | Inside Target SOI |
| **`[SPACE]`** | Toggle Simulation Pause | During Flight |
| **`[◀]` / `[▶]`** or **`[A]` / `[D]`** | Step Launch Window ($\pm 0.1\text{s}$) | While Docked |
| **`[▲]` / `[▼]`** | Step Booster Thrust ($\pm 1\text{ m/s}$) | While Docked |
| **`[W]` / `[P]`** (Hold) | Prograde RCS Trim | In Flight |
| **`[S]` / `[O]`** (Hold) | Retrograde RCS Trim | In Flight |
| **`[R]`** | Reset Level to Launch Pad | Any Time |
| **`[Q]` / `[E]`** | Previous / Next Mission | Any Time |
| **`[H]`** | Open / Close Flight Manual (Pauses game) | Any Time |
| **`[ESC]`** | Close Overlays / Cancel Action | Any Time |
| **`[＋]` / `[－]`** | Precision Zoom In / Out | Camera Controls |
| **`[C]` / `CENTER`** | Recenter Camera View | Camera Controls |
| **Mouse Drag** | Pan Camera View | Any Time |
| **Mouse Wheel** | Zoom In / Out Smoothly | Any Time |
| **Right-Click** | Place Custom Target Gate | Sandbox Mode (Level 0) |

---

## 6. Accessing Instructions In-Game

You can reopen this manual at any time during gameplay by clicking the **`📖 MANUAL [H]`** button in the top navigation bar or pressing **`[H]`** on your keyboard. Opening the manual automatically pauses the simulation so you can review flight procedures safely.
