import React, { useState, useEffect } from 'react';
import { useLocation } from "react-router-dom";
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, Heart, ChevronLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';
import RelatedProducts from "../components/RelatedProducts";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
console.log("Backend URL:", BACKEND_URL);


const ProductDetail = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [products, setProducts] = useState([]);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("description");
    const { addToCart } = useCart();
    const [reviews, setReviews] = useState([]);
    const [name, setName] = useState("");
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const category = queryParams.get("category");
    const [title, setTitle] = useState("");
    const [filterRating, setFilterRating] = useState(0);
    const [visibleCount, setVisibleCount] = useState(5);
    const [likes, setLikes] = useState({});
    const [sortType, setSortType] = useState("latest");
    const [showForm, setShowForm] = useState(false);
    const [selectedSize, setSelectedSize] = useState("");

    useEffect(() => {
        fetchProduct();
        fetchReviews();
        fetchAllProducts();
    }, [id]);

    useEffect(() => {
        if (product?.sizes?.length && !selectedSize) {
            setSelectedSize(product.sizes[0].weight);
        }
    }, [product]);

    const fetchProduct = async () => {
        try {
            const response = await axios.get(`${API}/products/${id}`);
            setProduct(response.data);
        } catch (error) {
            console.error('Failed to fetch product', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async () => {
        try {
            const res = await axios.get(`${API}/reviews/${id}`);
            setReviews(res.data);
        } catch (err) {
            console.log(err);
        }
    };

    const fetchAllProducts = async () => {
        try {
            const res = await axios.get(`${API}/products`);
            setProducts(res.data);
        } catch (err) {
            console.log(err);
        }
    };

    const renderStars = (current, setFunc) => {
        return [1, 2, 3, 4, 5].map((star) => (
            <span
                key={star}
                onClick={() => setFunc(star)}
                className={`cursor-pointer text-4xl ${star <= current ? "text-yellow-500" : "text-gray-300"
                    }`}
            >
                ★
            </span>
        ));
    };

    const processedReviews = [...reviews]
        .filter(r => (filterRating ? r.rating === filterRating : true))
        .sort((a, b) => {
            if (sortType === "latest") {
                return new Date(b.created_at) - new Date(a.created_at);
            } else {
                return b.rating - a.rating;
            }
        })
        .slice(0, visibleCount);

    const submitReview = async () => {
        try {
            await axios.post(`${API}/reviews`, {
                id: Date.now().toString(),
                product_id: id,
                user_name: name,
                title: title,
                rating: Number(rating),
                comment: comment,
                created_at: new Date().toISOString()
            });

            setName("");
            setTitle("");
            setRating(5);
            setComment("");
            fetchReviews();
        } catch (err) {
            console.log(err);
        }
    };

    const handleAddToCart = () => {
        if (!selectedSize) {
            alert("Please select size");
            return;
        }
        const selected = product.sizes?.find(
            s => s.weight === selectedSize || `${s.weight}g` === selectedSize
        );
        addToCart(
            product.id,
            quantity,
            selectedSize
        );
    };

    const handleBuyNow = () => {
        if (!selectedSize) {
            alert("Please select size");
            return;
        }
        addToCart(product.id, quantity, selectedSize);
        setTimeout(() => {
            window.location.href = '/cart';
        }, 500);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-khajur-dark/60">Loading product...</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <p className="text-khajur-dark/60 mb-4">Product not found</p>
                <Link
                    to={`/products?category=${category || ""}`}
                    className="text-khajur-primary hover:text-khajur-gold"
                >
                    Back to Products
                </Link>
            </div>
        );
    }

    const avgRating = reviews.length
        ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1)
        : "0.0";

    const selected = product.sizes?.find(
        s => s.weight.trim() === selectedSize.trim()
    );

    const currentPrice = selected?.price ?? product.sizes?.[0]?.price ?? 0;
    const originalPrice =
        selected?.original_price ||
        product.price ||   // fallback to main price
        currentPrice;

    if (process.env.NODE_ENV === "development") {
        console.log("Selected:", selectedSize);
        console.log("Current:", currentPrice);
        console.log("Original:", originalPrice);
    }

    return (
        <div className="min-h-screen py-20" data-testid="product-detail-page">
            <div className="max-w-7xl mx-auto px-6 md:px-12">

                <Link
                    to={`/products?category=${category || ""}`}
                    className="inline-flex items-center text-khajur-primary hover:text-khajur-gold mb-8 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    Back to Products
                </Link>

                {/* TOP SECTION */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

                    {/* IMAGE */}
                    <div className="bg-white p-8">
                        <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-auto object-contain"
                        />
                    </div>

                    {/* INFO (UNCHANGED) */}
                    <div>
                        <h1 className="font-serif text-4xl md:text-5xl font-medium text-khajur-primary mb-4">
                            {product.name}
                        </h1>

                        <div className="mb-6">
                            <span className="text-3xl text-khajur-gold font-bold">
                                ₹{currentPrice}
                            </span>
                            {originalPrice > currentPrice && (
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="line-through text-gray-400 text-lg">
                                        ₹{originalPrice}
                                    </span>
                                    <span className="text-green-600 font-bold">
                                        {Math.round(
                                            ((originalPrice - currentPrice) / originalPrice) * 100
                                        )}% OFF
                                    </span>
                                </div>
                            )}
                        </div>

                        <p className="text-sm text-khajur-muted mb-8">
                            {product.stock > 0
                                ? `In Stock (${product.stock} available)`
                                : "Out of Stock"}
                        </p>

                        {/* SIZE SELECTOR*/}
                        <div className="mb-6">
                            <label className="block font-serif text-lg font-medium text-khajur-primary mb-3">
                                Weight
                            </label>

                            <div className="flex gap-3">
                                {product.sizes?.map((size, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedSize(size.weight)}
                                        className={`px-5 py-2 border rounded-sm text-sm font-medium transition-all
                                            ${selectedSize === size.weight
                                                ? "bg-khajur-primary text-white border-khajur-primary scale-105 shadow-md"
                                                : "bg-white text-khajur-primary border-gray-300 hover:border-khajur-gold"
                                            }`}
                                    >
                                        {size.weight}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quantity */}
                        <div className="mb-8">
                            <label className="block font-serif text-lg font-medium text-khajur-primary mb-3">
                                Quantity
                            </label>

                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="bg-khajur-cream hover:bg-khajur-accent text-khajur-primary px-4 py-2 rounded-sm"
                                >
                                    -
                                </button>

                                <span className="text-xl font-medium w-12 text-center">
                                    {quantity}
                                </span>

                                <button
                                    onClick={() =>
                                        setQuantity(Math.min(product.stock, quantity + 1))
                                    }
                                    className="bg-khajur-cream hover:bg-khajur-accent text-khajur-primary px-4 py-2 rounded-sm"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* BUTTONS (UNCHANGED EXACTLY) */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={handleAddToCart}
                                disabled={product.stock === 0}
                                className="flex-1 bg-khajur-primary text-khajur-cream hover:bg-khajur-primary/90 rounded-sm px-8 py-4 uppercase tracking-widest text-xs font-bold transition-all border border-transparent hover:border-khajur-gold disabled:opacity-50"
                            >
                                <ShoppingCart className="inline w-5 h-5 mr-2" />
                                Add to Cart
                            </button>

                            <button
                                onClick={handleBuyNow}
                                disabled={product.stock === 0}
                                className="flex-1 bg-khajur-gold text-khajur-primary hover:bg-khajur-gold/90 rounded-sm px-8 py-4 uppercase tracking-widest text-xs font-bold transition-all"
                            >
                                Buy Now
                            </button>
                        </div>
                    </div>
                </div>

                {/* ✅ BELOW IMAGE (NEW SECTION LIKE AJFAN) */}
                <div className="mt-16 max-w-5xl mx-auto">

                    {/* Tabs */}
                    <div className="flex justify-center border-b mb-6">
                        <button
                            onClick={() => setActiveTab("description")}
                            className={`px-6 py-3 ${activeTab === "description"
                                ? "border-b-2 border-khajur-gold text-khajur-primary"
                                : "text-gray-500"
                                }`}
                        >
                            Description
                        </button>

                        <button
                            onClick={() => setActiveTab("reviews")}
                            className={`px-6 py-3 ${activeTab === "reviews"
                                ? "border-b-2 border-khajur-gold text-khajur-primary"
                                : "text-gray-500"
                                }`}
                        >
                            Customer Reviews
                        </button>
                    </div>

                    {activeTab === "reviews" && (
                        <div className="w-full">

                            {/* ── Section Title ─────────────────────────────────────────────── */}
                            <div className="text-center mb-10">
                                <p className="text-xs uppercase tracking-widest text-khajur-gold mb-1">
                                    What customers say
                                </p>
                                <h2 className="font-serif text-3xl md:text-4xl font-medium text-khajur-primary">
                                    Customer Reviews
                                </h2>
                            </div>

                            {/* ── Summary Panel ─────────────────────────────────────────────── */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center bg-khajur-cream border border-khajur-border p-8 mb-10">

                                {/* Average Score */}
                                <div className="text-center md:text-left">
                                    <p className="font-serif text-8xl font-bold text-khajur-primary leading-none mb-3">
                                        {reviews.length
                                            ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1)
                                            : "0.0"}
                                    </p>

                                    {/* Star display */}
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star
                                                key={s}
                                                className={`w-5 h-5 ${s <= Math.round(avgRating)
                                                    ? "text-khajur-gold fill-khajur-gold"
                                                    : "text-khajur-dark/20 fill-transparent"
                                                    }`}
                                            />
                                        ))}
                                    </div>

                                    <p className="text-sm text-khajur-dark/50 mt-2">
                                        {reviews.length > 0
                                            ? `Based on ${reviews.length} review${reviews.length !== 1 ? "s" : ""}`
                                            : "No reviews yet"}
                                    </p>
                                </div>

                                {/* Star Distribution */}
                                <div className="space-y-2.5">
                                    {[5, 4, 3, 2, 1].map((star) => {
                                        const count = reviews.filter((r) => r.rating === star).length;
                                        const percent = reviews.length ? (count / reviews.length) * 100 : 0;

                                        return (
                                            <div key={star} className="flex items-center gap-3">
                                                <span className="w-3 text-xs font-medium text-khajur-dark/60 flex-shrink-0">
                                                    {star}
                                                </span>
                                                <Star className="w-3 h-3 text-khajur-gold fill-khajur-gold flex-shrink-0" />
                                                <div className="flex-1 h-2 bg-khajur-border rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-khajur-primary to-khajur-gold rounded-full transition-all duration-700"
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>
                                                <span className="w-5 text-xs text-khajur-dark/50 text-right flex-shrink-0">
                                                    {count}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Write Review CTA */}
                                <div className="flex justify-center md:justify-end">
                                    <button
                                        onClick={() => {
                                            setShowForm(true);
                                            setTimeout(() =>
                                                document.getElementById("review-form")?.scrollIntoView({ behavior: "smooth" }), 100
                                            );
                                        }}
                                        className="flex items-center gap-2 bg-khajur-primary text-khajur-cream hover:bg-khajur-primary/90 px-7 py-3.5 text-xs font-bold uppercase tracking-widest transition-colors"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        Write a Review
                                    </button>
                                </div>
                            </div>

                            {/* ── Filter & Sort Toolbar ──────────────────────────────────────── */}
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">

                                {/* Rating Filter Chips */}
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => { setFilterRating(0); setVisibleCount(5); }}
                                        className={`px-3.5 py-1.5 text-xs font-semibold border transition-colors ${filterRating === 0
                                            ? "bg-khajur-primary text-khajur-cream border-khajur-primary"
                                            : "border-khajur-border text-khajur-dark/60 hover:border-khajur-gold bg-white"
                                            }`}
                                    >
                                        All
                                    </button>
                                    {[5, 4, 3, 2, 1].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => { setFilterRating(star); setVisibleCount(5); }}
                                            className={`flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold border transition-colors ${filterRating === star
                                                ? "bg-khajur-primary text-khajur-cream border-khajur-primary"
                                                : "border-khajur-border text-khajur-dark/60 hover:border-khajur-gold bg-white"
                                                }`}
                                        >
                                            {star}
                                            <Star className="w-3 h-3 fill-current" />
                                        </button>
                                    ))}
                                </div>

                                {/* Sort Dropdown */}
                                <div className="relative">
                                    <select
                                        value={sortType}
                                        onChange={(e) => { setSortType(e.target.value); setVisibleCount(5); }}
                                        className="appearance-none pl-3 pr-8 py-2 text-xs border border-khajur-border text-khajur-primary bg-white focus:outline-none focus:border-khajur-gold cursor-pointer transition-colors"
                                    >
                                        <option value="latest">Newest First</option>
                                        <option value="top">Top Rated</option>
                                    </select>
                                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-khajur-dark/40 pointer-events-none" />
                                </div>
                            </div>

                            {/* Results Count */}
                            <p className="text-xs text-khajur-dark/40 mb-5">
                                Showing{" "}
                                <span className="font-medium text-khajur-primary">
                                    {processedReviews.length}
                                </span>{" "}
                                of{" "}
                                <span className="font-medium text-khajur-primary">
                                    {reviews.filter((r) => (filterRating ? r.rating === filterRating : true)).length}
                                </span>{" "}
                                review{reviews.length !== 1 ? "s" : ""}
                            </p>

                            {/* ── Review List ───────────────────────────────────────────────── */}
                            {processedReviews.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 border border-khajur-border bg-khajur-cream text-khajur-dark/30">
                                    <MessageSquare className="w-10 h-10 mb-3" />
                                    <p className="text-sm font-medium text-khajur-dark/50 mb-1">
                                        {filterRating
                                            ? `No ${filterRating}-star reviews yet.`
                                            : "No reviews yet."}
                                    </p>
                                    {!filterRating && (
                                        <button
                                            onClick={() => setShowForm(true)}
                                            className="mt-2 text-xs underline underline-offset-2 text-khajur-gold hover:text-khajur-primary transition-colors"
                                        >
                                            Be the first to write one
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="border border-khajur-border bg-white divide-y divide-khajur-border">
                                    {processedReviews.map((review) => (
                                        <div key={review.id} className="p-6">
                                            <div className="flex items-start gap-4">

                                                {/* Avatar */}
                                                <div className="w-10 h-10 flex-shrink-0 bg-khajur-primary flex items-center justify-center">
                                                    <span className="text-khajur-cream text-sm font-bold uppercase">
                                                        {review.user_name?.charAt(0) ?? "?"}
                                                    </span>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                                                        <div className="flex items-center gap-3">
                                                            <p className="text-sm font-semibold text-khajur-primary">
                                                                {review.user_name ?? "Anonymous"}
                                                            </p>
                                                            <span className="text-khajur-dark/20">·</span>
                                                            <p className="text-xs text-khajur-dark/40">
                                                                {review.created_at
                                                                    ? new Date(review.created_at).toLocaleDateString("en-IN", {
                                                                        day: "2-digit", month: "short", year: "numeric",
                                                                    })
                                                                    : "—"}
                                                            </p>
                                                        </div>

                                                        {/* Stars */}
                                                        <div className="flex gap-0.5">
                                                            {[1, 2, 3, 4, 5].map((s) => (
                                                                <Star
                                                                    key={s}
                                                                    className={`w-3.5 h-3.5 ${s <= review.rating
                                                                        ? "text-khajur-gold fill-khajur-gold"
                                                                        : "text-khajur-dark/20 fill-transparent"
                                                                        }`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {review.title && (
                                                        <p className="text-sm font-semibold text-khajur-dark mb-1">
                                                            {review.title}
                                                        </p>
                                                    )}
                                                    {review.comment && (
                                                        <p className="text-sm text-khajur-dark/70 leading-relaxed">
                                                            {review.comment}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Load More */}
                            {visibleCount < reviews.filter((r) => (filterRating ? r.rating === filterRating : true)).length && (
                                <div className="text-center mt-8">
                                    <button
                                        onClick={() => setVisibleCount((prev) => prev + 5)}
                                        className="px-8 py-2.5 border border-khajur-border text-khajur-primary hover:bg-khajur-primary hover:text-khajur-cream hover:border-khajur-primary text-xs font-bold uppercase tracking-widest transition-colors"
                                    >
                                        Load More Reviews
                                    </button>
                                </div>
                            )}

                            {/* ── Inline Review Form ─────────────────────────────────────────── */}
                            {showForm && (
                                <div id="review-form" className="mt-10 border border-khajur-border bg-white">

                                    {/* Form Header */}
                                    <div className="flex items-center justify-between px-7 py-5 border-b border-khajur-border bg-khajur-cream">
                                        <div>
                                            <p className="text-xs uppercase tracking-widest text-khajur-gold mb-0.5">
                                                Leave a Review
                                            </p>
                                            <h3 className="font-serif text-xl font-medium text-khajur-primary">
                                                Share Your Experience
                                            </h3>
                                        </div>
                                        <button
                                            onClick={() => setShowForm(false)}
                                            className="text-khajur-dark/40 hover:text-khajur-primary transition-colors"
                                            aria-label="Close review form"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Form Body */}
                                    <div className="px-7 py-6 space-y-5">

                                        {/* Interactive Star Rating */}
                                        <div>
                                            <label className="text-xs font-medium uppercase tracking-wide text-khajur-dark/50 mb-2 block">
                                                Your Rating <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex items-center gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                        key={star}
                                                        onClick={() => setRating(star)}
                                                        className={`w-8 h-8 cursor-pointer transition-all hover:scale-110 ${star <= rating
                                                            ? "text-khajur-gold fill-khajur-gold"
                                                            : "text-khajur-dark/20 fill-transparent"
                                                            }`}
                                                    />
                                                ))}
                                                <span className="ml-2 text-sm text-khajur-dark/50">
                                                    {rating} / 5
                                                </span>
                                            </div>
                                        </div>

                                        {/* Name */}
                                        <div>
                                            <label className="text-xs font-medium uppercase tracking-wide text-khajur-dark/50 mb-1.5 block">
                                                Your Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="e.g. Priya Sharma"
                                                className="w-full border border-khajur-border px-4 py-2.5 text-sm text-khajur-primary placeholder:text-khajur-dark/30 bg-white focus:outline-none focus:border-khajur-gold transition-colors"
                                            />
                                        </div>

                                        {/* Review Title */}
                                        <div>
                                            <label className="text-xs font-medium uppercase tracking-wide text-khajur-dark/50 mb-1.5 block">
                                                Review Title
                                            </label>
                                            <input
                                                type="text"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                placeholder="Summarise your experience…"
                                                className="w-full border border-khajur-border px-4 py-2.5 text-sm text-khajur-primary placeholder:text-khajur-dark/30 bg-white focus:outline-none focus:border-khajur-gold transition-colors"
                                            />
                                        </div>

                                        {/* Comment */}
                                        <div>
                                            <label className="text-xs font-medium uppercase tracking-wide text-khajur-dark/50 mb-1.5 block">
                                                Your Review
                                            </label>
                                            <textarea
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                placeholder="What did you like or dislike? How was the quality?"
                                                rows={4}
                                                className="w-full border border-khajur-border px-4 py-2.5 text-sm text-khajur-primary placeholder:text-khajur-dark/30 bg-white focus:outline-none focus:border-khajur-gold transition-colors resize-none"
                                            />
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-3 pt-1">
                                            <button
                                                onClick={submitReview}
                                                className="flex-1 flex items-center justify-center gap-2 bg-khajur-primary text-khajur-cream hover:bg-khajur-primary/90 py-3 text-xs font-bold uppercase tracking-widest transition-colors"
                                            >
                                                <Send className="w-4 h-4" />
                                                Submit Review
                                            </button>
                                            <button
                                                onClick={() => setShowForm(false)}
                                                className="px-5 py-3 border border-khajur-border text-khajur-dark/60 hover:bg-khajur-cream text-xs font-bold uppercase tracking-widest transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {/* YOU MAY ALSO LIKE */}
            <RelatedProducts
                products={products}
                currentProduct={product}
                type="related"
            />

            {/* EXPLORE MORE */}
            <RelatedProducts
                products={products}
                currentProduct={product}
                type="explore"
            />
        </div>
        // </div >
    );
};

export default ProductDetail;
