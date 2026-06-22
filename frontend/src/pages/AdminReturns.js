import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  ChevronLeft,
  RefreshCw,
  Check,
  X,
  Clock,
  CheckCircle,
  Loader2,
  Trash2,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUSES = ['all', 'pending', 'approved', 'rejected', 'completed'];

const STATUS_CONFIG = {
  pending:   { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  approved:  { color: 'bg-green-100 text-green-800 border-green-200',  icon: Check },
  rejected:  { color: 'bg-red-100 text-red-800 border-red-200',        icon: X },
  completed: { color: 'bg-blue-100 text-blue-800 border-blue-200',     icon: CheckCircle },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

// ─── Sub-Components ────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] ?? {
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: RefreshCw,
  };
  const Icon = config.icon;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold
        uppercase tracking-wide border rounded-sm ${config.color}
      `}
    >
      <Icon className="w-3.5 h-3.5" />
      {status}
    </span>
  );
};

const TypeBadge = ({ type }) => (
  <span className="inline-block px-2.5 py-1 text-xs font-bold uppercase tracking-wide bg-khajur-primary/10 text-khajur-primary rounded-sm">
    {type}
  </span>
);

const FilterTab = ({ status, active, count, onClick }) => (
  <button
    onClick={onClick}
    data-testid={`filter-${status}`}
    className={`
      px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors
      ${active
        ? 'bg-khajur-primary text-khajur-cream'
        : 'bg-khajur-cream text-khajur-primary hover:bg-khajur-primary/10'
      }
    `}
  >
    {status} <span className="opacity-70">({count})</span>
  </button>
);

// ── Empty State ────────────────────────────────────────────────────────────────

const EmptyState = ({ status }) => (
  <div className="flex flex-col items-center justify-center py-20 bg-khajur-cream border border-khajur-border text-center">
    <RefreshCw className="w-12 h-12 text-khajur-dark/20 mb-4" />
    <h3 className="font-serif text-xl font-medium text-khajur-primary mb-1">
      No {status !== 'all' ? status : ''} return requests
    </h3>
    <p className="text-sm text-khajur-dark/50 max-w-xs">
      {status === 'all'
        ? 'Customer return and exchange requests will appear here.'
        : `There are no requests with "${status}" status.`}
    </p>
  </div>
);

// ── Admin Notes Panel ──────────────────────────────────────────────────────────

const ReviewPanel = ({ returnId, onApprove, onReject, onCancel }) => {
  const [notes, setNotes] = useState('');

  return (
    <div className="space-y-4">
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-khajur-primary mb-2">
          <MessageSquare className="w-4 h-4 text-khajur-gold" />
          Admin Notes
          <span className="text-khajur-dark/40 font-normal">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add a note for the customer regarding your decision…"
          rows={3}
          className="
            w-full bg-white border border-khajur-primary/20
            focus:border-khajur-gold px-4 py-3 text-sm text-khajur-primary
            placeholder:text-khajur-dark/30 focus:outline-none transition-colors resize-none
          "
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => onApprove(returnId, notes)}
          data-testid={`approve-${returnId}`}
          className="
            flex items-center gap-2 bg-green-600 hover:bg-green-700
            text-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest
            transition-colors
          "
        >
          <Check className="w-4 h-4" />
          Approve
        </button>
        <button
          onClick={() => onReject(returnId, notes)}
          data-testid={`reject-${returnId}`}
          className="
            flex items-center gap-2 bg-red-500 hover:bg-red-600
            text-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest
            transition-colors
          "
        >
          <X className="w-4 h-4" />
          Reject
        </button>
        <button
          onClick={onCancel}
          className="
            bg-khajur-cream border border-khajur-border text-khajur-dark/70
            hover:bg-khajur-border px-5 py-2.5 text-xs font-bold uppercase
            tracking-widest transition-colors
          "
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// ── Return Card ────────────────────────────────────────────────────────────────

const ReturnCard = ({
  returnReq,
  selectedReturn,
  onSelectReview,
  onCancelReview,
  onApprove,
  onReject,
  onComplete,
  onDelete,
  deletingId,
}) => (
  <div
    className="bg-white border border-khajur-border overflow-hidden"
    data-testid={`return-${returnReq.id}`}
  >
    {/* Card Header */}
    <div className="bg-khajur-cream px-6 py-5 border-b border-khajur-border">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">

        {/* Left: meta */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-serif text-base font-bold text-khajur-primary">
              Request #{returnReq.id.substring(7, 19)}
            </span>
            <StatusBadge status={returnReq.status} />
            <TypeBadge type={returnReq.request_type} />
          </div>
          <p className="text-xs text-khajur-dark/60">
            Order: <span className="font-medium">#{returnReq.order_id.substring(6, 18)}</span>
            {' · '}
            {returnReq.customer_name} ({returnReq.customer_email})
          </p>
          <p className="text-xs text-khajur-dark/40">
            Submitted: {formatDate(returnReq.created_at)}
          </p>
        </div>

        {/* Right: delete */}
        <button
          onClick={() => onDelete(returnReq.id)}
          disabled={deletingId === returnReq.id}
          className="flex items-center gap-1.5 text-red-400 hover:text-red-600 transition-colors text-xs font-medium disabled:opacity-40 self-start"
          aria-label="Delete return request"
        >
          {deletingId === returnReq.id
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Trash2 className="w-3.5 h-3.5" />
          }
          Delete
        </button>
      </div>
    </div>

    {/* Card Body */}
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Items */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-khajur-dark/50 mb-3">
            Items for {returnReq.request_type}
          </h4>
          <div className="space-y-2">
            {returnReq.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-khajur-cream px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-khajur-dark">{item.product_name}</p>
                  <p className="text-xs text-khajur-dark/50">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-khajur-gold">₹{item.price}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Reason & Notes */}
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-khajur-dark/50 mb-2">
              Reason
            </h4>
            <p className="text-sm text-khajur-dark/80 bg-khajur-cream px-4 py-3 leading-relaxed">
              {returnReq.reason}
            </p>
          </div>

          {returnReq.admin_notes && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-khajur-dark/50 mb-2">
                Admin Notes
              </h4>
              <p className="text-sm text-blue-700 bg-blue-50 border border-blue-200 px-4 py-3 leading-relaxed">
                {returnReq.admin_notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {returnReq.status === 'pending' && (
        <div className="mt-6 pt-6 border-t border-khajur-border">
          {selectedReturn === returnReq.id ? (
            <ReviewPanel
              returnId={returnReq.id}
              onApprove={onApprove}
              onReject={onReject}
              onCancel={onCancelReview}
            />
          ) : (
            <button
              onClick={() => onSelectReview(returnReq.id)}
              data-testid={`review-${returnReq.id}`}
              className="
                bg-khajur-gold hover:bg-khajur-gold/90 text-khajur-primary
                px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors
              "
            >
              Review Request
            </button>
          )}
        </div>
      )}

      {returnReq.status === 'approved' && (
        <div className="mt-6 pt-6 border-t border-khajur-border">
          <button
            onClick={() => onComplete(returnReq.id)}
            data-testid={`complete-${returnReq.id}`}
            className="
              flex items-center gap-2 bg-blue-600 hover:bg-blue-700
              text-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest
              transition-colors
            "
          >
            <CheckCircle className="w-4 h-4" />
            Mark as Completed
          </button>
        </div>
      )}
    </div>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const AdminReturns = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [returns, setReturns]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [isAdmin, setIsAdmin]           = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [deletingId, setDeletingId]     = useState(null);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const fetchReturns = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/admin/returns`, authHeaders);
      setReturns(data);
    } catch {
      toast.error('Failed to load return requests.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const checkAdmin = useCallback(async () => {
    try {
      await axios.get(`${API}/admin/check`, authHeaders);
      setIsAdmin(true);
      fetchReturns();
    } catch {
      toast.error('Admin access required.');
      navigate('/');
    }
  }, [token]);

  useEffect(() => {
    checkAdmin();
  }, [checkAdmin]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const updateStatus = async (returnId, status, notes = '') => {
    try {
      const params = new URLSearchParams({ status });
      if (notes.trim()) params.append('admin_notes', notes.trim());

      await axios.put(
        `${API}/admin/returns/${returnId}/status?${params.toString()}`,
        {},
        authHeaders
      );

      setReturns((prev) =>
        prev.map((r) =>
          r.id === returnId
            ? { ...r, status, admin_notes: notes.trim() || r.admin_notes }
            : r
        )
      );
      setSelectedReturn(null);
      toast.success(`Request ${status} successfully.`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this return request? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await axios.delete(`${API}/admin/returns/${id}`, authHeaders);
      setReturns((prev) => prev.filter((r) => r.id !== id));
      if (selectedReturn === id) setSelectedReturn(null);
      toast.success('Return request deleted.');
    } catch {
      toast.error('Failed to delete return request.');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Derived State ──────────────────────────────────────────────────────────

  const filteredReturns =
    filterStatus === 'all'
      ? returns
      : returns.filter((r) => r.status === filterStatus);

  const statusCounts = STATUSES.reduce((acc, s) => {
    acc[s] = s === 'all' ? returns.length : returns.filter((r) => r.status === s).length;
    return acc;
  }, {});

  // ── Render States ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-khajur-dark/40">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-sm">Loading return requests…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <h1 className="font-serif text-3xl font-medium text-khajur-primary">Access Denied</h1>
        <p className="text-sm text-khajur-dark/50">You do not have permission to view this page.</p>
        <Link to="/" className="text-khajur-gold underline underline-offset-2 text-sm">
          Return to Home
        </Link>
      </div>
    );
  }

  // ── Main Render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen py-20 bg-white" data-testid="admin-returns-page">
      <div className="max-w-7xl mx-auto px-6 md:px-12">

        {/* Page Header */}
        <div className="flex items-center gap-4 mb-10">
          <Link
            to="/admin/dashboard"
            className="text-khajur-primary hover:text-khajur-gold transition-colors"
            aria-label="Back to dashboard"
            data-testid="back-to-admin"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <p className="text-xs uppercase tracking-widest text-khajur-gold mb-0.5">
              Administration
            </p>
            <h1 className="font-serif text-4xl font-medium text-khajur-primary">
              Returns & Exchanges
            </h1>
            <p className="text-sm text-khajur-dark/50 mt-1">
              Review and process customer return and exchange requests
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {STATUSES.map((status) => (
            <FilterTab
              key={status}
              status={status}
              active={filterStatus === status}
              count={statusCounts[status]}
              onClick={() => setFilterStatus(status)}
            />
          ))}
        </div>

        {/* Summary */}
        <p className="text-sm text-khajur-dark/50 mb-6">
          Showing{' '}
          <span className="font-medium text-khajur-primary">{filteredReturns.length}</span> of{' '}
          <span className="font-medium text-khajur-primary">{returns.length}</span> requests
        </p>

        {/* Content */}
        {filteredReturns.length === 0 ? (
          <EmptyState status={filterStatus} />
        ) : (
          <div className="space-y-5">
            {filteredReturns.map((returnReq) => (
              <ReturnCard
                key={returnReq.id}
                returnReq={returnReq}
                selectedReturn={selectedReturn}
                onSelectReview={setSelectedReturn}
                onCancelReview={() => setSelectedReturn(null)}
                onApprove={(id, notes) => updateStatus(id, 'approved', notes)}
                onReject={(id, notes) => updateStatus(id, 'rejected', notes)}
                onComplete={(id) => updateStatus(id, 'completed')}
                onDelete={handleDelete}
                deletingId={deletingId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReturns;
