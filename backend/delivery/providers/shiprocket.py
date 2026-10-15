"""Safe Shiprocket integration placeholder. No undocumented API fields or fake bookings.

Enable only after implementing and testing the provider's current official API,
serviceability, token handling, account COD eligibility, and payout contract.
"""
from delivery.providers.base import CourierProvider, ProviderError

class ShiprocketProvider(CourierProvider):
    name = 'shiprocket'
    async def quote(self, request):
        return None
    async def book(self, request, booking_key):
        raise ProviderError('Shiprocket live adapter not configured or verified')
    async def track(self, shipment_id):
        raise ProviderError('Shiprocket tracking not configured')
    async def cancel(self, shipment_id):
        raise ProviderError('Shiprocket cancellation not configured')
