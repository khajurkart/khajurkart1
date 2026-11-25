import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
    ChevronLeft,
    Star,
    Trash2,
    Loader2,
    MessageSquare,
    Search,
    Filter,
    AlertTriangle,
    User,
    Package,
    RefreshCw,
    Calendar,
    X,
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ─── Constants ─────────────────────────────────────────────────────────────────

const RATING_FILTERS = ['all', '5', '4', '3', '2', '1'];

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const getRatingStripe = (rating) => {
    if (rating >= 4) return 'bg-green-400';
    if (rating === 3) return 'bg-amber-400';
    return 'bg-red-400';
};

// ─── Sub-Components ────────────────────────────────────────────────────────────

const StarRating = ({ rating, showLabel = true }) => (
    <div className="flex items-center gap-0.5" aria-label={`Rating: ${rating} out of 5`}>
        {Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                    i < rating
                        ? 'text-khajur-gold fill-khajur-gold'
                        : 'text-khajur-dark/20 fill-khajur-dark/10'
                }`}
            />
        ))}
        {showLabel && (
            <span className="ml-1.5 text-xs font-bold text-khajur-dark/60">{rating}/5</span>
        )}
    </div>
);

// ─── Empty State ───────────────────────────────────────────────────────────────

const EmptyState = ({ hasFilters, onClearFilters }) => (
    <div
        className="flex flex-col items-center justify-center py-20 px-4 text-center border border-khajur-border bg-white shadow-sm"
        style={{ borderRadius: '16px' }}
    >
        <div
            className="w-14 h-14 bg-khajur-cream flex items-center justify-center mb-4"
            style={{ borderRadius: '999px' }}
        >
            <MessageSquare className="w-7 h-7 text-khajur-dark/30" />
        </div>
        <p className="font-serif text-xl font-medium text-khajur-primary mb-1">
            No reviews found
        </p>
        <p className="text-sm text-khajur-dark/50 max-w-xs">
            {hasFilters
                ? 'Try adjusting your search or rating filter criteria.'
                : 'Customer reviews will appear here once submitted.'}
        </p>
        {hasFilters && (
            <button
                type="button"
                onClick={onClearFilters}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-khajur-primary text-white text-xs font-bold uppercase tracking-wide hover:bg-khajur-primary/90 transition-colors"
                style={{ borderRadius: '10px' }}
            >
                <X className="w-3.5 h-3.5" />
                Clear Filters
            </button>
        )}
    </div>
);

// ─── Stats Bar ─────────────────────────────────────────────────────────────────

const StatsBar = ({ reviews }) => {
    const total = reviews.length;
    const avg =
        total > 0
            ? (reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / total).toFixed(1)
            : '—';

    const dist = [5, 4, 3, 2, 1].map((star) => {
        const count = reviews.filter((r) => r.rating === star).length;
        return {
            star,
            count,
            pct: total > 0 ? Math.round((count / total) * 100) : 0,
        };
    });

    const fiveStarCount = reviews.filter((r) => r.rating === 5).length;
    const lowRatingCount = reviews.filter((r) => (r.rating ?? 0) < 3).length;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-7">
            {/* Rating Breakdown Card */}
            <div
                className="bg-khajur-cream/70 border border-khajur-border p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-6 shadow-sm"
                style={{ borderRadius: '16px' }}
            >
                <div className="text-center sm:pr-5 sm:border-r border-khajur-border/70 flex-shrink-0">
                    <p className="font-serif text-5xl font-bold text-khajur-primary leading-none mb-2">
                        {avg}
                    </p>
                    <div className="flex justify-center">
                        <StarRating rating={Math.round(parseFloat(avg) || 0)} showLabel={false} />
                    </div>
                    <p className="text-xs text-khajur-dark/50 mt-1.5 font-medium">
                        {total} review{total !== 1 ? 's' : ''}
                    </p>
                </div>

                <div className="w-full flex-1 space-y-2">
                    {dist.map(({ star, count, pct }) => (
                        <div key={star} className="flex items-center gap-2.5 text-xs text-khajur-dark/70">
                            <span className="w-3 text-right font-semibold">{star}</span>
                            <Star className="w-3.5 h-3.5 text-khajur-gold fill-khajur-gold flex-shrink-0" />
                            <div className="flex-1 bg-white border border-khajur-border/60 h-2 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-khajur-gold rounded-full transition-all duration-300"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <span className="w-7 text-right font-mono text-[11px] font-semibold text-khajur-dark/60">
                                {count}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
                {[
                    {
                        label: 'Total Reviews',
                        value: total,
                        icon: MessageSquare,
                        iconBg: 'bg-khajur-primary/10 text-khajur-primary',
                    },
                    {
                        label: 'Avg Rating',
                        value: avg,
                        icon: Star,
                        iconBg: 'bg-khajur-gold/15 text-khajur-gold',
                    },
                    {
                        label: '5-Star Reviews',
                        value: fiveStarCount,
                        icon: Star,
                        iconBg: 'bg-green-100 text-green-700',
                    },
                    {
                        label: 'Below 3 Stars',
                        value: lowRatingCount,
                        icon: AlertTriangle,
                        iconBg: lowRatingCount > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500',
                    },
                ].map(({ label, value, icon: Icon, iconBg }) => (
                    <div
                        key={label}
                        className="bg-white border border-khajur-border p-4 flex flex-col justify-between gap-2 shadow-sm"
                        style={{ borderRadius: '16px' }}
                    >
                        <div className="flex items-center justify-between">
                            <div
                                className={`w-8 h-8 flex items-center justify-center ${iconBg}`}
                                style={{ borderRadius: '10px' }}
                            >
                                <Icon className="w-4 h-4" />
                            </div>
                        </div>
                        <div>
                            <p className="font-serif text-2xl font-bold text-khajur-primary leading-tight">
                                {value}
                            </p>
                            <p className="text-xs text-khajur-dark/50 font-medium mt-0.5">{label}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Review Card ───────────────────────────────────────────────────────────────

const ReviewCard = ({ review, onDelete, deletingId }) => (
    <div
        className="bg-white border border-khajur-border hover:border-khajur-gold/50 transition-all overflow-hidden shadow-sm flex flex-col"
        style={{ borderRadius: '16px' }}
        data-testid={`review-${review.id}`}
    >
        {/* Top Rating Accent Stripe */}
        <div className={`h-1 w-full ${getRatingStripe(review.rating ?? 0)}`} />

        <div className="p-5 flex-1 flex flex-col justify-between gap-4">
            <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3 mb-3.5">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Avatar */}
                        <div
                            className="w-10 h-10 bg-khajur-primary flex-shrink-0 flex items-center justify-center shadow-sm"
                            style={{ borderRadius: '999px' }}
                        >
                            <span className="text-khajur-cream text-sm font-bold uppercase">
                                {review.user_name?.charAt(0) ?? '?'}
                            </span>
                        </div>

                        {/* User & Product Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1">
                                <span className="flex items-center gap-1 text-sm font-bold text-khajur-primary truncate">
                                    <User className="w-3.5 h-3.5 text-khajur-gold flex-shrink-0" />
                                    {review.user_name ?? 'Anonymous'}
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-khajur-dark/50">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-khajur-dark/40" />
                                    {formatDate(review.created_at)}
                                </span>
                                <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-khajur-cream border border-khajur-border/60 text-[11px] font-mono text-khajur-dark/70"
                                    style={{ borderRadius: '6px' }}
                                >
                                    <Package className="w-3 h-3 text-khajur-gold" />
                                    {review.product_id}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Delete Button */}
                    <button
                        onClick={() => onDelete(review.id)}
                        disabled={deletingId === review.id}
                        className="flex items-center gap-1.5 py-1.5 px-3 bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition-colors text-xs font-bold disabled:opacity-40 flex-shrink-0"
                        style={{ borderRadius: '8px' }}
                        aria-label={`Delete review by ${review.user_name}`}
                    >
                        {deletingId === review.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />
                        }
                        <span className="hidden sm:inline">Delete</span>
                    </button>
                </div>

                {/* Rating */}
                <div className="mb-3">
                    <StarRating rating={review.rating ?? 0} />
                </div>

                {/* Comment */}
                {review.comment ? (
                    <p
                        className="text-sm text-khajur-dark/80 leading-relaxed bg-khajur-cream/70 border border-khajur-border/60 px-4 py-3 border-l-4 border-l-khajur-gold"
                        style={{ borderRadius: '10px' }}
                    >
                        "{review.comment}"
                    </p>
                ) : (
                    <p className="text-xs text-khajur-dark/35 italic px-1">
                        No written comment provided.
                    </p>
                )}
            </div>
        </div>
    </div>
);

// ─── Main AdminReviews Component ───────────────────────────────────────────────

const AdminReviews = () => {
    const { token } = useAuth();

    const [reviews, setReviews]           = useState([]);
    const [loading, setLoading]           = useState(true);
    const [refreshing, setRefreshing]     = useState(false);
    const [deletingId, setDeletingId]     = useState(null);
    const [searchQuery, setSearchQuery]   = useState('');
    const [ratingFilter, setRatingFilter] = useState('all');

    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // ─── Fetch Reviews ─────────────────────────────────────────────────────────

    const fetchReviews = useCallback(async (silent = false) => {
        if (silent) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const { data } = await axios.get(`${API}/admin/reviews`, authHeaders);
            setReviews(data);
        } catch {
            toast.error('Failed to load reviews. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    // ─── Delete Review ─────────────────────────────────────────────────────────

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this review? This cannot be undone.')) {
            return;
        }
        setDeletingId(id);
        try {
            await axios.delete(`${API}/admin/reviews/${id}`, authHeaders);
            setReviews((prev) => prev.filter((r) => r.id !== id));
            toast.success('Review deleted successfully.');
        } catch {
            toast.error('Failed to delete review. Please try again.');
        } finally {
            setDeletingId(null);
        }
    };

    // ─── Filtering ─────────────────────────────────────────────────────────────

    const filteredReviews = reviews.filter((r) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
            !q ||
            r.user_name?.toLowerCase().includes(q) ||
            r.comment?.toLowerCase().includes(q) ||
            String(r.product_id).toLowerCase().includes(q);

        const matchesRating =
            ratingFilter === 'all' || r.rating === parseInt(ratingFilter, 10);

        return matchesSearch && matchesRating;
    });

    const hasFilters = !!searchQuery || ratingFilter !== 'all';

    const clearFilters = () => {
        setSearchQuery('');
        setRatingFilter('all');
    };

    // ─── Loading Screen ────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-khajur-dark/50 bg-white">
                <Loader2 className="w-9 h-9 animate-spin text-khajur-primary" />
                <p className="text-sm font-medium">Loading reviews…</p>
            </div>
        );
    }

    // ─── Main Render ───────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen py-20 bg-white" data-testid="admin-reviews-page">
            <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">

                {/* ── Page Header ── */}
                <div className="flex items-start gap-3 mb-8">

                    {/* Back Button */}
                    <Link
                        to="/admin/dashboard"
                        className="mt-1.5 flex items-center justify-center w-9 h-9 border border-khajur-border text-khajur-primary hover:text-khajur-gold hover:border-khajur-gold transition-colors flex-shrink-0"
                        style={{ borderRadius: '999px' }}
                        aria-label="Back to dashboard"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Link>

                    {/* Title Block */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span
                                className="inline-block w-2 h-2 bg-green-500 flex-shrink-0"
                                style={{ borderRadius: '999px' }}
                            />
                            <p className="text-xs uppercase tracking-widest text-khajur-gold font-semibold">
                                KhajurKart Administrator
                            </p>
                        </div>
                        <h1 className="font-serif text-3xl md:text-4xl font-medium text-khajur-primary leading-tight">
                            Customer Reviews
                        </h1>
                        <p className="text-sm text-khajur-dark/50 mt-1">
                            Monitor and moderate customer product reviews
                        </p>
                    </div>

                    {/* Refresh Button + Count Badge */}
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <button
                            type="button"
                            onClick={() => fetchReviews(true)}
                            disabled={refreshing}
                            className="flex items-center gap-1.5 px-3 py-2 border border-khajur-border text-xs font-semibold text-khajur-primary hover:bg-khajur-cream transition-colors disabled:opacity-50"
                            style={{ borderRadius: '999px' }}
                            aria-label="Refresh reviews"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-khajur-primary/10 text-khajur-primary text-xs font-bold"
                            style={{ borderRadius: '999px' }}
                        >
                            <MessageSquare className="w-3 h-3" />
                            {reviews.length}
                        </span>
                    </div>
                </div>

                {/* ── Stats Bar ── */}
                {reviews.length > 0 && <StatsBar reviews={reviews} />}

                {/* ── Search & Rating Filter ── */}
                <div className="flex flex-col sm:flex-row gap-3 mb-5">

                    {/* Search */}
                    <div className="relative flex-1 min-w-0">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-khajur-dark/30 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search by customer, comment or product ID…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 text-sm border border-khajur-border bg-white text-khajur-primary placeholder:text-khajur-dark/30 focus:outline-none focus:ring-2 focus:ring-khajur-gold shadow-sm"
                            style={{ borderRadius: '12px' }}
                        />
                    </div>

                    {/* Rating Filter */}
                    <div className="relative w-full sm:w-48">
                        <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-khajur-dark/30 pointer-events-none" />
                        <select
                            value={ratingFilter}
                            onChange={(e) => setRatingFilter(e.target.value)}
                            className="w-full pl-10 pr-8 py-3 text-sm border border-khajur-border bg-white text-khajur-primary focus:outline-none focus:ring-2 focus:ring-khajur-gold appearance-none cursor-pointer shadow-sm"
                            style={{ borderRadius: '12px' }}
                        >
                            {RATING_FILTERS.map((r) => (
                                <option key={r} value={r}>
                                    {r === 'all' ? 'All Ratings' : `${r} Star${r !== '1' ? 's' : ''}`}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* ── Results Summary ── */}
                <div className="flex items-center justify-between gap-2 mb-5">
                    <p className="text-sm text-khajur-dark/50">
                        Showing{' '}
                        <span className="font-bold text-khajur-primary">{filteredReviews.length}</span>
                        {' '}of{' '}
                        <span className="font-bold text-khajur-primary">{reviews.length}</span>
                        {' '}reviews
                    </p>
                    {hasFilters && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="text-xs font-semibold text-khajur-gold hover:text-khajur-primary transition-colors"
                        >
                            Reset filters
                        </button>
                    )}
                </div>

                {/* ── Reviews Grid ── */}
                {filteredReviews.length === 0 ? (
                    <EmptyState hasFilters={hasFilters} onClearFilters={clearFilters} />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                        {filteredReviews.map((review) => (
                            <ReviewCard
                                key={review.id}
                                review={review}
                                onDelete={handleDelete}
                                deletingId={deletingId}
                            />
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
};

export default AdminReviews;
