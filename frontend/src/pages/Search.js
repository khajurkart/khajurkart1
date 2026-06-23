import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import {
  Search as SearchIcon,
  Loader2,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ─── Sub-Components ────────────────────────────────────────────────────────────

// ── Loading ────────────────────────────────────────────────────────────────────

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-32 gap-4 text-khajur-dark/40">
    <Loader2 className="w-8 h-8 animate-spin" />
    <p className="text-sm">Searching products…</p>
  </div>
);

// ── Empty Query ────────────────────────────────────────────────────────────────

const EmptyQuery = () => (
  <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
    <div className="w-16 h-16 flex items-center justify-center bg-khajur-cream rounded-full">
      <SearchIcon className="w-7 h-7 text-khajur-dark/25" />
    </div>
    <div>
      <p className="font-serif text-xl font-medium text-khajur-primary mb-2">
        What are you looking for?
      </p>
      <p className="text-sm text-khajur-dark/50 max-w-xs">
        Use the search bar above to find dates, dry fruits, spices and more.
      </p>
    </div>
    <Link
      to="/products"
      className="
        flex items-center gap-2 text-xs uppercase tracking-widest font-semibold
        text-khajur-primary hover:text-khajur-gold transition-colors
      "
    >
      Browse All Products
      <ArrowRight className="w-3.5 h-3.5" />
    </Link>
  </div>
);

// ── No Results ─────────────────────────────────────────────────────────────────

const NoResults = ({ query }) => (
  <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
    <div className="w-16 h-16 flex items-center justify-center bg-khajur-cream rounded-full">
      <ShoppingBag className="w-7 h-7 text-khajur-dark/25" />
    </div>
    <div>
      <p className="font-serif text-xl font-medium text-khajur-primary mb-2">
        No results found
      </p>
      <p className="text-sm text-khajur-dark/50 max-w-xs">
        We couldn't find any products matching{' '}
        <span className="font-semibold text-khajur-primary">"{query}"</span>.
        Try a different keyword.
      </p>
    </div>
    <Link
      to="/products"
      className="
        flex items-center gap-2 bg-khajur-gold hover:bg-khajur-gold/90
        hover:shadow-[0_0_20px_rgba(198,169,98,0.35)]
        text-khajur-primary px-8 py-3 rounded-sm
        uppercase tracking-widest text-xs font-bold transition-all duration-300
      "
    >
      <ShoppingBag className="w-4 h-4" />
      Browse All Products
    </Link>
  </div>
);

// ── Results Header ─────────────────────────────────────────────────────────────

const ResultsHeader = ({ query, count }) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-10">
    <div>
      <p className="text-xs uppercase tracking-widest text-khajur-gold mb-1">
        Search Results
      </p>
      <h2 className="font-serif text-2xl font-medium text-khajur-primary">
        Results for{' '}
        <span className="text-khajur-gold">"{query}"</span>
      </h2>
    </div>
    <p className="text-sm text-khajur-dark/50 flex-shrink-0">
      <span className="font-semibold text-khajur-primary">{count}</span>{' '}
      product{count !== 1 ? 's' : ''} found
    </p>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const Search = () => {
  const [searchParams]          = useSearchParams();
  const query                   = searchParams.get('q') || '';
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const searchProducts = useCallback(async () => {
    if (!query.trim()) {
      setProducts([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${API}/search?q=${encodeURIComponent(query.trim())}`
      );
      setProducts(data);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    searchProducts();
  }, [searchProducts]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white py-16 md:py-24" data-testid="search-page">
      <div className="max-w-7xl mx-auto px-6 md:px-12">

        {/* ── Page Header ── */}
        <div className="border-b border-khajur-gold/20 pb-10 mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 flex items-center justify-center bg-khajur-cream rounded-sm">
              <SearchIcon className="w-4 h-4 text-khajur-gold" />
            </div>
            <p className="text-xs uppercase tracking-widest text-khajur-gold font-medium">
              Search
            </p>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-medium text-khajur-primary leading-tight">
            {query ? (
              <>
                Results for{' '}
                <span className="text-khajur-gold italic">"{query}"</span>
              </>
            ) : (
              'Search Products'
            )}
          </h1>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <LoadingState />
        ) : !query ? (
          <EmptyQuery />
        ) : products.length === 0 ? (
          <NoResults query={query} />
        ) : (
          <>
            <ResultsHeader query={query} count={products.length} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default Search;
