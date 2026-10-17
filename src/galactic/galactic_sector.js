/**
 * Galactic Sector - Procedural Generation of Star Systems & Binary Pairs
 * Creates rich, mechanically grounded 2D star clusters with mutual barycenters,
 * orbital tracks, and remnant hazards.
 */

import { Vector2 } from '../vector.js';
import { STELLAR_CLASSES } from './stellar_types.js';
import { createRNG, sampleStellarClass, getBlendedDistribution, sampleGaussian, getStarCatalogDesignation } from './distribution.js';
import { NebulaField } from './nebula_field.js';

const STAR_NAME_PREFIXES = [
  'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Theta', 'Iota',
  'Kappa', 'Lambda', 'Sigma', 'Tau', 'Upsilon', 'Omega', 'Kepler', 'Gliese',
  'Proxima', 'Vega', 'Sirius', 'Altair', 'Deneb', 'Rigel', 'Polaris', 'Spica',
  'Aldebaran', 'Antares', 'Betelgeuse', 'Castor', 'Pollux', 'Regulus', 'Achernar'
];

const SECTOR_DESIGNATIONS = ['Majoris', 'Minoris', 'Borealis', 'Australis', 'Prime', 'Secundus', 'Nexus', 'Relay'];

export class GalacticSector {
  constructor(config = {}) {
    this.seed = config.seed !== undefined ? config.seed : 42;
    this.pattern = config.pattern || 'legacy'; // 'legacy' or 'spiral'
    this.starCount = config.starCount || 180;
    this.sectorRadius = config.sectorRadius || 1800; // Galactic coordinate radius
    this.blendFactor = config.blendFactor !== undefined ? config.blendFactor : 1.0; // 0 = Astro, 1 = Game
    this.includeCoreAnchor = config.includeCoreAnchor !== undefined ? config.includeCoreAnchor : true;

    // Spiral structure parameters
    this.armCount = config.armCount !== undefined ? config.armCount : 2; // 2, 3, 4 arms
    this.winding = config.winding !== undefined ? config.winding : 3.2; // Spiral winding (radians)
    this.armScatter = config.armScatter !== undefined ? config.armScatter : 0.22; // Dispersion width
    this.coreRadius = config.coreRadius !== undefined ? config.coreRadius : 260; // Dense central bulge radius

    this.rng = createRNG(this.seed);
    this.stars = [];
    this.barycenters = [];
    this.clusterHubs = [];
    this.centerAnchor = null;
    this.nebula = null;

    this.generate();
  }

  generate() {
    this.rng = createRNG(this.seed);
    this.stars = [];
    this.barycenters = [];
    this.clusterHubs = [];

    // 0. Broad Quadrant Sectors for Clustered Disc Galaxy
    if (this.pattern !== 'spiral') {
      const hubSpecs = [
        { name: 'Orion Sector', tag: 'ORI', palette: 0 },
        { name: 'Cygnus Expanse', tag: 'CYG', palette: 1 },
        { name: 'Carina Reach', tag: 'CAR', palette: 2 },
        { name: 'Vela Shroud', tag: 'VEL', palette: 3 },
        { name: 'Perseus Frontier', tag: 'PER', palette: 4 },
        { name: 'Centaurus Expanse', tag: 'CEN', palette: 5 },
        { name: 'Aquila Corridor', tag: 'AQU', palette: 6 },
        { name: 'Sagittarius Outer Rim', tag: 'SGR', palette: 0 }
      ];
      for (let k = 0; k < hubSpecs.length; k++) {
        const u = (k + 0.5) / hubSpecs.length;
        const rNorm = 0.22 + 0.65 * Math.sqrt(u);
        const rDist = this.coreRadius + (this.sectorRadius - this.coreRadius) * rNorm;
        const baseAngle = (k / hubSpecs.length) * Math.PI * 2 + (this.rng() - 0.5) * 0.45;
        this.clusterHubs.push({
          id: `hub-${k}`,
          name: hubSpecs[k].name,
          tag: hubSpecs[k].tag,
          palette: hubSpecs[k].palette,
          rDist,
          angle: baseAngle
        });
      }
    }

    // Interstellar Nebula and Dust Cloud Field (Adaptive to galaxy morphology)
    this.nebula = new NebulaField({
      type: this.pattern === 'spiral' ? 'SPIRAL_ARM_NEBULA' : 'CLUSTERED_DISC_NEBULA',
      seed: this.seed,
      armCount: this.armCount,
      winding: this.winding,
      armScatter: this.armScatter,
      coreRadius: this.coreRadius,
      sectorRadius: this.sectorRadius,
      clusterHubs: this.clusterHubs
    });

    const distribution = getBlendedDistribution(this.blendFactor);

    // 1. Optional Supermassive Black Hole or Core Cluster Anchor
    if (this.includeCoreAnchor) {
      this.centerAnchor = {
        id: 'galactic-core-anchor',
        name: 'Sagittarius Prime (SMBH)',
        stellarClass: STELLAR_CLASSES.SUPERMASSIVE_BLACK_HOLE,
        position: new Vector2(0, 0),
        orbitRadius: 0,
        orbitSpeed: 0,
        initialOrbitAngle: 0,
        mass: STELLAR_CLASSES.SUPERMASSIVE_BLACK_HOLE.gameMass,
        radius: STELLAR_CLASSES.SUPERMASSIVE_BLACK_HOLE.gameRadius,
        soiRadius: STELLAR_CLASSES.SUPERMASSIVE_BLACK_HOLE.gameRadius * STELLAR_CLASSES.SUPERMASSIVE_BLACK_HOLE.soiMultiplier,
        isBinary: false,
        isCoreAnchor: true,
        isProminent: true,
        rotationSpeed: 0.12,
        rotationAngle: 0
      };
      this.stars.push(this.centerAnchor);
    }

    // 2. Generate Star Systems (Unified population)
    if (this.pattern === 'spiral') {
      this.generateSpiralStars(distribution);
    } else {
      this.generateLegacyStars(distribution);
    }

    this.evaluateAtTime(0);
  }

  generateSpiralStars(distribution) {
    const count = this.includeCoreAnchor ? this.starCount - 1 : this.starCount;
    let nameIndex = 0;

    for (let i = 0; i < count; i++) {
      const stellarClass = sampleStellarClass(distribution, this.rng);
      let rDist, finalAngle;
      const roll = this.rng();

      if (roll < 0.18) {
        // Core Bulge Star (elliptical bar)
        const u = this.rng();
        const rBase = 50 + (this.coreRadius - 50) * Math.sqrt(u);
        const rawAngle = this.rng() * Math.PI * 2;
        const barAngle = 0.45;
        const lx = rBase * Math.cos(rawAngle) * 1.35;
        const ly = rBase * Math.sin(rawAngle) * 0.75;
        const rx = lx * Math.cos(barAngle) - ly * Math.sin(barAngle);
        const ry = lx * Math.sin(barAngle) + ly * Math.cos(barAngle);
        rDist = Math.hypot(rx, ry);
        finalAngle = Math.atan2(ry, rx);
      } else if (roll < 0.85) {
        // Spiral Arm Star
        const armIdx = Math.floor(this.rng() * this.armCount);
        const armBase = armIdx * ((Math.PI * 2) / this.armCount);
        const u = this.rng();
        const rNorm = Math.pow(u, 0.78);
        const baseR = this.coreRadius + (this.sectorRadius - this.coreRadius) * rNorm;
        const spiralAngle = armBase + this.winding * Math.pow(rNorm, 0.85);
        const scatter = sampleGaussian(this.rng, 0, this.armScatter * (0.55 + 0.55 * rNorm));
        const rJitter = sampleGaussian(this.rng, 0, 18);
        finalAngle = spiralAngle + scatter;
        rDist = Math.max(this.coreRadius * 0.65, baseR + rJitter);
      } else {
        // Inter-Arm Field Star
        const u = this.rng();
        rDist = this.coreRadius + (this.sectorRadius - this.coreRadius) * Math.sqrt(u);
        finalAngle = this.rng() * Math.PI * 2;
      }

      // Name Assignment: Prominent names for landmark systems; catalog designations for others
      let starName;
      const isProminent = (i === 0 || i < 35 || stellarClass.category === 'EVOLVED' || stellarClass.id === 'STELLAR_BLACK_HOLE' || stellarClass.id === 'NEUTRON_STAR_PULSAR');

      if (i === 0) {
        starName = 'Sol Prime';
      } else if (isProminent) {
        const prefix = STAR_NAME_PREFIXES[nameIndex % STAR_NAME_PREFIXES.length];
        const desig = SECTOR_DESIGNATIONS[Math.floor(this.rng() * SECTOR_DESIGNATIONS.length)];
        const num = Math.floor(this.rng() * 900) + 100;
        starName = `${prefix} ${desig}-${num}`;
        nameIndex++;
      } else if (roll < 0.18) {
        const num = Math.floor(this.rng() * 899) + 100;
        starName = `CORE-${num}`;
      } else if (roll < 0.85) {
        const armTags = ['PER', 'SCT', 'NOR', 'CYG', 'CEN', 'SGR'];
        const armIdx = Math.floor(this.rng() * this.armCount);
        const tag = armTags[armIdx % armTags.length];
        const num = Math.floor(this.rng() * 899) + 100;
        starName = `${tag}-${num}`;
      } else {
        const num = Math.floor(this.rng() * 899) + 100;
        starName = `DISC-${num}`;
      }

      const orbitalSpeed = Math.sqrt(80000 / Math.max(100, rDist)) * 0.003 * (0.85 + this.rng() * 0.3);

      // Separation check: ensure candidate position does not clump with existing stars
      let tries = 0;
      let validPos = false;
      const minSeparation = 52; // minimum distance in AU between systems to prevent visual crowding

      while (!validPos && tries < 15) {
        let isTooClose = false;
        const testX = Math.cos(finalAngle) * rDist;
        const testY = Math.sin(finalAngle) * rDist;

        // Check distance to center anchor
        if (Math.hypot(testX, testY) < (this.coreRadius * 0.45)) {
          isTooClose = true;
        }

        // Check distance to existing stars and barycenters
        if (!isTooClose) {
          for (let sIdx = 0; sIdx < this.stars.length; sIdx++) {
            const s = this.stars[sIdx];
            const dx = s.position.x - testX;
            const dy = s.position.y - testY;
            if (dx * dx + dy * dy < minSeparation * minSeparation) {
              isTooClose = true;
              break;
            }
          }
        }

        if (!isTooClose) {
          for (let bIdx = 0; bIdx < this.barycenters.length; bIdx++) {
            const b = this.barycenters[bIdx];
            const dx = b.position.x - testX;
            const dy = b.position.y - testY;
            if (dx * dx + dy * dy < minSeparation * minSeparation) {
              isTooClose = true;
              break;
            }
          }
        }

        if (isTooClose) {
          // Jitter radius and angle slightly
          rDist += sampleGaussian(this.rng, 0, 24);
          rDist = Math.max(this.coreRadius * 0.5, Math.min(this.sectorRadius - 40, rDist));
          finalAngle += (this.rng() - 0.5) * 0.20;
          tries++;
        } else {
          validPos = true;
        }
      }

      // Check if this star forms a Binary System
      const isBinaryCandidate = this.rng() < (stellarClass.binaryLikelihood * 0.75);

      if (isBinaryCandidate && i < count - 1) {
        this.createBinaryPair(i, starName, stellarClass, distribution, rDist, finalAngle, orbitalSpeed, isProminent);
        i++; // binary pair consumes 2 star slots
      } else {
        this.createSolitaryStar(i, starName, stellarClass, rDist, finalAngle, orbitalSpeed, isProminent);
      }
    }
  }

  generateLegacyStars(distribution) {
    const count = this.includeCoreAnchor ? this.starCount - 1 : this.starCount;
    let nameIndex = 0;

    for (let i = 0; i < count; i++) {
      let stellarClass = sampleStellarClass(distribution, this.rng);
      let rDist, finalAngle, starName;
      let clusterTag = 'DISC';

      const isProminent = (i === 0 || i < 35 || stellarClass.category === 'EVOLVED' || stellarClass.id === 'STELLAR_BLACK_HOLE' || stellarClass.id === 'NEUTRON_STAR_PULSAR');

      if (i === 0) {
        // Sol Prime - Player's home system
        stellarClass = STELLAR_CLASSES.G_TYPE;
        rDist = 720;
        finalAngle = 0.68;
        starName = 'Sol Prime';
      } else {
        const roll = this.rng();

        if (roll < 0.15) {
          // Core Bulge Star (dense nuclear bulge)
          const u = this.rng();
          rDist = 50 + (this.coreRadius - 50) * Math.sqrt(u);
          finalAngle = this.rng() * Math.PI * 2;
          clusterTag = 'CORE';
        } else {
          // Continuous Galactic Disk Star (smoothly populates the entire 360-degree disk)
          const u = this.rng();
          rDist = this.coreRadius + (this.sectorRadius - this.coreRadius) * Math.pow(u, 0.70);
          
          // Full 360-degree sweep with gentle organic harmonic variation
          const baseAngle = this.rng() * Math.PI * 2;
          const harmonic = Math.sin(baseAngle * 2) * 0.20 + Math.cos(baseAngle * 3) * 0.08;
          finalAngle = baseAngle + harmonic;

          // Regional quadrant catalog designation based on position
          const normAngle = ((finalAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          const quadrantIdx = Math.floor((normAngle / (Math.PI * 2)) * 8);
          const quadrantTags = ['ORI', 'CYG', 'CAR', 'VEL', 'PER', 'CEN', 'AQU', 'SGR'];
          clusterTag = quadrantTags[quadrantIdx % quadrantTags.length];
        }

        // Star Naming
        if (isProminent) {
          const prefix = STAR_NAME_PREFIXES[nameIndex % STAR_NAME_PREFIXES.length];
          const desig = SECTOR_DESIGNATIONS[Math.floor(this.rng() * SECTOR_DESIGNATIONS.length)];
          const num = Math.floor(this.rng() * 900) + 100;
          starName = `${prefix} ${desig}-${num}`;
          nameIndex++;
        } else {
          const num = Math.floor(this.rng() * 899) + 100;
          starName = `${clusterTag}-${num}`;
        }
      }

      const orbitalSpeed = Math.sqrt(80000 / Math.max(100, rDist)) * 0.003 * (0.85 + this.rng() * 0.3);

      // Separation check: ensure candidate position does not clump with existing stars
      let tries = 0;
      let validPos = (i === 0); // Sol Prime position is fixed
      const minSeparation = 52; // minimum distance in AU between systems

      while (!validPos && tries < 20) {
        let isTooClose = false;
        const testX = Math.cos(finalAngle) * rDist;
        const testY = Math.sin(finalAngle) * rDist;

        // Check distance to center anchor
        if (Math.hypot(testX, testY) < (this.coreRadius * 0.45)) {
          isTooClose = true;
        }

        // Check distance to existing stars
        if (!isTooClose) {
          for (let sIdx = 0; sIdx < this.stars.length; sIdx++) {
            const s = this.stars[sIdx];
            const dx = s.position.x - testX;
            const dy = s.position.y - testY;
            if (dx * dx + dy * dy < minSeparation * minSeparation) {
              isTooClose = true;
              break;
            }
          }
        }

        // Check distance to existing barycenters
        if (!isTooClose) {
          for (let bIdx = 0; bIdx < this.barycenters.length; bIdx++) {
            const b = this.barycenters[bIdx];
            const dx = b.position.x - testX;
            const dy = b.position.y - testY;
            if (dx * dx + dy * dy < minSeparation * minSeparation) {
              isTooClose = true;
              break;
            }
          }
        }

        if (isTooClose) {
          rDist += sampleGaussian(this.rng, 0, 28);
          rDist = Math.max(this.coreRadius * 0.5, Math.min(this.sectorRadius - 40, rDist));
          finalAngle += (this.rng() - 0.5) * 0.22;
          tries++;
        } else {
          validPos = true;
        }
      }

      // Check if this star forms a Binary System (exclude Sol Prime)
      const isBinaryCandidate = (i > 0) && (this.rng() < (stellarClass.binaryLikelihood * 0.75));

      if (isBinaryCandidate && i < count - 1) {
        this.createBinaryPair(i, starName, stellarClass, distribution, rDist, finalAngle, orbitalSpeed, isProminent);
        i++; // binary consumes 2 star slots
      } else {
        this.createSolitaryStar(i, starName, stellarClass, rDist, finalAngle, orbitalSpeed, isProminent);
      }
    }
  }

  createBinaryPair(index, starName, stellarClass, distribution, rDist, finalAngle, orbitalSpeed, isProminent = false) {
    const companionClass = sampleStellarClass(distribution, this.rng);

    const baryPos = new Vector2(
      Math.cos(finalAngle) * rDist,
      Math.sin(finalAngle) * rDist
    );

    const separation = 55 + this.rng() * 45;
    const totalMass = stellarClass.gameMass + companionClass.gameMass;
    const r1 = separation * (companionClass.gameMass / totalMass);
    const r2 = separation * (stellarClass.gameMass / totalMass);

    const binaryOrbitSpeed = Math.sqrt((totalMass * 0.8) / Math.pow(separation, 3)) * 1.8;
    const initialBinaryPhase = this.rng() * Math.PI * 2;

    const barycenter = {
      id: `barycenter-${index}`,
      name: `${starName} Barycenter`,
      position: baryPos.clone(),
      galacticOrbitRadius: rDist,
      galacticOrbitSpeed: orbitalSpeed,
      initialGalacticAngle: finalAngle,
      separation,
      binaryOrbitSpeed
    };
    this.barycenters.push(barycenter);

    const primaryStar = {
      id: `star-${index}-A`,
      name: `${starName} A`,
      stellarClass,
      barycenter,
      isBinary: true,
      isPrimary: true,
      isProminent,
      binaryRadius: r1,
      binaryOrbitSpeed,
      initialBinaryAngle: initialBinaryPhase,
      position: new Vector2(0, 0),
      mass: stellarClass.gameMass,
      radius: stellarClass.gameRadius,
      soiRadius: Math.max(stellarClass.gameRadius * 2.2, r1 * 1.5),
      rotationSpeed: (this.rng() - 0.5) * 0.4,
      rotationAngle: this.rng() * Math.PI * 2
    };

    const companionStar = {
      id: `star-${index}-B`,
      name: `${starName} B`,
      stellarClass: companionClass,
      barycenter,
      isBinary: true,
      isPrimary: false,
      isProminent,
      binaryRadius: r2,
      binaryOrbitSpeed,
      initialBinaryAngle: initialBinaryPhase + Math.PI,
      position: new Vector2(0, 0),
      mass: companionClass.gameMass,
      radius: companionClass.gameRadius,
      soiRadius: Math.max(companionClass.gameRadius * 2.2, r2 * 1.5),
      rotationSpeed: (this.rng() - 0.5) * 0.4,
      rotationAngle: this.rng() * Math.PI * 2
    };

    primaryStar.companion = companionStar;
    companionStar.companion = primaryStar;

    this.stars.push(primaryStar);
    this.stars.push(companionStar);
  }

  createSolitaryStar(index, starName, stellarClass, rDist, finalAngle, orbitalSpeed, isProminent = false) {
    const star = {
      id: `star-${index}`,
      name: starName,
      stellarClass,
      isBinary: false,
      isProminent,
      galacticOrbitRadius: rDist,
      galacticOrbitSpeed: orbitalSpeed,
      initialGalacticAngle: finalAngle,
      position: new Vector2(
        Math.cos(finalAngle) * rDist,
        Math.sin(finalAngle) * rDist
      ),
      mass: stellarClass.gameMass,
      radius: stellarClass.gameRadius,
      soiRadius: stellarClass.gameRadius * stellarClass.soiMultiplier,
      rotationSpeed: (this.rng() - 0.5) * 0.35,
      rotationAngle: this.rng() * Math.PI * 2
    };
    this.stars.push(star);
  }

  evaluateAtTime(t) {
    // 1. Update Barycenters
    for (const b of this.barycenters) {
      const angle = b.initialGalacticAngle + b.galacticOrbitSpeed * t;
      b.position.set(
        Math.cos(angle) * b.galacticOrbitRadius,
        Math.sin(angle) * b.galacticOrbitRadius
      );
    }

    // 2. Update Star Positions
    for (const star of this.stars) {
      star.rotationAngle += star.rotationSpeed * 0.02;

      if (star.isCoreAnchor) {
        star.position.set(0, 0);
        continue;
      }

      if (star.isBinary && star.barycenter) {
        const bPos = star.barycenter.position;
        const angle = star.initialBinaryAngle + star.binaryOrbitSpeed * t;
        star.position.set(
          bPos.x + Math.cos(angle) * star.binaryRadius,
          bPos.y + Math.sin(angle) * star.binaryRadius
        );
      } else {
        const angle = star.initialGalacticAngle + star.galacticOrbitSpeed * t;
        star.position.set(
          Math.cos(angle) * star.galacticOrbitRadius,
          Math.sin(angle) * star.galacticOrbitRadius
        );
      }
    }

    // 3. Update Interstellar Nebula & Dust Field
    if (this.nebula) {
      this.nebula.evaluateAtTime(t);
    }
  }

  /**
   * Finds the star closest to the world position (for selection / hover inspection)
   */
  findNearestStar(worldPos, maxDist = 80) {
    let nearest = null;
    let minDist = maxDist;

    for (const star of this.stars) {
      const d = worldPos.dist(star.position);
      if (d < minDist) {
        minDist = d;
        nearest = star;
      }
    }

    return nearest;
  }
}

