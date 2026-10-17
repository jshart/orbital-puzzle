/**
 * Galactic Sector - Specialized Canvas 2D Stellar Renderer
 * Renders diverse spectral types, coronas, accretion disks, photon rings,
 * pulsar magnetic beams, and binary barycenter orbital tracks.
 */

export class StellarRenderer {
  constructor() {
    this.animationPhase = 0;
  }

  update(dt) {
    this.animationPhase = (this.animationPhase + dt) % (Math.PI * 200);
  }

  drawSector(ctx, sector, t, options = {}) {
    const zoom = options.zoom || 1.0;
    const invZoom = 1 / Math.max(0.01, zoom);

    // 1. Soft Core Bulge Radial Glow
    if (sector.centerAnchor || sector.coreRadius) {
      ctx.save();
      const coreGlowRad = (sector.coreRadius || 260) * 1.5;
      const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, coreGlowRad);
      grad.addColorStop(0, 'rgba(254, 240, 138, 0.22)');
      grad.addColorStop(0.3, 'rgba(251, 146, 60, 0.12)');
      grad.addColorStop(0.7, 'rgba(168, 85, 247, 0.05)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.beginPath();
      ctx.arc(0, 0, coreGlowRad, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    }

    // 2. Draw Interstellar Nebula & Dust Clouds (bulks out the spiral arms)
    if (sector.nebula && options.showNebula !== false) {
      sector.nebula.draw(ctx, t, zoom, options);
    }

    // 3. Draw Binary Barycenter Tracks & Tethers (fade in at sector/system zoom)
    if (options.showBinaryOrbits !== false && zoom >= 0.40) {
      const trackAlpha = Math.min(1.0, (zoom - 0.40) / 0.35);
      ctx.save();
      ctx.globalAlpha = trackAlpha;
      for (const bary of sector.barycenters) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(bary.position.x, bary.position.y, bary.separation * 0.55, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
        ctx.lineWidth = 1 * invZoom;
        ctx.setLineDash([3 * invZoom, 6 * invZoom]);
        ctx.stroke();

        // Barycenter marker cross
        const crossSize = 3 * invZoom;
        ctx.beginPath();
        ctx.moveTo(bary.position.x - crossSize, bary.position.y);
        ctx.lineTo(bary.position.x + crossSize, bary.position.y);
        ctx.moveTo(bary.position.x, bary.position.y - crossSize);
        ctx.lineTo(bary.position.x, bary.position.y + crossSize);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
        ctx.lineWidth = 1 * invZoom;
        ctx.setLineDash([]);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }

    // 4. Draw All Stars (Unified population with consistent scaling)
    for (const star of sector.stars) {
      this.drawStar(ctx, star, t, zoom, options);
    }
  }

  drawStar(ctx, star, t, zoom, options = {}) {
    const invZoom = 1 / Math.max(0.01, zoom);
    const pos = star.position;
    const meta = star.stellarClass;
    const isHovered = options.hoveredStar && options.hoveredStar.id === star.id;
    const isSelected = options.selectedStar && options.selectedStar.id === star.id;

    ctx.save();
    ctx.translate(pos.x, pos.y);

    // Viewport Culling
    if (options.viewport) {
      const margin = (star.soiRadius || 120) + 60;
      if (
        pos.x < options.viewport.minX - margin ||
        pos.x > options.viewport.maxX + margin ||
        pos.y < options.viewport.minY - margin ||
        pos.y > options.viewport.maxY + margin
      ) {
        ctx.restore();
        return;
      }
    }

    // -------------------------------------------------------------
    // UNIFIED STELLAR SCALING FORMULA
    // minScreenPx clamps distant stars to clean pinpricks (1.1 - 2.0 px)
    // basePhysicalR scales gracefully with square-root damping so stars don't overlap
    // -------------------------------------------------------------
    const basePhysicalR = star.isCoreAnchor ? 10.0 : Math.min(12.0, 2.2 + Math.sqrt(star.radius) * 1.35);
    const minScreenPx = Math.max(1.1, Math.min(2.0, 1.1 + (meta.gameRadius || 12) * 0.035));
    const minWorldR = minScreenPx * invZoom;
    const effectiveR = Math.max(basePhysicalR, minWorldR);
    const screenR = effectiveR * zoom;

    // PHASE 1: MACRO GALACTIC PINPRICK VIEW (Screen radius < 3.2px and unselected)
    if (screenR < 3.2 && !isHovered && !isSelected) {
      if (star.isCoreAnchor) {
        // Central Sagittarius Prime (SMBH): compact black hole with screen-scaled accretion disk
        const bhR = Math.max(3.8 * invZoom, effectiveR * 0.6);
        const diskR = bhR * 2.8;
        ctx.beginPath();
        ctx.ellipse(0, 0, diskR, diskR * 0.38, 0.35, 0, Math.PI * 2);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.8 * invZoom;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, bhR, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1 * invZoom;
        ctx.stroke();
      } else {
        // Subtle soft halo for hot/luminous stars (O, B, Red Giants)
        if (meta.category === 'EVOLVED' || meta.spectralClass === 'O' || meta.spectralClass === 'B') {
          ctx.beginPath();
          ctx.arc(0, 0, effectiveR * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = meta.coronaColor;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(0, 0, effectiveR, 0, Math.PI * 2);
        ctx.fillStyle = meta.color;
        ctx.fill();
      }

      // Macro label for prominent landmark stars (e.g. Sol Prime, SMBH)
      if (options.showLabels !== false && star.isProminent && zoom >= 0.24) {
        const fontSize = Math.max(8, Math.round(8.5 * invZoom));
        ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.fillText(star.name, 0, effectiveR + 13 * invZoom);
      }

      ctx.restore();
      return;
    }

    // Gravity Well (SOI) if requested
    if (options.showGravityWells !== false && (isHovered || isSelected || (star.isCoreAnchor && zoom >= 0.35) || (options.showAllWells && zoom >= 0.50))) {
      const wellAlpha = (isSelected || isHovered) ? 1.0 : Math.min(1.0, (zoom - 0.40) / 0.30);
      ctx.save();
      ctx.globalAlpha = wellAlpha;
      ctx.beginPath();
      ctx.arc(0, 0, star.soiRadius, 0, Math.PI * 2);
      ctx.strokeStyle = (isSelected || isHovered) ? 'rgba(56, 189, 248, 0.45)' : 'rgba(148, 163, 184, 0.08)';
      ctx.lineWidth = 1 * invZoom;
      ctx.setLineDash([4 * invZoom, 8 * invZoom]);
      ctx.stroke();

      const soiGrad = ctx.createRadialGradient(0, 0, effectiveR, 0, 0, star.soiRadius);
      soiGrad.addColorStop(0, meta.coronaColor);
      soiGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = soiGrad;
      ctx.fill();
      ctx.restore();
    }

    // -------------------------------------------------------------
    // PHASE 2: PROGRESSIVE DETAIL RENDERING (All Stars scale consistently!)
    // -------------------------------------------------------------
    if (meta.hasAccretionDisk) {
      this.drawBlackHole(ctx, star, meta, invZoom, effectiveR);
    } else if (meta.hasMagneticBeams) {
      this.drawPulsar(ctx, star, meta, t, invZoom, effectiveR);
    } else {
      this.drawStandardStar(ctx, star, meta, invZoom, zoom, effectiveR, screenR);
    }

    // Selection / Hover Target Reticle
    if (isSelected || isHovered) {
      ctx.save();
      const reticleRadius = Math.max(effectiveR * 1.6, 18 * invZoom);
      ctx.beginPath();
      ctx.arc(0, 0, reticleRadius, 0, Math.PI * 2);
      ctx.strokeStyle = isSelected ? '#38bdf8' : 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 1.5 * invZoom;
      ctx.setLineDash([4 * invZoom, 4 * invZoom]);
      ctx.stroke();

      // Corner brackets
      const bSize = 6 * invZoom;
      const bOffset = reticleRadius + 4 * invZoom;
      ctx.strokeStyle = isSelected ? '#38bdf8' : '#67e8f9';
      ctx.lineWidth = 1.8 * invZoom;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(-bOffset, -bOffset + bSize); ctx.lineTo(-bOffset, -bOffset); ctx.lineTo(-bOffset + bSize, -bOffset);
      ctx.moveTo(bOffset - bSize, -bOffset); ctx.lineTo(bOffset, -bOffset); ctx.lineTo(bOffset, -bOffset + bSize);
      ctx.moveTo(-bOffset, bOffset - bSize); ctx.lineTo(-bOffset, bOffset); ctx.lineTo(-bOffset + bSize, bOffset);
      ctx.moveTo(bOffset - bSize, bOffset); ctx.lineTo(bOffset, bOffset); ctx.lineTo(bOffset, bOffset - bSize);
      ctx.stroke();
      ctx.restore();
    }

    // Star Name & Class Badge (fades in progressively with zoom or on hover/select)
    const shouldShowLabel = options.showLabels !== false && (
      isHovered || isSelected ||
      (star.isProminent && zoom >= 0.28) ||
      (zoom >= 0.65)
    );

    if (shouldShowLabel) {
      const labelAlpha = (isHovered || isSelected) ? 1.0 : Math.min(1.0, (zoom - 0.28) / 0.35);
      ctx.save();
      ctx.globalAlpha = labelAlpha;
      const fontSize = Math.max(8, Math.round(9 * invZoom));
      ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';

      // Star Name
      ctx.fillStyle = isSelected ? '#38bdf8' : (isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.85)');
      ctx.fillText(star.name, 0, effectiveR + 15 * invZoom);

      // Spectral Class Tag (at zoom >= 0.85 or on select/hover)
      if (zoom >= 0.85 || isHovered || isSelected) {
        ctx.font = `${Math.max(7, Math.round(7.5 * invZoom))}px "JetBrains Mono", monospace`;
        ctx.fillStyle = meta.color;
        ctx.fillText(`[${meta.shortName}] M:${Math.round(star.mass / 1000)}k`, 0, effectiveR + 26 * invZoom);
      }
      ctx.restore();
    }

    ctx.restore();
  }

  drawStandardStar(ctx, star, meta, invZoom, zoom = 1.0, r = star.radius, screenR = r * zoom) {
    const detailT = Math.max(0, Math.min(1, (screenR - 3.0) / 4.0));

    // 1. Outer Corona Glow (scales in smoothly with apparent size)
    if (detailT > 0.05) {
      const coronaRad = r * (meta.category === 'EVOLVED' ? 1.4 : 1.7) * (0.5 + 0.5 * detailT);
      const grad = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, coronaRad);
      grad.addColorStop(0, meta.coronaColor);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.beginPath();
      ctx.arc(0, 0, coronaRad, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // 2. White Dwarf Diffraction Spikes
    if (meta.id === 'WHITE_DWARF' && detailT > 0.25) {
      ctx.save();
      ctx.globalAlpha = detailT;
      const spikeLen = 28 * invZoom;
      ctx.strokeStyle = 'rgba(103, 232, 249, 0.7)';
      ctx.lineWidth = 1.2 * invZoom;
      ctx.beginPath();
      ctx.moveTo(-spikeLen, 0); ctx.lineTo(spikeLen, 0);
      ctx.moveTo(0, -spikeLen); ctx.lineTo(0, spikeLen);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Stellar Core
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = meta.color;
    ctx.fill();

    // 4. White-Hot Nuclear Core Center
    if (meta.id !== 'BROWN_DWARF' && detailT > 0.15) {
      const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.7);
      coreGrad.addColorStop(0, meta.coreColor || '#ffffff');
      coreGrad.addColorStop(1, meta.color);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();
    }

    // 5. Chromospheric Rim
    if (detailT > 0.25) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 * detailT})`;
      ctx.lineWidth = 1.2 * invZoom;
      ctx.stroke();
    }
  }

  drawPulsar(ctx, star, meta, t, invZoom, r = star.radius) {
    const beamAngle = (t * meta.beamSpeed) % (Math.PI * 2);

    // 1. Dual Sweeping Relativistic Magnetic Radiation Beams
    ctx.save();
    ctx.rotate(beamAngle);

    const beamLen = meta.beamLength || 140;
    const beamWidth = 22 * invZoom;

    // Prograde beam
    const beamGrad1 = ctx.createLinearGradient(0, 0, beamLen, 0);
    beamGrad1.addColorStop(0, 'rgba(56, 189, 248, 0.85)');
    beamGrad1.addColorStop(0.3, 'rgba(14, 165, 233, 0.45)');
    beamGrad1.addColorStop(1, 'rgba(14, 165, 233, 0.0)');

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(beamLen, -beamWidth * 0.5);
    ctx.lineTo(beamLen, beamWidth * 0.5);
    ctx.closePath();
    ctx.fillStyle = beamGrad1;
    ctx.fill();

    // Retrograde beam (180 opposite)
    const beamGrad2 = ctx.createLinearGradient(0, 0, -beamLen, 0);
    beamGrad2.addColorStop(0, 'rgba(56, 189, 248, 0.85)');
    beamGrad2.addColorStop(0.3, 'rgba(14, 165, 233, 0.45)');
    beamGrad2.addColorStop(1, 'rgba(14, 165, 233, 0.0)');

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-beamLen, -beamWidth * 0.5);
    ctx.lineTo(-beamLen, beamWidth * 0.5);
    ctx.closePath();
    ctx.fillStyle = beamGrad2;
    ctx.fill();
    ctx.restore();

    // 2. High-Frequency Pulsar Halo
    const pulseMod = 1 + Math.sin(t * 18) * 0.18;
    const haloRad = r * 3.8 * pulseMod;
    const haloGrad = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, haloRad);
    haloGrad.addColorStop(0, 'rgba(56, 189, 248, 0.9)');
    haloGrad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');
    ctx.beginPath();
    ctx.arc(0, 0, haloRad, 0, Math.PI * 2);
    ctx.fillStyle = haloGrad;
    ctx.fill();

    // 3. Dense Neutron Core (White-hot pinprick)
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5 * invZoom;
    ctx.stroke();
  }

  drawBlackHole(ctx, star, meta, invZoom, r = star.radius) {
    const diskR = meta.accretionDiskRadius ? meta.accretionDiskRadius * (r / Math.max(1, star.radius)) : (r * 3.5);

    // 1. Relativistic Gravitational Lensing Aura
    ctx.save();
    const lensGrad = ctx.createRadialGradient(0, 0, r, 0, 0, diskR * 1.5);
    lensGrad.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
    lensGrad.addColorStop(0.4, meta.coronaColor);
    lensGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.beginPath();
    ctx.arc(0, 0, diskR * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = lensGrad;
    ctx.fill();

    // 2. Swirling Accretion Disk (Tilted ellipse with Doppler beaming)
    ctx.rotate(0.35);
    ctx.beginPath();
    ctx.ellipse(0, 0, diskR, diskR * 0.38, 0, 0, Math.PI * 2);
    ctx.strokeStyle = meta.flareColor;
    ctx.lineWidth = 5 * invZoom;
    ctx.stroke();

    // Inner bright accretion ring
    ctx.beginPath();
    ctx.ellipse(0, 0, diskR * 0.75, diskR * 0.28, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2.5 * invZoom;
    ctx.stroke();
    ctx.restore();

    // 3. Luminous Photon Sphere Ring (Einstein Ring)
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.25, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8 * invZoom;
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 4. Pitch Black Event Horizon (Schwarzschild Radius)
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1 * invZoom;
    ctx.stroke();
  }
}
