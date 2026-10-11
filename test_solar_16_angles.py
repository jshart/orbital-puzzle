import math

# Test Solar Stage Guidance across all 16 angles (0 to 360 deg)
def test_solar_guidance():
    G = 1.0
    M_sol = 44000.0
    terra_r = 215.0
    terra_speed = 0.068
    terra_init_angle = 1.35
    dt = 0.05
    
    angles = [i * (math.pi / 8) for i in range(16)]
    results = []
    
    for idx, e_angle in enumerate(angles):
        # Entry at R = 480 AU
        px = 480.0 * math.cos(e_angle)
        py = 480.0 * math.sin(e_angle)
        
        # Velocity heading inward towards sun/inner system with slight tangent
        heading = e_angle + math.pi + 0.15 * math.sin(e_angle * 3)
        speed = 26.0
        vx = math.cos(heading) * speed
        vy = math.sin(heading) * speed
        
        intercepted = False
        min_dist = 99999.0
        t = 0.0
        
        for step in range(1600):
            t += dt
            t_angle = terra_init_angle + terra_speed * t
            tx = terra_r * math.cos(t_angle)
            ty = terra_r * math.sin(t_angle)
            
            d_terra = math.sqrt((tx - px)**2 + (ty - py)**2)
            if d_terra < min_dist:
                min_dist = d_terra
            if d_terra <= 65.0:
                intercepted = True
                break
                
            # Sun gravity (softened at eps = 6)
            d_sq = px*px + py*py
            denom = (d_sq + 36.0)**1.5
            acc_x = -px * (G * M_sol) / denom
            acc_y = -py * (G * M_sol) / denom
            
            # MCC Guidance Controller:
            # Active throughout transit while outside Terra SOI
            if d_terra > 65.0:
                dx = tx - px
                dy = ty - py
                desired_heading = math.atan2(dy, dx)
                current_heading = math.atan2(vy, vx)
                angle_diff = (desired_heading - current_heading + math.pi) % (2 * math.pi) - math.pi
                
                cur_speed = math.sqrt(vx*vx + vy*vy)
                if cur_speed > 0.1:
                    perp_x = -vy / cur_speed
                    perp_y = vx / cur_speed
                    burn_acc = max(-22.0, min(22.0, angle_diff * 30.0))
                    acc_x += perp_x * burn_acc
                    acc_y += perp_y * burn_acc
                    
                    # If moving too fast past periapsis or angleDiff is large, add slight prograde/retrograde throttle
                    if cur_speed > 36.0:
                        acc_x -= (vx / cur_speed) * 8.0
                        acc_y -= (vy / cur_speed) * 8.0
                        
            vx += acc_x * dt
            vy += acc_y * dt
            px += vx * dt
            py += vy * dt
            
        results.append((idx, math.degrees(e_angle), intercepted, min_dist, t))
        
    print("--- SOLAR GUIDANCE TEST RESULTS (16 ANGLES) ---")
    all_passed = True
    for idx, deg, ic, md, t_done in results:
        status = "PASS" if ic else "FAIL"
        if not ic:
            all_passed = False
        print(f"[{status}] Angle {deg:5.1f}°: Intercepted = {ic}, Min Dist = {md:5.1f} AU, Time = {t_done:4.1f}s")
        
    print(f"\nOverall Result: {'100% SUCCESS' if all_passed else 'SOME FAILED'}")

test_solar_guidance()
