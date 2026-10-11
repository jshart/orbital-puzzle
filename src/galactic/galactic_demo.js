/**
 * Galactic Sector - Interactive Demonstration Controller
 * Coordinates Canvas rendering, sector procedural generation,
 * camera controls, distribution telemetry, and gravity probe testing.
 */

import { Vector2 } from '../vector.js';
import { GalacticSector } from './galactic_sector.js';
import { StellarRenderer } from './stellar_renderer.js';
import { analyzePopulation, getAstronomicalDistribution, getGameFriendlyDistribution } from './distribution.js';
import { STELLAR_CLASSES } from './stellar_types.js';

export class GalacticDemoApp {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Camera
    this.camera = {
      x: 0,
      y: 0,
      zoom: 0.38,
      isDragging: false,
      dragStart: { x: 0, y: 0 }
    };

    // State
    this.seed = 1042;
    this.starCount = 65;
    this.blendFactor = 1.0; // Defaults to Game-Friendly
    this.showBinaryOrbits = true;
    this.showGravityWells = true;
    this.showLabels = true;
    this.showAllWells = false;

    this.simTime = 0;
    this.isPaused = false;
    this.timeScale = 1.0;

    // Selection
    this.hoveredStar = null;
    this.selectedStar = null;

    // Mini Gravity Test Probe
    this.probe = null; // { pos, vel, trail }
    this.probeTrail = [];

    // Renderer & Sector
    this.renderer = new StellarRenderer();
    this.sector = new GalacticSector({
      seed: this.seed,
      starCount: this.starCount,
      blendFactor: this.blendFactor
    });

    this.setupInputs();
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.updateStatsUI();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  regenerateSector() {
    this.sector = new GalacticSector({
      seed: this.seed,
      starCount: this.starCount,
      blendFactor: this.blendFactor
    });
    this.hoveredStar = null;
    this.selectedStar = null;
    this.probe = null;
    this.probeTrail = [];
    this.updateStatsUI();
  }

  setBlend(factor) {
    this.blendFactor = Math.max(0, Math.min(1, factor));
    this.regenerateSector();
  }

  setStarCount(count) {
    this.starCount = Math.max(20, Math.min(150, count));
    this.regenerateSector();
  }

  randomizeSeed() {
    this.seed = Math.floor(Math.random() * 999999);
    this.regenerateSector();
  }

  selectStar(star) {
    this.selectedStar = star;
    this.updateStarCard(star);
  }

  // -------------------------------------------------------------
  // TEST PROBE (Slingshot Tester)
  // -------------------------------------------------------------
  launchTestProbe(startPos, startVel) {
    this.probe = {
      pos: startPos.clone(),
      vel: startVel.clone(),
      t: this.simTime
    };
    this.probeTrail = [startPos.clone()];
  }

  fireDefaultProbe() {
    // Fires a high-speed probe from the outer rim angled across the cluster
    const angle = Math.random() * Math.PI * 2;
    const r = 1100;
    const startPos = new Vector2(Math.cos(angle) * r, Math.sin(angle) * r);
    // Vector aimed near center with slight offset for slingshot
    const target = new Vector2((Math.random() - 0.5) * 350, (Math.random() - 0.5) * 350);
    const dir = target.sub(startPos).normalize();
    const speed = 48 + Math.random() * 20;

    this.launchTestProbe(startPos, Vector2.scale(dir, speed));
  }

  updateProbe(dt) {
    if (!this.probe) return;

    // Fixed 50Hz RK4 step for probe
    const G = 1.0;
    const eps = 6.0;

    const computeAcc = (p) => {
      const acc = new Vector2(0, 0);
      for (const star of this.sector.stars) {
        const dx = star.position.x - p.x;
        const dy = star.position.y - p.y;
        const distSq = dx * dx + dy * dy;
        const denom = Math.pow(distSq + eps * eps, 1.5);
        const factor = (G * star.mass) / denom;
        acc.x += dx * factor;
        acc.y += dy * factor;
      }
      return acc;
    };

    // RK4 step
    const pos = this.probe.pos;
    const vel = this.probe.vel;

    const a1 = computeAcc(pos);
    const k1_v = Vector2.scale(a1, dt);
    const k1_r = Vector2.scale(vel, dt);

    const pos2 = Vector2.add(pos, Vector2.scale(k1_r, 0.5));
    const vel2 = Vector2.add(vel, Vector2.scale(k1_v, 0.5));
    const a2 = computeAcc(pos2);
    const k2_v = Vector2.scale(a2, dt);
    const k2_r = Vector2.scale(vel2, dt);

    const pos3 = Vector2.add(pos, Vector2.scale(k2_r, 0.5));
    const vel3 = Vector2.add(vel, Vector2.scale(k2_v, 0.5));
    const a3 = computeAcc(pos3);
    const k3_v = Vector2.scale(a3, dt);
    const k3_r = Vector2.scale(vel3, dt);

    const pos4 = Vector2.add(pos, k3_r);
    const vel4 = Vector2.add(vel, k3_v);
    const a4 = computeAcc(pos4);
    const k4_v = Vector2.scale(a4, dt);
    const k4_r = Vector2.scale(vel4, dt);

    pos.add(new Vector2(
      (k1_r.x + 2 * k2_r.x + 2 * k3_r.x + k4_r.x) / 6,
      (k1_r.y + 2 * k2_r.y + 2 * k3_r.y + k4_r.y) / 6
    ));
    vel.add(new Vector2(
      (k1_v.x + 2 * k2_v.x + 2 * k3_v.x + k4_v.x) / 6,
      (k1_v.y + 2 * k2_v.y + 2 * k3_v.y + k4_v.y) / 6
    ));

    // Collision or out of bounds
    for (const star of this.sector.stars) {
      if (pos.dist(star.position) <= star.radius) {
        this.probe = null; // Collided
        return;
      }
    }

    if (pos.mag() > 3200) {
      this.probe = null; // Escaped
      return;
    }

    // Append trail
    if (this.probeTrail.length === 0 || pos.distSq(this.probeTrail[this.probeTrail.length - 1]) > 16) {
      this.probeTrail.push(pos.clone());
      if (this.probeTrail.length > 350) this.probeTrail.shift();
    }
  }

  // -------------------------------------------------------------
  // INPUTS
  // -------------------------------------------------------------
  setupInputs() {
    const c = this.canvas;

    c.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.camera.isDragging = true;
        this.camera.dragStart.x = e.clientX;
        this.camera.dragStart.y = e.clientY;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.camera.isDragging) {
        const dx = e.clientX - this.camera.dragStart.x;
        const dy = e.clientY - this.camera.dragStart.y;
        this.camera.x -= dx / this.camera.zoom;
        this.camera.y -= dy / this.camera.zoom;
        this.camera.dragStart.x = e.clientX;
        this.camera.dragStart.y = e.clientY;
      } else {
        const worldPos = this.screenToWorld({ x: e.clientX, y: e.clientY });
        const hit = this.sector.findNearestStar(worldPos, 45 / this.camera.zoom);
        this.hoveredStar = hit;
      }
    });

    window.addEventListener('mouseup', () => {
      this.camera.isDragging = false;
    });

    c.addEventListener('click', (e) => {
      const worldPos = this.screenToWorld({ x: e.clientX, y: e.clientY });
      const hit = this.sector.findNearestStar(worldPos, 45 / this.camera.zoom);
      if (hit) {
        this.selectStar(hit);
      }
    });

    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      this.camera.zoom = Math.max(0.12, Math.min(2.5, this.camera.zoom * zoomFactor));
      this.updateZoomDisplay();
    }, { passive: false });
  }

  screenToWorld(pt) {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    return new Vector2(
      this.camera.x + (pt.x - cx) / this.camera.zoom,
      this.camera.y + (pt.y - cy) / this.camera.zoom
    );
  }

  updateZoomDisplay() {
    const el = document.getElementById('label-zoom');
    if (el) el.innerText = `${Math.round(this.camera.zoom * 100)}%`;
  }

  // -------------------------------------------------------------
  // SIMULATION & RENDER LOOP
  // -------------------------------------------------------------
  update(dt) {
    if (!this.isPaused) {
      this.simTime += dt * this.timeScale;
      this.sector.evaluateAtTime(this.simTime);
      this.renderer.update(dt * this.timeScale);
      this.updateProbe(dt * this.timeScale);
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Background
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, w, h);

    // Deep space grid
    this.drawBackgroundGrid(ctx);

    // Camera transform
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-this.camera.x, -this.camera.y);

    // Draw Sector Stars & Barycenters
    this.renderer.drawSector(ctx, this.sector, this.simTime, {
      zoom: this.camera.zoom,
      hoveredStar: this.hoveredStar,
      selectedStar: this.selectedStar,
      showBinaryOrbits: this.showBinaryOrbits,
      showGravityWells: this.showGravityWells,
      showLabels: this.showLabels,
      showAllWells: this.showAllWells
    });

    // Draw Probe & Trail
    this.drawProbe(ctx);

    ctx.restore();
  }

  drawProbe(ctx) {
    const invZoom = 1 / Math.max(0.01, this.camera.zoom);

    // Trail
    if (this.probeTrail.length > 1) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(this.probeTrail[0].x, this.probeTrail[0].y);
      for (let i = 1; i < this.probeTrail.length; i++) {
        ctx.lineTo(this.probeTrail[i].x, this.probeTrail[i].y);
      }
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.lineWidth = 1.6 * invZoom;
      ctx.stroke();
      ctx.restore();
    }

    // Probe beacon
    if (this.probe) {
      ctx.save();
      ctx.translate(this.probe.pos.x, this.probe.pos.y);
      ctx.beginPath();
      ctx.arc(0, 0, 4 * invZoom, 0, Math.PI * 2);
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2 * invZoom;
      ctx.stroke();
      ctx.restore();
    }
  }

  drawBackgroundGrid(ctx) {
    const gridSize = 140 * this.camera.zoom;
    const offsetX = (this.canvas.width / 2 - this.camera.x * this.camera.zoom) % gridSize;
    const offsetY = (this.canvas.height / 2 - this.camera.y * this.camera.zoom) % gridSize;

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
  // UI & TELEMETRY SYNC
  // -------------------------------------------------------------
  updateStatsUI() {
    const analysis = analyzePopulation(this.sector.stars);

    // Update Diversity Badge
    const diversityEl = document.getElementById('stat-diversity');
    if (diversityEl) {
      diversityEl.innerText = `${analysis.diversityScore.toFixed(1)}%`;
      diversityEl.style.color = analysis.diversityScore > 75 ? '#34d399' : (analysis.diversityScore > 50 ? '#fbbf24' : '#ef4444');
    }

    // Update Star Count Badge
    const countEl = document.getElementById('stat-count');
    if (countEl) countEl.innerText = `${this.sector.stars.length} Bodies (${this.sector.barycenters.length} Binaries)`;

    // Update Distribution Breakdown Table
    const tbody = document.getElementById('distro-table-body');
    if (tbody) {
      tbody.innerHTML = '';
      for (const item of analysis.breakdown) {
        const tr = document.createElement('tr');
        const barWidth = Math.min(100, item.percent * 3);

        tr.innerHTML = `
          <td>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${item.meta.color};"></span>
              <strong>${item.meta.shortName}</strong>
            </div>
          </td>
          <td>${item.count}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="min-width: 38px;">${item.percent.toFixed(1)}%</span>
              <div style="flex: 1; height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden;">
                <div style="width: ${barWidth}%; height: 100%; background: ${item.meta.color};"></div>
              </div>
            </div>
          </td>
          <td style="color: #94a3b8; font-size: 0.72rem;">${item.astroTarget < 0.01 ? '<0.01%' : item.astroTarget.toFixed(1) + '%'}</td>
          <td style="color: #38bdf8; font-size: 0.72rem;">${item.gameTarget.toFixed(1)}%</td>
        `;
        tbody.appendChild(tr);
      }
    }
  }

  updateStarCard(star) {
    const card = document.getElementById('selected-star-card');
    if (!card) return;

    if (!star) {
      card.style.display = 'none';
      return;
    }

    card.style.display = 'block';
    const meta = star.stellarClass;

    document.getElementById('card-star-name').innerText = star.name.toUpperCase();
    document.getElementById('card-star-name').style.color = meta.color;
    document.getElementById('card-star-class').innerText = meta.name;
    document.getElementById('card-star-temp').innerText = meta.temperatureK > 0 ? `${meta.temperatureK.toLocaleString()} K` : 'N/A (Horizon)';
    document.getElementById('card-star-mass').innerText = `${meta.solarMasses} M☉ (Game M: ${star.mass.toLocaleString()})`;
    document.getElementById('card-star-radius').innerText = `${star.radius} AU`;
    document.getElementById('card-star-type').innerText = star.isBinary ? `Binary Pair (${star.isPrimary ? 'Primary' : 'Companion'})` : 'Solitary Star';
    document.getElementById('card-star-desc').innerText = meta.description;
    document.getElementById('card-star-mechanic').innerText = meta.gameplayMechanics;
  }
}
