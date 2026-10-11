import math
import pytest

class Vector2:
    def __init__(self, x=0.0, y=0.0):
        self.x = float(x)
        self.y = float(y)

    def add(self, other):
        self.x += other.x
        self.y += other.y
        return self

    def sub(self, other):
        self.x -= other.x
        self.y -= other.y
        return self

    def scale(self, s):
        self.x *= s
        self.y *= s
        return self

    def mag(self):
        return math.sqrt(self.x * self.x + self.y * self.y)

    def dist(self, other):
        dx = self.x - other.x
        dy = self.y - other.y
        return math.sqrt(dx * dx + dy * dy)

    def dist_sq(self, other):
        dx = self.x - other.x
        dy = self.y - other.y
        return dx * dx + dy * dy

    def angle(self):
        return math.atan2(self.y, self.x)

    def normalize(self):
        m = self.mag()
        if m > 0:
            self.scale(1.0 / m)
        return self

    @staticmethod
    def lerp(v1, v2, t):
        return Vector2(
            v1.x + (v2.x - v1.x) * t,
            v1.y + (v2.y - v1.y) * t
        )

    @staticmethod
    def from_angle(theta, length=1.0):
        return Vector2(
            math.cos(theta) * length,
            math.sin(theta) * length
        )

def test_vector_creation():
    v = Vector2(3.0, 4.0)
    assert v.x == 3.0
    assert v.y == 4.0
    assert v.mag() == pytest.approx(5.0)

def test_vector_add_sub():
    v1 = Vector2(10.0, 5.0)
    v2 = Vector2(-2.0, 3.0)
    v1.add(v2)
    assert v1.x == pytest.approx(8.0)
    assert v1.y == pytest.approx(8.0)
    v1.sub(v2)
    assert v1.x == pytest.approx(10.0)
    assert v1.y == pytest.approx(5.0)

def test_vector_dist():
    v1 = Vector2(0.0, 0.0)
    v2 = Vector2(6.0, 8.0)
    assert v1.dist(v2) == pytest.approx(10.0)
    assert v1.dist_sq(v2) == pytest.approx(100.0)

def test_vector_lerp():
    v1 = Vector2(100.0, 200.0)
    v2 = Vector2(200.0, 400.0)
    
    # Midpoint
    vm = Vector2.lerp(v1, v2, 0.5)
    assert vm.x == pytest.approx(150.0)
    assert vm.y == pytest.approx(300.0)

    # Ends
    assert Vector2.lerp(v1, v2, 0.0).x == pytest.approx(100.0)
    assert Vector2.lerp(v1, v2, 1.0).x == pytest.approx(200.0)

def test_vector_from_angle():
    theta = math.pi / 3.0  # 60 deg
    length = 50.0
    v = Vector2.from_angle(theta, length)
    assert v.mag() == pytest.approx(length)
    assert v.angle() == pytest.approx(theta)
