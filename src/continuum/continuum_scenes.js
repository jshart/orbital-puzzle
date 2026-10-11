/**
 * Continuum Multi-Scale Demo - Scene Configurations (Tiers 1, 2, and 3)
 * Provides deterministic celestial setups for each scale tier:
 * Tier 1: Galactic Sector with binary assist star & target star
 * Tier 2: Interplanetary Solar System with star, Ares slingshot, and Terra
 * Tier 3: Planetary Subsystem with Terra, Luna, and Station Alpha
 */

import { Vector2 } from '../vector.js';
import { CelestialBody } from '../celestial.js';
import { Waypoint } from '../waypoint.js';
import { STELLAR_CLASSES } from '../galactic/stellar_types.js';

/**
 * Builds Tier 1: Galactic Sector Scale
 */
export function buildGalacticScene() {
  const targetStar = {
    id: 'star-sol-prime',
    name: 'Sol Prime (Target Star)',
    stellarClass: STELLAR_CLASSES.G_TYPE,
    position: new Vector2(360, 140),
    mass: 38000,
    radius: 24,
    soiRadius: 130, // Trigger boundary for transition to Solar System
    color: STELLAR_CLASSES.G_TYPE.color,
    glowColor: STELLAR_CLASSES.G_TYPE.coronaColor,
    isTarget: true
  };

  // Intermediate Binary Assist Pair
  const barycenterPos = new Vector2(-180, 360);
  const binarySeparation = 70;
  const starA = {
    id: 'star-sirius-a',
    name: 'Sirius Alpha (Assist)',
    stellarClass: STELLAR_CLASSES.A_TYPE,
    position: new Vector2(barycenterPos.x - binarySeparation * 0.4, barycenterPos.y),
    mass: 42000,
    radius: 28,
    soiRadius: 90,
    color: STELLAR_CLASSES.A_TYPE.color,
    glowColor: STELLAR_CLASSES.A_TYPE.coronaColor
  };

  const starB = {
    id: 'star-sirius-b',
    name: 'Sirius Beta (White Dwarf)',
    stellarClass: STELLAR_CLASSES.WHITE_DWARF,
    position: new Vector2(barycenterPos.x + binarySeparation * 0.6, barycenterPos.y),
    mass: 24000,
    radius: 8,
    soiRadius: 65,
    color: STELLAR_CLASSES.WHITE_DWARF.color,
    glowColor: STELLAR_CLASSES.WHITE_DWARF.coronaColor
  };

  // Background stars for visual depth & subtle ambient gravity
  const bgStars = [
    { id: 'bg-1', name: 'Vega Borealis', stellarClass: STELLAR_CLASSES.B_TYPE, position: new Vector2(-650, -320), mass: 55000, radius: 34, soiRadius: 120, color: STELLAR_CLASSES.B_TYPE.color, glowColor: STELLAR_CLASSES.B_TYPE.coronaColor },
    { id: 'bg-2', name: 'Cygnus X-1 (Black Hole)', stellarClass: STELLAR_CLASSES.BLACK_HOLE, position: new Vector2(620, -480), mass: 90000, radius: 10, soiRadius: 110, color: '#000000', glowColor: 'rgba(245, 158, 11, 0.4)', hasAccretionDisk: true },
    { id: 'bg-3', name: 'Proxima Australis', stellarClass: STELLAR_CLASSES.M_TYPE, position: new Vector2(-420, 580), mass: 11000, radius: 14, soiRadius: 60, color: STELLAR_CLASSES.M_TYPE.color, glowColor: STELLAR_CLASSES.M_TYPE.coronaColor },
    { id: 'bg-4', name: 'Pulsar PSR-0950', stellarClass: STELLAR_CLASSES.PULSAR, position: new Vector2(580, 520), mass: 45000, radius: 6, soiRadius: 80, color: '#38bdf8', glowColor: 'rgba(56, 189, 248, 0.6)', hasMagneticBeams: true },
    { id: 'bg-5', name: 'Antares Prime (Giant)', stellarClass: STELLAR_CLASSES.RED_GIANT, position: new Vector2(-780, 180), mass: 35000, radius: 48, soiRadius: 100, color: STELLAR_CLASSES.RED_GIANT.color, glowColor: STELLAR_CLASSES.RED_GIANT.coronaColor },
    { id: 'bg-6', name: 'Kepler-442 (Goldilocks)', stellarClass: STELLAR_CLASSES.K_TYPE, position: new Vector2(120, -560), mass: 18000, radius: 18, soiRadius: 70, color: STELLAR_CLASSES.K_TYPE.color, glowColor: STELLAR_CLASSES.K_TYPE.coronaColor }
  ];

  const allStars = [targetStar, starA, starB, ...bgStars];

  // Starting probe coordinates in deep interstellar space
  const probeStartPos = new Vector2(-820, 680);
  const probeStartVel = new Vector2(28.5, -12.8); // Aimed past Sirius binary for gravity assist into Sol Prime

  return {
    tier: 1,
    name: 'TIER 1: GALACTIC SECTOR',
    subtitle: 'Interstellar Transit ──▶ Target Star Sol Prime',
    stars: allStars,
    targetStar,
    barycenterPos,
    binaryStars: [starA, starB],
    probeStartPos,
    probeStartVel,
    defaultZoom: 0.38,
    targetZoom: 0.75
  };
}

/**
 * Builds Tier 2: Interplanetary Solar System Scale
 */
export function buildSolarScene(incomingAngle = -2.6, incomingSpeed = 24.0) {
  const sol = new CelestialBody({
    id: 'sol-star-t2',
    name: 'Sol (Star)',
    isStar: true,
    mass: 44000,
    radius: 36,
    color: '#fbbf24',
    glowColor: 'rgba(251, 191, 36, 0.45)',
    rotationSpeed: 0.02
  });

  const terra = new CelestialBody({
    id: 'terra-planet-t2',
    name: 'Terra (Target Planet)',
    parent: sol,
    mass: 5200,
    radius: 16,
    orbitRadius: 215,
    orbitSpeed: 0.068,
    initialOrbitAngle: 1.35,
    rotationSpeed: 0.22,
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.4)'
  });
  terra.soiRadius = 65; // Trigger boundary for transition to Terra subsystem

  const ares = new CelestialBody({
    id: 'ares-planet-t2',
    name: 'Ares (Slingshot Assist)',
    parent: sol,
    mass: 3600,
    radius: 13,
    orbitRadius: 325,
    orbitSpeed: 0.046,
    initialOrbitAngle: 2.78,
    rotationSpeed: 0.18,
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.35)'
  });

  const zeus = new CelestialBody({
    id: 'zeus-gasgiant-t2',
    name: 'Zeus (Gas Giant)',
    parent: sol,
    mass: 24000,
    radius: 28,
    orbitRadius: 480,
    orbitSpeed: 0.026,
    initialOrbitAngle: 0.35,
    rotationSpeed: 0.22,
    color: '#fb923c',
    glowColor: 'rgba(251, 146, 60, 0.4)'
  });

  const allBodies = [sol, ares, terra, zeus];

  // Calculate entry position on the outer solar boundary (R ~ 480 AU) based on incoming angle
  const entryRadius = 490;
  const probeStartPos = new Vector2(
    Math.cos(incomingAngle) * entryRadius,
    Math.sin(incomingAngle) * entryRadius
  );

  // Inward hyperbolic velocity vector
  const inwardDir = new Vector2(-Math.cos(incomingAngle + 0.18), -Math.sin(incomingAngle + 0.18)).normalize();
  const probeStartVel = Vector2.scale(inwardDir, incomingSpeed);

  return {
    tier: 2,
    name: 'TIER 2: SOL INTERPLANETARY SYSTEM',
    subtitle: 'Outer Solar Insertion ──▶ Mars Slingshot ──▶ Terra Descent',
    bodies: allBodies,
    centralStar: sol,
    targetPlanet: terra,
    aresAssist: ares,
    probeStartPos,
    probeStartVel,
    defaultZoom: 0.68,
    targetZoom: 1.15
  };
}

/**
 * Builds Tier 3: Planetary & Moon Subsystem Scale
 */
export function buildPlanetaryScene(incomingAngle = -1.9, incomingSpeed = 22.0) {
  const terra = new CelestialBody({
    id: 'terra-t3',
    name: 'Terra',
    mass: 13000,
    radius: 20,
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    rotationSpeed: 0.25
  });

  const luna = new CelestialBody({
    id: 'luna-t3',
    name: 'Luna',
    parent: terra,
    mass: 2200,
    radius: 9,
    orbitRadius: 135,
    orbitSpeed: 0.13,
    initialOrbitAngle: 0.85,
    rotationSpeed: 0.13,
    color: '#cbd5e1',
    glowColor: 'rgba(203, 213, 225, 0.3)'
  });

  const stationAlpha = new Waypoint({
    id: 'station-alpha-t3',
    name: 'Station Alpha (Orbital Dock)',
    parent: terra,
    orbitRadius: 78,
    orbitSpeed: 0.145,
    initialOrbitAngle: 2.1,
    captureRadius: 28,
    maxCaptureSpeed: 18.0
  });

  const allBodies = [terra, luna];

  // Entry position on the outer planetary boundary (R ~ 140 AU)
  const entryRadius = 135;
  const probeStartPos = new Vector2(
    Math.cos(incomingAngle) * entryRadius,
    Math.sin(incomingAngle) * entryRadius
  );

  // Hyperbolic approach vector towards Station Alpha
  const inwardDir = new Vector2(-Math.cos(incomingAngle + 0.35), -Math.sin(incomingAngle + 0.35)).normalize();
  const probeStartVel = Vector2.scale(inwardDir, incomingSpeed);

  return {
    tier: 3,
    name: 'TIER 3: TERRA & LUNA SUBSYSTEM',
    subtitle: 'Lunar Gap Clearance ──▶ RCS Braking ──▶ Station Alpha Docking',
    bodies: allBodies,
    primaryPlanet: terra,
    luna,
    targetWaypoint: stationAlpha,
    probeStartPos,
    probeStartVel,
    defaultZoom: 1.10,
    targetZoom: 1.65
  };
}
