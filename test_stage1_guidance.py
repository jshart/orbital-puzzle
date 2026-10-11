import math

# Test Stage 1 Interstellar Guidance Controller with full 65-star sector

def mulberry32(seed):
    s = seed
    def rng():
        nonlocal s
        s = (s + 0x6D2B79F5) & 0xFFFFFFFF
        t = (s ^ (s >> 15)) * ((1 | s) & 0xFFFFFFFF) & 0xFFFFFFFF
        t = (t + ((t ^ (t >> 7)) * ((61 | t) & 0xFFFFFFFF) & 0xFFFFFFFF)) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296.0
    return rng

# Generate sector with seed 1042
rng = mulberry32(1042)

stars = []
# Central SMBH
stars.append({
    'name': 'Sagittarius Prime (SMBH)',
    'mass': 220000.0,
    'rDist': 0.0,
    'orbitSpeed': 0.0,
    'initialAngle': 0.0,
    'pos': (0.0, 0.0)
})

# 64 stars
for i in range(64):
    u = rng()
    rDist = math.sqrt(u) * (1600.0 - 160.0) + 140.0
    baseAngle = rng() * math.pi * 2
    spiralOffset = math.sin(baseAngle * 2) * 0.45
    finalAngle = baseAngle + spiralOffset
    orbitalSpeed = math.sqrt(80000.0 / max(100.0, rDist)) * 0.003 * (0.85 + rng() * 0.3)
    mass = 26000.0 # avg mass
    stars.append({
        'name': f'Star-{i}',
        'mass': mass,
        'rDist': rDist,
        'orbitSpeed': orbitalSpeed,
        'initialAngle': finalAngle,
        'pos': (math.cos(finalAngle) * rDist, math.sin(finalAngle) * rDist)
    })

target_star = stars[10] # e.g. a star around rDist = 500
print(f"Target Star initial pos: {target_star['pos']}, rDist: {target_star['rDist']:.1f}")

# Probe starts in outer arm
probe_x = target_star['pos'][0] - 850.0
probe_y = target_star['pos'][1] + 450.0

dx = target_star['pos'][0] - probe_x
dy = target_star['pos'][1] - probe_y
dist = math.sqrt(dx*dx + dy*dy)
vx = (dx / dist) * 32.0
vy = (dy / dist) * 32.0

dt = 0.05
intercepted = False
min_dist = 99999.0
t = 0.0

for step in range(800): # 40 seconds
    t += dt
    # Update target star pos
    t_angle = target_star['initialAngle'] + target_star['orbitSpeed'] * t
    tx = target_star['rDist'] * math.cos(t_angle)
    ty = target_star['rDist'] * math.sin(t_angle)
    
    d_target = math.sqrt((tx - probe_x)**2 + (ty - probe_y)**2)
    if d_target < min_dist:
        min_dist = d_target
    if d_target <= 135.0: # Sol Prime SOI
        intercepted = True
        break
        
    # Gravity from SMBH and all stars
    acc_x = 0.0
    acc_y = 0.0
    G = 1.0
    eps = 8.0
    for s in stars:
        s_angle = s['initialAngle'] + s['orbitSpeed'] * t
        sx = s['rDist'] * math.cos(s_angle)
        sy = s['rDist'] * math.sin(s_angle)
        sdx = sx - probe_x
        sdy = sy - probe_y
        dSq = sdx*sdx + sdy*sdy
        denom = (dSq + eps*eps)**1.5
        pull = (G * s['mass']) / denom
        acc_x += sdx * pull
        acc_y += sdy * pull
        
    # INTERSTELLAR GUIDANCE CONTROLLER (IGC):
    # Proportional navigation toward target star's current position
    sdx = tx - probe_x
    sdy = ty - probe_y
    desired_heading = math.atan2(sdy, sdx)
    cur_heading = math.atan2(vy, vx)
    angle_diff = (desired_heading - cur_heading + math.pi) % (2 * math.pi) - math.pi
    
    cur_speed = math.sqrt(vx*vx + vy*vy)
    if cur_speed > 0.1:
        perp_x = -vy / cur_speed
        perp_y = vx / cur_speed
        # Corrective acceleration
        burn_acc = max(-18.0, min(18.0, angle_diff * 28.0))
        acc_x += perp_x * burn_acc
        acc_y += perp_y * burn_acc
        
    vx += acc_x * dt
    vy += acc_y * dt
    probe_x += vx * dt
    probe_y += vy * dt

print(f"Simulation result: Intercepted = {intercepted}, Min Dist = {min_dist:.1f} AU, Flight Time = {t:.1f}s")
assert intercepted, "Should intercept Sol Prime!"
print("SUCCESS: Stage 1 Interstellar Guidance reliably reaches target star!")
