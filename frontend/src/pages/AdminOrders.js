import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  ChevronLeft,
  Package,
  User,
  MapPin,
  Loader2,
  Trash2,
  Eye,
  X,
  Search,
  Filter,
  ShoppingBag
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ─── Constants ─────────────────────────────────────────────────────────────────

const ORDER_STATUSES = [
  { value: 'pending',    label: 'Pending',    color: 'bg-yellow-100 text-yellow-800' },
  { value: 'confirmed',  label: 'Confirmed',  color: 'bg-blue-100 text-blue-800' },
  { value: 'processing', label: 'Processing', color: 'bg-purple-100 text-purple-800' },
  { value: 'shipped',    label: 'Shipped',    color: 'bg-indigo-100 text-indigo-800' },
  { value: 'delivered',  label: 'Delivered',  color: 'bg-green-100 text-green-800' },
  { value: 'exchange',   label: 'Exchange',   color: 'bg-orange-100 text-orange-800' },
  { value: 'return',     label: 'Return',     color: 'bg-pink-100 text-pink-800' },
  { value: 'cancelled',  label: 'Cancelled',  color: 'bg-red-100 text-red-800' },
];

const getStatusStyle = (status) =>
  ORDER_STATUSES.find((s) => s.value === status)?.color ?? 'bg-gray-100 text-gray-800';

// ─── Sub-Components ────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => (
  <span
    className={`
      inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize
      ${getStatusStyle(status)}
    `}
  >
    {status}
  </span>
);

const SectionHeading = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 mb-3">
    <Icon className="w-5 h-5 text-khajur-gold" />
    <h3 className="font-serif text-lg font-medium text-khajur-primary">{title}</h3>
  </div>
);

const InfoGrid = ({ children }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
);

const InfoItem = ({ label, children }) => (
  <div>
    <p className="text-xs text-khajur-dark/50 uppercase tracking-wide mb-0.5">{label}</p>
    <div className="text-sm font-medium text-khajur-primary">{children}</div>
  </div>
);

// ── Empty State ────────────────────────────────────────────────────────────────

const EmptyState = () => (
  <tr>
    <td colSpan={8}>
      <div className="flex flex-col items-center justify-center py-20 text-khajur-dark/40">
        <ShoppingBag className="w-12 h-12 mb-3" />
        <p className="text-sm">No orders found</p>
      </div>
    </td>
  </tr>
);

// ── Order Detail Modal ─────────────────────────────────────────────────────────

const OrderDetailModal = ({ order, onClose, onStatusChange }) => {
  const subtotal = order.total_amount ?? 0;
  const delivery = order.delivery_charges ?? 0;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      data-testid="order-details-modal"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-w-3xl rounded-sm shadow-2xl max-h-[92vh] flex flex-col">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-khajur-border flex-shrink-0">
          <div>
            <p className="text-xs uppercase tracking-widest text-khajur-gold mb-0.5">
              Order #{order.id.substring(0, 12)}…
            </p>
            <h2 className="font-serif text-2xl font-medium text-khajur-primary">
              Order Details
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-khajur-dark/40 hover:text-khajur-primary transition-colors"
            aria-label="Close modal"
            data-testid="close-order-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto px-8 py-6 space-y-6 flex-1">

          {/* Order Meta */}
          <div className="bg-khajur-cream p-5">
            <InfoGrid>
              <InfoItem label="Order ID">
                <span className="font-mono text-xs">{order.id}</span>
              </InfoItem>
              <InfoItem label="Tracking ID">
                {order.tracking_id || (
                  <span className="text-khajur-dark/40 font-normal">Not assigned</span>
                )}
              </InfoItem>
              <InfoItem label="Order Date">
                {new Date(order.created_at).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </InfoItem>
              <InfoItem label="Status">
                <div className="flex items-center gap-3">
                  <StatusBadge status={order.status} />
                  <select
                    value={order.status}
                    onChange={(e) => onStatusChange(order.id, e.target.value)}
                    className="text-xs border border-khajur-border px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-khajur-gold"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </InfoItem>
            </InfoGrid>
          </div>

          {/* Customer Info */}
          <div>
            <SectionHeading icon={User} title="Customer Information" />
            <div className="border border-khajur-border p-5 space-y-1">
              <p className="text-sm font-medium text-khajur-dark">{order.customer_name}</p>
              <p className="text-sm text-khajur-dark/60">{order.customer_email}</p>
              <p className="text-sm text-khajur-dark/60">{order.shipping_address?.phone}</p>
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <SectionHeading icon={MapPin} title="Shipping Address" />
            <div className="border border-khajur-border p-5 space-y-1">
              <p className="text-sm text-khajur-dark">{order.shipping_address?.address}</p>
              <p className="text-sm text-khajur-dark">
                {order.shipping_address?.city}, {order.shipping_address?.state}
                {' — '}{order.shipping_address?.pincode}
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <SectionHeading icon={Package} title="Order Items" />
            <div className="border border-khajur-border divide-y divide-khajur-border">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-5 gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-khajur-dark truncate">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-khajur-dark/50 mt-0.5">
                      {item.size && <span className="mr-3">Weight: {item.size}</span>}
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-khajur-gold whitespace-nowrap">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-khajur-cream p-5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-khajur-dark/70">Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-khajur-dark/70">Delivery Charges</span>
              <span>₹{delivery.toFixed(2)}</span>
            </div>
            <div className="border-t border-khajur-border pt-3 flex justify-between items-center">
              <span className="font-serif text-base font-medium text-khajur-primary">
                Total
              </span>
              <span className="font-serif text-xl font-bold text-khajur-gold">
                ₹{(subtotal + delivery).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const AdminOrders = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery]     = useState('');
  const [statusFilter, setStatusFilter]   = useState('all');
  const [deletingId, setDeletingId]       = useState(null);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/admin/orders`, authHeaders);
      setOrders(data);
    } catch {
      toast.error('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(
        `${API}/admin/orders/${orderId}/status?status=${status}`,
        {},
        authHeaders
      );
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status }));
      }
      toast.success('Order status updated.');
    } catch {
      toast.error('Failed to update order status.');
    }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }
    setDeletingId(id);
    try {
      await axios.delete(`${API}/admin/orders/${id}`, authHeaders);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      if (selectedOrder?.id === id) setSelectedOrder(null);
      toast.success('Order deleted.');
    } catch {
      toast.error('Failed to delete order.');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      order.id.toLowerCase().includes(q) ||
      order.customer_name?.toLowerCase().includes(q) ||
      order.customer_email?.toLowerCase().includes(q) ||
      order.tracking_id?.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // ── Render States ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-khajur-dark/50">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-sm">Loading orders…</p>
      </div>
    );
  }

  // ── Main Render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen py-20 bg-white" data-testid="admin-orders-page">
      <div className="max-w-7xl mx-auto px-6 md:px-12">

        {/* Page Header */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="text-khajur-primary hover:text-khajur-gold transition-colors"
            aria-label="Back to dashboard"
            data-testid="back-to-dashboard"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-widest text-khajur-gold mb-0.5">
              Administration
            </p>
            <h1 className="font-serif text-4xl font-medium text-khajur-primary">
              Manage Orders
            </h1>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-khajur-dark/30" />
            <input
              type="text"
              placeholder="Search by name, email, order ID or tracking…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full pl-10 pr-4 py-2.5 text-sm border border-khajur-border bg-white
                text-khajur-primary placeholder:text-khajur-dark/30
                focus:outline-none focus:ring-1 focus:ring-khajur-gold
              "
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-khajur-dark/30" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="
                pl-10 pr-8 py-2.5 text-sm border border-khajur-border bg-white
                text-khajur-primary focus:outline-none focus:ring-1 focus:ring-khajur-gold
                appearance-none cursor-pointer
              "
            >
              <option value="all">All Statuses</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary */}
        <p className="text-sm text-khajur-dark/50 mb-4">
          Showing <span className="font-medium text-khajur-primary">{filteredOrders.length}</span> of{' '}
          <span className="font-medium text-khajur-primary">{orders.length}</span> orders
        </p>

        {/* Orders Table */}
        <div className="border border-khajur-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-khajur-cream border-b border-khajur-border">
              <tr>
                {[
                  'Order ID',
                  'Customer',
                  'Items',
                  'Total',
                  'Payment',
                  'Status',
                  'Tracking ID',
                  'Actions',
                ].map((col) => (
                  <th
                    key={col}
                    className={`
                      px-5 py-3.5 text-xs font-medium text-khajur-dark/60
                      uppercase tracking-wide whitespace-nowrap
                      ${col === 'Actions' ? 'text-right' : 'text-left'}
                    `}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-khajur-border bg-white">
              {filteredOrders.length === 0 ? (
                <EmptyState />
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-khajur-cream/40 transition-colors"
                  >
                    {/* Order ID */}
                    <td className="px-5 py-4 font-mono text-khajur-primary font-medium whitespace-nowrap">
                      #{order.id.substring(0, 10)}…
                    </td>

                    {/* Customer */}
                    <td className="px-5 py-4">
                      <p className="font-medium text-khajur-dark">{order.customer_name}</p>
                      <p className="text-xs text-khajur-dark/50">{order.customer_email}</p>
                    </td>

                    {/* Items */}
                    <td className="px-5 py-4 text-khajur-dark/70 whitespace-nowrap">
                      {order.items.reduce((sum, i) => sum + i.quantity, 0)} items
                    </td>

                    {/* Total */}
                    <td className="px-5 py-4 font-semibold text-khajur-gold whitespace-nowrap">
                      ₹{order.total_amount.toFixed(2)}
                    </td>

                    {/* Payment */}
                    <td className="px-5 py-4">
                      <span
                        className={`
                          inline-block px-2 py-0.5 text-xs font-medium rounded-full
                          ${order.payment_status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-700'
                          }
                        `}
                      >
                        {order.payment_method?.toUpperCase()}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className={`
                          text-xs px-2.5 py-1 rounded-full border-0 cursor-pointer
                          focus:outline-none focus:ring-1 focus:ring-khajur-gold
                          ${getStatusStyle(order.status)}
                        `}
                        data-testid={`order-status-${order.id}`}
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </td>

                    {/* Tracking ID */}
                    <td className="px-5 py-4 text-khajur-dark/60 font-mono text-xs">
                      {order.tracking_id || '—'}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="flex items-center gap-1 text-khajur-primary hover:text-khajur-gold transition-colors text-xs font-medium"
                          data-testid={`view-order-${order.id}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                        <button
                          onClick={() => deleteOrder(order.id)}
                          disabled={deletingId === order.id}
                          className="flex items-center gap-1 text-red-500 hover:text-red-700 transition-colors text-xs font-medium disabled:opacity-40"
                        >
                          {deletingId === order.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />
                          }
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={updateOrderStatus}
        />
      )}
    </div>
  );
};

export default AdminOrders;
