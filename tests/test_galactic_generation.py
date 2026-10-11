import math
import pytest

def create_mulberry32(seed=1042):
    s = seed
    def rng():
        nonlocal s
        s = (s + 0x6D2B79F5) & 0xFFFFFFFF
        t = (s ^ (s >> 15)) * ((1 | s) & 0xFFFFFFFF) & 0xFFFFFFFF
        t = (t + ((t ^ (t >> 7)) * ((61 | t) & 0xFFFFFFFF) & 0xFFFFFFFF)) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296.0
    return rng

STELLAR_CLASSES = {
    'SUPERMASSIVE_BLACK_HOLE': {'id': 'SMBH', 'gameMass': 220000, 'gameRadius': 28, 'soiMultiplier': 9.0},
    'O_TYPE': {'id': 'O_TYPE', 'gamePercentage': 2.5, 'gameMass': 55000, 'gameRadius': 22, 'soiMultiplier': 3.5, 'binaryLikelihood': 0.75},
    'B_TYPE': {'id': 'B_TYPE', 'gamePercentage': 6.0, 'gameMass': 42000, 'gameRadius': 18, 'soiMultiplier': 3.2, 'binaryLikelihood': 0.60},
    'A_TYPE': {'id': 'A_TYPE', 'gamePercentage': 9.5, 'gameMass': 32000, 'gameRadius': 15, 'soiMultiplier': 3.0, 'binaryLikelihood': 0.50},
    'F_TYPE': {'id': 'F_TYPE', 'gamePercentage': 12.0, 'gameMass': 26000, 'gameRadius': 13, 'soiMultiplier': 2.8, 'binaryLikelihood': 0.45},
    'G_TYPE': {'id': 'G_TYPE', 'gamePercentage': 15.0, 'gameMass': 22000, 'gameRadius': 12, 'soiMultiplier': 2.6, 'binaryLikelihood': 0.40},
    'K_TYPE': {'id': 'K_TYPE', 'gamePercentage': 18.0, 'gameMass': 17000, 'gameRadius': 10, 'soiMultiplier': 2.4, 'binaryLikelihood': 0.35},
    'M_TYPE': {'id': 'M_TYPE', 'gamePercentage': 22.0, 'gameMass': 12000, 'gameRadius': 8, 'soiMultiplier': 2.2, 'binaryLikelihood': 0.25},
    'WHITE_DWARF': {'id': 'WHITE_DWARF', 'gamePercentage': 7.0, 'gameMass': 15000, 'gameRadius': 5, 'soiMultiplier': 2.0, 'binaryLikelihood': 0.15},
    'NEUTRON_STAR': {'id': 'NEUTRON_STAR', 'gamePercentage': 4.5, 'gameMass': 28000, 'gameRadius': 4, 'soiMultiplier': 4.5, 'binaryLikelihood': 0.20},
    'STELLAR_BLACK_HOLE': {'id': 'STELLAR_BLACK_HOLE', 'gamePercentage': 3.5, 'gameMass': 65000, 'gameRadius': 6, 'soiMultiplier': 6.0, 'binaryLikelihood': 0.30},
}

def sample_stellar_class(rng):
    dist_total = sum(v['gamePercentage'] for k, v in STELLAR_CLASSES.items() if k != 'SUPERMASSIVE_BLACK_HOLE')
    dist = {k: (v['gamePercentage'] / dist_total) * 100 for k, v in STELLAR_CLASSES.items() if k != 'SUPERMASSIVE_BLACK_HOLE'}
    r = rng() * 100.0
    cum = 0.0
    for k, w in dist.items():
        cum += w
        if r <= cum:
            return STELLAR_CLASSES[k]
    return STELLAR_CLASSES['M_TYPE']

def test_mulberry32_determinism():
    rng1 = create_mulberry32(1042)
    rng2 = create_mulberry32(1042)
    vals1 = [rng1() for _ in range(100)]
    vals2 = [rng2() for _ in range(100)]
    assert vals1 == vals2

def test_galactic_sector_structure():
    rng = create_mulberry32(1042)
    stars = []
    
    # Core SMBH
    smbh = {
        'id': 'galactic-core-anchor',
        'name': 'Sagittarius Prime (SMBH)',
        'pos': [0.0, 0.0],
        'isCoreAnchor': True,
        'mass': 220000
    }
    stars.append(smbh)
    
    # 64 disk stars
    for i in range(64):
        s_class = sample_stellar_class(rng)
        r = 120.0 + rng() * 1480.0
        angle = rng() * math.pi * 2.0
        stars.append({
            'id': f'star-{i}',
            'class': s_class['id'],
            'pos': [r * math.cos(angle), r * math.sin(angle)],
            'isCoreAnchor': False,
            'mass': s_class['gameMass']
        })

    assert len(stars) == 65
    assert stars[0]['name'] == 'Sagittarius Prime (SMBH)'
    assert stars[0]['pos'] == [0.0, 0.0]
    
    # Ensure multiple G-type stars exist to serve as Sol Prime
    g_stars = [s for s in stars if s.get('class') == 'G_TYPE']
    assert len(g_stars) >= 5
