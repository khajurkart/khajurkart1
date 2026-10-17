"""In-process HTTP tests: no Atlas, courier, or production access."""
import os
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

# Required only for importing the existing application; never real credentials.
os.environ.setdefault("MONGO_URL", "mongodb://127.0.0.1:27017")
os.environ.setdefault("DB_NAME", "khajurkart_integration_test")
os.environ.setdefault("JWT_SECRET", "ci-test-only-jwt-secret-not-for-production")
os.environ.setdefault("RESEND_API_KEY", "ci-test-placeholder")
os.environ.setdefault("RAZORPAY_KEY_ID", "rzp_test_placeholder")
os.environ.setdefault("RAZORPAY_KEY_SECRET", "ci-test-placeholder")
os.environ.pop("DELIVERY_ROTATION_START_DATE", None)

from backend import server  # noqa: E402

@pytest.fixture
def api(monkeypatch):
    database = MagicMock()
    database.users.find_one = AsyncMock(return_value=None)
    database.orders.find_one = AsyncMock(return_value=None)
    database.cod_accounts.find_one = AsyncMock(return_value=None)
    database.shipments.count_documents = AsyncMock(return_value=0)
    database.cod_accounts.count_documents = AsyncMock(return_value=0)
    database.shipments.find.return_value.to_list = AsyncMock(return_value=[])
    monkeypatch.setattr(server, "db", database)
    with TestClient(server.app) as client:
        yield client, database


def auth_header(user_id="ci_admin"):
    return {"Authorization": f"Bearer {server.create_access_token({'sub': user_id})}"}


PATHS = [
    "/api/admin/delivery/summary",
    "/api/admin/delivery/partner-on-duty",
    "/api/admin/delivery/orders/ci_missing_order",
]


@pytest.mark.parametrize("path", PATHS)
def test_anonymous_denied(api, path):
    client, _ = api
    assert client.get(path).status_code in (401, 403)


@pytest.mark.parametrize("path", PATHS)
def test_invalid_token_denied(api, path):
    client, _ = api
    assert client.get(path, headers={"Authorization": "Bearer invalid"}).status_code == 401


@pytest.mark.parametrize("path", PATHS)
def test_non_admin_denied(api, path):
    client, db = api
    db.users.find_one.return_value = {"id": "ci_customer", "email": "customer@example.invalid", "role": "user"}
    assert client.get(path, headers=auth_header("ci_customer")).status_code == 403


def test_summary_admin(api):
    client, db = api
    db.users.find_one.return_value = {"id": "ci_admin", "email": server.ADMIN_EMAILS[0], "role": "admin"}
    response = client.get(PATHS[0], headers=auth_header())
    assert response.status_code == 200, response.text
    assert response.json() == {
        "shipments_total": 0, "shipments_pending": 0,
        "shipments_unknown": 0, "cod_accounts_total": 0,
        "live_booking_enabled": False,
    }


def test_partner_rotation_unconfigured(api):
    client, db = api
    db.users.find_one.return_value = {"id": "ci_admin", "email": server.ADMIN_EMAILS[0], "role": "admin"}
    response = client.get(PATHS[1], headers=auth_header())
    assert response.status_code == 200, response.text
    assert response.json() == {"configured": False, "partner": None}


def test_missing_order_returns_404(api):
    client, db = api
    db.users.find_one.return_value = {"id": "ci_admin", "email": server.ADMIN_EMAILS[0], "role": "admin"}
    assert client.get(PATHS[2], headers=auth_header()).status_code == 404


def test_order_detail_admin(api):
    client, db = api
    db.users.find_one.return_value = {"id": "ci_admin", "email": server.ADMIN_EMAILS[0], "role": "admin"}
    db.orders.find_one.return_value = {"id": "ci_order", "payment_method": "cod"}
    response = client.get("/api/admin/delivery/orders/ci_order", headers=auth_header())
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["order_id"] == "ci_order"
    assert body["shipments"] == []
    assert body["cod_account"] is None
    assert body["live_booking_enabled"] is False


def test_allowlisted_email_without_admin_role_is_rejected(api):
    """Security regression test: expected to FAIL until get_admin_user checks role."""
    client, db = api
    db.users.find_one.return_value = {"id": "ci_customer", "email": server.ADMIN_EMAILS[0], "role": "user"}
    response = client.get(PATHS[0], headers=auth_header("ci_customer"))
    assert response.status_code == 403, "Security: allowlisted email with non-admin role gained access"
