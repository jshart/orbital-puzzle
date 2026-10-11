/**
 * Continuum Multi-Scale Demo - State Machine & Cosmic Scale Director
 * Governs the automated progression from Tier 1 Galactic Sector ->
 * Tier 2 Solar System -> Tier 3 Planetary System -> Station Docking.
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
      zoom: 0.38,
      targetX: 0,
      targetY: 0,
      targetZoom: 0.38
    };

    // Transition State
    this.transitionProgress = 0; // 0 to 1
    this.transitionDuration = 2.0; // seconds

    // Probe Physics State
    this.probe = {
      pos: new Vector2(0, 0),
      vel: new Vector2(0, 0),
      heading: 0,
      activeTrim: null, // 'BRAKE' | null
      isDocked: false
    };
    this.trail = [];
    this.particles = [];

    // Telemetry & Stats
    this.stats = {
      currentSpeed: 0,
      targetDist: 0,
      activeGravityWell: 'Interstellar Void',
      gravityPull: 0,
      assistsTriggered: 0,
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
    this.stats.assistsTriggered = 0;
    this.stats.transitTimes = { t1: 0, t2: 0, t3: 0 };

    // Build Scenes
    this.galacticScene = buildGalacticScene();
    this.solarScene = null; // Instantiated on transition
    this.planetaryScene = null; // Instantiated on transition

    // Initialize Probe for Stage 1
    this.probe.pos.copy(this.galacticScene.probeStartPos);
    this.probe.vel.copy(this.galacticScene.probeStartVel);
    this.probe.heading = this.probe.vel.angle();
    this.probe.activeTrim = null;
    this.probe.isDocked = false;

    // Camera starts centered between probe and target star
    this.camera.x = -200;
    this.camera.y = 400;
    this.camera.zoom = 0.38;
    this.camera.targetX = -200;
    this.camera.targetY = 400;
    this.camera.targetZoom = 0.38;

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
  // STAGE 1: GALACTIC SECTOR
  // -------------------------------------------------------------
  updateGalacticStage(dt) {
    const scene = this.galacticScene;
    const G = 1.0;
    const eps = 8.0;

    // Camera smoothly follows mid-point between probe and target star
    this.camera.targetX = this.probe.pos.x * 0.45 + scene.targetStar.position.x * 0.55;
    this.camera.targetY = this.probe.pos.y * 0.45 + scene.targetStar.position.y * 0.55;
    this.camera.targetZoom = 0.38;

    // Compute net gravity from all galactic stars
    const acc = new Vector2(0, 0);
    let maxPull = 0;
    let dominantName = 'Interstellar Void';

    for (const star of scene.stars) {
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

    // RK4 Physics Step
    this.probe.vel.add(Vector2.scale(acc, dt));
    this.probe.pos.add(Vector2.scale(this.probe.vel, dt));
    this.probe.heading = this.probe.vel.angle();

    this.recordTrail();

    // Distance to Sol Prime
    const dTarget = this.probe.pos.dist(scene.targetStar.position);
    this.stats.targetDist = dTarget;

    // Check SOI breach into Sol Prime -> Trigger Transition 1!
    if (dTarget <= scene.targetStar.soiRadius) {
      this.stats.transitTimes.t1 = this.stageTime;
      this.stats.assistsTriggered++;
      this.triggerTransitionToSolar();
    }
  }

  triggerTransitionToSolar() {
    this.stage = STAGES.TRANSITION_1_TO_SOLAR;
    this.stageTime = 0;
    this.transitionProgress = 0;

    // Calculate arrival entry angle relative to target star
    const relX = this.probe.pos.x - this.galacticScene.targetStar.position.x;
    const relY = this.probe.pos.y - this.galacticScene.targetStar.position.y;
    const incomingAngle = Math.atan2(relY, relX);

    // Build the Solar Scene
    this.solarScene = buildSolarScene(incomingAngle, 26.0);

    // Target Camera zooms in on Sol Prime
    this.camera.targetX = this.galacticScene.targetStar.position.x;
    this.camera.targetY = this.galacticScene.targetStar.position.y;
    this.camera.targetZoom = 0.95;

    if (this.onStageChanged) {
      this.onStageChanged(this.stage, this.solarScene);
    }
  }

  updateTransition1(dt) {
    this.transitionProgress += dt / this.transitionDuration;

    if (this.transitionProgress >= 1.0) {
      // Transition complete! Enter Solar System Stage
      this.stage = STAGES.STAGE_2_SOLAR;
      this.stageTime = 0;
      this.trail = [];

      // Spawn probe in Solar coordinate system
      this.probe.pos.copy(this.solarScene.probeStartPos);
      this.probe.vel.copy(this.solarScene.probeStartVel);
      this.probe.heading = this.probe.vel.angle();

      // Recenter camera on solar center
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
  // STAGE 2: SOLAR SYSTEM
  // -------------------------------------------------------------
  updateSolarStage(dt) {
    const scene = this.solarScene;
    const t = this.stageTime;
    const G = 1.0;
    const eps = 4.0;

    // Evaluate moving planetary positions
    for (const body of scene.bodies) {
      body.evaluateAtTime(t);
    }

    // Camera tracks mid-point between probe and target planet Terra
    const terraPos = scene.targetPlanet.getPositionAtTime(t);
    this.camera.targetX = this.probe.pos.x * 0.4 + terraPos.x * 0.6;
    this.camera.targetY = this.probe.pos.y * 0.4 + terraPos.y * 0.6;
    this.camera.targetZoom = scene.defaultZoom;

    // Compute gravity from Sol and all planets
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

    // Physics step
    this.probe.vel.add(Vector2.scale(acc, dt));
    this.probe.pos.add(Vector2.scale(this.probe.vel, dt));
    this.probe.heading = this.probe.vel.angle();

    this.recordTrail();

    // Distance to Terra
    const dTerra = this.probe.pos.dist(terraPos);
    this.stats.targetDist = dTerra;

    // Check SOI breach into Terra -> Trigger Transition 2!
    if (dTerra <= scene.targetPlanet.soiRadius) {
      this.stats.transitTimes.t2 = this.stageTime;
      this.stats.assistsTriggered++;
      this.triggerTransitionToPlanetary();
    }
  }

  triggerTransitionToPlanetary() {
    this.stage = STAGES.TRANSITION_2_TO_PLANETARY;
    this.stageTime = 0;
    this.transitionProgress = 0;

    const terraPos = this.solarScene.targetPlanet.getPositionAtTime(this.solarScene.targetPlanet.orbitAngle);
    const relX = this.probe.pos.x - terraPos.x;
    const relY = this.probe.pos.y - terraPos.y;
    const incomingAngle = Math.atan2(relY, relX);

    // Build Planetary Scene
    this.planetaryScene = buildPlanetaryScene(incomingAngle, 21.0);

    // Camera zooms into Terra
    this.camera.targetX = terraPos.x;
    this.camera.targetY = terraPos.y;
    this.camera.targetZoom = 1.35;

    if (this.onStageChanged) {
      this.onStageChanged(this.stage, this.planetaryScene);
    }
  }

  updateTransition2(dt) {
    this.transitionProgress += dt / this.transitionDuration;

    if (this.transitionProgress >= 1.0) {
      // Transition complete! Enter Planetary Subsystem Stage
      this.stage = STAGES.STAGE_3_PLANETARY;
      this.stageTime = 0;
      this.trail = [];

      // Spawn probe in Terra coordinate system
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
  // STAGE 3: PLANETARY & MOON SUBSYSTEM
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

    // Camera tracks mid-point between probe and Station Alpha
    const wpPos = scene.targetWaypoint.getPositionAtTime(t);
    this.camera.targetX = this.probe.pos.x * 0.4 + wpPos.x * 0.6;
    this.camera.targetY = this.probe.pos.y * 0.4 + wpPos.y * 0.6;
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

    // AUTOMATED TARGET-RELATIVE RCS BRAKING inside Station Alpha SOI!
    if (dWaypoint <= scene.targetWaypoint.captureRadius * 1.5) {
      const relVel = scene.targetWaypoint.getRelativeVelocity(this.probe.vel, t);
      const relSpeed = relVel.mag();

      if (relSpeed > (scene.targetWaypoint.maxCaptureSpeed - 2.0)) {
        this.probe.activeTrim = 'BRAKE';
        const brakeAcc = 18.0; // m/s^2 continuous RCS burn
        const relUnit = relVel.clone().normalize();
        this.probe.vel.sub(Vector2.scale(relUnit, brakeAcc * dt));

        // Spawn reverse exhaust particles
        const particleAngle = relUnit.angle();
        for (let i = 0; i < 3; i++) {
          this.particles.push({
            pos: this.probe.pos.clone(),
            vel: Vector2.fromAngle(particleAngle + (Math.random() - 0.5) * 0.6, Math.random() * 35 + 15),
            life: 0.8,
            color: '#f59e0b',
            size: Math.random() * 3 + 2
          });
        }
      } else {
        this.probe.activeTrim = null;
      }

      // Check Docking / Capture Lock
      if (dWaypoint <= scene.targetWaypoint.captureRadius && relSpeed <= scene.targetWaypoint.maxCaptureSpeed) {
        this.probe.isDocked = true;
        this.probe.activeTrim = null;
        scene.targetWaypoint.isCaptured = true;
        this.stage = STAGES.STAGE_4_COMPLETE;
        this.stats.transitTimes.t3 = this.stageTime;
        this.isPaused = true;

        if (this.onMissionComplete) {
          this.onMissionComplete(this.stats);
        }
        return;
      }
    } else {
      this.probe.activeTrim = null;
    }

    // Physics step
    this.probe.vel.add(Vector2.scale(acc, dt));
    this.probe.pos.add(Vector2.scale(this.probe.vel, dt));
    this.probe.heading = this.probe.vel.angle();

    this.recordTrail();
  }

  recordTrail() {
    if (this.trail.length === 0 || this.probe.pos.distSq(this.trail[this.trail.length - 1]) > 9) {
      this.trail.push(this.probe.pos.clone());
      if (this.trail.length > 280) this.trail.shift();
    }
  }
}
