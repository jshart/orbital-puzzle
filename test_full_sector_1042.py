import math

# Exact reproduction of Mulberry32 and GalacticSector generation from JS

def create_rng(seed=1042):
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

# Distribution weights (blendFactor = 1.0)
dist_total = sum(v['gamePercentage'] for k, v in STELLAR_CLASSES.items() if k != 'SUPERMASSIVE_BLACK_HOLE')
dist = {k: (v['gamePercentage'] / dist_total) * 100 for k, v in STELLAR_CLASSES.items() if k != 'SUPERMASSIVE_BLACK_HOLE'}

def sample_stellar_class(rng):
    r = rng() * 100.0
    cum = 0.0
    for k, w in dist.items():
        cum += w
        if r <= cum:
            return STELLAR_CLASSES[k]
    return STELLAR_CLASSES['M_TYPE']

def generate_sector():
    rng = create_rng(1042)
    stars = []
    barycenters = []
    
    # 1. SMBH
    smbh = {
        'id': 'galactic-core-anchor',
        'name': 'Sagittarius Prime (SMBH)',
        'stellarClass': STELLAR_CLASSES['SUPERMASSIVE_BLACK_HOLE'],
        'mass': 220000,
        'radius': 28,
        'soiRadius': 28 * 9.0,
        'isBinary': False,
        'isCoreAnchor': True,
        'galacticOrbitRadius': 0,
        'galacticOrbitSpeed': 0,
        'initialGalacticAngle': 0,
        'pos': [0.0, 0.0]
    }
    stars.append(smbh)
    
    # 2. 64 stars
    count = 64
    i = 0
    while i < count:
        sc = sample_stellar_class(rng)
        u = rng()
        rDist = math.sqrt(u) * (1600.0 - 160.0) + 140.0
        baseAngle = rng() * math.pi * 2
        spiralOffset = math.sin(baseAngle * 2) * 0.45
        finalAngle = baseAngle + spiralOffset
        orbitalSpeed = math.sqrt(80000.0 / max(100.0, rDist)) * 0.003 * (0.85 + rng() * 0.3)
        
        isBinaryCandidate = rng() < (sc['binaryLikelihood'] * 0.75)
        if isBinaryCandidate and i < count - 1:
            companionClass = sample_stellar_class(rng)
            baryPos = [math.cos(finalAngle) * rDist, math.sin(finalAngle) * rDist]
            separation = 75.0 + rng() * 65.0
            totMass = sc['gameMass'] + companionClass['gameMass']
            r1 = separation * (companionClass['gameMass'] / totMass)
            r2 = separation * (sc['gameMass'] / totMass)
            binaryOrbitSpeed = math.sqrt((totMass * 0.8) / (separation**3)) * 1.8
            initPhase = rng() * math.pi * 2
            
            bary = {
                'id': f'barycenter-{i}',
                'pos': baryPos,
                'galacticOrbitRadius': rDist,
                'galacticOrbitSpeed': orbitalSpeed,
                'initialGalacticAngle': finalAngle
            }
            barycenters.append(bary)
            
            s1 = {
                'id': f'star-{i}-A',
                'name': f'Star-{i} A',
                'stellarClass': sc,
                'barycenter': bary,
                'isBinary': True,
                'binaryRadius': r1,
                'binaryOrbitSpeed': binaryOrbitSpeed,
                'initialBinaryAngle': initPhase,
                'mass': sc['gameMass'],
                'pos': [baryPos[0] + math.cos(initPhase)*r1, baryPos[1] + math.sin(initPhase)*r1]
            }
            s2 = {
                'id': f'star-{i}-B',
                'name': f'Star-{i} B',
                'stellarClass': companionClass,
                'barycenter': bary,
                'isBinary': True,
                'binaryRadius': r2,
                'binaryOrbitSpeed': binaryOrbitSpeed,
                'initialBinaryAngle': initPhase + math.pi,
                'mass': companionClass['gameMass'],
                'pos': [baryPos[0] + math.cos(initPhase+math.pi)*r2, baryPos[1] + math.sin(initPhase+math.pi)*r2]
            }
            stars.append(s1)
            stars.append(s2)
            i += 2
        else:
            s = {
                'id': f'star-{i}',
                'name': f'Star-{i}',
                'stellarClass': sc,
                'isBinary': False,
                'galacticOrbitRadius': rDist,
                'galacticOrbitSpeed': orbitalSpeed,
                'initialGalacticAngle': finalAngle,
                'mass': sc['gameMass'],
                'pos': [math.cos(finalAngle)*rDist, math.sin(finalAngle)*rDist]
            }
            stars.append(s)
            i += 1
            
    return stars, barycenters

stars, barycenters = generate_sector()
print(f"Total stars generated: {len(stars)}")

# Find G_TYPE targetStar
target_star = None
for s in stars:
    if not s.get('isCoreAnchor', False) and not s.get('isBinary', False) and s['stellarClass']['id'] == 'G_TYPE':
        target_star = s
        break

if not target_star:
    for s in stars:
        if not s.get('isCoreAnchor', False) and not s.get('isBinary', False):
            target_star = s
            break

print(f"Selected Target Star: {target_star['name']}, Class: {target_star['stellarClass']['id']}, Pos: {target_star['pos']}, Mass: {target_star['mass']}")
target_star['soiRadius'] = 135.0

# Probe Start
start_x = target_star['pos'][0] - 920.0
start_y = target_star['pos'][1] + 480.0
dx = target_star['pos'][0] - start_x
dy = target_star['pos'][1] - start_y
d_mag = math.sqrt(dx*dx + dy*dy)
vx = (dx / d_mag) * 28.5 + 3.5
vy = (dy / d_mag) * 28.5 - 2.0

print(f"Probe start pos: ({start_x:.1f}, {start_y:.1f}), vel: ({vx:.1f}, {vy:.1f})")

def update_positions(t):
    for b in barycenters:
        ang = b['initialGalacticAngle'] + b['galacticOrbitSpeed'] * t
        b['pos'] = [math.cos(ang) * b['galacticOrbitRadius'], math.sin(ang) * b['galacticOrbitRadius']]
    for s in stars:
        if s.get('isCoreAnchor', False):
            s['pos'] = [0.0, 0.0]
        elif s.get('isBinary', False):
            b = s['barycenter']
            ang = s['initialBinaryAngle'] + s['binaryOrbitSpeed'] * t
            s['pos'] = [b['pos'][0] + math.cos(ang) * s['binaryRadius'], b['pos'][1] + math.sin(ang) * s['binaryRadius']]
        else:
            ang = s['initialGalacticAngle'] + s['galacticOrbitSpeed'] * t
            s['pos'] = [math.cos(ang) * s['galacticOrbitRadius'], math.sin(ang) * s['galacticOrbitRadius']]

# Simulate without guidance vs with guidance
def run_simulation(use_guidance=False):
    t = 0.0
    dt = 0.05
    px, py = start_x, start_y
    cur_vx, cur_vy = vx, vy
    min_dist = 99999.0
    intercepted = False
    
    for step in range(800):
        t += dt
        update_positions(t)
        
        tx, ty = target_star['pos']
        d_target = math.sqrt((tx - px)**2 + (ty - py)**2)
        if d_target < min_dist:
            min_dist = d_target
        if d_target <= target_star['soiRadius']:
            intercepted = True
            break
            
        acc_x, acc_y = 0.0, 0.0
        G = 1.0
        eps = 8.0
        for s in stars:
            sx, sy = s['pos']
            sdx, sdy = sx - px, sy - py
            dSq = sdx*sdx + sdy*sdy
            denom = (dSq + eps*eps)**1.5
            pull = (G * s['mass']) / denom
            acc_x += sdx * pull
            acc_y += sdy * pull
            
        if use_guidance:
            # Guidance towards target
            sdx = tx - px
            sdy = ty - py
            desired_heading = math.atan2(sdy, sdx)
            cur_heading = math.atan2(cur_vy, cur_vx)
            angle_diff = (desired_heading - cur_heading + math.pi) % (2 * math.pi) - math.pi
            
            cur_speed = math.sqrt(cur_vx*cur_vx + cur_vy*cur_vy)
            if cur_speed > 0.1 and d_target > target_star['soiRadius']:
                perp_x = -cur_vy / cur_speed
                perp_y = cur_vx / cur_speed
                burn_acc = max(-22.0, min(22.0, angle_diff * 32.0))
                acc_x += perp_x * burn_acc
                acc_y += perp_y * burn_acc
                
        cur_vx += acc_x * dt
        cur_vy += acc_y * dt
        px += cur_vx * dt
        py += cur_vy * dt
        
    return intercepted, min_dist, t

print("\n--- TEST: WITHOUT GUIDANCE ---")
ic, md, t_done = run_simulation(use_guidance=False)
print(f"Without guidance: Intercepted = {ic}, Min Dist = {md:.1f} AU, Flight Time = {t_done:.1f}s")

print("\n--- TEST: WITH GUIDANCE ---")
ic, md, t_done = run_simulation(use_guidance=True)
print(f"With guidance: Intercepted = {ic}, Min Dist = {md:.1f} AU, Flight Time = {t_done:.1f}s")
