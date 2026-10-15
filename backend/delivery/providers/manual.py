"""Manual delivery fallback: no cash collection is claimed on behalf of a courier."""
from delivery.models import ShipmentRequest, Quote, BookingResult, ShipmentStatus, PaymentMode
from delivery.providers.base import CourierProvider, ProviderError

class ManualProvider(CourierProvider):
    name = 'manual'
    def __init__(self, enabled=False):
        self.enabled = enabled
    async def quote(self, request: ShipmentRequest):
        if not self.enabled or request.payment_mode == PaymentMode.COD:
            return None
        return Quote(self.name, 'manual_prepaid', 0, False)
    async def book(self, request: ShipmentRequest, booking_key: str):
        if not self.enabled or request.payment_mode == PaymentMode.COD:
            raise ProviderError('Manual provider is disabled or cannot collect courier COD')
        return BookingResult(self.name, booking_key, '', ShipmentStatus.PENDING)
    async def track(self, shipment_id: str):
        return ShipmentStatus.PENDING
    async def cancel(self, shipment_id: str):
        return True
