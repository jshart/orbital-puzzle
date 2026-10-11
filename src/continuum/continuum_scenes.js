/**
 * Continuum Multi-Scale Demo - Scene Configurations (Tiers 1, 2, and 3)
 * Full 65-Star Galactic Sector (Central SMBH at 0, 0) -> Sol System -> Terra Subsystem
 */

import { Vector2 } from '../vector.js';
import { CelestialBody } from '../celestial.js';
import { Waypoint } from '../waypoint.js';
import { GalacticSector } from '../galactic/galactic_sector.js';
import { STELLAR_CLASSES } from '../galactic/stellar_types.js';

/**
 * Builds Tier 1: Full Galactic Sector Scale
 * Uses authentic GalacticSector with central Sagittarius Prime (SMBH) at (0, 0)
 */
export function buildGalacticScene() {
  const sector = new GalacticSector({
    seed: 1042,
    starCount: 65,
    sectorRadius: 1600,
    blendFactor: 1.0,
    includeCoreAnchor: true
  });

  // Find or designate a prominent Class G star in the sector to be Sol Prime
  let targetStar = sector.stars.find(s => !s.isCoreAnchor && !s.isBinary && s.stellarClass.id === 'G_TYPE');
  if (!targetStar) {
    targetStar = sector.stars.find(s => !s.isCoreAnchor && !s.isBinary) || sector.stars[1];
  }

  // Configure target star properties for clean transition
  targetStar.name = 'Sol Prime (Target Star)';
  targetStar.isTarget = true;
  targetStar.soiRadius = 135; // Capture trigger boundary

  // Probe starts in an outer spiral arm heading inward across the disk
  // Positioned so it naturally flies through the cluster toward Sol Prime
  const probeStartPos = new Vector2(
    targetStar.position.x - 920,
    targetStar.position.y + 480
  );
  
  // Vector pointing toward Sol Prime with a slight hyperbolic offset for a binary flyby
  const dirToTarget = Vector2.sub(targetStar.position, probeStartPos).normalize();
  const probeStartVel = Vector2.scale(dirToTarget, 28.5);
  // Add a slight orthogonal tangent so it slingshots past nearby stars
  probeStartVel.x += 3.5;
  probeStartVel.y -= 2.0;

  return {
    tier: 1,
    name: 'TIER 1: GALACTIC SECTOR',
    subtitle: 'Galactic Core (Sagittarius Prime) ──▶ Interstellar Transit ──▶ Sol Prime',
    sector,
    targetStar,
    probeStartPos,
    probeStartVel,
    defaultZoom: 0.25, // Zoomed out to show the full galaxy and central black hole!
    initialCameraCenter: new Vector2(0, 0) // Centers directly on the central Supermassive Black Hole
  };
}

/**
 * Builds Tier 2: Interplanetary Solar System Scale
 * Accurately initialized from Galactic entry angle and heading
 */
export function buildSolarScene(incomingAngle = 2.6, headingAngle = -0.5, incomingSpeed = 24.0) {
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
  terra.soiRadius = 65; // Capture trigger boundary

  const ares = new CelestialBody({
    id: 'ares-planet-t2',
    name: 'Ares (Mars Analog)',
    parent: sol,
    mass: 3800,
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

  // Exact entry position on outer solar boundary (R = 480 AU) using incomingAngle
  const entryRadius = 480;
  const probeStartPos = new Vector2(
    Math.cos(incomingAngle) * entryRadius,
    Math.sin(incomingAngle) * entryRadius
  );

  // Exact entry velocity vector pointing in direction of headingAngle
  const speed = Math.max(18.0, Math.min(24.0, incomingSpeed));
  const probeStartVel = new Vector2(
    Math.cos(headingAngle) * speed,
    Math.sin(headingAngle) * speed
  );

  return {
    tier: 2,
    name: 'TIER 2: SOL INTERPLANETARY SYSTEM',
    subtitle: 'Interstellar Insertion ──▶ Mid-Course Guidance Burn ──▶ Terra Descent',
    bodies: allBodies,
    centralStar: sol,
    targetPlanet: terra,
    aresAssist: ares,
    probeStartPos,
    probeStartVel,
    defaultZoom: 0.65,
    targetZoom: 1.15
  };
}

/**
 * Builds Tier 3: Planetary & Moon Subsystem Scale
 * Accurately initialized from Solar entry angle and heading
 */
export function buildPlanetaryScene(incomingAngle = -1.9, headingAngle = 1.2, incomingSpeed = 18.0) {
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

  // Entry position on the outer planetary boundary (R = 140 AU)
  const entryRadius = 140;
  const probeStartPos = new Vector2(
    Math.cos(incomingAngle) * entryRadius,
    Math.sin(incomingAngle) * entryRadius
  );

  // Entry velocity matching headingAngle
  const speed = Math.max(16.0, Math.min(22.0, incomingSpeed));
  const probeStartVel = new Vector2(
    Math.cos(headingAngle) * speed,
    Math.sin(headingAngle) * speed
  );

  return {
    tier: 3,
    name: 'TIER 3: TERRA & LUNA SUBSYSTEM',
    subtitle: 'Orbital Insertion ──▶ Automated RCS Target Braking ──▶ Station Alpha Docking',
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
