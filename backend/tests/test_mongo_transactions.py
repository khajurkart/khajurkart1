import os
import uuid

import pytest
from motor.motor_asyncio import AsyncIOMotorClient


@pytest.mark.asyncio
async def test_mongodb_transaction_support():
    mongo_url = os.environ.get("TEST_MONGO_URL")
    if not mongo_url:
        pytest.skip("TEST_MONGO_URL not configured")

    client = AsyncIOMotorClient(
        mongo_url,
        serverSelectionTimeoutMS=10000,
    )

    db = client["khajurkart_integration_test"]
    collection = db["transaction_probe"]

    probe_id = f"probe-{uuid.uuid4().hex}"

    try:
        async with await client.start_session() as session:
            async with session.start_transaction():
                await collection.insert_one(
                    {"_id": probe_id, "test": True},
                    session=session,
                )

        saved = await collection.find_one({"_id": probe_id})
        assert saved is not None

    finally:
        await collection.delete_one({"_id": probe_id})
        client.close()
