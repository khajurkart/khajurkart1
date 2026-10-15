"""Append-only operational audit helper. Do not log passwords or provider tokens."""
from datetime import datetime, timezone
import uuid

async def append_audit(db, *, actor_id, action, target_id, metadata=None):
    if not actor_id or not action or not target_id:
        raise ValueError('Audit actor, action and target required')
    record = {'id': str(uuid.uuid4()), 'actor_id': actor_id, 'action': action,
              'target_id': target_id, 'metadata': metadata or {},
              'occurred_at': datetime.now(timezone.utc).isoformat()}
    await db.delivery_audit.insert_one(record)
    return record['id']
