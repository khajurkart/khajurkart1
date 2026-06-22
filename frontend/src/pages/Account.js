import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User,
  MapPin,
  Package,
  MessageCircle,
  RefreshCw,
  Phone,
  Truck,
  LogOut,
  Home,
  ShoppingBag,
  ChevronRight,
} from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const QUICK_LINKS = [
  {
    icon: User,
    label: 'Profile',
    description: 'Manage your personal info',
    to: '/profile',
    testId: 'profile-card',
  },
  {
    icon: MapPin,
    label: 'Addresses',
    description: 'Saved delivery addresses',
    to: '/addresses',
    testId: 'addresses-card',
  },
  {
    icon: Package,
    label: 'Orders',
    description: 'Track & view your orders',
    to: '/my-orders',
    testId: 'orders-card',
  },
];

const MENU_ITEMS = [
  {
    icon: MessageCircle,
    label: 'WhatsApp Support',
    description: 'Chat with us instantly',
    action: () => window.open('https://wa.me/917981002137', '_blank'),
    iconClass: 'text-green-500',
    testId: 'menu-whatsapp-support',
  },
  {
    icon: RefreshCw,
    label: 'Return & Exchange',
    description: 'Hassle-free returns',
    to: '/returns',
    iconClass: 'text-khajur-gold',
    testId: 'menu-return-&-exchange',
  },
  {
    icon: Phone,
    label: 'Contact Us',
    description: 'Get in touch with our team',
    to: '/contact',
    iconClass: 'text-khajur-gold',
    testId: 'menu-contact-us',
  },
  {
    icon: Truck,
    label: 'Track Order',
    description: 'Live shipment tracking',
    to: '/track-order',
    iconClass: 'text-khajur-gold',
    testId: 'menu-track-order',
  },
];

// ─── Sub-Components ────────────────────────────────────────────────────────────

// ── Quick Link Card ────────────────────────────────────────────────────────────

const QuickLinkCard = ({ icon: Icon, label, description, to, testId }) => (
  <Link
    to={to}
    data-testid={testId}
    className="
      group flex flex-col gap-5 bg-white border border-khajur-border
      hover:border-khajur-gold/60 hover:shadow-[0_4px_20px_rgba(198,169,98,0.12)]
      p-7 rounded-sm transition-all duration-300
    "
  >
    <div className="w-12 h-12 flex items-center justify-center bg-khajur-cream group-hover:bg-khajur-gold/10 transition-colors duration-300 rounded-sm">
      <Icon className="w-5 h-5 text-khajur-primary" />
    </div>
    <div>
      <p className="text-xs uppercase tracking-widest font-medium text-khajur-dark/50 mb-0.5">
        {label}
      </p>
      <p className="text-sm text-khajur-primary font-medium leading-snug">
        {description}
      </p>
    </div>
    <ChevronRight className="w-4 h-4 text-khajur-gold opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 mt-auto" />
  </Link>
);

// ── Menu Row ───────────────────────────────────────────────────────────────────

const MenuRow = ({ icon: Icon, label, description, iconClass, to, action, testId }) => {
  const inner = (
    <div className="
      group flex items-center gap-5 bg-white border border-khajur-border
      hover:border-khajur-gold/60 hover:shadow-[0_4px_20px_rgba(198,169,98,0.08)]
      px-6 py-5 rounded-sm transition-all duration-300 cursor-pointer
    ">
      <div className="w-10 h-10 flex items-center justify-center bg-khajur-cream group-hover:bg-khajur-gold/10 transition-colors duration-300 rounded-sm flex-shrink-0">
        <Icon className={`w-4 h-4 ${iconClass}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-khajur-primary uppercase tracking-wider">
          {label}
        </p>
        <p className="text-xs text-khajur-dark/50 mt-0.5">{description}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-khajur-gold/60 group-hover:text-khajur-gold group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
    </div>
  );

  return to ? (
    <Link to={to} data-testid={testId}>{inner}</Link>
  ) : (
    <div onClick={action} data-testid={testId}>{inner}</div>
  );
};

// ── Bottom Nav ─────────────────────────────────────────────────────────────────

const BottomNav = () => {
  const NAV = [
    { icon: Home,        label: 'Home',       to: '/',         testId: 'bottom-nav-home'    },
    { icon: ShoppingBag, label: 'Shop',        to: '/products', testId: 'bottom-nav-shop'    },
    { icon: User,        label: 'My Account',  to: '/account',  testId: 'bottom-nav-account', active: true },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-khajur-primary border-t border-khajur-gold/30 py-3 px-6 shadow-2xl z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-around">
        {NAV.map(({ icon: Icon, label, to, testId, active }) => (
          <Link
            key={to}
            to={to}
            data-testid={testId}
            className={`
              flex flex-col items-center gap-1.5 transition-colors
              ${active ? 'text-khajur-gold' : 'text-khajur-cream/60 hover:text-khajur-cream'}
            `}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {active && (
                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-khajur-gold" />
              )}
            </div>
            <span className="text-[10px] uppercase tracking-widest font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const Account = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-khajur-cream pb-28" data-testid="account-page">
      <div className="max-w-2xl mx-auto px-6 py-12 space-y-10">

        {/* ── Page Header ── */}
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-widest text-khajur-gold">
            My Account
          </p>
          <h1 className="font-serif text-4xl md:text-5xl font-medium text-khajur-primary leading-tight">
            Hello, {user.name?.split(' ')[0] || 'there'}.
          </h1>
          <p className="text-sm text-khajur-dark/50 pt-1">
            Signed in as{' '}
            <span className="text-khajur-primary font-medium">
              {user.phone || user.email}
            </span>
          </p>
        </div>

        {/* ── Quick Links ── */}
        <section>
          <p className="text-xs uppercase tracking-widest text-khajur-dark/40 mb-4">
            Quick Access
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {QUICK_LINKS.map((item) => (
              <QuickLinkCard key={item.to} {...item} />
            ))}
          </div>
        </section>

        {/* ── Support & Links ── */}
        <section>
          <p className="text-xs uppercase tracking-widest text-khajur-dark/40 mb-4">
            Support
          </p>
          <div className="space-y-3">
            {MENU_ITEMS.map((item) => (
              <MenuRow key={item.label} {...item} />
            ))}
          </div>
        </section>

        {/* ── Logout ── */}
        <section>
          <button
            onClick={handleLogout}
            data-testid="logout-button"
            className="
              w-full flex items-center justify-center gap-3
              border border-red-300 hover:border-red-500
              bg-white hover:bg-red-50
              text-red-500 hover:text-red-600
              px-6 py-4 rounded-sm
              text-xs uppercase tracking-widest font-semibold
              transition-all duration-300
            "
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
          <p className="text-center text-xs text-khajur-dark/30 mt-4">
            You'll be redirected to the homepage after signing out.
          </p>
        </section>

      </div>

      <BottomNav />
    </div>
  );
};

export default Account;
