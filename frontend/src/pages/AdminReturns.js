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
    Package,
    User,
    Calendar,
    Hash,
    ShoppingBag,
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUSES = ['all', 'pending', 'approved', 'rejected', 'completed'];

const STATUS_CONFIG = {
    pending:   { color: 'bg-yellow-100 text-yellow-800 border border-yellow-200', stripe: 'bg-yellow-400', icon: Clock },
    approved:  { color: 'bg-green-100 text-green-800 border border-green-200',   stripe: 'bg-green-400',  icon: Check },
    rejected:  { color: 'bg-red-100 text-red-800 border border-red-200',         stripe: 'bg-red-400',    icon: X },
    completed: { color: 'bg-blue-100 text-blue-800 border border-blue-200',      stripe: 'bg-blue-400',   icon: CheckCircle },
};

const TYPE_CONFIG = {
    return:   'bg-orange-100 text-orange-800 border border-orange-200',
    exchange: 'bg-purple-100 text-purple-800 border border-purple-200',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

// ─── Status Badge ──────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
    const config = STATUS_CONFIG[status] ?? { color: 'bg-gray-100 text-gray-700 border border-gray-200', icon: RefreshCw };
    const Icon   = config.icon;
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${config.color}`}
            style={{ borderRadius: '999px' }}
        >
            <Icon className="w-3 h-3" />
            {status}
        </span>
    );
};

// ─── Type Badge ────────────────────────────────────────────────────────────────

const TypeBadge = ({ type }) => (
    <span
        className={`inline-block px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${TYPE_CONFIG[type?.toLowerCase()] ?? 'bg-khajur-primary/10 text-khajur-primary border border-khajur-primary/20'}`}
        style={{ borderRadius: '999px' }}
    >
        {type}
    </span>
);

// ─── Filter Tabs ───────────────────────────────────────────────────────────────

const FilterTab = ({ status, active, count, onClick }) => (
    <button
        onClick={onClick}
        data-testid={`filter-${status}`}
        className={`px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
            active
                ? 'bg-khajur-primary text-white shadow-sm'
                : 'bg-khajur-cream border border-khajur-border text-khajur-primary hover:bg-khajur-primary/10'
        }`}
        style={{ borderRadius: '999px' }}
    >
        {status}{' '}
        <span className={`ml-0.5 ${active ? 'opacity-80' : 'opacity-60'}`}>({count})</span>
    </button>
);

// ─── Empty State ───────────────────────────────────────────────────────────────

const EmptyState = ({ status }) => (
    <div
        className="flex flex-col items-center justify-center py-20 bg-white border border-khajur-border text-center"
        style={{ borderRadius: '16px' }}
    >
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

// ─── Admin Review Panel ────────────────────────────────────────────────────────

const ReviewPanel = ({ returnId, onApprove, onReject, onCancel }) => {
    const [notes, setNotes] = useState('');

    return (
        <div className="space-y-4 p-4 bg-khajur-cream/50 border border-khajur-border" style={{ borderRadius: '12px' }}>
            {/* Notes textarea */}
            <div>
                <label className="flex items-center gap-2 text-xs font-bold text-khajur-dark/60 uppercase tracking-wide mb-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-khajur-gold" />
                    Admin Notes
                    <span className="text-khajur-dark/40 font-normal normal-case">(optional — sent to customer)</span>
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add a note for the customer regarding your decision…"
                    rows={3}
                    className="w-full bg-white border border-khajur-border focus:border-khajur-gold px-3.5 py-2.5 text-sm text-khajur-primary placeholder:text-khajur-dark/30 focus:outline-none focus:ring-2 focus:ring-khajur-gold transition-colors resize-none"
                    style={{ borderRadius: '10px' }}
                />
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2.5">
                <button
                    onClick={() => onApprove(returnId, notes)}
                    data-testid={`approve-${returnId}`}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors"
                    style={{ borderRadius: '10px' }}
                >
                    <Check className="w-4 h-4" />
                    Approve
                </button>
                <button
                    onClick={() => onReject(returnId, notes)}
                    data-testid={`reject-${returnId}`}
                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors"
                    style={{ borderRadius: '10px' }}
                >
                    <X className="w-4 h-4" />
                    Reject
                </button>
                <button
                    onClick={onCancel}
                    className="bg-white border border-khajur-border text-khajur-dark/70 hover:bg-khajur-cream px-5 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors"
                    style={{ borderRadius: '10px' }}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

// ─── Return Request Card ───────────────────────────────────────────────────────

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
}) => {
    const statusCfg = STATUS_CONFIG[returnReq.status] ?? { stripe: 'bg-gray-300' };

    return (
        <div
            className="bg-white border border-khajur-border overflow-hidden shadow-sm"
            style={{ borderRadius: '16px' }}
            data-testid={`return-${returnReq.id}`}
        >
            {/* Status stripe */}
            <div className={`h-1 w-full ${statusCfg.stripe}`} />

            {/* ── Card Header ── */}
            <div className="bg-khajur-cream/60 px-5 py-4 border-b border-khajur-border">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">

                    {/* Left: ID, status, type */}
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5">
                                <Hash className="w-3.5 h-3.5 text-khajur-gold" />
                                <span className="font-mono text-sm font-bold text-khajur-primary">
                                    {returnReq.id.substring(0, 16)}…
                                </span>
                            </div>
                            <StatusBadge status={returnReq.status} />
                            <TypeBadge type={returnReq.request_type} />
                        </div>

                        {/* Customer + Order meta */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="flex items-center gap-1 text-xs text-khajur-dark/60">
                                <User className="w-3 h-3 text-khajur-dark/40" />
                                {returnReq.customer_name}
                            </span>
                            <span className="text-xs text-khajur-dark/40 hidden sm:inline">·</span>
                            <span className="text-xs text-khajur-dark/50 truncate max-w-[200px]">
                                {returnReq.customer_email}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="flex items-center gap-1 text-xs text-khajur-dark/50">
                                <ShoppingBag className="w-3 h-3 text-khajur-dark/40" />
                                Order: <span className="font-mono font-semibold ml-0.5">#{returnReq.order_id.substring(0, 14)}…</span>
                            </span>
                            <span className="flex items-center gap-1 text-xs text-khajur-dark/40">
                                <Calendar className="w-3 h-3" />
                                {formatDate(returnReq.created_at)}
                            </span>
                        </div>
                    </div>

                    {/* Right: Delete button */}
                    <button
                        onClick={() => onDelete(returnReq.id)}
                        disabled={deletingId === returnReq.id}
                        className="flex items-center gap-1.5 py-2 px-3 bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 text-xs font-bold transition-colors disabled:opacity-40 self-start flex-shrink-0"
                        style={{ borderRadius: '8px' }}
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

            {/* ── Card Body ── */}
            <div className="p-5 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    {/* Items for return/exchange */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Package className="w-4 h-4 text-khajur-gold" />
                            <h4 className="text-xs font-bold uppercase tracking-wide text-khajur-dark/60">
                                Items for {returnReq.request_type}
                            </h4>
                        </div>
                        <div className="space-y-2 border border-khajur-border overflow-hidden" style={{ borderRadius: '10px' }}>
                            {returnReq.items.map((item, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center justify-between px-4 py-3 ${index < returnReq.items.length - 1 ? 'border-b border-khajur-border/50' : ''}`}
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-khajur-dark">{item.product_name}</p>
                                        <p className="text-xs text-khajur-dark/50 mt-0.5">Qty: {item.quantity}</p>
                                    </div>
                                    <p className="text-sm font-bold text-khajur-gold">₹{item.price}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Reason + Admin Notes */}
                    <div className="space-y-4">
                        {/* Reason */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="w-4 h-4 text-khajur-gold" />
                                <h4 className="text-xs font-bold uppercase tracking-wide text-khajur-dark/60">
                                    Customer Reason
                                </h4>
                            </div>
                            <p
                                className="text-sm text-khajur-dark/80 bg-khajur-cream/70 border border-khajur-border px-4 py-3 leading-relaxed"
                                style={{ borderRadius: '10px' }}
                            >
                                {returnReq.reason}
                            </p>
                        </div>

                        {/* Admin notes (if set) */}
                        {returnReq.admin_notes && (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Check className="w-4 h-4 text-blue-500" />
                                    <h4 className="text-xs font-bold uppercase tracking-wide text-blue-600/70">
                                        Admin Notes
                                    </h4>
                                </div>
                                <p
                                    className="text-sm text-blue-800 bg-blue-50 border border-blue-200 px-4 py-3 leading-relaxed"
                                    style={{ borderRadius: '10px' }}
                                >
                                    {returnReq.admin_notes}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Action Zone ── */}

                {/* Pending → show Review panel or trigger button */}
                {returnReq.status === 'pending' && (
                    <div className="pt-4 border-t border-khajur-border/60">
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
                                className="flex items-center gap-2 bg-khajur-gold hover:bg-khajur-gold/90 text-khajur-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors shadow-sm"
                                style={{ borderRadius: '10px' }}
                            >
                                <MessageSquare className="w-4 h-4" />
                                Review Request
                            </button>
                        )}
                    </div>
                )}

                {/* Approved → show Mark as Completed button */}
                {returnReq.status === 'approved' && (
                    <div className="pt-4 border-t border-khajur-border/60">
                        <button
                            onClick={() => onComplete(returnReq.id)}
                            data-testid={`complete-${returnReq.id}`}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors shadow-sm"
                            style={{ borderRadius: '10px' }}
                        >
                            <CheckCircle className="w-4 h-4" />
                            Mark as Completed
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Main AdminReturns Component ───────────────────────────────────────────────

const AdminReturns = () => {
    const { token }  = useAuth();
    const navigate   = useNavigate();

    const [returns,        setReturns]        = useState([]);
    const [loading,        setLoading]        = useState(true);
    const [refreshing,     setRefreshing]     = useState(false);
    const [isAdmin,        setIsAdmin]        = useState(false);
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [filterStatus,   setFilterStatus]   = useState('all');
    const [deletingId,     setDeletingId]     = useState(null);

    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // ─── Fetch Returns ─────────────────────────────────────────────────────────

    const fetchReturns = useCallback(async (silent = false) => {
        if (silent) setRefreshing(true);
        try {
            const { data } = await axios.get(`${API}/admin/returns`, authHeaders);
            setReturns(data);
        } catch {
            toast.error('Failed to load return requests.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Check Admin ───────────────────────────────────────────────────────────

    const checkAdmin = useCallback(async () => {
        try {
            await axios.get(`${API}/admin/check`, authHeaders);
            setIsAdmin(true);
            fetchReturns();
        } catch {
            toast.error('Admin access required.');
            navigate('/');
        }
    }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { checkAdmin(); }, [checkAdmin]);

    // ─── Update Status ─────────────────────────────────────────────────────────

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

    // ─── Delete Return ─────────────────────────────────────────────────────────

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

    // ─── Derived State ─────────────────────────────────────────────────────────

    const filteredReturns = filterStatus === 'all'
        ? returns
        : returns.filter((r) => r.status === filterStatus);

    const statusCounts = STATUSES.reduce((acc, s) => {
        acc[s] = s === 'all' ? returns.length : returns.filter((r) => r.status === s).length;
        return acc;
    }, {});

    // ─── Loading Screen ────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-khajur-dark/50 bg-white">
                <Loader2 className="w-9 h-9 animate-spin text-khajur-primary" />
                <p className="text-sm font-medium">Loading return requests…</p>
            </div>
        );
    }

    // ─── Access Denied ─────────────────────────────────────────────────────────

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6 bg-white">
                <div
                    className="w-20 h-20 bg-red-50 border border-red-200 flex items-center justify-center mb-2"
                    style={{ borderRadius: '999px' }}
                >
                    <AlertTriangle className="w-10 h-10 text-red-400" />
                </div>
                <h1 className="font-serif text-3xl font-medium text-khajur-primary">Access Denied</h1>
                <p className="text-sm text-khajur-dark/50">You do not have permission to view this page.</p>
                <Link
                    to="/"
                    className="text-khajur-gold underline underline-offset-2 text-sm hover:text-khajur-primary transition-colors"
                >
                    Return to Home
                </Link>
            </div>
        );
    }

    // ─── Main Render ───────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen py-20 bg-white" data-testid="admin-returns-page">
            <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">

                {/* ── Page Header ── */}
                <div className="flex items-start gap-3 mb-8">

                    {/* Back button */}
                    <Link
                        to="/admin/dashboard"
                        className="mt-1.5 flex items-center justify-center w-9 h-9 border border-khajur-border text-khajur-primary hover:text-khajur-gold hover:border-khajur-gold transition-colors flex-shrink-0"
                        style={{ borderRadius: '999px' }}
                        aria-label="Back to dashboard"
                        data-testid="back-to-admin"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Link>

                    {/* Title block */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="inline-block w-2 h-2 bg-green-500 flex-shrink-0" style={{ borderRadius: '999px' }} />
                            <p className="text-xs uppercase tracking-widest text-khajur-gold font-semibold">
                                KhajurKart Administrator
                            </p>
                        </div>
                        <h1 className="font-serif text-3xl md:text-4xl font-medium text-khajur-primary leading-tight">
                            Returns &amp; Exchanges
                        </h1>
                        <p className="text-sm text-khajur-dark/50 mt-1">
                            Review and process customer return and exchange requests
                        </p>
                    </div>

                    {/* Refresh button */}
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <button
                            onClick={() => fetchReturns(true)}
                            disabled={refreshing}
                            className="flex items-center gap-1.5 px-3 py-2 border border-khajur-border text-xs font-semibold text-khajur-primary hover:bg-khajur-cream transition-colors disabled:opacity-50"
                            style={{ borderRadius: '999px' }}
                            aria-label="Refresh returns"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        {/* Total count badge */}
                        <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-khajur-primary/10 text-khajur-primary text-xs font-bold"
                            style={{ borderRadius: '999px' }}
                        >
                            <Package className="w-3 h-3" />
                            {returns.length}
                        </span>
                    </div>
                </div>

                {/* ── Status Filter Tabs ── */}
                <div className="flex flex-wrap gap-2 mb-6">
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

                {/* ── Summary count ── */}
                <p className="text-sm text-khajur-dark/50 mb-6">
                    Showing{' '}
                    <span className="font-bold text-khajur-primary">{filteredReturns.length}</span>
                    {' '}of{' '}
                    <span className="font-bold text-khajur-primary">{returns.length}</span>
                    {' '}requests
                </p>

                {/* ── Content ── */}
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
                                onReject={(id, notes)  => updateStatus(id, 'rejected', notes)}
                                onComplete={(id)       => updateStatus(id, 'completed')}
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
