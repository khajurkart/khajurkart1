
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    Search,
    ShoppingCart,
    User,
    Menu,
    X,
    Truck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import AuthModal from './AuthModal';

const NAV_LINKS = [
    { label: 'Home', to: '/' },
    { label: 'About Us', to: '/about' },
    { label: 'Products', to: '/products' },
    { label: 'Bulk Orders', to: '/bulk-orders' },
    { label: 'Contact Us', to: '/contact' },
];

// ─── Free Delivery Announcement ───────────────────────────────────────────────


const FreeDeliveryBanner = () => (
    <div className="w-full overflow-hidden bg-[#C6A962] text-[#0F3D2E] py-3">
        <div className="flex w-full overflow-hidden">
            <div className="flex w-max shrink-0 items-center animate-delivery-marquee">
                <div className="flex w-max shrink-0 items-center gap-2 px-6 whitespace-nowrap">
                    <Truck className="h-5 w-5 shrink-0" />

                    <p className="text-xs font-semibold sm:text-sm md:text-base whitespace-nowrap">
                        Enjoy <span className="font-bold">FREE DELIVERY</span> on orders above{' '}
                        <span className="font-bold">₹2,000!</span>
                    </p>

                    <span className="mx-3 opacity-60">|</span>

                    <p className="text-xs font-normal sm:text-sm md:text-base whitespace-nowrap">
                        More shopping, more savings — only at KhajurKart.
                    </p>
                </div>

                {/* Duplicate for a seamless continuous loop */}
                <div
                    className="flex w-max shrink-0 items-center gap-2 px-6 whitespace-nowrap"
                    aria-hidden="true"
                >
                    <Truck className="h-5 w-5 shrink-0" />

                    <p className="text-xs font-semibold sm:text-sm md:text-base whitespace-nowrap">
                        Enjoy <span className="font-bold">FREE DELIVERY</span> on orders above{' '}
                        <span className="font-bold">₹2,000!</span>
                    </p>

                    <span className="mx-3 opacity-60">|</span>

                    <p className="text-xs font-normal sm:text-sm md:text-base whitespace-nowrap">
                        More shopping, more savings — only at KhajurKart.
                    </p>
                </div>
            </div>
        </div>
    </div>
);


    return (
        <div
            className="free-delivery-banner"
            role="region"
            aria-label="Free delivery announcement"
        >
            <div className="announcement-marquee">
                <div className="announcement-track">
                    {/* Two identical groups create a seamless scrolling loop */}
                    <div className="announcement-group">
                        {announcement}
                    </div>
                    <div className="announcement-group" aria-hidden="true">
                        {announcement}
                    </div>
                </div>
            </div>

            <style>{`
                .free-delivery-banner {
                    width: 100%;
                    overflow: hidden;
                    background: #C6A962;
                    color: #0F3D2E;
                }

                .announcement-marquee {
                    width: 100%;
                    overflow: hidden;
                }

                .announcement-track {
                    display: flex;
                    width: max-content;
                    animation: khajur-delivery-marquee 25s linear infinite;
                    will-change: transform;
                }

                .announcement-group {
                    display: flex;
                    flex: 0 0 auto;
                    align-items: center;
                    justify-content: center;
                    padding: 10px 0;
                    white-space: nowrap;
                }

                .announcement-content {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 9px;
                    padding: 0 28px;
                    white-space: nowrap;
                    font-size: 15px;
                    line-height: 1.5;
                }

                .announcement-truck {
                    width: 20px;
                    height: 20px;
                    flex-shrink: 0;
                }

                .announcement-separator {
                    margin: 0 3px;
                    opacity: 0.6;
                }

                @keyframes khajur-delivery-marquee {
                    from {
                        transform: translateX(0);
                    }
                    to {
                        transform: translateX(-50%);
                    }
                }

                @media (max-width: 640px) {
                    .announcement-group {
                        padding: 9px 0;
                    }

                    .announcement-content {
                        gap: 6px;
                        padding: 0 16px;
                        font-size: 12px;
                    }

                    .announcement-truck {
                        width: 16px;
                        height: 16px;
                    }

                    .announcement-separator {
                        margin: 0 2px;
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .announcement-track {
                        animation: none;
                    }

                    .announcement-group:nth-child(2) {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
};

// ─── Navigation Link ──────────────────────────────────────────────────────────

const NavLink = ({ to, label, isActive, onClick, testId }) => (
    <Link
        to={to}
        onClick={onClick}
        data-testid={testId}
        className={`
            relative font-sans text-sm uppercase tracking-wider font-semibold
            transition-colors duration-200 pb-0.5 whitespace-nowrap
            ${isActive
                ? 'text-khajur-gold'
                : 'text-khajur-cream/80 hover:text-white'
            }
            after:absolute after:bottom-0 after:left-0 after:h-px after:bg-khajur-gold
            after:transition-all after:duration-300
            ${isActive ? 'after:w-full' : 'after:w-0 hover:after:w-full'}
        `}
    >
        {label}
    </Link>
);

// ─── Search Form ──────────────────────────────────────────────────────────────

const SearchForm = ({
    value,
    onChange,
    onSubmit,
    className = '',
}) => (
    <form onSubmit={onSubmit} className={className}>
        <div className="relative">
            <label htmlFor="search-input" className="sr-only">
                Search products
            </label>

            <input
                id="search-input"
                type="text"
                placeholder="Search..."
                value={value}
                onChange={onChange}
                className="w-40 bg-white/5 border border-white/10 hover:border-white/40 focus:border-khajur-gold text-sm text-khajur-cream placeholder:text-khajur-cream/30 pl-3 pr-8 py-2 rounded-sm focus:outline-none transition-colors"
            />

            <button
                type="submit"
                aria-label="Search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-khajur-cream/40 hover:text-white transition-colors"
            >
                <Search className="w-4 h-4" />
            </button>
        </div>
    </form>
);

// ─── Cart Button ──────────────────────────────────────────────────────────────

const CartButton = ({ count }) => (
    <Link
        to="/cart"
        className="relative text-khajur-cream/70 hover:text-white transition-colors duration-200"
        aria-label="Shopping cart"
    >
        <ShoppingCart className="w-5 h-5" />

        {count > 0 && (
            <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 bg-khajur-gold text-khajur-primary text-[10px] font-bold rounded-full flex items-center justify-center">
                {count > 99 ? '99+' : count}
            </span>
        )}
    </Link>
);

// ─── Account Button ───────────────────────────────────────────────────────────

const AccountButton = ({ user, onClick }) => (
    <button
        onClick={onClick}
        className="flex items-center gap-2 text-khajur-cream/70 hover:text-white transition-colors duration-200 group"
        aria-label={user ? `Account: ${user.name}` : 'Sign in'}
        data-testid="account-button"
    >
        <span
            className={`
                flex items-center justify-center transition-all duration-200
                ${user
                    ? 'w-8 h-8 border border-khajur-cream/30 rounded-sm group-hover:border-white/60'
                    : ''
                }
            `}
        >
            <User className="w-5 h-5" />
        </span>

        {user && (
            <span className="hidden sm:block text-sm font-semibold tracking-wide text-khajur-cream/80 group-hover:text-white transition-colors duration-200">
                {user.name?.split(' ')[0] || 'Account'}
            </span>
        )}
    </button>
);

// ─── Main Navbar Component ────────────────────────────────────────────────────

const Navbar = () => {
    const { user } = useAuth();
    const { cartCount } = useCart();

    const navigate = useNavigate();
    const location = useLocation();
    const mobileMenuRef = useRef(null);

    const [menuOpen, setMenuOpen] = useState(false);
    const [authOpen, setAuthOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 10);

        window.addEventListener('scroll', handler, { passive: true });

        return () => window.removeEventListener('scroll', handler);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();

        if (query.trim()) {
            navigate(`/search?q=${encodeURIComponent(query.trim())}`);
            setQuery('');
            setMenuOpen(false);
        }
    };

    const handleAuthClick = () => {
        if (user) {
            navigate('/account');
        } else {
            setAuthOpen(true);
        }
    };

    const links = user
        ? [...NAV_LINKS, { label: 'My Orders', to: '/my-orders' }]
        : NAV_LINKS;

    return (
        <>
            {/* Scrolling golden delivery announcement */}
            <FreeDeliveryBanner />

            <nav
                className={`
                    bg-khajur-primary sticky top-0 z-50
                    transition-shadow duration-300
                    ${scrolled
                        ? 'shadow-[0_4px_24px_rgba(0,0,0,0.3)]'
                        : ''
                    }
                `}
            >
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="flex items-center justify-between h-20">

                        {/* Logo */}
                        <Link
                            to="/"
                            className="flex items-center gap-3 group flex-shrink-0"
                        >
                            <img
                                src="https://res.cloudinary.com/dwpqa8pgl/image/upload/v1791034028/Logo_plrhvn.png"
                                alt="KhajurKart"
                                className="h-12 w-auto"
                            />

                            <span className="font-serif text-2xl font-bold text-khajur-gold group-hover:text-khajur-gold/80 transition-colors">
                                KhajurKart
                            </span>
                        </Link>

                        {/* Desktop Navigation Links */}
                        <div className="hidden md:flex items-center justify-center flex-1 gap-6">
                            {links.map((link) => (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    label={link.label}
                                    isActive={location.pathname === link.to}
                                />
                            ))}
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-5 flex-shrink-0">

                            {/* Desktop Search */}
                            <div className="hidden lg:block">
                                <SearchForm
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onSubmit={handleSearch}
                                />
                            </div>

                            {/* Account */}
                            <AccountButton
                                user={user}
                                onClick={handleAuthClick}
                            />

                            {/* Cart */}
                            <CartButton count={cartCount} />

                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="md:hidden text-khajur-cream/70 hover:text-white transition-colors"
                                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                            >
                                {menuOpen
                                    ? <X className="w-6 h-6" />
                                    : <Menu className="w-6 h-6" />
                                }
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                <div
                    ref={mobileMenuRef}
                    className={`
                        md:hidden bg-khajur-primary border-t border-white/5
                        transition-all duration-300 overflow-hidden
                        ${menuOpen
                            ? 'max-h-screen opacity-100'
                            : 'max-h-0 opacity-0'
                        }
                    `}
                >
                    <div className="px-6 py-8 space-y-6">
                        {links.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={() => setMenuOpen(false)}
                                className={`
                                    block text-sm uppercase tracking-wider font-semibold
                                    ${location.pathname === link.to
                                        ? 'text-khajur-gold'
                                        : 'text-khajur-cream/80 hover:text-white'
                                    }
                                `}
                            >
                                {link.label}
                            </Link>
                        ))}

                        {/* Mobile Search */}
                        <SearchForm
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onSubmit={handleSearch}
                            className="pt-2"
                        />

                        {/* Mobile Account */}
                        <button
                            onClick={() => {
                                handleAuthClick();
                                setMenuOpen(false);
                            }}
                            className="flex items-center gap-3 text-khajur-cream/80 hover:text-white transition-colors text-sm font-semibold uppercase tracking-wider"
                        >
                            <User className="w-5 h-5" />

                            {user
                                ? (user.name?.split(' ')[0] || 'Account')
                                : 'Sign In'
                            }
                        </button>
                    </div>
                </div>
            </nav>

            <AuthModal
                isOpen={authOpen}
                onClose={() => setAuthOpen(false)}
            />
        </>
    );
};

export default Navbar;
