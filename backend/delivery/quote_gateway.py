
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal

from .pricing import as_money, calculate_delivery_pricing
from .payment_policy import validate_courier_payment


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
    supports_cod: bool = False


def select_delivery_quote(request, quotes):
    valid_quotes = []
    now = datetime.now(timezone.utc)

    for quote in quotes:
        if quote.provider not in {"shiprocket", "rapido"}:
            continue

        if not quote.service_id or not quote.quote_reference:
            continue

        try:
            validate_courier_payment(
                provider=quote.provider,
                payment_method=request.payment_method,
                supports_cod=quote.supports_cod,
            )

            rate = as_money(quote.rate)

            expires_at = datetime.fromisoformat(
                quote.expires_at.replace("Z", "+00:00")
            )

            if expires_at.tzinfo is None:
                continue

            if expires_at <= now:
                continue

        except (ValueError, TypeError, AttributeError):
            continue

        valid_quotes.append((rate, quote))

    if not valid_quotes:
        raise ValueError("No eligible courier quote available")

    rate, selected = min(
        valid_quotes,
        key=lambda item: item[0],
    )

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
