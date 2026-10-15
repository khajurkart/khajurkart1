"""Match courier settlement and bank credit with explicit deductions."""
from dataclasses import dataclass

@dataclass(frozen=True)
class Reconciliation:
    expected_cod_paise: int
    courier_collected_paise: int
    courier_deductions_paise: int
    courier_payout_paise: int
    bank_credit_paise: int
    bank_reference_matched: bool

    @property
    def expected_payout_paise(self):
        return self.courier_collected_paise - self.courier_deductions_paise

    @property
    def reconciled(self):
        amounts = (self.expected_cod_paise, self.courier_collected_paise,
                   self.courier_deductions_paise, self.courier_payout_paise,
                   self.bank_credit_paise)
        return (all(isinstance(x, int) and x >= 0 for x in amounts)
                and self.bank_reference_matched
                and self.expected_cod_paise == self.courier_collected_paise
                and self.expected_payout_paise == self.courier_payout_paise
                and self.courier_payout_paise == self.bank_credit_paise)
