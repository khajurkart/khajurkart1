class ShiprocketQuoteProvider:
    name = "shiprocket"

    def __init__(self, api_client=None):
        self.api_client = api_client

    async def get_quotes(self, request):
        if self.api_client is None:
            return []

        # Implement only after verifying the
        # authenticated Shiprocket account,
        # response schema, and courier eligibility.
        raise NotImplementedError(
            "Shiprocket quote mapping not configured"
        )
