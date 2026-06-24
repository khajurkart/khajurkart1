import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import {
  Filter,
  Loader2,
  PackageSearch,
  ShoppingBag,
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ─── Sub-Components ────────────────────────────────────────────────────────────

// ── Loading ────────────────────────────────────────────────────────────────────

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-32 gap-4 text-khajur-dark/40">
    <Loader2 className="w-8 h-8 animate-spin" />
    <p className="text-sm">Loading products…</p>
  </div>
);

// ── Empty State ────────────────────────────────────────────────────────────────

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

// ── Category Button ────────────────────────────────────────────────────────────

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

// ─── Main Component ────────────────────────────────────────────────────────────

const Products = () => {
  const navigate            = useNavigate();
  const location            = useLocation();
  const [searchParams]      = useSearchParams();

  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(
    searchParams.get('category') || ''
  );

  // ── Sync category from URL ─────────────────────────────────────────────────

  useEffect(() => {
    const cat = new URLSearchParams(location.search).get('category') || '';
    setSelected(cat);
  }, [location.search]);

  // ── Fetch Categories ───────────────────────────────────────────────────────

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/categories`);
      setCategories(data);
    } catch {
      // silent
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

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleCategory = (slug) => {
    navigate(slug ? `/products?category=${slug}` : '/products');
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white py-16 md:py-24" data-testid="products-page">
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
            {!loading && (
              <p className="text-sm text-khajur-dark/50 mb-1">
                <span className="font-semibold text-khajur-primary">{products.length}</span>{' '}
                product{products.length !== 1 ? 's' : ''}{' '}
                {selected ? `in "${selected}"` : 'available'}
              </p>
            )}
          </div>
          <p className="text-sm text-khajur-dark/50 mt-3 max-w-xl leading-relaxed">
            Explore our premium collection of dates, nuts, dry fruits, and spices —
            sourced from the finest origins around the world.
          </p>
        </div>

        {/* ── Category Filter ── */}
        <div className="mb-12" data-testid="category-filter">
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

        {/* ── Products Grid ── */}
        {loading ? (
          <LoadingState />
        ) : products.length === 0 ? (
          <EmptyState
            category={selected}
            onReset={() => handleCategory('')}
          />
        ) : (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            data-testid="products-grid"
          >
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default Products;
