class RapidoQuoteProvider:
    name = "rapido"

    def __init__(self, api_client=None):
        self.api_client = api_client

    async def get_quotes(self, request):
        # No approved merchant API has been
        # verified for this integration yet.
        return []
