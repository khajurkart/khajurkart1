import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
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
    Tag,
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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

// ── Welcome Coupon Banner ──────────────────────────────────────────────────────

const WelcomeCouponBanner = ({ welcomeCoupon }) => {
    if (!welcomeCoupon) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(welcomeCoupon.code);
        toast.success('Coupon code copied! 🎉');
    };

    return (
        <div
            className="
                bg-khajur-gold rounded-sm px-6 py-4
                flex flex-col sm:flex-row items-start sm:items-center
                gap-3 border border-khajur-gold/40
            "
            data-testid="welcome-coupon-banner"
        >
            {/* Icon */}
            <div className="flex-shrink-0 w-10 h-10 bg-khajur-primary/10 rounded-sm flex items-center justify-center">
                <Tag className="w-5 h-5 text-khajur-primary" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-widest font-semibold text-khajur-primary/70 mb-0.5">
                    Welcome Gift
                </p>
                <p className="text-sm font-bold text-khajur-primary">
                    🎉 Use code{' '}
                    <span
                        onClick={handleCopy}
                        className="
                            bg-khajur-primary text-khajur-gold
                            px-2 py-0.5 rounded
                            cursor-pointer font-mono
                            hover:bg-khajur-primary/80
                            transition-colors duration-200
                            inline-block
                        "
                        data-testid="welcome-coupon-code"
                        title="Click to copy"
                    >
                        {welcomeCoupon.code}
                    </span>
                    {' '}for{' '}
                    <span className="text-khajur-primary font-extrabold">
                        {welcomeCoupon.discount_percent}% off
                    </span>
                    {' '}your first order!
                </p>
                <p className="text-xs text-khajur-primary/60 mt-1">
                    Click the code to copy it to your clipboard.
                </p>
            </div>
        </div>
    );
};

// ── Quick Link Card ────────────────────────────────────────────────────────────

const QuickLinkCard = ({ icon: Icon, label, description, to, testId }) => (
    <Link
        to={to}
        data-testid={testId}
        className="
            group flex flex-col gap-6 bg-white border border-khajur-border
            hover:border-khajur-gold/60 hover:shadow-[0_4px_24px_rgba(198,169,98,0.15)]
            p-8 md:p-10 rounded-sm transition-all duration-300
        "
    >
        <div className="w-14 h-14 flex items-center justify-center bg-khajur-cream group-hover:bg-khajur-gold/10 transition-colors duration-300 rounded-sm">
            <Icon className="w-6 h-6 text-khajur-primary" />
        </div>
        <div>
            <p className="text-sm uppercase tracking-widest font-medium text-khajur-dark/50 mb-1">
                {label}
            </p>
            <p className="text-base text-khajur-primary font-medium leading-relaxed">
                {description}
            </p>
        </div>
        <ChevronRight className="w-5 h-5 text-khajur-gold opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 mt-auto" />
    </Link>
);

// ── Menu Row ───────────────────────────────────────────────────────────────────

const MenuRow = ({ icon: Icon, label, description, iconClass, to, action, testId }) => {
    const inner = (
        <div className="
            group flex items-center gap-6 bg-white border border-khajur-border
            hover:border-khajur-gold/60 hover:shadow-[0_4px_20px_rgba(198,169,98,0.08)]
            px-8 py-6 rounded-sm transition-all duration-300 cursor-pointer
        ">
            <div className="w-12 h-12 flex items-center justify-center bg-khajur-cream group-hover:bg-khajur-gold/10 transition-colors duration-300 rounded-sm flex-shrink-0">
                <Icon className={`w-5 h-5 ${iconClass}`} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-khajur-primary uppercase tracking-wider">
                    {label}
                </p>
                <p className="text-sm text-khajur-dark/50 mt-1">{description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-khajur-gold/60 group-hover:text-khajur-gold group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
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
        { icon: Home, label: 'Home', to: '/', testId: 'bottom-nav-home' },
        { icon: ShoppingBag, label: 'Shop', to: '/products', testId: 'bottom-nav-shop' },
        { icon: User, label: 'My Account', to: '/account', testId: 'bottom-nav-account', active: true },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-khajur-primary border-t border-khajur-gold/30 py-4 px-6 shadow-2xl z-40">
            <div className="max-w-7xl mx-auto flex items-center justify-around">
                {NAV.map(({ icon: Icon, label, to, testId, active }) => (
                    <Link
                        key={to}
                        to={to}
                        data-testid={testId}
                        className={`
                            flex flex-col items-center gap-2 transition-colors
                            ${active ? 'text-khajur-gold' : 'text-khajur-cream/60 hover:text-khajur-cream'}
                        `}
                    >
                        <div className="relative">
                            <Icon className="w-6 h-6" />
                            {active && (
                                <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-khajur-gold" />
                            )}
                        </div>
                        <span className="text-xs uppercase tracking-widest font-medium">{label}</span>
                    </Link>
                ))}
            </div>
        </nav>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const Account = () => {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const [welcomeCoupon, setWelcomeCoupon] = useState(null);

    // ── Check for welcome coupon ───────────────────────────────────────────────
    useEffect(() => {
        if (user && token) {
            const checkWelcome = async () => {
                try {
                    const res = await axios.get(`${API}/welcome-coupon`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (res.data.available) {
                        setWelcomeCoupon(res.data);
                    }
                } catch {
                    // silent fail — welcome coupon is optional
                }
            };
            checkWelcome();
        }
    }, [user, token]);

    if (!user) {
        navigate('/');
        return null;
    }

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-khajur-cream pb-32" data-testid="account-page">
            <div className="max-w-5xl mx-auto px-6 md:px-12 py-16 md:py-20 space-y-14">

                {/* ── Page Header ── */}
                <div className="space-y-2 border-b border-khajur-gold/20 pb-8">
                    <p className="text-sm uppercase tracking-widest text-khajur-gold font-medium">
                        My Account
                    </p>
                    <h1 className="font-serif text-5xl md:text-6xl font-medium text-khajur-primary leading-tight">
                        Hello, {user.name?.split(' ')[0] || 'there'}.
                    </h1>
                    <p className="text-base text-khajur-dark/60 pt-2">
                        Signed in as{' '}
                        <span className="text-khajur-primary font-semibold">
                            {user.phone || user.email}
                        </span>
                    </p>
                </div>

                {/* ── Welcome Coupon Banner ── */}
                {welcomeCoupon && (
                    <WelcomeCouponBanner welcomeCoupon={welcomeCoupon} />
                )}

                {/* ── Quick Links ── */}
                <section>
                    <p className="text-sm uppercase tracking-widest text-khajur-dark/40 mb-6 font-medium">
                        Quick Access
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {QUICK_LINKS.map((item) => (
                            <QuickLinkCard key={item.to} {...item} />
                        ))}
                    </div>
                </section>

                {/* ── Support & Links ── */}
                <section>
                    <p className="text-sm uppercase tracking-widest text-khajur-dark/40 mb-6 font-medium">
                        Support
                    </p>
                    <div className="space-y-4">
                        {MENU_ITEMS.map((item) => (
                            <MenuRow key={item.label} {...item} />
                        ))}
                    </div>
                </section>

                {/* ── Logout ── */}
                <section className="pt-4">
                    <button
                        onClick={handleLogout}
                        data-testid="logout-button"
                        className="
                            w-full flex items-center justify-center gap-3
                            border-2 border-red-200 hover:border-red-500
                            bg-white hover:bg-red-50
                            text-red-500 hover:text-red-700
                            px-8 py-5 rounded-sm
                            text-sm uppercase tracking-widest font-bold
                            transition-all duration-300
                        "
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                    <p className="text-center text-sm text-khajur-dark/40 mt-5">
                        You'll be redirected to the homepage after signing out.
                    </p>
                </section>

            </div>

            <BottomNav />
        </div>
    );
};

export default Account;
