import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
    Package,
    ShoppingBag,
    Users,
    TrendingUp,
    RefreshCw,
    Star,
    AlertTriangle,
    ArrowRight,
    Loader2,
    Tag,
    Clock,
    DollarSign,
    ExternalLink,
    CheckCircle2,
    Truck,
    Layers,
    ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import CouponManager from './CouponManager';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ─── Status Styles ────────────────────────────────────────────────────────────

const STATUS_STYLES = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
    processing: 'bg-purple-100 text-purple-800 border-purple-200',
    shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    delivered: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    return: 'bg-pink-100 text-pink-800 border-pink-200',
    exchange: 'bg-orange-100 text-orange-800 border-orange-200',
};

const getStatusBadge = (status) =>
    STATUS_STYLES[status] || 'bg-gray-100 text-gray-700 border-gray-200';

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, value, label, highlight = false, badge = null, className = '' }) => (
    <div
        className={`
            relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl border transition-all duration-300
            hover:shadow-md hover:-translate-y-0.5
            ${highlight
                ? 'bg-gradient-to-br from-khajur-primary to-[#18422d] text-khajur-cream border-khajur-primary shadow-sm'
                : 'bg-white text-khajur-primary border-khajur-border shadow-xs'
            }
            ${className}
        `}
        style={{ borderRadius: '16px' }}
    >
        <div className="flex items-center justify-between mb-3">
            <div
                className={`
                    w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0
                    ${highlight ? 'bg-white/10 text-khajur-gold' : 'bg-khajur-cream text-khajur-gold'}
                `}
                style={{ borderRadius: '12px' }}
            >
                <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </div>

            {badge && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    {badge}
                </span>
            )}
        </div>

        <div>
            <p className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
                {value}
            </p>
            <p className={`text-xs sm:text-sm mt-0.5 font-medium ${highlight ? 'text-khajur-cream/80' : 'text-khajur-dark/60'}`}>
                {label}
            </p>
        </div>
    </div>
);

// ─── Action Card ──────────────────────────────────────────────────────────────

const ActionCard = ({ to, icon: Icon, title, description, badge = null, variant = 'primary' }) => {
    const variants = {
        primary: {
            container: 'bg-white border-khajur-border hover:border-khajur-primary hover:shadow-lg text-khajur-primary',
            iconBox: 'bg-khajur-cream text-khajur-primary group-hover:bg-khajur-primary group-hover:text-khajur-gold',
            arrow: 'text-khajur-primary group-hover:translate-x-1',
        },
        gold: {
            container: 'bg-white border-khajur-border hover:border-khajur-gold hover:shadow-lg text-khajur-primary',
            iconBox: 'bg-khajur-cream text-khajur-gold group-hover:bg-khajur-gold group-hover:text-khajur-primary',
            arrow: 'text-khajur-gold group-hover:translate-x-1',
        },
        outline: {
            container: 'bg-white border-khajur-border hover:border-khajur-gold hover:shadow-lg text-khajur-primary',
            iconBox: 'bg-khajur-cream text-khajur-primary group-hover:bg-khajur-primary group-hover:text-white',
            arrow: 'text-khajur-primary group-hover:translate-x-1',
        },
        white: {
            container: 'bg-white border-khajur-border hover:border-khajur-gold hover:shadow-lg text-khajur-primary',
            iconBox: 'bg-khajur-cream text-khajur-gold group-hover:bg-khajur-gold group-hover:text-khajur-primary',
            arrow: 'text-khajur-gold group-hover:translate-x-1',
        },
    };

    const v = variants[variant] || variants.primary;

    return (
        <Link
            to={to}
            className={`
                group relative flex flex-col justify-between p-4 sm:p-6 rounded-2xl border transition-all duration-300
                shadow-xs ${v.container}
            `}
            style={{ borderRadius: '16px' }}
        >
            <div>
                <div className="flex items-center justify-between mb-3.5">
                    <div
                        className={`
                            w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-colors duration-300
                            ${v.iconBox}
                        `}
                        style={{ borderRadius: '12px' }}
                    >
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>

                    {badge && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                            {badge}
                        </span>
                    )}
                </div>

                <h3 className="font-serif text-base sm:text-lg font-semibold text-khajur-primary mb-1 group-hover:text-khajur-gold transition-colors">
                    {title}
                </h3>
                <p className="text-xs sm:text-sm text-khajur-dark/60 leading-relaxed line-clamp-2">
                    {description}
                </p>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest mt-4 text-khajur-gold">
                <span>Manage</span>
                <ArrowRight className={`w-3.5 h-3.5 transition-transform duration-300 ${v.arrow}`} />
            </div>
        </Link>
    );
};

// ─── Low Stock Banner ─────────────────────────────────────────────────────────

const LowStockBanner = ({ count }) => (
    <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-red-50/80 border border-red-200/80 text-red-800 p-4 sm:p-5 mb-8 rounded-2xl shadow-xs"
        style={{ borderRadius: '16px' }}
    >
        <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0" style={{ borderRadius: '10px' }}>
                <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
                <p className="text-sm font-semibold text-red-900">
                    Low Inventory Warning
                </p>
                <p className="text-xs text-red-700/80 mt-0.5">
                    <span className="font-bold text-red-900">{count} product{count !== 1 ? 's' : ''}</span> are running low on stock (less than 5 units left).
                </p>
            </div>
        </div>
        <Link
            to="/admin/products"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors shadow-xs"
            style={{ borderRadius: '10px' }}
        >
            <span>Restock Inventory</span>
            <ArrowRight className="w-3.5 h-3.5" />
        </Link>
    </div>
);

// ─── Recent Orders Section ────────────────────────────────────────────────────

const RecentOrdersTable = ({ orders }) => {
    if (!orders.length) return null;

    return (
        <div className="mt-12">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="font-serif text-2xl font-medium text-khajur-primary">
                        Recent Orders
                    </h2>
                    <p className="text-xs text-khajur-dark/50 mt-0.5">
                        Latest incoming orders from customers
                    </p>
                </div>
                <Link
                    to="/admin/orders"
                    className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-khajur-primary hover:text-khajur-gold transition-colors py-1.5 px-3 rounded-lg hover:bg-khajur-cream"
                >
                    <span>View All Orders</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            {/* Mobile View (< md): Clean Order Cards */}
            <div className="md:hidden space-y-3">
                {orders.map((order) => (
                    <div
                        key={order.id}
                        className="bg-white border border-khajur-border rounded-xl p-3.5 shadow-xs flex flex-col gap-2.5"
                        style={{ borderRadius: '14px' }}
                    >
                        <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-khajur-primary">
                                #{order.id.substring(0, 10)}…
                            </span>
                            <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${getStatusBadge(order.status)}`}>
                                {order.status}
                            </span>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-khajur-border/50">
                            <span className="text-khajur-dark/60">
                                {order.created_at
                                    ? new Date(order.created_at).toLocaleDateString('en-IN', {
                                        day: '2-digit', month: 'short', year: 'numeric',
                                    })
                                    : '—'
                                }
                            </span>
                            <span className="font-bold text-khajur-gold text-sm">
                                ₹{(order.total_amount || 0).toFixed(2)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop View (>= md): Full Table */}
            <div
                className="hidden md:block overflow-hidden border border-khajur-border rounded-2xl shadow-xs bg-white"
                style={{ borderRadius: '16px' }}
            >
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-khajur-cream border-b border-khajur-border">
                        <tr>
                            {['Order ID', 'Date', 'Customer', 'Amount', 'Status', 'Action'].map((col) => (
                                <th
                                    key={col}
                                    className="px-5 py-3.5 text-khajur-dark/70 font-semibold uppercase tracking-wider text-xs"
                                >
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-khajur-border bg-white">
                        {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-khajur-cream/30 transition-colors">
                                <td className="px-5 py-3.5 font-mono text-khajur-primary font-medium text-xs">
                                    #{order.id.substring(0, 12)}…
                                </td>
                                <td className="px-5 py-3.5 text-khajur-dark/70 text-xs">
                                    {order.created_at
                                        ? new Date(order.created_at).toLocaleDateString('en-IN', {
                                            day: '2-digit', month: 'short', year: 'numeric',
                                        })
                                        : '—'
                                    }
                                </td>
                                <td className="px-5 py-3.5 text-khajur-dark font-medium text-xs">
                                    {order.customer_name || 'Guest'}
                                </td>
                                <td className="px-5 py-3.5 text-khajur-gold font-semibold text-xs">
                                    ₹{(order.total_amount || 0).toFixed(2)}
                                </td>
                                <td className="px-5 py-3.5">
                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize border ${getStatusBadge(order.status)}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-5 py-3.5">
                                    <Link
                                        to="/admin/orders"
                                        className="text-xs font-semibold text-khajur-primary hover:text-khajur-gold transition-colors inline-flex items-center gap-1"
                                    >
                                        <span>Details</span>
                                        <ChevronRight className="w-3 h-3" />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ── Tab Bar ────────────────────────────────────────────────────────────────────

const TABS = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'coupons', label: 'Coupons & Offers', icon: Tag },
];

const TabBar = ({ active, onChange }) => (
    <div className="flex items-center gap-2 border-b border-khajur-border mb-8 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
            <button
                key={id}
                onClick={() => onChange(id)}
                className={`
                    flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-semibold
                    uppercase tracking-wider border-b-2 transition-all duration-200 cursor-pointer whitespace-nowrap
                    ${active === id
                        ? 'border-khajur-gold text-khajur-gold font-bold'
                        : 'border-transparent text-khajur-dark/50 hover:text-khajur-primary'
                    }
                `}
            >
                {Icon && <Icon className="w-4 h-4" />}
                {label}
            </button>
        ))}
    </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const AdminDashboard = () => {
    const { token } = useAuth();
    const navigate = useNavigate();

    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        pendingReturns: 0,
        totalRevenue: 0,
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [lowStock, setLowStock] = useState([]);

    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    const fetchStats = useCallback(async (silent = false) => {
        if (!silent) setRefreshing(true);
        try {
            const [productsRes, ordersRes, returnsRes] = await Promise.all([
                axios.get(`${API}/products`, authHeaders),
                axios.get(`${API}/admin/orders`, authHeaders),
                axios.get(`${API}/admin/returns`, authHeaders),
            ]);

            const products = productsRes.data || [];
            const orders = ordersRes.data || [];
            const returns = returnsRes.data || [];

            setLowStock(products.filter((p) => Number(p.stock ?? 0) < 5));
            setRecentOrders(orders.slice(0, 5));
            setStats({
                totalProducts: products.length,
                totalOrders: orders.length,
                pendingOrders: orders.filter((o) => o.status === 'pending').length,
                pendingReturns: returns.filter((r) => r.status === 'pending').length,
                totalRevenue: orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0),
            });

            if (!silent) {
                toast.success('Dashboard metrics refreshed');
            }
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
            if (!silent) {
                toast.error('Could not load dashboard data. Please try again.');
            }
        } finally {
            setRefreshing(false);
        }
    }, [token]);

    const checkAdmin = useCallback(async () => {
        try {
            await axios.get(`${API}/admin/check`, authHeaders);
            setIsAdmin(true);
            await fetchStats(true);
        } catch {
            toast.error('Admin access required.');
            navigate('/');
        } finally {
            setLoading(false);
        }
    }, [token, navigate, fetchStats]);

    useEffect(() => {
        checkAdmin();
    }, [checkAdmin]);

    // ── Render States ──────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-khajur-dark/50">
                <Loader2 className="w-8 h-8 animate-spin text-khajur-gold" />
                <p className="text-sm font-medium">Verifying administrator access…</p>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-2">
                    <AlertTriangle className="w-8 h-8" />
                </div>
                <h1 className="font-serif text-3xl font-medium text-khajur-primary">Access Denied</h1>
                <p className="text-khajur-dark/60 max-w-xs text-sm">
                    You do not have permission to view the administrative portal.
                </p>
                <Link
                    to="/"
                    className="mt-2 inline-flex items-center gap-1.5 px-6 py-2.5 bg-khajur-primary text-khajur-cream rounded-xl text-xs font-semibold uppercase tracking-wider"
                    style={{ borderRadius: '12px' }}
                >
                    Return to Home
                </Link>
            </div>
        );
    }

    // ── Cards Config ───────────────────────────────────────────────────────────

    const statCards = [
        {
            icon: TrendingUp,
            value: `₹${stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            label: 'Total Revenue',
            highlight: true,
            className: 'col-span-2 sm:col-span-1',
        },
        {
            icon: ShoppingBag,
            value: stats.totalOrders,
            label: 'Total Orders',
        },
        {
            icon: Clock,
            value: stats.pendingOrders,
            label: 'Pending Orders',
            badge: stats.pendingOrders > 0 ? `${stats.pendingOrders} new` : null,
        },
        {
            icon: Package,
            value: stats.totalProducts,
            label: 'Total Products',
        },
        {
            icon: RefreshCw,
            value: stats.pendingReturns,
            label: 'Pending Returns',
            badge: stats.pendingReturns > 0 ? `${stats.pendingReturns} req` : null,
        },
    ];

    const actionCards = [
        {
            to: '/admin/orders',
            icon: ShoppingBag,
            title: 'Manage Orders',
            description: 'View orders, update delivery status and tracking codes.',
            badge: stats.pendingOrders > 0 ? `${stats.pendingOrders} pending` : null,
            variant: 'gold',
        },
        {
            to: '/admin/products',
            icon: Package,
            title: 'Manage Products',
            description: 'Add new items, update inventory, prices and descriptions.',
            badge: lowStock.length > 0 ? `${lowStock.length} low` : null,
            variant: 'primary',
        },
        {
            to: '/admin/returns',
            icon: RefreshCw,
            title: 'Returns & Exchange',
            description: 'Review customer return claims and approval status.',
            badge: stats.pendingReturns > 0 ? `${stats.pendingReturns} req` : null,
            variant: 'outline',
        },
        {
            to: '/admin/reviews',
            icon: Star,
            title: 'Customer Reviews',
            description: 'Moderate customer ratings and product testimonials.',
            variant: 'white',
        },
    ];

    // ── Main Render ────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen py-12 sm:py-20 bg-white" data-testid="admin-dashboard">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">

                {/* ── Page Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-6 border-b border-khajur-border/70">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <p className="text-xs uppercase tracking-widest text-khajur-gold font-semibold">
                                KhajurKart Administrator
                            </p>
                        </div>
                        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-khajur-primary">
                            Dashboard
                        </h1>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={() => fetchStats(false)}
                            disabled={refreshing}
                            className="inline-flex items-center gap-1.5 px-4 py-2 border border-khajur-border bg-white hover:bg-khajur-cream text-khajur-primary rounded-xl text-xs font-semibold transition-all shadow-xs disabled:opacity-50"
                            style={{ borderRadius: '12px' }}
                            title="Refresh dashboard stats"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-khajur-gold' : ''}`} />
                            <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
                        </button>

                        <Link
                            to="/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-khajur-primary hover:bg-khajur-primary/90 text-khajur-cream rounded-xl text-xs font-semibold transition-all shadow-xs"
                            style={{ borderRadius: '12px' }}
                        >
                            <span>Live Store</span>
                            <ExternalLink className="w-3.5 h-3.5 text-khajur-gold" />
                        </Link>
                    </div>
                </div>

                {/* ── Tab Bar ── */}
                <TabBar active={activeTab} onChange={setActiveTab} />

                {/* ══════════════════════════════════════════════════════════════
                    TAB: OVERVIEW
                ══════════════════════════════════════════════════════════════ */}
                {activeTab === 'overview' && (
                    <>
                        {/* Low Stock Warning */}
                        {lowStock.length > 0 && <LowStockBanner count={lowStock.length} />}

                        {/* KPI Stats Grid: 2 cols on mobile, 5 on desktop */}
                        <section aria-label="Dashboard statistics" className="mb-10">
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4.5">
                                {statCards.map((card) => (
                                    <StatCard key={card.label} {...card} />
                                ))}
                            </div>
                        </section>

                        {/* Quick Actions Hub: 2 cols on mobile, 4 on desktop */}
                        <section aria-label="Quick actions" className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-serif text-2xl font-medium text-khajur-primary">
                                    Quick Management
                                </h2>
                                <span className="text-xs text-khajur-dark/40">
                                    Direct Portal Access
                                </span>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                                {actionCards.map((card) => (
                                    <ActionCard key={card.to} {...card} />
                                ))}
                            </div>
                        </section>

                        {/* Coupon Feature Banner */}
                        <section className="mt-6 mb-10">
                            <button
                                onClick={() => setActiveTab('coupons')}
                                className="
                                    group w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6
                                    bg-gradient-to-r from-khajur-primary via-[#1c4731] to-[#123121]
                                    text-white rounded-2xl transition-all duration-300
                                    hover:shadow-xl hover:border-khajur-gold/40 border border-transparent cursor-pointer
                                "
                                style={{ borderRadius: '16px' }}
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 text-khajur-gold"
                                        style={{ borderRadius: '12px' }}
                                    >
                                        <Tag className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-serif text-lg sm:text-xl font-semibold">
                                                Promotions & Coupon Manager
                                            </h3>
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-khajur-gold text-khajur-primary">
                                                Active
                                            </span>
                                        </div>
                                        <p className="text-xs sm:text-sm text-khajur-cream/70 mt-0.5 leading-relaxed">
                                            Create discount codes, set percentage reductions, and manage welcome offers.
                                        </p>
                                    </div>
                                </div>

                                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-khajur-gold group-hover:translate-x-1 transition-transform self-start sm:self-center">
                                    <span>Manage Offers</span>
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </button>
                        </section>

                        {/* Recent Orders Overview */}
                        <RecentOrdersTable orders={recentOrders} />
                    </>
                )}

                {/* ══════════════════════════════════════════════════════════════
                    TAB: COUPONS
                ══════════════════════════════════════════════════════════════ */}
                {activeTab === 'coupons' && (
                    <div className="bg-white rounded-2xl" style={{ borderRadius: '16px' }}>
                        <CouponManager token={token} />
                    </div>
                )}

            </div>
        </div>
    );
};

export default AdminDashboard;
