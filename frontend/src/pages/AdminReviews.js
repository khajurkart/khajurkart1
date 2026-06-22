import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

// ─── Sub-Components ────────────────────────────────────────────────────────────

const StarRating = ({ rating }) => (
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
    <span className="ml-1.5 text-xs font-medium text-khajur-dark/60">{rating}/5</span>
  </div>
);

// ── Empty State ────────────────────────────────────────────────────────────────

const EmptyState = ({ hasFilters }) => (
  <div className="flex flex-col items-center justify-center py-24 text-khajur-dark/30 border border-khajur-border bg-khajur-cream">
    <MessageSquare className="w-12 h-12 mb-4" />
    <p className="font-serif text-lg font-medium text-khajur-primary/50 mb-1">
      No reviews found
    </p>
    <p className="text-sm">
      {hasFilters
        ? 'Try adjusting your search or filter criteria.'
        : 'Customer reviews will appear here once submitted.'}
    </p>
  </div>
);

// ── Stats Bar ──────────────────────────────────────────────────────────────────

const StatsBar = ({ reviews }) => {
  const total = reviews.length;
  const avg =
    total > 0
      ? (reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / total).toFixed(1)
      : '—';

  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: total > 0
      ? Math.round((reviews.filter((r) => r.rating === star).length / total) * 100)
      : 0,
  }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
      {/* Summary */}
      <div className="bg-khajur-cream border border-khajur-border p-6 flex items-center gap-6">
        <div className="text-center">
          <p className="font-serif text-5xl font-bold text-khajur-primary">{avg}</p>
          <StarRating rating={Math.round(parseFloat(avg) || 0)} />
          <p className="text-xs text-khajur-dark/50 mt-1">{total} review{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {dist.map(({ star, count, pct }) => (
            <div key={star} className="flex items-center gap-2 text-xs text-khajur-dark/60">
              <span className="w-4 text-right">{star}</span>
              <Star className="w-3 h-3 text-khajur-gold fill-khajur-gold" />
              <div className="flex-1 bg-khajur-border h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-khajur-gold rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-6 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          {
            label: 'Total Reviews',
            value: total,
            icon: MessageSquare,
          },
          {
            label: 'Avg Rating',
            value: avg,
            icon: Star,
          },
          {
            label: '5-Star Reviews',
            value: reviews.filter((r) => r.rating === 5).length,
            icon: Star,
          },
          {
            label: 'Below 3 Stars',
            value: reviews.filter((r) => r.rating < 3).length,
            icon: AlertTriangle,
          },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="bg-white border border-khajur-border p-4 flex flex-col gap-2"
          >
            <Icon className="w-4 h-4 text-khajur-gold" />
            <p className="font-serif text-2xl font-bold text-khajur-primary">{value}</p>
            <p className="text-xs text-khajur-dark/50">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Review Card ────────────────────────────────────────────────────────────────

const ReviewCard = ({ review, onDelete, deletingId }) => (
  <div
    className="bg-white border border-khajur-border hover:border-khajur-gold/40 transition-colors"
    data-testid={`review-${review.id}`}
  >
    <div className="p-5">
      {/* Card Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Avatar */}
          <div className="w-9 h-9 bg-khajur-primary flex-shrink-0 flex items-center justify-center">
            <span className="text-khajur-cream text-sm font-bold uppercase">
              {review.user_name?.charAt(0) ?? '?'}
            </span>
          </div>

          {/* User & product info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <span className="flex items-center gap-1 text-sm font-semibold text-khajur-primary">
                <User className="w-3.5 h-3.5 text-khajur-gold" />
                {review.user_name ?? 'Anonymous'}
              </span>
              <span className="text-khajur-dark/20">·</span>
              <span className="text-xs text-khajur-dark/50">
                {formatDate(review.created_at)}
              </span>
            </div>
            <span className="flex items-center gap-1 text-xs text-khajur-dark/50">
              <Package className="w-3 h-3" />
              Product ID: <span className="font-mono">{review.product_id}</span>
            </span>
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={() => onDelete(review.id)}
          disabled={deletingId === review.id}
          className="
            flex items-center gap-1.5 text-red-400 hover:text-red-600
            transition-colors text-xs font-medium disabled:opacity-40 flex-shrink-0
          "
          aria-label={`Delete review by ${review.user_name}`}
        >
          {deletingId === review.id
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Trash2 className="w-3.5 h-3.5" />
          }
          Delete
        </button>
      </div>

      {/* Rating */}
      <div className="mb-3">
        <StarRating rating={review.rating ?? 0} />
      </div>

      {/* Comment */}
      {review.comment ? (
        <p className="text-sm text-khajur-dark/80 leading-relaxed bg-khajur-cream px-4 py-3 border-l-2 border-khajur-gold">
          "{review.comment}"
        </p>
      ) : (
        <p className="text-xs text-khajur-dark/30 italic">No comment provided.</p>
      )}
    </div>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const AdminReviews = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [reviews, setReviews]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [deletingId, setDeletingId]   = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/admin/reviews`, authHeaders);
      setReviews(data);
    } catch {
      toast.error('Failed to load reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // ── Actions ────────────────────────────────────────────────────────────────

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

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filteredReviews = reviews.filter((r) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      r.user_name?.toLowerCase().includes(q) ||
      r.comment?.toLowerCase().includes(q) ||
      String(r.product_id).includes(q);

    const matchesRating =
      ratingFilter === 'all' || r.rating === parseInt(ratingFilter, 10);

    return matchesSearch && matchesRating;
  });

  const hasFilters = !!searchQuery || ratingFilter !== 'all';

  // ── Render States ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-khajur-dark/40">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-sm">Loading reviews…</p>
      </div>
    );
  }

  // ── Main Render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen py-20 bg-white" data-testid="admin-reviews-page">
      <div className="max-w-7xl mx-auto px-6 md:px-12">

        {/* Page Header */}
        <div className="flex items-center gap-4 mb-10">
          <Link
            to="/admin/dashboard"
            className="text-khajur-primary hover:text-khajur-gold transition-colors"
            aria-label="Back to dashboard"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <p className="text-xs uppercase tracking-widest text-khajur-gold mb-0.5">
              Administration
            </p>
            <h1 className="font-serif text-4xl font-medium text-khajur-primary">
              Customer Reviews
            </h1>
            <p className="text-sm text-khajur-dark/50 mt-1">
              Monitor and moderate customer product reviews
            </p>
          </div>
        </div>

        {/* Stats */}
        {reviews.length > 0 && <StatsBar reviews={reviews} />}

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-khajur-dark/30" />
            <input
              type="text"
              placeholder="Search by customer, comment or product ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full pl-10 pr-4 py-2.5 text-sm border border-khajur-border bg-white
                text-khajur-primary placeholder:text-khajur-dark/30
                focus:outline-none focus:ring-1 focus:ring-khajur-gold
              "
            />
          </div>

          {/* Rating Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-khajur-dark/30" />
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="
                pl-10 pr-8 py-2.5 text-sm border border-khajur-border bg-white
                text-khajur-primary focus:outline-none focus:ring-1 focus:ring-khajur-gold
                appearance-none cursor-pointer
              "
            >
              {RATING_FILTERS.map((r) => (
                <option key={r} value={r}>
                  {r === 'all' ? 'All Ratings' : `${r} Star${r !== '1' ? 's' : ''}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary */}
        <p className="text-sm text-khajur-dark/50 mb-4">
          Showing{' '}
          <span className="font-medium text-khajur-primary">{filteredReviews.length}</span> of{' '}
          <span className="font-medium text-khajur-primary">{reviews.length}</span> reviews
        </p>

        {/* Reviews Grid */}
        {filteredReviews.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
