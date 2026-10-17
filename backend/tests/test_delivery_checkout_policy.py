import pytest


def delivery_decision(subtotal, payment_method, quotes):
    eligible = [
        quote for quote in quotes
        if payment_method != "cod"
        or (
            quote["provider"] == "shiprocket"
            and quote["supports_cod"]
        )
    ]

    if not eligible:
        raise ValueError("No eligible delivery service")

    selected = min(eligible, key=lambda q: q["rate"])
    delivery_fee = 0 if subtotal >= 1999 else selected["rate"]

    return {
        "provider": selected["provider"],
        "delivery_fee": delivery_fee,
        "total": subtotal + delivery_fee,
    }


def test_online_selects_cheapest():
    quotes = [
        {"provider": "shiprocket", "rate": 90, "supports_cod": True},
        {"provider": "rapido", "rate": 70, "supports_cod": False},
    ]
    result = delivery_decision(1500, "razorpay", quotes)
    assert result["provider"] == "rapido"
    assert result["total"] == 1570


def test_cod_uses_shiprocket_only():
    quotes = [
        {"provider": "shiprocket", "rate": 90, "supports_cod": True},
        {"provider": "rapido", "rate": 70, "supports_cod": False},
    ]
    result = delivery_decision(1500, "cod", quotes)
    assert result["provider"] == "shiprocket"
    assert result["total"] == 1590


def test_free_delivery_threshold():
    quotes = [
        {"provider": "shiprocket", "rate": 110, "supports_cod": True}
    ]
    result = delivery_decision(1999, "cod", quotes)
    assert result["delivery_fee"] == 0
    assert result["total"] == 1999


def test_cod_without_shiprocket_rejected():
    quotes = [
        {"provider": "rapido", "rate": 70, "supports_cod": False}
    ]
    with pytest.raises(ValueError):
        delivery_decision(1500, "cod", quotes)
