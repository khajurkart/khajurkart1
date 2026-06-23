import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  ChevronLeft,
  Package,
  Plus,
  AlertCircle,
  Loader2,
  Trash2,
  RefreshCw,
  ShoppingBag,
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  pending:   { color: 'bg-yellow-50 text-yellow-700 border-yellow-200',  icon: Clock,         label: 'Pending'   },
  approved:  { color: 'bg-green-50 text-green-700 border-green-200',     icon: CheckCircle2,  label: 'Approved'  },
  rejected:  { color: 'bg-red-50 text-red-700 border-red-200',           icon: XCircle,       label: 'Rejected'  },
  completed: { color: 'bg-blue-50 text-blue-700 border-blue-200',        icon: CheckCircle2,  label: 'Completed' },
};

const POLICY_POINTS = [
  'Returns & exchanges accepted within 7 days of delivery.',
  'Products must be unused and in original packaging.',
  'Refunds processed within 5–7 business days after approval.',
];

// ─── Sub-Components ────────────────────────────────────────────────────────────

// ── Loading ────────────────────────────────────────────────────────────────────

const LoadingScreen = () => (
  <div className="min-h-screen bg-khajur-cream flex flex-col items-center justify-center gap-3 text-khajur-dark/50">
    <Loader2 className="w-8 h-8 animate-spin" />
    <p className="text-sm">Loading your requests…</p>
  </div>
);

// ── Policy Banner ──────────────────────────────────────────────────────────────

const PolicyBanner = () => (
  <div className="flex items-start gap-4 bg-blue-50 border border-blue-200 p-6 rounded-sm">
    <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
    <div>
      <p className="text-sm font-semibold text-blue-800 mb-2 uppercase tracking-wide">
        Return & Exchange Policy
      </p>
      <ul className="space-y-1">
        {POLICY_POINTS.map((point) => (
          <li key={point} className="text-sm text-blue-700 flex items-start gap-2">
            <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-400 flex-shrink-0" />
            {point}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

// ── Status Badge ───────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const cfg = STATUS_STYLES[status] ?? {
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    label: status,
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold uppercase tracking-wider border rounded-full ${cfg.color}`}>
      {status}
    </span>
  );
};

// ── Type Badge ─────────────────────────────────────────────────────────────────

const TypeBadge = ({ type }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-khajur-cream text-khajur-primary border border-khajur-border rounded-full">
    {type === 'exchange' ? <ArrowLeftRight className="w-3 h-3" /> : <RefreshCw className="w-3 h-3" />}
    {type}
  </span>
);

// ── Return Request Card ────────────────────────────────────────────────────────

const ReturnCard = ({ returnReq, onDelete }) => (
  <div className="bg-white border border-khajur-border hover:border-khajur-gold/40 transition-colors duration-300 p-8 rounded-sm">

    {/* Card Header */}
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={returnReq.status} />
          <TypeBadge type={returnReq.request_type} />
        </div>
        <p className="text-xs text-khajur-dark/50 font-mono">
          Request #{returnReq.id.substring(0, 14)}…
        </p>
        <p className="text-xs text-khajur-dark/50">
          Order #{returnReq.order_id.substring(0, 14)}… &nbsp;·&nbsp;{' '}
          {new Date(returnReq.created_at).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'long', year: 'numeric',
          })}
        </p>
      </div>
      <button
        onClick={() => onDelete(returnReq.id)}
        className="flex items-center gap-1.5 text-red-400 hover:text-red-600 text-xs font-medium transition-colors self-start"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete
      </button>
    </div>

    {/* Card Body */}
    <div className="border-t border-khajur-border pt-5 space-y-3">
      <div className="text-sm text-khajur-dark/80">
        <span className="font-semibold text-khajur-primary">Reason: </span>
        {returnReq.reason}
      </div>
      <div className="text-sm text-khajur-dark/80">
        <span className="font-semibold text-khajur-primary">Items: </span>
        {returnReq.items.length} item(s) selected
      </div>
      {returnReq.admin_notes && (
        <div className="mt-4 bg-khajur-cream border border-khajur-border p-4 rounded-sm">
          <p className="text-xs uppercase tracking-widest text-khajur-dark/40 mb-1">Admin Note</p>
          <p className="text-sm text-khajur-primary">{returnReq.admin_notes}</p>
        </div>
      )}
    </div>
  </div>
);

// ── Order Row ──────────────────────────────────────────────────────────────────

const OrderRow = ({ order, hasRequest, onSelect }) => (
  <div className="bg-white border border-khajur-border hover:border-khajur-gold/40 transition-colors duration-300 px-8 py-6 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div className="space-y-1">
      <p className="text-sm font-semibold text-khajur-primary font-mono">
        Order #{order.id.substring(0, 14)}…
      </p>
      <p className="text-xs text-khajur-dark/50">
        {order.items.length} item(s) &nbsp;·&nbsp; ₹{order.total_amount.toFixed(2)} &nbsp;·&nbsp;{' '}
        {new Date(order.created_at).toLocaleDateString('en-IN', {
          day: '2-digit', month: 'long', year: 'numeric',
        })}
      </p>
    </div>
    {hasRequest ? (
      <span className="text-xs text-khajur-dark/40 italic">Request already submitted</span>
    ) : (
      <button
        onClick={() => onSelect(order)}
        className="
          flex items-center gap-2 bg-khajur-gold hover:bg-khajur-gold/90
          hover:shadow-[0_0_16px_rgba(198,169,98,0.35)]
          text-khajur-primary px-6 py-3 rounded-sm
          uppercase tracking-widest text-xs font-bold transition-all duration-300
        "
      >
        <Plus className="w-4 h-4" />
        Request
      </button>
    )}
  </div>
);

// ── Empty Orders ───────────────────────────────────────────────────────────────

const EmptyOrders = () => (
  <div className="bg-white border border-khajur-border p-16 rounded-sm flex flex-col items-center text-center gap-5">
    <div className="w-16 h-16 flex items-center justify-center bg-khajur-cream rounded-full">
      <Package className="w-7 h-7 text-khajur-dark/30" />
    </div>
    <div>
      <p className="font-serif text-xl text-khajur-primary mb-2">No eligible orders</p>
      <p className="text-sm text-khajur-dark/50 max-w-xs">
        You can only raise a request for delivered orders. Start shopping to get started.
      </p>
    </div>
    <Link
      to="/products"
      className="
        mt-2 inline-flex items-center gap-2 bg-khajur-gold hover:bg-khajur-gold/90
        text-khajur-primary px-8 py-3 rounded-sm
        uppercase tracking-widest text-xs font-bold transition-all duration-300
      "
    >
      <ShoppingBag className="w-4 h-4" />
      Shop Now
    </Link>
  </div>
);

// ── Request Form ───────────────────────────────────────────────────────────────

const RequestForm = ({ order, returns: existingReturns, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    requestType: 'return',
    reason: '',
    selectedItems: order.items.map((item) => ({ ...item, selected: true })),
  });
  const [submitting, setSubmitting] = useState(false);

  const toggleItem = (index, checked) => {
    const updated = [...formData.selectedItems];
    updated[index].selected = checked;
    setFormData((prev) => ({ ...prev, selectedItems: updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selected = formData.selectedItems.filter((i) => i.selected);
    if (selected.length === 0) {
      toast.error('Please select at least one item.');
      return;
    }
    setSubmitting(true);
    await onSubmit(formData);
    setSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-khajur-border rounded-sm p-8 md:p-12 space-y-10"
    >
      {/* Form Header */}
      <div className="border-b border-khajur-border pb-6">
        <p className="text-xs uppercase tracking-widest text-khajur-gold mb-1">New Request</p>
        <h3 className="font-serif text-2xl font-medium text-khajur-primary">
          Return / Exchange
        </h3>
        <p className="text-xs text-khajur-dark/50 mt-1 font-mono">
          Order #{order.id.substring(0, 14)}…
        </p>
      </div>

      {/* Request Type */}
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-widest font-medium text-khajur-dark/50">
          Request Type <span className="text-khajur-gold">*</span>
        </p>
        <div className="grid grid-cols-2 gap-4">
          {['return', 'exchange'].map((type) => (
            <label
              key={type}
              className={`
                flex items-center gap-3 p-5 border rounded-sm cursor-pointer transition-all duration-200
                ${formData.requestType === type
                  ? 'border-khajur-gold bg-khajur-gold/5'
                  : 'border-khajur-border hover:border-khajur-gold/40'
                }
              `}
            >
              <input
                type="radio"
                value={type}
                checked={formData.requestType === type}
                onChange={(e) => setFormData((prev) => ({ ...prev, requestType: e.target.value }))}
                className="accent-khajur-gold"
              />
              <div>
                <p className="text-sm font-semibold text-khajur-primary capitalize">{type}</p>
                <p className="text-xs text-khajur-dark/40">
                  {type === 'return' ? 'Get a refund' : 'Swap for another'}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Select Items */}
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-widest font-medium text-khajur-dark/50">
          Select Items <span className="text-khajur-gold">*</span>
        </p>
        <div className="space-y-3">
          {formData.selectedItems.map((item, index) => (
            <label
              key={index}
              className={`
                flex items-center gap-4 p-5 border rounded-sm cursor-pointer transition-all duration-200
                ${item.selected
                  ? 'border-khajur-gold bg-khajur-gold/5'
                  : 'border-khajur-border hover:border-khajur-gold/40'
                }
              `}
            >
              <input
                type="checkbox"
                checked={item.selected}
                onChange={(e) => toggleItem(index, e.target.checked)}
                className="accent-khajur-gold w-4 h-4 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-khajur-primary truncate">
                  {item.product_name}
                </p>
                <p className="text-xs text-khajur-dark/50 mt-0.5">
                  Qty: {item.quantity} &nbsp;·&nbsp; ₹{item.price}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Reason */}
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-widest font-medium text-khajur-dark/50">
          Reason <span className="text-khajur-gold">*</span>
        </p>
        <textarea
          required
          rows={4}
          value={formData.reason}
          onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
          placeholder="Please describe why you want to return or exchange this order…"
          className="
            w-full bg-khajur-cream border border-khajur-border
            hover:border-khajur-gold/40 focus:border-khajur-gold
            text-sm text-khajur-primary placeholder:text-khajur-dark/30
            px-5 py-4 rounded-sm focus:outline-none transition-colors duration-200 resize-none
          "
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="
            flex-1 flex items-center justify-center gap-2
            bg-khajur-gold hover:bg-khajur-gold/90
            hover:shadow-[0_0_20px_rgba(198,169,98,0.35)]
            disabled:opacity-60 disabled:cursor-not-allowed
            text-khajur-primary px-8 py-4 rounded-sm
            uppercase tracking-widest text-xs font-bold transition-all duration-300
          "
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {submitting ? 'Submitting…' : 'Submit Request'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="
            flex-1 bg-transparent border border-khajur-primary
            hover:bg-khajur-primary text-khajur-primary hover:text-khajur-cream
            px-8 py-4 rounded-sm uppercase tracking-widest text-xs font-bold
            transition-all duration-300
          "
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const Returns = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [returns, setReturns]               = useState([]);
  const [orders, setOrders]                 = useState([]);
  const [loading, setLoading]               = useState(true);
  const [showForm, setShowForm]             = useState(false);
  const [selectedOrder, setSelectedOrder]   = useState(null);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  // ── Redirect if not logged in ──────────────────────────────────────────────

  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

  // ── Fetch Data ─────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      const [returnsRes, ordersRes] = await Promise.all([
        axios.get(`${API}/returns`, authHeaders),
        axios.get(`${API}/orders`, authHeaders),
      ]);
      setReturns(returnsRes.data);
      setOrders(ordersRes.data.filter((o) => o.status === 'delivered'));
    } catch {
      toast.error('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleSubmitRequest = async (formData) => {
    const selectedItems = formData.selectedItems.filter((i) => i.selected);
    try {
      await axios.post(
        `${API}/returns`,
        {
          order_id: selectedOrder.id,
          items: selectedItems.map(({ selected, ...item }) => item),
          reason: formData.reason,
          request_type: formData.requestType,
        },
        authHeaders
      );
      toast.success(
        `${formData.requestType === 'return' ? 'Return' : 'Exchange'} request submitted successfully.`
      );
      setShowForm(false);
      setSelectedOrder(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit request.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this return request? This cannot be undone.')) return;
    try {
      await fetch(`${API}/returns/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Request deleted.');
      fetchData();
    } catch {
      toast.error('Failed to delete request.');
    }
  };

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setSelectedOrder(null);
  };

  // ── Guards ─────────────────────────────────────────────────────────────────

  if (!user) return null;
  if (loading) return <LoadingScreen />;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-khajur-cream py-16 md:py-24" data-testid="returns-page">
      <div className="max-w-4xl mx-auto px-6 md:px-12 space-y-14">

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
              Return & Exchange
            </h1>
          </div>
        </div>

        {/* ── Policy Banner ── */}
        <PolicyBanner />

        {/* ── Existing Requests ── */}
        {returns.length > 0 && (
          <section className="space-y-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-khajur-dark/40 mb-1 font-medium">
                History
              </p>
              <h2 className="font-serif text-2xl font-medium text-khajur-primary">
                My Requests
              </h2>
            </div>
            {returns.map((req) => (
              <ReturnCard key={req.id} returnReq={req} onDelete={handleDelete} />
            ))}
          </section>
        )}

        {/* ── Create New Request / Form ── */}
        <section className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-khajur-dark/40 mb-1 font-medium">
              New Request
            </p>
            <h2 className="font-serif text-2xl font-medium text-khajur-primary">
              {orders.length > 0 ? 'Select an Order' : 'No Eligible Orders'}
            </h2>
          </div>

          {orders.length === 0 ? (
            <EmptyOrders />
          ) : showForm && selectedOrder ? (
            <RequestForm
              order={selectedOrder}
              returns={returns}
              onSubmit={handleSubmitRequest}
              onCancel={handleCancelForm}
            />
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  hasRequest={returns.some((r) => r.order_id === order.id)}
                  onSelect={handleSelectOrder}
                />
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default Returns;
