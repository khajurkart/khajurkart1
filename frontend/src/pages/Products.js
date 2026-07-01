import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import { getCache, setCache } from '../utils/cache'; // ← add this import
import {
    Filter,
    Loader2,
    PackageSearch,
    ShoppingBag,
    ArrowUpDown,
    ChevronDown,
    Check,
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ─── Constants ─────────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
    { value: 'featured', label: 'Featured' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'price-min', label: 'Price: Low' },
    { value: 'price-max', label: 'Price: High' },
];

// ─── Sub-Components ────────────────────────────────────────────────────────────

const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-32 gap-4 text-khajur-dark/40">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-sm">Loading products…</p>
    </div>
);

const EmptyState = ({ category, onReset }) => (
    <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
        <div className="w-16 h-16 flex items-center justify-center bg-khajur-cream rounded-full">
            <PackageSearch className="w-7 h-7 text-khajur-dark/25" />
        </div>
        <div>
            <p className="font-serif text-xl font-medium text-khajur-primary mb-2">
                No products found
            </p>
            <p className="text-sm text-khajur-dark/50 max-w-xs">
                {category
                    ? `We couldn't find any products in "${category}". Try a different category.`
                    : 'No products are available at the moment. Check back soon.'
                }
            </p>
        </div>
        {category && (
            <button
                onClick={onReset}
                className="
          flex items-center gap-2 bg-khajur-gold hover:bg-khajur-gold/90
          text-khajur-primary px-8 py-3 rounded-sm
          uppercase tracking-widest text-xs font-bold transition-all duration-300
        "
            >
                <ShoppingBag className="w-4 h-4" />
                View All Products
            </button>
        )}
    </div>
);

const CategoryBtn = ({ label, isActive, onClick, testId }) => (
    <button
        onClick={onClick}
        data-testid={testId}
        className={`
      px-5 py-2 rounded-sm text-xs font-bold uppercase tracking-widest
      transition-all duration-200 border
      ${isActive
                ? 'bg-khajur-primary text-khajur-cream border-khajur-primary'
                : 'bg-transparent border-khajur-border text-khajur-primary hover:border-khajur-primary hover:bg-khajur-primary hover:text-khajur-cream'
            }
    `}
    >
        {label}
    </button>
);

const SortDropdown = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const selectedLabel = SORT_OPTIONS.find((o) => o.value === value)?.label ?? 'Featured';

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSelect = (optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-khajur-gold" />
                <span className="text-xs uppercase tracking-widest font-medium text-khajur-dark/50">
                    Sort By
                </span>
            </div>
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen((prev) => !prev)}
                    data-testid="sort-dropdown"
                    className={`
            flex items-center justify-between gap-8
            min-w-[175px] px-4 py-2 rounded-sm text-xs font-medium
            border transition-all duration-200 cursor-pointer
            bg-[#F8F4EC] text-khajur-primary
            ${isOpen
                            ? 'border-khajur-primary ring-2 ring-khajur-primary/20'
                            : 'border-khajur-border hover:border-khajur-primary'
                        }
          `}
                >
                    <span>{selectedLabel}</span>
                    <ChevronDown
                        className={`
              w-4 h-4 text-khajur-primary transition-transform duration-200
              ${isOpen ? 'rotate-180' : 'rotate-0'}
            `}
                    />
                </button>
                {isOpen && (
                    <div
                        className="
              absolute right-0 top-full mt-1 z-50
              min-w-[175px] bg-[#F8F4EC]
              border border-khajur-primary/20
              rounded-sm shadow-lg overflow-hidden
            "
                    >
                        {SORT_OPTIONS.map((option, index) => {
                            const isActive = option.value === value;
                            return (
                                <React.Fragment key={option.value}>
                                    {index === 3 && (
                                        <div className="h-px bg-khajur-primary/10 mx-3" />
                                    )}
                                    <button
                                        onClick={() => handleSelect(option.value)}
                                        className={`
                      w-full flex items-center justify-between
                      px-4 py-3 text-xs font-medium text-left
                      transition-all duration-150 cursor-pointer
                      ${isActive
                                                ? 'bg-khajur-primary text-khajur-cream'
                                                : 'text-khajur-primary hover:bg-khajur-primary/10 hover:text-khajur-primary'
                                            }
                    `}
                                    >
                                        <span>{option.label}</span>
                                        {isActive && (
                                            <Check className="w-3.5 h-3.5 text-khajur-gold flex-shrink-0" />
                                        )}
                                    </button>
                                </React.Fragment>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const Products = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(
        searchParams.get('category') || ''
    );
    const [sortBy, setSortBy] = useState('featured');

    // ── Page Title ───────────────────────────────────────────────────────────────
    useEffect(() => {
        document.title = 'Our Products — KhajurKart';
        return () => {
            document.title = 'KhajurKart — Premium Dates, Dry Fruits & Spices';
        };
    }, []);

    // ── Sync category from URL ───────────────────────────────────────────────────
    useEffect(() => {
        const cat = new URLSearchParams(location.search).get('category') || '';
        setSelected(cat);
    }, [location.search]);

    // ── Fetch Categories WITH CACHE ──────────────────────────────────────────────
    const fetchCategories = useCallback(async () => {

        // ── Check cache first ──────────────────────────────────────────────────────
        const cached = getCache('categories');
        if (cached) {
            setCategories(cached); // ← use cached data, skip API call
            return;
        }

        // ── No cache — fetch from API ──────────────────────────────────────────────
        try {
            const { data } = await axios.get(`${API}/categories`);
            setCache('categories', data); // ← save to cache for 5 minutes
            setCategories(data);
        } catch {
            // silent
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // ── Fetch Products ───────────────────────────────────────────────────────────
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const url = selected
                ? `${API}/products?category=${selected}`
                : `${API}/products`;
            const { data } = await axios.get(url);
            setProducts(data);
        } catch {
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [selected]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // ── Sort Products ────────────────────────────────────────────────────────────
    const sortedProducts = useCallback(() => {
        const arr = [...products];
        switch (sortBy) {
            case 'price-low': return arr.sort((a, b) => a.price - b.price);
            case 'price-high': return arr.sort((a, b) => b.price - a.price);
            case 'price-min': return arr.sort((a, b) => a.price - b.price).slice(0, 1);
            case 'price-max': return arr.sort((a, b) => b.price - a.price).slice(0, 1);
            default: return arr;
        }
    }, [products, sortBy]);

    // ── Handlers ─────────────────────────────────────────────────────────────────
    const handleCategory = (slug) => {
        navigate(slug ? `/products?category=${slug}` : '/products');
    };

    const handleSort = (value) => {
        setSortBy(value);
    };

    const displayProducts = sortedProducts();

    return (
        <div id="main-content" className="min-h-screen bg-white py-16 md:py-24" data-testid="products-page">
            <div className="max-w-7xl mx-auto px-6 md:px-12">

                {/* ── Page Header ── */}
                <div className="border-b border-khajur-gold/20 pb-10 mb-12">
                    <p className="text-xs uppercase tracking-widest text-khajur-gold font-medium mb-2">
                        Collection
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <h1 className="font-serif text-4xl md:text-5xl font-medium text-khajur-primary leading-tight">
                            Our Products
                        </h1>
                    </div>
                    <p className="text-sm text-khajur-dark/50 mt-3 max-w-xl leading-relaxed">
                        Explore our premium collection of dates, nuts, dry fruits, and spices —
                        sourced from the finest origins around the world.
                    </p>
                </div>

                {/* ── Filter & Sort Bar ── */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-12">
                    <div data-testid="category-filter">
                        <div className="flex items-center gap-2 mb-5">
                            <Filter className="w-4 h-4 text-khajur-gold" />
                            <p className="text-xs uppercase tracking-widest font-medium text-khajur-dark/50">
                                Filter by Category
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <CategoryBtn
                                label="All Products"
                                isActive={selected === ''}
                                onClick={() => handleCategory('')}
                                testId="category-all"
                            />
                            {categories.map((cat) => (
                                <CategoryBtn
                                    key={cat.id}
                                    label={cat.name}
                                    isActive={selected === cat.slug}
                                    onClick={() => handleCategory(cat.slug)}
                                    testId={`category-${cat.slug}`}
                                />
                            ))}
                        </div>
                    </div>
                    {!loading && products.length > 0 && (
                        <div className="lg:ml-auto">
                            <SortDropdown value={sortBy} onChange={handleSort} />
                        </div>
                    )}
                </div>

                {/* ── Products Grid ── */}
                {loading ? (
                    <LoadingState />
                ) : displayProducts.length === 0 ? (
                    <EmptyState
                        category={selected}
                        onReset={() => handleCategory('')}
                    />
                ) : (
                    <div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                        data-testid="products-grid"
                    >
                        {displayProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
};

export default Products;
