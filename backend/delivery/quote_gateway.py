from dataclasses import dataclass
from decimal import Decimal

from .pricing import as_money, calculate_delivery_pricing


@dataclass(frozen=True)
class DeliveryRequest:
    pickup_pincode: str
    delivery_pincode: str
    weight_kg: Decimal
    payment_method: str
    product_subtotal: Decimal


@dataclass(frozen=True)
class CourierQuote:
    provider: str
    service_id: str
    service_name: str
    rate: Decimal
    quote_reference: str
    expires_at: str


def select_delivery_quote(request, quotes):
    valid_quotes = []

    for quote in quotes:
        if quote.provider not in {"shiprocket", "rapido"}:
            continue

        if not quote.service_id or not quote.quote_reference:
            continue

        try:
            rate = as_money(quote.rate)
        except ValueError:
            continue

        # Expiry and serviceability must be verified
        # before quotes are supplied to this function.
        valid_quotes.append((rate, quote))

    if not valid_quotes:
        raise ValueError("No verified courier quote available")

    rate, selected = min(valid_quotes, key=lambda item: item[0])

    pricing = calculate_delivery_pricing(
        request.product_subtotal,
        rate,
    )

    return {
        "provider": selected.provider,
        "service_id": selected.service_id,
        "service_name": selected.service_name,
        "quote_reference": selected.quote_reference,
        "expires_at": selected.expires_at,
        **pricing,
    }
