from datetime import date, timedelta
import pytest
from delivery.partner_rotation import assigned_partner, PARTNERS

def test_15_day_rotation():
    start = date(2026, 10, 15)
    assert assigned_partner(start, start) == PARTNERS[0]
    assert assigned_partner(start + timedelta(days=15), start) == PARTNERS[1]
    assert assigned_partner(start + timedelta(days=60), start) == PARTNERS[0]

def test_30_day_rotation():
    start = date(2026, 10, 15)
    assert assigned_partner(start + timedelta(days=30), start, 30) == PARTNERS[1]

def test_invalid_rotation():
    with pytest.raises(ValueError):
        assigned_partner(date(2026, 10, 15), date(2026, 10, 15), 7)
