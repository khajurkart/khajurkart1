import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
    Tag,
    Plus,
    X,
    ToggleLeft,
    ToggleRight,
    Trash2,
    CheckCircle,
    XCircle,
    Gift,
    Loader2,
    RefreshCw,
    Copy,
    Calendar,
    Percent,
    IndianRupee,
    Search,
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ─── Sub-Components ────────────────────────────────────────────────────────────

const FieldLabel = ({ children, required }) => (
    <label className="block text-xs uppercase tracking-wide font-bold text-khajur-dark/60 mb-1.5">
        {children}
        {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
);

const inputCls = `
    w-full border border-khajur-border bg-white
    px-3.5 py-2.5 text-sm text-khajur-primary
    focus:outline-none focus:ring-2 focus:ring-khajur-gold
    transition-all duration-200
    placeholder:text-khajur-dark/30
`;

// ─── System Toggle Card ────────────────────────────────────────────────────────

const SystemToggleCard = ({ enabled, onToggle, toggling }) => (
    <div
        className="bg-white border border-khajur-border p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
        style={{ borderRadius: '16px' }}
    >
        <div className="flex items-start gap-4">
            <div
                className={`w-11 h-11 flex items-center justify-center flex-shrink-0 ${
                    enabled ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'
                }`}
                style={{ borderRadius: '12px' }}
            >
                <Tag className="w-5 h-5" />
            </div>
            <div>
                <div className="flex items-center gap-2">
                    <p className="font-bold text-khajur-primary text-sm uppercase tracking-wider">
                        Coupon System
                    </p>
                    <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                            enabled
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-red-100 text-red-700 border border-red-200'
                        }`}
                        style={{ borderRadius: '999px' }}
                    >
                        {enabled ? 'Enabled' : 'Disabled'}
                    </span>
                </div>
                <p className={`text-sm mt-1 ${enabled ? 'text-green-700' : 'text-khajur-dark/55'}`}>
                    {enabled
                        ? 'Customers can apply promo & welcome coupons at checkout.'
                        : 'Coupon input is currently hidden from all customers.'}
                </p>
            </div>
        </div>

        <button
            type="button"
            onClick={onToggle}
            disabled={toggling}
            className={`
                w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5
                font-bold text-xs uppercase tracking-wider
                transition-all duration-200 flex-shrink-0 disabled:opacity-50
                ${enabled
                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                    : 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
                }
            `}
            style={{ borderRadius: '10px' }}
        >
            {toggling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : enabled ? (
                <><ToggleRight className="w-4 h-4" /> Turn OFF</>
            ) : (
                <><ToggleLeft className="w-4 h-4" /> Turn ON</>
            )}
        </button>
    </div>
);

// ─── Coupon Card ───────────────────────────────────────────────────────────────

const CouponCard = ({ coupon, onToggle, onDelete, togglingId, deletingId }) => {
    const uses = Number(coupon.uses || 0);
    const maxUses = Number(coupon.max_uses || 100);
    const usagePct = maxUses > 0 ? Math.min(100, Math.round((uses / maxUses) * 100)) : 0;

    const handleCopy = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(coupon.code);
            toast.success(`Copied "${coupon.code}" to clipboard`);
        }
    };

    return (
        <div
            className={`
                bg-white border overflow-hidden shadow-sm transition-all duration-200
                ${coupon.is_active
                    ? 'border-khajur-border hover:border-khajur-gold/50'
                    : 'border-gray-200 bg-gray-50/70 opacity-75'
                }
            `}
            style={{ borderRadius: '16px' }}
        >
            {/* Top Status Stripe */}
            <div
                className={`h-1 w-full ${
                    !coupon.is_active
                        ? 'bg-gray-300'
                        : coupon.is_welcome
                            ? 'bg-amber-400'
                            : 'bg-green-400'
                }`}
            />

            <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left — Info */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div
                        className={`w-11 h-11 flex items-center justify-center flex-shrink-0 ${
                            coupon.is_welcome
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-khajur-cream text-khajur-gold'
                        }`}
                        style={{ borderRadius: '12px' }}
                    >
                        {coupon.is_welcome ? <Gift className="w-5 h-5" /> : <Tag className="w-5 h-5" />}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                        {/* Code + Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={handleCopy}
                                title="Copy coupon code"
                                className="inline-flex items-center gap-1.5 font-mono font-bold text-khajur-primary text-base tracking-wider hover:text-khajur-gold transition-colors"
                            >
                                <span>{coupon.code}</span>
                                <Copy className="w-3.5 h-3.5 text-khajur-dark/35" />
                            </button>

                            {coupon.is_welcome && (
                                <span
                                    className="bg-amber-100 text-amber-800 border border-amber-200 text-[11px] px-2.5 py-0.5 font-bold"
                                    style={{ borderRadius: '999px' }}
                                >
                                    Welcome
                                </span>
                            )}

                            {coupon.is_active ? (
                                <span
                                    className="inline-flex items-center gap-1 bg-green-100 text-green-800 border border-green-200 text-[11px] px-2.5 py-0.5 font-bold"
                                    style={{ borderRadius: '999px' }}
                                >
                                    <CheckCircle className="w-3 h-3" /> Active
                                </span>
                            ) : (
                                <span
                                    className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 border border-gray-200 text-[11px] px-2.5 py-0.5 font-bold"
                                    style={{ borderRadius: '999px' }}
                                >
                                    <XCircle className="w-3 h-3" /> Inactive
                                </span>
                            )}
                        </div>

                        {/* Discount & Conditions */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-khajur-dark/70">
                            <span
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-khajur-gold/10 text-khajur-primary font-bold"
                                style={{ borderRadius: '8px' }}
                            >
                                {coupon.discount_type === 'percent' ? (
                                    <><Percent className="w-3 h-3 text-khajur-gold" /> {coupon.discount_percent}% OFF</>
                                ) : (
                                    <><IndianRupee className="w-3 h-3 text-khajur-gold" /> ₹{coupon.discount_amount} OFF</>
                                )}
                            </span>

                            {coupon.min_order > 0 && (
                                <span
                                    className="px-2.5 py-1 bg-khajur-cream border border-khajur-border/60 font-medium"
                                    style={{ borderRadius: '8px' }}
                                >
                                    Min ₹{coupon.min_order}
                                </span>
                            )}

                            {coupon.expiry && (
                                <span
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-khajur-cream border border-khajur-border/60 font-medium"
                                    style={{ borderRadius: '8px' }}
                                >
                                    <Calendar className="w-3 h-3 text-khajur-dark/45" />
                                    Exp:{' '}
                                    {new Date(coupon.expiry).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </span>
                            )}
                        </div>

                        {/* Usage Progress */}
                        <div className="max-w-xs space-y-1">
                            <div className="flex items-center justify-between text-[11px] text-khajur-dark/55 font-medium">
                                <span>Redemptions</span>
                                <span className="font-mono font-bold text-khajur-primary">
                                    {uses} / {maxUses}
                                </span>
                            </div>
                            <div className="h-1.5 w-full bg-khajur-cream rounded-full overflow-hidden border border-khajur-border/50">
                                <div
                                    className="h-full bg-khajur-gold rounded-full transition-all duration-300"
                                    style={{ width: `${usagePct}%` }}
                                />
                            </div>
                        </div>

                        {coupon.description && (
                            <p className="text-xs text-khajur-dark/50 italic">
                                "{coupon.description}"
                            </p>
                        )}
                    </div>
                </div>

                {/* Right — Actions */}
                <div className="flex items-center gap-2.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-khajur-border/50 flex-shrink-0">
                    <button
                        type="button"
                        onClick={() => onToggle(coupon.id)}
                        disabled={togglingId === coupon.id}
                        className={`
                            flex-1 lg:flex-initial flex items-center justify-center gap-1.5 text-xs px-4 py-2.5 font-bold uppercase tracking-wide
                            transition-all duration-200 disabled:opacity-50
                            ${coupon.is_active
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                                : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                            }
                        `}
                        style={{ borderRadius: '10px' }}
                    >
                        {togglingId === coupon.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {coupon.is_active ? 'Deactivate' : 'Activate'}
                    </button>

                    <button
                        type="button"
                        onClick={() => onDelete(coupon.id, coupon.code)}
                        disabled={deletingId === coupon.id}
                        className="
                            flex items-center justify-center gap-1.5 text-xs px-4 py-2.5
                            font-bold uppercase tracking-wide
                            bg-red-50 text-red-600 border border-red-200
                            hover:bg-red-100 transition-all duration-200 disabled:opacity-50
                        "
                        style={{ borderRadius: '10px' }}
                    >
                        {deletingId === coupon.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />
                        }
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Create Coupon Form ────────────────────────────────────────────────────────

const EMPTY_FORM = {
    code: '',
    discount_type: 'percent',
    discount_percent: '',
    discount_amount: '',
    min_order: '',
    max_uses: '100',
    expiry: '',
    description: '',
    is_active: true,
    is_welcome: false,
};

const CreateCouponForm = ({ onSubmit, onCancel }) => {
    const [form, setForm] = useState(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const set = (field) => (e) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const setCheck = (field) => (e) =>
        setForm((prev) => ({ ...prev, [field]: e.target.checked }));

    const validate = () => {
        const errs = {};
        if (!form.code.trim()) errs.code = 'Coupon code is required';
        if (form.discount_type === 'percent') {
            const pct = Number(form.discount_percent);
            if (!form.discount_percent || isNaN(pct) || pct < 1 || pct > 100)
                errs.discount_percent = 'Enter a percentage between 1 and 100';
        } else {
            const amt = Number(form.discount_amount);
            if (!form.discount_amount || isNaN(amt) || amt < 1)
                errs.discount_amount = 'Enter a valid amount';
        }
        if (form.max_uses && Number(form.max_uses) < 1)
            errs.max_uses = 'Must be at least 1';
        return errs;
    };

    const buildPayload = () => {
        const payload = {
            code: form.code.trim().toUpperCase(),
            discount_type: form.discount_type,
            min_order: form.min_order === '' ? 0 : Number(form.min_order),
            max_uses: form.max_uses === '' ? 100 : Number(form.max_uses),
            description: form.description.trim() || null,
            is_active: Boolean(form.is_active),
            is_welcome: Boolean(form.is_welcome),
            expiry: form.expiry || null,
        };

        if (form.discount_type === 'percent') {
            payload.discount_percent = Number(form.discount_percent);
            payload.discount_amount = null;
        } else {
            payload.discount_amount = Number(form.discount_amount);
            payload.discount_percent = null;
        }

        return payload;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }
        setErrors({});
        setSubmitting(true);
        try {
            await onSubmit(buildPayload());
        } catch {
            // error already toasted in parent
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="bg-white border border-khajur-gold/40 p-5 sm:p-6 shadow-sm"
            style={{ borderRadius: '16px' }}
        >
            {/* Form Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-khajur-border">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 bg-khajur-gold/15 flex items-center justify-center"
                        style={{ borderRadius: '10px' }}
                    >
                        <Tag className="w-5 h-5 text-khajur-gold" />
                    </div>
                    <div>
                        <h3 className="font-serif text-xl font-medium text-khajur-primary">
                            Create New Coupon
                        </h3>
                        <p className="text-xs text-khajur-dark/50">
                            Configure discount rules, limits, and validity
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onCancel}
                    className="p-2 text-khajur-dark/40 hover:text-khajur-primary hover:bg-khajur-cream transition-colors"
                    style={{ borderRadius: '999px' }}
                    aria-label="Close form"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    {/* Code */}
                    <div>
                        <FieldLabel required>Coupon Code</FieldLabel>
                        <input
                            type="text"
                            value={form.code}
                            onChange={(e) =>
                                setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))
                            }
                            placeholder="e.g. WELCOME10"
                            className={`${inputCls} font-mono tracking-widest ${errors.code ? 'border-red-400' : ''}`}
                            style={{ borderRadius: '10px' }}
                            data-testid="coupon-code-input"
                        />
                        {errors.code && (
                            <p className="text-xs text-red-500 mt-1">{errors.code}</p>
                        )}
                    </div>

                    {/* Discount Type */}
                    <div>
                        <FieldLabel required>Discount Type</FieldLabel>
                        <select
                            value={form.discount_type}
                            onChange={(e) => {
                                setForm((p) => ({
                                    ...p,
                                    discount_type: e.target.value,
                                    discount_percent: '',
                                    discount_amount: '',
                                }));
                                setErrors((p) => ({
                                    ...p,
                                    discount_percent: undefined,
                                    discount_amount: undefined,
                                }));
                            }}
                            className={`${inputCls} cursor-pointer`}
                            style={{ borderRadius: '10px' }}
                        >
                            <option value="percent">Percentage (%)</option>
                            <option value="fixed">Fixed Amount (₹)</option>
                        </select>
                    </div>

                    {/* Discount Value */}
                    {form.discount_type === 'percent' ? (
                        <div>
                            <FieldLabel required>Discount Percentage (%)</FieldLabel>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={form.discount_percent}
                                onChange={set('discount_percent')}
                                placeholder="e.g. 10"
                                className={`${inputCls} ${errors.discount_percent ? 'border-red-400' : ''}`}
                                style={{ borderRadius: '10px' }}
                                data-testid="coupon-discount-percent"
                            />
                            {errors.discount_percent && (
                                <p className="text-xs text-red-500 mt-1">{errors.discount_percent}</p>
                            )}
                        </div>
                    ) : (
                        <div>
                            <FieldLabel required>Discount Amount (₹)</FieldLabel>
                            <input
                                type="number"
                                min="1"
                                value={form.discount_amount}
                                onChange={set('discount_amount')}
                                placeholder="e.g. 50"
                                className={`${inputCls} ${errors.discount_amount ? 'border-red-400' : ''}`}
                                style={{ borderRadius: '10px' }}
                                data-testid="coupon-discount-amount"
                            />
                            {errors.discount_amount && (
                                <p className="text-xs text-red-500 mt-1">{errors.discount_amount}</p>
                            )}
                        </div>
                    )}

                    {/* Min Order */}
                    <div>
                        <FieldLabel>Minimum Order Amount (₹)</FieldLabel>
                        <input
                            type="number"
                            min="0"
                            value={form.min_order}
                            onChange={set('min_order')}
                            placeholder="0 = no minimum"
                            className={inputCls}
                            style={{ borderRadius: '10px' }}
                        />
                    </div>

                    {/* Max Uses */}
                    <div>
                        <FieldLabel>Maximum Uses</FieldLabel>
                        <input
                            type="number"
                            min="1"
                            value={form.max_uses}
                            onChange={set('max_uses')}
                            placeholder="100"
                            className={`${inputCls} ${errors.max_uses ? 'border-red-400' : ''}`}
                            style={{ borderRadius: '10px' }}
                        />
                        {errors.max_uses && (
                            <p className="text-xs text-red-500 mt-1">{errors.max_uses}</p>
                        )}
                    </div>

                    {/* Expiry */}
                    <div>
                        <FieldLabel>Expiry Date (optional)</FieldLabel>
                        <input
                            type="date"
                            value={form.expiry}
                            onChange={set('expiry')}
                            min={new Date().toISOString().split('T')[0]}
                            className={inputCls}
                            style={{ borderRadius: '10px' }}
                        />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                        <FieldLabel>Description (shown to customer)</FieldLabel>
                        <input
                            type="text"
                            value={form.description}
                            onChange={set('description')}
                            placeholder="e.g. Welcome offer for new customers"
                            className={inputCls}
                            style={{ borderRadius: '10px' }}
                        />
                    </div>

                    {/* Toggle Options */}
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <label
                            className="flex items-center gap-3 cursor-pointer p-3 border border-khajur-border hover:bg-khajur-cream/50 transition-colors"
                            style={{ borderRadius: '10px' }}
                        >
                            <input
                                type="checkbox"
                                checked={form.is_active}
                                onChange={setCheck('is_active')}
                                className="w-4 h-4 accent-khajur-gold"
                            />
                            <span className="text-sm font-semibold text-khajur-primary">
                                Active immediately
                            </span>
                        </label>

                        <label
                            className="flex items-center gap-3 cursor-pointer p-3 border border-khajur-border hover:bg-khajur-cream/50 transition-colors"
                            style={{ borderRadius: '10px' }}
                        >
                            <input
                                type="checkbox"
                                checked={form.is_welcome}
                                onChange={setCheck('is_welcome')}
                                className="w-4 h-4 accent-khajur-gold"
                            />
                            <span className="text-sm font-semibold text-khajur-primary flex items-center gap-1.5">
                                <Gift className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                Welcome coupon (first order)
                            </span>
                        </label>
                    </div>
                </div>

                {/* Live Preview */}
                {form.code && (
                    <div
                        className="bg-khajur-cream border border-khajur-border px-4 py-3 flex items-center gap-3"
                        style={{ borderRadius: '12px' }}
                    >
                        <Tag className="w-4 h-4 text-khajur-gold flex-shrink-0" />
                        <div className="text-xs text-khajur-dark/75">
                            <span className="font-mono font-bold text-khajur-primary mr-2">
                                {form.code}
                            </span>
                            {form.discount_type === 'percent' && form.discount_percent
                                ? `${form.discount_percent}% off`
                                : form.discount_amount
                                    ? `₹${form.discount_amount} off`
                                    : '—'}
                            {form.min_order > 0 && ` · Min ₹${form.min_order}`}
                            {form.max_uses && ` · Max ${form.max_uses} uses`}
                            {form.is_welcome && ' · Welcome'}
                        </div>
                    </div>
                )}

                {/* Submit Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 border-t border-khajur-border">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="
                            flex items-center justify-center gap-2
                            bg-khajur-primary text-khajur-cream
                            px-8 py-3 font-bold text-xs uppercase tracking-widest
                            hover:bg-khajur-primary/90 transition-all duration-200
                            disabled:opacity-50 disabled:cursor-not-allowed
                        "
                        style={{ borderRadius: '10px' }}
                    >
                        {submitting
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                            : <><Plus className="w-4 h-4" /> Create Coupon</>
                        }
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="
                            px-6 py-3 font-bold text-xs uppercase tracking-widest
                            border border-khajur-border text-khajur-dark/60
                            hover:border-khajur-primary hover:text-khajur-primary
                            transition-all duration-200
                        "
                        style={{ borderRadius: '10px' }}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const CouponManager = ({ token }) => {
    const [coupons, setCoupons] = useState([]);
    const [systemEnabled, setSystemEnabled] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [loadingCoupons, setLoadingCoupons] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [togglingSystem, setTogglingSystem] = useState(false);
    const [togglingId, setTogglingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const headers = { Authorization: `Bearer ${token}` };

    const fetchCoupons = useCallback(async (silent = false) => {
        if (silent) {
            setRefreshing(true);
        } else {
            setLoadingCoupons(true);
        }
        try {
            const res = await axios.get(`${API}/admin/coupons`, { headers });
            setCoupons(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Fetch coupons error:', err.response?.data || err.message);
            toast.error('Failed to load coupons');
            setCoupons([]);
        } finally {
            setLoadingCoupons(false);
            setRefreshing(false);
        }
    }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchSystemStatus = useCallback(async () => {
        try {
            const res = await axios.get(`${API}/coupon-system/status`);
            setSystemEnabled(Boolean(res.data.enabled));
        } catch {
            // silent
        }
    }, []);

    useEffect(() => {
        fetchCoupons();
        fetchSystemStatus();
    }, [fetchCoupons, fetchSystemStatus]);

    const toggleSystem = async () => {
        setTogglingSystem(true);
        try {
            const res = await axios.post(
                `${API}/admin/coupon-system/toggle?enabled=${!systemEnabled}`,
                {},
                { headers }
            );
            setSystemEnabled(!systemEnabled);
            toast.success(res.data.message || 'Coupon system updated');
        } catch (err) {
            console.error('Toggle system error:', err.response?.data || err.message);
            toast.error('Failed to toggle coupon system');
        } finally {
            setTogglingSystem(false);
        }
    };

    const handleCreateCoupon = async (payload) => {
        try {
            await axios.post(`${API}/admin/coupons`, payload, { headers });
            toast.success(`Coupon "${payload.code}" created successfully!`);
            setShowForm(false);
            fetchCoupons(true);
        } catch (err) {
            const detail = err.response?.data?.detail;
            console.error('Create coupon error:', err.response?.data);
            if (Array.isArray(detail)) {
                const messages = detail.map((d) => `${d.loc?.join(' → ')}: ${d.msg}`).join('\n');
                toast.error(`Validation error:\n${messages}`);
            } else {
                toast.error(detail || 'Failed to create coupon');
            }
            throw err;
        }
    };

    const toggleCoupon = async (couponId) => {
        setTogglingId(couponId);
        try {
            const res = await axios.patch(
                `${API}/admin/coupons/${couponId}/toggle`,
                {},
                { headers }
            );
            toast.success(res.data.message || 'Coupon updated');
            fetchCoupons(true);
        } catch (err) {
            console.error('Toggle coupon error:', err.response?.data);
            toast.error('Failed to toggle coupon');
        } finally {
            setTogglingId(null);
        }
    };

    const deleteCoupon = async (couponId, code) => {
        if (!window.confirm(`Delete coupon "${code}"? This cannot be undone.`)) return;
        setDeletingId(couponId);
        try {
            await axios.delete(`${API}/admin/coupons/${couponId}`, { headers });
            toast.success(`Coupon "${code}" deleted.`);
            fetchCoupons(true);
        } catch (err) {
            console.error('Delete coupon error:', err.response?.data);
            toast.error('Failed to delete coupon');
        } finally {
            setDeletingId(null);
        }
    };

    // ─── Derived ───────────────────────────────────────────────────────────────
    const activeCoupons = coupons.filter((c) => c.is_active);
    const inactiveCoupons = coupons.filter((c) => !c.is_active);
    const welcomeCoupons = coupons.filter((c) => c.is_welcome);

    const filteredCoupons = coupons.filter((c) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
            !q ||
            c.code?.toLowerCase().includes(q) ||
            c.description?.toLowerCase().includes(q);
        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && c.is_active) ||
            (statusFilter === 'inactive' && !c.is_active) ||
            (statusFilter === 'welcome' && c.is_welcome);
        return matchesSearch && matchesStatus;
    });

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">

            {/* ── Section Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span
                            className="inline-block w-2 h-2 bg-green-500 flex-shrink-0"
                            style={{ borderRadius: '999px' }}
                        />
                        <p className="text-xs uppercase tracking-widest text-khajur-gold font-semibold">
                            Promotions
                        </p>
                    </div>
                    <h2 className="font-serif text-2xl sm:text-3xl font-medium text-khajur-primary">
                        Coupon Management
                    </h2>
                </div>

                {/* Quick Stats + Refresh */}
                <div className="flex items-center justify-between sm:justify-end gap-3">
                    <div
                        className="flex items-center gap-4 px-4 py-2 bg-khajur-cream/70 border border-khajur-border text-center"
                        style={{ borderRadius: '12px' }}
                    >
                        <div>
                            <p className="font-bold text-base text-khajur-primary leading-tight">{coupons.length}</p>
                            <p className="text-[10px] text-khajur-dark/50 uppercase tracking-wider font-semibold">Total</p>
                        </div>
                        <div className="w-px h-6 bg-khajur-border" />
                        <div>
                            <p className="font-bold text-base text-green-600 leading-tight">{activeCoupons.length}</p>
                            <p className="text-[10px] text-khajur-dark/50 uppercase tracking-wider font-semibold">Active</p>
                        </div>
                        <div className="w-px h-6 bg-khajur-border" />
                        <div>
                            <p className="font-bold text-base text-amber-600 leading-tight">{welcomeCoupons.length}</p>
                            <p className="text-[10px] text-khajur-dark/50 uppercase tracking-wider font-semibold">Welcome</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => fetchCoupons(true)}
                        disabled={refreshing}
                        className="flex items-center justify-center w-10 h-10 border border-khajur-border text-khajur-primary hover:bg-khajur-cream transition-colors disabled:opacity-50"
                        style={{ borderRadius: '999px' }}
                        aria-label="Refresh coupons"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* ── System Toggle ── */}
            <SystemToggleCard
                enabled={systemEnabled}
                onToggle={toggleSystem}
                toggling={togglingSystem}
            />

            {/* ── Create Button ── */}
            {!showForm && (
                <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="
                        w-full sm:w-auto flex items-center justify-center gap-2
                        bg-khajur-gold text-khajur-primary
                        px-6 py-3 font-bold text-xs uppercase tracking-widest
                        hover:bg-khajur-gold/90 shadow-sm
                        transition-all duration-200
                    "
                    style={{ borderRadius: '12px' }}
                >
                    <Plus className="w-4 h-4" />
                    Create New Coupon
                </button>
            )}

            {/* ── Create Form ── */}
            {showForm && (
                <CreateCouponForm
                    onSubmit={handleCreateCoupon}
                    onCancel={() => setShowForm(false)}
                />
            )}

            {/* ── Divider ── */}
            <div className="border-t border-khajur-border" />

            {/* ── Search & Filter Bar ── */}
            {coupons.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-khajur-dark/30 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search by code or description…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 text-sm border border-khajur-border bg-white text-khajur-primary placeholder:text-khajur-dark/30 focus:outline-none focus:ring-2 focus:ring-khajur-gold shadow-sm"
                            style={{ borderRadius: '12px' }}
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: 'all', label: `All (${coupons.length})` },
                            { id: 'active', label: `Active (${activeCoupons.length})` },
                            { id: 'inactive', label: `Inactive (${inactiveCoupons.length})` },
                            { id: 'welcome', label: `Welcome (${welcomeCoupons.length})` },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setStatusFilter(tab.id)}
                                className={`px-3.5 py-1.5 text-xs font-bold transition-colors ${
                                    statusFilter === tab.id
                                        ? 'bg-khajur-primary text-white shadow-sm'
                                        : 'bg-khajur-cream border border-khajur-border text-khajur-primary hover:bg-khajur-primary/10'
                                }`}
                                style={{ borderRadius: '999px' }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Coupons List ── */}
            <div>
                <h3 className="text-xs uppercase tracking-widest font-bold text-khajur-dark/45 mb-4">
                    Showing {filteredCoupons.length} of {coupons.length} coupons
                </h3>

                {loadingCoupons ? (
                    <div className="flex items-center justify-center py-16 gap-3 text-khajur-dark/45">
                        <Loader2 className="w-5 h-5 animate-spin text-khajur-primary" />
                        <span className="text-sm font-medium">Loading coupons…</span>
                    </div>
                ) : filteredCoupons.length === 0 ? (
                    <div
                        className="flex flex-col items-center justify-center py-16 gap-3 text-center border border-khajur-border bg-white shadow-sm"
                        style={{ borderRadius: '16px' }}
                    >
                        <div
                            className="w-12 h-12 bg-khajur-cream flex items-center justify-center"
                            style={{ borderRadius: '999px' }}
                        >
                            <Tag className="w-6 h-6 text-khajur-dark/25" />
                        </div>
                        <p className="text-khajur-dark/55 text-sm font-medium">
                            {coupons.length === 0
                                ? 'No coupons yet. Create your first one above!'
                                : 'No coupons match your search or filter.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3.5">
                        {filteredCoupons.map((coupon) => (
                            <CouponCard
                                key={coupon.id}
                                coupon={coupon}
                                onToggle={toggleCoupon}
                                onDelete={deleteCoupon}
                                togglingId={togglingId}
                                deletingId={deletingId}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CouponManager;
