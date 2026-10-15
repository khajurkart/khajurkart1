"""Courier capability and address validation."""
from delivery.models import PaymentMode, ShipmentRequest, Quote

def eligible(request: ShipmentRequest, quote: Quote | None) -> bool:
    if quote is None or quote.fee_paise < 0:
        return False
    if request.payment_mode == PaymentMode.COD and not quote.cod_supported:
        return False
    return True

async def eligible_quotes(request, providers):
    found = []
    for provider in providers:
        try:
            quote = await provider.quote(request)
        except Exception:
            continue  # failures never imply serviceability
        if eligible(request, quote):
            found.append((provider, quote))
    return found
