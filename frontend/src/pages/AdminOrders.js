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

// ─── Constants ───────────────────────────────────────────────────────────────

const ORDER_STATUSES = [
    { value: 'delivery_fee_pending', label: 'Delivery Fee Pending', color: 'bg-amber-100 text-amber-800' },
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
    { value: 'processing', label: 'Processing', color: 'bg-purple-100 text-purple-800' },
    { value: 'shipped', label: 'Shipped', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800' },
    { value: 'exchange', label: 'Exchange', color: 'bg-orange-100 text-orange-800' },
    { value: 'return', label: 'Return', color: 'bg-pink-100 text-pink-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
];

const getStatusStyle = (status) =>
    ORDER_STATUSES.find((s) => s.value === status)?.color ?? 'bg-gray-100 text-gray-800';

// ─── Date Formatting ─────────────────────────────────────────────────────────

const formatOrderDate = (date) => {
    if (!date) return '—';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return '—';

    return parsedDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

// ─── Sub Components ──────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => (
    <span className={`
        inline-block px-2 py-1 rounded-full text-xs font-semibold capitalize
        ${getStatusStyle(status)}
    `}>
        {status}
    </span>
);

const SectionHeading = ({ icon: Icon, title }) => (
    <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5 text-khajur-gold" />
        <h3 className="font-serif text-lg font-medium text-khajur-primary">
            {title}
        </h3>
    </div>
);

const InfoGrid = ({ children }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {children}
    </div>
);

const InfoItem = ({ label, children }) => (
    <div>
        <p className="text-xs text-khajur-dark/50 uppercase tracking-wide mb-0.5">
            {label}
        </p>
        <div className="text-sm font-medium text-khajur-primary">
            {children}
        </div>
    </div>
);

// ─── Empty State ─────────────────────────────────────────────────────────────

const EmptyState = () => (
    <tr>
        <td colSpan={9}>
            <div className="flex flex-col items-center justify-center py-20 text-khajur-dark/40">
                <ShoppingBag className="w-12 h-12 mb-3" />
                <p className="text-sm">No orders found</p>
            </div>
        </td>
    </tr>
);

// ─── Order Detail Modal ──────────────────────────────────────────────────────

const OrderDetailModal = ({
    order,
    onClose,
    onStatusChange,
    onDeliveryFeeChange
}) => {
    const subtotal = Number(
        order.product_subtotal ??
        Math.max(
            0,
            Number(order.total_amount ?? 0) -
            Number(order.delivery_charges ?? 0)
        )
    );

    const delivery = Number(order.delivery_charges ?? 0);

    return (
        <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            data-testid="order-details-modal"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white w-full max-w-3xl rounded-sm shadow-2xl max-h-[92vh] flex flex-col">

                <div className="flex items-center justify-between px-8 py-5 border-b border-khajur-border flex-shrink-0">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-khajur-gold mb-0.5">
                            Order #{String(order.id).substring(0, 12)}…
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

                <div className="overflow-y-auto px-8 py-6 space-y-6 flex-1">

                    <div className="bg-khajur-cream p-5">
                        <InfoGrid>
                            <InfoItem label="Order ID">
                                <span className="font-mono text-xs">{order.id}</span>
                            </InfoItem>

                            <InfoItem label="Tracking ID">
                                {order.tracking_id || (
                                    <span className="text-khajur-dark/40 font-normal">
                                        Not assigned
                                    </span>
                                )}
                            </InfoItem>

                            <InfoItem label="Order Date">
                                {formatOrderDate(order.created_at)}
                            </InfoItem>

                            <InfoItem label="Status">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <StatusBadge status={order.status} />
                                    <select
                                        value={order.status}
                                        onChange={(e) =>
                                            onStatusChange(order.id, e.target.value)
                                        }
                                        className="text-xs border border-khajur-border px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-khajur-gold"
                                    >
                                        {ORDER_STATUSES.map((s) => (
                                            <option key={s.value} value={s.value}>
                                                {s.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </InfoItem>
                        </InfoGrid>
                    </div>

                    <div>
                        <SectionHeading icon={User} title="Customer Information" />
                        <div className="border border-khajur-border p-5 space-y-1">
                            <p className="text-sm font-medium text-khajur-dark">
                                {order.customer_name}
                            </p>
                            <p className="text-sm text-khajur-dark/60">
                                {order.customer_email}
                            </p>
                            <p className="text-sm text-khajur-dark/60">
                                {order.shipping_address?.phone}
                            </p>
                        </div>
                    </div>

                    <div>
                        <SectionHeading icon={MapPin} title="Shipping Address" />
                        <div className="border border-khajur-border p-5 space-y-1">
                            <p className="text-sm text-khajur-dark">
                                {order.shipping_address?.address}
                            </p>
                            <p className="text-sm text-khajur-dark">
                                {order.shipping_address?.city}, {order.shipping_address?.state}
                                {' — '}
                                {order.shipping_address?.pincode}
                            </p>
                        </div>
                    </div>

                    <div>
                        <SectionHeading icon={Package} title="Order Items" />
                        <div className="border border-khajur-border divide-y divide-khajur-border">
                            {(order.items || []).map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-5 gap-4"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-khajur-dark truncate">
                                            {item.product_name}
                                        </p>
                                        <p className="text-xs text-khajur-dark/50 mt-0.5">
                                            {item.size && (
                                                <span className="mr-3">
                                                    Weight: {item.size}
                                                </span>
                                            )}
                                            Qty: {item.quantity}
                                        </p>
                                    </div>
                                    <p className="text-sm font-semibold text-khajur-gold whitespace-nowrap">
                                        ₹{(
                                            Number(item.price || 0) *
                                            Number(item.quantity || 0)
                                        ).toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

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

                    {order.delivery_fee_status !== 'free' && (
                        <div className="border border-amber-200 bg-amber-50 p-5 space-y-3">
                            <p className="font-semibold text-amber-900">
                                Delivery fee: {order.delivery_fee_status || 'pending'}
                            </p>

                            <p className="text-sm text-amber-900">
                                Check the actual Rapido price. Contact the customer
                                with the final total and use the button only after
                                recording whether they agreed.
                            </p>

                            <button
                                type="button"
                                onClick={() => onDeliveryFeeChange(order)}
                                className="bg-khajur-primary text-white px-4 py-2 text-xs font-semibold uppercase tracking-wide"
                            >
                                Enter Rapido Fee / Record Customer Agreement
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const AdminOrders = () => {
    const { token } = useAuth();
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [deletingId, setDeletingId] = useState(null);

    const authHeaders = {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };

    // ─── Fetch Orders ─────────────────────────────────────────────────────────

    const fetchOrders = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);

        try {
            const { data } = await axios.get(
                `${API}/admin/orders`,
                authHeaders
            );
            setOrders(data);
        } catch {
            toast.error('Failed to load orders. Please try again.');
        } finally {
            if (!silent) setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // ─── Update Status ────────────────────────────────────────────────────────

    const updateOrderStatus = async (orderId, status) => {
        try {
            await axios.put(
                `${API}/admin/orders/${orderId}/status?status=${status}`,
                {},
                authHeaders
            );

            await fetchOrders(true);

            if (selectedOrder?.id === orderId) {
                setSelectedOrder((prev) => ({ ...prev, status }));
            }

            toast.success('Order status updated.');
        } catch {
            toast.error('Failed to update order status.');
        }
    };

    // ─── Update Delivery Fee ──────────────────────────────────────────────────

    const updateDeliveryFee = async (order) => {
        const rawFee = window.prompt(
            'Enter the actual Rapido delivery fee in rupees:',
            String(order.delivery_charges ?? '')
        );

        if (rawFee === null) return;

        const fee = Number(rawFee);

        if (!Number.isFinite(fee) || fee < 0) {
            toast.error('Enter a valid delivery fee (zero or more).');
            return;
        }

        const customerConfirmed = window.confirm(
            'Has the customer explicitly agreed to the final total including this delivery fee?\n\nChoose OK only if the customer has agreed. Choose Cancel to save the fee but keep the order pending confirmation.'
        );

        try {
            const { data } = await axios.put(
                `${API}/admin/orders/${order.id}/delivery-fee`,
                {
                    delivery_charge: fee,
                    customer_confirmed: customerConfirmed
                },
                authHeaders
            );

            await fetchOrders(true);

            const refreshed = await axios.get(
                `${API}/admin/orders`,
                authHeaders
            );

            const updated = refreshed.data.find(
                (item) => item.id === order.id
            );

            if (updated && selectedOrder?.id === order.id) {
                setSelectedOrder(updated);
            }

            toast.success(data.message);
        } catch (error) {
            toast.error(
                error.response?.data?.detail ||
                'Failed to update delivery fee.'
            );
        }
    };

    // ─── Delete Order ─────────────────────────────────────────────────────────

    const deleteOrder = async (id) => {
        if (!window.confirm(
            'Are you sure you want to delete this order? This action cannot be undone.'
        )) return;

        setDeletingId(id);

        try {
            await axios.delete(
                `${API}/admin/orders/${id}`,
                authHeaders
            );

            await fetchOrders(true);

            if (selectedOrder?.id === id) {
                setSelectedOrder(null);
            }

            toast.success('Order deleted.');
        } catch {
            toast.error('Failed to delete order.');
        } finally {
            setDeletingId(null);
        }
    };

    // ─── Filtering and Sorting ────────────────────────────────────────────────

    const filteredOrders = orders
        .filter((order) => {
            const q = searchQuery.toLowerCase();

            const matchesSearch =
                !q ||
                order.id?.toLowerCase().includes(q) ||
                order.customer_name?.toLowerCase().includes(q) ||
                order.customer_email?.toLowerCase().includes(q) ||
                order.tracking_id?.toLowerCase().includes(q);

            const matchesStatus =
                statusFilter === 'all' ||
                order.status === statusFilter;

            return matchesSearch && matchesStatus;
        })
        .sort(
            (a, b) =>
                new Date(b.created_at) - new Date(a.created_at)
        );

    // ─── Loading ──────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-khajur-dark/50">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-sm">Loading orders…</p>
            </div>
        );
    }

    // ─── Main Render ──────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen py-16 bg-white" data-testid="admin-orders-page">
            <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8">

                {/* Page Header */}
                <div className="flex items-center gap-4 mb-8">
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

                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1 min-w-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-khajur-dark/30" />
                        <input
                            type="text"
                            placeholder="Search by name, email, order ID or tracking…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 text-sm border border-khajur-border bg-white text-khajur-primary placeholder:text-khajur-dark/30 focus:outline-none focus:ring-1 focus:ring-khajur-gold"
                        />
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-khajur-dark/30" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full sm:w-auto pl-10 pr-9 py-2.5 text-sm border border-khajur-border bg-white text-khajur-primary focus:outline-none focus:ring-1 focus:ring-khajur-gold appearance-none cursor-pointer"
                        >
                            <option value="all">All Statuses</option>
                            {ORDER_STATUSES.map((s) => (
                                <option key={s.value} value={s.value}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Orders Count */}
                <p className="text-sm text-khajur-dark/50 mb-4">
                    Showing{' '}
                    <span className="font-semibold text-khajur-primary">
                        {filteredOrders.length}
                    </span>
                    {' '}of{' '}
                    <span className="font-semibold text-khajur-primary">
                        {orders.length}
                    </span>
                    {' '}orders
                </p>

                {/* Orders Table */}
                <div className="w-full border border-khajur-border rounded-sm overflow-hidden shadow-sm">

                    <table className="w-full table-fixed border-collapse text-[12px] md:text-[13px]">

                        <colgroup>
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '8%' }} />
                            <col style={{ width: '16%' }} />
                            <col style={{ width: '5%' }} />
                            <col style={{ width: '8%' }} />
                            <col style={{ width: '7%' }} />
                            <col style={{ width: '14%' }} />
                            <col style={{ width: '12%' }} />
                            <col style={{ width: '20%' }} />
                        </colgroup>

                        <thead className="bg-khajur-cream border-b border-khajur-border">
                            <tr>
                                {[
                                    'Order ID',
                                    'Date',
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
                                            px-1 py-3 text-[10px] md:text-xs
                                            font-semibold text-khajur-dark/70
                                            uppercase tracking-wide whitespace-nowrap
                                            ${col === 'Actions' ? 'text-center' : 'text-left'}
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
                                        <td className="px-1 py-3 font-mono text-khajur-primary font-medium text-[10px] md:text-xs break-all">
                                            #{String(order.id).substring(0, 10)}…
                                        </td>

                                        {/* Date */}
                                        <td className="px-1 py-3 text-khajur-dark/70 whitespace-nowrap text-[11px]">
                                            {formatOrderDate(order.created_at)}
                                        </td>

                                        {/* Customer */}
                                        <td className="px-1 py-3 min-w-0">
                                            <p className="font-semibold text-khajur-dark break-words text-xs">
                                                {order.customer_name}
                                            </p>
                                            <p className="text-[10px] text-khajur-dark/50 break-all mt-0.5">
                                                {order.customer_email}
                                            </p>
                                        </td>

                                        {/* Items */}
                                        <td className="px-1 py-3 text-khajur-dark/70 text-center">
                                            {(order.items || []).reduce(
                                                (sum, item) =>
                                                    sum + Number(item.quantity || 0),
                                                0
                                            )}
                                        </td>

                                        {/* Total */}
                                        <td className="px-1 py-3 font-semibold text-khajur-gold whitespace-nowrap text-xs">
                                            ₹{Number(order.total_amount || 0).toFixed(2)}
                                        </td>

                                        {/* Payment */}
                                        <td className="px-1 py-3">
                                            <span className={`
                                                inline-block px-1 py-1 text-[9px] md:text-[10px]
                                                font-semibold rounded-full whitespace-nowrap
                                                ${order.payment_status === 'paid'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-700'
                                                }
                                            `}>
                                                {order.payment_method?.toUpperCase() || '—'}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="px-1 py-3">
                                            <select
                                                value={order.status}
                                                onChange={(e) =>
                                                    updateOrderStatus(order.id, e.target.value)
                                                }
                                                className={`
                                                    w-full min-w-0 text-[10px]
                                                    px-1 py-1.5 rounded-full border-0
                                                    cursor-pointer
                                                    focus:outline-none focus:ring-1
                                                    focus:ring-khajur-gold
                                                    ${getStatusStyle(order.status)}
                                                `}
                                                data-testid={`order-status-${order.id}`}
                                            >
                                                {ORDER_STATUSES.map((s) => (
                                                    <option key={s.value} value={s.value}>
                                                        {s.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>

                                        {/* Tracking ID */}
                                        <td className="px-1 py-3 text-[10px] md:text-xs text-khajur-dark/60 font-mono break-all">
                                            {order.tracking_id || '—'}
                                        </td>

                                        {/* Actions: Compact spacing and padding */}
                                        <td className="px-1 py-3">
                                            <div className="flex items-center justify-center gap-1 whitespace-nowrap">

                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="inline-flex items-center gap-1 bg-khajur-primary text-white hover:bg-khajur-gold transition-colors px-2 py-1 rounded text-[11px] font-semibold"
                                                    data-testid={`view-order-${order.id}`}
                                                    title="View Order"
                                                >
                                                    <Eye className="w-3.5 h-3.5 flex-shrink-0" />
                                                    View
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => deleteOrder(order.id)}
                                                    disabled={deletingId === order.id}
                                                    className="inline-flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors px-2 py-1 rounded text-[11px] font-semibold disabled:opacity-50"
                                                    title="Delete Order"
                                                >
                                                    {deletingId === order.id
                                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                                                        : <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
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
                    onDeliveryFeeChange={updateDeliveryFee}
                />
            )}

        </div>
    );
};

export default AdminOrders;
