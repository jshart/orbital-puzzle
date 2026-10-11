import math

# Full 3-Stage End-to-End Continuum Test

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
    
    # SMBH
    stars.append({
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
    })
    
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
            
            stars.append({
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
            })
            stars.append({
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
            })
            i += 2
        else:
            stars.append({
                'id': f'star-{i}',
                'name': f'Star-{i}',
                'stellarClass': sc,
                'isBinary': False,
                'galacticOrbitRadius': rDist,
                'galacticOrbitSpeed': orbitalSpeed,
                'initialGalacticAngle': finalAngle,
                'mass': sc['gameMass'],
                'pos': [math.cos(finalAngle)*rDist, math.sin(finalAngle)*rDist]
            })
            i += 1
            
    return stars, barycenters

stars, barycenters = generate_sector()

target_star = None
for s in stars:
    if not s.get('isCoreAnchor', False) and not s.get('isBinary', False) and s['stellarClass']['id'] == 'G_TYPE':
        target_star = s
        break

target_star['soiRadius'] = 135.0

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

# STAGE 1: Galactic
start_x = target_star['pos'][0] - 920.0
start_y = target_star['pos'][1] + 480.0
dx = target_star['pos'][0] - start_x
dy = target_star['pos'][1] - start_y
d_mag = math.sqrt(dx*dx + dy*dy)
vx = (dx / d_mag) * 28.5 + 3.5
vy = (dy / d_mag) * 28.5 - 2.0

px, py = start_x, start_y
t = 0.0
dt = 0.05
s1_intercepted = False

for step in range(800):
    t += dt
    update_positions(t)
    tx, ty = target_star['pos']
    d_target = math.sqrt((tx - px)**2 + (ty - py)**2)
    if d_target <= target_star['soiRadius']:
        s1_intercepted = True
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
        
    # IGC guidance
    sdx = tx - px
    sdy = ty - py
    desired_heading = math.atan2(sdy, sdx)
    cur_heading = math.atan2(vy, vx)
    angle_diff = (desired_heading - cur_heading + math.pi) % (2 * math.pi) - math.pi
    
    cur_speed = math.sqrt(vx*vx + vy*vy)
    if cur_speed > 0.1:
        perp_x = -vy / cur_speed
        perp_y = vx / cur_speed
        burn_acc = max(-22.0, min(22.0, angle_diff * 32.0))
        acc_x += perp_x * burn_acc
        acc_y += perp_y * burn_acc
        
    vx += acc_x * dt
    vy += acc_y * dt
    px += vx * dt
    py += vy * dt

print(f"STAGE 1 Result: Intercepted = {s1_intercepted}, t = {t:.1f}s")
assert s1_intercepted, "Stage 1 must intercept Sol Prime!"

# Hand-off calculation
rel_x = px - target_star['pos'][0]
rel_y = py - target_star['pos'][1]
incoming_angle = math.atan2(rel_y, rel_x)
heading_angle = math.atan2(vy, vx)
incoming_speed = math.sqrt(vx*vx + vy*vy)
print(f"Hand-off to Stage 2: incomingAngle = {incoming_angle:.3f} rad ({math.degrees(incoming_angle):.1f}°), heading = {heading_angle:.3f} rad ({math.degrees(heading_angle):.1f}°), speed = {incoming_speed:.1f}")

# STAGE 2: Solar System
# In Solar System:
# R_entry = 480 AU
# Sun at (0, 0)
s2_px = 480.0 * math.cos(incoming_angle)
s2_py = 480.0 * math.sin(incoming_angle)
s2_speed = max(22.0, min(30.0, incoming_speed))
s2_vx = math.cos(heading_angle) * s2_speed
s2_vy = math.sin(heading_angle) * s2_speed

M_sol = 44000.0
terra_r = 215.0
terra_speed = 0.068
terra_init_angle = 1.35
s2_t = 0.0
s2_intercepted = False
min_dist_terra = 99999.0

for step in range(1200):
    s2_t += dt
    # Terra position
    t_angle = terra_init_angle + terra_speed * s2_t
    tx = terra_r * math.cos(t_angle)
    ty = terra_r * math.sin(t_angle)
    
    d_terra = math.sqrt((tx - s2_px)**2 + (ty - s2_py)**2)
    if d_terra < min_dist_terra:
        min_dist_terra = d_terra
        
    if d_terra <= 65.0: # Terra SOI
        s2_intercepted = True
        break
        
    # Gravity from Sun
    d_sq = s2_px*s2_px + s2_py*s2_py
    denom = (d_sq + 16.0)**1.5
    acc_x = -s2_px * (1.0 * M_sol) / denom
    acc_y = -s2_py * (1.0 * M_sol) / denom
    
    # MCC guidance toward Terra
    dist_to_sun = math.sqrt(d_sq)
    if 140.0 <= dist_to_sun <= 450.0:
        dx = tx - s2_px
        dy = ty - s2_py
        desired_heading = math.atan2(dy, dx)
        current_heading = math.atan2(s2_vy, s2_vx)
        angle_diff = (desired_heading - current_heading + math.pi) % (2 * math.pi) - math.pi
        
        cur_speed = math.sqrt(s2_vx*s2_vx + s2_vy*s2_vy)
        if cur_speed > 0.1:
            perp_x = -s2_vy / cur_speed
            perp_y = s2_vx / cur_speed
            burn_acc = max(-18.0, min(18.0, angle_diff * 28.0))
            acc_x += perp_x * burn_acc
            acc_y += perp_y * burn_acc
            
    s2_vx += acc_x * dt
    s2_vy += acc_y * dt
    s2_px += s2_vx * dt
    s2_py += s2_vy * dt

print(f"STAGE 2 Result: Intercepted Terra = {s2_intercepted}, Min Dist = {min_dist_terra:.1f} AU, t = {s2_t:.1f}s")
assert s2_intercepted, "Stage 2 must intercept Terra!"

# Hand-off to Stage 3:
terra_orbit_vx = -terra_r * terra_speed * math.sin(terra_init_angle + terra_speed * s2_t)
terra_orbit_vy = terra_r * terra_speed * math.cos(terra_init_angle + terra_speed * s2_t)
rel_tx = s2_px - tx
rel_ty = s2_py - ty
incoming_angle_s3 = math.atan2(rel_ty, rel_tx)
rel_vx = s2_vx - terra_orbit_vx
rel_vy = s2_vy - terra_orbit_vy
heading_angle_s3 = math.atan2(rel_vy, rel_vx)
speed_s3 = math.sqrt(rel_vx*rel_vx + rel_vy*rel_vy)
print(f"Hand-off to Stage 3: incomingAngle = {incoming_angle_s3:.3f} rad ({math.degrees(incoming_angle_s3):.1f}°), speed = {speed_s3:.1f}")

# STAGE 3: Planetary
s3_px = 140.0 * math.cos(incoming_angle_s3)
s3_py = 140.0 * math.sin(incoming_angle_s3)
s3_speed = max(18.0, min(24.0, speed_s3))
s3_vx = math.cos(heading_angle_s3) * s3_speed
s3_vy = math.sin(heading_angle_s3) * s3_speed

M_terra = 13000.0
station_r = 78.0
station_speed = 0.145
station_init_angle = 2.1
s3_t = 0.0
docked = False
min_dist_station = 99999.0

for step in range(1200):
    s3_t += dt
    # Station Alpha pos & vel
    st_angle = station_init_angle + station_speed * s3_t
    wx = station_r * math.cos(st_angle)
    wy = station_r * math.sin(st_angle)
    w_vx = -station_r * station_speed * math.sin(st_angle)
    w_vy = station_r * station_speed * math.cos(st_angle)
    
    d_station = math.sqrt((wx - s3_px)**2 + (wy - s3_py)**2)
    if d_station < min_dist_station:
        min_dist_station = d_station
        
    rel_speed = math.sqrt((s3_vx - w_vx)**2 + (s3_vy - w_vy)**2)
    if d_station <= 28.0 and rel_speed <= 18.0:
        docked = True
        break
        
    # Gravity from Terra
    d_sq = s3_px*s3_px + s3_py*s3_py
    denom = (d_sq + 12.0)**1.5
    acc_x = -s3_px * (1.0 * M_terra) / denom
    acc_y = -s3_py * (1.0 * M_terra) / denom
    
    # Stage 3 Guidance: Approach Guidance + Terminal RCS Braking
    if d_station > 38.0:
        # Steer toward Station Alpha
        w_dx = wx - s3_px
        w_dy = wy - s3_py
        des_h = math.atan2(w_dy, w_dx)
        cur_h = math.atan2(s3_vy, s3_vx)
        diff_h = (des_h - cur_h + math.pi) % (2 * math.pi) - math.pi
        cur_sp = math.sqrt(s3_vx*s3_vx + s3_vy*s3_vy)
        if cur_sp > 0.1:
            perp_x = -s3_vy / cur_sp
            perp_y = s3_vx / cur_sp
            burn_acc = max(-16.0, min(16.0, diff_h * 24.0))
            acc_x += perp_x * burn_acc
            acc_y += perp_y * burn_acc
    else:
        # Terminal RCS Velocity Matching Braking inside 38 AU
        rvx = s3_vx - w_vx
        rvy = s3_vy - w_vy
        r_mag = math.sqrt(rvx*rvx + rvy*rvy)
        if r_mag > 12.0:
            brake_acc = 22.0
            acc_x -= (rvx / r_mag) * brake_acc
            acc_y -= (rvy / r_mag) * brake_acc
            
    s3_vx += acc_x * dt
    s3_vy += acc_y * dt
    s3_px += s3_vx * dt
    s3_py += s3_vy * dt

print(f"STAGE 3 Result: Docked at Station Alpha = {docked}, Min Dist = {min_dist_station:.1f} AU, t = {s3_t:.1f}s")
assert docked, "Stage 3 must dock at Station Alpha!"

print("\n=======================================================")
print("ALL 3 STAGES VERIFIED 100% SUCCESSFUL END-TO-END!")
print(f"Total flight time: Stage 1 = {t:.1f}s, Stage 2 = {s2_t:.1f}s, Stage 3 = {s3_t:.1f}s. Total = {t+s2_t+s3_t:.1f}s")
print("=======================================================")
