/**
 * Galactic Sector - Distribution Models & Procedural Sampling
 * Supports comparing Real-World Astronomical Census vs. Game-Friendly Distribution,
 * with continuous blending, seedable RNG, and statistical breakdown.
 */

import { STELLAR_CLASSES } from './stellar_types.js';

// Mulberry32 Seedable PRNG for deterministic procedural generation
export function createRNG(seed = 1337) {
  let s = Math.floor(seed);
  return function() {
    s |= 0;
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Samples a random number from a normal (Gaussian) distribution using Box-Muller transform.
 */
export function sampleGaussian(rng, mean = 0, stdDev = 1) {
  const u1 = Math.max(1e-7, rng());
  const u2 = rng();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z0 * stdDev;
}

/**
 * Returns normalized weights for the realistic astronomical distribution.
 */
export function getAstronomicalDistribution() {
  const dist = {};
  let total = 0;
  for (const [key, meta] of Object.entries(STELLAR_CLASSES)) {
    if (key === 'SUPERMASSIVE_BLACK_HOLE') continue; // Excluded from general field sampling
    dist[key] = meta.realPercentage;
    total += meta.realPercentage;
  }
  // Normalize to 100%
  for (const key of Object.keys(dist)) {
    dist[key] = (dist[key] / total) * 100;
  }
  return dist;
}

/**
 * Returns normalized weights for the proposed game-friendly distribution.
 */
export function getGameFriendlyDistribution() {
  const dist = {};
  let total = 0;
  for (const [key, meta] of Object.entries(STELLAR_CLASSES)) {
    if (key === 'SUPERMASSIVE_BLACK_HOLE') continue;
    dist[key] = meta.gamePercentage;
    total += meta.gamePercentage;
  }
  // Normalize to 100%
  for (const key of Object.keys(dist)) {
    dist[key] = (dist[key] / total) * 100;
  }
  return dist;
}

/**
 * Blends between Astronomical (blend = 0.0) and Game-Friendly (blend = 1.0).
 */
export function getBlendedDistribution(blend = 1.0) {
  const astro = getAstronomicalDistribution();
  const game = getGameFriendlyDistribution();
  const clampedBlend = Math.max(0, Math.min(1, blend));

  const blended = {};
  let total = 0;
  for (const key of Object.keys(game)) {
    const val = astro[key] * (1 - clampedBlend) + game[key] * clampedBlend;
    blended[key] = val;
    total += val;
  }
  for (const key of Object.keys(blended)) {
    blended[key] = (blended[key] / total) * 100;
  }
  return blended;
}

/**
 * Samples a stellar class from a given distribution using provided RNG.
 */
export function sampleStellarClass(distribution, rng = Math.random) {
  const r = rng() * 100;
  let cumulative = 0;

  for (const [key, weight] of Object.entries(distribution)) {
    cumulative += weight;
    if (r <= cumulative) {
      return STELLAR_CLASSES[key];
    }
  }

  // Fallback to M-Type
  return STELLAR_CLASSES.M_TYPE;
}

/**
 * Computes frequency counts, percentages, and diversity metrics for a sample array.
 */
export function analyzePopulation(sampleList) {
  const counts = {};
  const total = sampleList.length;

  for (const item of sampleList) {
    const id = item.stellarClass ? item.stellarClass.id : item.id;
    counts[id] = (counts[id] || 0) + 1;
  }

  const breakdown = [];
  let shannonEntropy = 0;

  for (const [key, meta] of Object.entries(STELLAR_CLASSES)) {
    if (key === 'SUPERMASSIVE_BLACK_HOLE') continue;
    const count = counts[key] || 0;
    const percent = total > 0 ? (count / total) * 100 : 0;
    if (count > 0) {
      const p = count / total;
      shannonEntropy -= p * Math.log2(p);
    }
    breakdown.push({
      id: key,
      meta,
      count,
      percent,
      astroTarget: getAstronomicalDistribution()[key] || 0,
      gameTarget: getGameFriendlyDistribution()[key] || 0
    });
  }

  // Maximum theoretical Shannon entropy for 11 categories: log2(11) ≈ 3.459
  const maxEntropy = Math.log2(breakdown.length);
  const diversityScore = (shannonEntropy / maxEntropy) * 100; // 0 to 100%

  return {
    total,
    counts,
    breakdown,
    shannonEntropy,
    diversityScore
  };
}

/**
 * Generates an on-demand, deterministic catalog designation for field stars (0 memory storage).
 * e.g., "PERSEUS · TYC-58192" or "SGR-CORE · HIP-4819"
 */
export function getStarCatalogDesignation(star, seed = 1042) {
  const hash = Math.abs(Math.sin((star.rDist || 100) * 43.17 + (star.initialAngle || 1) * 127.31 + seed * 0.001));
  if (star.isCore) {
    const num = Math.floor(hash * 8999) + 1000;
    return `SGR-CORE // HIP-${num}`;
  } else {
    const armNames = ['PERSEUS', 'SCUTUM', 'NORMA', 'CYGNUS', 'CENTAURUS', 'SAGITTARIUS'];
    const armIdx = Math.floor(hash * armNames.length);
    const arm = armNames[armIdx];
    const num = Math.floor(hash * 89999) + 10000;
    return `${arm} // TYC-${num}`;
  }
}

