import { Vector2 } from './vector.js';

export class CelestialBody {
  constructor(config) {
    this.id = config.id || 'body';
    this.name = config.name || 'Unnamed';
    this.parent = config.parent || null; // Parent CelestialBody reference
    this.mass = config.mass || 1000;
    this.radius = config.radius || 20;
    
    // Orbital parameters
    this.orbitRadius = config.orbitRadius || 0;
    this.orbitSpeed = config.orbitSpeed || 0; // rad/s
    this.initialOrbitAngle = config.initialOrbitAngle || 0;
    this.orbitAngle = this.initialOrbitAngle;

    // Axial rotation parameters
    this.rotationSpeed = config.rotationSpeed || 0; // rad/s (positive = CCW, negative = CW)
    this.initialRotationAngle = config.initialRotationAngle || 0;
    this.rotationAngle = this.initialRotationAngle;

    // Sphere of Influence (SOI)
    if (this.parent && this.parent.mass > 0) {
      // Standard Laplace Sphere of Influence radius: R * (m / M)^(2/5)
      const ratio = this.mass / this.parent.mass;
      this.soiRadius = Math.max(this.radius * 2.5, this.orbitRadius * Math.pow(ratio, 0.4));
    } else {
      this.soiRadius = this.radius * 4.0;
    }

    // Custom aesthetics
    this.color = config.color || '#4488ff';
    this.glowColor = config.glowColor || 'rgba(68, 136, 255, 0.3)';
    this.surfaceDetailCount = config.surfaceDetailCount || 6;
    this.isStar = config.isStar || false;
    this.hasRings = config.hasRings || false;
    this.ringRadius = config.ringRadius || this.radius * 2.2;

    // Cached global position & velocity
    this.position = new Vector2(0, 0);
    this.velocity = new Vector2(0, 0);

    this.evaluateAtTime(0);
  }

  reset() {
    this.orbitAngle = this.initialOrbitAngle;
    this.rotationAngle = this.initialRotationAngle;
    this.evaluateAtTime(0);
  }

  evaluateAtTime(t) {
    this.orbitAngle = this.initialOrbitAngle + this.orbitSpeed * t;
    this.rotationAngle = this.initialRotationAngle + this.rotationSpeed * t;

    if (!this.parent) {
      this.position.set(0, 0);
      this.velocity.set(0, 0);
    } else {
      const parentPos = this.parent.getPositionAtTime(t);
      const parentVel = this.parent.getVelocityAtTime(t);

      const cos = Math.cos(this.orbitAngle);
      const sin = Math.sin(this.orbitAngle);

      this.position.set(
        parentPos.x + this.orbitRadius * cos,
        parentPos.y + this.orbitRadius * sin
      );

      // Orbital tangential velocity
      this.velocity.set(
        parentVel.x - this.orbitRadius * this.orbitSpeed * sin,
        parentVel.y + this.orbitRadius * this.orbitSpeed * cos
      );
    }

    return this.position;
  }

  getPositionAtTime(t) {
    if (!this.parent) return new Vector2(0, 0);
    const parentPos = this.parent.getPositionAtTime(t);
    const angle = this.initialOrbitAngle + this.orbitSpeed * t;
    return new Vector2(
      parentPos.x + this.orbitRadius * Math.cos(angle),
      parentPos.y + this.orbitRadius * Math.sin(angle)
    );
  }

  getVelocityAtTime(t) {
    if (!this.parent) return new Vector2(0, 0);
    const parentVel = this.parent.getVelocityAtTime(t);
    const angle = this.initialOrbitAngle + this.orbitSpeed * t;
    return new Vector2(
      parentVel.x - this.orbitRadius * this.orbitSpeed * Math.sin(angle),
      parentVel.y + this.orbitRadius * this.orbitSpeed * Math.cos(angle)
    );
  }

  getRotationAngleAtTime(t) {
    return this.initialRotationAngle + this.rotationSpeed * t;
  }

  getSurfacePosition(localSurfaceAngle, t) {
    const pos = this.getPositionAtTime(t);
    const totalAngle = this.getRotationAngleAtTime(t) + localSurfaceAngle;
    return new Vector2(
      pos.x + this.radius * Math.cos(totalAngle),
      pos.y + this.radius * Math.sin(totalAngle)
    );
  }

  getSurfaceTangentialVelocity(localSurfaceAngle, t) {
    const totalAngle = this.getRotationAngleAtTime(t) + localSurfaceAngle;
    const speed = this.rotationSpeed * this.radius;
    return new Vector2(
      -Math.sin(totalAngle) * speed,
      Math.cos(totalAngle) * speed
    );
  }

  draw(ctx, t, options = {}) {
    const zoom = options.zoom || 1.0;
    const invZoom = 1 / Math.max(0.01, zoom);

    // 1. Draw Faint Dotted/Dashed Orbit Track for Planets ONLY (omitting small moons)
    // A planet directly orbits a central star/anchor (i.e. parent is a star or has no higher parent)
    const isPlanet = this.parent && (this.parent.isStar || !this.parent.parent);
    if (isPlanet && options.showOrbits !== false) {
      const parentPos = this.parent.getPositionAtTime(t);
      ctx.save();
      ctx.beginPath();
      ctx.arc(parentPos.x, parentPos.y, this.orbitRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
      ctx.lineWidth = 1 * invZoom;
      ctx.setLineDash([4 * invZoom, 6 * invZoom]);
      ctx.stroke();
      ctx.restore();
    }

    const pos = this.position;
    const rot = this.rotationAngle;

    ctx.save();
    ctx.translate(pos.x, pos.y);

    // 2. Draw Sphere of Influence / Gravity Well if requested
    if (!this.isStar && options.showGravityWells !== false) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, this.soiRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
      ctx.lineWidth = 1 * invZoom;
      ctx.setLineDash([4 * invZoom, 8 * invZoom]);
      ctx.stroke();

      // Subtle radial gravity field gradient
      const soiGrad = ctx.createRadialGradient(0, 0, this.radius, 0, 0, this.soiRadius);
      soiGrad.addColorStop(0, 'rgba(56, 189, 248, 0.08)');
      soiGrad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');
      ctx.fillStyle = soiGrad;
      ctx.fill();
      ctx.restore();
    }

    // 3. Planetary Rings (if Saturn-like)
    if (this.hasRings) {
      ctx.save();
      ctx.rotate(-0.4);
      ctx.beginPath();
      ctx.ellipse(0, 0, this.ringRadius, this.ringRadius * 0.45, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.35)';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();
    }

    // 4. Glow / Atmosphere
    const glowGrad = ctx.createRadialGradient(0, 0, this.radius * 0.7, 0, 0, this.radius * 1.9);
    glowGrad.addColorStop(0, this.glowColor);
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 1.9, 0, Math.PI * 2);
    ctx.fillStyle = glowGrad;
    ctx.fill();

    // 5. Body Core
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.2 * invZoom;
    ctx.stroke();

    // 6. Surface Features showing axial rotation
    ctx.save();
    ctx.rotate(rot);
    for (let i = 0; i < this.surfaceDetailCount; i++) {
      const angle = (i * Math.PI * 2) / this.surfaceDetailCount;
      const x = Math.cos(angle) * (this.radius * 0.65);
      const y = Math.sin(angle) * (this.radius * 0.65);
      const detailRadius = this.radius * 0.18;

      ctx.beginPath();
      ctx.arc(x, y, detailRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fill();

      // Outer surface notch
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * (this.radius * 0.85), Math.sin(angle) * (this.radius * 0.85));
      ctx.lineTo(Math.cos(angle) * this.radius, Math.sin(angle) * this.radius);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.5 * invZoom;
      ctx.stroke();
    }
    ctx.restore();

    // 7. Spin Direction Indicator Arrow
    if (Math.abs(this.rotationSpeed) > 0.001) {
      ctx.save();
      const spinRadius = this.radius + 5 * invZoom;
      ctx.beginPath();
      const isCCW = this.rotationSpeed > 0;
      ctx.arc(0, 0, spinRadius, 0, Math.PI * 0.75, !isCCW);
      ctx.strokeStyle = isCCW ? 'rgba(56, 189, 248, 0.55)' : 'rgba(244, 114, 182, 0.55)';
      ctx.lineWidth = 1.2 * invZoom;
      ctx.setLineDash([2 * invZoom, 3 * invZoom]);
      ctx.stroke();
      ctx.restore();
    }

    // 8. Name Label (Constant screen size!)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = 'bold ' + Math.max(7, Math.round(9 * invZoom)) + 'px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.name, 0, this.radius + 14 * invZoom);

    ctx.restore();
  }
}
