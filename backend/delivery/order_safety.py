
"""Pure order-price validation helper for server.py integration.

Product records must come from MongoDB, not from the customer.
Coupons must be validated separately on the server.
This helper does not change stock or create orders.
"""

from decimal import Decimal, InvalidOperation, ROUND_HALF_UP


def to_paise(value):
    try:
        amount = Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        raise ValueError("Invalid monetary amount") from None

    if not amount.is_finite() or amount < 0:
        raise ValueError("Invalid monetary amount")

    paise = amount * 100

    if paise != paise.to_integral_value():
        raise ValueError("Amount has more than two decimal places")

    return int(paise.quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def calculate_items(cart_items, product_by_id):
    if not cart_items:
        raise ValueError("Empty cart")

    lines = []
    total = 0
    quantities_by_product = {}

    # First pass: validate and combine product quantities.
    for item in cart_items:
        product_id = item["product_id"]
        qty = item["quantity"]

        if not isinstance(qty, int) or isinstance(qty, bool) or qty <= 0:
            raise ValueError("Quantity must be a positive integer")

        product = product_by_id.get(product_id)

        if not product:
            raise ValueError(f"Unknown product: {product_id}")

        quantities_by_product[product_id] = (
            quantities_by_product.get(product_id, 0) + qty
        )

    # Check combined quantities against authoritative stock.
    for product_id, total_qty in quantities_by_product.items():
        product = product_by_id[product_id]

        if total_qty > product.get("stock", 0):
            raise ValueError(f"Insufficient stock: {product_id}")

    # Second pass: validate sizes and calculate prices.
    for item in cart_items:
        product_id = item["product_id"]
        qty = item["quantity"]
        product = product_by_id[product_id]

        sizes = product.get("sizes") or []

        if sizes:
            chosen = item.get("size") or sizes[0]["weight"]

            option = next(
                (s for s in sizes if s["weight"] == chosen),
                None
            )

            if option is None:
                raise ValueError("Invalid size")

            price = option["price"]
            selected_size = chosen

        else:
            if item.get("size"):
                raise ValueError(
                    "Product does not offer size selection"
                )

            price = product["price"]
            selected_size = None

        unit_paise = to_paise(price)
        line_total = unit_paise * qty

        total += line_total

        lines.append({
            "product_id": product_id,
            "quantity": qty,
            "size": selected_size,
            "unit_price_paise": unit_paise,
            "line_total_paise": line_total,
        })

    return {
        "items": lines,
        "subtotal_paise": total,
    }
