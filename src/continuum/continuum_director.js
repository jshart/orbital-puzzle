/**
 * Continuum Multi-Scale Demo - State Machine & Cosmic Scale Director
 * Fully integrated with 65-star GalacticSector (Central SMBH),
 * angle-preserving patched conics, and autonomous Mid-Course Guidance (MCC).
 */

import { Vector2 } from '../vector.js';
import { buildGalacticScene, buildSolarScene, buildPlanetaryScene } from './continuum_scenes.js';

export const STAGES = {
  STAGE_1_GALACTIC: 'STAGE_1_GALACTIC',
  TRANSITION_1_TO_SOLAR: 'TRANSITION_1_TO_SOLAR',
  STAGE_2_SOLAR: 'STAGE_2_SOLAR',
  TRANSITION_2_TO_PLANETARY: 'TRANSITION_2_TO_PLANETARY',
  STAGE_3_PLANETARY: 'STAGE_3_PLANETARY',
  STAGE_4_COMPLETE: 'STAGE_4_COMPLETE'
};

export class ContinuumDirector {
  constructor() {
    this.stage = STAGES.STAGE_1_GALACTIC;
    this.stageTime = 0;
    this.totalTime = 0;
    this.isPaused = false;
    this.timeScale = 1.0;

    // Camera State
    this.camera = {
      x: 0,
      y: 0,
      zoom: 0.25,
      targetX: 0,
      targetY: 0,
      targetZoom: 0.25
    };

    // Transition State
    this.transitionProgress = 0;
    this.transitionDuration = 2.0;

    // Probe Physics State
    this.probe = {
      pos: new Vector2(0, 0),
      vel: new Vector2(0, 0),
      heading: 0,
      activeTrim: null, // 'MCC' | 'BRAKE' | null
      burnDirection: new Vector2(0, 0),
      isDocked: false
    };
    this.trail = [];
    this.particles = [];

    // Telemetry & Stats
    this.stats = {
      currentSpeed: 0,
      targetDist: 0,
      activeGravityWell: 'Sagittarius Prime (SMBH)',
      gravityPull: 0,
      guidanceStatus: 'COASTING',
      transitTimes: { t1: 0, t2: 0, t3: 0 }
    };

    // Active Scenes
    this.galacticScene = null;
    this.solarScene = null;
    this.planetaryScene = null;

    // Callbacks
    this.onStageChanged = null;
    this.onMissionComplete = null;

    this.reset();
  }

  reset() {
    this.stage = STAGES.STAGE_1_GALACTIC;
    this.stageTime = 0;
    this.totalTime = 0;
    this.isPaused = false;
    this.transitionProgress = 0;
    this.trail = [];
    this.particles = [];
    this.stats.transitTimes = { t1: 0, t2: 0, t3: 0 };
    this.stats.guidanceStatus = 'COASTING';

    // Build Scenes
    this.galacticScene = buildGalacticScene();
    this.solarScene = null;
    this.planetaryScene = null;

    // Initialize Probe for Stage 1
    this.probe.pos.copy(this.galacticScene.probeStartPos);
    this.probe.vel.copy(this.galacticScene.probeStartVel);
    this.probe.heading = this.probe.vel.angle();
    this.probe.activeTrim = null;
    this.probe.isDocked = false;

    // Camera starts centered on the central Supermassive Black Hole at (0, 0)
    // with wide field of view showing the entire 65-star galaxy!
    this.camera.x = 0;
    this.camera.y = 0;
    this.camera.zoom = 0.24;
    this.camera.targetX = 0;
    this.camera.targetY = 0;
    this.camera.targetZoom = 0.24;

    if (this.onStageChanged) {
      this.onStageChanged(this.stage, this.galacticScene);
    }
  }

  update(dt) {
    if (this.isPaused) return;

    const scaledDt = dt * this.timeScale;
    this.stageTime += scaledDt;
    this.totalTime += scaledDt;

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.pos.add(Vector2.scale(p.vel, scaledDt));
      p.life -= scaledDt * 2.2;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Camera smooth exponential follow / zoom
    const lerpRate = Math.min(1.0, scaledDt * 3.5);
    this.camera.x += (this.camera.targetX - this.camera.x) * lerpRate;
    this.camera.y += (this.camera.targetY - this.camera.y) * lerpRate;
    this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * lerpRate;

    // State Machine Dispatch
    switch (this.stage) {
      case STAGES.STAGE_1_GALACTIC:
        this.updateGalacticStage(scaledDt);
        break;
      case STAGES.TRANSITION_1_TO_SOLAR:
        this.updateTransition1(scaledDt);
        break;
      case STAGES.STAGE_2_SOLAR:
        this.updateSolarStage(scaledDt);
        break;
      case STAGES.TRANSITION_2_TO_PLANETARY:
        this.updateTransition2(scaledDt);
        break;
      case STAGES.STAGE_3_PLANETARY:
        this.updatePlanetaryStage(scaledDt);
        break;
    }

    this.stats.currentSpeed = this.probe.vel.mag();
  }

  // -------------------------------------------------------------
  // STAGE 1: FULL GALACTIC SECTOR
  // -------------------------------------------------------------
  updateGalacticStage(dt) {
    const scene = this.galacticScene;
    const sector = scene.sector;
    const G = 1.0;
    const eps = 8.0;

    // Evaluate galactic orbits (stars and barycenters move continuously)
    sector.evaluateAtTime(this.totalTime);

    // Dynamic Camera Tracking:
    // Stays centered on the majestic central Supermassive Black Hole (Sagittarius Prime) at (0, 0)
    // with wide field-of-view displaying all 65 systems.
    // As probe approaches Sol Prime (dTarget < 340 AU), smoothly pan and zoom into target system.
    const targetStar = scene.targetStar;
    const dTarget = this.probe.pos.dist(targetStar.position);
    this.stats.targetDist = dTarget;

    if (dTarget > 340) {
      this.camera.targetX = 0;
      this.camera.targetY = 0;
      this.camera.targetZoom = 0.22;
    } else {
      const approachFrac = Math.max(0, Math.min(1.0, (340 - dTarget) / (340 - targetStar.soiRadius)));
      this.camera.targetX = targetStar.position.x * approachFrac;
      this.camera.targetY = targetStar.position.y * approachFrac;
      this.camera.targetZoom = 0.22 + approachFrac * 0.42;
    }

    // Compute net gravity from all 65 stars + Central Supermassive Black Hole
    const acc = new Vector2(0, 0);
    let maxPull = 0;
    let dominantName = 'Sagittarius Prime (SMBH)';

    for (const star of sector.stars) {
      const dx = star.position.x - this.probe.pos.x;
      const dy = star.position.y - this.probe.pos.y;
      const dSq = dx * dx + dy * dy;
      const dist = Math.sqrt(dSq);
      const denom = Math.pow(dSq + eps * eps, 1.5);
      const pull = (G * star.mass) / denom;
      acc.x += dx * pull;
      acc.y += dy * pull;

      const pullMag = pull * dist;
      if (pullMag > maxPull) {
        maxPull = pullMag;
        dominantName = star.name;
      }
    }

    this.stats.activeGravityWell = dominantName;
    this.stats.gravityPull = maxPull;

    // INTERSTELLAR GUIDANCE CONTROLLER (IGC)
    // Continuous proportional navigation steering toward Sol Prime against SMBH gravity
    const sdx = targetStar.position.x - this.probe.pos.x;
    const sdy = targetStar.position.y - this.probe.pos.y;
    const desiredHeading = Math.atan2(sdy, sdx);
    const curHeading = Math.atan2(this.probe.vel.y, this.probe.vel.x);
    let angleDiff = (desiredHeading - curHeading + Math.PI) % (Math.PI * 2) - Math.PI;

    const curSpeed = this.probe.vel.mag();
    let isBurningIGC = false;

    if (curSpeed > 0.1 && dTarget > targetStar.soiRadius) {
      if (Math.abs(angleDiff) > 0.02) {
        isBurningIGC = true;
        this.probe.activeTrim = 'MCC';
        this.stats.guidanceStatus = 'IGC-1: STEERING TO SOL PRIME';

        const burnAcc = Math.max(-22.0, Math.min(22.0, angleDiff * 32.0));
        const perpX = -this.probe.vel.y / curSpeed;
        const perpY = this.probe.vel.x / curSpeed;
        acc.x += perpX * burnAcc;
        acc.y += perpY * burnAcc;

        // Spawn visible cyan ion thruster particles streaming opposite burn direction
        const particleAngle = Math.atan2(perpY * burnAcc, perpX * burnAcc) + Math.PI;
        for (let i = 0; i < 3; i++) {
          this.particles.push({
            pos: this.probe.pos.clone(),
            vel: Vector2.fromAngle(particleAngle + (Math.random() - 0.5) * 0.5, Math.random() * 35 + 15),
            life: 0.8,
            color: '#38bdf8',
            size: Math.random() * 3 + 2
          });
        }
      }
    }

    if (!isBurningIGC) {
      this.probe.activeTrim = null;
      this.stats.guidanceStatus = 'COASTING ON INTERCEPT VECTOR';
    }

    // Physics Step
    this.probe.vel.add(Vector2.scale(acc, dt));
    this.probe.pos.add(Vector2.scale(this.probe.vel, dt));
    this.probe.heading = this.probe.vel.angle();

    this.recordTrail();

    // Trigger Transition 1 when entering Sol Prime's SOI
    if (dTarget <= targetStar.soiRadius) {
      this.stats.transitTimes.t1 = this.stageTime;
      this.triggerTransitionToSolar();
    }
  }

  triggerTransitionToSolar() {
    this.stage = STAGES.TRANSITION_1_TO_SOLAR;
    this.stageTime = 0;
    this.transitionProgress = 0;

    const targetStar = this.galacticScene.targetStar;

    // 1. Compute exact relative position and entry angle
    const relX = this.probe.pos.x - targetStar.position.x;
    const relY = this.probe.pos.y - targetStar.position.y;
    const incomingAngle = Math.atan2(relY, relX);

    // 2. Compute exact velocity heading angle
    const headingAngle = Math.atan2(this.probe.vel.y, this.probe.vel.x);

    // 3. Build Solar Scene with angle and heading preservation (scaled to 20 m/s transfer speed)
    this.solarScene = buildSolarScene(incomingAngle, headingAngle, 20.0);

    // Center camera on Sol in Solar frame
    this.camera.targetX = 0;
    this.camera.targetY = 0;
    this.camera.targetZoom = this.solarScene.defaultZoom;

    if (this.onStageChanged) {
      this.onStageChanged(this.stage, this.solarScene);
    }
  }

  updateTransition1(dt) {
    this.transitionProgress += dt / this.transitionDuration;

    if (this.transitionProgress >= 1.0) {
      this.stage = STAGES.STAGE_2_SOLAR;
      this.stageTime = 0;
      this.trail = [];

      // Spawn probe in Solar frame with exact preserved entry angle and heading!
      this.probe.pos.copy(this.solarScene.probeStartPos);
      this.probe.vel.copy(this.solarScene.probeStartVel);
      this.probe.heading = this.probe.vel.angle();

      // Recenter camera on Sol
      this.camera.x = 0;
      this.camera.y = 0;
      this.camera.zoom = this.solarScene.defaultZoom;
      this.camera.targetX = 0;
      this.camera.targetY = 0;
      this.camera.targetZoom = this.solarScene.defaultZoom;

      if (this.onStageChanged) {
        this.onStageChanged(this.stage, this.solarScene);
      }
    }
  }

  // -------------------------------------------------------------
  // STAGE 2: SOLAR SYSTEM WITH AUTONOMOUS MID-COURSE GUIDANCE (MCC)
  // -------------------------------------------------------------
  updateSolarStage(dt) {
    const scene = this.solarScene;
    const t = this.stageTime;
    const G = 1.0;
    const eps = 4.0;

    // Evaluate moving planetary orbits
    for (const body of scene.bodies) {
      body.evaluateAtTime(t);
    }

    const terraPos = scene.targetPlanet.getPositionAtTime(t);

    // Camera tracks mid-point between probe and target planet Terra
    this.camera.targetX = this.probe.pos.x * 0.45 + terraPos.x * 0.55;
    this.camera.targetY = this.probe.pos.y * 0.45 + terraPos.y * 0.55;
    this.camera.targetZoom = scene.defaultZoom;

    // 1. Natural Gravity from Sol and all planets
    const acc = new Vector2(0, 0);
    let maxPull = 0;
    let dominantName = 'Sun (Sol)';

    for (const body of scene.bodies) {
      const bPos = body.getPositionAtTime(t);
      const dx = bPos.x - this.probe.pos.x;
      const dy = bPos.y - this.probe.pos.y;
      const dSq = dx * dx + dy * dy;
      const dist = Math.sqrt(dSq);
      const denom = Math.pow(dSq + eps * eps, 1.5);
      const pull = (G * body.mass) / denom;
      acc.x += dx * pull;
      acc.y += dy * pull;

      const pullMag = pull * dist;
      if (pullMag > maxPull) {
        maxPull = pullMag;
        dominantName = body.name;
      }
    }

    this.stats.activeGravityWell = dominantName;
    this.stats.gravityPull = maxPull;

    // Distance to Terra
    const dTerra = this.probe.pos.dist(terraPos);
    this.stats.targetDist = dTerra;

    // 2. AUTONOMOUS MID-COURSE CORRECTION (MCC) GUIDANCE CONTROLLER
    // Predictive Lead-Pursuit Intercept + Speed Management
    let isBurningMCC = false;

    if (dTerra > scene.targetPlanet.soiRadius) {
      const curSpeed = this.probe.vel.mag();
      if (curSpeed > 0.1) {
        // 1. Calculate time-to-go and predict Terra's future orbital position
        const tGo = Math.min(15.0, dTerra / Math.max(14.0, curSpeed));
        const predTerraPos = scene.targetPlanet.getPositionAtTime(t + tGo);

        const dx = predTerraPos.x - this.probe.pos.x;
        const dy = predTerraPos.y - this.probe.pos.y;
        const desiredHeading = Math.atan2(dy, dx);
        const currentHeading = Math.atan2(this.probe.vel.y, this.probe.vel.x);
        let angleDiff = (desiredHeading - currentHeading + Math.PI) % (Math.PI * 2) - Math.PI;

        if (Math.abs(angleDiff) > 0.02) {
          isBurningMCC = true;
          this.probe.activeTrim = 'MCC';
          this.stats.guidanceStatus = 'MCC-1: SHAPING TERRA INTERCEPT';

          // Corrective lateral burn perpendicular to current velocity
          const burnAcc = Math.max(-20.0, Math.min(20.0, angleDiff * 30.0));
          const perpX = -this.probe.vel.y / curSpeed;
          const perpY = this.probe.vel.x / curSpeed;
          acc.x += perpX * burnAcc;
          acc.y += perpY * burnAcc;

          // Spawn visible cyan ion thruster particles
          const particleAngle = Math.atan2(perpY * burnAcc, perpX * burnAcc) + Math.PI;
          for (let i = 0; i < 3; i++) {
            this.particles.push({
              pos: this.probe.pos.clone(),
              vel: Vector2.fromAngle(particleAngle + (Math.random() - 0.5) * 0.5, Math.random() * 35 + 15),
              life: 0.8,
              color: '#38bdf8',
              size: Math.random() * 3 + 2
            });
          }
        }

        // 2. Speed Management: Brake if falling too fast towards periapsis to keep turn radius tight
        if (curSpeed > 24.0) {
          const brake = Math.min(16.0, (curSpeed - 22.0) * 4.0);
          acc.x -= (this.probe.vel.x / curSpeed) * brake;
          acc.y -= (this.probe.vel.y / curSpeed) * brake;
        }
      }
    }

    if (!isBurningMCC) {
      this.probe.activeTrim = null;
      this.stats.guidanceStatus = 'COASTING ON INTERCEPT CORRIDOR';
    }

    // Physics Step
    this.probe.vel.add(Vector2.scale(acc, dt));
    this.probe.pos.add(Vector2.scale(this.probe.vel, dt));
    this.probe.heading = this.probe.vel.angle();

    this.recordTrail();

    // Check SOI breach into Terra -> Trigger Transition 2!
    if (dTerra <= scene.targetPlanet.soiRadius) {
      this.stats.transitTimes.t2 = this.stageTime;
      this.triggerTransitionToPlanetary();
    }
  }

  triggerTransitionToPlanetary() {
    this.stage = STAGES.TRANSITION_2_TO_PLANETARY;
    this.stageTime = 0;
    this.transitionProgress = 0;

    const terra = this.solarScene.targetPlanet;
    const terraPos = terra.getPositionAtTime(this.stageTime);

    // Compute exact arrival angle and velocity heading relative to Terra
    const relX = this.probe.pos.x - terraPos.x;
    const relY = this.probe.pos.y - terraPos.y;
    const incomingAngle = Math.atan2(relY, relX);

    // Velocity relative to Terra's orbital motion
    const terraVel = terra.getVelocityAtTime(this.stageTime);
    const relVelX = this.probe.vel.x - terraVel.x;
    const relVelY = this.probe.vel.y - terraVel.y;
    const headingAngle = Math.atan2(relVelY, relVelX);

    // Build Planetary Scene (normalized to 18.0 m/s planetary capture entry speed)
    this.planetaryScene = buildPlanetaryScene(incomingAngle, headingAngle, 18.0);

    // Camera targets Terra at origin in Planetary frame
    this.camera.targetX = 0;
    this.camera.targetY = 0;
    this.camera.targetZoom = this.planetaryScene.defaultZoom;

    if (this.onStageChanged) {
      this.onStageChanged(this.stage, this.planetaryScene);
    }
  }

  updateTransition2(dt) {
    this.transitionProgress += dt / this.transitionDuration;

    if (this.transitionProgress >= 1.0) {
      this.stage = STAGES.STAGE_3_PLANETARY;
      this.stageTime = 0;
      this.trail = [];

      // Spawn probe in Terra coordinate system with exact relative angles
      this.probe.pos.copy(this.planetaryScene.probeStartPos);
      this.probe.vel.copy(this.planetaryScene.probeStartVel);
      this.probe.heading = this.probe.vel.angle();

      // Center camera on Terra
      this.camera.x = 0;
      this.camera.y = 0;
      this.camera.zoom = this.planetaryScene.defaultZoom;
      this.camera.targetX = 0;
      this.camera.targetY = 0;
      this.camera.targetZoom = this.planetaryScene.defaultZoom;

      if (this.onStageChanged) {
        this.onStageChanged(this.stage, this.planetaryScene);
      }
    }
  }

  // -------------------------------------------------------------
  // STAGE 3: PLANETARY & MOON SUBSYSTEM (TERMINAL DOCKING)
  // -------------------------------------------------------------
  updatePlanetaryStage(dt) {
    const scene = this.planetaryScene;
    const t = this.stageTime;
    const G = 1.0;
    const eps = 3.5;

    // Evaluate bodies & Station Alpha waypoint
    for (const body of scene.bodies) {
      body.evaluateAtTime(t);
    }
    scene.targetWaypoint.evaluateAtTime(t);

    const wpPos = scene.targetWaypoint.getPositionAtTime(t);

    // Camera tracks mid-point between probe and Station Alpha
    this.camera.targetX = this.probe.pos.x * 0.45 + wpPos.x * 0.55;
    this.camera.targetY = this.probe.pos.y * 0.45 + wpPos.y * 0.55;
    this.camera.targetZoom = scene.defaultZoom;

    // Gravity from Terra and Luna
    const acc = new Vector2(0, 0);
    let maxPull = 0;
    let dominantName = 'Terra';

    for (const body of scene.bodies) {
      const bPos = body.getPositionAtTime(t);
      const dx = bPos.x - this.probe.pos.x;
      const dy = bPos.y - this.probe.pos.y;
      const dSq = dx * dx + dy * dy;
      const dist = Math.sqrt(dSq);
      const denom = Math.pow(dSq + eps * eps, 1.5);
      const pull = (G * body.mass) / denom;
      acc.x += dx * pull;
      acc.y += dy * pull;

      const pullMag = pull * dist;
      if (pullMag > maxPull) {
        maxPull = pullMag;
        dominantName = body.name;
      }
    }

    this.stats.activeGravityWell = dominantName;
    this.stats.gravityPull = maxPull;

    // Check Station Alpha SOI proximity
    const dWaypoint = this.probe.pos.dist(wpPos);
    this.stats.targetDist = dWaypoint;

    // STAGE 3 GUIDANCE: APPROACH GUIDANCE + TERMINAL RCS BRAKING
    if (dWaypoint > scene.targetWaypoint.captureRadius * 1.35) {
      // Approach Guidance: steer toward Station Alpha
      const dx = wpPos.x - this.probe.pos.x;
      const dy = wpPos.y - this.probe.pos.y;
      const desiredHeading = Math.atan2(dy, dx);
      const currentHeading = Math.atan2(this.probe.vel.y, this.probe.vel.x);
      let angleDiff = (desiredHeading - currentHeading + Math.PI) % (Math.PI * 2) - Math.PI;
      const curSpeed = this.probe.vel.mag();

      if (curSpeed > 0.1 && Math.abs(angleDiff) > 0.02) {
        this.probe.activeTrim = 'MCC';
        this.stats.guidanceStatus = 'APPROACH GUIDANCE: INTERCEPTING STATION ALPHA';
        const burnAcc = Math.max(-16.0, Math.min(16.0, angleDiff * 24.0));
        const perpX = -this.probe.vel.y / curSpeed;
        const perpY = this.probe.vel.x / curSpeed;
        acc.x += perpX * burnAcc;
        acc.y += perpY * burnAcc;

        for (let i = 0; i < 2; i++) {
          this.particles.push({
            pos: this.probe.pos.clone(),
            vel: Vector2.fromAngle(this.probe.heading + Math.PI + (Math.random() - 0.5) * 0.5, Math.random() * 25 + 10),
            life: 0.6,
            color: '#38bdf8',
            size: Math.random() * 2.5 + 1.5
          });
        }
      } else {
        this.probe.activeTrim = null;
        this.stats.guidanceStatus = 'ORBITAL DESCENT TO STATION ALPHA';
      }
    } else {
      // Terminal RCS Velocity Matching Braking inside capture corridor
      const relVel = scene.targetWaypoint.getRelativeVelocity(this.probe.vel, t);
      const relSpeed = relVel.mag();

      if (relSpeed > (scene.targetWaypoint.maxCaptureSpeed - 3.0)) {
        this.probe.activeTrim = 'BRAKE';
        this.stats.guidanceStatus = 'TERMINAL BRAKING: MATCHING STATION VELOCITY';
        const brakeAcc = 22.0; // m/s^2 continuous RCS burn
        const relUnit = relVel.clone().normalize();
        this.probe.vel.sub(Vector2.scale(relUnit, brakeAcc * dt));

        // Spawn reverse exhaust particles
        const particleAngle = relUnit.angle();
        for (let i = 0; i < 3; i++) {
          this.particles.push({
            pos: this.probe.pos.clone(),
            vel: Vector2.fromAngle(particleAngle + (Math.random() - 0.5) * 0.6, Math.random() * 35 + 15),
            life: 0.8,
            color: '#f59e0b', // Amber braking thrusters
            size: Math.random() * 3 + 2
          });
        }
      } else {
        this.probe.activeTrim = null;
        this.stats.guidanceStatus = 'CAPTURE WINDOW ATTAINED';
      }

      // Check Docking / Clamp Lock
      if (dWaypoint <= scene.targetWaypoint.captureRadius && relSpeed <= scene.targetWaypoint.maxCaptureSpeed) {
        this.probe.isDocked = true;
        this.probe.activeTrim = null;
        scene.targetWaypoint.isCaptured = true;
        this.stage = STAGES.STAGE_4_COMPLETE;
        this.stats.guidanceStatus = '★ DOCKED TO STATION ALPHA';
        this.stats.transitTimes.t3 = this.stageTime;
        this.isPaused = true;

        if (this.onMissionComplete) {
          this.onMissionComplete(this.stats);
        }
        return;
      }
    }

    // Physics Step
    this.probe.vel.add(Vector2.scale(acc, dt));
    this.probe.pos.add(Vector2.scale(this.probe.vel, dt));
    this.probe.heading = this.probe.vel.angle();

    this.recordTrail();
  }

  recordTrail() {
    if (this.trail.length === 0 || this.probe.pos.distSq(this.trail[this.trail.length - 1]) > 9) {
      this.trail.push(this.probe.pos.clone());
      if (this.trail.length > 320) this.trail.shift();
    }
  }
}
