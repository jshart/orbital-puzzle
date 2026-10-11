/**
 * Continuum Multi-Scale Demo - Interactive Application Controller
 * Coordinates Canvas rendering of full 65-star sector (central SMBH),
 * planetary orbits, cross-fades, guidance status HUD, and audio chimes.
 */

import { Vector2 } from '../vector.js';
import { ContinuumDirector, STAGES } from './continuum_director.js';
import { StellarRenderer } from '../galactic/stellar_renderer.js';
import { SoundFX } from '../sound.js';

export class ContinuumDemoApp {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sound = new SoundFX();

    this.director = new ContinuumDirector();
    this.stellarRenderer = new StellarRenderer();

    // Visual State
    this.showOrbits = true;
    this.showGravityWells = true;
    this.showLabels = true;

    this.setupDirectorCallbacks();
    this.setupInputs();
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setupDirectorCallbacks() {
    this.director.onStageChanged = (stage) => {
      this.updateStageHUD(stage);
      try {
        if (stage === STAGES.TRANSITION_1_TO_SOLAR || stage === STAGES.TRANSITION_2_TO_PLANETARY) {
          this.sound.playChime(1);
        }
      } catch (e) {}
    };

    this.director.onMissionComplete = (stats) => {
      try {
        this.sound.playVictoryChime();
      } catch (e) {}
      this.showVictoryModal(stats);
    };
  }

  // -------------------------------------------------------------
  // ANIMATION & RENDER LOOP
  // -------------------------------------------------------------
  update(dt) {
    this.director.update(dt);
    this.stellarRenderer.update(dt);
    this.updateHUD();
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cam = this.director.camera;

    // Deep space background
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, w, h);

    // Dynamic grid
    this.drawBackgroundGrid(ctx, cam);

    // Apply Camera Transform & Render active scenes
    const stage = this.director.stage;

    if (stage === STAGES.STAGE_1_GALACTIC) {
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(-cam.x, -cam.y);
      this.renderGalacticScene(ctx, cam.zoom, 1.0);
      this.renderProbe(ctx, cam.zoom);
      ctx.restore();
    } else if (stage === STAGES.TRANSITION_1_TO_SOLAR) {
      const p = this.director.transitionProgress;
      const tStar = this.director.galacticScene.targetStar;
      const tStarPos = tStar.position;

      // 1. Galactic scene fades out, centered on Sol Prime at canvas center (w/2, h/2)
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(-tStarPos.x, -tStarPos.y);
      this.renderGalacticScene(ctx, cam.zoom, 1.0 - p);
      ctx.restore();

      // 2. Solar scene fades in, centered on Sol (0, 0) at canvas center (w/2, h/2)
      if (this.director.solarScene) {
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.scale(cam.zoom, cam.zoom);
        ctx.translate(0, 0);
        this.renderSolarScene(ctx, cam.zoom, p);
        ctx.restore();
      }

      // 3. Probe rendered continuously relative to focal center (w/2, h/2)
      this.renderProbeTransition1(ctx, w, h, cam.zoom, p);
      this.renderTransitionBanner(ctx, w, h);

    } else if (stage === STAGES.STAGE_2_SOLAR) {
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(-cam.x, -cam.y);
      this.renderSolarScene(ctx, cam.zoom, 1.0);
      this.renderProbe(ctx, cam.zoom);
      ctx.restore();

    } else if (stage === STAGES.TRANSITION_2_TO_PLANETARY) {
      const p = this.director.transitionProgress;
      const terra = this.director.solarScene.targetPlanet;
      const terraPos = terra.getPositionAtTime(this.director.solarTime);

      // 1. Solar scene fades out, centered on Terra at canvas center (w/2, h/2)
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(-terraPos.x, -terraPos.y);
      this.renderSolarScene(ctx, cam.zoom, 1.0 - p);
      ctx.restore();

      // 2. Planetary scene fades in, centered on Terra (0, 0) at canvas center (w/2, h/2)
      if (this.director.planetaryScene) {
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.scale(cam.zoom, cam.zoom);
        ctx.translate(0, 0);
        this.renderPlanetaryScene(ctx, cam.zoom, p);
        ctx.restore();
      }

      // 3. Probe rendered continuously relative to focal center (w/2, h/2)
      this.renderProbeTransition2(ctx, w, h, cam.zoom, p);
      this.renderTransitionBanner(ctx, w, h);

    } else if (stage === STAGES.STAGE_3_PLANETARY || stage === STAGES.STAGE_4_COMPLETE) {
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(-cam.x, -cam.y);
      this.renderPlanetaryScene(ctx, cam.zoom, 1.0);
      this.renderProbe(ctx, cam.zoom);
      if (stage === STAGES.STAGE_4_COMPLETE) {
        this.renderDockingBeacons(ctx, cam.zoom);
      }
      ctx.restore();
    }
  }

  renderGalacticScene(ctx, zoom, alpha) {
    if (alpha <= 0.01) return;
    const scene = this.director.galacticScene;
    if (!scene || !scene.sector) return;

    ctx.save();
    ctx.globalAlpha = alpha;
    const invZoom = 1 / Math.max(0.01, zoom);

    // 1. Draw entire 65-Star Galactic Sector with Central SMBH & Binary Tracks!
    this.stellarRenderer.drawSector(ctx, scene.sector, this.director.totalTime, {
      zoom,
      showBinaryOrbits: true,
      showGravityWells: true,
      showLabels: this.showLabels
    });

    // 2. Highlight target star Sol Prime's SOI capture boundary
    const tStar = scene.targetStar;
    ctx.beginPath();
    ctx.arc(tStar.position.x, tStar.position.y, tStar.soiRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.75)';
    ctx.lineWidth = 1.8 * invZoom;
    ctx.setLineDash([4 * invZoom, 6 * invZoom]);
    ctx.stroke();

    // Pulsing target beacon label
    ctx.font = `bold ${Math.max(9, Math.round(11 * invZoom))}px "JetBrains Mono", monospace`;
    ctx.fillStyle = '#34d399';
    ctx.textAlign = 'center';
    ctx.fillText('TARGET SYSTEM: SOL PRIME', tStar.position.x, tStar.position.y - tStar.soiRadius - 10 * invZoom);

    ctx.restore();
  }

  renderSolarScene(ctx, zoom, alpha) {
    if (alpha <= 0.01) return;
    const scene = this.director.solarScene;
    if (!scene) return;

    ctx.save();
    ctx.globalAlpha = alpha;
    const t = this.director.solarTime;

    // Draw solar bodies & planetary orbits
    for (const body of scene.bodies) {
      body.draw(ctx, t, {
        showOrbits: this.showOrbits,
        showGravityWells: this.showGravityWells,
        zoom
      });
    }

    ctx.restore();
  }

  renderPlanetaryScene(ctx, zoom, alpha) {
    if (alpha <= 0.01) return;
    const scene = this.director.planetaryScene;
    if (!scene) return;

    ctx.save();
    ctx.globalAlpha = alpha;
    const t = this.director.planetaryTime;

    // Draw Terra & Luna
    for (const body of scene.bodies) {
      body.draw(ctx, t, {
        showOrbits: this.showOrbits,
        showGravityWells: this.showGravityWells,
        zoom
      });
    }

    // Draw Station Alpha Waypoint
    scene.targetWaypoint.draw(ctx, t, {
      insideSOI: this.director.probe.pos.dist(scene.targetWaypoint.position) <= scene.targetWaypoint.captureRadius * 1.8,
      canCapture: true,
      zoom
    });

    ctx.restore();
  }

  renderProbe(ctx, zoom) {
    const invZoom = 1 / Math.max(0.01, zoom);
    const probe = this.director.probe;

    // Trail
    if (this.director.trail.length > 1) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(this.director.trail[0].x, this.director.trail[0].y);
      for (let i = 1; i < this.director.trail.length; i++) {
        ctx.lineTo(this.director.trail[i].x, this.director.trail[i].y);
      }
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.lineWidth = 1.6 * invZoom;
      ctx.stroke();
      ctx.restore();
    }

    // Exhaust particles
    for (const p of this.director.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, (p.size || 2.5) * invZoom, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();
    }

    // Probe Fuselage Hull
    ctx.save();
    ctx.translate(probe.pos.x, probe.pos.y);
    ctx.rotate(probe.heading);
    this.drawProbeShipHull(ctx, invZoom, probe.isDocked, probe.activeTrim);
    ctx.restore();
  }

  renderProbeTransition1(ctx, w, h, zoom, p) {
    const invZoom = 1 / Math.max(0.01, zoom);
    const tStar = this.director.galacticScene.targetStar;
    const probe = this.director.probe;

    const relX = probe.pos.x - tStar.position.x;
    const relY = probe.pos.y - tStar.position.y;
    const incomingAngle = Math.atan2(relY, relX);

    // Distance smoothly transitions from SOI radius (135) to Solar outer boundary (480)
    const r = 135 * (1 - p) + 480 * p;
    const screenX = w / 2 + Math.cos(incomingAngle) * r * zoom;
    const screenY = h / 2 + Math.sin(incomingAngle) * r * zoom;

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(probe.heading);
    this.drawProbeShipHull(ctx, invZoom, false, 'MCC');
    ctx.restore();
  }

  renderProbeTransition2(ctx, w, h, zoom, p) {
    const invZoom = 1 / Math.max(0.01, zoom);
    const terra = this.director.solarScene.targetPlanet;
    const terraPos = terra.getPositionAtTime(this.director.solarTime);
    const probe = this.director.probe;

    const relX = probe.pos.x - terraPos.x;
    const relY = probe.pos.y - terraPos.y;
    const incomingAngle = Math.atan2(relY, relX);

    // Distance smoothly transitions from Terra's SOI (65) to Planetary entry radius (140)
    const r = 65 * (1 - p) + 140 * p;
    const screenX = w / 2 + Math.cos(incomingAngle) * r * zoom;
    const screenY = h / 2 + Math.sin(incomingAngle) * r * zoom;

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(probe.heading);
    this.drawProbeShipHull(ctx, invZoom, false, 'MCC');
    ctx.restore();
  }

  renderDockingBeacons(ctx, zoom) {
    const invZoom = 1 / Math.max(0.01, zoom);
    const scene = this.director.planetaryScene;
    if (!scene || !scene.targetWaypoint) return;

    const wp = scene.targetWaypoint;
    const t = this.director.planetaryTime;
    const pulse = (Math.sin(t * 6.0) + 1) * 0.5;

    ctx.save();
    ctx.beginPath();
    ctx.arc(wp.position.x, wp.position.y, (wp.captureRadius + pulse * 14) * invZoom, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(52, 211, 153, ${0.4 + pulse * 0.4})`;
    ctx.lineWidth = 2.0 * invZoom;
    ctx.stroke();

    ctx.font = `bold ${Math.max(10, Math.round(11 * invZoom))}px "JetBrains Mono", monospace`;
    ctx.fillStyle = '#34d399';
    ctx.textAlign = 'center';
    ctx.fillText('★ CLAMPS LOCKED // DOCKED', wp.position.x, wp.position.y - wp.captureRadius - 14 * invZoom);
    ctx.restore();
  }

  drawProbeShipHull(ctx, invZoom, isDocked, activeTrim) {
    // Active Thruster Jet Plume if Burning
    if (activeTrim === 'MCC') {
      const plumeLen = 20 * invZoom + Math.random() * 10 * invZoom;
      ctx.beginPath();
      ctx.moveTo(-5 * invZoom, -3 * invZoom);
      ctx.lineTo(-plumeLen, 0);
      ctx.lineTo(-5 * invZoom, 3 * invZoom);
      ctx.closePath();
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (activeTrim === 'BRAKE') {
      ctx.beginPath();
      ctx.moveTo(2 * invZoom, -4 * invZoom);
      ctx.lineTo(8 * invZoom + Math.random() * 8 * invZoom, -12 * invZoom);
      ctx.lineTo(0, -6 * invZoom);
      ctx.closePath();
      ctx.fillStyle = '#f59e0b';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(2 * invZoom, 4 * invZoom);
      ctx.lineTo(8 * invZoom + Math.random() * 8 * invZoom, 12 * invZoom);
      ctx.lineTo(0, 6 * invZoom);
      ctx.closePath();
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
    }

    // Fuselage Hull
    ctx.beginPath();
    ctx.moveTo(11 * invZoom, 0);
    ctx.lineTo(-7 * invZoom, -5 * invZoom);
    ctx.lineTo(-4 * invZoom, 0);
    ctx.lineTo(-7 * invZoom, 5 * invZoom);
    ctx.closePath();
    ctx.fillStyle = isDocked ? '#34d399' : '#f8fafc';
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.2 * invZoom;
    ctx.stroke();
  }

  renderTransitionBanner(ctx, w, h) {
    const isTrans1 = this.director.stage === STAGES.TRANSITION_1_TO_SOLAR;
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
    ctx.fillRect(0, 72, w, 44);

    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    const text = isTrans1 
      ? '⚡ [TIER 1 ➔ TIER 2] INTERSTELLAR BOUNDARY BREACHED // INSERTION INTO SOL SYSTEM' 
      : '⚡ [TIER 2 ➔ TIER 3] PLANETARY SOI CAPTURE // DESCENDING TO TERRA & LUNA';
    ctx.fillText(text, w / 2, 98);
    ctx.restore();
  }

  drawBackgroundGrid(ctx, cam) {
    const gridSize = 140 * cam.zoom;
    const offsetX = (this.canvas.width / 2 - cam.x * cam.zoom) % gridSize;
    const offsetY = (this.canvas.height / 2 - cam.y * cam.zoom) % gridSize;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;

    for (let x = offsetX; x < this.canvas.width; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.canvas.height); ctx.stroke();
    }
    for (let y = offsetY; y < this.canvas.height; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.canvas.width, y); ctx.stroke();
    }
    ctx.restore();
  }

  // -------------------------------------------------------------
  // HUD UPDATES & CONTROLS
  // -------------------------------------------------------------
  updateStageHUD(stage) {
    const badge1 = document.getElementById('badge-tier-1');
    const badge2 = document.getElementById('badge-tier-2');
    const badge3 = document.getElementById('badge-tier-3');
    const stageNameEl = document.getElementById('hud-stage-name');
    const stageDescEl = document.getElementById('hud-stage-desc');

    if (!badge1 || !badge2 || !badge3) return;

    badge1.classList.remove('active', 'completed');
    badge2.classList.remove('active', 'completed');
    badge3.classList.remove('active', 'completed');

    if (stage === STAGES.STAGE_1_GALACTIC || stage === STAGES.TRANSITION_1_TO_SOLAR) {
      badge1.classList.add('active');
      stageNameEl.innerText = 'TIER 1: GALACTIC SECTOR';
      stageDescEl.innerText = 'Galactic core (Sagittarius Prime) ──▶ Interstellar transit ──▶ Sol Prime';
    } else if (stage === STAGES.STAGE_2_SOLAR || stage === STAGES.TRANSITION_2_TO_PLANETARY) {
      badge1.classList.add('completed');
      badge2.classList.add('active');
      stageNameEl.innerText = 'TIER 2: SOL INTERPLANETARY SYSTEM';
      stageDescEl.innerText = 'Interstellar insertion ──▶ Mid-Course Guidance Burn ──▶ Terra descent';
    } else if (stage === STAGES.STAGE_3_PLANETARY || stage === STAGES.STAGE_4_COMPLETE) {
      badge1.classList.add('completed');
      badge2.classList.add('completed');
      badge3.classList.add('active');
      stageNameEl.innerText = 'TIER 3: TERRA & LUNA SUBSYSTEM';
      stageDescEl.innerText = 'Orbital insertion ──▶ Automated target braking ──▶ Station Alpha dock';
    }
  }

  updateHUD() {
    const stats = this.director.stats;
    const speedEl = document.getElementById('telemetry-speed');
    const distEl = document.getElementById('telemetry-dist');
    const gravEl = document.getElementById('telemetry-grav');
    const guidanceEl = document.getElementById('telemetry-guidance');
    const timeEl = document.getElementById('telemetry-time');

    if (speedEl) speedEl.innerText = `${stats.currentSpeed.toFixed(1)} m/s`;
    if (distEl) distEl.innerText = `${Math.round(stats.targetDist)} AU`;
    if (gravEl) gravEl.innerText = stats.activeGravityWell;
    if (guidanceEl) {
      guidanceEl.innerText = stats.guidanceStatus;
      guidanceEl.style.color = stats.guidanceStatus.includes('ACTIVE') || stats.guidanceStatus.includes('BRAKING') ? '#f59e0b' : '#34d399';
    }
    if (timeEl) timeEl.innerText = `T+${this.director.totalTime.toFixed(1)}s`;
  }

  showVictoryModal(stats) {
    const modal = document.getElementById('debrief-modal');
    if (!modal) return;
    modal.classList.add('active');

    const t1El = document.getElementById('stat-transit-t1');
    const t2El = document.getElementById('stat-transit-t2');
    const t3El = document.getElementById('stat-transit-t3');
    const totalEl = document.getElementById('stat-total-time');

    if (t1El && stats?.transitTimes?.t1 !== undefined) t1El.innerText = `${stats.transitTimes.t1.toFixed(1)}s`;
    if (t2El && stats?.transitTimes?.t2 !== undefined) t2El.innerText = `${stats.transitTimes.t2.toFixed(1)}s`;
    if (t3El && stats?.transitTimes?.t3 !== undefined) t3El.innerText = `${stats.transitTimes.t3.toFixed(1)}s`;
    if (totalEl) totalEl.innerText = `${this.director.totalTime.toFixed(1)}s`;
  }

  closeVictoryModal() {
    const modal = document.getElementById('debrief-modal');
    if (modal) modal.classList.remove('active');
  }

  restartJourney() {
    this.closeVictoryModal();
    this.director.reset();
  }

  setupInputs() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.director.isPaused = !this.director.isPaused;
      } else if (e.code === 'KeyR') {
        this.restartJourney();
      }
    });
  }
}
