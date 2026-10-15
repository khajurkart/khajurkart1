"""Normalize provider events without interpreting delivery as payment collection."""
from delivery.models import ShipmentStatus

STATUS_MAP = {
    'created': ShipmentStatus.PENDING, 'booked': ShipmentStatus.BOOKED,
    'picked_up': ShipmentStatus.PICKED_UP, 'in_transit': ShipmentStatus.IN_TRANSIT,
    'out_for_delivery': ShipmentStatus.OUT_FOR_DELIVERY,
    'delivered': ShipmentStatus.DELIVERED, 'failed': ShipmentStatus.FAILED,
    'rto': ShipmentStatus.RTO, 'cancelled': ShipmentStatus.CANCELLED,
}

def normalize_status(raw: str) -> ShipmentStatus:
    key = raw.strip().lower().replace(' ', '_').replace('-', '_')
    if key not in STATUS_MAP:
        raise ValueError(f'Unrecognized courier status: {raw}')
    return STATUS_MAP[key]
