
import pytest

from delivery.order_safety import calculate_items, to_paise


def test_price_comes_from_database():
    result = calculate_items(
        [{"product_id": "p1", "quantity": 2, "price": 1}],
        {"p1": {"price": 49.99, "stock": 5}},
    )

    assert result["subtotal_paise"] == 9998


def test_invalid_stock_and_quantity():
    with pytest.raises(ValueError):
        calculate_items(
            [{"product_id": "p1", "quantity": 2}],
            {"p1": {"price": 5, "stock": 1}},
        )

    with pytest.raises(ValueError):
        calculate_items(
            [{"product_id": "p1", "quantity": -1}],
            {"p1": {"price": 5, "stock": 10}},
        )


def test_invalid_price():
    with pytest.raises(ValueError):
        to_paise(float("nan"))


def test_duplicate_product_cannot_exceed_stock():
    products = {
        "ajwa-dates": {
            "price": 1299,
            "stock": 5,
            "sizes": [],
        }
    }

    cart = [
        {"product_id": "ajwa-dates", "quantity": 4},
        {"product_id": "ajwa-dates", "quantity": 4},
    ]

    with pytest.raises(ValueError, match="Insufficient stock"):
        calculate_items(cart, products)
