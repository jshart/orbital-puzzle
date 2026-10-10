import { Vector2 } from './vector.js';

export class Waypoint {
  constructor(config = {}) {
    this.id = config.id || 'waypoint';
    this.name = config.name || 'Target Station';
    this.parent = config.parent || null; // Can orbit a star, planet, or moon!
    
    // Orbit parameters if attached to a body
    this.orbitRadius = config.orbitRadius || 0;
    this.orbitSpeed = config.orbitSpeed || 0; // rad/s
    this.initialOrbitAngle = config.initialOrbitAngle || 0;

    // Stationary position if not orbiting
    this.fixedPosition = config.position ? config.position.clone() : new Vector2(0, 0);

    // Capture SOI parameters
    this.captureRadius = config.captureRadius || 30;
    this.maxCaptureSpeed = config.maxCaptureSpeed !== undefined ? config.maxCaptureSpeed : 16.0; // m/s relative speed limit
    this.isCaptured = false;
    this.pulsePhase = 0;

    this.position = new Vector2(0, 0);
    this.evaluateAtTime(0);
  }

  reset() {
    this.isCaptured = false;
    this.pulsePhase = 0;
    this.evaluateAtTime(0);
  }

  evaluateAtTime(t) {
    this.pulsePhase = (this.pulsePhase + 0.05) % (Math.PI * 2);
    if (!this.parent) {
      this.position.copy(this.fixedPosition);
    } else {
      const parentPos = this.parent.getPositionAtTime(t);
      const angle = this.initialOrbitAngle + this.orbitSpeed * t;
      this.position.set(
        parentPos.x + this.orbitRadius * Math.cos(angle),
        parentPos.y + this.orbitRadius * Math.sin(angle)
      );
    }
    return this.position;
  }

  getPositionAtTime(t) {
    if (!this.parent) return this.fixedPosition.clone();
    const parentPos = this.parent.getPositionAtTime(t);
    const angle = this.initialOrbitAngle + this.orbitSpeed * t;
    return new Vector2(
      parentPos.x + this.orbitRadius * Math.cos(angle),
      parentPos.y + this.orbitRadius * Math.sin(angle)
    );
  }

  getVelocityAtTime(t) {
    if (!this.parent) return new Vector2(0, 0);
    const parentVel = this.parent.getVelocityAtTime ? this.parent.getVelocityAtTime(t) : new Vector2(0, 0);
    const angle = this.initialOrbitAngle + this.orbitSpeed * t;
    return new Vector2(
      parentVel.x - this.orbitRadius * this.orbitSpeed * Math.sin(angle),
      parentVel.y + this.orbitRadius * this.orbitSpeed * Math.cos(angle)
    );
  }

  getRelativeVelocity(rocketVel, t) {
    const wpVel = this.getVelocityAtTime(t);
    return new Vector2(rocketVel.x - wpVel.x, rocketVel.y - wpVel.y);
  }

  isInsideSOI(rocketPos) {
    if (!rocketPos || !this.position) return false;
    return this.position.dist(rocketPos) <= this.captureRadius;
  }

  checkCapture(rocketPos, rocketVel, t = 0) {
    if (this.isCaptured) return { captured: true, insideSOI: true, relSpeed: 0 };
    const insideSOI = this.isInsideSOI(rocketPos);

    if (insideSOI) {
      if (rocketVel && this.maxCaptureSpeed) {
        const relVel = this.getRelativeVelocity(rocketVel, t);
        const relSpeed = relVel.mag();
        if (relSpeed <= this.maxCaptureSpeed) {
          this.isCaptured = true;
          return { captured: true, insideSOI: true, relSpeed, maxCaptureSpeed: this.maxCaptureSpeed };
        }
        // Inside SOI, but excess relative velocity
        return { captured: false, insideSOI: true, relSpeed, maxCaptureSpeed: this.maxCaptureSpeed };
      }
      this.isCaptured = true;
      return { captured: true, insideSOI: true, relSpeed: 0 };
    }

    return { captured: false, insideSOI: false, relSpeed: Infinity };
  }

  draw(ctx, t, options = {}) {
    const zoom = options.zoom || 1.0;
    const invZoom = 1 / Math.max(0.01, zoom);
    const pos = this.position;
    ctx.save();
    ctx.translate(pos.x, pos.y);

    // 1. Orbit path line if orbiting
    if (this.parent) {
      const parentPos = this.parent.getPositionAtTime(t);
      ctx.save();
      ctx.translate(-pos.x, -pos.y);
      ctx.beginPath();
      ctx.arc(parentPos.x, parentPos.y, this.orbitRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.18)';
      ctx.lineWidth = 1 * invZoom;
      ctx.setLineDash([3 * invZoom, 5 * invZoom]);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Pulsing capture radius ring (SOI)
    const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.08;
    const ringRadius = this.captureRadius * pulseScale;

    // Glowing outer capture field
    const insideSOI = options.insideSOI;
    const canCapture = options.canCapture;

    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
    if (this.isCaptured) {
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.9)';
      ctx.fillStyle = 'rgba(52, 211, 153, 0.15)';
    } else if (insideSOI && !canCapture) {
      // Inside SOI but going too fast
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
      ctx.fillStyle = 'rgba(251, 191, 36, 0.1)';
    } else {
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
      ctx.fillStyle = 'rgba(16, 185, 129, 0.04)';
    }
    ctx.lineWidth = 1.5 * invZoom;
    ctx.setLineDash([4 * invZoom, 4 * invZoom]);
    ctx.stroke();
    ctx.fill();

    // Solid inner station icon (constant screen radius)
    ctx.beginPath();
    ctx.arc(0, 0, 5 * invZoom, 0, Math.PI * 2);
    ctx.fillStyle = this.isCaptured ? '#10b981' : (insideSOI && !canCapture ? '#f59e0b' : '#34d399');
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Station crosshairs / solar panels (constant screen size)
    const armInner = 5 * invZoom;
    const armOuter = 11 * invZoom;
    ctx.beginPath();
    ctx.moveTo(-armOuter, 0); ctx.lineTo(-armInner, 0);
    ctx.moveTo(armInner, 0); ctx.lineTo(armOuter, 0);
    ctx.moveTo(0, -armOuter); ctx.lineTo(0, -armInner);
    ctx.moveTo(0, armInner); ctx.lineTo(0, armOuter);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 1.2 * invZoom;
    ctx.setLineDash([]);
    ctx.stroke();

    // Station Label (constant screen font size)
    ctx.fillStyle = this.isCaptured ? '#34d399' : (insideSOI && !canCapture ? '#fbbf24' : '#6ee7b7');
    ctx.font = 'bold ' + Math.max(7, Math.round(9 * invZoom)) + 'px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    const label = this.isCaptured ? '★ DOCKED' : (insideSOI && !canCapture ? 'BRAKE TO CAPTURE' : this.name.toUpperCase());
    ctx.fillText(label, 0, -this.captureRadius - 6 * invZoom);

    ctx.restore();
  }
}
