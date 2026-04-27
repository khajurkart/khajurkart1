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

    useEffect(() => {
        fetchProduct();
        fetchReviews();
        fetchAllProducts();
    }, [id]);

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
        addToCart(product.id, quantity);
    };

    const handleBuyNow = () => {
        addToCart(product.id, quantity);
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
                                ₹{product.price}
                            </span>
                            {product.original_price && (
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="line-through text-gray-400 text-lg">
                                        ₹{product.original_price}
                                    </span>
                                    <span className="text-green-600 font-bold">
                                        {Math.round(
                                            ((product.original_price - product.price) / product.original_price) * 100
                                        )}% OFF
                                    </span>
                                </div>
                            )}
                        </div>

                        <p className="text-sm text-khajur-muted mb-2">
                            Weight: {product.weight}
                        </p>

                        <p className="text-sm text-khajur-muted mb-8">
                            {product.stock > 0
                                ? `In Stock (${product.stock} available)`
                                : "Out of Stock"}
                        </p>

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

                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-khajur-primary text-white px-6 py-3 rounded-lg"
                    >
                        Write Review
                    </button>

                    {/* Content */}
                    <div className="text-center">
                        {activeTab === "description" && (
                            <p className="text-khajur-dark/80 leading-relaxed">
                                {product.description}
                            </p>
                        )}

                        {/* CUSTOMER REVIEWS */}
                        {activeTab === "reviews" && (
                            <div className="max-w-7xl mx-auto font-[Manrope]">

                                {/* HEADER */}
                                <h2 className="text-4xl font-semibold text-center text-khajur-primary mb-14">
                                    Customer Reviews
                                </h2>

                                {/* ================= TOP SUMMARY ================= */}
                                <div className="grid md:grid-cols-3 gap-12 items-center mb-14">

                                    {/* AVG */}
                                    <div>
                                        <h1 className="text-7xl font-bold text-khajur-primary leading-none">
                                            {reviews.length
                                                ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1)
                                                : "0.0"}
                                        </h1>

                                        <div className="flex gap-1 mt-3 text-yellow-400 text-xl">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <span key={s}>
                                                    {s <= Math.round(avgRating) ? "★" : "☆"}
                                                </span>
                                            ))}
                                        </div>

                                        <p className="text-gray-500 mt-2">
                                            Based on {reviews.length} reviews
                                        </p>
                                    </div>

                                    {/* DISTRIBUTION */}
                                    <div className="space-y-3">
                                        {[5, 4, 3, 2, 1].map(star => {
                                            const count = reviews.filter(r => r.rating === star).length;
                                            const percent = reviews.length ? (count / reviews.length) * 100 : 0;

                                            return (
                                                <div key={star} className="flex items-center gap-3">
                                                    <span className="w-6">{star}★</span>

                                                    <div className="flex-1 h-2 bg-gray-200 rounded-full">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-khajur-primary to-khajur-gold transition-all duration-700"
                                                            style={{ width: `${percent}%` }}
                                                        />
                                                    </div>

                                                    <span className="text-sm text-gray-500">{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* CTA */}
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => window.scrollTo({ top: 900, behavior: "smooth" })}
                                            className="bg-khajur-primary text-white px-6 py-3 rounded-lg shadow hover:shadow-xl transition"
                                        >
                                            Write Review
                                        </button>
                                    </div>
                                </div>

                                {/* ================= CONTROLS ================= */}
                                <div className="flex flex-wrap justify-between items-center mb-8 gap-4">

                                    {/* FILTER */}
                                    <div className="flex gap-2 flex-wrap">
                                        {[5, 4, 3, 2, 1].map(star => (
                                            <button
                                                key={star}
                                                onClick={() => setFilterRating(star)}
                                                className={`px-3 py-1 rounded border ${filterRating === star ? "bg-khajur-primary text-white" : ""
                                                    }`}
                                            >
                                                {star}★
                                            </button>
                                        ))}
                                        <button onClick={() => setFilterRating(0)} className="px-3 py-1 border rounded">
                                            All
                                        </button>
                                    </div>

                                    {/* SORT */}
                                    <select
                                        value={sortType}
                                        onChange={(e) => setSortType(e.target.value)}
                                        className="border px-3 py-2 rounded"
                                    >
                                        <option value="latest">Newest</option>
                                        <option value="top">Top Rated</option>
                                    </select>
                                </div>

                                {/* LOAD MORE */}
                                {visibleCount < reviews.length && (
                                    <div className="text-center mt-10">
                                        <button
                                            onClick={() => setVisibleCount(prev => prev + 5)}
                                            className="px-6 py-2 border rounded hover:bg-khajur-primary hover:text-white"
                                        >
                                            Load More
                                        </button>
                                    </div>
                                )}

                                {/* WRITE REVIEW BUTTON */}
                                <div className="text-center mt-12">
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="bg-khajur-primary text-white px-8 py-3 rounded-lg shadow hover:shadow-xl transition"
                                    >
                                        Write Review
                                    </button>
                                </div>

                                {/* CONDITIONAL FORM */}
                                {showForm && (
                                    <div className="max-w-4xl mx-auto mt-16" id="review-form">

                                        <div className="bg-white/90 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-xl p-10">

                                            <div className="text-center mb-10">
                                                <h3 className="text-3xl font-semibold text-khajur-primary">
                                                    Share Your Experience
                                                </h3>
                                            </div>

                                            {/* RATING */}
                                            <div className="mb-10 text-center">
                                                <div className="flex justify-center gap-3 text-4xl">
                                                    {renderStars(rating, setRating)}
                                                </div>
                                            </div>

                                            {/* NAME + EMAIL */}
                                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    placeholder="Your Name"
                                                    className="p-4 rounded-xl bg-gray-50 border"
                                                />

                                                <input
                                                    type="email"
                                                    placeholder="Email"
                                                    className="p-4 rounded-xl bg-gray-50 border"
                                                />
                                            </div>

                                            {/* TITLE */}
                                            <input
                                                type="text"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                placeholder="Review Title"
                                                className="w-full p-4 rounded-xl bg-gray-50 border mb-6"
                                            />

                                            {/* COMMENT */}
                                            <textarea
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                placeholder="Write your review..."
                                                className="w-full p-4 rounded-xl h-40 bg-gray-50 border mb-6"
                                            />

                                            {/* BUTTONS */}
                                            <div className="flex justify-center gap-4">
                                                <button
                                                    onClick={() => setShowForm(false)}
                                                    className="px-8 py-3 border rounded-xl"
                                                >
                                                    Cancel
                                                </button>

                                                <button
                                                    onClick={submitReview}
                                                    className="px-10 py-3 bg-khajur-primary text-white rounded-xl"
                                                >
                                                    Submit Review
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
        </div >
    );
};

export default ProductDetail;
