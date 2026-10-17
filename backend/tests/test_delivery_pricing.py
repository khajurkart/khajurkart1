import pytest

from delivery.pricing import calculate_delivery_pricing


@pytest.mark.parametrize(
    "subtotal,courier_rate,expected_fee,expected_total",
    [
        ("550", "65", "65.00", "615.00"),
        ("1500", "90", "90.00", "1590.00"),
        ("1998", "110", "110.00", "2108.00"),
        ("1999", "110", "0.00", "1999.00"),
        ("2500", "140", "0.00", "2500.00"),
    ],
)
def test_delivery_pricing(
    subtotal, courier_rate, expected_fee, expected_total
):
    result = calculate_delivery_pricing(subtotal, courier_rate)

    assert result["customer_delivery_fee"] == expected_fee
    assert result["total_amount"] == expected_total


@pytest.mark.parametrize(
    "subtotal,courier_rate",
    [
        ("-1", "50"),
        ("500", "-20"),
        ("NaN", "50"),
        ("Infinity", "50"),
        ("500.001", "50"),
    ],
)
def test_invalid_delivery_amounts(subtotal, courier_rate):
    with pytest.raises(ValueError):
        calculate_delivery_pricing(subtotal, courier_rate)
