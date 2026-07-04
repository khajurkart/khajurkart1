import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X } from 'lucide-react';
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

const SearchForm = ({ value, onChange, onSubmit, className = '' }) => (
    <form onSubmit={onSubmit} className={className}>
        <div className="relative">
            <label htmlFor="search-input" className="sr-only">Search products</label>
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
                className="absolute right-2 top-1/2 -translate-y-1/2 text-khajur-cream/40 hover:text-white transition-colors"
            >
                <Search className="w-4 h-4" />
            </button>
        </div>
    </form>
);

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

// ── Account Button ─────────────────────────────────────────────────────────────
// Shows icon + first name when logged in, icon only when logged out

const AccountButton = ({ user, onClick }) => (
    <button
        onClick={onClick}
        className="flex items-center gap-2 text-khajur-cream/70 hover:text-white transition-colors duration-200 group"
        aria-label={user ? `Account: ${user.name}` : 'Sign in'}
        data-testid="account-button"
    >
        {/* Icon — boxed style when logged in, plain when logged out */}
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

        {/* First name — only shown when logged in */}
        {user && (
            <span className="hidden sm:block text-sm font-semibold tracking-wide text-khajur-cream/80 group-hover:text-white transition-colors duration-200">
                {user.name?.split(' ')[0] || 'Account'}
            </span>
        )}
    </button>
);

// ─── Main Component ────────────────────────────────────────────────────────────

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
        if (user) navigate('/account');
        else setAuthOpen(true);
    };

    const links = user
        ? [...NAV_LINKS, { label: 'My Orders', to: '/my-orders' }]
        : NAV_LINKS;

    return (
        <>
            <nav
                className={`
                    bg-khajur-primary sticky top-0 z-50
                    transition-shadow duration-300
                    ${scrolled ? 'shadow-[0_4px_24px_rgba(0,0,0,0.3)]' : ''}
                `}
            >
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="flex items-center justify-between h-20">

                        {/* ── Logo ── */}
                        <Link
                            to="/"
                            className="flex items-center gap-2 group flex-shrink-0"
                        >
                            <img
                                src="https://res.cloudinary.com/dwpqa8pgl/image/upload/v1777381692/Logo-Photoroom_nslk5u.png"
                                alt="KhajurKart"
                                className="h-12 w-auto"
                            />
                            <span className="font-serif text-2xl font-bold text-khajur-gold group-hover:text-khajur-gold/80 transition-colors">
                                KhajurKart
                            </span>
                        </Link>

                        {/* ── Desktop Nav Links ── */}
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

                        {/* ── Right Actions ── */}
                        <div className="flex items-center gap-5 flex-shrink-0">

                            {/* Search — desktop only */}
                            <div className="hidden lg:block">
                                <SearchForm
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onSubmit={handleSearch}
                                />
                            </div>

                            {/* Account button with name */}
                            <AccountButton user={user} onClick={handleAuthClick} />

                            {/* Cart */}
                            <CartButton count={cartCount} />

                            {/* Mobile menu toggle */}
                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="md:hidden text-khajur-cream/70 hover:text-white transition-colors"
                                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                            >
                                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Mobile Menu ── */}
                <div
                    ref={mobileMenuRef}
                    className={`
                        md:hidden bg-khajur-primary border-t border-white/5
                        transition-all duration-300 overflow-hidden
                        ${menuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}
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

                        {/* Mobile search */}
                        <SearchForm
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onSubmit={handleSearch}
                            className="pt-2"
                        />

                        {/* Mobile account row */}
                        <button
                            onClick={() => { handleAuthClick(); setMenuOpen(false); }}
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

            <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
        </>
    );
};

export default Navbar;
