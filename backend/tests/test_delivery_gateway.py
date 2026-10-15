import pytest
from delivery.gateway import DeliveryGateway, NoEligibleCourier
from delivery.models import Address, ShipmentRequest, PaymentMode, Quote
from delivery.providers.manual import ManualProvider

@pytest.fixture
def address():
    return Address('Test', '9999999999', 'Street 1', 'Hyderabad', 'Telangana', '500001')

@pytest.fixture
def request_cod(address):
    return ShipmentRequest('KK-1', 200000, PaymentMode.COD, address, 500,
                           [{'product_id': 'p1', 'quantity': 1}], 'khajurkart')

@pytest.mark.asyncio
async def test_cod_never_uses_manual(request_cod):
    with pytest.raises(NoEligibleCourier):
        await DeliveryGateway([ManualProvider(enabled=True)]).select(request_cod)

@pytest.mark.asyncio
async def test_prepaid_can_use_manual(request_cod):
    from dataclasses import replace
    prepaid = replace(request_cod, payment_mode=PaymentMode.PREPAID)
    provider, quote = await DeliveryGateway([ManualProvider(enabled=True)]).select(prepaid)
    assert provider.name == 'manual'
    assert not quote.cod_supported

@pytest.mark.asyncio
async def test_choose_cheapest_eligible(request_cod):
    class Stub:
        def __init__(self, name, fee, cod):
            self.name, self.fee, self.cod = name, fee, cod
        async def quote(self, request):
            return Quote(self.name, 'standard', self.fee, self.cod)
    provider, _ = await DeliveryGateway([Stub('no_cod', 1, False), Stub('yes_cod', 100, True)]).select(request_cod)
    assert provider.name == 'yes_cod'
