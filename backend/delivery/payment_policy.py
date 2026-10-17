def validate_courier_payment(
    provider: str,
    payment_method: str,
    supports_cod: bool = False,
) -> None:
    provider = provider.lower().strip()
    payment_method = payment_method.lower().strip()

    if provider not in {"shiprocket", "rapido"}:
        raise ValueError("Unsupported courier provider")

    if payment_method not in {"razorpay", "cod"}:
        raise ValueError("Unsupported payment method")

    if provider == "rapido" and payment_method == "cod":
        raise ValueError(
            "Cash on delivery is not available for Rapido"
        )

    if (
        provider == "shiprocket"
        and payment_method == "cod"
        and not supports_cod
    ):
        raise ValueError(
            "Selected Shiprocket courier does not support COD"
        )
