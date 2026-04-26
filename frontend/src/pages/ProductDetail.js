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
                className={`cursor-pointer text-2xl ${star <= current ? "text-yellow-500" : "text-gray-300"
                    }`}
            >
                ★
            </span>
        ));
    };

    const submitReview = async () => {
        try {
            await axios.post(`${API}/reviews`, {
                id: Date.now().toString(),
                product_id: id,
                user_name: name,
                rating: Number(rating),
                comment: comment,
                created_at: new Date().toISOString()
            });

            setName("");
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

                    {/* Content */}
                    <div className="text-center">
                        {activeTab === "description" && (
                            <p className="text-khajur-dark/80 leading-relaxed">
                                {product.description}
                            </p>
                        )}

                        {/* Customer Reviews SECTION */}
                        {activeTab === "reviews" && (
                            <div className="max-w-6xl mx-auto">

                                {/* TOP GRID */}
                                <div className="grid md:grid-cols-2 gap-12 items-start">

                                    {/* ⭐ LEFT SIDE */}
                                    <div>
                                        <h2 className="text-2xl font-serif text-khajur-primary mb-6">
                                            Customer Reviews
                                        </h2>

                                        {/* OVERALL RATING */}
                                        <div className="flex items-center gap-4 mb-6">
                                            <span className="text-4xl font-bold text-khajur-primary">
                                                {reviews.length
                                                    ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1)
                                                    : "0.0"}
                                            </span>
                                            <div className="flex text-yellow-500 text-xl">
                                                {renderStars(
                                                    Math.round(
                                                        reviews.length
                                                            ? reviews.reduce((a, b) => a + b.rating, 0) / reviews.length
                                                            : 0
                                                    )
                                                )}
                                            </div>
                                            <span className="text-sm text-gray-500">
                                                ({reviews.length} reviews)
                                            </span>
                                        </div>

                                        {/* RATING BARS */}
                                        <div className="space-y-3">
                                            {[5, 4, 3, 2, 1].map((star) => {
                                                const count = reviews.filter(r => r.rating === star).length;
                                                const percent = reviews.length ? (count / reviews.length) * 100 : 0;

                                                return (
                                                    <div key={star} className="flex items-center gap-3">
                                                        <span className="w-6 text-sm text-gray-600">{star}★</span>

                                                        <div className="flex-1 h-2 bg-gray-200 rounded">
                                                            <div
                                                                className="h-2 bg-khajur-gold rounded"
                                                                style={{ width: `${percent}%` }}
                                                            />
                                                        </div>

                                                        <span className="w-10 text-xs text-gray-500 text-right">
                                                            {Math.round(percent)}%
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* ✍️ RIGHT SIDE FORM */}
                                    <div className="bg-white border rounded-lg p-6 shadow-sm">
                                        <h3 className="font-serif text-lg text-khajur-primary mb-4">
                                            Write a review
                                        </h3>

                                        {/* STARS */}
                                        <div className="mb-4 flex gap-1">
                                            {renderStars(rating, setRating)}
                                        </div>

                                        <input
                                            type="text"
                                            placeholder="Your name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full border border-gray-300 p-3 rounded mb-3 text-sm focus:outline-none focus:ring-1 focus:ring-khajur-gold"
                                        />

                                        <textarea
                                            placeholder="Write your review..."
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            className="w-full border border-gray-300 p-3 rounded mb-4 text-sm h-28 focus:outline-none focus:ring-1 focus:ring-khajur-gold"
                                        />

                                        <button
                                            onClick={submitReview}
                                            className="w-full bg-khajur-primary text-white py-3 rounded text-sm tracking-wide hover:bg-khajur-gold transition"
                                        >
                                            Submit Review
                                        </button>
                                    </div>
                                </div>

                                {/* 🧾 REVIEWS LIST */}
                                <div className="mt-12 space-y-6">
                                    {reviews.length === 0 ? (
                                        <p className="text-center text-gray-500">No reviews yet</p>
                                    ) : (
                                        reviews.map((rev, i) => (
                                            <div
                                                key={i}
                                                className="border-b pb-4 flex flex-col gap-2"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <h4 className="font-medium text-khajur-primary">
                                                        {rev.user_name}
                                                    </h4>

                                                    <div className="text-yellow-500 text-sm">
                                                        ⭐ {rev.rating}
                                                    </div>
                                                </div>

                                                <p className="text-sm text-gray-600 leading-relaxed">
                                                    {rev.comment}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>

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
