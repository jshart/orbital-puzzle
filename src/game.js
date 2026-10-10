import { Vector2 } from './vector.js';
import { Rocket } from './rocket.js';
import { Waypoint } from './waypoint.js';
import { rk4Step, predictTrajectory, getGravityInfluenceBreakdown } from './physics.js';
import { createLevels } from './levels.js';
import { SoundFX } from './sound.js';

export class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sound = new SoundFX();

    // Levels
    this.levels = createLevels();
    this.currentLevelIndex = 0; // Starts in Sandbox mode!
    this.currentLevel = null;

    // Simulation Time
    this.simTime = 0;
    this.timeScale = 1.0;
    this.isPaused = true; // Defaults to paused!
    this.fixedDt = 0.02; // 50hz physics step
    this.accumulator = 0;

    // Camera
    this.camera = {
      x: 0,
      y: 0,
      zoom: 0.6,
      isDragging: false,
      dragStart: { x: 0, y: 0 }
    };

    // Entities
    this.bodies = [];
    this.waypoint = null;
    this.rocket = new Rocket();

    // Aiming & Mid-course burn state
    this.isAimingBurn = false;
    this.burnDragVector = new Vector2(0, 0);
    this.showTrajectory = true;
    this.showOrbits = true;
    this.showGravityWells = true;
    this.isPlacingTarget = false;

    // Trajectory cache
    this.cachedPrediction = null;

    // Input handlers
    this.setupInputs();
    this.loadLevel(0); // Load Sandbox first

    // Auto resize
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  loadLevel(index) {
    this.currentLevelIndex = Math.max(0, Math.min(index, this.levels.length - 1));
    this.currentLevel = this.levels[this.currentLevelIndex];

    const levelData = this.currentLevel.build();
    this.bodies = levelData.bodies;
    this.waypoint = levelData.waypoint;
    this.simTime = 0;
    this.isPaused = true;
    this.isAimingBurn = false;
    this.targetHitTime = null;
    this.plannedTrajectory = null;

    // Setup Rocket
    this.rocket.maxBurns = levelData.maxBurns;
    this.rocket.maxFuel = levelData.maxFuel;
    this.rocket.launchThrust = levelData.defaultThrust;
    this.rocket.launchAngleOffset = levelData.defaultAngleOffset;
    this.rocket.reset(levelData.launchBody, levelData.launchAngle);

    // Initial camera zoom based on system size
    this.camera.x = 0;
    this.camera.y = 0;
    if (this.currentLevel.isSandbox) {
      this.camera.zoom = 0.52;
    } else if (this.currentLevelIndex <= 3) {
      this.camera.zoom = 0.88;
    } else if (this.currentLevelIndex <= 6) {
      this.camera.zoom = 0.75;
    } else {
      this.camera.zoom = 0.62;
    }
    this.updateZoomDisplay();

    this.updateHUD();
    this.computeTrajectory();

    if (this.onLevelLoaded) {
      this.onLevelLoaded(this.currentLevelIndex);
    }
  }

  setLaunchBody(bodyId) {
    const targetBody = this.bodies.find(b => b.id === bodyId);
    if (targetBody && !targetBody.isStar) {
      this.rocket.reset(targetBody, 0, this.simTime);
      this.computeTrajectory();
      this.updateHUD();
    }
  }

  setStaticWaypoint(worldPos) {
    this.waypoint = new Waypoint({
      id: 'custom-static-waypoint',
      name: 'Custom Target Gate',
      parent: null,
      position: worldPos.clone(),
      captureRadius: 26
    });
    this.computeTrajectory();
    this.updateHUD();
  }

  applyHint() {
    if (!this.currentLevel || !this.currentLevel.solution) return;
    const sol = this.currentLevel.solution;
    this.setScrubTime(sol.scrubTime);
    this.rocket.launchThrust = sol.thrust;

    const scrubInput = document.getElementById('input-scrub-time');
    const scrubLabel = document.getElementById('label-scrub-time');
    if (scrubInput && scrubLabel) {
      scrubInput.value = sol.scrubTime;
      scrubLabel.innerText = `T+${sol.scrubTime.toFixed(1)}s (AIM)`;
    }
    const thrustInput = document.getElementById('input-thrust');
    const thrustLabel = document.getElementById('label-thrust');
    if (thrustInput && thrustLabel) {
      thrustInput.value = sol.thrust;
      thrustLabel.innerText = `${sol.thrust} m/s`;
    }

    this.computeTrajectory();
    this.updateHUD();
  }

  resetCurrentLevel() {
    this.loadLevel(this.currentLevelIndex);
  }

  nextLevel() {
    const nextIdx = (this.currentLevelIndex + 1) % this.levels.length;
    this.loadLevel(nextIdx);
  }

  prevLevel() {
    const prevIdx = (this.currentLevelIndex - 1 + this.levels.length) % this.levels.length;
    this.loadLevel(prevIdx);
  }

  // -------------------------------------------------------------
  // SIMULATION & PHYSICS
  // -------------------------------------------------------------
  update(dt) {
    if (this.isPaused || this.timeScale === 0) return;

    // Safety clamp dt to 0.05s max (prevents death spiral on frame drops)
    const clampedDt = Math.min(dt, 0.05);
    const scaledDt = clampedDt * this.timeScale;
    this.accumulator += scaledDt;

    let subSteps = 0;
    while (this.accumulator >= this.fixedDt && subSteps < 5) {
      this.fixedStep(this.fixedDt);
      this.accumulator -= this.fixedDt;
      subSteps++;
    }
    if (subSteps >= 5) {
      this.accumulator = 0; // Drop excess accumulated time to guarantee smooth 60fps
    }

    // Throttle live trajectory recalculation during active flight
    if (this.rocket.state === 'FLYING') {
      if (this.rocket.activeTrim) {
        this.computeTrajectory();
      } else {
        this.trajectoryUpdateCounter = (this.trajectoryUpdateCounter || 0) + 1;
        if (this.trajectoryUpdateCounter >= 15) {
          this.trajectoryUpdateCounter = 0;
          this.computeTrajectory();
        }
      }
    }

    // Update HUD once per frame (outside the physics loop)
    this.updateHUD();
  }

  fixedStep(dt) {
    // 1. Advance physics for flying rocket before advancing celestial bodies
    if (this.rocket.state === 'FLYING') {
      const { nextPos, nextVel } = rk4Step(
        this.rocket.pos,
        this.rocket.vel,
        this.simTime,
        dt,
        this.bodies
      );
      this.rocket.pos = nextPos;
      this.rocket.vel = nextVel;
      this.rocket.update(dt, this.simTime);
    }

    this.simTime += dt;
    if (this.rocket.state === 'DOCKED' && this.simTime >= 90.0) {
      this.simTime = this.simTime % 90.0;
    }

    // 2. Update Celestial Bodies along deterministic rails
    for (const body of this.bodies) {
      body.evaluateAtTime(this.simTime);
    }

    // 3. Update Waypoint
    if (this.waypoint) {
      this.waypoint.evaluateAtTime(this.simTime);
    }

    // 4. Collision & Win Checks for Flying Rocket
    if (this.rocket.state === 'FLYING') {
      // Check Collision with Celestial Bodies
      for (const body of this.bodies) {
        // Clean surface departure grace period
        if (body === this.rocket.dockedBody && (this.rocket.flightTime < 1.2 || this.rocket.pos.dist(body.getPositionAtTime(this.simTime)) <= body.radius + 3)) {
          continue;
        }
        const bPos = body.getPositionAtTime(this.simTime);
        const dist = this.rocket.pos.dist(bPos);
        if (dist <= body.radius) {
          this.rocket.state = 'CRASHED';
          this.rocket.crashBodyName = body.name;
          this.rocket.failureReason = `Impact with ${body.name} at ${(this.rocket.vel.mag() * 10).toFixed(0)} km/h`;
          this.onMissionEnded(false);
          break;
        }
      }

      // Check Waypoint Capture & SOI Proximity
      if (this.waypoint && this.rocket.state === 'FLYING') {
        const capResult = this.waypoint.checkCapture(this.rocket.pos, this.rocket.vel, this.simTime);
        if (capResult.captured) {
          this.rocket.state = 'SUCCESS';
          this.rocket.targetRelativeVector = null;
          this.onMissionEnded(true);
        } else if (capResult.insideSOI) {
          this.rocket.targetRelativeVector = this.waypoint.getRelativeVelocity(this.rocket.vel, this.simTime);
        } else {
          this.rocket.targetRelativeVector = null;
        }
      }

      // Check Deep Space Escape
      if (this.rocket.state === 'OUT_OF_BOUNDS') {
        this.onMissionEnded(false);
      }
    } else if (this.rocket.state === 'DOCKED') {
      this.rocket.update(dt, this.simTime);
      this.computeTrajectory();
    }
  }

  computeTrajectory() {
    if (!this.showTrajectory) {
      this.cachedPrediction = null;
      return;
    }

    const steps = this.currentLevel.isSandbox ? 1200 : (this.currentLevel.predictionSteps || 1050);
    const dt = 0.08;

    if (this.rocket.state === 'DOCKED') {
      const { totalVel } = this.rocket.getLaunchVelocity(this.simTime);
      const startPos = this.rocket.dockedBody.getSurfacePosition(this.rocket.dockedAngle, this.simTime);
      this.cachedPrediction = predictTrajectory(
        startPos,
        totalVel,
        this.simTime,
        this.bodies,
        this.waypoint,
        { steps, dt }
      );
    } else if (this.rocket.state === 'FLYING') {
      this.cachedPrediction = predictTrajectory(
        this.rocket.pos,
        this.rocket.vel,
        this.simTime,
        this.bodies,
        this.waypoint,
        { steps, dt }
      );
    }
  }

  setScrubTime(t) {
    if (this.rocket.state !== 'DOCKED') return;
    this.isPaused = true;
    this.simTime = Math.max(0, t);
    for (const body of this.bodies) {
      body.evaluateAtTime(this.simTime);
    }
    if (this.waypoint) {
      this.waypoint.evaluateAtTime(this.simTime);
    }
    this.rocket.updateDockedPosition(this.simTime);
    this.computeTrajectory();
    this.updateHUD();
  }

  stepScrubTime(delta) {
    if (this.rocket.state !== 'DOCKED') return;
    const current = Math.round(this.simTime * 10) / 10;
    const target = Math.max(0, Math.min(90, Math.round((current + delta) * 10) / 10));
    this.setScrubTime(target);
    const scrubSlider = document.getElementById('input-scrub-time');
    const scrubLabel = document.getElementById('label-scrub-time');
    if (scrubSlider && scrubLabel) {
      scrubSlider.value = target;
      scrubLabel.innerText = `T+${target.toFixed(1)}s (AIM)`;
    }
  }

  stepThrust(delta) {
    if (this.rocket.state !== 'DOCKED') return;
    const current = Math.round(this.rocket.launchThrust);
    const target = Math.max(10, Math.min(65, current + delta));
    this.rocket.launchThrust = target;
    const thrustInput = document.getElementById('input-thrust');
    const thrustLabel = document.getElementById('label-thrust');
    if (thrustInput && thrustLabel) {
      thrustInput.value = target;
      thrustLabel.innerText = `${target} m/s`;
    }
    this.computeTrajectory();
    this.updateHUD();
  }

  triggerLaunch() {
    if (this.rocket.state === 'DOCKED') {
      this.isPaused = false;
      this.plannedTrajectory = this.cachedPrediction;
      this.targetHitTime = this.cachedPrediction && this.cachedPrediction.waypointCaptured ? this.cachedPrediction.waypointHitTime : null;
      this.rocket.launch(this.simTime);
      this.computeTrajectory();
      this.updateHUD();
    }
  }

  setTrim(type) {
    if (this.rocket.state === 'FLYING' && this.rocket.fuel > 0 && type) {
      this.rocket.setTrim(type);
      this.sound.startThruster(type);
    } else {
      this.rocket.setTrim(null);
      this.sound.stopThruster();
    }
    this.computeTrajectory();
    this.updateHUD();
  }

  applyOrbitalTrim(type) {
    if (this.rocket.state === 'FLYING') {
      const ok = this.rocket.applyOrbitalTrim(type, 3.5);
      if (ok) {
        this.sound.startThruster(type);
        setTimeout(() => this.sound.stopThruster(), 160);
        this.computeTrajectory();
        this.updateHUD();
      }
      return ok;
    }
    return false;
  }

  // -------------------------------------------------------------
  // COORDINATE TRANSFORMS
  // -------------------------------------------------------------
  worldToScreen(world) {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    return {
      x: cx + (world.x - this.camera.x) * this.camera.zoom,
      y: cy + (world.y - this.camera.y) * this.camera.zoom
    };
  }

  screenToWorld(screen) {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    return new Vector2(
      this.camera.x + (screen.x - cx) / this.camera.zoom,
      this.camera.y + (screen.y - cy) / this.camera.zoom
    );
  }

  // -------------------------------------------------------------
  // RENDERING
  // -------------------------------------------------------------
  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear background
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, w, h);

    // Starfield & Grid
    this.drawBackgroundGrid(ctx);

    // Camera Transform
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-this.camera.x, -this.camera.y);

    // Draw Celestial Bodies & Orbits & Gravity Wells
    for (const body of this.bodies) {
      body.draw(ctx, this.simTime, { 
        showOrbits: this.showOrbits, 
        showGravityWells: this.showGravityWells,
        zoom: this.camera.zoom
      });
    }

    // Draw Waypoint
    if (this.waypoint) {
      const insideSOI = this.waypoint.isInsideSOI ? this.waypoint.isInsideSOI(this.rocket.pos) : false;
      const relSpeed = (insideSOI && this.rocket.vel) ? this.waypoint.getRelativeVelocity(this.rocket.vel, this.simTime).mag() : Infinity;
      const canCapture = insideSOI && (!this.waypoint.maxCaptureSpeed || relSpeed <= this.waypoint.maxCaptureSpeed);
      this.waypoint.draw(ctx, this.simTime, {
        insideSOI,
        canCapture,
        zoom: this.camera.zoom
      });
    }

    // Draw Planned Reference Trajectory (faint)
    if (this.showTrajectory && this.plannedTrajectory && this.rocket.state === 'FLYING') {
      this.drawTrajectoryPrediction(ctx, this.plannedTrajectory, { isPlannedReference: true, zoom: this.camera.zoom });
    }

    // Draw Live Predicted Trajectory Arc
    if (this.showTrajectory && this.cachedPrediction) {
      this.drawTrajectoryPrediction(ctx, this.cachedPrediction, { isAimingBurn: this.isAimingBurn, zoom: this.camera.zoom });
    }

    // Draw Rocket
    this.rocket.draw(ctx, this.simTime, this.camera);

    // Draw Launch Aim Vector Handle if DOCKED
    if (this.rocket.state === 'DOCKED' && this.rocket.dockedBody) {
      this.drawDockedAimHandle(ctx);
    }

    ctx.restore();

    // Floating Onscreen Banners
    if (this.isPlacingTarget) {
      ctx.save();
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(52, 211, 153, 0.8)';
      ctx.shadowBlur = 8;
      ctx.fillText('📍 TARGET PLACEMENT: Left-click anywhere on the map to drop custom gate · [ESC] to Cancel', w / 2, 72);
      ctx.restore();
    }
  }

  drawBackgroundGrid(ctx) {
    const gridSize = 100 * this.camera.zoom;
    const offsetX = (this.canvas.width / 2 - this.camera.x * this.camera.zoom) % gridSize;
    const offsetY = (this.canvas.height / 2 - this.camera.y * this.camera.zoom) % gridSize;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;

    for (let x = offsetX; x < this.canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
    }
    for (let y = offsetY; y < this.canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawTrajectoryPrediction(ctx, pred, options = {}) {
    if (!pred || pred.path.length < 2) return;

    const zoom = options.zoom || this.camera.zoom || 1.0;
    const invZoom = 1 / Math.max(0.01, zoom);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pred.path[0].pos.x, pred.path[0].pos.y);

    for (let i = 1; i < pred.path.length; i++) {
      ctx.lineTo(pred.path[i].pos.x, pred.path[i].pos.y);
    }

    if (options.isPlannedReference) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.lineWidth = 1.2 * invZoom;
      ctx.setLineDash([2 * invZoom, 6 * invZoom]);
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (options.isAimingBurn) {
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 2.0 * invZoom;
      ctx.setLineDash([4 * invZoom, 4 * invZoom]);
    } else {
      ctx.strokeStyle = pred.waypointCaptured ? 'rgba(52, 211, 153, 0.9)' : 'rgba(56, 189, 248, 0.65)';
      ctx.lineWidth = 1.8 * invZoom;
      ctx.setLineDash([4 * invZoom, 6 * invZoom]);
    }
    ctx.stroke();

    // Collision marker
    if (pred.collisionEvent) {
      const p = pred.collisionEvent.point;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5 * invZoom, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 1.5 * invZoom;
      ctx.stroke();
    }

    // Waypoint hit marker
    if (pred.waypointCaptured && pred.waypointHitPoint) {
      const p = pred.waypointHitPoint;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6 * invZoom, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5 * invZoom;
      ctx.stroke();
    }

    // Encounter Ghosts: Visualize future planet positions at the flyby point!
    if (pred.encounters && pred.encounters.length > 0 && !options.isPlannedReference) {
      for (const enc of pred.encounters) {
        const body = enc.body;
        const pPos = enc.planetPos;
        const rPos = enc.rocketPos;

        // 1. Ghost Planet Sphere
        ctx.save();
        ctx.translate(pPos.x, pPos.y);

        // Faint Ghost Halo
        ctx.beginPath();
        ctx.arc(0, 0, body.radius * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = body.glowColor;
        ctx.fill();

        // Ghost Body Circle
        ctx.beginPath();
        ctx.arc(0, 0, body.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fill();
        ctx.strokeStyle = body.color;
        ctx.lineWidth = 1.2 * invZoom;
        ctx.setLineDash([3 * invZoom, 3 * invZoom]);
        ctx.stroke();

        // Ghost Rings if Cronus
        if (body.hasRings) {
          ctx.beginPath();
          ctx.ellipse(0, 0, body.ringRadius, body.ringRadius * 0.45, -0.4, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(234, 179, 8, 0.35)';
          ctx.lineWidth = 1.8 * invZoom;
          ctx.stroke();
        }

        // Ghost Label (constant screen font size)
        ctx.fillStyle = body.color;
        ctx.font = 'bold ' + Math.max(7, Math.round(9 * invZoom)) + 'px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`[GHOST: ${body.name}]`, 0, -body.radius - 8 * invZoom);

        ctx.restore();

        // 2. Flyby Periapsis indicator line from Ghost Planet to Trajectory
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pPos.x, pPos.y);
        ctx.lineTo(rPos.x, rPos.y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1 * invZoom;
        ctx.setLineDash([2 * invZoom, 4 * invZoom]);
        ctx.stroke();

        // Periapsis marker on trajectory
        ctx.beginPath();
        ctx.arc(rPos.x, rPos.y, 3.5 * invZoom, 0, Math.PI * 2);
        ctx.fillStyle = body.color;
        ctx.fill();

        // Encounter Tag
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold ' + Math.max(7, Math.round(9 * invZoom)) + 'px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`⚡ ${body.name.toUpperCase()} FLYBY (T+${enc.time.toFixed(1)}s)`, rPos.x, rPos.y - 10 * invZoom);

        ctx.restore();
      }
    }

    // -----------------------------------------------------------
    // Chrono Time Pips: Timing ruler along flight path and target orbit
    // -----------------------------------------------------------
    if (pred.timePips && pred.timePips.length > 0 && !options.isPlannedReference) {
      for (const pip of pred.timePips) {
        ctx.save();
        // Flight path pip (constant screen size)
        ctx.beginPath();
        ctx.arc(pip.pos.x, pip.pos.y, 2.5 * invZoom, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();

        ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
        ctx.font = Math.max(7, Math.round(8 * invZoom)) + 'px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`+${Math.round(pip.elapsed)}s`, pip.pos.x, pip.pos.y - 6 * invZoom);

        // Corresponding pip on Waypoint's orbit at this exact future timestamp
        if (this.waypoint && this.waypoint.parent) {
          const wpPipPos = this.waypoint.getPositionAtTime(pip.t);
          ctx.beginPath();
          ctx.arc(wpPipPos.x, wpPipPos.y, 2.5 * invZoom, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(52, 211, 153, 0.7)';
          ctx.fill();

          // Subtle dashed tie line connecting identical times if reasonably close (< 200 AU)
          if (pip.pos.dist(wpPipPos) < 200) {
            ctx.beginPath();
            ctx.moveTo(pip.pos.x, pip.pos.y);
            ctx.lineTo(wpPipPos.x, wpPipPos.y);
            ctx.strokeStyle = 'rgba(52, 211, 153, 0.14)';
            ctx.lineWidth = 1 * invZoom;
            ctx.setLineDash([2 * invZoom, 4 * invZoom]);
            ctx.stroke();
          }
        }
        ctx.restore();
      }
    }

    // -----------------------------------------------------------
    // Arrival Node Ghost: Target hologram at closest approach
    // -----------------------------------------------------------
    if (pred.targetGhost && !options.isPlannedReference && this.waypoint) {
      const tg = pred.targetGhost;
      const ghostPos = tg.ghostPos;
      const approachPos = tg.approachPos;

      if (ghostPos) {
        ctx.save();
        ctx.translate(ghostPos.x, ghostPos.y);

        // Ghost Target SOI Ring
        ctx.beginPath();
        ctx.arc(0, 0, this.waypoint.captureRadius, 0, Math.PI * 2);
        ctx.strokeStyle = tg.isCaptured 
          ? 'rgba(52, 211, 153, 0.55)' 
          : (tg.needsBrake ? 'rgba(251, 191, 36, 0.55)' : 'rgba(56, 189, 248, 0.35)');
        ctx.lineWidth = 1.5 * invZoom;
        ctx.setLineDash([3 * invZoom, 4 * invZoom]);
        ctx.stroke();

        // Ghost Station Center Icon (constant screen size)
        ctx.beginPath();
        ctx.arc(0, 0, 4.5 * invZoom, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fill();
        ctx.strokeStyle = tg.isCaptured ? '#34d399' : (tg.needsBrake ? '#fbbf24' : '#38bdf8');
        ctx.lineWidth = 1.2 * invZoom;
        ctx.stroke();

        // Ghost Station Label (constant screen font size)
        ctx.fillStyle = tg.isCaptured ? '#34d399' : (tg.needsBrake ? '#fbbf24' : '#94a3b8');
        ctx.font = 'bold ' + Math.max(7, Math.round(9 * invZoom)) + 'px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        const tagText = tg.isCaptured 
          ? `[ARRIVAL: CLAMP CAPTURE (T+${tg.time.toFixed(1)}s)]` 
          : (tg.needsBrake 
              ? `[SOI INTERCEPT: BRAKE REQ Δv ${tg.relSpeed.toFixed(1)} m/s]` 
              : `[CLOSEST APPROACH: Δd ${Math.round(tg.distance)} AU]`);
        ctx.fillText(tagText, 0, -this.waypoint.captureRadius - 6 * invZoom);
        ctx.restore();

        // Connecting tether from Rocket Closest Approach to Target Ghost
        if (approachPos && typeof ghostPos.dist === 'function' && ghostPos.dist(approachPos) > 4) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(approachPos.x, approachPos.y);
          ctx.lineTo(ghostPos.x, ghostPos.y);
          ctx.strokeStyle = tg.isCaptured 
            ? 'rgba(52, 211, 153, 0.5)' 
            : (tg.needsBrake ? 'rgba(251, 191, 36, 0.5)' : 'rgba(239, 68, 68, 0.35)');
          ctx.lineWidth = 1 * invZoom;
          ctx.setLineDash([2 * invZoom, 4 * invZoom]);
          ctx.stroke();

          // Closest approach dot on rocket trajectory
          ctx.beginPath();
          ctx.arc(approachPos.x, approachPos.y, 3.5 * invZoom, 0, Math.PI * 2);
          ctx.fillStyle = tg.isCaptured ? '#34d399' : (tg.needsBrake ? '#fbbf24' : '#f87171');
          ctx.fill();
          ctx.restore();
        }
      }
    }

    ctx.restore();
  }

  drawDockedAimHandle(ctx) {
    const invZoom = 1 / Math.max(0.01, this.camera.zoom);
    const launchPos = this.rocket.pos;
    const { totalVel, vBooster } = this.rocket.getLaunchVelocity(this.simTime);

    ctx.save();
    ctx.translate(launchPos.x, launchPos.y);

    // Booster vector arrow
    const boosterArrow = Vector2.scale(vBooster, 1.2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(boosterArrow.x, boosterArrow.y);
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2.5 * invZoom;
    ctx.stroke();

    // Net launch vector arrow
    const totalArrow = Vector2.scale(totalVel, 1.0);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(totalArrow.x, totalArrow.y);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2 * invZoom;
    ctx.setLineDash([3 * invZoom, 3 * invZoom]);
    ctx.stroke();

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold ' + Math.max(7, Math.round(9 * invZoom)) + 'px "JetBrains Mono", monospace';
    ctx.fillText('NET LAUNCH VECTOR', totalArrow.x + 4 * invZoom, totalArrow.y);

    ctx.restore();
  }

  drawBurnAimHandle(ctx) {
    const invZoom = 1 / Math.max(0.01, this.camera.zoom);
    ctx.save();
    ctx.translate(this.rocket.pos.x, this.rocket.pos.y);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(this.burnDragVector.x, this.burnDragVector.y);
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 3 * invZoom;
    ctx.stroke();

    const mag = this.burnDragVector.mag();
    ctx.beginPath();
    ctx.arc(0, 0, mag, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.3)';
    ctx.lineWidth = 1 * invZoom;
    ctx.setLineDash([2 * invZoom, 4 * invZoom]);
    ctx.stroke();

    ctx.fillStyle = '#f472b6';
    ctx.font = 'bold ' + Math.max(7, Math.round(10 * invZoom)) + 'px "JetBrains Mono", monospace';
    ctx.fillText(`Δv: ${mag.toFixed(1)} m/s`, this.burnDragVector.x + 8 * invZoom, this.burnDragVector.y);

    ctx.restore();
  }

  // -------------------------------------------------------------
  // INPUT SETUP & EVENTS
  // -------------------------------------------------------------
  setupInputs() {
    const canvas = this.canvas;

    // Prevent default context menu so right-clicking sets target in sandbox
    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (this.currentLevel && this.currentLevel.isSandbox) {
        const worldPos = this.screenToWorld({ x: e.clientX, y: e.clientY });
        this.setStaticWaypoint(worldPos);
      }
    });

    canvas.addEventListener('mousedown', (e) => {
      // 1. If in Target Placement mode, Left Click sets the static waypoint!
      if (this.isPlacingTarget && e.button === 0) {
        const worldPos = this.screenToWorld({ x: e.clientX, y: e.clientY });
        this.setStaticWaypoint(worldPos);
        this.isPlacingTarget = false;
        this.updateHUD();
        return;
      }

      // 2. Camera Panning
      if (e.button === 1 || e.shiftKey || e.button === 0) {
        this.camera.isDragging = true;
        this.camera.dragStart = { x: e.clientX, y: e.clientY };
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.camera.isDragging) {
        const dx = (e.clientX - this.camera.dragStart.x) / this.camera.zoom;
        const dy = (e.clientY - this.camera.dragStart.y) / this.camera.zoom;
        this.camera.x -= dx;
        this.camera.y -= dy;
        this.camera.dragStart = { x: e.clientX, y: e.clientY };
      }
    });

    window.addEventListener('mouseup', () => {
      this.camera.isDragging = false;
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      this.setZoom(this.camera.zoom * zoomFactor);
    });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (this.rocket.state === 'FLYING' && this.waypoint && this.waypoint.isInsideSOI(this.rocket.pos)) {
          if (!e.repeat) {
            this.setTrim('TARGET_BRAKE');
          }
        } else {
          this.togglePause();
        }
      } else if (e.code === 'KeyP' || e.code === 'KeyW') {
        if (!e.repeat) {
          this.setTrim('PROGRADE');
        }
      } else if (e.code === 'KeyO' || e.code === 'KeyS') {
        if (!e.repeat) {
          this.setTrim('RETROGRADE');
        }
      } else if (e.code === 'KeyC') {
        this.recenterCamera();
      } else if (e.code === 'NumpadAdd' || (e.code === 'Equal' && this.rocket.state === 'DOCKED')) {
        this.zoomIn(1.1);
      } else if (e.code === 'NumpadSubtract' || (e.code === 'Minus' && this.rocket.state === 'DOCKED')) {
        this.zoomOut(1.1);
      } else if (e.code === 'Escape') {
        const instModal = document.getElementById('instructions-modal');
        if (instModal && instModal.classList.contains('active')) {
          this.closeInstructions();
        } else if (this.isPlacingTarget) {
          this.isPlacingTarget = false;
          this.updateHUD();
        }
      } else if (e.code === 'KeyH') {
        const instModal = document.getElementById('instructions-modal');
        if (instModal && instModal.classList.contains('active')) {
          this.closeInstructions();
        } else {
          this.openInstructions();
        }
      } else if (e.code === 'KeyR') {
        this.resetCurrentLevel();
      } else if (e.code === 'KeyQ') {
        this.prevLevel();
      } else if (e.code === 'KeyE') {
        this.nextLevel();
      } else if (e.code === 'ArrowLeft' || (e.code === 'KeyA' && this.rocket.state === 'DOCKED')) {
        this.stepScrubTime(-0.1);
      } else if (e.code === 'ArrowRight' || (e.code === 'KeyD' && this.rocket.state === 'DOCKED')) {
        this.stepScrubTime(0.1);
      } else if (e.code === 'ArrowUp' && this.rocket.state === 'DOCKED') {
        this.stepThrust(1);
      } else if (e.code === 'ArrowDown' && this.rocket.state === 'DOCKED') {
        this.stepThrust(-1);
      } else if (e.code === 'KeyL' && this.rocket.state === 'DOCKED') {
        this.triggerLaunch();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        if (this.rocket.activeTrim === 'TARGET_BRAKE') {
          this.setTrim(null);
        }
      } else if (e.code === 'KeyP' || e.code === 'KeyW' ||
          e.code === 'KeyO' || e.code === 'KeyS') {
        this.setTrim(null);
      }
    });
  }

  setZoom(zoom) {
    this.camera.zoom = Math.max(0.12, Math.min(2.5, zoom));
    this.updateZoomDisplay();
  }

  zoomIn(factor = 1.15) {
    this.setZoom(this.camera.zoom * factor);
  }

  zoomOut(factor = 1.15) {
    this.setZoom(this.camera.zoom / factor);
  }

  recenterCamera() {
    this.camera.x = 0;
    this.camera.y = 0;
    this.setZoom(this.currentLevel && this.currentLevel.isSandbox ? 0.52 : (this.currentLevelIndex <= 3 ? 0.88 : (this.currentLevelIndex <= 6 ? 0.75 : 0.62)));
  }

  updateZoomDisplay() {
    const zoomLabel = document.getElementById('label-zoom');
    if (zoomLabel) {
      zoomLabel.innerText = Math.round(this.camera.zoom * 100) + '%';
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    this.updateHUD();
  }

  toggleSweep() {
    if (this.rocket.state !== 'DOCKED') return;
    this.isPaused = !this.isPaused;
    this.updateHUD();
  }

  openInstructions() {
    this.isPaused = true;
    this.updateHUD();
    const modal = document.getElementById('instructions-modal');
    if (modal) modal.classList.add('active');
  }

  closeInstructions() {
    const modal = document.getElementById('instructions-modal');
    if (modal) modal.classList.remove('active');
  }

  setTimeScale(scale) {
    this.timeScale = scale;
    if (this.rocket.state === 'FLYING' && this.isPaused && scale > 0) {
      this.isPaused = false;
    }
    this.updateHUD();
  }

  onMissionEnded(success) {
    this.isPaused = true;
    this.setTrim(null);
    this.updateHUD();
    const modal = document.getElementById('mission-modal');
    const title = document.getElementById('modal-title');
    const desc = document.getElementById('modal-desc');
    const nextBtn = document.getElementById('modal-next-btn');

    if (!modal) return;

    if (success) {
      this.sound.playCapture();
      title.innerText = 'WAYPOINT INTERCEPTED!';
      title.className = 'modal-title success';
      desc.innerHTML = `Orbital target successfully captured at <strong>T+${this.simTime.toFixed(1)}s</strong>!<br>Remaining Fuel: <strong>${Math.round((this.rocket.fuel / this.rocket.maxFuel) * 100)}%</strong>`;
      nextBtn.style.display = 'inline-block';
    } else {
      title.innerText = 'MISSION ABORTED';
      title.className = 'modal-title fail';
      desc.innerHTML = `${this.rocket.failureReason || 'Trajectory lost.'}<br>Time of incident: <strong>T+${this.simTime.toFixed(1)}s</strong>`;
      nextBtn.style.display = 'none';
    }
    modal.classList.add('active');
  }

  closeModal() {
    const modal = document.getElementById('mission-modal');
    if (modal) modal.classList.remove('active');
  }

  // -------------------------------------------------------------
  // HUD UI BINDINGS
  // -------------------------------------------------------------
  updateHUD() {
    const speedEl = document.getElementById('telemetry-speed');
    const statusEl = document.getElementById('telemetry-status');
    const timeEl = document.getElementById('telemetry-time');
    const targetDistEl = document.getElementById('telemetry-target-dist');
    const interceptDistEl = document.getElementById('telemetry-closest-dist');
    const fuelValEl = document.getElementById('fuel-val-label');
    const fuelBarEl = document.getElementById('fuel-bar-fill');

    if (speedEl) {
      const spd = this.rocket.state === 'FLYING' ? this.rocket.vel.mag() : 0;
      speedEl.innerText = `${spd.toFixed(1)} m/s`;
    }
    if (statusEl) {
      statusEl.innerText = this.rocket.state;
      statusEl.className = `status-badge ${this.rocket.state.toLowerCase()}`;
    }
    if (timeEl) {
      timeEl.innerText = `T+${this.simTime.toFixed(1)}s`;
    }
    if (targetDistEl && this.waypoint) {
      const dist = this.rocket.pos.dist(this.waypoint.position);
      targetDistEl.innerText = `${dist.toFixed(0)} AU`;
    }

    // Trajectory Closest Approach / Intercept indicator
    if (interceptDistEl) {
      if (this.rocket.state === 'SUCCESS') {
        interceptDistEl.innerText = '★ TARGET CAPTURED!';
        interceptDistEl.style.color = '#34d399';
        interceptDistEl.style.fontWeight = 'bold';
      } else if (this.rocket.state === 'FLYING') {
        const isInsideSOI = this.waypoint && this.waypoint.isInsideSOI(this.rocket.pos);
        if (isInsideSOI) {
          const relSpeed = this.waypoint.getRelativeVelocity(this.rocket.vel, this.simTime).mag();
          const maxSpeed = this.waypoint.maxCaptureSpeed || 16.0;
          if (relSpeed <= maxSpeed) {
            interceptDistEl.innerText = `★ CLAMP LOCKING (${relSpeed.toFixed(1)} m/s)`;
            interceptDistEl.style.color = '#34d399';
          } else {
            interceptDistEl.innerText = `⚠ BRAKE REQ: Δv ${relSpeed.toFixed(1)} / ${maxSpeed.toFixed(0)} m/s`;
            interceptDistEl.style.color = '#fbbf24';
          }
          interceptDistEl.style.fontWeight = 'bold';
        } else if (this.targetHitTime !== null) {
          const countdown = Math.max(0, this.targetHitTime - this.simTime);
          interceptDistEl.innerText = `★ DOCK IN ${countdown.toFixed(1)}s (ETA T+${this.targetHitTime.toFixed(1)}s)`;
          interceptDistEl.style.color = '#34d399';
          interceptDistEl.style.fontWeight = 'bold';
        } else if (this.cachedPrediction && this.cachedPrediction.minWaypointDist < 99999) {
          const pred = this.cachedPrediction;
          const timeToClosest = Math.max(0, pred.minWaypointTime - this.simTime);
          interceptDistEl.innerText = `${pred.minWaypointDist.toFixed(0)} AU (in ${timeToClosest.toFixed(1)}s)`;
          interceptDistEl.style.color = '#38bdf8';
          interceptDistEl.style.fontWeight = 'normal';
        } else {
          interceptDistEl.innerText = '--- AU';
          interceptDistEl.style.color = '#94a3b8';
        }
      } else if (this.cachedPrediction && this.cachedPrediction.minWaypointDist !== undefined) {
        const pred = this.cachedPrediction;
        if (pred.waypointCaptured && pred.waypointHitTime !== null) {
          const flightDuration = Math.max(0, pred.waypointHitTime - this.simTime);
          interceptDistEl.innerText = `★ INTERCEPT (in ${flightDuration.toFixed(1)}s at T+${pred.waypointHitTime.toFixed(1)}s)`;
          interceptDistEl.style.color = '#34d399';
          interceptDistEl.style.fontWeight = 'bold';
        } else if (pred.minWaypointDist < 99999) {
          interceptDistEl.innerText = `${pred.minWaypointDist.toFixed(0)} AU (Miss)`;
          interceptDistEl.style.color = '#38bdf8';
          interceptDistEl.style.fontWeight = 'normal';
        } else {
          interceptDistEl.innerText = '--- AU';
          interceptDistEl.style.color = '#94a3b8';
        }
      } else {
        interceptDistEl.innerText = '--- AU';
      }
    }

    if (fuelBarEl) {
      fuelBarEl.style.width = `${(this.rocket.fuel / this.rocket.maxFuel) * 100}%`;
    }
    if (fuelValEl) {
      fuelValEl.innerText = `${Math.round((this.rocket.fuel / this.rocket.maxFuel) * 100)}%`;
    }

    if (this.rocket.fuel <= 0 && this.sound && this.sound.isFiring) {
      this.sound.stopThruster();
    }

    // Velocity breakdown panel for docked rocket
    const vOrbitEl = document.getElementById('calc-v-orbit');
    const vRotEl = document.getElementById('calc-v-rot');
    const vBoostEl = document.getElementById('calc-v-boost');
    const vTotalEl = document.getElementById('calc-v-total');

    if (this.rocket.state === 'DOCKED' && this.rocket.dockedBody) {
      const { totalVel, vOrbit, vSurfaceSpin, vBooster } = this.rocket.getLaunchVelocity(this.simTime);
      if (vOrbitEl) vOrbitEl.innerText = `${vOrbit.mag().toFixed(1)} m/s`;
      if (vRotEl) {
        const isBoost = vSurfaceSpin.dot(vBooster) > 0;
        const sign = this.rocket.dockedBody.rotationSpeed > 0 ? '+' : '-';
        vRotEl.innerText = `${sign}${vSurfaceSpin.mag().toFixed(1)} m/s (${isBoost ? 'Boost' : 'Penalty'})`;
        vRotEl.style.color = isBoost ? '#38bdf8' : '#f43f5e';
      }
      if (vBoostEl) vBoostEl.innerText = `${vBooster.mag().toFixed(1)} m/s`;
      if (vTotalEl) vTotalEl.innerText = `${totalVel.mag().toFixed(1)} m/s`;
    }

    // Live Gravity Well Influence Breakdown (shows who is pulling on the craft)
    const gravListEl = document.getElementById('gravity-breakdown-list');
    if (gravListEl) {
      const breakdown = getGravityInfluenceBreakdown(this.rocket.pos, this.simTime, this.bodies);
      const top3 = breakdown.slice(0, 3);
      gravListEl.innerHTML = top3.map(item => `
        <div class="gravity-bar-row">
          <div class="gravity-bar-meta">
            <span style="color: ${item.body.color}; font-weight: bold;">${item.body.name}</span>
            <span>${item.percent.toFixed(0)}%</span>
          </div>
          <div class="gravity-bar-track">
            <div class="gravity-bar-val" style="width: ${item.percent}%; background: ${item.body.color};"></div>
          </div>
        </div>
      `).join('');
    }

    // Scrub Slider & Step Buttons Sync
    const scrubSlider = document.getElementById('input-scrub-time');
    const scrubLabel = document.getElementById('label-scrub-time');
    const prevScrubBtn = document.getElementById('btn-scrub-prev');
    const nextScrubBtn = document.getElementById('btn-scrub-next');
    const sweepBtn = document.getElementById('btn-scrub-sweep');

    if (scrubSlider && scrubLabel) {
      if (this.rocket.state === 'FLYING') {
        scrubSlider.disabled = true;
        if (prevScrubBtn) prevScrubBtn.disabled = true;
        if (nextScrubBtn) nextScrubBtn.disabled = true;
        if (sweepBtn) {
          sweepBtn.disabled = true;
          sweepBtn.innerText = '▶ SWEEP';
          sweepBtn.classList.remove('sweeping');
        }
        scrubSlider.value = this.simTime.toFixed(1);
        scrubLabel.innerText = `T+${this.simTime.toFixed(1)}s (FLIGHT)`;
      } else {
        scrubSlider.disabled = false;
        if (prevScrubBtn) prevScrubBtn.disabled = false;
        if (nextScrubBtn) nextScrubBtn.disabled = false;
        if (sweepBtn) {
          sweepBtn.disabled = false;
          if (this.isPaused) {
            sweepBtn.innerText = '▶ SWEEP';
            sweepBtn.classList.remove('sweeping');
            sweepBtn.title = 'Run automated scrub sweep [SPACE]';
          } else {
            sweepBtn.innerText = '❚❚ PAUSE';
            sweepBtn.classList.add('sweeping');
            sweepBtn.title = 'Pause automated sweep [SPACE]';
          }
        }
        scrubSlider.value = this.simTime.toFixed(1);
        scrubLabel.innerText = `T+${this.simTime.toFixed(1)}s (AIM)`;
      }
    }

    // Booster Thrust Slider & Step Buttons Sync
    const thrustInput = document.getElementById('input-thrust');
    const prevThrustBtn = document.getElementById('btn-thrust-prev');
    const nextThrustBtn = document.getElementById('btn-thrust-next');
    if (thrustInput) {
      thrustInput.disabled = this.rocket.state !== 'DOCKED';
    }
    if (prevThrustBtn) {
      prevThrustBtn.disabled = this.rocket.state !== 'DOCKED';
    }
    if (nextThrustBtn) {
      nextThrustBtn.disabled = this.rocket.state !== 'DOCKED';
    }

    const pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn) {
      if (this.rocket.state === 'DOCKED') {
        pauseBtn.innerText = this.isPaused ? '▶ SWEEP' : '❚❚ PAUSE';
      } else {
        pauseBtn.innerText = this.isPaused ? '▶ RESUME' : '❚❚ PAUSE';
      }
      pauseBtn.classList.toggle('active', this.isPaused);
    }

    // Prograde and Retrograde trim buttons
    const progradeBtn = document.getElementById('btn-burn-prograde');
    const retrogradeBtn = document.getElementById('btn-burn-retrograde');
    if (progradeBtn) {
      progradeBtn.disabled = this.rocket.state !== 'FLYING' || this.rocket.fuel <= 0;
      progradeBtn.classList.toggle('active', this.rocket.activeTrim === 'PROGRADE');
    }
    if (retrogradeBtn) {
      retrogradeBtn.disabled = this.rocket.state !== 'FLYING' || this.rocket.fuel <= 0;
      const isInsideSOI = this.waypoint && this.rocket.state === 'FLYING' && this.waypoint.isInsideSOI(this.rocket.pos);
      if (isInsideSOI) {
        const relSpeed = this.waypoint.getRelativeVelocity(this.rocket.vel, this.simTime).mag();
        retrogradeBtn.innerText = `▼ BRAKE TO DOCK [SPACE / S] (${relSpeed.toFixed(1)} m/s)`;
        retrogradeBtn.style.borderColor = '#fbbf24';
        retrogradeBtn.style.color = '#fbbf24';
      } else {
        retrogradeBtn.innerText = '▼ HOLD: RETROGRADE TRIM [O/S]';
        retrogradeBtn.style.borderColor = '';
        retrogradeBtn.style.color = '';
      }
      retrogradeBtn.classList.toggle('active', this.rocket.activeTrim === 'RETROGRADE' || this.rocket.activeTrim === 'TARGET_BRAKE');
    }

    const placeTargetBtn = document.getElementById('btn-place-target');
    if (placeTargetBtn) {
      placeTargetBtn.style.display = (this.currentLevel && this.currentLevel.isSandbox) ? 'block' : 'none';
      placeTargetBtn.classList.toggle('active', this.isPlacingTarget);
      placeTargetBtn.innerText = this.isPlacingTarget ? 'CLICK MAP TO PLACE...' : '📍 SET TARGET [R-CLICK MAP]';
    }

    const launchBtn = document.getElementById('btn-launch');
    if (launchBtn) {
      launchBtn.disabled = this.rocket.state !== 'DOCKED';
    }

    this.updateZoomDisplay();
  }
}
