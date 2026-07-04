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
    MessageSquare,
    ImageOff,
    Tag,
    Copy,
    Check,
    Gift,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';
import RelatedProducts from '../components/RelatedProducts';
import Breadcrumb from '../components/Breadcrumb';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TABS = [
    { key: 'description', label: 'Description' },
    { key: 'reviews',     label: 'Customer Reviews' },
];

const SORT_OPTIONS = [
    { value: 'latest', label: 'Newest First' },
    { value: 'top',    label: 'Top Rated'    },
];

const REVIEWS_PER_PAGE = 5;

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
};

const calcAvg = (reviews) =>
    reviews.length
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : '0.0';

const calcDiscount = (original, current) =>
    Math.round(((original - current) / original) * 100);

const SectionDivider = () => (
    <div className="w-full h-px bg-khajur-border my-16" />
);

// ── Star Display ──────────────────────────────────────────────────────────────
const StarDisplay = ({ rating, size = 'sm', interactive = false, onChange }) => {
    const [hovered, setHovered] = useState(0);
    const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-8 h-8' };
    const active = interactive ? hovered || rating : rating;
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
                <Star
                    key={i}
                    className={`
                        ${sizes[size]} transition-all
                        ${i < active
                            ? 'text-khajur-gold fill-khajur-gold'
                            : 'text-khajur-dark/20 fill-transparent'}
                        ${interactive ? 'cursor-pointer hover:scale-110' : ''}
                    `}
                    onClick={() => interactive && onChange?.(i + 1)}
                    onMouseEnter={() => interactive && setHovered(i + 1)}
                    onMouseLeave={() => interactive && setHovered(0)}
                />
            ))}
        </div>
    );
};

// ── Quantity Selector ─────────────────────────────────────────────────────────
const QuantitySelector = ({ quantity, stock, onChange }) => (
    <div className="flex items-center">
        <button
            onClick={() => onChange(Math.max(1, quantity - 1))}
            className="w-10 h-10 bg-khajur-cream hover:bg-khajur-border text-khajur-primary font-bold text-lg border border-khajur-border transition-colors"
            aria-label="Decrease quantity"
        >−</button>
        <span className="w-14 h-10 flex items-center justify-center text-sm font-medium text-khajur-primary border-y border-khajur-border">
            {quantity}
        </span>
        <button
            onClick={() => onChange(Math.min(stock, quantity + 1))}
            className="w-10 h-10 bg-khajur-cream hover:bg-khajur-border text-khajur-primary font-bold text-lg border border-khajur-border transition-colors"
            aria-label="Increase quantity"
        >+</button>
    </div>
);

// ── Price Block ───────────────────────────────────────────────────────────────
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
                    <span className="text-khajur-dark/40 line-through text-lg">
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

// ── Available Offers / Coupons Section ────────────────────────────────────────
const AvailableOffers = ({ coupons }) => {
    const [copiedCode, setCopiedCode] = useState('');

    if (!coupons || coupons.length === 0) return null;

    const handleCopy = (code) => {
        navigator.clipboard.writeText(code).then(() => {
            // ✅ Save to localStorage so checkout can auto-apply
            localStorage.setItem('khajurkart_coupon', code);
            setCopiedCode(code);
            toast.success(`Code "${code}" copied! Will be auto-applied at checkout 🎉`);
            setTimeout(() => setCopiedCode(''), 3000);
        });
    };

    const formatDiscount = (coupon) => {
        if (coupon.discount_type === 'percent') {
            return `${coupon.discount_percent}% OFF`;
        }
        return `₹${coupon.discount_amount} OFF`;
    };

    return (
        <div className="mb-7">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <Gift className="w-4 h-4 text-khajur-gold" />
                <p className="text-sm font-semibold text-khajur-primary uppercase tracking-wider">
                    Available Offers
                </p>
            </div>

            {/* Coupon Cards */}
            <div className="space-y-2">
                {coupons.map((coupon, index) => (
                    <div
                        key={index}
                        className="border border-dashed border-khajur-gold/40 bg-khajur-gold/5 rounded-sm p-3 flex items-center justify-between gap-3"
                    >
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                            <Tag className="w-3.5 h-3.5 text-khajur-gold mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                                {/* Code */}
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-mono font-bold text-sm text-khajur-primary tracking-wider">
                                        {coupon.code}
                                    </span>
                                    <span className="bg-green-100 text-green-700 text-xs font-bold px-1.5 py-0.5 rounded-sm">
                                        {formatDiscount(coupon)}
                                    </span>
                                    {coupon.is_welcome && (
                                        <span className="bg-yellow-100 text-yellow-700 text-xs px-1.5 py-0.5 rounded-sm">
                                            🎉 New User
                                        </span>
                                    )}
                                </div>
                                {/* Description */}
                                <p className="text-xs text-khajur-dark/50 truncate">
                                    {coupon.description ||
                                        (coupon.min_order > 0
                                            ? `Min order ₹${coupon.min_order}`
                                            : 'No minimum order required')}
                                </p>
                                {/* Expiry */}
                                {coupon.expiry && (
                                    <p className="text-xs text-red-400 mt-0.5">
                                        Expires: {new Date(coupon.expiry).toLocaleDateString('en-IN')}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Copy Button */}
                        <button
                            onClick={() => handleCopy(coupon.code)}
                            className={`
                                flex items-center gap-1.5 px-3 py-1.5 rounded-sm
                                text-xs font-bold uppercase tracking-wider
                                transition-all duration-200 flex-shrink-0
                                ${copiedCode === coupon.code
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-khajur-primary text-khajur-cream hover:bg-khajur-primary/90'
                                }
                            `}
                        >
                            {copiedCode === coupon.code
                                ? <><Check className="w-3 h-3" /> Copied!</>
                                : <><Copy className="w-3 h-3" /> Copy</>
                            }
                        </button>
                    </div>
                ))}
            </div>
            <p className="text-xs text-khajur-dark/40 mt-2">
                💡 Copy a code — it will be automatically applied at checkout.
            </p>
        </div>
    );
};

// ── Rating Distribution ───────────────────────────────────────────────────────
const RatingDistribution = ({ reviews }) => {
    const total = reviews.length;
    return (
        <div className="space-y-2.5">
            {[5, 4, 3, 2, 1].map((star) => {
                const count = reviews.filter((r) => r.rating === star).length;
                const pct = total ? (count / total) * 100 : 0;
                return (
                    <div key={star} className="flex items-center gap-3">
                        <span className="w-3 text-xs font-medium text-khajur-dark/60 flex-shrink-0">{star}</span>
                        <Star className="w-3 h-3 text-khajur-gold fill-khajur-gold flex-shrink-0" />
                        <div className="flex-1 h-1.5 bg-khajur-border rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-khajur-primary to-khajur-gold rounded-full transition-all duration-700"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <span className="w-5 text-xs text-khajur-dark/50 text-right flex-shrink-0">{count}</span>
                    </div>
                );
            })}
        </div>
    );
};

// ── Review Card ───────────────────────────────────────────────────────────────
const ReviewCard = ({ review }) => (
    <div className="py-6 border-b border-khajur-border last:border-0">
        <div className="flex items-start gap-4">
            <div className="w-9 h-9 flex-shrink-0 bg-khajur-primary flex items-center justify-center">
                <span className="text-khajur-cream text-sm font-bold uppercase">
                    {review.user_name?.charAt(0) ?? '?'}
                </span>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-khajur-primary">
                            {review.user_name ?? 'Anonymous'}
                        </p>
                        <span className="text-khajur-dark/20">·</span>
                        <p className="text-xs text-khajur-dark/40">{formatDate(review.created_at)}</p>
                    </div>
                    <StarDisplay rating={review.rating} size="sm" />
                </div>
                {review.title && (
                    <p className="text-sm font-semibold text-khajur-dark mb-1">{review.title}</p>
                )}
                {review.comment && (
                    <p className="text-sm text-khajur-dark/70 leading-relaxed">{review.comment}</p>
                )}
            </div>
        </div>
    </div>
);

// ── Review Form ───────────────────────────────────────────────────────────────
const ReviewForm = ({ onClose, onSubmit, submitting, formState, setFormState }) => {
    const update = (field, value) => setFormState((prev) => ({ ...prev, [field]: value }));
    return (
        <div id="review-form" className="mt-10 border border-khajur-border bg-white">
            <div className="flex items-center justify-between px-7 py-5 border-b border-khajur-border bg-khajur-cream">
                <div>
                    <p className="text-xs uppercase tracking-widest text-khajur-gold mb-0.5">Leave a Review</p>
                    <h3 className="font-serif text-xl font-medium text-khajur-primary">Share Your Experience</h3>
                </div>
                <button onClick={onClose} className="text-khajur-dark/40 hover:text-khajur-primary transition-colors" aria-label="Close review form">
                    <X className="w-5 h-5" />
                </button>
            </div>
            <form onSubmit={onSubmit} className="px-7 py-6 space-y-5">
                <div>
                    <label className="text-xs font-medium uppercase tracking-wide text-khajur-dark/50 mb-2 block">
                        Your Rating <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                        <StarDisplay rating={formState.rating} size="lg" interactive onChange={(r) => update('rating', r)} />
                        <span className="text-sm text-khajur-dark/40 ml-1">{formState.rating} / 5</span>
                    </div>
                </div>
                <div>
                    <label className="text-xs font-medium uppercase tracking-wide text-khajur-dark/50 mb-1.5 block">
                        Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text" required value={formState.name}
                        onChange={(e) => update('name', e.target.value)}
                        placeholder="e.g. Priya Sharma"
                        className="w-full border border-khajur-border px-4 py-2.5 text-sm text-khajur-primary placeholder:text-khajur-dark/30 bg-white focus:outline-none focus:border-khajur-gold transition-colors"
                    />
                </div>
                <div>
                    <label className="text-xs font-medium uppercase tracking-wide text-khajur-dark/50 mb-1.5 block">Review Title</label>
                    <input
                        type="text" value={formState.title}
                        onChange={(e) => update('title', e.target.value)}
                        placeholder="Summarise your experience…"
                        className="w-full border border-khajur-border px-4 py-2.5 text-sm text-khajur-primary placeholder:text-khajur-dark/30 bg-white focus:outline-none focus:border-khajur-gold transition-colors"
                    />
                </div>
                <div>
                    <label className="text-xs font-medium uppercase tracking-wide text-khajur-dark/50 mb-1.5 block">Your Review</label>
                    <textarea
                        value={formState.comment}
                        onChange={(e) => update('comment', e.target.value)}
                        placeholder="What did you like or dislike? How was the quality?"
                        rows={4}
                        className="w-full border border-khajur-border px-4 py-2.5 text-sm text-khajur-primary placeholder:text-khajur-dark/30 bg-white focus:outline-none focus:border-khajur-gold transition-colors resize-none"
                    />
                </div>
                <div className="flex gap-3 pt-1">
                    <button
                        type="submit" disabled={submitting}
                        className="flex-1 flex items-center justify-center gap-2 bg-khajur-primary text-khajur-cream hover:bg-khajur-primary/90 py-3 text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {submitting ? 'Submitting…' : 'Submit Review'}
                    </button>
                    <button
                        type="button" onClick={onClose}
                        className="px-5 py-3 border border-khajur-border text-khajur-dark/60 hover:bg-khajur-cream text-xs font-bold uppercase tracking-widest transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

// ── Reviews Section ───────────────────────────────────────────────────────────
const ReviewsSection = ({ productId, reviews, onRefresh }) => {
    const [filterRating, setFilterRating] = useState(0);
    const [sortType, setSortType] = useState('latest');
    const [visibleCount, setVisibleCount] = useState(REVIEWS_PER_PAGE);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formState, setFormState] = useState({ name: '', title: '', comment: '', rating: 5 });

    const avg = calcAvg(reviews);

    const processedReviews = useMemo(() =>
        [...reviews]
            .filter((r) => (filterRating ? r.rating === filterRating : true))
            .sort((a, b) =>
                sortType === 'latest'
                    ? new Date(b.created_at) - new Date(a.created_at)
                    : b.rating - a.rating
            ),
        [reviews, filterRating, sortType]
    );

    const visible = processedReviews.slice(0, visibleCount);
    const hasMore = visibleCount < processedReviews.length;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formState.name.trim()) { toast.error('Please enter your name.'); return; }
        setSubmitting(true);
        try {
            await axios.post(`${API}/reviews`, {
                id: Date.now().toString(),
                product_id: productId,
                user_name: formState.name.trim(),
                title: formState.title.trim(),
                rating: formState.rating,
                comment: formState.comment.trim(),
                created_at: new Date().toISOString(),
            });
            toast.success('Review submitted — thank you!');
            setFormState({ name: '', title: '', comment: '', rating: 5 });
            setShowForm(false);
            onRefresh();
        } catch {
            toast.error('Failed to submit review. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="w-full text-left">
            <div className="text-center mb-10">
                <p className="text-xs uppercase tracking-widest text-khajur-gold mb-1">What customers say</p>
                <h2 className="font-serif text-3xl font-medium text-khajur-primary">Customer Reviews</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center bg-khajur-cream border border-khajur-border p-8 mb-10">
                <div className="text-center md:text-left">
                    <p className="font-serif text-8xl font-bold text-khajur-primary leading-none mb-3">{avg}</p>
                    <StarDisplay rating={Math.round(parseFloat(avg))} size="md" />
                    <p className="text-sm text-khajur-dark/50 mt-2">
                        {reviews.length > 0 ? `Based on ${reviews.length} review${reviews.length !== 1 ? 's' : ''}` : 'No reviews yet'}
                    </p>
                </div>
                <RatingDistribution reviews={reviews} />
                <div className="flex justify-center md:justify-end">
                    <button
                        onClick={() => { setShowForm(true); setTimeout(() => document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth' }), 100); }}
                        className="flex items-center gap-2 bg-khajur-primary text-khajur-cream hover:bg-khajur-primary/90 px-7 py-3.5 text-xs font-bold uppercase tracking-widest transition-colors"
                    >
                        <MessageSquare className="w-4 h-4" /> Write a Review
                    </button>
                </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex flex-wrap gap-2">
                    {[0, 5, 4, 3, 2, 1].map((star) => (
                        <button
                            key={star}
                            onClick={() => { setFilterRating(star); setVisibleCount(REVIEWS_PER_PAGE); }}
                            className={`flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold border transition-colors ${filterRating === star ? 'bg-khajur-primary text-khajur-cream border-khajur-primary' : 'border-khajur-border text-khajur-dark/60 hover:border-khajur-gold bg-white'}`}
                        >
                            {star === 0 ? 'All' : <>{star}<Star className="w-3 h-3 fill-current" /></>}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <select
                        value={sortType}
                        onChange={(e) => { setSortType(e.target.value); setVisibleCount(REVIEWS_PER_PAGE); }}
                        className="appearance-none pl-3 pr-8 py-2 text-xs border border-khajur-border text-khajur-primary bg-white focus:outline-none focus:border-khajur-gold cursor-pointer transition-colors"
                    >
                        {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-khajur-dark/40 pointer-events-none" />
                </div>
            </div>
            <p className="text-xs text-khajur-dark/40 mb-5">
                Showing <span className="font-medium text-khajur-primary">{visible.length}</span> of{' '}
                <span className="font-medium text-khajur-primary">{processedReviews.length}</span> review{processedReviews.length !== 1 ? 's' : ''}
            </p>
            {visible.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 border border-khajur-border bg-khajur-cream">
                    <MessageSquare className="w-10 h-10 mb-3 text-khajur-dark/20" />
                    <p className="text-sm font-medium text-khajur-dark/50 mb-1">
                        {filterRating ? `No ${filterRating}-star reviews yet.` : 'No reviews yet.'}
                    </p>
                </div>
            ) : (
                <div className="border border-khajur-border bg-white px-6">
                    {visible.map((review) => <ReviewCard key={review.id} review={review} />)}
                </div>
            )}
            {hasMore && (
                <div className="text-center mt-8">
                    <button
                        onClick={() => setVisibleCount((c) => c + REVIEWS_PER_PAGE)}
                        className="px-8 py-2.5 border border-khajur-border text-khajur-primary hover:bg-khajur-primary hover:text-khajur-cream hover:border-khajur-primary text-xs font-bold uppercase tracking-widest transition-colors"
                    >
                        Load More Reviews
                    </button>
                </div>
            )}
            {showForm && (
                <ReviewForm
                    onClose={() => setShowForm(false)}
                    onSubmit={handleSubmit}
                    submitting={submitting}
                    formState={formState}
                    setFormState={setFormState}
                />
            )}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { addToCart } = useCart();
    const category = new URLSearchParams(location.search).get('category');

    const [product, setProduct] = useState(null);
    const [products, setProducts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [coupons, setCoupons] = useState([]);    // ✅ NEW
    const [selectedSize, setSelectedSize] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('description');
    const [loading, setLoading] = useState(true);
    const [imgError, setImgError] = useState(false);

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
        } catch { /* non-critical */ }
    }, [id]);

    const fetchAllProducts = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API}/products`);
            setProducts(data);
        } catch { /* non-critical */ }
    }, []);

    // ✅ Fetch active coupons
    const fetchCoupons = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API}/coupons/active`);
            setCoupons(data);
        } catch { /* non-critical */ }
    }, []);

    useEffect(() => {
        fetchProduct();
        fetchReviews();
        fetchAllProducts();
        fetchCoupons(); // ✅ fetch coupons on load
    }, [fetchProduct, fetchReviews, fetchAllProducts, fetchCoupons]);

    useEffect(() => {
        if (product?.sizes?.length && !selectedSize) {
            setSelectedSize(product.sizes[0].weight);
        }
    }, [product, selectedSize]);

    useEffect(() => {
        if (product?.name) document.title = `${product.name} — KhajurKart`;
        return () => { document.title = 'KhajurKart — Premium Dates, Dry Fruits & Spices'; };
    }, [product]);

    const selectedSizeObj = useMemo(
        () => product?.sizes?.find((s) => s.weight.trim() === selectedSize.trim()),
        [product, selectedSize]
    );

    const currentPrice  = selectedSizeObj?.price ?? product?.sizes?.[0]?.price ?? 0;
    const originalPrice = selectedSizeObj?.original_price ?? product?.price ?? currentPrice;

    const handleAddToCart = () => {
        if (!selectedSize) { toast.error('Please select a weight option.'); return; }
        addToCart(product.id, quantity, selectedSize);
        toast.success(`${product.name} added to cart!`);
    };

    const handleBuyNow = () => {
        if (!selectedSize) { toast.error('Please select a weight option.'); return; }
        addToCart(product.id, quantity, selectedSize);
        setTimeout(() => navigate('/cart'), 300);
    };

    const breadcrumbItems = useMemo(() => {
        if (!product) return [];
        return [
            { label: 'Home', to: '/' },
            { label: 'Products', to: '/products' },
            ...(product.category ? [{ label: product.category, to: `/products?category=${encodeURIComponent(product.category)}` }] : []),
            { label: product.name, to: '#' },
        ];
    }, [product]);

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
                <h1 className="font-serif text-2xl font-medium text-khajur-primary">Product Not Found</h1>
                <p className="text-sm text-khajur-dark/50">This product doesn't exist or has been removed.</p>
                <Link to={`/products${category ? `?category=${category}` : ''}`} className="text-khajur-gold underline underline-offset-2 text-sm">
                    Back to Products
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-20 bg-white" data-testid="product-detail-page">
            <div className="max-w-7xl mx-auto px-6 md:px-12">

                <Link
                    to={`/products${category ? `?category=${category}` : ''}`}
                    className="inline-flex items-center gap-1 text-sm text-khajur-primary hover:text-khajur-gold transition-colors mb-6"
                >
                    <ChevronLeft className="w-4 h-4" /> Back to Products
                </Link>

                <div className="mb-10">
                    <Breadcrumb items={breadcrumbItems} />
                </div>

                {/* Product Hero */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-6">
                    {/* Image */}
                    <div className="bg-khajur-cream flex items-center justify-center p-10 border border-khajur-border">
                        {imgError ? (
                            <div className="flex flex-col items-center gap-3 text-khajur-dark/20">
                                <ImageOff className="w-16 h-16" />
                                <p className="text-sm">Image unavailable</p>
                            </div>
                        ) : (
                            <img
                                src={product.image}
                                alt={product.name}
                                onError={() => setImgError(true)}
                                className="w-full max-h-[480px] object-contain"
                            />
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-col">
                        {product.category && (
                            <p className="text-xs uppercase tracking-widest text-khajur-gold mb-2">
                                {product.category}
                            </p>
                        )}
                        <h1 className="font-serif text-4xl md:text-5xl font-medium text-khajur-primary mb-4 leading-tight">
                            {product.name}
                        </h1>

                        {reviews.length > 0 && (
                            <div className="flex items-center gap-2 mb-4">
                                <StarDisplay rating={Math.round(reviews.reduce((a, b) => a + b.rating, 0) / reviews.length)} size="sm" />
                                <span className="text-xs text-khajur-dark/50">
                                    {calcAvg(reviews)} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                                </span>
                            </div>
                        )}

                        <PriceBlock currentPrice={currentPrice} originalPrice={originalPrice} />

                        <div className="flex items-center gap-2 mb-6">
                            <Package className="w-4 h-4 text-khajur-dark/30" />
                            <p className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
                            </p>
                        </div>

                        {/* ✅ Available Offers — shown here */}
                        <AvailableOffers coupons={coupons} />

                        {/* Size Selector */}
                        {product.sizes?.length > 0 && (
                            <div className="mb-7">
                                <label className="block text-sm font-semibold text-khajur-primary mb-3">Select Weight</label>
                                <div className="flex flex-wrap gap-2">
                                    {product.sizes.map((size, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedSize(size.weight)}
                                            className={`px-5 py-2.5 text-sm font-medium border transition-all ${selectedSize === size.weight ? 'bg-khajur-primary text-khajur-cream border-khajur-primary shadow-md' : 'bg-white text-khajur-primary border-khajur-border hover:border-khajur-gold'}`}
                                        >
                                            {size.weight}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity */}
                        <div className="mb-8">
                            <label className="block text-sm font-semibold text-khajur-primary mb-3">Quantity</label>
                            <QuantitySelector quantity={quantity} stock={product.stock} onChange={setQuantity} />
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={handleAddToCart}
                                disabled={product.stock === 0}
                                className="flex-1 flex items-center justify-center gap-2 bg-khajur-primary text-khajur-cream hover:bg-khajur-primary/90 px-8 py-4 text-xs font-bold uppercase tracking-widest transition-colors border border-transparent hover:border-khajur-gold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ShoppingCart className="w-4 h-4" /> Add to Cart
                            </button>
                            <button
                                onClick={handleBuyNow}
                                disabled={product.stock === 0}
                                className="flex-1 bg-khajur-gold text-khajur-primary hover:bg-khajur-gold/90 px-8 py-4 text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Buy Now
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="max-w-5xl mx-auto">
                    <div className="flex border-b border-khajur-border mb-8">
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-6 py-3.5 text-sm font-medium transition-colors ${activeTab === tab.key ? 'border-b-2 border-khajur-gold text-khajur-primary -mb-px' : 'text-khajur-dark/50 hover:text-khajur-primary'}`}
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

                    {activeTab === 'description' && (
                        <div
                            className="prose prose-sm max-w-none text-khajur-dark/80 leading-8 [&_h3]:font-serif [&_h3]:text-khajur-primary [&_h3]:text-xl [&_b]:font-semibold [&_strong]:font-semibold"
                            dangerouslySetInnerHTML={{ __html: product.description }}
                        />
                    )}

                    {activeTab === 'reviews' && (
                        <ReviewsSection productId={id} reviews={reviews} onRefresh={fetchReviews} />
                    )}
                </div>

                <SectionDivider />
                <RelatedProducts products={products} currentProduct={product} type="related" />
                <SectionDivider />
                <RelatedProducts products={products} currentProduct={product} type="explore" />
                <div className="h-16" />
            </div>
        </div>
    );
};

export default ProductDetail;
