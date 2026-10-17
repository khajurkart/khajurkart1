import pytest

from delivery.payment_policy import validate_courier_payment


def test_rapido_online_allowed():
    validate_courier_payment("rapido", "razorpay")


def test_rapido_cod_rejected():
    with pytest.raises(ValueError):
        validate_courier_payment("rapido", "cod")


def test_shiprocket_cod_allowed_when_supported():
    validate_courier_payment(
        "shiprocket", "cod", supports_cod=True
    )


def test_shiprocket_cod_rejected_when_unsupported():
    with pytest.raises(ValueError):
        validate_courier_payment(
            "shiprocket", "cod", supports_cod=False
        )
