/**
 * Galactic Sector - Procedural Generation of Star Systems & Binary Pairs
 * Creates rich, mechanically grounded 2D star clusters with mutual barycenters,
 * orbital tracks, and remnant hazards.
 */

import { Vector2 } from '../vector.js';
import { STELLAR_CLASSES } from './stellar_types.js';
import { createRNG, sampleStellarClass, getBlendedDistribution } from './distribution.js';

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
    this.starCount = config.starCount || 60;
    this.sectorRadius = config.sectorRadius || 1800; // Galactic coordinate radius
    this.blendFactor = config.blendFactor !== undefined ? config.blendFactor : 1.0; // 0 = Astro, 1 = Game
    this.includeCoreAnchor = config.includeCoreAnchor !== undefined ? config.includeCoreAnchor : true;

    this.rng = createRNG(this.seed);
    this.stars = [];
    this.barycenters = [];
    this.centerAnchor = null;

    this.generate();
  }

  generate() {
    this.rng = createRNG(this.seed);
    this.stars = [];
    this.barycenters = [];

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
        rotationSpeed: 0.12,
        rotationAngle: 0
      };
      this.stars.push(this.centerAnchor);
    }

    // 2. Generate Star Systems in a Spiral / Clustered Galactic Disk
    const count = this.includeCoreAnchor ? this.starCount - 1 : this.starCount;
    let nameIndex = 0;

    for (let i = 0; i < count; i++) {
      const stellarClass = sampleStellarClass(distribution, this.rng);

      // Procedural name
      const prefix = STAR_NAME_PREFIXES[nameIndex % STAR_NAME_PREFIXES.length];
      const desig = SECTOR_DESIGNATIONS[Math.floor(this.rng() * SECTOR_DESIGNATIONS.length)];
      const num = Math.floor(this.rng() * 900) + 100;
      const starName = `${prefix} ${desig}-${num}`;
      nameIndex++;

      // Orbital placement in galactic disc (density falls off with radius, mild 2-arm spiral bias)
      const u = this.rng();
      const rDist = Math.sqrt(u) * (this.sectorRadius - 160) + 140; // minimum distance from core
      const baseAngle = this.rng() * Math.PI * 2;
      // Spiral pitch modulation
      const spiralOffset = Math.sin(baseAngle * 2) * 0.45;
      const finalAngle = baseAngle + spiralOffset;

      const orbitalSpeed = Math.sqrt(80000 / Math.max(100, rDist)) * 0.003 * (0.85 + this.rng() * 0.3);

      // Check if this star forms a Binary System!
      const isBinaryCandidate = this.rng() < (stellarClass.binaryLikelihood * 0.75);

      if (isBinaryCandidate && i < count - 1) {
        // Generate Binary Pair around a shared Barycenter
        const companionClass = sampleStellarClass(distribution, this.rng);

        const baryPos = new Vector2(
          Math.cos(finalAngle) * rDist,
          Math.sin(finalAngle) * rDist
        );

        const separation = 75 + this.rng() * 65; // Separation between the two stars in AU
        const totalMass = stellarClass.gameMass + companionClass.gameMass;
        const r1 = separation * (companionClass.gameMass / totalMass);
        const r2 = separation * (stellarClass.gameMass / totalMass);

        // Binary mutual mutual orbital period (Keplerian)
        const binaryOrbitSpeed = Math.sqrt((totalMass * 0.8) / Math.pow(separation, 3)) * 1.8;
        const initialBinaryPhase = this.rng() * Math.PI * 2;

        const barycenter = {
          id: `barycenter-${i}`,
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
          id: `star-${i}-A`,
          name: `${starName} A`,
          stellarClass,
          barycenter,
          isBinary: true,
          isPrimary: true,
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
          id: `star-${i}-B`,
          name: `${starName} B`,
          stellarClass: companionClass,
          barycenter,
          isBinary: true,
          isPrimary: false,
          binaryRadius: r2,
          binaryOrbitSpeed,
          initialBinaryAngle: initialBinaryPhase + Math.PI, // Exact 180-degree opposite
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
        i++; // Incremented since we generated two stars
      } else {
        // Solitary Star System
        const star = {
          id: `star-${i}`,
          name: starName,
          stellarClass,
          isBinary: false,
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
    }

    this.evaluateAtTime(0);
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
