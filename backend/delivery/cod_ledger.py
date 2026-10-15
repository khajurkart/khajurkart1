"""Independent COD lifecycle; delivery never implies cash collection or settlement."""
from dataclasses import dataclass

@dataclass(frozen=True)
class CODAccount:
    order_id: str
    expected_paise: int
    collected_paise: int = 0
    payout_reported_paise: int = 0
    bank_verified_paise: int = 0

    def __post_init__(self):
        values = (self.expected_paise, self.collected_paise,
                  self.payout_reported_paise, self.bank_verified_paise)
        if any(not isinstance(v, int) or v < 0 for v in values):
            raise ValueError('COD amounts must be non-negative integer paise')

    @property
    def status(self):
        if self.bank_verified_paise and self.bank_verified_paise == self.payout_reported_paise:
            return 'bank_verified'
        if self.payout_reported_paise:
            return 'payout_reported'
        if self.collected_paise:
            return 'collected'
        return 'awaiting_collection'
