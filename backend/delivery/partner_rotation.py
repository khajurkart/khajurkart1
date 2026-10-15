"""Operations-only rotation, not a rotation of merchant or bank ownership."""
from datetime import date

PARTNERS = ('Arsalan', 'Abdullah', 'Zakir', 'Omer')

def assigned_partner(order_date: date, start_date: date, days_per_partner: int = 15,
                     partners=PARTNERS) -> str:
    if days_per_partner not in (15, 30):
        raise ValueError('Rotation interval must be 15 or 30 days')
    if not partners or order_date < start_date:
        raise ValueError('Invalid rotation date or partner list')
    index = ((order_date - start_date).days // days_per_partner) % len(partners)
    return partners[index]
