
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import { getCache, setCache } from '../utils/cache';
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

// ─── Constants ────────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
    { value: 'featured', label: 'Featured' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'price-min', label: 'Price: Low' },
    { value: 'price-max', label: 'Price: High' },
];

// Categories appear in this order on the Our Products page.
const CATEGORY_ORDER = [
    'dates',
    'nuts',
    'dry fruits',
    'spices',
    'natural spices powder',
    'seeds',
    'stuffed dates',
];

// Sort categories by the preferred order.
// Any additional categories appear alphabetically afterward.
const orderedCategories = (categories) => {
    return [...categories].sort((a, b) => {
        const nameA = (a.name || '').trim().toLowerCase();
        const nameB = (b.name || '').trim().toLowerCase();

        const indexA = CATEGORY_ORDER.indexOf(nameA);
        const indexB = CATEGORY_ORDER.indexOf(nameB);

        if (indexA === -1 && indexB === -1) {
            return nameA.localeCompare(nameB);
        }

        if (indexA === -1) return 1;
        if (indexB === -1) return -1;

        return indexA - indexB;
    });
};

// ─── Sub-Components ───────────────────────────────────────────────────────────

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
                    : 'No products are available at the moment. Check back soon.'}
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
            ${
                isActive
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

    const selectedLabel =
        SORT_OPTIONS.find((option) => option.value === value)?.label ?? 'Featured';

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
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
                    onClick={() => setIsOpen((previous) => !previous)}
                    data-testid="sort-dropdown"
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                    className={`
                        flex items-center justify-between gap-8
                        min-w-[175px] px-4 py-2 rounded-sm text-xs font-medium
                        border transition-all duration-200 cursor-pointer
                        bg-[#F8F4EC] text-khajur-primary
                        ${
                            isOpen
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
                        role="listbox"
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
                                        key={option.value}
                                        role="option"
                                        aria-selected={isActive}
                                        onClick={() => handleSelect(option.value)}
                                        className={`
                                            w-full flex items-center justify-between
                                            px-4 py-3 text-xs font-medium text-left
                                            transition-all duration-150 cursor-pointer
                                            ${
                                                isActive
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

// ─── Main Component ───────────────────────────────────────────────────────────

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

    // ── Page Title ─────────────────────────────────────────────────────────────

    useEffect(() => {
        document.title = 'Our Products — KhajurKart';

        return () => {
            document.title = 'KhajurKart — Premium Dates, Dry Fruits & Spices';
        };
    }, []);

    // ── Sync Category from URL ─────────────────────────────────────────────────

    useEffect(() => {
        const category =
            new URLSearchParams(location.search).get('category') || '';

        setSelected(category);
    }, [location.search]);

    // ── Fetch Categories with Cache ────────────────────────────────────────────

    const fetchCategories = useCallback(async () => {
        const cached = getCache('categories');

        if (cached) {
            setCategories(cached);
            return;
        }

        try {
            const { data } = await axios.get(`${API}/categories`);

            setCache('categories', data);
            setCategories(data);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            setCategories([]);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // ── Fetch Products ─────────────────────────────────────────────────────────

    const fetchProducts = useCallback(async () => {
        setLoading(true);

        try {
            const url = selected
                ? `${API}/products?category=${encodeURIComponent(selected)}`
                : `${API}/products`;

            const { data } = await axios.get(url);

            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch products:', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [selected]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // ── Sort Products ──────────────────────────────────────────────────────────

    const sortedProducts = useCallback(() => {
        const items = [...products];

        switch (sortBy) {
            case 'price-low':
                return items.sort((a, b) => Number(a.price) - Number(b.price));

            case 'price-high':
                return items.sort((a, b) => Number(b.price) - Number(a.price));

            case 'price-min':
                return items
                    .sort((a, b) => Number(a.price) - Number(b.price))
                    .slice(0, 1);

            case 'price-max':
                return items
                    .sort((a, b) => Number(b.price) - Number(a.price))
                    .slice(0, 1);

            default:
                return items;
        }
    }, [products, sortBy]);

    // ── Handlers ───────────────────────────────────────────────────────────────

    const handleCategory = (slug) => {
        navigate(
            slug
                ? `/products?category=${encodeURIComponent(slug)}`
                : '/products'
        );
    };

    const handleSort = (value) => {
        setSortBy(value);
    };

    const displayProducts = sortedProducts();

    // Apply the requested order to the category filter buttons.
    const displayCategories = orderedCategories(categories);

    return (
        <div
            id="main-content"
            className="min-h-screen bg-white py-16 md:py-24"
            data-testid="products-page"
        >
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

                            {displayCategories.map((cat) => (
                                <CategoryBtn
                                    key={cat.id ?? cat.slug}
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
                            <SortDropdown
                                value={sortBy}
                                onChange={handleSort}
                            />
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
                            <ProductCard
                                key={product.id}
                                product={product}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Products;
