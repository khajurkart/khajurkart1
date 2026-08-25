import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ChevronLeft,
  Package,
  CreditCard,
  Clock,
  Hash,
  MapPin,
  Download,
  XCircle,
  Loader2,
  CheckCircle2,
  Circle,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ─── Constants ─────────────────────────────────────────────────────────────────

const TRACKING_STEPS = [
  { key: 'pending',    label: 'Order Placed',  description: 'Your order has been received.'         },
  { key: 'confirmed',  label: 'Confirmed',      description: 'Order confirmed by our team.'          },
  { key: 'processing', label: 'Processing',     description: 'Your items are being prepared.'        },
  { key: 'shipped',    label: 'Shipped',        description: 'Your order is on its way.'             },
  { key: 'delivered',  label: 'Delivered',      description: 'Order delivered successfully.'         },
];

const STATUS_STYLES = {
  pending:    'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed:  'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-purple-50 text-purple-700 border-purple-200',
  shipped:    'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered:  'bg-green-50 text-green-700 border-green-200',
  exchange:   'bg-orange-50 text-orange-700 border-orange-200',
  return:     'bg-pink-50 text-pink-700 border-pink-200',
  cancelled:  'bg-red-50 text-red-700 border-red-200',
};

const getStatusStyle = (status) =>
  STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600 border-gray-200';

const getStepIndex = (status) =>
  TRACKING_STEPS.findIndex((s) => s.key === status);

// ─── Sub-Components ────────────────────────────────────────────────────────────

// ── Loading ────────────────────────────────────────────────────────────────────

const LoadingScreen = () => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3 text-khajur-dark/50">
    <Loader2 className="w-8 h-8 animate-spin" />
    <p className="text-sm">Loading order details…</p>
  </div>
);

// ── Error ──────────────────────────────────────────────────────────────────────

const ErrorScreen = ({ message }) => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 px-6 text-center">
    <div className="w-16 h-16 flex items-center justify-center bg-red-50 rounded-full">
      <AlertTriangle className="w-7 h-7 text-red-400" />
    </div>
    <div>
      <p className="font-serif text-2xl font-medium text-khajur-primary mb-2">
        Order Not Found
      </p>
      <p className="text-sm text-khajur-dark/50">{message}</p>
    </div>
    <Link
      to="/my-orders"
      className="
        flex items-center gap-2 bg-khajur-gold hover:bg-khajur-gold/90
        text-khajur-primary px-8 py-3 rounded-sm
        uppercase tracking-widest text-xs font-bold transition-all duration-300
      "
    >
      <ChevronLeft className="w-4 h-4" />
      Back to Orders
    </Link>
  </div>
);

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

// ── Section Wrapper ────────────────────────────────────────────────────────────

const Section = ({ title, icon: Icon, children }) => (
  <div className="bg-white border border-khajur-border rounded-sm">
    <div className="flex items-center gap-3 px-8 py-5 border-b border-khajur-border">
      <Icon className="w-4 h-4 text-khajur-gold" />
      <h2 className="font-serif text-lg font-medium text-khajur-primary">{title}</h2>
    </div>
    <div className="px-8 py-6">{children}</div>
  </div>
);

// ── Info Row ───────────────────────────────────────────────────────────────────

const InfoRow = ({ label, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
    <p className="text-xs uppercase tracking-widest text-khajur-dark/40 sm:w-36 flex-shrink-0">
      {label}
    </p>
    <div className="text-sm font-medium text-khajur-primary">{children}</div>
  </div>
);

// ── Order Tracking ─────────────────────────────────────────────────────────────

const OrderTracking = ({ status }) => {
  const currentStep = getStepIndex(status);
  const isSpecial = ['exchange', 'return', 'cancelled'].includes(status);

  return (
    <Section title="Order Tracking" icon={Package}>
      {isSpecial ? (
        <div className="flex items-center gap-3 text-sm text-khajur-dark/60">
          <StatusBadge status={status} />
          <span>This order is marked as <strong>{status}</strong>.</span>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-4 bottom-4 w-px bg-khajur-border" />

          <div className="space-y-6">
            {TRACKING_STEPS.map((step, index) => {
              const isDone    = index <= currentStep;
              const isCurrent = index === currentStep;

              return (
                <div key={step.key} className="flex items-start gap-5 relative">
                  {/* Icon */}
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

                  {/* Label */}
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
      )}
    </Section>
  );
};

// ── Order Items ────────────────────────────────────────────────────────────────

const OrderItems = ({ items }) => (
  <Section title="Order Items" icon={Package}>
    {items.length === 0 ? (
      <p className="text-sm text-khajur-dark/50">No items found in this order.</p>
    ) : (
      <div className="divide-y divide-khajur-border">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-4 py-4">
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
        ))}
      </div>
    )}

    {/* Totals */}
    {items.length > 0 && (
      <div className="border-t border-khajur-border pt-5 mt-2 space-y-2">
        <div className="flex justify-between text-sm text-khajur-dark/60">
          <span>Subtotal</span>
          <span>₹{items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}</span>
        </div>
      </div>
    )}
  </Section>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [cancelling, setCancelling]   = useState(false);
  const [downloading, setDownloading] = useState(false);

  const token = localStorage.getItem('token');
  const authHeaders = { Authorization: `Bearer ${token}` };

  // ── Fetch Order ────────────────────────────────────────────────────────────

  const fetchOrder = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/orders/${id}`, {
        headers: authHeaders,
      });
      setOrder(data);
    } catch {
      setError('Order not found or you are not authorized to view it.');
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // ── Cancel Order ───────────────────────────────────────────────────────────

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      await axios.put(`${API}/orders/${id}/cancel`, {}, { headers: authHeaders });
      toast.success('Order cancelled successfully.');
      fetchOrder();
    } catch {
      toast.error('Failed to cancel order. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  // ── Download Invoice ───────────────────────────────────────────────────────

  const handleDownloadInvoice = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`${API}/invoice/${order.id}`, {
        headers: authHeaders,
      });

      if (!res.ok) throw new Error();

      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `invoice_${order.id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded.');
    } catch {
      toast.error('Failed to download invoice.');
    } finally {
      setDownloading(false);
    }
  };

  // ── Guards ─────────────────────────────────────────────────────────────────

  if (loading) return <LoadingScreen />;
  if (error || !order) return <ErrorScreen message={error} />;

  const canCancel = ['pending', 'confirmed'].includes(order.status);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-6 md:px-12 space-y-10">

        {/* ── Page Header ── */}
        <div className="flex items-center gap-4 border-b border-khajur-gold/20 pb-8">
          <button
            onClick={() => navigate('/my-orders')}
            className="text-khajur-primary hover:text-khajur-gold transition-colors"
            aria-label="Back to orders"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-widest text-khajur-gold mb-0.5">
              My Orders
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-medium text-khajur-primary leading-tight">
              Order Details
            </h1>
          </div>
        </div>

        {/* ── Order Summary Card ── */}
        <div className="bg-white border border-khajur-border rounded-sm">

          {/* Summary Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-8 py-6 border-b border-khajur-border">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-mono text-sm font-semibold text-khajur-primary">
                  #{order.id}
                </p>
                <StatusBadge status={order.status} />
              </div>
            </div>
            <div className="sm:text-right">
              <p className="text-xs uppercase tracking-widest text-khajur-dark/40 mb-1">
                Order Total
              </p>
              <p className="font-serif text-3xl font-bold text-khajur-gold">
                ₹{Number(order.total_amount).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Summary Body */}
          <div className="px-8 py-6 space-y-4">
            <InfoRow label="Order ID">
              <span className="font-mono text-xs">{order.id}</span>
            </InfoRow>
            <InfoRow label="Placed On">
              {order.created_at
                ? new Date(order.created_at).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'long', year: 'numeric',
                  })
                : 'N/A'
              }
            </InfoRow>
            <InfoRow label="Payment">
              {order.payment_method?.toUpperCase()}
            </InfoRow>
            {order.tracking_id && (
              <InfoRow label="Tracking ID">
                <span className="font-mono">{order.tracking_id}</span>
              </InfoRow>
            )}
            {order.shipping_address && (
              <InfoRow label="Ship To">
                <span className="text-khajur-dark/70">
                  {order.shipping_address.address}, {order.shipping_address.city},{' '}
                  {order.shipping_address.state} — {order.shipping_address.pincode}
                </span>
              </InfoRow>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-4 px-8 py-5 border-t border-khajur-border bg-khajur-cream/40">
            <button
              onClick={handleDownloadInvoice}
              disabled={downloading}
              className="
                flex items-center gap-2 bg-khajur-primary hover:bg-khajur-primary/90
                disabled:opacity-60 disabled:cursor-not-allowed
                text-khajur-cream px-6 py-3 rounded-sm
                uppercase tracking-widest text-xs font-bold transition-all duration-300
              "
            >
              {downloading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Download className="w-4 h-4" />
              }
              {downloading ? 'Downloading…' : 'Download Invoice'}
            </button>

            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="
                  flex items-center gap-2 border border-red-300 hover:border-red-500
                  bg-white hover:bg-red-50 text-red-500 hover:text-red-700
                  disabled:opacity-60 disabled:cursor-not-allowed
                  px-6 py-3 rounded-sm
                  uppercase tracking-widest text-xs font-bold transition-all duration-300
                "
              >
                {cancelling
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <XCircle className="w-4 h-4" />
                }
                {cancelling ? 'Cancelling…' : 'Cancel Order'}
              </button>
            )}
          </div>
        </div>

        {/* ── Tracking ── */}
        <OrderTracking status={order.status} />

        {/* ── Items ── */}
        <OrderItems items={order.items ?? []} />

      </div>
    </div>
  );
};

export default OrderDetails;
