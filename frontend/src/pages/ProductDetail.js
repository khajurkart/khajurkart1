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

                                {/* 🔝 HEADER */}
                                <h2 className="text-center text-2xl font-serif text-khajur-primary mb-10">
                                    Customer Reviews
                                </h2>

                                {/* 🔥 TOP GRID */}
                                <div className="grid md:grid-cols-3 gap-10 items-center">

                                    {/* ⭐ LEFT (AVERAGE) */}
                                    <div className="text-center md:text-left">
                                        <div className="text-5xl font-bold text-khajur-primary">
                                            {reviews.length
                                                ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(2)
                                                : "0.0"}
                                        </div>

                                        <div className="text-blue-700 mt-2 text-sm">
                                            ★★★★☆ {reviews.length ? "4.29 out of 5" : "0 out of 5"}
                                        </div>

                                        <p className="text-gray-500 text-sm mt-1">
                                            Based on {reviews.length} reviews
                                        </p>
                                    </div>

                                    {/* 📊 CENTER (BARS) */}
                                    <div className="space-y-3">
                                        {[5, 4, 3, 2, 1].map((star) => {
                                            const count = reviews.filter(r => r.rating === star).length;
                                            const percent = reviews.length ? (count / reviews.length) * 100 : 0;

                                            return (
                                                <div key={star} className="flex items-center gap-3">
                                                    <span className="text-sm w-8 text-khajur-primary">
                                                        {star}★
                                                    </span>

                                                    <div className="flex-1 h-2 bg-gray-200 rounded">
                                                        <div
                                                            className="h-2 bg-khajur-primary rounded"
                                                            style={{ width: `${percent}%` }}
                                                        />
                                                    </div>

                                                    <span className="text-xs text-gray-500 w-8 text-right">
                                                        {Math.round(percent)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* ❌ RIGHT BUTTON */}
                                    <div className="flex justify-center md:justify-end">
                                        <button className="bg-khajur-primary text-white px-6 py-3 rounded hover:bg-khajur-gold transition">
                                            Cancel review
                                        </button>
                                    </div>
                                </div>

                                {/* 🔽 DIVIDER */}
                                <hr className="my-10 border-gray-200" />

                                {/* ✍️ WRITE REVIEW SECTION */}
                                <div className="max-w-4xl mx-auto">

                                    <h3 className="text-xl font-semibold mb-6">
                                        Write a review
                                    </h3>

                                    <div className="grid md:grid-cols-2 gap-6">

                                        {/* ⭐ RATING */}
                                        <div>
                                            <p className="mb-2 text-sm">Rating</p>
                                            <div className="text-2xl text-blue-700">
                                                {renderStars(rating, setRating)}
                                            </div>
                                        </div>

                                        {/* TITLE */}
                                        <div>
                                            <p className="mb-2 text-sm">Review Title</p>
                                            <input
                                                type="text"
                                                placeholder="Give your review a title"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                className="w-full border p-3 rounded"
                                            />
                                        </div>
                                    </div>

                                    {/* COMMENT */}
                                    <div className="mt-6">
                                        <p className="mb-2 text-sm">Review content</p>
                                        <textarea
                                            placeholder="Start writing here..."
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            className="w-full border p-4 rounded h-32"
                                        />
                                    </div>

                                    {/* NAME + EMAIL */}
                                    <div className="grid md:grid-cols-2 gap-6 mt-6">
                                        <input
                                            type="text"
                                            placeholder="Display name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="border p-3 rounded"
                                        />

                                        <input
                                            type="email"
                                            placeholder="Your email address"
                                            className="border p-3 rounded"
                                        />
                                    </div>

                                    {/* TEXT */}
                                    <p className="text-xs text-gray-500 mt-6 leading-relaxed">
                                        How we use your data: We'll only contact you about the review you left,
                                        and only if necessary.
                                    </p>

                                    {/* BUTTONS */}
                                    <div className="flex gap-4 mt-6">
                                        <button className="border px-6 py-3 rounded text-khajur-primary">
                                            Cancel review
                                        </button>

                                        <button
                                            onClick={submitReview}
                                            className="bg-khajur-primary text-white px-6 py-3 rounded hover:bg-khajur-gold transition"
                                        >
                                            Submit Review
                                        </button>
                                    </div>
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
