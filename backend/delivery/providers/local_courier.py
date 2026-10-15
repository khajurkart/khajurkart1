"""Explicitly disabled placeholder until a verified local courier API is contracted."""
from delivery.providers.base import CourierProvider, ProviderError

class LocalCourierProvider(CourierProvider):
    name = 'local_courier'
    async def quote(self, request):
        return None
    async def book(self, request, booking_key):
        raise ProviderError('Local courier API and merchant COD agreement not configured')
    async def track(self, shipment_id):
        raise ProviderError('Local courier tracking not configured')
    async def cancel(self, shipment_id):
        raise ProviderError('Local courier cancellation not configured')
