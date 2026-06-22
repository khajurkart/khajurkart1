const fetchOrders = useCallback(async (silent = false) => {
  if (!silent) setLoading(true); // ✅ Only show spinner on initial load
  try {
    const { data } = await axios.get(`${API}/admin/orders`, authHeaders);
    setOrders(data);
  } catch {
    toast.error('Failed to load orders. Please try again.');
  } finally {
    if (!silent) setLoading(false);
  }
}, [token]);

// Initial load (shows spinner)
useEffect(() => {
  fetchOrders();
}, [fetchOrders]);

// In updateOrderStatus — silent reload (no spinner)
const updateOrderStatus = async (orderId, status) => {
  try {
    await axios.put(
      `${API}/admin/orders/${orderId}/status?status=${status}`,
      {},
      authHeaders
    );

    await fetchOrders(true); // ✅ Silent reload — no loading spinner

    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) => ({ ...prev, status }));
    }

    toast.success('Order status updated.');
  } catch {
    toast.error('Failed to update order status.');
  }
};
