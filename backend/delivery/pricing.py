from decimal import Decimal, InvalidOperation

FREE_DELIVERY_THRESHOLD = Decimal("1999.00")


def as_money(value):
    try:
        amount = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        raise ValueError("Invalid monetary amount")

    if not amount.is_finite() or amount < 0:
        raise ValueError("Monetary amount cannot be negative")

    if amount != amount.quantize(Decimal("0.01")):
        raise ValueError("Monetary amount exceeds two decimal places")

    return amount


def calculate_delivery_pricing(
    discounted_subtotal,
    courier_rate,
):
    subtotal = as_money(discounted_subtotal)
    actual_courier_cost = as_money(courier_rate)

    free_delivery = subtotal >= FREE_DELIVERY_THRESHOLD

    customer_delivery_fee = (
        Decimal("0.00")
        if free_delivery
        else actual_courier_cost
    )

    return {
        "free_delivery": free_delivery,
        "free_delivery_threshold": str(FREE_DELIVERY_THRESHOLD),
        "product_subtotal": str(subtotal),
        "courier_cost": str(actual_courier_cost),
        "customer_delivery_fee": str(customer_delivery_fee),
        "total_amount": str(subtotal + customer_delivery_fee),
    }
