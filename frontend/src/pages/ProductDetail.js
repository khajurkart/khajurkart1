import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ShoppingCart,
  ChevronLeft,
  Star,
  Loader2,
  Package,
  ChevronDown,
  X,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';
import RelatedProducts from '../components/RelatedProducts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ─── Constants ─────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'description', label: 'Description' },
  { key: 'reviews',     label: 'Customer Reviews' },
];

const SORT_OPTIONS = [
  { value: 'latest', label: 'Newest First' },
  { value: 'top',    label: 'Top Rated' },
];

const REVIEWS_PER_PAGE = 5;

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const calcDiscount = (original, current) =>
  Math.round(((original - current) / original) * 100);

// ─── Sub-Components ────────────────────────────────────────────────────────────

// ── Star Display ───────────────────────────────────────────────────────────────

const StarDisplay = ({ rating, size = 'sm', interactive = false, onChange }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-7 h-7' };

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          onClick={() => interactive && onChange?.(i + 1)}
          className={`
            ${sizes[size]} transition-colors
            ${i < rating
              ? 'text-khajur-gold fill-khajur-gold'
              : 'text-khajur-dark/20 fill-transparent'
            }
            ${interactive ? 'cursor-pointer hover:text-khajur-gold hover:fill-khajur-gold' : ''}
          `}
        />
      ))}
    </div>
  );
};

// ── Price Block ────────────────────────────────────────────────────────────────

const PriceBlock = ({ currentPrice, originalPrice }) => {
  const discount = originalPrice > currentPrice
    ? calcDiscount(originalPrice, currentPrice)
    : 0;

  return (
    <div className="mb-6">
      <span className="font-serif text-4xl font-bold text-khajur-gold">
        ₹{currentPrice}
      </span>
      {discount > 0 && (
        <div className="flex items-center gap-3 mt-1.5">
          <span className="line-through text-khajur-dark/40 text-lg">
            ₹{originalPrice}
          </span>
          <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-sm">
            {discount}% OFF
          </span>
        </div>
      )}
    </div>
  );
};

// ── Quantity Selector ──────────────────────────────────────────────────────────

const QuantitySelector = ({ quantity, stock, onChange }) => (
  <div className="flex items-center gap-0">
    <button
      onClick={() => onChange(Math.max(1, quantity - 1))}
      className="
        w-10 h-10 bg-khajur-cream hover:bg-khajur-border
        text-khajur-primary font-bold text-lg transition-colors
        border border-khajur-border
      "
      aria-label="Decrease quantity"
    >
      −
    </button>
    <span className="w-14 h-10 flex items-center justify-center font-medium text-khajur-primary border-y border-khajur-border text-sm">
      {quantity}
    </span>
    <button
      onClick={() => onChange(Math.min(stock, quantity + 1))}
      className="
        w-10 h-10 bg-khajur-cream hover:bg-khajur-border
        text-khajur-primary font-bold text-lg transition-colors
        border border-khajur-border
      "
      aria-label="Increase quantity"
    >
      +
    </button>
  </div>
);

// ── Reviews Summary ────────────────────────────────────────────────────────────

const ReviewsSummary = ({ reviews, onWriteReview }) => {
  const total = reviews.length;
  const avg = total
    ? (reviews.reduce((a, b) => a + b.rating, 0) / total).toFixed(1)
    : '0.0';

  const dist = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    return { star, count, pct: total ? (count / total) * 100 : 0 };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-center mb-12 p-8 bg-khajur-cream border border-khajur-border">

      {/* Average */}
      <div className="text-center md:text-left">
        <p className="font-serif text-7xl font-bold text-khajur-primary leading-none mb-2">
          {avg}
        </p>
        <StarDisplay rating={Math.round(parseFloat(avg))} size="md" />
        <p className="text-sm text-khajur-dark/50 mt-2">
          Based on {total} review{total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Distribution */}
      <div className="space-y-2">
        {dist.map(({ star, count, pct }) => (
          <div key={star} className="flex items-center gap-3 text-sm">
            <span className="w-4 text-right text-khajur-dark/60 font-medium">{star}</span>
            <Star className="w-3.5 h-3.5 text-khajur-gold fill-khajur-gold flex-shrink-0" />
            <div className="flex-1 h-2 bg-khajur-border rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-khajur-primary to-khajur-gold transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-6 text-khajur-dark/50">{count}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="flex justify-center md:justify-end">
        <button
          onClick={onWriteReview}
          className="
            bg-khajur-primary text-khajur-cream
            hover:bg-khajur-primary/90 px-7 py-3
            text-xs font-bold uppercase tracking-widest transition-colors
          "
        >
          Write a Review
        </button>
      </div>
    </div>
  );
};

// ── Review Card ────────────────────────────────────────────────────────────────

const ReviewCard = ({ review }) => (
  <div className="border-b border-khajur-border pb-6 last:border-0">
    <div className="flex items-start justify-between gap-4 mb-2">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-khajur-primary flex-shrink-0 flex items-center justify-center">
          <span className="text-khajur-cream text-sm font-bold uppercase">
            {review.user_name?.charAt(0) ?? '?'}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-khajur-primary">
            {review.user_name ?? 'Anonymous'}
          </p>
          <p className="text-xs text-khajur-dark/40">{formatDate(review.created_at)}</p>
        </div>
      </div>
      <StarDisplay rating={review.rating} size="sm" />
    </div>

    {review.title && (
      <p className="text-sm font-semibold text-khajur-dark mt-2 mb-1">{review.title}</p>
    )}
    {review.comment && (
      <p className="text-sm text-khajur-dark/70 leading-relaxed">{review.comment}</p>
    )}
  </div>
);

// ── Review Form Modal ──────────────────────────────────────────────────────────

const ReviewFormModal = ({ productId, onClose, onSubmitted }) => {
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    comment: '',
    rating: 5,
  });
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter your name.');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/reviews`, {
        id: Date.now().toString(),
        product_id: productId,
        user_name: formData.name,
        title: formData.title,
        rating: formData.rating,
        comment: formData.comment,
        created_at: new Date().toISOString(),
      });
      toast.success('Review submitted successfully!');
      onSubmitted();
      onClose();
    } catch {
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-w-lg shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-khajur-border">
          <h3 className="font-serif text-xl font-medium text-khajur-primary">
            Share Your Experience
          </h3>
          <button
            onClick={onClose}
            className="text-khajur-dark/40 hover:text-khajur-primary transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">

          {/* Star Rating */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-khajur-dark/50 mb-2 block">
              Your Rating
            </label>
            <StarDisplay
              rating={formData.rating}
              size="lg"
              interactive
              onChange={(r) => updateField('rating', r)}
            />
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-khajur-dark/50 mb-1.5 block">
              Your Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g. Priya Sharma"
              className="
                w-full border border-khajur-border px-4 py-2.5 text-sm
                text-khajur-primary placeholder:text-khajur-dark/30
                focus:outline-none focus:border-khajur-gold transition-colors bg-white
              "
            />
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-khajur-dark/50 mb-1.5 block">
              Review Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Summarise your experience…"
              className="
                w-full border border-khajur-border px-4 py-2.5 text-sm
                text-khajur-primary placeholder:text-khajur-dark/30
                focus:outline-none focus:border-khajur-gold transition-colors bg-white
              "
            />
          </div>

          {/* Comment */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-khajur-dark/50 mb-1.5 block">
              Review
            </label>
            <textarea
              value={formData.comment}
              onChange={(e) => updateField('comment', e.target.value)}
              placeholder="Tell others what you think about this product…"
              rows={4}
              className="
                w-full border border-khajur-border px-4 py-2.5 text-sm
                text-khajur-primary placeholder:text-khajur-dark/30
                focus:outline-none focus:border-khajur-gold transition-colors
                bg-white resize-none
              "
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="
                flex-1 flex items-center justify-center gap-2
                bg-khajur-primary text-khajur-cream hover:bg-khajur-primary/90
                py-3 text-xs font-bold uppercase tracking-widest transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {submitting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
              Submit Review
            </button>
            <button
              type="button"
              onClick={onClose}
              className="
                px-6 py-3 border border-khajur-border text-khajur-dark/60
                hover:bg-khajur-cream text-xs font-bold uppercase tracking-widest
                transition-colors
              "
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Reviews Tab ────────────────────────────────────────────────────────────────

const ReviewsTab = ({ productId, reviews, onRefresh }) => {
  const [filterRating, setFilterRating] = useState(0);
  const [sortType, setSortType]         = useState('latest');
  const [visibleCount, setVisibleCount] = useState(REVIEWS_PER_PAGE);
  const [showForm, setShowForm]         = useState(false);

  const processedReviews = useMemo(() => {
    return [...reviews]
      .filter((r) => (filterRating ? r.rating === filterRating : true))
      .sort((a, b) =>
        sortType === 'latest'
          ? new Date(b.created_at) - new Date(a.created_at)
          : b.rating - a.rating
      );
  }, [reviews, filterRating, sortType]);

  const visible = processedReviews.slice(0, visibleCount);
  const hasMore = visibleCount < processedReviews.length;

  return (
    <div>
      {/* Summary */}
      <ReviewsSummary reviews={reviews} onWriteReview={() => setShowForm(true)} />

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">

        {/* Rating filter chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterRating(0)}
            className={`
              px-3 py-1.5 text-xs font-medium border transition-colors
              ${filterRating === 0
                ? 'bg-khajur-primary text-khajur-cream border-khajur-primary'
                : 'border-khajur-border text-khajur-dark/60 hover:border-khajur-gold'
              }
            `}
          >
            All
          </button>
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              onClick={() => setFilterRating(star)}
              className={`
                flex items-center gap-1 px-3 py-1.5 text-xs font-medium border transition-colors
                ${filterRating === star
                  ? 'bg-khajur-primary text-khajur-cream border-khajur-primary'
                  : 'border-khajur-border text-khajur-dark/60 hover:border-khajur-gold'
                }
              `}
            >
              {star}
              <Star className="w-3 h-3 fill-current" />
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sortType}
            onChange={(e) => setSortType(e.target.value)}
            className="
              appearance-none pl-3 pr-8 py-2 text-xs border border-khajur-border
              text-khajur-primary bg-white focus:outline-none focus:border-khajur-gold
              cursor-pointer
            "
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-khajur-dark/40 pointer-events-none" />
        </div>
      </div>

      {/* Review List */}
      {visible.length === 0 ? (
        <div className="text-center py-16 text-khajur-dark/30">
          <Star className="w-10 h-10 mx-auto mb-3" />
          <p className="text-sm">
            {filterRating
              ? `No ${filterRating}-star reviews yet.`
              : 'No reviews yet. Be the first to share your experience!'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {visible.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={() => setVisibleCount((c) => c + REVIEWS_PER_PAGE)}
            className="
              px-8 py-2.5 border border-khajur-border text-khajur-primary
              hover:bg-khajur-primary hover:text-khajur-cream hover:border-khajur-primary
              text-xs font-bold uppercase tracking-widest transition-colors
            "
          >
            Load More Reviews
          </button>
        </div>
      )}

      {/* Review Form Modal */}
      {showForm && (
        <ReviewFormModal
          productId={productId}
          onClose={() => setShowForm(false)}
          onSubmitted={onRefresh}
        />
      )}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const ProductDetail = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const location     = useLocation();
  const { addToCart } = useCart();

  const category = new URLSearchParams(location.search).get('category');

  const [product, setProduct]       = useState(null);
  const [products, setProducts]     = useState([]);
  const [reviews, setReviews]       = useState([]);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity]     = useState(1);
  const [activeTab, setActiveTab]   = useState('description');
  const [loading, setLoading]       = useState(true);

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const fetchProduct = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/products/${id}`);
      setProduct(data);
    } catch {
      toast.error('Failed to load product.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchReviews = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/reviews/${id}`);
      setReviews(data);
    } catch {
      // silent — reviews are non-critical
    }
  }, [id]);

  const fetchAllProducts = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/products`);
      setProducts(data);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
    fetchAllProducts();
  }, [fetchProduct, fetchReviews, fetchAllProducts]);

  // Auto-select first size
  useEffect(() => {
    if (product?.sizes?.length && !selectedSize) {
      setSelectedSize(product.sizes[0].weight);
    }
  }, [product]);

  // ── Derived State ──────────────────────────────────────────────────────────

  const selectedSizeObj = useMemo(
    () => product?.sizes?.find((s) => s.weight.trim() === selectedSize.trim()),
    [product, selectedSize]
  );

  const currentPrice   = selectedSizeObj?.price ?? product?.sizes?.[0]?.price ?? 0;
  const originalPrice  = selectedSizeObj?.original_price ?? product?.price ?? currentPrice;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const validateSize = () => {
    if (!selectedSize) {
      toast.error('Please select a weight option.');
      return false;
    }
    return true;
  };

  const handleAddToCart = () => {
    if (!validateSize()) return;
    addToCart(product.id, quantity, selectedSize);
    toast.success(`${product.name} added to cart!`);
  };

  const handleBuyNow = () => {
    if (!validateSize()) return;
    addToCart(product.id, quantity, selectedSize);
    setTimeout(() => navigate('/cart'), 300);
  };

  // ── Render States ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-khajur-dark/40">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-sm">Loading product…</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <h1 className="font-serif text-2xl font-medium text-khajur-primary">
          Product Not Found
        </h1>
        <p className="text-sm text-khajur-dark/50">
          The product you're looking for doesn't exist or has been removed.
        </p>
        <Link
          to={`/products${category ? `?category=${category}` : ''}`}
          className="text-khajur-gold underline underline-offset-2 text-sm"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  // ── Main Render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen py-20 bg-white" data-testid="product-detail-page">
      <div className="max-w-7xl mx-auto px-6 md:px-12">

        {/* Breadcrumb */}
        <Link
          to={`/products${category ? `?category=${category}` : ''}`}
          className="inline-flex items-center gap-1 text-sm text-khajur-primary hover:text-khajur-gold transition-colors mb-10"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Products
        </Link>

        {/* ── Product Hero ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">

          {/* Image */}
          <div className="bg-khajur-cream flex items-center justify-center p-10 border border-khajur-border">
            <img
              src={product.image}
              alt={product.name}
              className="w-full max-h-[480px] object-contain"
            />
          </div>

          {/* Info */}
          <div className="flex flex-col">

            {/* Category */}
            {product.category && (
              <p className="text-xs uppercase tracking-widest text-khajur-gold mb-2">
                {product.category}
              </p>
            )}

            {/* Name */}
            <h1 className="font-serif text-4xl md:text-5xl font-medium text-khajur-primary mb-4 leading-tight">
              {product.name}
            </h1>

            {/* Rating snippet */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <StarDisplay
                  rating={Math.round(
                    reviews.reduce((a, b) => a + b.rating, 0) / reviews.length
                  )}
                  size="sm"
                />
                <span className="text-xs text-khajur-dark/50">
                  {(reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1)}
                  {' '}({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                </span>
              </div>
            )}

            {/* Price */}
            <PriceBlock currentPrice={currentPrice} originalPrice={originalPrice} />

            {/* Stock */}
            <div className="flex items-center gap-2 mb-8">
              <Package className="w-4 h-4 text-khajur-dark/40" />
              <p className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
              </p>
            </div>

            {/* Size Selector */}
            {product.sizes?.length > 0 && (
              <div className="mb-7">
                <label className="block text-sm font-semibold text-khajur-primary mb-3">
                  Select Weight
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedSize(size.weight)}
                      className={`
                        px-5 py-2.5 text-sm font-medium border transition-all
                        ${selectedSize === size.weight
                          ? 'bg-khajur-primary text-khajur-cream border-khajur-primary shadow-md'
                          : 'bg-white text-khajur-primary border-khajur-border hover:border-khajur-gold'
                        }
                      `}
                    >
                      {size.weight}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-khajur-primary mb-3">
                Quantity
              </label>
              <QuantitySelector
                quantity={quantity}
                stock={product.stock}
                onChange={setQuantity}
              />
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="
                  flex-1 flex items-center justify-center gap-2
                  bg-khajur-primary text-khajur-cream hover:bg-khajur-primary/90
                  px-8 py-4 text-xs font-bold uppercase tracking-widest
                  transition-colors border border-transparent hover:border-khajur-gold
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className="
                  flex-1 bg-khajur-gold text-khajur-primary hover:bg-khajur-gold/90
                  px-8 py-4 text-xs font-bold uppercase tracking-widest
                  transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto mb-20">

          {/* Tab Bar */}
          <div className="flex border-b border-khajur-border mb-8">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  px-6 py-3.5 text-sm font-medium transition-colors
                  ${activeTab === tab.key
                    ? 'border-b-2 border-khajur-gold text-khajur-primary -mb-px'
                    : 'text-khajur-dark/50 hover:text-khajur-primary'
                  }
                `}
              >
                {tab.label}
                {tab.key === 'reviews' && reviews.length > 0 && (
                  <span className="ml-1.5 text-xs bg-khajur-gold/20 text-khajur-primary px-1.5 py-0.5 rounded-full">
                    {reviews.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'description' && (
            <div
              className="
                prose prose-sm max-w-none text-khajur-dark/80 leading-8
                [&_h3]:font-serif [&_h3]:text-khajur-primary [&_h3]:text-xl
                [&_b]:font-semibold [&_strong]:font-semibold
              "
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}

          {activeTab === 'reviews' && (
            <ReviewsTab
              productId={id}
              reviews={reviews}
              onRefresh={fetchReviews}
            />
          )}
        </div>

        {/* ── Related Products ─────────────────────────────────────────────── */}
        <RelatedProducts
          products={products}
          currentProduct={product}
          type="related"
        />
        <RelatedProducts
          products={products}
          currentProduct={product}
          type="explore"
        />
      </div>
    </div>
  );
};

export default ProductDetail;
