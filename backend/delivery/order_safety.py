"""Pure order-price validation helper for incremental server.py integration.

Caller must load authoritative product records from MongoDB and validate coupons
server-side; this helper does not change stock or create an order.
"""
from decimal import Decimal, ROUND_HALF_UP

def to_paise(value):
    amount = Decimal(str(value))
    if not amount.is_finite() or amount < 0:
        raise ValueError('Invalid monetary amount')
    return int((amount * 100).quantize(Decimal('1'), rounding=ROUND_HALF_UP))

def calculate_items(cart_items, product_by_id):
    if not cart_items:
        raise ValueError('Empty cart')
    lines = []
    total = 0
    for item in cart_items:
        product_id = item['product_id']
        qty = item['quantity']
        if not isinstance(qty, int) or isinstance(qty, bool) or qty <= 0:
            raise ValueError('Quantity must be a positive integer')
        product = product_by_id.get(product_id)
        if not product:
            raise ValueError(f'Unknown product: {product_id}')
        if qty > product.get('stock', 0):
            raise ValueError(f'Insufficient stock: {product_id}')
        sizes = product.get('sizes') or []
        if sizes:
            chosen = item.get('size') or sizes[0]['weight']
            option = next((s for s in sizes if s['weight'] == chosen), None)
            if option is None:
                raise ValueError('Invalid size')
            price = option['price']
        else:
            if item.get('size'):
                raise ValueError('Product does not offer size selection')
            price = product['price']
        unit_paise = to_paise(price)
        total += unit_paise * qty
        lines.append({'product_id': product_id, 'quantity': qty,
                      'size': item.get('size'), 'unit_price_paise': unit_paise,
                      'line_total_paise': unit_paise * qty})
    return {'items': lines, 'subtotal_paise': total}
