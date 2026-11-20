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
    ShoppingBag,
    RefreshCw,
    TruckIcon,
    Phone,
    Mail,
    Calendar,
    Hash
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ─── Order Statuses ────────────────────────────────────────────────────────────

const ORDER_STATUSES = [
    { value: 'delivery_fee_pending', label: 'Delivery Fee Pending', color: 'bg-amber-100 text-amber-800 border border-amber-200' },
    { value: 'pending',              label: 'Pending',               color: 'bg-yellow-100 text-yellow-800 border border-yellow-200' },
    { value: 'confirmed',            label: 'Confirmed',             color: 'bg-blue-100 text-blue-800 border border-blue-200' },
    { value: 'processing',           label: 'Processing',            color: 'bg-purple-100 text-purple-800 border border-purple-200' },
    { value: 'shipped',              label: 'Shipped',               color: 'bg-indigo-100 text-indigo-800 border border-indigo-200' },
    { value: 'delivered',            label: 'Delivered',             color: 'bg-green-100 text-green-800 border border-green-200' },
    { value: 'exchange',             label: 'Exchange',              color: 'bg-orange-100 text-orange-800 border border-orange-200' },
    { value: 'return',               label: 'Return',                color: 'bg-pink-100 text-pink-800 border border-pink-200' },
    { value: 'cancelled',            label: 'Cancelled',             color: 'bg-red-100 text-red-800 border border-red-200' },
];

const getStatusInfo = (status) =>
    ORDER_STATUSES.find((s) => s.value === status) ?? { label: status, color: 'bg-gray-100 text-gray-700 border border-gray-200' };

// ─── Date Formatting: DD/MM/YYYY ───────────────────────────────────────────────

const formatOrderDate = (date) => {
    if (!date) return '—';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// ─── Status Badge ──────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
    const info = getStatusInfo(status);
    return (
        <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${info.color}`}
            style={{ borderRadius: '999px' }}
        >
            {info.label}
        </span>
    );
};

// ─── Info Grid Helpers ─────────────────────────────────────────────────────────

const SectionHeading = ({ icon: Icon, title }) => (
    <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5 text-khajur-gold flex-shrink-0" />
        <h3 className="font-serif text-lg font-medium text-khajur-primary">{title}</h3>
    </div>
);

const InfoItem = ({ label, children }) => (
    <div>
        <p className="text-xs text-khajur-dark/50 uppercase tracking-wide mb-0.5">{label}</p>
        <div className="text-sm font-medium text-khajur-primary">{children}</div>
    </div>
);

// ─── Empty State ───────────────────────────────────────────────────────────────

const EmptyOrders = () => (
    <div
        className="border border-khajur-border bg-white py-16 text-center shadow-sm"
        style={{ borderRadius: '16px' }}
    >
        <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-khajur-dark/30" />
        <p className="text-sm font-medium text-khajur-dark/50">No orders found</p>
        <p className="text-xs text-khajur-dark/30 mt-1">Try adjusting your search or filter</p>
    </div>
);

// ─── Order Detail Modal ─────────────────────────────────────────────────────────

const OrderDetailModal = ({ order, onClose, onStatusChange, onDeliveryFeeChange }) => {
    const subtotal = Number(
        order.product_subtotal ??
        Math.max(0, Number(order.total_amount ?? 0) - Number(order.delivery_charges ?? 0))
    );
    const delivery = Number(order.delivery_charges ?? 0);

    return (
        <div
            className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
            data-testid="order-details-modal"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            {/* Sheet on mobile, centered card on desktop */}
            <div
                className="bg-white w-full sm:max-w-3xl shadow-2xl max-h-[94vh] sm:max-h-[90vh] flex flex-col overflow-hidden"
                style={{ borderRadius: '20px 20px 0 0' }}
            >
                {/* Drag handle — mobile only */}
                <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
                    <div className="w-10 h-1 bg-gray-200 rounded-full" />
                </div>

                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 sm:px-8 py-4 border-b border-khajur-border flex-shrink-0">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-khajur-gold mb-0.5 font-medium">
                            Order #{order.id.substring(0, 12)}…
                        </p>
                        <h2 className="font-serif text-xl sm:text-2xl font-medium text-khajur-primary">
                            Order Details
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-khajur-dark/40 hover:text-khajur-primary transition-colors p-2 hover:bg-khajur-cream rounded-full"
                        aria-label="Close modal"
                        style={{ borderRadius: '999px' }}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="overflow-y-auto px-5 sm:px-8 py-5 space-y-5 flex-1">

                    {/* Order Info Card */}
                    <div className="bg-khajur-cream p-4 sm:p-5 space-y-4" style={{ borderRadius: '12px' }}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InfoItem label="Order ID">
                                <span className="font-mono text-xs break-all">{order.id}</span>
                            </InfoItem>
                            <InfoItem label="Tracking ID">
                                {order.tracking_id
                                    ? <span className="font-mono text-xs">{order.tracking_id}</span>
                                    : <span className="text-khajur-dark/40 font-normal text-sm">Not assigned</span>
                                }
                            </InfoItem>
                            <InfoItem label="Order Date">
                                {formatOrderDate(order.created_at)}
                            </InfoItem>
                            <InfoItem label="Current Status">
                                <div className="flex items-center gap-2 flex-wrap mt-1">
                                    <StatusBadge status={order.status} />
                                </div>
                            </InfoItem>
                        </div>

                        {/* Status Selector */}
                        <div>
                            <label className="block text-xs text-khajur-dark/50 uppercase tracking-wide mb-1.5 font-medium">
                                Update Status
                            </label>
                            <select
                                value={order.status}
                                onChange={(e) => onStatusChange(order.id, e.target.value)}
                                className="w-full text-sm border border-khajur-border px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-khajur-gold text-khajur-primary cursor-pointer"
                                style={{ borderRadius: '10px' }}
                            >
                                {ORDER_STATUSES.map((s) => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Customer Information */}
                    <div>
                        <SectionHeading icon={User} title="Customer Information" />
                        <div className="border border-khajur-border p-4 space-y-2" style={{ borderRadius: '12px' }}>
                            <p className="text-sm font-semibold text-khajur-dark">{order.customer_name}</p>
                            {order.customer_email && (
                                <div className="flex items-center gap-2 text-sm text-khajur-dark/60">
                                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span className="break-all">{order.customer_email}</span>
                                </div>
                            )}
                            {order.shipping_address?.phone && (
                                <div className="flex items-center gap-2 text-sm text-khajur-dark/60">
                                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span>{order.shipping_address.phone}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div>
                        <SectionHeading icon={MapPin} title="Shipping Address" />
                        <div className="border border-khajur-border p-4 space-y-1" style={{ borderRadius: '12px' }}>
                            <p className="text-sm text-khajur-dark">{order.shipping_address?.address}</p>
                            <p className="text-sm text-khajur-dark/70">
                                {order.shipping_address?.city}, {order.shipping_address?.state}{' — '}
                                {order.shipping_address?.pincode}
                            </p>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div>
                        <SectionHeading icon={Package} title="Order Items" />
                        <div className="border border-khajur-border divide-y divide-khajur-border overflow-hidden" style={{ borderRadius: '12px' }}>
                            {(order.items || []).map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-4 gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-khajur-dark">{item.product_name}</p>
                                        <p className="text-xs text-khajur-dark/50 mt-0.5">
                                            {item.size && <span className="mr-3">Weight: {item.size}</span>}
                                            Qty: {item.quantity}
                                        </p>
                                    </div>
                                    <p className="text-sm font-bold text-khajur-gold whitespace-nowrap">
                                        ₹{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-khajur-cream p-4 space-y-2" style={{ borderRadius: '12px' }}>
                        <div className="flex justify-between text-sm">
                            <span className="text-khajur-dark/70">Subtotal</span>
                            <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-khajur-dark/70">Delivery Charges</span>
                            <span className="font-medium">₹{delivery.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-khajur-border pt-3 flex justify-between items-center">
                            <span className="font-serif text-base font-medium text-khajur-primary">Total</span>
                            <span className="font-serif text-xl font-bold text-khajur-gold">
                                ₹{(subtotal + delivery).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Delivery Fee Management */}
                    {order.delivery_fee_status !== 'free' && (
                        <div className="border border-amber-200 bg-amber-50 p-4 space-y-3" style={{ borderRadius: '12px' }}>
                            <p className="font-semibold text-amber-900 flex items-center gap-2">
                                <TruckIcon className="w-4 h-4" />
                                Delivery fee: {order.delivery_fee_status || 'pending'}
                            </p>
                            <p className="text-sm text-amber-800">
                                Check the actual Rapido price. Contact the customer with the final total and
                                use the button only after recording whether they agreed.
                            </p>
                            <button
                                type="button"
                                onClick={() => onDeliveryFeeChange(order)}
                                className="w-full sm:w-auto bg-khajur-primary text-white px-4 py-2.5 text-sm font-semibold tracking-wide hover:bg-khajur-primary/90 transition-colors"
                                style={{ borderRadius: '10px' }}
                            >
                                Enter Rapido Fee / Record Agreement
                            </button>
                        </div>
                    )}

                    {/* Bottom padding for mobile safe area */}
                    <div className="h-4 sm:h-0" />
                </div>
            </div>
        </div>
    );
};

// ─── Mobile Order Card ─────────────────────────────────────────────────────────

const MobileOrderCard = ({ order, onView, onDelete, onStatusChange, deletingId }) => {
    const totalItems = (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const info = getStatusInfo(order.status);

    return (
        <div
            className="border border-khajur-border bg-white shadow-sm space-y-0 overflow-hidden transition-all"
            style={{ borderRadius: '16px' }}
            data-testid={`mobile-order-card-${order.id}`}
        >
            {/* Card Top: Status stripe */}
            <div className={`h-1 w-full ${info.color.includes('green') ? 'bg-green-400' : info.color.includes('blue') ? 'bg-blue-400' : info.color.includes('amber') ? 'bg-amber-400' : info.color.includes('yellow') ? 'bg-yellow-400' : info.color.includes('purple') ? 'bg-purple-400' : info.color.includes('indigo') ? 'bg-indigo-400' : info.color.includes('red') ? 'bg-red-400' : info.color.includes('pink') ? 'bg-pink-400' : 'bg-gray-300'}`} />

            <div className="p-4 space-y-3.5">
                {/* Row 1: Order ID + Date */}
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <Hash className="w-3 h-3 text-khajur-gold flex-shrink-0" />
                            <p className="text-[10px] uppercase tracking-wider font-bold text-khajur-gold">Order ID</p>
                        </div>
                        <p className="font-mono text-xs font-bold text-khajur-primary truncate">
                            {order.id.substring(0, 16)}…
                        </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1 justify-end mb-0.5">
                            <Calendar className="w-3 h-3 text-khajur-dark/40" />
                            <p className="text-[10px] uppercase tracking-wider text-khajur-dark/40">Date</p>
                        </div>
                        <p className="text-xs font-semibold text-khajur-dark/80">
                            {formatOrderDate(order.created_at)}
                        </p>
                    </div>
                </div>

                {/* Row 2: Customer */}
                <div className="flex items-center gap-3 p-3 bg-khajur-cream/70 rounded-xl" style={{ borderRadius: '12px' }}>
                    <div className="w-9 h-9 bg-khajur-primary/10 rounded-full flex items-center justify-center flex-shrink-0" style={{ borderRadius: '999px' }}>
                        <User className="w-4 h-4 text-khajur-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-khajur-dark leading-tight truncate">
                            {order.customer_name || 'Guest Customer'}
                        </p>
                        {order.customer_email && (
                            <p className="text-xs text-khajur-dark/55 truncate">{order.customer_email}</p>
                        )}
                        {order.shipping_address?.phone && (
                            <p className="text-xs text-khajur-dark/55">{order.shipping_address.phone}</p>
                        )}
                    </div>
                </div>

                {/* Row 3: Details grid: Items, Total, Payment, Tracking */}
                <div className="grid grid-cols-2 gap-2">
                    {/* Items */}
                    <div className="bg-gray-50 border border-gray-100 p-2.5" style={{ borderRadius: '10px' }}>
                        <p className="text-[9px] uppercase tracking-wider text-khajur-dark/40 font-semibold mb-1">Items</p>
                        <p className="text-sm font-bold text-khajur-dark">
                            {totalItems} <span className="text-xs font-normal text-khajur-dark/60">{totalItems === 1 ? 'item' : 'items'}</span>
                        </p>
                    </div>

                    {/* Total */}
                    <div className="bg-khajur-gold/5 border border-khajur-gold/20 p-2.5" style={{ borderRadius: '10px' }}>
                        <p className="text-[9px] uppercase tracking-wider text-khajur-gold/70 font-semibold mb-1">Total</p>
                        <p className="text-sm font-bold text-khajur-gold">
                            ₹{Number(order.total_amount || 0).toFixed(2)}
                        </p>
                    </div>

                    {/* Payment */}
                    <div className="bg-gray-50 border border-gray-100 p-2.5" style={{ borderRadius: '10px' }}>
                        <p className="text-[9px] uppercase tracking-wider text-khajur-dark/40 font-semibold mb-1">Payment</p>
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`} style={{ borderRadius: '999px' }}>
                            {order.payment_method || '—'}
                        </span>
                    </div>

                    {/* Tracking ID */}
                    <div className="bg-gray-50 border border-gray-100 p-2.5" style={{ borderRadius: '10px' }}>
                        <p className="text-[9px] uppercase tracking-wider text-khajur-dark/40 font-semibold mb-1">Tracking ID</p>
                        <p className="text-xs font-mono text-khajur-dark/70 truncate">
                            {order.tracking_id || '—'}
                        </p>
                    </div>
                </div>

                {/* Row 4: Status Dropdown */}
                <div>
                    <label
                        htmlFor={`mobile-status-${order.id}`}
                        className="block text-[10px] uppercase tracking-wider font-bold text-khajur-dark/50 mb-1.5"
                    >
                        Update Status
                    </label>
                    <select
                        id={`mobile-status-${order.id}`}
                        value={order.status}
                        onChange={(e) => onStatusChange(order.id, e.target.value)}
                        className={`
                            w-full text-xs px-3 py-2.5 border border-khajur-border cursor-pointer
                            focus:outline-none focus:ring-2 focus:ring-khajur-gold font-bold shadow-sm
                            ${getStatusInfo(order.status).color}
                        `}
                        style={{ borderRadius: '10px' }}
                        data-testid={`mobile-order-status-${order.id}`}
                    >
                        {ORDER_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                </div>

                {/* Row 5: Actions */}
                <div className="flex items-center gap-2.5 pt-1 border-t border-khajur-border/50">
                    <button
                        onClick={() => onView(order)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-khajur-primary text-white text-xs font-bold tracking-wide hover:bg-khajur-primary/90 transition-colors shadow-sm"
                        style={{ borderRadius: '10px' }}
                        data-testid={`mobile-view-order-${order.id}`}
                    >
                        <Eye className="w-4 h-4" />
                        View Details
                    </button>

                    <button
                        onClick={() => onDelete(order.id)}
                        disabled={deletingId === order.id}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-red-50 text-red-600 border border-red-200 text-xs font-bold hover:bg-red-100 transition-colors disabled:opacity-40"
                        style={{ borderRadius: '10px' }}
                        data-testid={`mobile-delete-order-${order.id}`}
                    >
                        {deletingId === order.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Trash2 className="w-4 h-4" />
                        }
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main Admin Orders Component ───────────────────────────────────────────────

const AdminOrders = () => {
    const { token } = useAuth();
    const navigate = useNavigate();

    const [orders, setOrders]               = useState([]);
    const [loading, setLoading]             = useState(true);
    const [refreshing, setRefreshing]       = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [searchQuery, setSearchQuery]     = useState('');
    const [statusFilter, setStatusFilter]   = useState('all');
    const [deletingId, setDeletingId]       = useState(null);

    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // ─── Fetch Orders ──────────────────────────────────────────────────────────

    const fetchOrders = useCallback(async (silent = false) => {
        if (silent) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const { data } = await axios.get(`${API}/admin/orders`, authHeaders);
            setOrders(data);
        } catch {
            toast.error('Failed to load orders. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    // ─── Update Order Status ───────────────────────────────────────────────────

    const updateOrderStatus = async (orderId, status) => {
        try {
            await axios.put(`${API}/admin/orders/${orderId}/status?status=${status}`, {}, authHeaders);
            await fetchOrders(true);
            if (selectedOrder?.id === orderId) setSelectedOrder((prev) => ({ ...prev, status }));
            toast.success('Order status updated.');
        } catch {
            toast.error('Failed to update order status.');
        }
    };

    // ─── Update Delivery Fee ───────────────────────────────────────────────────

    const updateDeliveryFee = async (order) => {
        const rawFee = window.prompt('Enter the actual Rapido delivery fee in rupees:', String(order.delivery_charges ?? ''));
        if (rawFee === null) return;

        const fee = Number(rawFee);
        if (!Number.isFinite(fee) || fee < 0) {
            toast.error('Enter a valid delivery fee (zero or more).');
            return;
        }

        const customerConfirmed = window.confirm(
            'Has the customer explicitly agreed to the final total including this delivery fee?\n\nChoose OK only if the customer has agreed.'
        );

        try {
            const { data } = await axios.put(
                `${API}/admin/orders/${order.id}/delivery-fee`,
                { delivery_charge: fee, customer_confirmed: customerConfirmed },
                authHeaders
            );

            await fetchOrders(true);

            const refreshed = await axios.get(`${API}/admin/orders`, authHeaders);
            const updated   = refreshed.data.find((item) => item.id === order.id);
            if (updated && selectedOrder?.id === order.id) setSelectedOrder(updated);

            toast.success(data.message);
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to update delivery fee.');
        }
    };

    // ─── Delete Order ──────────────────────────────────────────────────────────

    const deleteOrder = async (id) => {
        if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) return;

        setDeletingId(id);

        try {
            await axios.delete(`${API}/admin/orders/${id}`, authHeaders);
            await fetchOrders(true);
            if (selectedOrder?.id === id) setSelectedOrder(null);
            toast.success('Order deleted.');
        } catch {
            toast.error('Failed to delete order.');
        } finally {
            setDeletingId(null);
        }
    };

    // ─── Filter + Sort ─────────────────────────────────────────────────────────

    const filteredOrders = orders
        .filter((order) => {
            const q            = searchQuery.toLowerCase();
            const matchesSearch =
                !q ||
                order.id?.toLowerCase().includes(q) ||
                order.customer_name?.toLowerCase().includes(q) ||
                order.customer_email?.toLowerCase().includes(q) ||
                order.tracking_id?.toLowerCase().includes(q);
            const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // ─── Loading Screen ────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-khajur-dark/50 bg-white">
                <Loader2 className="w-9 h-9 animate-spin text-khajur-primary" />
                <p className="text-sm font-medium">Loading orders…</p>
            </div>
        );
    }

    // ─── Main Render ───────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen py-20 bg-white" data-testid="admin-orders-page">
            <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">

                {/* ── Page Header ── */}
                <div className="flex items-start gap-3 mb-8">

                    {/* Back Button */}
                    <button
                        onClick={() => navigate('/admin/dashboard')}
                        className="mt-1.5 flex items-center justify-center w-9 h-9 rounded-full border border-khajur-border text-khajur-primary hover:text-khajur-gold hover:border-khajur-gold transition-colors flex-shrink-0"
                        style={{ borderRadius: '999px' }}
                        aria-label="Back to dashboard"
                        data-testid="back-to-dashboard"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500 flex-shrink-0" style={{ borderRadius: '999px' }} />
                            <p className="text-xs uppercase tracking-widest text-khajur-gold font-semibold">
                                KhajurKart Administrator
                            </p>
                        </div>
                        <h1 className="font-serif text-3xl md:text-4xl font-medium text-khajur-primary leading-tight">
                            Manage Orders
                        </h1>
                    </div>

                    {/* Refresh Button + Count Badge */}
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <button
                            onClick={() => fetchOrders(true)}
                            disabled={refreshing}
                            className="flex items-center gap-1.5 px-3 py-2 border border-khajur-border rounded-full text-xs font-semibold text-khajur-primary hover:bg-khajur-cream transition-colors disabled:opacity-50"
                            style={{ borderRadius: '999px' }}
                            aria-label="Refresh orders"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-khajur-primary/10 text-khajur-primary text-xs font-bold rounded-full" style={{ borderRadius: '999px' }}>
                            <ShoppingBag className="w-3 h-3" />
                            {orders.length}
                        </span>
                    </div>
                </div>

                {/* ── Search + Filter Bar ── */}
                <div className="flex flex-col sm:flex-row gap-3 mb-5">

                    {/* Search */}
                    <div className="relative flex-1 min-w-0">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-khajur-dark/30 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search by name, email, order ID or tracking…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 text-sm border border-khajur-border bg-white text-khajur-primary placeholder:text-khajur-dark/30 focus:outline-none focus:ring-2 focus:ring-khajur-gold shadow-sm"
                            style={{ borderRadius: '12px' }}
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative w-full sm:w-56">
                        <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-khajur-dark/30 pointer-events-none" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 text-sm border border-khajur-border bg-white text-khajur-primary focus:outline-none focus:ring-2 focus:ring-khajur-gold appearance-none cursor-pointer shadow-sm"
                            style={{ borderRadius: '12px' }}
                        >
                            <option value="all">All Statuses</option>
                            {ORDER_STATUSES.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* ── Results Count ── */}
                <p className="text-sm text-khajur-dark/50 mb-5">
                    Showing{' '}
                    <span className="font-bold text-khajur-primary">{filteredOrders.length}</span>
                    {' '}of{' '}
                    <span className="font-bold text-khajur-primary">{orders.length}</span>
                    {' '}orders
                </p>

                {/* ══════════════════════════════════════════════════════════════
                    MOBILE: Order Cards  (< md)
                ══════════════════════════════════════════════════════════════ */}
                <div className="md:hidden space-y-4">
                    {filteredOrders.length === 0 ? (
                        <EmptyOrders />
                    ) : (
                        filteredOrders.map((order) => (
                            <MobileOrderCard
                                key={order.id}
                                order={order}
                                onView={setSelectedOrder}
                                onDelete={deleteOrder}
                                onStatusChange={updateOrderStatus}
                                deletingId={deletingId}
                            />
                        ))
                    )}
                </div>

                {/* ══════════════════════════════════════════════════════════════
                    DESKTOP: Orders Table  (≥ md)
                ══════════════════════════════════════════════════════════════ */}
                <div
                    className="hidden md:block border border-khajur-border w-full overflow-hidden shadow-sm"
                    style={{ borderRadius: '16px' }}
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs whitespace-nowrap">

                            {/* Column Widths */}
                            <colgroup>
                                <col style={{ width: '13%' }} />
                                <col style={{ width: '10%' }} />
                                <col style={{ width: '20%' }} />
                                <col style={{ width: '7%' }}  />
                                <col style={{ width: '10%' }} />
                                <col style={{ width: '9%' }}  />
                                <col style={{ width: '13%' }} />
                                <col style={{ width: '9%' }}  />
                                <col style={{ width: '9%' }}  />
                            </colgroup>

                            {/* Table Header */}
                            <thead className="bg-khajur-cream border-b border-khajur-border">
                                <tr>
                                    {['Order ID', 'Date', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Tracking ID', 'Actions'].map((col) => (
                                        <th
                                            key={col}
                                            className={`px-4 py-3.5 text-xs font-bold text-khajur-dark/60 uppercase tracking-wider ${col === 'Actions' ? 'text-center' : 'text-left'}`}
                                        >
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            {/* Table Body */}
                            <tbody className="divide-y divide-khajur-border bg-white">
                                {filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-20 text-center">
                                            <div className="flex flex-col items-center justify-center text-khajur-dark/40">
                                                <ShoppingBag className="w-12 h-12 mb-3" />
                                                <p className="text-sm font-medium">No orders found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <tr
                                            key={order.id}
                                            className="hover:bg-khajur-cream/40 transition-colors align-middle"
                                        >
                                            {/* Order ID */}
                                            <td className="px-4 py-3.5 font-mono text-khajur-primary font-semibold">
                                                #{order.id.substring(0, 10)}…
                                            </td>

                                            {/* Date */}
                                            <td className="px-4 py-3.5 text-khajur-dark/70">
                                                {formatOrderDate(order.created_at)}
                                            </td>

                                            {/* Customer */}
                                            <td className="px-4 py-3.5 whitespace-normal">
                                                <p className="font-semibold text-khajur-dark leading-tight">{order.customer_name}</p>
                                                <p className="text-[11px] text-khajur-dark/50 mt-0.5 truncate max-w-[180px]">{order.customer_email}</p>
                                            </td>

                                            {/* Items */}
                                            <td className="px-4 py-3.5 text-khajur-dark/80 font-semibold">
                                                {(order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)}
                                            </td>

                                            {/* Total */}
                                            <td className="px-4 py-3.5 font-bold text-khajur-gold">
                                                ₹{Number(order.total_amount || 0).toFixed(2)}
                                            </td>

                                            {/* Payment */}
                                            <td className="px-4 py-3.5">
                                                <span
                                                    className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}
                                                    style={{ borderRadius: '999px' }}
                                                >
                                                    {order.payment_method || '—'}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-3.5">
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                                    className={`text-xs px-2.5 py-1.5 border border-khajur-border cursor-pointer focus:outline-none focus:ring-1 focus:ring-khajur-gold font-semibold shadow-sm w-full ${getStatusInfo(order.status).color}`}
                                                    style={{ borderRadius: '8px' }}
                                                    data-testid={`order-status-${order.id}`}
                                                >
                                                    {ORDER_STATUSES.map((s) => (
                                                        <option key={s.value} value={s.value}>{s.label}</option>
                                                    ))}
                                                </select>
                                            </td>

                                            {/* Tracking ID */}
                                            <td className="px-4 py-3.5 text-khajur-dark/60 font-mono text-[11px]" title={order.tracking_id || undefined}>
                                                {order.tracking_id
                                                    ? <span className="block max-w-[80px] truncate">{order.tracking_id}</span>
                                                    : '—'
                                                }
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3.5 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => setSelectedOrder(order)}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 bg-khajur-primary/5 border border-khajur-primary/20 text-khajur-primary hover:bg-khajur-primary hover:text-white transition-colors font-semibold"
                                                        style={{ borderRadius: '8px' }}
                                                        title="View Order"
                                                        data-testid={`view-order-${order.id}`}
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => deleteOrder(order.id)}
                                                        disabled={deletingId === order.id}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 border border-red-100 text-red-500 hover:bg-red-500 hover:text-white transition-colors font-semibold disabled:opacity-40"
                                                        style={{ borderRadius: '8px' }}
                                                        title="Delete Order"
                                                    >
                                                        {deletingId === order.id
                                                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            : <Trash2 className="w-3.5 h-3.5" />
                                                        }
                                                        Del
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

            </div>

            {/* ── Order Detail Modal ── */}
            {selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onStatusChange={updateOrderStatus}
                    onDeliveryFeeChange={updateDeliveryFee}
                />
            )}

        </div>
    );
};

export default AdminOrders;
