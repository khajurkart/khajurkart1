import React, { useState, useEffect } from 'react';
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
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ─── Sub-Components ────────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, value, label, highlight = false }) => (
  <div
    className={`
      flex flex-col gap-3 p-6 border transition-shadow hover:shadow-md
      ${highlight
        ? 'bg-khajur-primary text-khajur-cream border-khajur-primary'
        : 'bg-khajur-cream text-khajur-primary border-khajur-border'
      }
    `}
  >
    <Icon className={`w-8 h-8 ${highlight ? 'text-khajur-gold' : 'text-khajur-gold'}`} />
    <div>
      <p className="font-serif text-3xl font-bold">{value}</p>
      <p className={`text-sm mt-1 ${highlight ? 'text-khajur-cream/70' : 'text-khajur-dark/60'}`}>
        {label}
      </p>
    </div>
  </div>
);

const ActionCard = ({ to, icon: Icon, title, description, variant = 'primary' }) => {
  const styles = {
    primary: 'bg-khajur-primary text-khajur-cream hover:bg-khajur-primary/90',
    gold: 'bg-khajur-gold text-khajur-primary hover:bg-khajur-gold/90',
    outline:
      'bg-khajur-cream border-2 border-khajur-primary text-khajur-primary hover:bg-khajur-primary hover:text-khajur-cream',
    white:
      'bg-white border border-khajur-border text-khajur-primary hover:shadow-md hover:border-khajur-gold',
  };

  return (
    <Link
      to={to}
      className={`
        group flex flex-col gap-4 p-8 transition-all duration-200
        ${styles[variant]}
      `}
    >
      <Icon className="w-10 h-10" />
      <div className="flex-1">
        <h3 className="font-serif text-xl font-semibold mb-1">{title}</h3>
        <p className="text-sm opacity-75 leading-relaxed">{description}</p>
      </div>
      <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity self-end" />
    </Link>
  );
};

const LowStockBanner = ({ count }) => (
  <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 mb-8 rounded-sm">
    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
    <p className="text-sm font-medium">
      <span className="font-bold">{count} product{count !== 1 ? 's' : ''}</span> are running low on
      stock. Please restock soon.
    </p>
    <Link
      to="/admin/products"
      className="ml-auto text-sm underline underline-offset-2 hover:text-red-900 whitespace-nowrap"
    >
      View products
    </Link>
  </div>
);

const RecentOrdersTable = ({ orders }) => {
  if (!orders.length) return null;

  const statusStyles = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-2xl font-medium text-khajur-primary">Recent Orders</h2>
        <Link
          to="/admin/orders"
          className="text-sm text-khajur-gold hover:underline flex items-center gap-1"
        >
          View all <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="overflow-x-auto border border-khajur-border">
        <table className="w-full text-sm">
          <thead className="bg-khajur-cream border-b border-khajur-border">
            <tr>
              {['Order ID', 'Date', 'Amount', 'Status'].map((col) => (
                <th
                  key={col}
                  className="text-left px-5 py-3 text-khajur-dark/60 font-medium uppercase tracking-wide text-xs"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-khajur-border bg-white">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-khajur-cream/40 transition-colors">
                <td className="px-5 py-3 font-mono text-khajur-primary font-medium">
                  #{order.id}
                </td>
                <td className="px-5 py-3 text-khajur-dark/70">
                  {order.created_at
                    ? new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}
                </td>
                <td className="px-5 py-3 text-khajur-dark/70">
                  ₹{(order.total_amount || 0).toFixed(2)}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`
                      inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize
                      ${statusStyles[order.status] || 'bg-gray-100 text-gray-700'}
                    `}
                  >
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    pendingReturns: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStock, setLowStock] = useState([]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const fetchStats = async () => {
    try {
      const [productsRes, ordersRes, returnsRes] = await Promise.all([
        axios.get(`${API}/products`, authHeaders),
        axios.get(`${API}/admin/orders`, authHeaders),
        axios.get(`${API}/admin/returns`, authHeaders),
      ]);

      const products = productsRes.data;
      const orders = ordersRes.data;
      const returns = returnsRes.data;

      setLowStock(products.filter((p) => p.stock < 5));
      setRecentOrders(orders.slice(0, 5));
      setStats({
        totalProducts: products.length,
        totalOrders: orders.length,
        pendingOrders: orders.filter((o) => o.status === 'pending').length,
        pendingReturns: returns.filter((r) => r.status === 'pending').length,
        totalRevenue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      toast.error('Could not load dashboard data. Please try again.');
    }
  };

  const checkAdmin = async () => {
    try {
      await axios.get(`${API}/admin/check`, authHeaders);
      setIsAdmin(true);
      await fetchStats();
    } catch {
      toast.error('Admin access required.');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Render States ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-khajur-dark/50">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-sm">Verifying access…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <h1 className="font-serif text-3xl font-medium text-khajur-primary">Access Denied</h1>
        <p className="text-khajur-dark/60 max-w-xs">
          You do not have permission to view this page.
        </p>
        <Link to="/" className="mt-2 text-khajur-gold underline underline-offset-2 text-sm">
          Return to Home
        </Link>
      </div>
    );
  }

  // ── Stat Cards Config ──────────────────────────────────────────────────────

  const statCards = [
    { icon: Package, value: stats.totalProducts, label: 'Total Products' },
    { icon: ShoppingBag, value: stats.totalOrders, label: 'Total Orders' },
    { icon: Users, value: stats.pendingOrders, label: 'Pending Orders' },
    { icon: RefreshCw, value: stats.pendingReturns, label: 'Pending Returns' },
    {
      icon: TrendingUp,
      value: `₹${stats.totalRevenue.toFixed(2)}`,
      label: 'Total Revenue',
      highlight: true,
    },
  ];

  const actionCards = [
    {
      to: '/admin/products',
      icon: Package,
      title: 'Manage Products',
      description: 'Add, edit, or remove products from your inventory.',
      variant: 'primary',
    },
    {
      to: '/admin/orders',
      icon: ShoppingBag,
      title: 'Manage Orders',
      description: 'View and update order status and tracking information.',
      variant: 'gold',
    },
    {
      to: '/admin/returns',
      icon: RefreshCw,
      title: 'Returns & Exchanges',
      description: 'Review and process return or exchange requests.',
      variant: 'outline',
    },
    {
      to: '/admin/reviews',
      icon: Star,
      title: 'Manage Reviews',
      description: 'View, approve, or remove customer product reviews.',
      variant: 'white',
    },
  ];

  // ── Main Render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen py-20 bg-white" data-testid="admin-dashboard">
      <div className="max-w-7xl mx-auto px-6 md:px-12">

        {/* Page Header */}
        <div className="mb-10">
          <p className="text-sm uppercase tracking-widest text-khajur-gold mb-1">
            Administration
          </p>
          <h1 className="font-serif text-4xl md:text-5xl font-medium text-khajur-primary">
            Dashboard
          </h1>
        </div>

        {/* Low Stock Banner */}
        {lowStock.length > 0 && <LowStockBanner count={lowStock.length} />}

        {/* Stats Grid */}
        <section aria-label="Dashboard statistics">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
            {statCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-khajur-border mb-10" />

        {/* Quick Actions */}
        <section aria-label="Quick actions">
          <h2 className="font-serif text-2xl font-medium text-khajur-primary mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {actionCards.map((card) => (
              <ActionCard key={card.to} {...card} />
            ))}
          </div>
        </section>

        {/* Recent Orders */}
        <RecentOrdersTable orders={recentOrders} />
      </div>
    </div>
  );
};

export default AdminDashboard;
