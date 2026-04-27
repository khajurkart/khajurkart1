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
                className={`cursor-pointer text-4xl ${star <= current ? "text-yellow-500" : "text-gray-300"
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

                        {/* CUSTOMER REVIEWS */}
                        {activeTab === "reviews" && (
                            <div className="max-w-6xl mx-auto font-[Manrope]">

                                {/* TITLE */}
                                <h2 className="text-4xl font-semibold text-center text-khajur-primary mb-12 tracking-wide">
                                    Customer Reviews
                                </h2>

                                {/* TOP SECTION */}
                                <div className="grid md:grid-cols-3 gap-12 items-center">

                                    {/* AVG RATING */}
                                    <div className="text-center md:text-left">
                                        <h1 className="text-7xl font-bold text-khajur-primary">
                                            {reviews.length
                                                ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1)
                                                : "0.0"}
                                        </h1>

                                        {/* STARS */}
                                        <div className="flex gap-1 justify-center md:justify-start text-2xl mt-2">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <span key={star} className="text-yellow-400 drop-shadow">
                                                    ★
                                                </span>
                                            ))}
                                        </div>

                                        <p className="text-blue-600 text-sm mt-2">
                                            {reviews.length
                                                ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(2)
                                                : "0"} out of 5
                                        </p>

                                        <p className="text-gray-500 mt-1">
                                            Based on {reviews.length} reviews
                                        </p>
                                    </div>

                                    {/* BARS */}
                                    <div className="space-y-4">
                                        {[5, 4, 3, 2, 1].map(star => {
                                            const count = reviews.filter(r => r.rating === star).length;
                                            const percent = reviews.length ? (count / reviews.length) * 100 : 0;

                                            return (
                                                <div key={star} className="flex items-center gap-3">
                                                    <span className="w-6 text-sm text-khajur-primary font-medium">
                                                        {star}★
                                                    </span>

                                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-khajur-primary to-khajur-gold transition-all duration-700"
                                                            style={{ width: `${percent}%` }}
                                                        />
                                                    </div>

                                                    <span className="text-sm text-gray-500 w-8 text-right">
                                                        {count}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* BUTTON */}
                                    <div className="flex justify-center md:justify-end">
                                        <button
                                            onClick={() => window.scrollTo({ top: 900, behavior: "smooth" })}
                                            className="bg-khajur-primary text-white px-6 py-3 rounded-lg shadow-md hover:shadow-xl hover:bg-khajur-gold transition-all duration-300"
                                        >
                                            Write Review
                                        </button>
                                    </div>
                                </div>

                                {/* DIVIDER */}
                                <div className="border-t my-12"></div>

                                {/* FORM */}
                                <div className="max-w-3xl mx-auto">

                                    <h3 className="text-3xl font-semibold text-center mb-10">
                                        Write a review
                                    </h3>

                                    {/* RATING */}
                                    <div className="mb-8">
                                        <p className="mb-2 font-medium">Rating</p>
                                        <div className="flex gap-2 text-3xl">
                                            {renderStars(rating, setRating)}
                                        </div>
                                    </div>

                                    {/* TITLE */}
                                    <div className="mb-6">
                                        <p className="mb-2 font-medium">Review Title</p>
                                        <input
                                            type="text"
                                            placeholder="Give your review a title"
                                            className="w-full border p-4 rounded-lg bg-gray-50 focus:ring-2 focus:ring-khajur-primary outline-none"
                                        />
                                    </div>

                                    {/* CONTENT */}
                                    <div className="mb-6">
                                        <p className="mb-2 font-medium">Review content</p>
                                        <textarea
                                            placeholder="Start writing here..."
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            className="w-full border p-4 rounded-lg h-40 bg-gray-50 focus:ring-2 focus:ring-khajur-primary outline-none"
                                        />
                                    </div>

                                    {/* NAME + EMAIL */}
                                    <div className="grid md:grid-cols-2 gap-4 mb-8">
                                        <input
                                            type="text"
                                            placeholder="Display name"
                                            className="border p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-khajur-primary outline-none"
                                        />
                                        <input
                                            type="email"
                                            placeholder="Your email address"
                                            className="border p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-khajur-primary outline-none"
                                        />
                                    </div>

                                    {/* POLICY */}
                                    <p className="text-center font-semibold text-gray-700 text-base mb-8">
                                        We’ll only contact you about your review if necessary.
                                    </p>

                                    {/* BUTTONS */}
                                    <div className="flex justify-center gap-4">
                                        <button className="px-6 py-3 rounded-lg border border-khajur-primary text-khajur-primary hover:bg-khajur-primary hover:text-white transition">
                                            Cancel review
                                        </button>

                                        <button
                                            onClick={submitReview}
                                            className="bg-khajur-primary text-white px-8 py-3 rounded-lg shadow hover:shadow-lg hover:bg-khajur-gold transition-all"
                                        >
                                            Submit Review
                                        </button>
                                    </div>
                                </div>

                                {/* REVIEWS LIST */}
                                <div className="mt-16 space-y-6 max-w-4xl mx-auto">
                                    {reviews.map((rev, i) => (
                                        <div
                                            key={i}
                                            className="bg-white/80 backdrop-blur border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-xl transition-all duration-300"
                                        >
                                            <div className="flex justify-between items-start">

                                                {/* USER */}
                                                <div className="flex gap-4 items-center">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-khajur-primary to-khajur-gold text-white flex items-center justify-center font-bold">
                                                        {rev.user_name?.charAt(0)}
                                                    </div>

                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-semibold text-khajur-primary">
                                                                {rev.user_name}
                                                            </h4>

                                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded shadow-sm">
                                                                ✔ Verified
                                                            </span>
                                                        </div>

                                                        <p className="text-xs text-gray-400">
                                                            {new Date(rev.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* STARS */}
                                                <div className="text-yellow-400 text-lg">
                                                    {[1, 2, 3, 4, 5].map(s => (
                                                        <span key={s}>{s <= rev.rating ? "★" : "☆"}</span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* COMMENT */}
                                            <p className="text-gray-600 mt-4 leading-relaxed">
                                                {rev.comment}
                                            </p>
                                        </div>
                                    ))}
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
