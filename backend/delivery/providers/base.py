"""Every courier integration must implement this contract."""
from abc import ABC, abstractmethod
from delivery.models import ShipmentRequest, Quote, BookingResult, ShipmentStatus

class ProviderError(RuntimeError):
    pass

class CourierProvider(ABC):
    name: str
    @abstractmethod
    async def quote(self, request: ShipmentRequest) -> Quote | None: ...
    @abstractmethod
    async def book(self, request: ShipmentRequest, booking_key: str) -> BookingResult: ...
    @abstractmethod
    async def track(self, shipment_id: str) -> ShipmentStatus: ...
    @abstractmethod
    async def cancel(self, shipment_id: str) -> bool: ...
