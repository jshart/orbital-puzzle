import { Vector2 } from './vector.js';

export class Rocket {
  constructor(config = {}) {
    this.state = 'DOCKED'; // 'DOCKED', 'FLYING', 'BURNING', 'CRASHED', 'OUT_OF_BOUNDS', 'SUCCESS'
    this.failureReason = '';

    // Docking config
    this.dockedBody = config.dockedBody || null;
    this.dockedAngle = config.dockedAngle || 0; // Local angle on body surface

    // Launch parameters
    this.launchAngleOffset = 0; // Relative to surface normal (-Math.PI/2 to Math.PI/2)
    this.launchThrust = 28; // Calm delta-v impulse calibrated for gravity assists

    // Physics
    this.pos = new Vector2(0, 0);
    this.vel = new Vector2(0, 0);
    this.heading = 0;

    // Fuel and Mid-Flight Continuous RCS Thrusters
    this.maxFuel = config.maxFuel || 100;
    this.fuel = this.maxFuel;
    this.activeTrim = null; // 'PROGRADE' | 'RETROGRADE' | null

    // Trail
    this.trail = [];
    this.maxTrailLength = 260;

    // Burn animation particles
    this.burnParticles = [];

    // Collision & Bounds
    this.crashBodyName = '';
    this.flightTime = 0;
  }

  reset(dockedBody, dockedAngle = 0, t = 0) {
    this.state = 'DOCKED';
    this.failureReason = '';
    this.dockedBody = dockedBody;
    this.dockedAngle = dockedAngle;
    this.fuel = this.maxFuel;
    this.activeTrim = null;
    this.trail = [];
    this.burnParticles = [];
    this.vel.set(0, 0);
    this.crashBodyName = '';
    this.flightTime = 0;
    this.updateDockedPosition(t);
  }

  updateDockedPosition(t) {
    if (!this.dockedBody) return;
    this.pos = this.dockedBody.getSurfacePosition(this.dockedAngle, t);
    // Rocket always stands straight up on pad (surface normal)
    const surfaceNormalAngle = this.dockedBody.getRotationAngleAtTime(t) + this.dockedAngle;
    this.heading = surfaceNormalAngle;
  }

  getLaunchVelocity(t) {
    if (!this.dockedBody) return new Vector2(0, 0);

    // 1. Orbital velocity of parent body through space
    const vOrbit = this.dockedBody.getVelocityAtTime(t);

    // 2. Tangential velocity of planetary surface due to axial spin
    const vSurfaceSpin = this.dockedBody.getSurfaceTangentialVelocity(this.dockedAngle, t);

    // 3. Rocket booster impulse (straight up from surface normal)
    const normalAngle = this.dockedBody.getRotationAngleAtTime(t) + this.dockedAngle;
    const vBooster = Vector2.fromAngle(normalAngle, this.launchThrust);

    // Combined launch vector
    const totalVel = new Vector2(0, 0);
    totalVel.add(vOrbit);
    totalVel.add(vSurfaceSpin);
    totalVel.add(vBooster);

    return {
      totalVel,
      vOrbit,
      vSurfaceSpin,
      vBooster
    };
  }

  launch(t) {
    if (this.state !== 'DOCKED') return;
    this.updateDockedPosition(t);
    const { totalVel } = this.getLaunchVelocity(t);
    this.vel.copy(totalVel);
    this.state = 'FLYING';
    this.flightTime = 0;
    this.heading = this.vel.angle();
    this.trail = [this.pos.clone()];
  }

  /**
   * Sets continuous RCS trim mode: 'PROGRADE' | 'RETROGRADE' | null
   */
  setTrim(type) {
    if (this.state === 'FLYING' && this.fuel > 0) {
      this.activeTrim = type;
    } else {
      this.activeTrim = null;
    }
  }

  /**
   * Applies an instantaneous or one-tick trim nudge if tapped
   */
  applyOrbitalTrim(type = 'PROGRADE', deltaV = 3.5) {
    if (this.state !== 'FLYING' || this.fuel <= 0 || this.vel.mag() < 0.1) return false;

    const unit = this.vel.clone().normalize();
    const impulse = (type === 'PROGRADE') ? deltaV : -deltaV;
    const burnVector = Vector2.scale(unit, impulse);

    this.vel.add(burnVector);
    this.fuel = Math.max(0, this.fuel - deltaV * 3.0);
    this.heading = this.vel.angle();

    // Spawn bold exhaust burst
    const particleAngle = (type === 'PROGRADE') ? this.heading + Math.PI : this.heading;
    for (let i = 0; i < 28; i++) {
      this.burnParticles.push({
        pos: this.pos.clone(),
        vel: Vector2.fromAngle(particleAngle + (Math.random() - 0.5) * 0.7, Math.random() * 45 + 20),
        life: 1.2,
        color: (type === 'PROGRADE') ? '#38bdf8' : '#f43f5e',
        size: Math.random() * 3.5 + 2.5
      });
    }

    return true;
  }

  update(dt, t) {
    // 1. Update burn particles
    for (let i = this.burnParticles.length - 1; i >= 0; i--) {
      const p = this.burnParticles[i];
      p.pos.add(Vector2.scale(p.vel, dt));
      p.life -= dt * 2.0;
      if (p.life <= 0) {
        this.burnParticles.splice(i, 1);
      }
    }

    if (this.state === 'DOCKED') {
      this.updateDockedPosition(t);
      return;
    }

    if (this.state !== 'FLYING') return;

    // 2. Continuous RCS thruster firing if key/button held down
    if (this.activeTrim && this.fuel > 0) {
      const burnAcc = 16;  // m/s^2 continuous thrust
      const burnRate = 22; // Percent per second (gives ~4.5s total continuous burn)
      const fuelCost = burnRate * dt;

      if ((this.activeTrim === 'TARGET_BRAKE' || this.activeTrim === 'RETROGRADE') && this.targetRelativeVector && this.targetRelativeVector.mag() > 0.1) {
        this.fuel = Math.max(0, this.fuel - fuelCost);
        const relUnit = this.targetRelativeVector.clone().normalize();
        const impulse = -burnAcc * dt;
        this.vel.add(Vector2.scale(relUnit, impulse));
        this.heading = this.vel.angle();

        // Particles streaming in direction of relative drift
        const particleAngle = relUnit.angle();
        for (let i = 0; i < 4; i++) {
          this.burnParticles.push({
            pos: this.pos.clone(),
            vel: Vector2.fromAngle(particleAngle + (Math.random() - 0.5) * 0.5, Math.random() * 45 + 20),
            life: 0.9,
            color: '#f59e0b',
            size: Math.random() * 3 + 2.5
          });
        }
      } else if (this.vel.mag() > 0.1) {
        this.fuel = Math.max(0, this.fuel - fuelCost);
        const unit = this.vel.clone().normalize();
        const impulse = (this.activeTrim === 'PROGRADE') ? burnAcc * dt : -burnAcc * dt;
        this.vel.add(Vector2.scale(unit, impulse));
        this.heading = this.vel.angle();

        // Spawn continuous streaming particles
        const particleAngle = (this.activeTrim === 'PROGRADE') ? this.heading + Math.PI : this.heading;
        for (let i = 0; i < 4; i++) {
          this.burnParticles.push({
            pos: this.pos.clone(),
            vel: Vector2.fromAngle(particleAngle + (Math.random() - 0.5) * 0.5, Math.random() * 45 + 20),
            life: 0.9,
            color: (this.activeTrim === 'PROGRADE') ? '#38bdf8' : '#f43f5e',
            size: Math.random() * 3 + 2.5
          });
        }
      }

      if (this.fuel <= 0) {
        this.activeTrim = null;
      }
    }

    this.flightTime += dt;

    // Heading aligns with current velocity vector
    this.heading = this.vel.angle();

    // Record trail
    if (this.trail.length === 0 || this.pos.distSq(this.trail[this.trail.length - 1]) > 9) {
      this.trail.push(this.pos.clone());
      if (this.trail.length > this.maxTrailLength) {
        this.trail.shift();
      }
    }

    // Bounds check (out of solar system)
    if (this.pos.mag() > 2800) {
      this.state = 'OUT_OF_BOUNDS';
      this.failureReason = 'Lost in Deep Space (Escaped Solar System)';
    }
  }

  draw(ctx, t, camera) {
    const zoom = camera ? camera.zoom : 1.0;
    const invZoom = 1 / Math.max(0.01, zoom);

    // 1. Draw Exhaust Particles
    for (const p of this.burnParticles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, (p.size || 2.5) * invZoom, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();
    }

    // 2. Draw Flight Trail
    if (this.trail.length > 1) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(this.trail[0].x, this.trail[0].y);
      for (let i = 1; i < this.trail.length; i++) {
        ctx.lineTo(this.trail[i].x, this.trail[i].y);
      }
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
      ctx.lineWidth = 1.5 * invZoom;
      ctx.stroke();
      ctx.restore();
    }

    // 3. Draw Launch Pad if DOCKED
    if (this.state === 'DOCKED' && this.dockedBody) {
      ctx.save();
      ctx.translate(this.pos.x, this.pos.y);
      ctx.rotate(this.dockedBody.getRotationAngleAtTime(t) + this.dockedAngle);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-6, -2, 12, 4);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1 * invZoom;
      ctx.strokeRect(-6, -2, 12, 4);
      ctx.restore();
    }

    // 4. Draw Rocket Body
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.heading);

    if (this.state === 'CRASHED') {
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.8 * invZoom;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-10, -10); ctx.lineTo(10, 10);
      ctx.moveTo(10, -10); ctx.lineTo(-10, 10);
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 2.2 * invZoom;
      ctx.stroke();
      ctx.restore();
      return;
    }

    // Active Thruster Jet Plume
    if (this.activeTrim && this.fuel > 0) {
      ctx.save();
      if (this.activeTrim === 'PROGRADE') {
        // High-intensity trailing plume
        const plumeLen = 22 + Math.random() * 12;
        ctx.beginPath();
        ctx.moveTo(-5, -3);
        ctx.lineTo(-plumeLen, 0);
        ctx.lineTo(-5, 3);
        ctx.closePath();
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 14;
        ctx.fill();

        // Inner white-hot core
        ctx.beginPath();
        ctx.moveTo(-5, -1.5);
        ctx.lineTo(-plumeLen * 0.55, 0);
        ctx.lineTo(-5, 1.5);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      } else {
        // High-intensity braking reverse side jets
        ctx.beginPath();
        ctx.moveTo(2, -4);
        ctx.lineTo(8 + Math.random() * 8, -12);
        ctx.lineTo(0, -6);
        ctx.closePath();
        ctx.fillStyle = '#f43f5e';
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 12;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(2, 4);
        ctx.lineTo(8 + Math.random() * 8, 12);
        ctx.lineTo(0, 6);
        ctx.closePath();
        ctx.fillStyle = '#f43f5e';
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 12;
        ctx.fill();
      }
      ctx.restore();
    }

    // Rocket fuselage
    ctx.beginPath();
    ctx.moveTo(12, 0);       // Nose
    ctx.lineTo(-8, -6);     // Left fin
    ctx.lineTo(-5, 0);      // Engine nozzle base
    ctx.lineTo(-8, 6);      // Right fin
    ctx.closePath();

    ctx.fillStyle = this.state === 'SUCCESS' ? '#34d399' : '#f8fafc';
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.2 * invZoom;
    ctx.stroke();

    // Cockpit window
    ctx.beginPath();
    ctx.arc(2, 0, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();

    ctx.restore();
  }
}
