import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import AuthModal from './AuthModal';

// ─── Constants ─────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'Home',        to: '/'            },
  { label: 'About Us',    to: '/about'       },
  { label: 'Products',    to: '/products'    },
  { label: 'Bulk Orders', to: '/bulk-orders' },
  { label: 'Contact Us',  to: '/contact'     },
];

// ─── Sub-Components ────────────────────────────────────────────────────────────

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
        : 'text-khajur-cream/80 hover:text-khajur-gold'
      }
      after:absolute after:bottom-0 after:left-0 after:h-px after:bg-khajur-gold
      after:transition-all after:duration-300
      ${isActive ? 'after:w-full' : 'after:w-0 hover:after:w-full'}
    `}
  >
    {label}
  </Link>
);

// ── Search — icon only, expands on focus ───────────────────────────────────────

const SearchForm = ({ value, onChange, onSubmit, className = '' }) => {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  return (
    <form onSubmit={onSubmit} className={className}>
      <div className="relative flex items-center">
        {/* ✅ Icon button — clicking focuses the input */}
        <button
          type="button"
          onClick={() => inputRef.current?.focus()}
          data-testid="search-button"
          className="
            w-8 h-8 flex items-center justify-center
            text-khajur-cream/50 hover:text-khajur-gold
            transition-colors duration-200 flex-shrink-0
          "
          aria-label="Search"
        >
          <Search className="w-[18px] h-[18px]" />
        </button>

        {/* ✅ Input expands when focused, collapses when empty & blurred */}
        <input
          ref={inputRef}
          type="text"
          placeholder="Search…"
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            if (!value) setFocused(false);
          }}
          data-testid="search-input"
          className={`
            bg-white/5 border border-khajur-gold/20
            hover:border-khajur-gold/30 focus:border-khajur-gold
            text-sm text-khajur-cream placeholder:text-khajur-cream/30
            pl-2 pr-2 py-1.5 rounded-sm
            focus:outline-none transition-all duration-300
            ${focused || value ? 'w-32 opacity-100' : 'w-0 opacity-0 border-transparent'}
          `}
        />
      </div>
    </form>
  );
};

// ── Cart Button ────────────────────────────────────────────────────────────────

const CartButton = ({ count }) => (
  <Link
    to="/cart"
    data-testid="cart-button"
    className="relative text-khajur-cream/70 hover:text-khajur-gold transition-colors duration-200"
    aria-label="Shopping cart"
  >
    <ShoppingCart className="w-5 h-5" />
    {count > 0 && (
      <span
        data-testid="cart-count"
        className="
          absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1
          bg-khajur-gold text-khajur-primary
          text-[10px] font-bold rounded-full
          flex items-center justify-center
        "
      >
        {count > 99 ? '99+' : count}
      </span>
    )}
  </Link>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const Navbar = () => {
  const { user }      = useAuth();
  const { cartCount } = useCart();
  const navigate      = useNavigate();
  const location      = useLocation();
  const mobileMenuRef = useRef(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [query, setQuery]       = useState('');
  const [scrolled, setScrolled] = useState(false);

  // ── Scroll shadow ──────────────────────────────────────────────────────────

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // ── Close menu on outside click ────────────────────────────────────────────

  useEffect(() => {
    const handler = (e) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  // ── Close menu on route change ─────────────────────────────────────────────

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // ── Handlers ───────────────────────────────────────────────────────────────

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

  const isActive = (to) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  const links = user
    ? [...NAV_LINKS, { label: 'My Orders', to: '/my-orders' }]
    : NAV_LINKS;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <nav
        data-testid="main-navbar"
        className={`
          bg-khajur-primary sticky top-0 z-50
          transition-shadow duration-300
          ${scrolled ? 'shadow-[0_4px_24px_rgba(0,0,0,0.3)]' : ''}
        `}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12">

          {/* ── Desktop Layout ── */}
          <div className="hidden md:flex items-center justify-between h-20 gap-4">

            {/* Logo */}
            <Link
              to="/"
              data-testid="logo-link"
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

            {/* Nav Links — centered */}
            <div className="flex items-center justify-center flex-1 gap-5">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  label={link.label}
                  isActive={isActive(link.to)}
                  testId={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                />
              ))}
            </div>

            {/* ✅ Actions — search is now compact icon that expands on click */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <SearchForm
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onSubmit={handleSearch}
              />

              <button
                onClick={handleAuthClick}
                data-testid="account-button"
                aria-label={user ? 'Go to account' : 'Sign in'}
                className="
                  flex items-center gap-1.5
                  text-khajur-cream/70 hover:text-khajur-gold
                  transition-colors duration-200
                "
              >
                <User className="w-5 h-5" />
                {user && (
                  <span className="text-sm font-medium hidden lg:block">
                    {user.name?.split(' ')[0]}
                  </span>
                )}
              </button>

              <CartButton count={cartCount} />
            </div>
          </div>

          {/* ── Mobile Layout ── */}
          <div className="flex md:hidden items-center justify-between h-20">

            <Link
              to="/"
              data-testid="logo-link"
              className="flex items-center gap-2 group flex-shrink-0"
            >
              <img
                src="https://res.cloudinary.com/dwpqa8pgl/image/upload/v1777381692/Logo-Photoroom_nslk5u.png"
                alt="KhajurKart"
                className="h-11 w-auto"
              />
              <span className="font-serif text-xl font-bold text-khajur-gold group-hover:text-khajur-gold/80 transition-colors">
                KhajurKart
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <button
                onClick={handleAuthClick}
                data-testid="account-button"
                aria-label="Account"
                className="text-khajur-cream/70 hover:text-khajur-gold transition-colors"
              >
                <User className="w-5 h-5" />
              </button>

              <CartButton count={cartCount} />

              <button
                onClick={() => setMenuOpen((o) => !o)}
                data-testid="mobile-menu-toggle"
                aria-label="Toggle menu"
                className="text-khajur-cream/70 hover:text-khajur-gold transition-colors"
              >
                {menuOpen
                  ? <X className="w-5 h-5" />
                  : <Menu className="w-5 h-5" />
                }
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        <div
          ref={mobileMenuRef}
          data-testid="mobile-menu"
          className={`
            md:hidden overflow-hidden transition-all duration-300 ease-in-out
            border-t border-khajur-gold/10
            ${menuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}
          `}
        >
          <div className="px-6 py-6 space-y-5 bg-khajur-primary">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`
                  block text-sm uppercase tracking-wider font-semibold
                  transition-colors duration-200
                  ${isActive(link.to)
                    ? 'text-khajur-gold'
                    : 'text-khajur-cream/70 hover:text-khajur-gold'
                  }
                `}
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile search — full width */}
            <form onSubmit={handleSearch} className="pt-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="
                    w-full bg-white/5 border border-khajur-gold/20
                    focus:border-khajur-gold text-sm text-khajur-cream
                    placeholder:text-khajur-cream/30 pl-4 pr-10 py-2.5
                    rounded-sm focus:outline-none transition-colors
                  "
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-khajur-cream/40 hover:text-khajur-gold"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>
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
