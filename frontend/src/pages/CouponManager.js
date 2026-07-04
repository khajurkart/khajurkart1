import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ─── Sub-Components ────────────────────────────────────────────────────────────

const FieldLabel = ({ children, required }) => (
    <label className="block text-xs uppercase tracking-widest font-medium text-khajur-dark/50 mb-1.5">
        {children}
        {required && <span className="text-khajur-gold ml-1">*</span>}
    </label>
);

const inputCls = `
    w-full border border-khajur-border bg-white
    px-3 py-2.5 text-sm text-khajur-primary
    rounded-sm focus:outline-none focus:border-khajur-gold
    transition-colors duration-200
    placeholder:text-khajur-dark/30
`;

// ── System Toggle Card ─────────────────────────────────────────────────────────

const SystemToggleCard = ({ enabled, onToggle }) => (
    <div className="bg-white border border-khajur-border rounded-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0 ${enabled ? 'bg-green-50' : 'bg-red-50'}`}>
                <Tag className={`w-5 h-5 ${enabled ? 'text-green-600' : 'text-red-400'}`} />
            </div>
            <div>
                <p className="font-semibold text-khajur-primary text-sm uppercase tracking-widest">
                    Coupon System
                </p>
                <p className={`text-sm mt-0.5 ${enabled ? 'text-green-600' : 'text-khajur-dark/50'}`}>
                    {enabled
                        ? '✅ Customers can apply coupons at checkout'
                        : '❌ Coupon input is hidden from all customers'
                    }
                </p>
            </div>
        </div>
        <button
            onClick={onToggle}
            className={`
                flex items-center gap-2 px-6 py-2.5 rounded-sm
                font-bold text-xs uppercase tracking-widest
                transition-all duration-200 flex-shrink-0
                ${enabled
                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                    : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
                }
            `}
        >
            {enabled
                ? <><ToggleRight className="w-4 h-4" /> Turn OFF</>
                : <><ToggleLeft className="w-4 h-4" /> Turn ON</>
            }
        </button>
    </div>
);

// ── Coupon Card ────────────────────────────────────────────────────────────────

const CouponCard = ({ coupon, onToggle, onDelete }) => (
    <div className={`
        bg-white border rounded-sm p-5
        flex flex-col md:flex-row md:items-center justify-between gap-4
        transition-all duration-200
        ${coupon.is_active
            ? 'border-khajur-border hover:border-khajur-gold/40 hover:shadow-sm'
            : 'border-gray-100 bg-gray-50/50 opacity-60'
        }
    `}>
        {/* Left — Info */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className={`
                w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0
                ${coupon.is_welcome ? 'bg-yellow-50' : 'bg-khajur-cream'}
            `}>
                {coupon.is_welcome
                    ? <Gift className="w-5 h-5 text-yellow-600" />
                    : <Tag className="w-5 h-5 text-khajur-gold" />
                }
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-khajur-primary text-base tracking-wider">
                        {coupon.code}
                    </span>
                    {coupon.is_welcome && (
                        <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                            Welcome
                        </span>
                    )}
                    {coupon.is_active ? (
                        <span className="flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                            <CheckCircle className="w-3 h-3" /> Active
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full font-semibold">
                            <XCircle className="w-3 h-3" /> Inactive
                        </span>
                    )}
                </div>

                <p className="text-sm text-khajur-dark/60">
                    <span className="font-semibold text-khajur-primary">
                        {coupon.discount_type === 'percent'
                            ? `${coupon.discount_percent}% off`
                            : `₹${coupon.discount_amount} off`
                        }
                    </span>
                    {coupon.min_order > 0 && (
                        <span className="before:content-['·'] before:mx-2">
                            Min ₹{coupon.min_order}
                        </span>
                    )}
                    <span className="before:content-['·'] before:mx-2">
                        {coupon.uses || 0}/{coupon.max_uses} used
                    </span>
                    {coupon.expiry && (
                        <span className="before:content-['·'] before:mx-2">
                            Expires {new Date(coupon.expiry).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric',
                            })}
                        </span>
                    )}
                </p>

                {coupon.description && (
                    <p className="text-xs text-khajur-dark/40 mt-1 italic">
                        {coupon.description}
                    </p>
                )}
            </div>
        </div>

        {/* Right — Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
            <button
                onClick={() => onToggle(coupon.id)}
                className={`
                    text-xs px-4 py-2 rounded-sm font-bold uppercase tracking-widest
                    transition-all duration-200
                    ${coupon.is_active
                        ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-100'
                    }
                `}
            >
                {coupon.is_active ? 'Deactivate' : 'Activate'}
            </button>
            <button
                onClick={() => onDelete(coupon.id, coupon.code)}
                className="
                    flex items-center gap-1.5 text-xs px-4 py-2 rounded-sm
                    font-bold uppercase tracking-widest
                    bg-gray-50 text-gray-400 border border-gray-100
                    hover:bg-red-50 hover:text-red-500 hover:border-red-100
                    transition-all duration-200
                "
            >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
            </button>
        </div>
    </div>
);

// ── Create Coupon Form ─────────────────────────────────────────────────────────

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

    // ── Validate ───────────────────────────────────────────────────────────────
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

    // ── Build clean payload ────────────────────────────────────────────────────
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

        // Only send the relevant discount field — send null for the other
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
        <div className="bg-white border border-khajur-gold/30 rounded-sm p-6 mb-6">
            {/* Form Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-khajur-border">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-khajur-gold/10 rounded-sm flex items-center justify-center">
                        <Tag className="w-4 h-4 text-khajur-gold" />
                    </div>
                    <h3 className="font-serif text-lg font-semibold text-khajur-primary">
                        Create New Coupon
                    </h3>
                </div>
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-khajur-dark/40 hover:text-khajur-primary transition-colors"
                    aria-label="Close form"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    {/* ── Code ── */}
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
                            data-testid="coupon-code-input"
                        />
                        {errors.code && (
                            <p className="text-xs text-red-500 mt-1">{errors.code}</p>
                        )}
                    </div>

                    {/* ── Discount Type ── */}
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
                            className={inputCls}
                        >
                            <option value="percent">Percentage (%)</option>
                            <option value="fixed">Fixed Amount (₹)</option>
                        </select>
                    </div>

                    {/* ── Discount Value ── */}
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
                                data-testid="coupon-discount-amount"
                            />
                            {errors.discount_amount && (
                                <p className="text-xs text-red-500 mt-1">{errors.discount_amount}</p>
                            )}
                        </div>
                    )}

                    {/* ── Min Order ── */}
                    <div>
                        <FieldLabel>Minimum Order Amount (₹)</FieldLabel>
                        <input
                            type="number"
                            min="0"
                            value={form.min_order}
                            onChange={set('min_order')}
                            placeholder="0 = no minimum"
                            className={inputCls}
                        />
                    </div>

                    {/* ── Max Uses ── */}
                    <div>
                        <FieldLabel>Maximum Uses</FieldLabel>
                        <input
                            type="number"
                            min="1"
                            value={form.max_uses}
                            onChange={set('max_uses')}
                            placeholder="100"
                            className={`${inputCls} ${errors.max_uses ? 'border-red-400' : ''}`}
                        />
                        {errors.max_uses && (
                            <p className="text-xs text-red-500 mt-1">{errors.max_uses}</p>
                        )}
                    </div>

                    {/* ── Expiry ── */}
                    <div>
                        <FieldLabel>Expiry Date (optional)</FieldLabel>
                        <input
                            type="date"
                            value={form.expiry}
                            onChange={set('expiry')}
                            min={new Date().toISOString().split('T')[0]}
                            className={inputCls}
                        />
                    </div>

                    {/* ── Description ── */}
                    <div className="md:col-span-2">
                        <FieldLabel>Description (shown to customer)</FieldLabel>
                        <input
                            type="text"
                            value={form.description}
                            onChange={set('description')}
                            placeholder="e.g. Welcome offer for new customers"
                            className={inputCls}
                        />
                    </div>

                    {/* ── Checkboxes ── */}
                    <div className="md:col-span-2 flex flex-wrap gap-6 pt-1">
                        <label className="flex items-center gap-2.5 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={form.is_active}
                                onChange={setCheck('is_active')}
                                className="w-4 h-4 accent-khajur-gold"
                            />
                            <span className="text-sm font-medium text-khajur-primary group-hover:text-khajur-gold transition-colors">
                                Active immediately
                            </span>
                        </label>

                        <label className="flex items-center gap-2.5 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={form.is_welcome}
                                onChange={setCheck('is_welcome')}
                                className="w-4 h-4 accent-khajur-gold"
                            />
                            <span className="text-sm font-medium text-khajur-primary group-hover:text-khajur-gold transition-colors flex items-center gap-1.5">
                                <Gift className="w-4 h-4 text-yellow-500" />
                                Welcome coupon (first order only)
                            </span>
                        </label>
                    </div>
                </div>

                {/* ── Preview ── */}
                {form.code && (
                    <div className="bg-khajur-cream border border-khajur-border rounded-sm px-4 py-3 flex items-center gap-3">
                        <Tag className="w-4 h-4 text-khajur-gold flex-shrink-0" />
                        <div className="text-xs text-khajur-dark/70">
                            <span className="font-mono font-bold text-khajur-primary mr-2">
                                {form.code}
                            </span>
                            {form.discount_type === 'percent' && form.discount_percent
                                ? `${form.discount_percent}% off`
                                : form.discount_amount
                                ? `₹${form.discount_amount} off`
                                : '—'
                            }
                            {form.min_order > 0 && ` · Min ₹${form.min_order}`}
                            {form.max_uses && ` · Max ${form.max_uses} uses`}
                            {form.is_welcome && ' · 🎉 Welcome'}
                        </div>
                    </div>
                )}

                {/* ── Submit ── */}
                <div className="flex items-center gap-3 pt-2 border-t border-khajur-border">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="
                            flex items-center gap-2
                            bg-khajur-primary text-khajur-cream
                            px-8 py-3 rounded-sm font-bold text-xs uppercase tracking-widest
                            hover:bg-khajur-primary/90 transition-all duration-200
                            disabled:opacity-50 disabled:cursor-not-allowed
                        "
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
                            px-6 py-3 rounded-sm font-bold text-xs uppercase tracking-widest
                            border border-khajur-border text-khajur-dark/50
                            hover:border-khajur-primary hover:text-khajur-primary
                            transition-all duration-200
                        "
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

    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        fetchCoupons();
        fetchSystemStatus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchCoupons = async () => {
        setLoadingCoupons(true);
        try {
            const res = await axios.get(`${API}/admin/coupons`, { headers });
            // ── Guard: ensure we always set an array ──────────────────────────
            setCoupons(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Fetch coupons error:', err.response?.data || err.message);
            toast.error('Failed to load coupons');
            setCoupons([]);
        } finally {
            setLoadingCoupons(false);
        }
    };

    const fetchSystemStatus = async () => {
        try {
            const res = await axios.get(`${API}/coupon-system/status`);
            setSystemEnabled(Boolean(res.data.enabled));
        } catch {
            // silent
        }
    };

    const toggleSystem = async () => {
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
        }
    };

    const handleCreateCoupon = async (payload) => {
        console.log('Submitting coupon payload:', JSON.stringify(payload, null, 2));
        try {
            await axios.post(`${API}/admin/coupons`, payload, { headers });
            toast.success(`Coupon "${payload.code}" created successfully!`);
            setShowForm(false);
            fetchCoupons();
        } catch (err) {
            const detail = err.response?.data?.detail;
            console.error('Create coupon error:', err.response?.data);
            // FastAPI validation errors come as an array
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
        try {
            const res = await axios.patch(
                `${API}/admin/coupons/${couponId}/toggle`,
                {},
                { headers }
            );
            toast.success(res.data.message || 'Coupon updated');
            fetchCoupons();
        } catch (err) {
            console.error('Toggle coupon error:', err.response?.data);
            toast.error('Failed to toggle coupon');
        }
    };

    const deleteCoupon = async (couponId, code) => {
        if (!window.confirm(`Delete coupon "${code}"? This cannot be undone.`)) return;
        try {
            await axios.delete(`${API}/admin/coupons/${couponId}`, { headers });
            toast.success(`Coupon "${code}" deleted.`);
            fetchCoupons();
        } catch (err) {
            console.error('Delete coupon error:', err.response?.data);
            toast.error('Failed to delete coupon');
        }
    };

    // ── Derived ────────────────────────────────────────────────────────────────
    const activeCoupons = coupons.filter((c) => c.is_active);
    const welcomeCoupons = coupons.filter((c) => c.is_welcome);

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">

            {/* ── Section Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs uppercase tracking-widest text-khajur-gold font-semibold mb-1">
                        Promotions
                    </p>
                    <h2 className="font-serif text-2xl font-medium text-khajur-primary">
                        Coupon Management
                    </h2>
                </div>

                {/* Quick Stats */}
                <div className="hidden sm:flex items-center gap-6 text-center">
                    <div>
                        <p className="font-bold text-xl text-khajur-primary">{coupons.length}</p>
                        <p className="text-xs text-khajur-dark/50 uppercase tracking-widest">Total</p>
                    </div>
                    <div className="w-px h-8 bg-khajur-border" />
                    <div>
                        <p className="font-bold text-xl text-green-600">{activeCoupons.length}</p>
                        <p className="text-xs text-khajur-dark/50 uppercase tracking-widest">Active</p>
                    </div>
                    <div className="w-px h-8 bg-khajur-border" />
                    <div>
                        <p className="font-bold text-xl text-yellow-600">{welcomeCoupons.length}</p>
                        <p className="text-xs text-khajur-dark/50 uppercase tracking-widest">Welcome</p>
                    </div>
                </div>
            </div>

            {/* ── System Toggle ── */}
            <SystemToggleCard enabled={systemEnabled} onToggle={toggleSystem} />

            {/* ── Create Button ── */}
            {!showForm && (
                <button
                    onClick={() => setShowForm(true)}
                    className="
                        flex items-center gap-2
                        bg-khajur-gold text-khajur-primary
                        px-6 py-3 rounded-sm font-bold text-xs uppercase tracking-widest
                        hover:bg-khajur-gold/90
                        hover:shadow-[0_0_16px_rgba(198,169,98,0.3)]
                        transition-all duration-200
                    "
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

            {/* ── Coupons List ── */}
            <div>
                <h3 className="text-xs uppercase tracking-widest font-semibold text-khajur-dark/40 mb-4">
                    All Coupons ({coupons.length})
                </h3>

                {loadingCoupons ? (
                    <div className="flex items-center justify-center py-16 gap-3 text-khajur-dark/40">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Loading coupons…</span>
                    </div>
                ) : coupons.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                        <div className="w-12 h-12 bg-khajur-cream rounded-sm flex items-center justify-center">
                            <Tag className="w-6 h-6 text-khajur-dark/20" />
                        </div>
                        <p className="text-khajur-dark/50 text-sm">
                            No coupons yet. Create your first one above!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {coupons.map((coupon) => (
                            <CouponCard
                                key={coupon.id}
                                coupon={coupon}
                                onToggle={toggleCoupon}
                                onDelete={deleteCoupon}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CouponManager;
