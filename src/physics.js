import { Vector2 } from './vector.js';

export const G_CONST = 1.0;
export const SOFTENING_EPS = 3.5;

/**
 * Computes net gravitational acceleration at position `pos` at time `t`.
 */
export function computeGravitationalAcceleration(pos, t, bodies) {
  const acc = new Vector2(0, 0);

  for (const body of bodies) {
    const bodyPos = body.getPositionAtTime(t);
    const dx = bodyPos.x - pos.x;
    const dy = bodyPos.y - pos.y;
    const distSq = dx * dx + dy * dy;

    // Softened Newtonian gravity
    const denom = Math.pow(distSq + SOFTENING_EPS * SOFTENING_EPS, 1.5);
    const forceFactor = (G_CONST * body.mass) / denom;

    acc.x += dx * forceFactor;
    acc.y += dy * forceFactor;
  }

  return acc;
}

/**
 * Computes individual gravitational forces and percentage breakdown for all bodies.
 */
export function getGravityInfluenceBreakdown(pos, t, bodies) {
  let totalForce = 0;
  const list = [];

  for (const body of bodies) {
    const bodyPos = body.getPositionAtTime(t);
    const distSq = pos.distSq(bodyPos);
    const denom = Math.pow(distSq + SOFTENING_EPS * SOFTENING_EPS, 1.5);
    const force = (G_CONST * body.mass) / denom * Math.sqrt(distSq);

    totalForce += force;
    list.push({ body, force });
  }

  if (totalForce <= 0.000001) totalForce = 1;

  list.forEach(item => {
    item.percent = (item.force / totalForce) * 100;
  });

  list.sort((a, b) => b.force - a.force);
  return list;
}

/**
 * Integrates one RK4 physics step for the rocket.
 */
export function rk4Step(pos, vel, t, dt, bodies) {
  // k1
  const a1 = computeGravitationalAcceleration(pos, t, bodies);
  const k1_v = Vector2.scale(a1, dt);
  const k1_r = Vector2.scale(vel, dt);

  // k2
  const pos2 = Vector2.add(pos, Vector2.scale(k1_r, 0.5));
  const vel2 = Vector2.add(vel, Vector2.scale(k1_v, 0.5));
  const a2 = computeGravitationalAcceleration(pos2, t + 0.5 * dt, bodies);
  const k2_v = Vector2.scale(a2, dt);
  const k2_r = Vector2.scale(vel2, dt);

  // k3
  const pos3 = Vector2.add(pos, Vector2.scale(k2_r, 0.5));
  const vel3 = Vector2.add(vel, Vector2.scale(k2_v, 0.5));
  const a3 = computeGravitationalAcceleration(pos3, t + 0.5 * dt, bodies);
  const k3_v = Vector2.scale(a3, dt);
  const k3_r = Vector2.scale(vel3, dt);

  // k4
  const pos4 = Vector2.add(pos, k3_r);
  const vel4 = Vector2.add(vel, k3_v);
  const a4 = computeGravitationalAcceleration(pos4, t + dt, bodies);
  const k4_v = Vector2.scale(a4, dt);
  const k4_r = Vector2.scale(vel4, dt);

  // RK4 combination
  const dr = new Vector2(
    (k1_r.x + 2 * k2_r.x + 2 * k3_r.x + k4_r.x) / 6,
    (k1_r.y + 2 * k2_r.y + 2 * k3_r.y + k4_r.y) / 6
  );

  const dv = new Vector2(
    (k1_v.x + 2 * k2_v.x + 2 * k3_v.x + k4_v.x) / 6,
    (k1_v.y + 2 * k2_v.y + 2 * k3_v.y + k4_v.y) / 6
  );

  return {
    nextPos: Vector2.add(pos, dr),
    nextVel: Vector2.add(vel, dv)
  };
}

/**
 * Fast-forward trajectory predictor with Encounter Ghost detection.
 */
export function predictTrajectory(startPos, startVel, startTime, bodies, waypoint, options = {}) {
  const steps = options.steps || 750;
  const dt = options.dt || 0.08;
  const path = [];

  let curPos = startPos.clone();
  let curVel = startVel.clone();
  let curT = startTime;

  let collisionEvent = null;
  let waypointCaptured = false;
  let waypointHitPoint = null;
  let waypointHitTime = null;
  let minWaypointDist = Infinity;
  let minWaypointTime = startTime;

  // Track closest approaches (encounters) with non-star bodies
  const encounterTrackers = new Map();
  for (const body of bodies) {
    if (!body.isStar) {
      encounterTrackers.set(body.id, {
        body,
        minDist: Infinity,
        bestTime: 0,
        bestRocketPos: null,
        bestPlanetPos: null,
        inSOI: false
      });
    }
  }

  let minWaypointPos = null;
  let minWaypointRelSpeed = Infinity;
  let targetGhost = null;
  const timePips = [];
  const pipInterval = Math.max(1, Math.round(5.0 / dt));

  path.push({ pos: curPos.clone(), t: curT });

  for (let i = 0; i < steps; i++) {
    const { nextPos, nextVel } = rk4Step(curPos, curVel, curT, dt, bodies);
    curPos = nextPos;
    curVel = nextVel;
    curT += dt;

    path.push({ pos: curPos.clone(), t: curT });

    // Record Chrono Time Pips every 5s of flight
    if ((i + 1) % pipInterval === 0) {
      timePips.push({
        t: curT,
        elapsed: curT - startTime,
        pos: curPos.clone()
      });
    }

    // Track planetary encounters
    for (const body of bodies) {
      if (body.isStar) continue;
      const bPos = body.getPositionAtTime(curT);
      const d = curPos.dist(bPos);
      const tracker = encounterTrackers.get(body.id);

      if (d <= body.soiRadius) {
        tracker.inSOI = true;
        if (d < tracker.minDist) {
          tracker.minDist = d;
          tracker.bestTime = curT;
          tracker.bestRocketPos = curPos.clone();
          tracker.bestPlanetPos = bPos.clone();
        }
      }
    }

    // 1. Check Collision with any CelestialBody
    for (const body of bodies) {
      const bPos = body.getPositionAtTime(curT);
      const d = curPos.dist(bPos);
      if (d <= body.radius) {
        collisionEvent = {
          body,
          point: curPos.clone(),
          t: curT
        };
        break;
      }
    }
    if (collisionEvent) break;

    // 2. Check Waypoint Closest Approach & Capture
    if (waypoint) {
      const wpPos = waypoint.getPositionAtTime(curT);
      const d = curPos.dist(wpPos);
      if (d < minWaypointDist) {
        minWaypointDist = d;
        minWaypointTime = curT;
        minWaypointPos = curPos.clone();
        if (waypoint.getRelativeVelocity) {
          minWaypointRelSpeed = waypoint.getRelativeVelocity(curVel, curT).mag();
        }
      }

      if (!waypointCaptured && d <= waypoint.captureRadius) {
        const relSpeed = waypoint.getRelativeVelocity ? waypoint.getRelativeVelocity(curVel, curT).mag() : 0;
        const canCapture = !waypoint.maxCaptureSpeed || (relSpeed <= waypoint.maxCaptureSpeed);

        if (canCapture) {
          waypointCaptured = true;
          waypointHitPoint = curPos.clone();

          // Sub-step linear interpolation for smooth, rock-solid hit timestamp
          const prevEntry = path.length >= 2 ? path[path.length - 2] : null;
          if (prevEntry) {
            const prevWpPos = waypoint.getPositionAtTime(prevEntry.t);
            const prevD = prevEntry.pos.dist(prevWpPos);
            const denom = prevD - d;
            if (denom > 0.001) {
              const frac = Math.max(0, Math.min(1, (prevD - waypoint.captureRadius) / denom));
              waypointHitTime = prevEntry.t + frac * dt;
            } else {
              waypointHitTime = curT;
            }
          } else {
            waypointHitTime = curT;
          }
        }
      }
    }

    // 3. Out of bounds escape
    if (curPos.mag() > 2800) {
      break;
    }
  }

  // Compile target arrival ghost at closest approach
  if (waypoint && minWaypointTime !== null && minWaypointDist < 99999) {
    const ghostPos = waypoint.getPositionAtTime(minWaypointTime);
    targetGhost = {
      ghostPos,
      approachPos: minWaypointPos,
      time: minWaypointTime,
      distance: minWaypointDist,
      relSpeed: minWaypointRelSpeed,
      isCaptured: waypointCaptured,
      needsBrake: (minWaypointDist <= waypoint.captureRadius && minWaypointRelSpeed > (waypoint.maxCaptureSpeed || 16))
    };
  }

  // Compile valid encounters (inside SOI, with distance greater than collision)
  const encounters = [];
  for (const tracker of encounterTrackers.values()) {
    if (tracker.inSOI && tracker.minDist < Infinity && tracker.minDist > tracker.body.radius) {
      encounters.push({
        body: tracker.body,
        time: tracker.bestTime,
        rocketPos: tracker.bestRocketPos,
        planetPos: tracker.bestPlanetPos,
        minDist: tracker.minDist,
        altitude: tracker.minDist - tracker.body.radius
      });
    }
  }

  // Sort encounters chronologically
  encounters.sort((a, b) => a.time - b.time);

  return {
    path,
    collisionEvent,
    waypointCaptured,
    waypointHitPoint,
    waypointHitTime,
    minWaypointDist,
    minWaypointTime,
    minWaypointRelSpeed,
    targetGhost,
    timePips,
    encounters
  };
}
