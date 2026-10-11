/**
 * Galactic Sector - Stellar Classification & Physical Constants
 * Based on Milky Way astrophysical research (Morgan-Keenan & stellar remnants)
 * Calibrated for Orbital Puzzle game mechanics.
 */

export const STELLAR_CLASSES = {
  // -------------------------------------------------------------------------
  // MAIN-SEQUENCE STARS (Morgan-Keenan O-B-A-F-G-K-M)
  // -------------------------------------------------------------------------
  O_TYPE: {
    id: 'O_TYPE',
    name: 'O-Type Blue Supergiant',
    shortName: 'Class O',
    category: 'MAIN_SEQUENCE',
    spectralClass: 'O',
    color: '#60a5fa',
    coreColor: '#ffffff',
    coronaColor: 'rgba(96, 165, 250, 0.45)',
    flareColor: 'rgba(147, 197, 253, 0.7)',
    realPercentage: 0.00003, // 1 in 3 million
    gamePercentage: 2.0,      // Rare celestial behemoth
    temperatureK: 38000,
    solarMasses: 24.0,
    gameMass: 85000,
    gameRadius: 42,
    soiMultiplier: 6.0,
    binaryLikelihood: 0.85,  // Real astronomy: massive stars almost always have companions
    description: 'Blindingly luminous, hyper-massive blue star. Lives fast and dies young in a supernova.',
    gameplayMechanics: 'Massive gravitational anchor with enormous capture SOI. Immense slingshot potential.'
  },

  B_TYPE: {
    id: 'B_TYPE',
    name: 'B-Type Blue-White Giant',
    shortName: 'Class B',
    category: 'MAIN_SEQUENCE',
    spectralClass: 'B',
    color: '#93c5fd',
    coreColor: '#f8fafc',
    coronaColor: 'rgba(147, 197, 253, 0.40)',
    flareColor: 'rgba(191, 219, 254, 0.6)',
    realPercentage: 0.13,
    gamePercentage: 4.0,
    temperatureK: 18000,
    solarMasses: 7.5,
    gameMass: 62000,
    gameRadius: 34,
    soiMultiplier: 5.5,
    binaryLikelihood: 0.70,
    description: 'Hot blue-white star (Rigel/Spica analog). Dominates night skies despite relative rarity.',
    gameplayMechanics: 'High-speed ejection corridors; excellent secondary anchor for binary transfer puzzles.'
  },

  A_TYPE: {
    id: 'A_TYPE',
    name: 'A-Type White Star',
    shortName: 'Class A',
    category: 'MAIN_SEQUENCE',
    spectralClass: 'A',
    color: '#e2e8f0',
    coreColor: '#ffffff',
    coronaColor: 'rgba(226, 232, 240, 0.35)',
    flareColor: 'rgba(255, 255, 255, 0.55)',
    realPercentage: 0.6,
    gamePercentage: 6.0,
    temperatureK: 8500,
    solarMasses: 1.8,
    gameMass: 44000,
    gameRadius: 28,
    soiMultiplier: 4.8,
    binaryLikelihood: 0.55,
    description: 'Luminous white star (Sirius/Vega analog). Rapid axial rotation creates equatorial bulge.',
    gameplayMechanics: 'Fast surface rotation boost; stable anchor for medium-difficulty interplanetary transfers.'
  },

  F_TYPE: {
    id: 'F_TYPE',
    name: 'F-Type Yellow-White Star',
    shortName: 'Class F',
    category: 'MAIN_SEQUENCE',
    spectralClass: 'F',
    color: '#fef08a',
    coreColor: '#ffffff',
    coronaColor: 'rgba(254, 240, 138, 0.35)',
    flareColor: 'rgba(253, 224, 71, 0.55)',
    realPercentage: 3.0,
    gamePercentage: 9.0,
    temperatureK: 6800,
    solarMasses: 1.25,
    gameMass: 34000,
    gameRadius: 24,
    soiMultiplier: 4.4,
    binaryLikelihood: 0.45,
    description: 'Energetic yellow-white dwarf (Procyon analog). Moderately wide habitable zone.',
    gameplayMechanics: 'Balanced mass and predictable gravitational pull; ideal staging post.'
  },

  G_TYPE: {
    id: 'G_TYPE',
    name: 'G-Type Yellow Dwarf (Solar Twin)',
    shortName: 'Class G',
    category: 'MAIN_SEQUENCE',
    spectralClass: 'G',
    color: '#fbbf24',
    coreColor: '#fffbeb',
    coronaColor: 'rgba(251, 191, 36, 0.35)',
    flareColor: 'rgba(245, 158, 11, 0.55)',
    realPercentage: 7.6,
    gamePercentage: 14.0,
    temperatureK: 5600,
    solarMasses: 1.0,
    gameMass: 26000,
    gameRadius: 21,
    soiMultiplier: 4.0,
    binaryLikelihood: 0.40,
    description: 'Our Sun (Sol analog). Rich planetary systems and stable 10-billion-year lifespan.',
    gameplayMechanics: 'The classic baseline standard; supports rich multi-planet orbital arrays.'
  },

  K_TYPE: {
    id: 'K_TYPE',
    name: 'K-Type Orange Dwarf',
    shortName: 'Class K',
    category: 'MAIN_SEQUENCE',
    spectralClass: 'K',
    color: '#fb923c',
    coreColor: '#fff7ed',
    coronaColor: 'rgba(251, 146, 60, 0.32)',
    flareColor: 'rgba(234, 88, 12, 0.5)',
    realPercentage: 12.1,
    gamePercentage: 18.0,
    temperatureK: 4400,
    solarMasses: 0.65,
    gameMass: 17000,
    gameRadius: 17,
    soiMultiplier: 3.8,
    binaryLikelihood: 0.35,
    description: 'The astrobiological "Goldilocks" star. Extremely stable, gentle radiation environment.',
    gameplayMechanics: 'Gentle gravity well; allows fuel-efficient low-thrust gravity assists.'
  },

  M_TYPE: {
    id: 'M_TYPE',
    name: 'M-Type Red Dwarf',
    shortName: 'Class M',
    category: 'MAIN_SEQUENCE',
    spectralClass: 'M',
    color: '#ef4444',
    coreColor: '#fecaca',
    coronaColor: 'rgba(239, 68, 68, 0.30)',
    flareColor: 'rgba(220, 38, 38, 0.45)',
    realPercentage: 76.5 * 0.78, // ~59.7% of all objects
    gamePercentage: 26.0,
    temperatureK: 3100,
    solarMasses: 0.25,
    gameMass: 9000,
    gameRadius: 13,
    soiMultiplier: 3.5,
    binaryLikelihood: 0.25,
    description: 'The most numerous star in the cosmos (Proxima/TRAPPIST analog). Compact planetary orbits.',
    gameplayMechanics: 'Tight, rapid orbital periods. Launch windows cycle rapidly; low delta-v requirements.'
  },

  // -------------------------------------------------------------------------
  // SUB-STELLAR & EVOLVED GIANTS
  // -------------------------------------------------------------------------
  BROWN_DWARF: {
    id: 'BROWN_DWARF',
    name: 'Brown Dwarf (Failed Star)',
    shortName: 'Brown Dwarf',
    category: 'SUB_STELLAR',
    spectralClass: 'L/T/Y',
    color: '#a855f7',
    coreColor: '#3b0764',
    coronaColor: 'rgba(168, 85, 247, 0.25)',
    flareColor: 'rgba(147, 51, 234, 0.4)',
    realPercentage: 16.0,
    gamePercentage: 5.0,
    temperatureK: 1200,
    solarMasses: 0.05,
    gameMass: 3500,
    gameRadius: 10,
    soiMultiplier: 3.2,
    binaryLikelihood: 0.20,
    description: 'Sub-stellar object between gas giant and star. Emits faint infrared thermal radiation.',
    gameplayMechanics: 'Shallow gravity well; stealth stepping-stone between interstellar star systems.'
  },

  RED_GIANT: {
    id: 'RED_GIANT',
    name: 'Evolved Red Giant',
    shortName: 'Red Giant',
    category: 'EVOLVED',
    spectralClass: 'M-III / K-III',
    color: '#f87171',
    coreColor: '#fee2e2',
    coronaColor: 'rgba(248, 113, 113, 0.4)',
    flareColor: 'rgba(239, 68, 68, 0.6)',
    realPercentage: 0.45,
    gamePercentage: 3.0,
    temperatureK: 3400,
    solarMasses: 2.2,
    gameMass: 32000,
    gameRadius: 52, // Enormous physical envelope!
    soiMultiplier: 3.0,
    binaryLikelihood: 0.40,
    description: 'Dying star swollen to immense size (Aldebaran/Betelgeuse analog). Low density outer envelope.',
    gameplayMechanics: 'Huge collision footprint! Requires wide clearance while negotiating high orbital velocity.'
  },

  // -------------------------------------------------------------------------
  // STELLAR REMNANTS (Compact Exotics)
  // -------------------------------------------------------------------------
  WHITE_DWARF: {
    id: 'WHITE_DWARF',
    name: 'White Dwarf (Degenerate Core)',
    shortName: 'White Dwarf',
    category: 'REMNANT',
    spectralClass: 'D',
    color: '#67e8f9',
    coreColor: '#ffffff',
    coronaColor: 'rgba(103, 232, 249, 0.45)',
    flareColor: 'rgba(6, 182, 212, 0.7)',
    realPercentage: 4.5,
    gamePercentage: 5.0,
    temperatureK: 25000,
    solarMasses: 0.9,
    gameMass: 24000,
    gameRadius: 7, // Earth-sized core in space
    soiMultiplier: 7.0,
    binaryLikelihood: 0.50,
    description: 'Earth-sized crystalline core of a dead star. Immense density produces sharp gravity gradients.',
    gameplayMechanics: 'Tiny collision target with deep gravitational well. Sharp, acute slingshot turns.'
  },

  PULSAR: {
    id: 'PULSAR',
    name: 'Pulsar / Neutron Star',
    shortName: 'Pulsar',
    category: 'REMNANT',
    spectralClass: 'NS',
    color: '#38bdf8',
    coreColor: '#ffffff',
    coronaColor: 'rgba(56, 189, 248, 0.6)',
    flareColor: 'rgba(14, 165, 233, 0.8)',
    realPercentage: 0.35,
    gamePercentage: 3.0,
    temperatureK: 1000000,
    solarMasses: 1.6,
    gameMass: 45000,
    gameRadius: 5, // Extremely compact
    soiMultiplier: 8.0,
    hasMagneticBeams: true,
    beamSpeed: 2.4, // rad/s sweeping radiation beams
    beamLength: 140,
    binaryLikelihood: 0.35,
    description: 'Rapidly spinning neutron star emitting relativistic radiation beams like a cosmic lighthouse.',
    gameplayMechanics: 'Extreme gravity well with sweeping magnetic death beams. High risk, hyper-acceleration assist.'
  },

  BLACK_HOLE: {
    id: 'BLACK_HOLE',
    name: 'Stellar Black Hole',
    shortName: 'Black Hole',
    category: 'REMNANT',
    spectralClass: 'BH',
    color: '#000000',
    coreColor: '#000000',
    coronaColor: 'rgba(245, 158, 11, 0.4)', // Glowing accretion disk
    flareColor: 'rgba(217, 119, 6, 0.7)',
    realPercentage: 0.08,
    gamePercentage: 2.0,
    temperatureK: 0,
    solarMasses: 12.0,
    gameMass: 95000,
    gameRadius: 10, // Event Horizon (Schwarzschild radius)
    soiMultiplier: 9.0,
    hasAccretionDisk: true,
    accretionDiskRadius: 38,
    hasPhotonRing: true,
    binaryLikelihood: 0.60, // Often feeds on a companion star (Cygnus X-1)
    description: 'Total gravitational collapse beyond the event horizon. Accretion disk glows with superheated matter.',
    gameplayMechanics: 'Crossing the event horizon is fatal. Grazing the photon ring provides hyper-velocity slingshots.'
  },

  SUPERMASSIVE_BLACK_HOLE: {
    id: 'SUPERMASSIVE_BLACK_HOLE',
    name: 'Galactic Core (Sagittarius A* Analog)',
    shortName: 'SMBH Core',
    category: 'GALACTIC_CORE',
    spectralClass: 'SMBH',
    color: '#000000',
    coreColor: '#000000',
    coronaColor: 'rgba(168, 85, 247, 0.5)', // Relativistic purple/gold accretion
    flareColor: 'rgba(236, 72, 153, 0.8)',
    realPercentage: 0.000001, // 1 per galaxy
    gamePercentage: 1.0,      // Sector Centerpiece
    temperatureK: 0,
    solarMasses: 4000000,
    gameMass: 220000,
    gameRadius: 22,
    soiMultiplier: 12.0,
    hasAccretionDisk: true,
    accretionDiskRadius: 85,
    hasPhotonRing: true,
    binaryLikelihood: 0.0,
    description: 'The supermassive gravitational anchor of the galactic sector. Governs interstellar cluster orbits.',
    gameplayMechanics: 'Supreme gravity anchor for the entire sector. Commands the master galactic campaign level.'
  }
};
