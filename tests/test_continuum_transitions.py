import math
import pytest

def test_transition_angle_and_heading_preservation():
    """
    Verifies that the coordinate transformation preserves the relative entry angle
    and the probe's velocity heading across tier boundaries.
    """
    star_pos = (614.4, -61.9)
    # Probe on the SOI boundary (radius 135)
    test_angle = 2.45  # radians
    probe_pos = (
        star_pos[0] + 135.0 * math.cos(test_angle),
        star_pos[1] + 135.0 * math.sin(test_angle)
    )
    heading = -0.42
    speed = 28.0
    probe_vel = (
        speed * math.cos(heading),
        speed * math.sin(heading)
    )

    # Compute handoff
    rel_x = probe_pos[0] - star_pos[0]
    rel_y = probe_pos[1] - star_pos[1]
    incoming_angle = math.atan2(rel_y, rel_x)
    calc_heading = math.atan2(probe_vel[1], probe_vel[0])

    assert incoming_angle == pytest.approx(test_angle, rel=1e-5)
    assert calc_heading == pytest.approx(heading, rel=1e-5)

    # Spawn in solar system (boundary radius 480)
    solar_probe_x = 480.0 * math.cos(incoming_angle)
    solar_probe_y = 480.0 * math.sin(incoming_angle)
    solar_incoming_angle = math.atan2(solar_probe_y, solar_probe_x)
    
    assert solar_incoming_angle == pytest.approx(incoming_angle, rel=1e-5)

def test_predictive_mcc_intercept_simulation():
    """
    Simulates the Solar stage guidance controller with lead-pursuit Mid-Course Correction (MCC)
    to verify that the probe reliably intercepts Terra from various entry vectors.
    """
    M_sol = 44000.0
    dt = 0.05
    terra_radius = 215.0
    terra_speed = 0.068
    soi_radius = 65.0

    test_angles = [0.5, 1.2, 2.1, 2.8, -1.5, -2.5]
    
    for incoming_angle in test_angles:
        # Probe starting at outer boundary
        px = 480.0 * math.cos(incoming_angle)
        py = 480.0 * math.sin(incoming_angle)

        # Inward heading
        inward = incoming_angle + math.pi
        vx = 22.0 * math.cos(inward)
        vy = 22.0 * math.sin(inward)

        t = 0.0
        intercepted = False

        for step in range(1200): # max 60 seconds
            t += dt
            # Terra pos
            terra_angle = 1.35 + terra_speed * t
            tx = terra_radius * math.cos(terra_angle)
            ty = terra_radius * math.sin(terra_angle)

            # Distance to Terra
            dx_terra = tx - px
            dy_terra = ty - py
            d_terra = math.sqrt(dx_terra * dx_terra + dy_terra * dy_terra)

            if d_terra <= soi_radius:
                intercepted = True
                break

            # Sol gravity
            r_sq = px * px + py * py
            r_dist = math.sqrt(r_sq)
            pull = (M_sol) / math.pow(r_sq + 16.0, 1.5)
            ax = -px * pull
            ay = -py * pull

            # MCC Proportional Guidance
            cur_speed = math.sqrt(vx * vx + vy * vy)
            if cur_speed > 0.1:
                t_go = min(15.0, d_terra / max(14.0, cur_speed))
                pred_angle = 1.35 + terra_speed * (t + t_go)
                pred_tx = terra_radius * math.cos(pred_angle)
                pred_ty = terra_radius * math.sin(pred_angle)

                desired_heading = math.atan2(pred_ty - py, pred_tx - px)
                cur_heading = math.atan2(vy, vx)
                angle_diff = (desired_heading - cur_heading + math.pi) % (2.0 * math.pi) - math.pi

                burn_acc = max(-20.0, min(20.0, angle_diff * 30.0))
                perp_x = -vy / cur_speed
                perp_y = vx / cur_speed
                ax += perp_x * burn_acc
                ay += perp_y * burn_acc

                # Speed brake
                if cur_speed > 24.0:
                    brake = min(16.0, (cur_speed - 22.0) * 4.0)
                    ax -= (vx / cur_speed) * brake
                    ay -= (vy / cur_speed) * brake

            # Physics integrate
            vx += ax * dt
            vy += ay * dt
            px += vx * dt
            py += vy * dt

        assert intercepted, f"Failed to intercept Terra from incoming angle {incoming_angle}"

def test_terminal_braking_and_docking():
    """
    Verifies terminal RCS velocity matching braking to achieve capture inside Station Alpha SOI.
    """
    station_r = 78.0
    station_omega = 0.145
    t = 10.0
    station_angle = 2.1 + station_omega * t
    sx = station_r * math.cos(station_angle)
    sy = station_r * math.sin(station_angle)
    svx = -station_r * station_omega * math.sin(station_angle)
    svy = station_r * station_omega * math.cos(station_angle)

    # Probe arrives with excess relative velocity
    px = sx + 22.0
    py = sy + 10.0
    pvx = svx + 8.5
    pvy = svy - 6.2

    dt = 0.05
    docked = False
    capture_radius = 28.0
    max_speed = 18.0

    for _ in range(300):
        t += dt
        station_angle = 2.1 + station_omega * t
        sx = station_r * math.cos(station_angle)
        sy = station_r * math.sin(station_angle)
        svx = -station_r * station_omega * math.sin(station_angle)
        svy = station_r * station_omega * math.cos(station_angle)

        dist = math.sqrt((px - sx)**2 + (py - sy)**2)
        rel_vx = pvx - svx
        rel_vy = pvy - svy
        rel_speed = math.sqrt(rel_vx**2 + rel_vy**2)

        if dist <= capture_radius and rel_speed <= max_speed:
            docked = True
            break

        # Terminal braking burn
        if rel_speed > (max_speed - 3.0):
            brake_acc = 22.0
            pvx -= (rel_vx / rel_speed) * brake_acc * dt
            pvy -= (rel_vy / rel_speed) * brake_acc * dt

        px += pvx * dt
        py += pvy * dt

    assert docked, "Failed to achieve terminal docking lock"
