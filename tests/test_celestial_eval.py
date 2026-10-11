import math
import pytest

class CelestialBodySim:
    def __init__(self, name, mass, radius, parent=None, orbit_radius=0.0, orbit_speed=0.0, initial_angle=0.0):
        self.name = name
        self.mass = mass
        self.radius = radius
        self.parent = parent
        self.orbit_radius = orbit_radius
        self.orbit_speed = orbit_speed
        self.initial_angle = initial_angle

    def get_position_at_time(self, t):
        if not self.parent:
            return (0.0, 0.0)
        parent_x, parent_y = self.parent.get_position_at_time(t)
        angle = self.initial_angle + self.orbit_speed * t
        return (
            parent_x + math.cos(angle) * self.orbit_radius,
            parent_y + math.sin(angle) * self.orbit_radius
        )

    def get_velocity_at_time(self, t):
        if not self.parent:
            return (0.0, 0.0)
        parent_vx, parent_vy = self.parent.get_velocity_at_time(t)
        angle = self.initial_angle + self.orbit_speed * t
        speed = self.orbit_radius * self.orbit_speed
        return (
            parent_vx - math.sin(angle) * speed,
            parent_vy + math.cos(angle) * speed
        )

def test_central_star_stationary():
    sol = CelestialBodySim('Sol', 44000, 36)
    for t in [0.0, 10.0, 50.0, 100.0]:
        pos = sol.get_position_at_time(t)
        vel = sol.get_velocity_at_time(t)
        assert pos == (0.0, 0.0)
        assert vel == (0.0, 0.0)

def test_planet_circular_orbit():
    sol = CelestialBodySim('Sol', 44000, 36)
    terra = CelestialBodySim('Terra', 5200, 16, parent=sol, orbit_radius=215.0, orbit_speed=0.068, initial_angle=1.35)
    
    for t in [0.0, 5.0, 20.0, 45.0]:
        pos = terra.get_position_at_time(t)
        dist = math.sqrt(pos[0]**2 + pos[1]**2)
        assert dist == pytest.approx(215.0, rel=1e-5)
        
        # Velocity magnitude must equal r * omega
        vel = terra.get_velocity_at_time(t)
        speed = math.sqrt(vel[0]**2 + vel[1]**2)
        assert speed == pytest.approx(215.0 * 0.068, rel=1e-5)
        
        # Velocity must be orthogonal to position vector (dot product = 0)
        dot = pos[0] * vel[0] + pos[1] * vel[1]
        assert dot == pytest.approx(0.0, abs=1e-5)

def test_moon_hierarchical_orbit():
    sol = CelestialBodySim('Sol', 44000, 36)
    terra = CelestialBodySim('Terra', 5200, 16, parent=sol, orbit_radius=215.0, orbit_speed=0.068, initial_angle=1.35)
    luna = CelestialBodySim('Luna', 800, 6, parent=terra, orbit_radius=35.0, orbit_speed=0.45, initial_angle=0.0)

    for t in [0.0, 12.0, 30.0]:
        t_pos = terra.get_position_at_time(t)
        l_pos = luna.get_position_at_time(t)
        rel_dist = math.sqrt((l_pos[0] - t_pos[0])**2 + (l_pos[1] - t_pos[1])**2)
        assert rel_dist == pytest.approx(35.0, rel=1e-5)
