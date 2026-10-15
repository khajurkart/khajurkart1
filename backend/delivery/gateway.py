"""Provider-independent selection; cheapest eligible provider wins."""
from delivery.serviceability import eligible_quotes

class NoEligibleCourier(RuntimeError):
    pass

class DeliveryGateway:
    def __init__(self, providers):
        self.providers = list(providers)
    async def select(self, request):
        options = await eligible_quotes(request, self.providers)
        if not options:
            raise NoEligibleCourier('No verified courier supports this shipment/payment mode')
        return min(options, key=lambda entry: (entry[1].fee_paise, entry[0].name))
