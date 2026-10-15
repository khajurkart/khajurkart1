from delivery.cod_ledger import CODAccount
from delivery.reconciliation import Reconciliation

def test_delivery_is_not_settlement():
    assert CODAccount('KK-1', 200000).status == 'awaiting_collection'

def test_matching_payout():
    r = Reconciliation(200000, 200000, 6000, 194000, 194000, True)
    assert r.reconciled

def test_mismatched_bank_credit():
    r = Reconciliation(200000, 200000, 6000, 194000, 193000, True)
    assert not r.reconciled

def test_reference_required():
    r = Reconciliation(200000, 200000, 6000, 194000, 194000, False)
    assert not r.reconciled
