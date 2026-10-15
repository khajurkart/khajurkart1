
"""COD accounting validation for KhajurKart.

Delivery does not imply COD collection.
Courier payout reports do not prove bank settlement.
Bank verification requires independently matched bank records.
"""

from dataclasses import dataclass


def validate_paise(value, name):
    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
        raise ValueError(f"{name} must be a non-negative integer paise")
    return value


@dataclass(frozen=True)
class CODAccount:
    order_id: str
    expected_paise: int
    collected_paise: int = 0
    payout_reported_paise: int = 0
    bank_verified_paise: int = 0
    courier_deductions_paise: int = 0

    def __post_init__(self):
        if not isinstance(self.order_id, str) or not self.order_id.strip():
            raise ValueError("A valid order ID is required")

        for field in (
            "expected_paise",
            "collected_paise",
            "payout_reported_paise",
            "bank_verified_paise",
            "courier_deductions_paise",
        ):
            validate_paise(getattr(self, field), field)

        if self.collected_paise > self.expected_paise:
            raise ValueError("Collected amount exceeds expected COD")

        if self.payout_reported_paise > self.collected_paise:
            raise ValueError("Courier payout exceeds collected COD")

        if self.courier_deductions_paise > self.collected_paise:
            raise ValueError("Courier deductions exceed collected COD")

        if (
            self.payout_reported_paise
            + self.courier_deductions_paise
            > self.collected_paise
        ):
            raise ValueError("Payout plus deductions exceeds collection")

        if self.bank_verified_paise > self.payout_reported_paise:
            raise ValueError("Bank credit exceeds reported payout")

        if self.bank_verified_paise and not self.payout_reported_paise:
            raise ValueError("Cannot verify bank credit without payout")

    @property
    def status(self):
        if (
            self.expected_paise > 0
            and self.collected_paise == self.expected_paise
            and self.payout_reported_paise > 0
            and self.bank_verified_paise == self.payout_reported_paise
            and (
                self.payout_reported_paise
                + self.courier_deductions_paise
                == self.collected_paise
            )
        ):
            return "bank_verified"

        if self.bank_verified_paise:
            return "partially_bank_verified"

        if self.payout_reported_paise:
            return "payout_reported"

        if self.collected_paise:
            return "collected"

        return "awaiting_collection"
