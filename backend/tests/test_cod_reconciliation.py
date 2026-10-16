import pytest

from delivery.cod_ledger import CODAccount
from delivery.reconciliation import Reconciliation


def test_delivery_is_not_settlement():
    assert CODAccount("KK-1", 200000).status == "awaiting_collection"


def test_matching_payout():
    r = Reconciliation(
        200000, 200000, 6000, 194000, 194000, True
    )
    assert r.reconciled


def test_mismatched_bank_credit():
    r = Reconciliation(
        200000, 200000, 6000, 194000, 193000, True
    )
    assert not r.reconciled


def test_reference_required():
    r = Reconciliation(
        200000, 200000, 6000, 194000, 194000, False
    )
    assert not r.reconciled


def test_reject_payout_greater_than_collection():
    with pytest.raises(ValueError):
        CODAccount(
            order_id="KK001",
            expected_paise=10000,
            collected_paise=10000,
            payout_reported_paise=11000,
        )


def test_reject_bank_credit_greater_than_payout():
    with pytest.raises(ValueError):
        CODAccount(
            order_id="KK002",
            expected_paise=10000,
            collected_paise=10000,
            payout_reported_paise=9000,
            bank_verified_paise=9500,
        )


def test_reject_boolean_amount():
    with pytest.raises(ValueError):
        CODAccount(
            order_id="KK003",
            expected_paise=True,
        )


def test_valid_cod_settlement():
    account = CODAccount(
        order_id="KK004",
        expected_paise=200000,
        collected_paise=200000,
        courier_deductions_paise=6000,
        payout_reported_paise=194000,
        bank_verified_paise=194000,
    )

    assert account.status == "bank_verified"


def test_unexplained_difference_not_verified():
    account = CODAccount(
        order_id="KK005",
        expected_paise=10000,
        collected_paise=10000,
        payout_reported_paise=9000,
        bank_verified_paise=9000,
    )

    assert account.status != "bank_verified"
