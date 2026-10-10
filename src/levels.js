import { CelestialBody } from './celestial.js';
import { Waypoint } from './waypoint.js';
import { Vector2 } from './vector.js';

export function createLevels() {
  return [
    // ----------------------------------------------------
    // LEVEL 0: Full 8-Planet Solar System Sandbox
    // ----------------------------------------------------
    {
      id: 0,
      name: 'Solar System Sandbox',
      subtitle: 'Full 8-Planet System · Complete Slingshot Playground',
      description: 'Explore a complete 8-planet solar system with gas giants and orbiting moons. Pick any planet or moon as your launch base, scrub time, and chain together multi-body gravity assists.',
      isSandbox: true,
      hint: 'Scrub time to T+1.5s with ~28 m/s thrust to launch from Earth and directly intercept Europa at Jupiter, or right-click anywhere to drop your own custom target gate!',
      solution: {
        scrubTime: 1.5,
        thrust: 28,
        flightTime: 49.5,
        relSpeed: 14.2,
        advice: 'Earth axial rotation at T+1.5s aligns your surface normal straight toward Jupiter\'s incoming orbital path.'
      },
      build: () => {
        const sun = new CelestialBody({
          id: 'sun',
          name: 'Sol (Star)',
          isStar: true,
          mass: 48000,
          radius: 36,
          color: '#fbbf24',
          glowColor: 'rgba(251, 191, 36, 0.45)',
          surfaceDetailCount: 10,
          rotationSpeed: 0.02
        });

        const hermes = new CelestialBody({
          id: 'hermes',
          name: 'Hermes',
          parent: sun,
          mass: 2200,
          radius: 11,
          orbitRadius: 130,
          orbitSpeed: 0.14,
          initialOrbitAngle: 0.3,
          rotationSpeed: 0.08,
          color: '#94a3b8',
          glowColor: 'rgba(148, 163, 184, 0.3)'
        });

        const aphrodite = new CelestialBody({
          id: 'aphrodite',
          name: 'Aphrodite',
          parent: sun,
          mass: 4500,
          radius: 15,
          orbitRadius: 200,
          orbitSpeed: 0.088,
          initialOrbitAngle: 1.8,
          rotationSpeed: -0.05,
          color: '#f59e0b',
          glowColor: 'rgba(245, 158, 11, 0.35)'
        });

        const terra = new CelestialBody({
          id: 'terra',
          name: 'Terra',
          parent: sun,
          mass: 5500,
          radius: 16,
          orbitRadius: 280,
          orbitSpeed: 0.058,
          initialOrbitAngle: 0.8,
          rotationSpeed: 0.22,
          color: '#38bdf8',
          glowColor: 'rgba(56, 189, 248, 0.4)'
        });

        const luna = new CelestialBody({
          id: 'luna',
          name: 'Luna',
          parent: terra,
          mass: 650,
          radius: 7,
          orbitRadius: 36,
          orbitSpeed: 0.35,
          initialOrbitAngle: 0,
          rotationSpeed: 0.35,
          color: '#cbd5e1',
          glowColor: 'rgba(203, 213, 225, 0.3)'
        });

        const ares = new CelestialBody({
          id: 'ares',
          name: 'Ares',
          parent: sun,
          mass: 3200,
          radius: 13,
          orbitRadius: 370,
          orbitSpeed: 0.042,
          initialOrbitAngle: 3.2,
          rotationSpeed: 0.18,
          color: '#ef4444',
          glowColor: 'rgba(239, 68, 68, 0.35)'
        });

        const phobos = new CelestialBody({
          id: 'phobos',
          name: 'Phobos',
          parent: ares,
          mass: 250,
          radius: 5,
          orbitRadius: 24,
          orbitSpeed: 0.6,
          initialOrbitAngle: 1.5,
          rotationSpeed: 0.6,
          color: '#a8a29e'
        });

        const zeus = new CelestialBody({
          id: 'zeus',
          name: 'Zeus (Gas Giant)',
          parent: sun,
          mass: 22000,
          radius: 28,
          orbitRadius: 530,
          orbitSpeed: 0.024,
          initialOrbitAngle: 1.2,
          rotationSpeed: 0.32,
          color: '#fb923c',
          glowColor: 'rgba(251, 146, 60, 0.4)'
        });

        const io = new CelestialBody({
          id: 'io',
          name: 'Io',
          parent: zeus,
          mass: 750,
          radius: 6,
          orbitRadius: 48,
          orbitSpeed: 0.45,
          initialOrbitAngle: 0.5,
          rotationSpeed: 0.45,
          color: '#facc15'
        });

        const europa = new CelestialBody({
          id: 'europa',
          name: 'Europa',
          parent: zeus,
          mass: 800,
          radius: 7,
          orbitRadius: 72,
          orbitSpeed: 0.28,
          initialOrbitAngle: 2.1,
          rotationSpeed: 0.28,
          color: '#a5f3fc'
        });

        const ganymede = new CelestialBody({
          id: 'ganymede',
          name: 'Ganymede',
          parent: zeus,
          mass: 1100,
          radius: 9,
          orbitRadius: 104,
          orbitSpeed: 0.17,
          initialOrbitAngle: 4.2,
          rotationSpeed: 0.17,
          color: '#d6d3d1'
        });

        const cronus = new CelestialBody({
          id: 'cronus',
          name: 'Cronus (Rings)',
          parent: sun,
          mass: 16000,
          radius: 25,
          orbitRadius: 690,
          orbitSpeed: 0.016,
          initialOrbitAngle: 2.7,
          rotationSpeed: 0.26,
          hasRings: true,
          color: '#eab308',
          glowColor: 'rgba(234, 179, 8, 0.4)'
        });

        const titan = new CelestialBody({
          id: 'titan',
          name: 'Titan',
          parent: cronus,
          mass: 950,
          radius: 8,
          orbitRadius: 62,
          orbitSpeed: 0.22,
          initialOrbitAngle: 1.4,
          rotationSpeed: 0.22,
          color: '#fdba74'
        });

        const ouranos = new CelestialBody({
          id: 'ouranos',
          name: 'Ouranos',
          parent: sun,
          mass: 8000,
          radius: 19,
          orbitRadius: 850,
          orbitSpeed: 0.011,
          initialOrbitAngle: 4.5,
          rotationSpeed: -0.18,
          color: '#22d3ee',
          glowColor: 'rgba(34, 211, 238, 0.35)'
        });

        const titania = new CelestialBody({
          id: 'titania',
          name: 'Titania',
          parent: ouranos,
          mass: 550,
          radius: 6,
          orbitRadius: 45,
          orbitSpeed: 0.28,
          initialOrbitAngle: 0.7,
          rotationSpeed: 0.28,
          color: '#e2e8f0'
        });

        const poseidon = new CelestialBody({
          id: 'poseidon',
          name: 'Poseidon',
          parent: sun,
          mass: 8500,
          radius: 19,
          orbitRadius: 1020,
          orbitSpeed: 0.008,
          initialOrbitAngle: 1.1,
          rotationSpeed: 0.2,
          color: '#3b82f6',
          glowColor: 'rgba(59, 130, 246, 0.4)'
        });

        const triton = new CelestialBody({
          id: 'triton',
          name: 'Triton (Retrograde)',
          parent: poseidon,
          mass: 600,
          radius: 7,
          orbitRadius: 50,
          orbitSpeed: -0.32,
          initialOrbitAngle: 3.0,
          rotationSpeed: -0.32,
          color: '#93c5fd'
        });

        const allBodies = [
          sun, hermes, aphrodite, terra, luna, ares, phobos,
          zeus, io, europa, ganymede, cronus, titan, ouranos,
          titania, poseidon, triton
        ];

        const waypoint = new Waypoint({
          id: 'wp-sandbox',
          name: 'Europa Deep Space Station',
          parent: europa,
          orbitRadius: 24,
          orbitSpeed: 0.8,
          initialOrbitAngle: 0,
          captureRadius: 24,
          maxCaptureSpeed: 18.0
        });

        return {
          bodies: allBodies,
          launchBody: terra,
          launchAngle: 0,
          waypoint,
          defaultThrust: 28,
          defaultAngleOffset: 0,
          maxBurns: 4,
          maxFuel: 150
        };
      }
    },

    // =========================================================================
    // CHAPTER 1: PLANETARY & MOON SUBSYSTEMS (TIER 3)
    // Focused framing: Gas Giant or Terrestrial Planet is the central massive anchor.
    // Clean 2-tier hierarchy eliminates multi-scale screen clutter.
    // =========================================================================

    // ----------------------------------------------------
    // LEVEL 1: Orbital Jump (Terra Subsystem)
    // ----------------------------------------------------
    {
      id: 1,
      name: 'Level 1: Orbital Jump',
      subtitle: 'Chapter 1 · Planetary Tier · Terra Subsystem',
      description: 'Welcome to the Planetary Academy. Terra is the central gravity well. Time your liftoff to fling from the equator into high orbit and dock with Station Alpha.',
      hint: 'Scrub time to T+6.5s to let Terra rotate your launch tower into position. Set Booster Thrust to 32 m/s for a direct orbital injection.',
      solution: {
        scrubTime: 6.5,
        thrust: 32,
        flightTime: 3.7,
        relSpeed: 16.6,
        advice: 'Scrubbing to T+6.5s aligns your surface normal toward the incoming station orbit, providing a direct clamp capture.'
      },
      build: () => {
        const terra = new CelestialBody({
          id: 'terra-1',
          name: 'Terra',
          mass: 12000,
          radius: 20,
          color: '#38bdf8',
          glowColor: 'rgba(56, 189, 248, 0.4)',
          rotationSpeed: 0.25
        });

        const waypoint = new Waypoint({
          id: 'wp-1',
          name: 'Station Alpha',
          parent: terra,
          orbitRadius: 110,
          orbitSpeed: 0.095,
          initialOrbitAngle: 1.0,
          captureRadius: 30,
          maxCaptureSpeed: 18.0
        });

        return {
          bodies: [terra],
          launchBody: terra,
          launchAngle: 0,
          waypoint,
          defaultThrust: 32,
          defaultAngleOffset: 0,
          maxBurns: 2,
          maxFuel: 100
        };
      }
    },

    // ----------------------------------------------------
    // LEVEL 2: The Moon Bridge (Terra & Luna Subsystem)
    // ----------------------------------------------------
    {
      id: 2,
      name: 'Level 2: The Moon Bridge',
      subtitle: 'Chapter 1 · Planetary Tier · Terra & Luna Subsystem',
      description: 'Luna orbits Terra just outside your launch corridor. Use Luna’s moving gravitational field to bend your trajectory into the high orbital gateway.',
      hint: 'Scrub time to T+3.0s and fire at 32 m/s. Luna swings by along the path to give a slight gravity assist toward the outer gate.',
      solution: {
        scrubTime: 3.0,
        thrust: 32,
        flightTime: 68.5,
        relSpeed: 17.5,
        advice: 'T+3.0s threads through Luna\'s trailing gravity wake, slingshotting smoothly across the lunar gap.'
      },
      build: () => {
        const terra = new CelestialBody({
          id: 'terra-2',
          name: 'Terra',
          mass: 12000,
          radius: 20,
          color: '#38bdf8',
          glowColor: 'rgba(56, 189, 248, 0.4)',
          rotationSpeed: 0.25
        });

        const luna = new CelestialBody({
          id: 'luna-2',
          name: 'Luna',
          parent: terra,
          mass: 2200,
          radius: 9,
          orbitRadius: 135,
          orbitSpeed: 0.13,
          initialOrbitAngle: 0.4,
          rotationSpeed: 0.13,
          color: '#cbd5e1',
          glowColor: 'rgba(203, 213, 225, 0.3)'
        });

        const waypoint = new Waypoint({
          id: 'wp-2',
          name: 'High Orbital Gate',
          parent: terra,
          orbitRadius: 240,
          orbitSpeed: 0.075,
          initialOrbitAngle: 2.2,
          captureRadius: 32,
          maxCaptureSpeed: 18.0
        });

        return {
          bodies: [terra, luna],
          launchBody: terra,
          launchAngle: 0,
          waypoint,
          defaultThrust: 32,
          defaultAngleOffset: 0,
          maxBurns: 2,
          maxFuel: 100
        };
      }
    },

    // ----------------------------------------------------
    // LEVEL 3: Jovian Resonance (Zeus & Io Subsystem)
    // ----------------------------------------------------
    {
      id: 3,
      name: 'Level 3: Jovian Resonance',
      subtitle: 'Chapter 1 · Planetary Tier · Zeus & Io Subsystem',
      description: 'You are stationed on the volcanic moon Io, tightly orbiting massive gas giant Zeus. Escape Io’s shallow gravity well to rendezvous with the Jovian Outpost.',
      hint: 'Because Io is in rapid orbit, a gentle 14 m/s burn at T+16.0s utilizes Io\'s orbital speed to fling outward into Zeus\'s outer envelope.',
      solution: {
        scrubTime: 16.0,
        thrust: 14,
        flightTime: 6.6,
        relSpeed: 14.7,
        advice: 'Io orbital velocity does most of the heavy lifting. Launch prograde with minimal booster thrust.'
      },
      build: () => {
        const zeus = new CelestialBody({
          id: 'zeus-3',
          name: 'Zeus',
          mass: 24000,
          radius: 30,
          color: '#fb923c',
          glowColor: 'rgba(251, 146, 60, 0.4)',
          rotationSpeed: 0.15
        });

        const io = new CelestialBody({
          id: 'io-3',
          name: 'Io (Launch Site)',
          parent: zeus,
          mass: 1600,
          radius: 8,
          orbitRadius: 105,
          orbitSpeed: 0.22,
          initialOrbitAngle: 0.2,
          rotationSpeed: 0.22,
          color: '#facc15',
          glowColor: 'rgba(250, 204, 21, 0.3)'
        });

        const waypoint = new Waypoint({
          id: 'wp-3',
          name: 'Jovian Outpost',
          parent: zeus,
          orbitRadius: 200,
          orbitSpeed: 0.13,
          initialOrbitAngle: 1.8,
          captureRadius: 30,
          maxCaptureSpeed: 16.0
        });

        return {
          bodies: [zeus, io],
          launchBody: io,
          launchAngle: 0,
          waypoint,
          defaultThrust: 14,
          defaultAngleOffset: 0,
          maxBurns: 2,
          maxFuel: 100
        };
      }
    },

    // ----------------------------------------------------
    // LEVEL 4: Cronus Ring Run (Cronus & Titan Subsystem)
    // ----------------------------------------------------
    {
      id: 4,
      name: 'Level 4: Cronus Ring Run',
      subtitle: 'Chapter 1 · Planetary Tier · Cronus & Titan Subsystem',
      description: 'Launch from cold moon Titan into an inward Hohmann drop toward the majestic golden rings of Cronus. Dock at the Ring Station.',
      hint: 'Scrub time to T+25.0s and fire at 24 m/s. Titan\'s rotation points retrograde to cancel its orbital speed and drop inward toward the rings.',
      solution: {
        scrubTime: 25.0,
        thrust: 24,
        flightTime: 5.8,
        relSpeed: 11.1,
        advice: 'Retrograde launch relative to Titan\'s motion drops orbital periapsis directly into the Ring Station\'s path.'
      },
      build: () => {
        const cronus = new CelestialBody({
          id: 'cronus-4',
          name: 'Cronus',
          mass: 20000,
          radius: 26,
          hasRings: true,
          color: '#eab308',
          glowColor: 'rgba(234, 179, 8, 0.4)',
          rotationSpeed: 0.18
        });

        const titan = new CelestialBody({
          id: 'titan-4',
          name: 'Titan (Launch Site)',
          parent: cronus,
          mass: 1800,
          radius: 9,
          orbitRadius: 220,
          orbitSpeed: 0.09,
          initialOrbitAngle: 0.8,
          rotationSpeed: 0.25,
          color: '#fdba74',
          glowColor: 'rgba(253, 186, 116, 0.3)'
        });

        const waypoint = new Waypoint({
          id: 'wp-4',
          name: 'Ring Station',
          parent: cronus,
          orbitRadius: 110,
          orbitSpeed: 0.123,
          initialOrbitAngle: 0.0,
          captureRadius: 32,
          maxCaptureSpeed: 18.0
        });

        return {
          bodies: [cronus, titan],
          launchBody: titan,
          launchAngle: 0,
          waypoint,
          defaultThrust: 24,
          defaultAngleOffset: 0,
          maxBurns: 2,
          maxFuel: 100
        };
      }
    },

    // =========================================================================
    // CHAPTER 2: INTERPLANETARY SOLAR SYSTEMS (TIER 2)
    // Scale jumps to Interplanetary: Star Sol at the center, primary planets orbiting.
    // =========================================================================

    // ----------------------------------------------------
    // LEVEL 5: Inner Solar Leap (Sol & Astra)
    // ----------------------------------------------------
    {
      id: 5,
      name: 'Level 5: Inner Solar Leap',
      subtitle: 'Chapter 2 · Solar Tier · Sol & Astra',
      description: 'Transitioning to Interplanetary Scale! Star Sol now commands the center. Launch from rocky planet Astra on an outward transfer arc to Deep Space Beacon Alpha.',
      hint: 'Scrub time to T+18.0s and dial Booster Thrust to 26 m/s. Astra\'s orbital momentum carries the ship along a smooth elliptic transfer.',
      solution: {
        scrubTime: 18.0,
        thrust: 26,
        flightTime: 16.8,
        relSpeed: 15.0,
        advice: 'Prograde launch at T+18.0s adds to Astra\'s heliocentric velocity for an efficient interplanetary transfer.'
      },
      build: () => {
        const sol = new CelestialBody({
          id: 'sol-5',
          name: 'Sol (Star)',
          isStar: true,
          mass: 38000,
          radius: 36,
          color: '#fbbf24',
          glowColor: 'rgba(251, 191, 36, 0.45)',
          rotationSpeed: 0.02
        });

        const astra = new CelestialBody({
          id: 'astra-5',
          name: 'Astra (Launch Site)',
          parent: sol,
          mass: 4600,
          radius: 15,
          orbitRadius: 200,
          orbitSpeed: 0.072,
          initialOrbitAngle: 0.4,
          rotationSpeed: 0.22,
          color: '#38bdf8',
          glowColor: 'rgba(56, 189, 248, 0.4)'
        });

        const waypoint = new Waypoint({
          id: 'wp-5',
          name: 'Deep Space Beacon Alpha',
          parent: sol,
          orbitRadius: 340,
          orbitSpeed: 0.045,
          initialOrbitAngle: 2.0,
          captureRadius: 32,
          maxCaptureSpeed: 16.0
        });

        return {
          bodies: [sol, astra],
          launchBody: astra,
          launchAngle: 0,
          waypoint,
          defaultThrust: 26,
          defaultAngleOffset: 0,
          maxBurns: 2,
          maxFuel: 100
        };
      }
    },

    // ----------------------------------------------------
    // LEVEL 6: Martian Slingshot (Sol, Terra & Ares)
    // ----------------------------------------------------
    {
      id: 6,
      name: 'Level 6: Martian Slingshot',
      subtitle: 'Chapter 2 · Solar Tier · Sol, Terra & Ares',
      description: 'Launch from Terra and use red planet Ares for an interplanetary gravity assist to fling the vessel out to the Asteroid Belt Spaceport.',
      hint: 'Scrub time to T+20.5s with 28 m/s thrust. Watch the ghost encounter appear at Ares as the craft whips around its trailing edge.',
      solution: {
        scrubTime: 20.5,
        thrust: 28,
        flightTime: 28.9,
        relSpeed: 14.6,
        advice: 'Ares flyby bends the heliocentric velocity vector outward, reaching the 470 AU spaceport with zero cruise fuel spent.'
      },
      build: () => {
        const sol = new CelestialBody({
          id: 'sol-6',
          name: 'Sol (Star)',
          isStar: true,
          mass: 42000,
          radius: 36,
          color: '#fbbf24',
          glowColor: 'rgba(251, 191, 36, 0.45)',
          rotationSpeed: 0.02
        });

        const terra = new CelestialBody({
          id: 'terra-6',
          name: 'Terra (Launch Site)',
          parent: sol,
          mass: 4800,
          radius: 15,
          orbitRadius: 210,
          orbitSpeed: 0.070,
          initialOrbitAngle: 0.4,
          rotationSpeed: 0.22,
          color: '#38bdf8',
          glowColor: 'rgba(56, 189, 248, 0.4)'
        });

        const ares = new CelestialBody({
          id: 'ares-6',
          name: 'Ares (Slingshot Target)',
          parent: sol,
          mass: 3800,
          radius: 13,
          orbitRadius: 320,
          orbitSpeed: 0.048,
          initialOrbitAngle: 1.8,
          rotationSpeed: 0.18,
          color: '#ef4444',
          glowColor: 'rgba(239, 68, 68, 0.35)'
        });

        const waypoint = new Waypoint({
          id: 'wp-6',
          name: 'Asteroid Belt Spaceport',
          parent: sol,
          orbitRadius: 470,
          orbitSpeed: 0.028,
          initialOrbitAngle: 3.1,
          captureRadius: 32,
          maxCaptureSpeed: 16.0
        });

        return {
          bodies: [sol, terra, ares],
          launchBody: terra,
          launchAngle: 0,
          waypoint,
          defaultThrust: 28,
          defaultAngleOffset: 0,
          maxBurns: 3,
          maxFuel: 120
        };
      }
    },

    // ----------------------------------------------------
    // LEVEL 7: Retrograde Vortex (Sol, Terra & Aphrodite)
    // ----------------------------------------------------
    {
      id: 7,
      name: 'Level 7: Retrograde Vortex',
      subtitle: 'Chapter 2 · Solar Tier · Sol, Terra & Aphrodite Retrograde',
      description: 'Inner planet Aphrodite rotates clockwise in retrograde. Launch inward from Terra into Aphrodite\'s dense gravitational well to intercept the Solar Probe.',
      hint: 'Scrub time to T+23.5s and launch at 22 m/s. The inward dive harnesses Aphrodite\'s gravitational pull without needing excessive thruster fuel.',
      solution: {
        scrubTime: 23.5,
        thrust: 22,
        flightTime: 44.8,
        relSpeed: 9.6,
        advice: 'Inward burn shaves orbital angular momentum, matching Aphrodite\'s speedy inner orbit with an ultra-smooth relative speed under 10 m/s.'
      },
      build: () => {
        const sol = new CelestialBody({
          id: 'sol-7',
          name: 'Sol (Star)',
          isStar: true,
          mass: 40000,
          radius: 36,
          color: '#fbbf24',
          glowColor: 'rgba(251, 191, 36, 0.45)',
          rotationSpeed: 0.02
        });

        const terra = new CelestialBody({
          id: 'terra-7',
          name: 'Terra (Launch Site)',
          parent: sol,
          mass: 4800,
          radius: 15,
          orbitRadius: 230,
          orbitSpeed: 0.066,
          initialOrbitAngle: 0.6,
          rotationSpeed: 0.22,
          color: '#38bdf8',
          glowColor: 'rgba(56, 189, 248, 0.4)'
        });

        const aphrodite = new CelestialBody({
          id: 'aph-7',
          name: 'Aphrodite (Retrograde)',
          parent: sol,
          mass: 4400,
          radius: 14,
          orbitRadius: 160,
          orbitSpeed: 0.102,
          initialOrbitAngle: 2.2,
          rotationSpeed: -0.15,
          color: '#f59e0b',
          glowColor: 'rgba(245, 158, 11, 0.35)'
        });

        const waypoint = new Waypoint({
          id: 'wp-7',
          name: 'Solar Probe Heliostation',
          parent: sol,
          orbitRadius: 155,
          orbitSpeed: 0.105,
          initialOrbitAngle: 2.2,
          captureRadius: 30,
          maxCaptureSpeed: 18.0
        });

        return {
          bodies: [sol, terra, aphrodite],
          launchBody: terra,
          launchAngle: 0,
          waypoint,
          defaultThrust: 22,
          defaultAngleOffset: 0,
          maxBurns: 3,
          maxFuel: 120
        };
      }
    },

    // ----------------------------------------------------
    // LEVEL 8: Jovian Catapult (Sol, Terra & Zeus)
    // ----------------------------------------------------
    {
      id: 8,
      name: 'Level 8: Jovian Catapult',
      subtitle: 'Chapter 2 · Solar Tier · Sol, Terra & Zeus',
      description: 'Harness the mammoth gravitational engine of gas giant Zeus. A close hyperbolic pass around Zeus will fling your ship to the outer rim of the star system.',
      hint: 'Scrub time to T+20.5s with 24 m/s thrust. Zeus will intercept the vessel and whip it toward the distant Deep Space Gate at 680 AU.',
      solution: {
        scrubTime: 20.5,
        thrust: 24,
        flightTime: 72.2,
        relSpeed: 13.9,
        advice: 'Zeus adds massive hyperbolic velocity boost, vaulting all the way out to the Kuiper gate with minimal fuel.'
      },
      build: () => {
        const sol = new CelestialBody({
          id: 'sol-8',
          name: 'Sol (Star)',
          isStar: true,
          mass: 44000,
          radius: 36,
          color: '#fbbf24',
          glowColor: 'rgba(251, 191, 36, 0.45)',
          rotationSpeed: 0.02
        });

        const terra = new CelestialBody({
          id: 'terra-8',
          name: 'Terra (Launch Site)',
          parent: sol,
          mass: 4800,
          radius: 15,
          orbitRadius: 210,
          orbitSpeed: 0.070,
          initialOrbitAngle: 0.4,
          rotationSpeed: 0.22,
          color: '#38bdf8',
          glowColor: 'rgba(56, 189, 248, 0.4)'
        });

        const zeus = new CelestialBody({
          id: 'zeus-8',
          name: 'Zeus (Gas Giant)',
          parent: sol,
          mass: 25000,
          radius: 30,
          orbitRadius: 460,
          orbitSpeed: 0.028,
          initialOrbitAngle: 2.6,
          rotationSpeed: 0.20,
          color: '#fb923c',
          glowColor: 'rgba(251, 146, 60, 0.4)'
        });

        const waypoint = new Waypoint({
          id: 'wp-8',
          name: 'Kuiper Gateway Station',
          parent: sol,
          orbitRadius: 680,
          orbitSpeed: 0.016,
          initialOrbitAngle: 3.6,
          captureRadius: 36,
          maxCaptureSpeed: 24.0
        });

        return {
          bodies: [sol, terra, zeus],
          launchBody: terra,
          launchAngle: 0,
          waypoint,
          defaultThrust: 24,
          defaultAngleOffset: 0,
          maxBurns: 3,
          maxFuel: 120
        };
      }
    },

    // =========================================================================
    // CHAPTER 3: MASTER CLASS MULTI-BODY SYSTEMS
    // Chained gravitational assists and multi-body capture.
    // =========================================================================

    // ----------------------------------------------------
    // LEVEL 9: Triple Assist (Sol, Terra, Ares & Zeus)
    // ----------------------------------------------------
    {
      id: 9,
      name: 'Level 9: Triple Assist',
      subtitle: 'Chapter 3 · Master Class Multi-Body · Sol, Terra, Ares & Zeus',
      description: 'Master pilot evaluation: Chain sequential gravity assists past Ares and gas giant Zeus to reach the deep space research station without collision.',
      hint: 'Scrub time to T+20.5s and launch at 30 m/s. Watch the two encounter ghosts align on your trajectory projection.',
      solution: {
        scrubTime: 20.5,
        thrust: 30,
        flightTime: 38.4,
        relSpeed: 17.2,
        advice: 'Dual gravity boosts from Ares and Zeus align along the elliptic trajectory for a grand tour injection.'
      },
      build: () => {
        const sol = new CelestialBody({
          id: 'sol-9',
          name: 'Sol (Star)',
          isStar: true,
          mass: 46000,
          radius: 38,
          color: '#fbbf24',
          glowColor: 'rgba(251, 191, 36, 0.45)',
          rotationSpeed: 0.02
        });

        const terra = new CelestialBody({
          id: 'terra-9',
          name: 'Terra (Launch Site)',
          parent: sol,
          mass: 4800,
          radius: 15,
          orbitRadius: 220,
          orbitSpeed: 0.068,
          initialOrbitAngle: 0.3,
          rotationSpeed: 0.22,
          color: '#38bdf8',
          glowColor: 'rgba(56, 189, 248, 0.4)'
        });

        const ares = new CelestialBody({
          id: 'ares-9',
          name: 'Ares',
          parent: sol,
          mass: 3600,
          radius: 13,
          orbitRadius: 320,
          orbitSpeed: 0.047,
          initialOrbitAngle: 1.5,
          rotationSpeed: 0.18,
          color: '#ef4444',
          glowColor: 'rgba(239, 68, 68, 0.35)'
        });

        const zeus = new CelestialBody({
          id: 'zeus-9',
          name: 'Zeus',
          parent: sol,
          mass: 24000,
          radius: 30,
          orbitRadius: 490,
          orbitSpeed: 0.026,
          initialOrbitAngle: 2.8,
          rotationSpeed: 0.22,
          color: '#fb923c',
          glowColor: 'rgba(251, 146, 60, 0.4)'
        });

        const waypoint = new Waypoint({
          id: 'wp-9',
          name: 'Frontier Orbital Array',
          parent: sol,
          orbitRadius: 660,
          orbitSpeed: 0.016,
          initialOrbitAngle: 3.5,
          captureRadius: 35,
          maxCaptureSpeed: 18.0
        });

        return {
          bodies: [sol, terra, ares, zeus],
          launchBody: terra,
          launchAngle: 0,
          waypoint,
          defaultThrust: 30,
          defaultAngleOffset: 0,
          maxBurns: 4,
          maxFuel: 150
        };
      }
    },

    // ----------------------------------------------------
    // LEVEL 10: Grand Jovian Tour (Multi-Body Planetary Capture)
    // ----------------------------------------------------
    {
      id: 10,
      name: 'Level 10: Grand Jovian Tour',
      subtitle: 'Chapter 3 · Master Class Multi-Body · Sol-to-Zeus Capture',
      description: 'The pinnacle mission: Launch from inner planet Terra, whip past Ares, and perform an interplanetary orbital insertion directly into Zeus\'s tightly orbiting Moon Station.',
      hint: 'Scrub time to T+20.0s with 24 m/s thrust. Arrive right inside Zeus\'s moon system at low relative velocity.',
      solution: {
        scrubTime: 20.0,
        thrust: 24,
        flightTime: 32.2,
        relSpeed: 6.3,
        advice: 'Gentle 24 m/s burn at T+20.0s reaches Zeus at apex of elliptical transfer, yielding an ultra-low relative speed of only 6.3 m/s.'
      },
      build: () => {
        const sol = new CelestialBody({
          id: 'sol-10',
          name: 'Sol (Star)',
          isStar: true,
          mass: 46000,
          radius: 38,
          color: '#fbbf24',
          glowColor: 'rgba(251, 191, 36, 0.45)',
          rotationSpeed: 0.02
        });

        const terra = new CelestialBody({
          id: 'terra-10',
          name: 'Terra (Launch Site)',
          parent: sol,
          mass: 4800,
          radius: 15,
          orbitRadius: 210,
          orbitSpeed: 0.070,
          initialOrbitAngle: 0.5,
          rotationSpeed: 0.22,
          color: '#38bdf8',
          glowColor: 'rgba(56, 189, 248, 0.4)'
        });

        const ares = new CelestialBody({
          id: 'ares-10',
          name: 'Ares',
          parent: sol,
          mass: 3500,
          radius: 13,
          orbitRadius: 310,
          orbitSpeed: 0.048,
          initialOrbitAngle: 1.7,
          rotationSpeed: 0.18,
          color: '#ef4444',
          glowColor: 'rgba(239, 68, 68, 0.35)'
        });

        const zeus = new CelestialBody({
          id: 'zeus-10',
          name: 'Zeus',
          parent: sol,
          mass: 23000,
          radius: 28,
          orbitRadius: 470,
          orbitSpeed: 0.028,
          initialOrbitAngle: 3.0,
          rotationSpeed: 0.20,
          color: '#fb923c',
          glowColor: 'rgba(251, 146, 60, 0.4)'
        });

        const waypoint = new Waypoint({
          id: 'wp-10',
          name: 'Zeus Orbit Station',
          parent: zeus,
          orbitRadius: 62,
          orbitSpeed: 0.28,
          initialOrbitAngle: 1.0,
          captureRadius: 32,
          maxCaptureSpeed: 18.0
        });

        return {
          bodies: [sol, terra, ares, zeus],
          launchBody: terra,
          launchAngle: 0,
          waypoint,
          defaultThrust: 24,
          defaultAngleOffset: 0,
          maxBurns: 4,
          maxFuel: 150
        };
      }
    }
  ];
}
