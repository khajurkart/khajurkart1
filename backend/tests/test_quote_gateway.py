from decimal import Decimal

import pytest

from delivery.quote_gateway import (
    CourierQuote,
    DeliveryRequest,
    select_delivery_quote,
)


def test_select_cheapest_verified_quote():
    request = DeliveryRequest(
        pickup_pincode="500001",
        delivery_pincode="500002",
        weight_kg=Decimal("0.5"),
        payment_method="cod",
        product_subtotal=Decimal("1000"),
    )

    quotes = [
        CourierQuote(
            "shiprocket", "sr-1", "Parcel",
            Decimal("90"), "quote-sr", "2026-12-01T00:00:00Z"
        ),
        CourierQuote(
            "rapido", "rp-1", "Local",
            Decimal("70"), "quote-rp", "2026-12-01T00:00:00Z"
        ),
    ]

    result = select_delivery_quote(request, quotes)

    assert result["provider"] == "rapido"
    assert result["customer_delivery_fee"] == "70"
    assert result["total_amount"] == "1070"


def test_missing_quotes_rejected():
    request = DeliveryRequest(
        "500001", "500002", Decimal("0.5"),
        "cod", Decimal("1000")
    )

    with pytest.raises(ValueError):
        select_delivery_quote(request, [])
