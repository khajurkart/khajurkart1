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

// ─────────────────────────────────────────────────────────────────────────────
// Loading State
// ─────────────────────────────────────────────────────────────────────────────
const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-32 gap-4 text-khajur-dark/40">
    <Loader2 className="w-8 h-8 animate-spin" />
    <p className="text-sm tracking-wide">Loading products…</p>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────────────────────────────────────
const EmptyState = ({ category, onReset }) => (
  <div className="flex flex-col items-center justify-center py-28 gap-6 text-center">
    <div className="w-16 h-16 flex items-center justify-center bg-[#F8F4EC] rounded-full">
      <PackageSearch className="w-7 h-7 text-khajur-dark/25" />
    </div>

    <div>
      <p className="font-serif text-2xl font-medium text-khajur-primary mb-2">
        No products found
      </p>
      <p className="text-sm text-khajur-dark/50 max-w-sm leading-relaxed">
        {category
          ? `We couldn't find any products in "${category}". Try a different category.`
          : 'No products are available at the moment. Check back soon.'}
      </p>
    </div>

    {category && (
      <button
        onClick={onReset}
        className="
          flex items-center gap-2 bg-khajur-primary hover:opacity-95
          text-white px-7 py-3 rounded-sm
          uppercase tracking-[0.18em] text-[11px] font-semibold
          transition-all duration-300
        "
      >
        <ShoppingBag className="w-4 h-4" />
        View All Products
      </button>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Category Button
// ─────────────────────────────────────────────────────────────────────────────
const CategoryBtn = ({ label, isActive, onClick, testId }) => (
  <button
    onClick={onClick}
    data-testid={testId}
    className={`
      px-6 py-[11px] border text-[11px] md:text-xs font-semibold uppercase
      tracking-[0.16em] rounded-none transition-all duration-200 whitespace-nowrap
      ${
        isActive
          ? 'bg-khajur-primary text-white border-khajur-primary'
          : 'bg-white text-khajur-primary border-[#E6DCCB] hover:border-khajur-primary hover:text-khajur-primary'
      }
    `}
  >
    {label}
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const Products = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(searchParams.get('category') || '');

  // Sync selected category from URL
  useEffect(() => {
    const cat = new URLSearchParams(location.search).get('category') || '';
    setSelected(cat);
  }, [location.search]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/categories`);
      setCategories(data || []);
    } catch (error) {
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const url = selected
        ? `${API}/products?category=${selected}`
        : `${API}/products`;

      const { data } = await axios.get(url);
      setProducts(data || []);
    } catch (error) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Category click handler
  const handleCategory = (slug) => {
    navigate(slug ? `/products?category=${slug}` : '/products');
  };

  return (
    <div className="min-h-screen bg-white pt-16 md:pt-20 pb-20" data-testid="products-page">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 lg:px-14">

        {/* ───────────────── Header ───────────────── */}
        <section className="border-b border-[#EEE4D6] pb-12 md:pb-14 mb-12 md:mb-14">
          <p className="text-[11px] md:text-xs uppercase tracking-[0.18em] text-khajur-gold font-medium mb-3">
            Collection
          </p>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div className="max-w-3xl">
              <h1 className="font-serif text-[42px] md:text-[56px] leading-[0.95] font-medium text-khajur-primary">
                Our Products
              </h1>

              <p className="text-[15px] md:text-base text-khajur-dark/55 mt-5 max-w-2xl leading-8">
                Explore our premium collection of dates, nuts, dry fruits, and spices —
                sourced from the finest origins around the world.
              </p>
            </div>

            {!loading && (
              <p className="text-sm md:text-base text-khajur-dark/45 mt-2 lg:mt-3 whitespace-nowrap">
                <span className="font-semibold text-khajur-primary">{products.length}</span>{' '}
                products available
              </p>
            )}
          </div>
        </section>

        {/* ───────────────── Filter Section ───────────────── */}
        <section className="mb-12 md:mb-14" data-testid="category-filter">
          <div className="flex items-center gap-2 mb-5">
            <Filter className="w-4 h-4 text-khajur-gold" />
            <p className="text-[11px] md:text-xs uppercase tracking-[0.16em] font-medium text-khajur-dark/50">
              Filter by Category
            </p>
          </div>

          <div className="flex flex-wrap gap-3 md:gap-4">
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
        </section>

        {/* ───────────────── Product Grid ───────────────── */}
        {loading ? (
          <LoadingState />
        ) : products.length === 0 ? (
          <EmptyState
            category={selected}
            onReset={() => handleCategory('')}
          />
        ) : (
          <section
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8"
            data-testid="products-grid"
          >
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </section>
        )}
      </div>
    </div>
  );
};

export default Products;
