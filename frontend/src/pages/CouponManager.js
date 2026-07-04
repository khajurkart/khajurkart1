// CouponManager.jsx — new admin component

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CouponManager = ({ token }) => {
    const [coupons, setCoupons] = useState([]);
    const [systemEnabled, setSystemEnabled] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        code: '',
        discount_type: 'percent',
        discount_percent: '',
        discount_amount: '',
        min_order: 0,
        max_uses: 100,
        expiry: '',
        description: '',
        is_active: true,
        is_welcome: false,
    });

    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        fetchCoupons();
        fetchSystemStatus();
    }, []);

    const fetchCoupons = async () => {
        try {
            const res = await axios.get(`${API}/admin/coupons`, { headers });
            setCoupons(res.data);
        } catch (err) {
            toast.error('Failed to load coupons');
        }
    };

    const fetchSystemStatus = async () => {
        try {
            const res = await axios.get(`${API}/coupon-system/status`);
            setSystemEnabled(res.data.enabled);
        } catch (err) {}
    };

    const toggleSystem = async () => {
        try {
            const res = await axios.post(
                `${API}/admin/coupon-system/toggle?enabled=${!systemEnabled}`,
                {},
                { headers }
            );
            setSystemEnabled(!systemEnabled);
            toast.success(res.data.message);
        } catch (err) {
            toast.error('Failed to toggle coupon system');
        }
    };

    const createCoupon = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API}/admin/coupons`, form, { headers });
            toast.success(`Coupon ${form.code} created! ✅`);
            setShowForm(false);
            setForm({
                code: '', discount_type: 'percent',
                discount_percent: '', discount_amount: '',
                min_order: 0, max_uses: 100, expiry: '',
                description: '', is_active: true, is_welcome: false
            });
            fetchCoupons();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to create coupon');
        }
    };

    const toggleCoupon = async (couponId) => {
        try {
            const res = await axios.patch(
                `${API}/admin/coupons/${couponId}/toggle`,
                {},
                { headers }
            );
            toast.success(res.data.message);
            fetchCoupons();
        } catch (err) {
            toast.error('Failed to toggle coupon');
        }
    };

    const deleteCoupon = async (couponId, code) => {
        if (!window.confirm(`Delete coupon ${code}?`)) return;
        try {
            await axios.delete(`${API}/admin/coupons/${couponId}`, { headers });
            toast.success('Coupon deleted');
            fetchCoupons();
        } catch (err) {
            toast.error('Failed to delete coupon');
        }
    };

    return (
        <div className="p-6">
            <h2 className="font-serif text-2xl font-bold text-khajur-primary mb-6">
                Coupon Management
            </h2>

            {/* ── System Toggle ── */}
            <div className="bg-white border border-khajur-border p-4 rounded-sm mb-6 flex items-center justify-between">
                <div>
                    <p className="font-medium text-khajur-primary">Coupon System</p>
                    <p className="text-sm text-khajur-dark/60">
                        {systemEnabled
                            ? '✅ Customers can apply coupons at checkout'
                            : '❌ Coupon section hidden from all customers'}
                    </p>
                </div>
                <button
                    onClick={toggleSystem}
                    className={`px-6 py-2 rounded-sm font-bold text-sm transition-all ${
                        systemEnabled
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : 'bg-green-100 text-green-600 hover:bg-green-200'
                    }`}
                >
                    {systemEnabled ? 'Turn OFF' : 'Turn ON'}
                </button>
            </div>

            {/* ── Add Coupon Button ── */}
            <button
                onClick={() => setShowForm(!showForm)}
                className="bg-khajur-gold text-khajur-primary px-6 py-3 rounded-sm font-bold text-sm mb-6 hover:bg-khajur-gold/90 transition-all"
            >
                {showForm ? 'Cancel' : '+ Create New Coupon'}
            </button>

            {/* ── Create Coupon Form ── */}
            {showForm && (
                <form
                    onSubmit={createCoupon}
                    className="bg-white border border-khajur-border p-6 rounded-sm mb-6 space-y-4"
                >
                    <h3 className="font-serif text-lg font-bold text-khajur-primary">
                        Create Coupon
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Coupon Code *
                            </label>
                            <input
                                required
                                type="text"
                                value={form.code}
                                onChange={(e) => setForm({...form, code: e.target.value.toUpperCase()})}
                                placeholder="e.g. WELCOME10"
                                className="w-full border border-khajur-border px-3 py-2 rounded-sm font-mono uppercase"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Discount Type *
                            </label>
                            <select
                                value={form.discount_type}
                                onChange={(e) => setForm({...form, discount_type: e.target.value})}
                                className="w-full border border-khajur-border px-3 py-2 rounded-sm"
                            >
                                <option value="percent">Percentage (%)</option>
                                <option value="fixed">Fixed Amount (₹)</option>
                            </select>
                        </div>

                        {form.discount_type === 'percent' ? (
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Discount % *
                                </label>
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={form.discount_percent}
                                    onChange={(e) => setForm({...form, discount_percent: e.target.value})}
                                    placeholder="e.g. 10"
                                    className="w-full border border-khajur-border px-3 py-2 rounded-sm"
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Discount Amount (₹) *
                                </label>
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    value={form.discount_amount}
                                    onChange={(e) => setForm({...form, discount_amount: e.target.value})}
                                    placeholder="e.g. 50"
                                    className="w-full border border-khajur-border px-3 py-2 rounded-sm"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Minimum Order (₹)
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={form.min_order}
                                onChange={(e) => setForm({...form, min_order: e.target.value})}
                                placeholder="0 = no minimum"
                                className="w-full border border-khajur-border px-3 py-2 rounded-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Max Uses
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={form.max_uses}
                                onChange={(e) => setForm({...form, max_uses: e.target.value})}
                                className="w-full border border-khajur-border px-3 py-2 rounded-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Expiry Date
                            </label>
                            <input
                                type="date"
                                value={form.expiry}
                                onChange={(e) => setForm({...form, expiry: e.target.value})}
                                className="w-full border border-khajur-border px-3 py-2 rounded-sm"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">
                                Description (shown to customer)
                            </label>
                            <input
                                type="text"
                                value={form.description}
                                onChange={(e) => setForm({...form, description: e.target.value})}
                                placeholder="e.g. Welcome offer for new customers"
                                className="w-full border border-khajur-border px-3 py-2 rounded-sm"
                            />
                        </div>

                        <div className="md:col-span-2 flex gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.is_active}
                                    onChange={(e) => setForm({...form, is_active: e.target.checked})}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm font-medium">Active immediately</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.is_welcome}
                                    onChange={(e) => setForm({...form, is_welcome: e.target.checked})}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm font-medium">
                                    🎉 Welcome coupon (first order only)
                                </span>
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="bg-khajur-primary text-khajur-cream px-8 py-3 rounded-sm font-bold hover:bg-khajur-primary/90 transition-all"
                    >
                        Create Coupon
                    </button>
                </form>
            )}

            {/* ── Coupons List ── */}
            <div className="space-y-4">
                {coupons.length === 0 ? (
                    <div className="text-center py-12 text-khajur-dark/50">
                        No coupons yet. Create your first coupon above!
                    </div>
                ) : (
                    coupons.map((coupon) => (
                        <div
                            key={coupon.id}
                            className={`bg-white border rounded-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                                coupon.is_active
                                    ? 'border-khajur-border'
                                    : 'border-gray-200 opacity-60'
                            }`}
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="font-mono font-bold text-khajur-primary text-lg">
                                        {coupon.code}
                                    </span>
                                    {coupon.is_welcome && (
                                        <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-medium">
                                            🎉 Welcome
                                        </span>
                                    )}
                                    {coupon.is_active ? (
                                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                                            Active
                                        </span>
                                    ) : (
                                        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">
                                            Inactive
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-khajur-dark/70">
                                    {coupon.discount_type === 'percent'
                                        ? `${coupon.discount_percent}% off`
                                        : `₹${coupon.discount_amount} off`}
                                    {coupon.min_order > 0 && ` • Min order ₹${coupon.min_order}`}
                                    {' • '}{coupon.uses}/{coupon.max_uses} used
                                    {coupon.expiry && ` • Expires ${coupon.expiry}`}
                                </p>
                                {coupon.description && (
                                    <p className="text-xs text-khajur-dark/50 mt-1">
                                        {coupon.description}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => toggleCoupon(coupon.id)}
                                    className={`text-sm px-4 py-2 rounded-sm font-medium transition-all ${
                                        coupon.is_active
                                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                                    }`}
                                >
                                    {coupon.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                    onClick={() => deleteCoupon(coupon.id, coupon.code)}
                                    className="text-sm px-4 py-2 bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-sm transition-all"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CouponManager;
