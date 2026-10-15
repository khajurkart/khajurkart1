"""Mongo-backed booking guard. Reconcile uncertain provider responses before retry."""
from datetime import datetime, timezone
from pymongo.errors import DuplicateKeyError

class BookingConflict(RuntimeError):
    pass

async def ensure_booking_indexes(db):
    await db.shipments.create_index('booking_key', unique=True)
    await db.shipments.create_index([('provider', 1), ('shipment_id', 1)], unique=True, sparse=True)

async def book_once(db, gateway, request, booking_key):
    if not booking_key:
        raise ValueError('Booking key required')
    previous = await db.shipments.find_one({'booking_key': booking_key}, {'_id': 0})
    if previous:
        return previous
    provider, quote = await gateway.select(request)
    record = {'booking_key': booking_key, 'order_id': request.order_id,
              'merchant_account_id': request.merchant_account_id, 'provider': provider.name,
              'fee_paise': quote.fee_paise, 'status': 'booking_pending',
              'created_at': datetime.now(timezone.utc).isoformat()}
    try:
        await db.shipments.insert_one(record)
    except DuplicateKeyError:
        raise BookingConflict('Another booking attempt is in progress; inspect its status')
    try:
        result = await provider.book(request, booking_key)
    except Exception as exc:
        # A timeout might mean the courier actually booked it. Never blindly retry.
        await db.shipments.update_one({'booking_key': booking_key}, {'$set': {'status': 'booking_unknown'}})
        raise BookingConflict('Courier result unknown; reconcile before retry') from exc
    await db.shipments.update_one({'booking_key': booking_key}, {'$set': {
        'status': result.status.value, 'shipment_id': result.shipment_id,
        'tracking_number': result.tracking_number, 'tracking_url': result.tracking_url}})
    return await db.shipments.find_one({'booking_key': booking_key}, {'_id': 0})
