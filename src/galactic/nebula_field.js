/**
 * Cosmic Cloud & Nebula Field Generator
 * Reusable multi-scale cosmic dust architecture supporting:
 * 1. Galactic Spiral Arm Nebulae & Dark Dust Lanes
 * 2. Circumstellar Debris & Asteroid Belts (Solar scale)
 * 3. Planetary Dust Rings & Radiation Hazes (Planetary scale)
 */

import { Vector2 } from '../vector.js';
import { createRNG, sampleGaussian } from './distribution.js';

export class NebulaField {
  constructor(config = {}) {
    this.type = config.type || 'SPIRAL_ARM_NEBULA';
    this.seed = config.seed !== undefined ? config.seed : 42;
    this.opacity = config.opacity !== undefined ? config.opacity : 1.0;
    
    // Galactic Spiral Parameters
    this.armCount = config.armCount !== undefined ? config.armCount : 2;
    this.winding = config.winding !== undefined ? config.winding : 3.2;
    this.armScatter = config.armScatter !== undefined ? config.armScatter : 0.22;
    this.coreRadius = config.coreRadius !== undefined ? config.coreRadius : 260;
    this.sectorRadius = config.sectorRadius !== undefined ? config.sectorRadius : 1800;

    // Circumstellar / Planetary Ring Parameters
    this.innerRadius = config.innerRadius || 120;
    this.outerRadius = config.outerRadius || 340;
    this.center = config.center || new Vector2(0, 0);

    // Clustered Disc Parameters
    this.clusterHubs = config.clusterHubs || [];

    this.rng = createRNG(this.seed);
    this.puffs = [];

    this.generate();
  }

  generate() {
    this.rng = createRNG(this.seed);
    this.puffs = [];

    if (this.type === 'SPIRAL_ARM_NEBULA') {
      this.generateSpiralNebula();
    } else if (this.type === 'CLUSTERED_DISC_NEBULA' || this.type === 'DISC_NEBULA') {
      this.generateDiscNebula();
    } else if (this.type === 'CIRCUMSTELLAR_BELT') {
      this.generateCircumstellarBelt();
    } else if (this.type === 'PLANETARY_RING') {
      this.generatePlanetaryRing();
    }
  }

  /**
   * Generates natural interstellar dust & molecular gas clouds for a clustered disc galaxy.
   * Features:
   * 1. Warm Central Molecular Zone (CMZ) bulge envelope around the core anchor
   * 2. Organic star-forming emission complexes co-located with stellar cluster nurseries
   * 3. Filamentary dark absorption dust rifts carving silhouettes through the disk
   * 4. Broad diffuse interstellar medium (ISM) haze providing celestial disk cohesion
   */
  generateDiscNebula() {
    // 1. Central Molecular Zone (Bulge Glow Puffs)
    const cmzPuffCount = 8;
    for (let i = 0; i < cmzPuffCount; i++) {
      const u = (i + this.rng() * 0.5) / cmzPuffCount;
      const rDist = 60 + (this.coreRadius * 0.85 - 60) * Math.sqrt(this.rng());
      const angle = u * Math.PI * 2 + (this.rng() - 0.5) * 0.4;
      const radius = 130 + this.rng() * 80;
      
      const colors = [
        { r: 251, g: 191, b: 36, baseAlpha: 0.16 },  // Warm amber
        { r: 245, g: 158, b: 11, baseAlpha: 0.14 },  // Golden core
        { r: 244, g: 63, b: 94, baseAlpha: 0.12 },   // Deep rose
        { r: 192, g: 132, b: 252, baseAlpha: 0.11 }  // Soft lavender
      ];
      const colorObj = colors[i % colors.length];
      const orbitalSpeed = Math.sqrt(80000 / Math.max(100, rDist)) * 0.003;

      this.puffs.push({
        rDist,
        initialAngle: angle,
        currentAngle: angle,
        orbitSpeed: orbitalSpeed,
        radius,
        color: colorObj,
        baseAlpha: colorObj.baseAlpha * (0.85 + this.rng() * 0.3),
        isDarkLane: false,
        pulseRate: 0.18 + this.rng() * 0.25,
        pulsePhase: this.rng() * Math.PI * 2,
        position: new Vector2(Math.cos(angle) * rDist, Math.sin(angle) * rDist)
      });
    }

    // 2. Star-Forming Emission Complexes (H II Nurseries)
    // Co-located with stellar clusters or generated across the disk
    const palettes = [
      // Orion / Cygnus: Deep Cyan & Electric Sky Blue
      [
        { r: 14, g: 165, b: 233, baseAlpha: 0.17 },
        { r: 56, g: 189, b: 248, baseAlpha: 0.15 },
        { r: 99, g: 102, b: 241, baseAlpha: 0.12 }
      ],
      // Carina / Rosette: Radiant Crimson & Rose Pink
      [
        { r: 244, g: 63, b: 94, baseAlpha: 0.17 },
        { r: 236, g: 72, b: 153, baseAlpha: 0.15 },
        { r: 251, g: 113, b: 133, baseAlpha: 0.13 }
      ],
      // Eagle / Pillars: Emerald Gas & Vibrant Teal
      [
        { r: 16, g: 185, b: 129, baseAlpha: 0.16 },
        { r: 45, g: 212, b: 191, baseAlpha: 0.14 },
        { r: 52, g: 211, b: 153, baseAlpha: 0.12 }
      ],
      // Veil / Pleiades: Cosmic Purple & Indigo
      [
        { r: 168, g: 85, b: 247, baseAlpha: 0.16 },
        { r: 129, g: 140, b: 248, baseAlpha: 0.14 },
        { r: 192, g: 132, b: 252, baseAlpha: 0.12 }
      ],
      // Tarantula / Gold: Warm Amber & Golden Haze
      [
        { r: 245, g: 158, b: 11, baseAlpha: 0.16 },
        { r: 251, g: 191, b: 36, baseAlpha: 0.14 },
        { r: 252, g: 211, b: 77, baseAlpha: 0.12 }
      ],
      // Lagoon / Orchid: Bicolor Lavender & Magenta
      [
        { r: 217, g: 70, b: 239, baseAlpha: 0.16 },
        { r: 168, g: 85, b: 247, baseAlpha: 0.14 },
        { r: 244, g: 63, b: 94, baseAlpha: 0.12 }
      ],
      // Swan / Cobalt: Electric Cyan & Soft Cobalt
      [
        { r: 6, g: 182, b: 212, baseAlpha: 0.16 },
        { r: 59, g: 130, b: 246, baseAlpha: 0.14 },
        { r: 14, g: 165, b: 233, baseAlpha: 0.12 }
      ]
    ];

    // 2. Star-Forming Emission Complexes (H II Nurseries)
    // Distributed smoothly across all quadrants (360 degrees) and radial zones of the disk
    const numComplexes = 16;
    for (let cIdx = 0; cIdx < numComplexes; cIdx++) {
      const u = (cIdx + 0.5) / numComplexes;
      const rDistCenter = this.coreRadius * 1.15 + (this.sectorRadius * 0.88 - this.coreRadius * 1.15) * Math.sqrt(u);
      const angleCenter = (cIdx / numComplexes) * Math.PI * 2 + (this.rng() - 0.5) * 0.35;
      const palette = palettes[cIdx % palettes.length];
      const puffsInComplex = 3;
      const hubOrbitSpeed = Math.sqrt(80000 / Math.max(120, rDistCenter)) * 0.003;

      for (let pIdx = 0; pIdx < puffsInComplex; pIdx++) {
        const rOffset = sampleGaussian(this.rng, 0, 42);
        const angleOffset = sampleGaussian(this.rng, 0, 0.05);
        const rDist = Math.max(this.coreRadius * 0.7, rDistCenter + rOffset);
        const finalAngle = angleCenter + angleOffset;
        const radius = 105 + this.rng() * 70;
        const colorObj = palette[pIdx % palette.length];

        this.puffs.push({
          rDist,
          initialAngle: finalAngle,
          currentAngle: finalAngle,
          orbitSpeed: hubOrbitSpeed,
          radius,
          color: colorObj,
          baseAlpha: colorObj.baseAlpha * (0.8 + this.rng() * 0.4),
          isDarkLane: false,
          pulseRate: 0.15 + this.rng() * 0.35,
          pulsePhase: this.rng() * Math.PI * 2,
          position: new Vector2(Math.cos(finalAngle) * rDist, Math.sin(finalAngle) * rDist)
        });
      }
    }

    // 3. Filamentary Dark Absorption Dust Rifts & Silhouette Clouds
    // Weaves organically throughout the disk between emission zones
    const darkFilamentCount = 10;
    for (let fIdx = 0; fIdx < darkFilamentCount; fIdx++) {
      const u = (fIdx + 0.5) / darkFilamentCount;
      const baseR = this.coreRadius * 1.05 + (this.sectorRadius * 0.85 - this.coreRadius * 1.05) * Math.sqrt(u);
      const baseAngle = (fIdx / darkFilamentCount) * Math.PI * 2 + 0.35 + (this.rng() - 0.5) * 0.4;
      const puffsInFilament = 3;
      const orbitalSpeed = Math.sqrt(80000 / Math.max(120, baseR)) * 0.003;

      for (let df = 0; df < puffsInFilament; df++) {
        const rDist = baseR + (df - 1) * 35 + sampleGaussian(this.rng, 0, 16);
        const finalAngle = baseAngle + (df - 1) * 0.06 + (this.rng() - 0.5) * 0.03;
        const radius = 70 + this.rng() * 45;

        this.puffs.push({
          rDist,
          initialAngle: finalAngle,
          currentAngle: finalAngle,
          orbitSpeed: orbitalSpeed,
          radius,
          color: { r: 2, g: 6, b: 18, baseAlpha: 0.62 },
          baseAlpha: 0.52 + this.rng() * 0.25,
          isDarkLane: true,
          pulseRate: 0,
          pulsePhase: 0,
          position: new Vector2(Math.cos(finalAngle) * rDist, Math.sin(finalAngle) * rDist)
        });
      }
    }

    // 4. Broad Diffuse Interstellar Medium (ISM) Ambient Disk Haze
    // Comprehensive celestial gas disk ensuring zero empty/disconnected zones
    const ismPuffCount = 24;
    for (let i = 0; i < ismPuffCount; i++) {
      const u = (i + 0.5) / ismPuffCount;
      const rNorm = 0.15 + 0.80 * Math.sqrt(u);
      const rDist = this.coreRadius * 0.8 + (this.sectorRadius - this.coreRadius * 0.8) * rNorm;
      const angle = (i / ismPuffCount) * Math.PI * 2 + (this.rng() - 0.5) * 0.35;
      const radius = 240 + this.rng() * 120;
      const orbitalSpeed = Math.sqrt(80000 / Math.max(120, rDist)) * 0.003;

      const ismColors = [
        { r: 30, g: 58, b: 138, baseAlpha: 0.08 }, // Soft royal blue
        { r: 55, g: 48, b: 163, baseAlpha: 0.07 }, // Radiant indigo
        { r: 76, g: 29, b: 149, baseAlpha: 0.07 }, // Deep galactic violet
        { r: 15, g: 118, b: 110, baseAlpha: 0.06 } // Faint teal haze
      ];
      const colorObj = ismColors[i % ismColors.length];

      this.puffs.push({
        rDist,
        initialAngle: angle,
        currentAngle: angle,
        orbitSpeed: orbitalSpeed,
        radius,
        color: colorObj,
        baseAlpha: colorObj.baseAlpha * (0.85 + this.rng() * 0.3),
        isDarkLane: false,
        pulseRate: 0.1,
        pulsePhase: this.rng() * Math.PI * 2,
        position: new Vector2(Math.cos(angle) * rDist, Math.sin(angle) * rDist)
      });
    }
  }

  /**
   * Generates luminous emission/reflection clouds and dark absorption dust lanes
   * along galactic spiral arms to bulk out the galaxy morphology.
   */
  generateSpiralNebula() {
    // Cosmic Nebula Color Palettes (Ionized Hydrogen, Oxygen, and Hot Bulge Gas)
    const armPalettes = [
      // Arm 1 / 3: Deep Cyan & Electric Blue + Cosmic Violet
      [
        { r: 14, g: 165, b: 233, baseAlpha: 0.16 }, // Deep sky blue
        { r: 56, g: 189, b: 248, baseAlpha: 0.14 }, // Cyan
        { r: 168, g: 85, b: 247, baseAlpha: 0.13 }, // Purple
        { r: 99, g: 102, b: 241, baseAlpha: 0.12 }  // Indigo
      ],
      // Arm 2 / 4: Rose Pink & Magenta + Warm Gold
      [
        { r: 244, g: 63, b: 94, baseAlpha: 0.16 },  // Rose
        { r: 236, g: 72, b: 153, baseAlpha: 0.14 }, // Pink / Magenta
        { r: 245, g: 158, b: 11, baseAlpha: 0.13 }, // Amber / Gold
        { r: 192, g: 132, b: 252, baseAlpha: 0.12 } // Lavender
      ]
    ];

    const puffsPerArm = 38;

    for (let armIdx = 0; armIdx < this.armCount; armIdx++) {
      const armBase = armIdx * ((Math.PI * 2) / this.armCount);
      const palette = armPalettes[armIdx % armPalettes.length];

      // 1. Luminous Emission & Reflection Nebulae Puffs
      for (let i = 0; i < puffsPerArm; i++) {
        const u = (i + 0.5 + (this.rng() - 0.5) * 0.4) / puffsPerArm;
        const rNorm = Math.pow(u, 0.78);
        const rDist = this.coreRadius * 0.75 + (this.sectorRadius - this.coreRadius * 0.75) * rNorm;
        
        // Logarithmic spiral angle with natural dispersion
        const spiralAngle = armBase + this.winding * Math.pow(rNorm, 0.85);
        const scatter = sampleGaussian(this.rng, 0, this.armScatter * (0.65 + 0.45 * rNorm));
        const finalAngle = spiralAngle + scatter;

        // Puff radius in world units (large soft volumetric puffs)
        const radius = (85 + this.rng() * 75 + rNorm * 45) * 1.3;

        // Color selection: hotter/warmer gas near core, cooler/rose gas in outer arms
        let colorObj;
        if (rNorm < 0.25) {
          colorObj = { r: 251, g: 191, b: 36, baseAlpha: 0.18 }; // Warm core gas
        } else {
          colorObj = palette[Math.floor(this.rng() * palette.length)];
        }

        const orbitalSpeed = Math.sqrt(80000 / Math.max(120, rDist)) * 0.003;

        this.puffs.push({
          rDist,
          initialAngle: finalAngle,
          currentAngle: finalAngle,
          orbitSpeed: orbitalSpeed,
          radius,
          color: colorObj,
          baseAlpha: colorObj.baseAlpha * (0.8 + this.rng() * 0.4),
          isDarkLane: false,
          pulseRate: 0.2 + this.rng() * 0.4,
          pulsePhase: this.rng() * Math.PI * 2,
          position: new Vector2(Math.cos(finalAngle) * rDist, Math.sin(finalAngle) * rDist)
        });
      }

      // 2. Dark Absorption Dust Lanes (Silhouette rifts along inner leading edge of arm)
      const darkPuffsCount = 14;
      for (let j = 0; j < darkPuffsCount; j++) {
        const u = (j + 0.5 + (this.rng() - 0.5) * 0.3) / darkPuffsCount;
        const rNorm = Math.pow(u, 0.75);
        const rDist = this.coreRadius * 0.9 + (this.sectorRadius * 0.9 - this.coreRadius * 0.9) * rNorm;
        
        // Offset slightly to the inner leading edge of the spiral arm
        const spiralAngle = armBase + this.winding * Math.pow(rNorm, 0.85);
        const innerOffset = -0.14 - (this.rng() * 0.08);
        const finalAngle = spiralAngle + innerOffset;

        const radius = (60 + this.rng() * 45);
        const orbitalSpeed = Math.sqrt(80000 / Math.max(120, rDist)) * 0.003;

        this.puffs.push({
          rDist,
          initialAngle: finalAngle,
          currentAngle: finalAngle,
          orbitSpeed: orbitalSpeed,
          radius,
          color: { r: 2, g: 6, b: 18, baseAlpha: 0.65 },
          baseAlpha: 0.55 + this.rng() * 0.25,
          isDarkLane: true,
          pulseRate: 0,
          pulsePhase: 0,
          position: new Vector2(Math.cos(finalAngle) * rDist, Math.sin(finalAngle) * rDist)
        });
      }
    }
  }

  /**
   * Reusable: Generates a circumstellar dust ring or asteroid belt around a star
   */
  generateCircumstellarBelt() {
    const puffCount = 45;
    for (let i = 0; i < puffCount; i++) {
      const u = this.rng();
      const rDist = this.innerRadius + (this.outerRadius - this.innerRadius) * Math.sqrt(u);
      const angle = this.rng() * Math.PI * 2;
      const radius = 25 + this.rng() * 35;
      const orbitalSpeed = Math.sqrt(20000 / Math.max(50, rDist)) * 0.008;

      this.puffs.push({
        rDist,
        initialAngle: angle,
        currentAngle: angle,
        orbitSpeed: orbitalSpeed,
        radius,
        color: { r: 148, g: 163, b: 184, baseAlpha: 0.15 },
        baseAlpha: 0.12 + this.rng() * 0.08,
        isDarkLane: false,
        pulseRate: 0.1,
        pulsePhase: this.rng() * Math.PI * 2,
        position: new Vector2(
          this.center.x + Math.cos(angle) * rDist,
          this.center.y + Math.sin(angle) * rDist
        )
      });
    }
  }

  /**
   * Reusable: Generates a fine concentric dust ring around a planet (like Cronus/Saturn)
   */
  generatePlanetaryRing() {
    const puffCount = 30;
    for (let i = 0; i < puffCount; i++) {
      const u = this.rng();
      const rDist = this.innerRadius + (this.outerRadius - this.innerRadius) * u;
      const angle = this.rng() * Math.PI * 2;
      const radius = 10 + this.rng() * 15;
      const orbitalSpeed = 0.04;

      this.puffs.push({
        rDist,
        initialAngle: angle,
        currentAngle: angle,
        orbitSpeed: orbitalSpeed,
        radius,
        color: { r: 234, g: 179, b: 8, baseAlpha: 0.22 },
        baseAlpha: 0.20,
        isDarkLane: false,
        pulseRate: 0,
        pulsePhase: 0,
        position: new Vector2(
          this.center.x + Math.cos(angle) * rDist,
          this.center.y + Math.sin(angle) * rDist
        )
      });
    }
  }

  evaluateAtTime(t) {
    for (let i = 0; i < this.puffs.length; i++) {
      const p = this.puffs[i];
      p.currentAngle = p.initialAngle + p.orbitSpeed * t;
      p.position.set(
        Math.cos(p.currentAngle) * p.rDist,
        Math.sin(p.currentAngle) * p.rDist
      );
    }
  }

  draw(ctx, t, zoom = 1.0, options = {}) {
    if (this.opacity <= 0.001 || options.showNebula === false) return;

    const viewport = options.viewport;
    const invZoom = 1 / Math.max(0.01, zoom);

    // Zoom-adaptive alpha attenuation:
    // Full richness at macro galactic zoom; softens smoothly when zooming in so it never hides systems.
    const zoomFade = Math.min(1.0, 0.42 / Math.max(0.18, zoom));
    const effectiveMasterAlpha = this.opacity * zoomFade;

    // Separate glowing clouds and dark absorption rifts
    const glowingPuffs = [];
    const darkLanes = [];

    for (let i = 0; i < this.puffs.length; i++) {
      const p = this.puffs[i];
      const r = p.radius;

      // Viewport culling
      if (viewport) {
        if (
          p.position.x + r < viewport.minX ||
          p.position.x - r > viewport.maxX ||
          p.position.y + r < viewport.minY ||
          p.position.y - r > viewport.maxY
        ) {
          continue;
        }
      }

      if (p.isDarkLane) {
        darkLanes.push(p);
      } else {
        glowingPuffs.push(p);
      }
    }

    // 1. Draw Luminous Emission / Reflection Nebulae with additive blend
    if (glowingPuffs.length > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      for (let i = 0; i < glowingPuffs.length; i++) {
        const p = glowingPuffs[i];
        const pulse = p.pulseRate > 0 ? Math.sin(t * p.pulseRate + p.pulsePhase) * 0.12 : 0;
        const currentAlpha = Math.max(0.02, Math.min(0.65, (p.baseAlpha + pulse) * effectiveMasterAlpha));
        const rad = p.radius * (1.0 + pulse * 0.5);

        const grad = ctx.createRadialGradient(p.position.x, p.position.y, 0, p.position.x, p.position.y, rad);
        const c = p.color;
        grad.addColorStop(0, `rgba(${c.r}, ${c.g}, ${c.b}, ${currentAlpha.toFixed(3)})`);
        grad.addColorStop(0.45, `rgba(${c.r}, ${c.g}, ${c.b}, ${(currentAlpha * 0.65).toFixed(3)})`);
        grad.addColorStop(0.8, `rgba(${c.r}, ${c.g}, ${c.b}, ${(currentAlpha * 0.22).toFixed(3)})`);
        grad.addColorStop(1, `rgba(${c.r}, ${c.g}, ${c.b}, 0)`);

        ctx.beginPath();
        ctx.arc(p.position.x, p.position.y, rad, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      ctx.restore();
    }

    // 2. Draw Dark Absorption Dust Lanes with standard blend (creates depth and rift silhouettes)
    if (darkLanes.length > 0 && zoom < 1.2) {
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';

      for (let i = 0; i < darkLanes.length; i++) {
        const p = darkLanes[i];
        const currentAlpha = Math.max(0.05, Math.min(0.75, p.baseAlpha * effectiveMasterAlpha * 1.2));
        const rad = p.radius;

        const grad = ctx.createRadialGradient(p.position.x, p.position.y, 0, p.position.x, p.position.y, rad);
        const c = p.color;
        grad.addColorStop(0, `rgba(${c.r}, ${c.g}, ${c.b}, ${currentAlpha.toFixed(3)})`);
        grad.addColorStop(0.6, `rgba(${c.r}, ${c.g}, ${c.b}, ${(currentAlpha * 0.5).toFixed(3)})`);
        grad.addColorStop(1, `rgba(${c.r}, ${c.g}, ${c.b}, 0)`);

        ctx.beginPath();
        ctx.arc(p.position.x, p.position.y, rad, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      ctx.restore();
    }
  }
}
