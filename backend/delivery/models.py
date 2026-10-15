"""Shared typed records. Monetary amounts are integer paise, not floating rupees."""
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

class PaymentMode(str, Enum):
    COD = 'cod'
    PREPAID = 'prepaid'

class ShipmentStatus(str, Enum):
    PENDING = 'pending'
    BOOKED = 'booked'
    PICKED_UP = 'picked_up'
    IN_TRANSIT = 'in_transit'
    OUT_FOR_DELIVERY = 'out_for_delivery'
    DELIVERED = 'delivered'
    FAILED = 'failed'
    RTO = 'rto'
    CANCELLED = 'cancelled'

@dataclass(frozen=True)
class Address:
    name: str
    phone: str
    address: str
    city: str
    state: str
    pincode: str
    country: str = 'India'

@dataclass(frozen=True)
class ShipmentRequest:
    order_id: str
    amount_paise: int
    payment_mode: PaymentMode
    destination: Address
    weight_grams: int
    items: list[dict]
    merchant_account_id: str
    pickup_address: Optional[Address] = None

    def __post_init__(self):
        if not self.order_id or not self.merchant_account_id:
            raise ValueError('Order ID and merchant account are required')
        if self.amount_paise < 0 or self.weight_grams <= 0:
            raise ValueError('Invalid amount or weight')
        if not self.destination.pincode.isdigit() or len(self.destination.pincode) != 6:
            raise ValueError('Indian destination PIN must contain 6 digits')
        if not self.items:
            raise ValueError('Shipment items are required')

@dataclass(frozen=True)
class Quote:
    provider: str
    service_code: str
    fee_paise: int
    cod_supported: bool
    eta_days: Optional[int] = None

@dataclass(frozen=True)
class BookingResult:
    provider: str
    shipment_id: str
    tracking_number: str
    status: ShipmentStatus = ShipmentStatus.BOOKED
    tracking_url: Optional[str] = None

@dataclass(frozen=True)
class DeliveryEvent:
    provider: str
    shipment_id: str
    event_id: str
    status: ShipmentStatus
    occurred_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
