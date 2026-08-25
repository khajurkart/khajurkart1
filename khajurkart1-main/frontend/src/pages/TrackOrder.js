import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ChevronLeft,
    Search,
    Package,
    Loader2,
    Hash,
    Calendar,
    CheckCircle2,
    Circle,
    Truck,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_STYLES = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
    processing: 'bg-purple-50 text-purple-700 border-purple-200',
    shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    delivered: 'bg-green-50 text-green-700 border-green-200',
    exchange: 'bg-orange-50 text-orange-700 border-orange-200',
    return: 'bg-pink-50 text-pink-700 border-pink-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
};

const TRACKING_STEPS = [
    { key: 'pending', label: 'Order Placed', description: 'Your order has been received.' },
    { key: 'confirmed', label: 'Confirmed', description: 'Order confirmed by our team.' },
    { key: 'processing', label: 'Processing', description: 'Your items are being prepared.' },
    { key: 'shipped', label: 'Shipped', description: 'Your order is on its way.' },
    { key: 'delivered', label: 'Delivered', description: 'Order delivered successfully.' },
];

const getStatusStyle = (status) =>
    STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600 border-gray-200';

const getStepIndex = (status) =>
    TRACKING_STEPS.findIndex((s) => s.key === status);

// ─── Sub-Components ────────────────────────────────────────────────────────────

// ── Status Badge ───────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => (
    <span
        className={`
      inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider
      border rounded-full ${getStatusStyle(status)}
    `}
    >
        {status}
    </span>
);

// ── Info Row ───────────────────────────────────────────────────────────────────

const InfoRow = ({ icon: Icon, label, children }) => (
    <div className="flex items-start gap-4">
        <div className="w-8 h-8 flex items-center justify-center bg-khajur-cream rounded-sm flex-shrink-0 mt-0.5">
            <Icon className="w-4 h-4 text-khajur-gold" />
        </div>
        <div>
            <p className="text-xs uppercase tracking-widest text-khajur-dark/40 font-medium mb-0.5">
                {label}
            </p>
            <div className="text-sm font-medium text-khajur-primary">{children}</div>
        </div>
    </div>
);

// ── Order Tracking Timeline ────────────────────────────────────────────────────

const TrackingTimeline = ({ status }) => {
    const currentStep = getStepIndex(status);
    const isSpecial = ['exchange', 'return', 'cancelled'].includes(status);

    if (isSpecial) {
        return (
            <div className="flex items-center gap-3 p-5 bg-khajur-cream rounded-sm">
                <StatusBadge status={status} />
                <p className="text-sm text-khajur-dark/60">
                    This order has been marked as <strong className="text-khajur-primary capitalize">{status}</strong>.
                </p>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Connector Line */}
            <div className="absolute left-4 top-4 bottom-4 w-px bg-khajur-border" />

            <div className="space-y-6">
                {TRACKING_STEPS.map((step, index) => {
                    const isDone = index <= currentStep;
                    const isCurrent = index === currentStep;

                    return (
                        <div key={step.key} className="flex items-start gap-5 relative">
                            {/* Step Icon */}
                            <div className={`
                relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                transition-all duration-300
                ${isDone
                                    ? 'bg-khajur-gold shadow-[0_0_12px_rgba(198,169,98,0.4)]'
                                    : 'bg-white border-2 border-khajur-border'
                                }
              `}>
                                {isDone
                                    ? <CheckCircle2 className="w-4 h-4 text-khajur-primary" />
                                    : <Circle className="w-4 h-4 text-khajur-dark/20" />
                                }
                            </div>

                            {/* Step Text */}
                            <div className="pt-1">
                                <p className={`text-sm font-semibold ${isDone ? 'text-khajur-primary' : 'text-khajur-dark/30'}`}>
                                    {step.label}
                                    {isCurrent && (
                                        <span className="ml-2 text-[10px] bg-khajur-gold/20 text-khajur-gold px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                            Current
                                        </span>
                                    )}
                                </p>
                                <p className={`text-xs mt-0.5 ${isDone ? 'text-khajur-dark/50' : 'text-khajur-dark/20'}`}>
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ── No Result ──────────────────────────────────────────────────────────────────

const NoResult = () => (
    <div className="bg-white border border-khajur-border rounded-sm p-16 flex flex-col items-center text-center gap-5">
        <div className="w-16 h-16 flex items-center justify-center bg-khajur-cream rounded-full">
            <Package className="w-7 h-7 text-khajur-dark/30" />
        </div>
        <div>
            <p className="font-serif text-xl font-medium text-khajur-primary mb-2">
                No order found
            </p>
            <p className="text-sm text-khajur-dark/50 max-w-xs">
                We couldn't find an order with that tracking ID. Please double-check and try again.
            </p>
        </div>
    </div>
);

// ── Order Result Card ──────────────────────────────────────────────────────────

const OrderResult = ({ order }) => (
    <div className="bg-white border border-khajur-border rounded-sm overflow-hidden">

        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-8 py-6 border-b border-khajur-border bg-khajur-cream/40">
            <div>
                <p className="text-xs uppercase tracking-widest text-khajur-gold mb-0.5">
                    Order Found
                </p>
                <h2 className="font-serif text-2xl font-medium text-khajur-primary">
                    Order Details
                </h2>
            </div>
            <StatusBadge status={order.status} />
        </div>

        <div className="px-8 py-8 space-y-10">

            {/* Meta Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <InfoRow icon={Hash} label="Order ID">
                    <span className="font-mono text-xs">{order.id}</span>
                </InfoRow>
                <InfoRow icon={Truck} label="Tracking ID">
                    <span className="font-mono">{order.tracking_id}</span>
                </InfoRow>
                <InfoRow icon={Calendar} label="Order Date">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'long', year: 'numeric',
                    })}
                </InfoRow>
                <InfoRow icon={Package} label="Total Amount">
                    <span className="text-khajur-gold font-bold text-xl">
                        ₹{Number(order.total_amount).toFixed(2)}
                    </span>
                </InfoRow>
            </div>

            {/* Tracking Timeline */}
            <div>
                <p className="text-xs uppercase tracking-widest text-khajur-dark/40 font-medium mb-6">
                    Shipment Progress
                </p>
                <TrackingTimeline status={order.status} />
            </div>

            {/* Order Items */}
            <div>
                <p className="text-xs uppercase tracking-widest text-khajur-dark/40 font-medium mb-4">
                    Items in This Order
                </p>
                <div className="border border-khajur-border rounded-sm divide-y divide-khajur-border">
                    {order.items.map((item, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between gap-4 px-6 py-4"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-khajur-primary truncate">
                                    {item.product_name}
                                </p>
                                <p className="text-xs text-khajur-dark/50 mt-0.5">
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

        </div>
    </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const TrackOrder = () => {
    useEffect(() => {
        document.title = 'Track Your Order — KhajurKart';
        return () => {
            document.title = 'KhajurKart — Premium Dates, Dry Fruits & Spices';
        };
    }, []);
    const [trackingId, setTrackingId] = useState('');
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    // ── Track Handler ──────────────────────────────────────────────────────────

    const handleTrack = async (e) => {
        e.preventDefault();

        if (!trackingId.trim()) {
            toast.error('Please enter a tracking ID.');
            return;
        }

        setLoading(true);
        setSearched(false);
        setOrder(null);

        try {
            const { data } = await axios.get(`${API}/orders/track/${trackingId.trim()}`);
            setOrder(data);
        } catch {
            toast.error('No order found with this tracking ID.');
            setOrder(null);
        } finally {
            setLoading(false);
            setSearched(true);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-khajur-cream py-16 md:py-24" data-testid="track-order-page">
            <div className="max-w-3xl mx-auto px-6 md:px-12 space-y-10">

                {/* ── Page Header ── */}
                <div className="flex items-center gap-4 border-b border-khajur-gold/20 pb-8">
                    <Link
                        to="/account"
                        data-testid="back-to-account"
                        className="text-khajur-primary hover:text-khajur-gold transition-colors"
                        aria-label="Back to account"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <p className="text-xs uppercase tracking-widest text-khajur-gold mb-0.5">
                            Account
                        </p>
                        <h1 className="font-serif text-4xl md:text-5xl font-medium text-khajur-primary leading-tight">
                            Track Order
                        </h1>
                    </div>
                </div>

                {/* ── Search Form ── */}
                <div className="bg-white border border-khajur-border rounded-sm">
                    <div className="flex items-center gap-3 px-8 py-5 border-b border-khajur-border">
                        <Search className="w-4 h-4 text-khajur-gold" />
                        <h2 className="font-serif text-lg font-medium text-khajur-primary">
                            Enter Tracking ID
                        </h2>
                    </div>

                    <form onSubmit={handleTrack} className="px-8 py-8 space-y-6">
                        <div>
                            <label className="block text-xs uppercase tracking-widest font-medium text-khajur-dark/50 mb-3">
                                Tracking ID
                            </label>
                            <input
                                type="text"
                                value={trackingId}
                                onChange={(e) => setTrackingId(e.target.value)}
                                placeholder="e.g., KK20260223ABC123"
                                data-testid="tracking-id-input"
                                className="
                  w-full bg-khajur-cream border border-khajur-border
                  hover:border-khajur-gold/40 focus:border-khajur-gold
                  text-sm text-khajur-primary placeholder:text-khajur-dark/25
                  px-5 py-4 rounded-sm focus:outline-none transition-colors duration-200
                "
                            />
                            <p className="text-xs text-khajur-dark/40 mt-2">
                                You can find your tracking ID in your order confirmation email or order details page.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            data-testid="track-button"
                            className="
                w-full flex items-center justify-center gap-2
                bg-khajur-gold hover:bg-khajur-gold/90
                hover:shadow-[0_0_20px_rgba(198,169,98,0.35)]
                disabled:opacity-60 disabled:cursor-not-allowed
                text-khajur-primary rounded-sm px-8 py-4
                uppercase tracking-widest text-xs font-bold
                transition-all duration-300
              "
                        >
                            {loading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Searching…</>
                            ) : (
                                <><Search className="w-4 h-4" /> Track Order</>
                            )}
                        </button>
                    </form>
                </div>

                {/* ── Result ── */}
                {searched && !loading && (
                    order ? <OrderResult order={order} /> : <NoResult />
                )}

            </div>
        </div>
    );
};

export default TrackOrder;
