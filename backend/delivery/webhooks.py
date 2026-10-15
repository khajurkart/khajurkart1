"""Generic HMAC webhook verifier. Use ONLY for providers documenting this exact scheme."""
import hashlib
import hmac
import json
from pymongo.errors import DuplicateKeyError

class InvalidWebhook(ValueError):
    pass

def verify_hmac_sha256(raw_body: bytes, signature_hex: str, secret: str) -> bool:
    if not secret or not signature_hex:
        return False
    expected = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature_hex.lower())

async def record_verified_event(db, *, provider, event_id, payload, signature, secret):
    # This is NOT a universal provider signature scheme; configure per provider.
    raw = json.dumps(payload, separators=(',', ':'), sort_keys=True).encode()
    if not verify_hmac_sha256(raw, signature, secret):
        raise InvalidWebhook('Invalid signature')
    if not provider or not event_id:
        raise InvalidWebhook('Provider and event ID required')
    await db.delivery_events.create_index([('provider', 1), ('event_id', 1)], unique=True)
    try:
        await db.delivery_events.insert_one({'provider': provider, 'event_id': event_id,
                                              'payload': payload, 'verified': True})
    except DuplicateKeyError:
        return False
    return True
