import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
    Package,
    ChevronRight,
    ChevronLeft,
    Loader2,
    Trash2,
    ShoppingBag,
    Clock,
    CreditCard,
    Hash,
    AlertTriangle,
    X,
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ─── Constants ─────────────────────────────────────────────────────────────────

const ORDER_STATUSES = {
    pending:    { color: 'bg-yellow-50 text-yellow-700 border-yellow-200',  label: 'Pending'    },
    confirmed:  { color: 'bg-blue-50 text-blue-700 border-blue-200',        label: 'Confirmed'  },
    processing: { color: 'bg-purple-50 text-purple-700 border-purple-200',  label: 'Processing' },
    shipped:    { color: 'bg-indigo-50 text-indigo-700 border-indigo-200',  label: 'Shipped'    },
    delivered:  { color: 'bg-green-50 text-green-700 border-green-200',     label: 'Delivered'  },
    exchange:   { color: 'bg-orange-50 text-orange-700 border-orange-200',  label: 'Exchange'   },
    return:     { color: 'bg-pink-50 text-pink-700 border-pink-200',        label: 'Return'     },
    cancelled:  { color: 'bg-red-50 text-red-700 border-red-200',           label: 'Cancelled'  },
};

// Orders that have already been fulfilled — block deletion
const NON_DELETABLE_STATUSES = ['shipped', 'delivered'];

const getStatusStyle = (status) =>
    ORDER_STATUSES[status]?.color ?? 'bg-gray-100 text-gray-600 border-gray-200';

const getStatusLabel = (status) =>
    ORDER_STATUSES[status]?.label ?? status;

// ─── Confirm Dialog ────────────────────────────────────────────────────────────

const ConfirmDialog = ({ order, onConfirm, onCancel, loading }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        {/* Backdrop */}
        <div
            className="absolute inset-0 bg-khajur-primary/60 backdrop-blur-sm"
            onClick={onCancel}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-sm shadow-2xl max-w-md w-full p-8 z-10">
            {/* Close */}
            <button
                onClick={onCancel}
                className="absolute top-4 right-4 text-khajur-dark/30 hover:text-khajur-primary transition-colors"
            >
                <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="w-12 h-12 bg-red-50 rounded-sm flex items-center justify-center mb-5">
                <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>

            <h3 className="font-serif text-xl font-semibold text-khajur-primary mb-2">
                Delete Order?
            </h3>
            <p className="text-sm text-khajur-dark/60 mb-1">
                Order{' '}
                <span className="font-mono font-semibold text-khajur-primary">
                    #{order?.id?.substring(0, 14)}…
                </span>
            </p>
            <p className="text-sm text-khajur-dark/50 mb-8">
                This will permanently remove the order from your history.
                This action <span className="font-semibold text-red-500">cannot be undone</span>.
            </p>

            <div className="flex gap-3">
                <button
                    onClick={onConfirm}
                    disabled={loading}
                    className="
                        flex-1 flex items-center justify-center gap-2
                        bg-red-500 hover:bg-red-600 text-white
                        px-6 py-3 rounded-sm font-bold text-xs uppercase tracking-widest
                        transition-all duration-200
                        disabled:opacity-50 disabled:cursor-not-allowed
                    "
                >
                    {loading
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting…</>
                        : <><Trash2 className="w-3.5 h-3.5" /> Yes, Delete</>
                    }
                </button>
                <button
                    onClick={onCancel}
                    disabled={loading}
                    className="
                        flex-1 px-6 py-3 rounded-sm font-bold text-xs uppercase tracking-widest
                        border border-khajur-border text-khajur-dark/60
                        hover:border-khajur-primary hover:text-khajur-primary
                        transition-all duration-200
                        disabled:opacity-50
                    "
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
);

// ─── Sub-Components ────────────────────────────────────────────────────────────

const LoadingScreen = () => (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3 text-khajur-dark/50">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-sm">Loading your orders…</p>
    </div>
);

const NotLoggedIn = () => (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="w-16 h-16 flex items-center justify-center bg-khajur-cream rounded-full">
            <Package className="w-7 h-7 text-khajur-dark/30" />
        </div>
        <div>
            <p className="font-serif text-2xl font-medium text-khajur-primary mb-2">
                You're not logged in
            </p>
            <p className="text-sm text-khajur-dark/50">
                Please sign in to view your order history.
            </p>
        </div>
        <Link
            to="/"
            className="
                bg-khajur-gold hover:bg-khajur-gold/90
                hover:shadow-[0_0_20px_rgba(198,169,98,0.35)]
                text-khajur-primary px-8 py-3 rounded-sm
                uppercase tracking-widest text-xs font-bold transition-all duration-300
            "
        >
            Go to Home
        </Link>
    </div>
);

const EmptyState = () => (
    <div className="bg-white border border-khajur-border rounded-sm p-16 flex flex-col items-center text-center gap-6">
        <div className="w-16 h-16 flex items-center justify-center bg-khajur-cream rounded-full">
            <ShoppingBag className="w-7 h-7 text-khajur-dark/30" />
        </div>
        <div>
            <p className="font-serif text-2xl font-medium text-khajur-primary mb-2">
                No orders yet
            </p>
            <p className="text-sm text-khajur-dark/50 max-w-xs">
                You haven't placed any orders. Start exploring our premium collection.
            </p>
        </div>
        <Link
            to="/products"
            className="
                flex items-center gap-2 bg-khajur-gold hover:bg-khajur-gold/90
                hover:shadow-[0_0_20px_rgba(198,169,98,0.35)]
                text-khajur-primary px-8 py-3 rounded-sm
                uppercase tracking-widest text-xs font-bold transition-all duration-300
            "
        >
            <ShoppingBag className="w-4 h-4" />
            Start Shopping
        </Link>
    </div>
);

const StatusBadge = ({ status }) => (
    <span className={`
        inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider
        border rounded-full ${getStatusStyle(status)}
    `}>
        {getStatusLabel(status)}
    </span>
);

const OrderItemRow = ({ item }) => (
    <div className="flex items-center justify-between gap-4 py-3">
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-khajur-dark truncate">
                {item.product_name}
            </p>
            <p className="text-xs text-khajur-dark/50 mt-0.5">
                {item.size ? `Weight: ${item.size} · ` : ''}
                Qty: {item.quantity}
            </p>
        </div>
        <p className="text-sm font-semibold text-khajur-gold whitespace-nowrap">
            ₹{(item.price * item.quantity).toFixed(2)}
        </p>
    </div>
);

// ── Order Card ─────────────────────────────────────────────────────────────────

const OrderCard = ({ order, onDeleteClick, deletingId }) => {
    const totalQty = order.items.reduce((sum, i) => sum + i.quantity, 0);
    const isDeleting = deletingId === order.id;
    const canDelete = !NON_DELETABLE_STATUSES.includes(order.status);

    return (
        <div
            className="
                bg-white border border-khajur-border
                hover:border-khajur-gold/40
                hover:shadow-[0_4px_24px_rgba(198,169,98,0.10)]
                rounded-sm transition-all duration-300
            "
            data-testid={`order-${order.id}`}
        >
            {/* ── Card Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 px-8 py-6 border-b border-khajur-border">
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                        <p className="font-mono text-sm font-semibold text-khajur-primary">
                            #{order.id.substring(0, 14)}…
                        </p>
                        <StatusBadge status={order.status} />
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-khajur-dark/50">
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(order.created_at).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'long', year: 'numeric',
                            })}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5" />
                            {order.payment_method?.toUpperCase()}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5" />
                            {totalQty} item{totalQty > 1 ? 's' : ''}
                        </span>
                        {order.tracking_id && (
                            <span className="flex items-center gap-1.5">
                                <Hash className="w-3.5 h-3.5" />
                                {order.tracking_id}
                            </span>
                        )}
                    </div>
                </div>

                {/* Total */}
                <div className="sm:text-right flex-shrink-0">
                    <p className="text-xs uppercase tracking-widest text-khajur-dark/40 mb-1">
                        Total
                    </p>
                    <p className="font-serif text-2xl font-bold text-khajur-gold">
                        ₹{order.total_amount.toFixed(2)}
                    </p>
                </div>
            </div>

            {/* ── Order Items ── */}
            <div className="px-8 py-4 divide-y divide-khajur-border">
                {order.items.map((item, index) => (
                    <OrderItemRow key={index} item={item} />
                ))}
            </div>

            {/* ── Card Footer ── */}
            <div className="flex items-center justify-between px-8 py-5 border-t border-khajur-border bg-khajur-cream/40">

                {/* Delete button — hidden for shipped/delivered */}
                {canDelete ? (
                    <button
                        onClick={() => onDeleteClick(order)}
                        disabled={isDeleting}
                        className="
                            flex items-center gap-1.5
                            text-red-400 hover:text-red-600
                            text-xs font-medium transition-colors
                            disabled:opacity-40 disabled:cursor-not-allowed
                        "
                        data-testid={`delete-order-${order.id}`}
                    >
                        {isDeleting
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />
                        }
                        {isDeleting ? 'Deleting…' : 'Delete Order'}
                    </button>
                ) : (
                    /* Placeholder to keep footer layout intact */
                    <span className="text-xs text-khajur-dark/30 italic">
                        Cannot delete {getStatusLabel(order.status).toLowerCase()} orders
                    </span>
                )}

                {/* View Details */}
                <Link
                    to={`/order/${order.id}`}
                    className="
                        flex items-center gap-1.5
                        text-khajur-primary hover:text-khajur-gold
                        text-xs font-semibold uppercase tracking-wider
                        transition-colors
                    "
                >
                    View Details
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const MyOrders = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    // ── Confirm dialog state ───────────────────────────────────────────────────
    const [confirmOrder, setConfirmOrder] = useState(null); // order object | null

    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        document.title = 'My Orders — KhajurKart';
        return () => {
            document.title = 'KhajurKart — Premium Dates, Dry Fruits & Spices';
        };
    }, []);

    // ── Fetch Orders ───────────────────────────────────────────────────────────

    const fetchOrders = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API}/orders`, authHeaders);
            setOrders(Array.isArray(data) ? data : []);
        } catch {
            toast.error('Failed to load orders. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (user) fetchOrders();
    }, [user, fetchOrders]);

    // ── Delete Order ───────────────────────────────────────────────────────────

    const handleDeleteClick = (order) => {
        setConfirmOrder(order);
    };

    const handleDeleteConfirm = async () => {
        if (!confirmOrder) return;
        const id = confirmOrder.id;
        setDeletingId(id);

        try {
            // ✅ Use the user-specific delete endpoint with auth header
            await axios.delete(
                `${API}/orders/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            toast.success('Order deleted successfully.');
            setConfirmOrder(null);
            // Remove from local state immediately — no need to re-fetch
            setOrders((prev) => prev.filter((o) => o.id !== id));
        } catch (err) {
            const status = err.response?.status;
            const detail = err.response?.data?.detail;

            if (status === 403) {
                toast.error('You are not allowed to delete this order. Please contact support.');
            } else if (status === 404) {
                toast.error('Order not found. It may have already been deleted.');
                setOrders((prev) => prev.filter((o) => o.id !== id));
            } else {
                toast.error(detail || 'Failed to delete order. Please try again.');
            }
        } finally {
            setDeletingId(null);
        }
    };

    const handleDeleteCancel = () => {
        if (deletingId) return; // prevent closing while in progress
        setConfirmOrder(null);
    };

    // ── Guards ─────────────────────────────────────────────────────────────────

    if (!user) return <NotLoggedIn />;
    if (loading) return <LoadingScreen />;

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <>
            {/* ── Confirm Dialog ── */}
            {confirmOrder && (
                <ConfirmDialog
                    order={confirmOrder}
                    onConfirm={handleDeleteConfirm}
                    onCancel={handleDeleteCancel}
                    loading={deletingId === confirmOrder.id}
                />
            )}

            <div className="min-h-screen bg-white py-16 md:py-24" data-testid="my-orders-page">
                <div className="max-w-4xl mx-auto px-6 md:px-12 space-y-12">

                    {/* ── Page Header ── */}
                    <div className="flex items-center gap-4 border-b border-khajur-gold/20 pb-8">
                        <button
                            onClick={() => navigate('/account')}
                            className="text-khajur-primary hover:text-khajur-gold transition-colors"
                            aria-label="Back to account"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <p className="text-xs uppercase tracking-widest text-khajur-gold mb-0.5">
                                Account
                            </p>
                            <h1 className="font-serif text-4xl md:text-5xl font-medium text-khajur-primary leading-tight">
                                My Orders
                            </h1>
                        </div>
                    </div>

                    {/* ── Summary ── */}
                    {orders.length > 0 && (
                        <p className="text-sm text-khajur-dark/50">
                            You have{' '}
                            <span className="font-semibold text-khajur-primary">
                                {orders.length}
                            </span>{' '}
                            order{orders.length > 1 ? 's' : ''} in total.
                        </p>
                    )}

                    {/* ── Orders / Empty ── */}
                    {orders.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <div className="space-y-6">
                            {orders.map((order) => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    onDeleteClick={handleDeleteClick}
                                    deletingId={deletingId}
                                />
                            ))}
                        </div>
                    )}

                </div>
            </div>
        </>
    );
};

export default MyOrders;
