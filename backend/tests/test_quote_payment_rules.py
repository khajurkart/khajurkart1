from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest

from delivery.quote_gateway import (
    CourierQuote,
    DeliveryRequest,
    select_delivery_quote,
)


def future_expiry():
    return (
        datetime.now(timezone.utc) + timedelta(hours=1)
    ).isoformat()


def test_cod_never_selects_rapido():
    request = DeliveryRequest(
        "500001", "500002",
        Decimal("0.5"), "cod", Decimal("1500")
    )

    quotes = [
        CourierQuote(
            "shiprocket", "sr-1", "Parcel",
            Decimal("90"), "sr-ref", future_expiry(),
            supports_cod=True,
        ),
        CourierQuote(
            "rapido", "rp-1", "Local",
            Decimal("70"), "rp-ref", future_expiry(),
        ),
    ]

    result = select_delivery_quote(request, quotes)

    assert result["provider"] == "shiprocket"
    assert result["customer_delivery_fee"] == "90.00"
    assert result["total_amount"] == "1590.00"


def test_expired_quote_rejected():
    request = DeliveryRequest(
        "500001", "500002",
        Decimal("0.5"), "razorpay", Decimal("1500")
    )

    expired = (
        datetime.now(timezone.utc) - timedelta(minutes=1)
    ).isoformat()

    quotes = [
        CourierQuote(
            "shiprocket", "sr-1", "Parcel",
            Decimal("90"), "expired-ref", expired,
        )
    ]

    with pytest.raises(ValueError):
        select_delivery_quote(request, quotes)


def test_rapido_online_allowed():
    request = DeliveryRequest(
        "500001", "500002",
        Decimal("0.5"), "razorpay", Decimal("1500")
    )

    quotes = [
        CourierQuote(
            "rapido", "rp-1", "Local",
            Decimal("70"), "rp-ref", future_expiry(),
        )
    ]

    result = select_delivery_quote(request, quotes)

    assert result["provider"] == "rapido"
    assert result["total_amount"] == "1570.00"
