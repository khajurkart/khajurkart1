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

                        {activeTab === "reviews" && (
                            <div className="space-y-4">

                                {/* Show Reviews */}
                                {reviews.length === 0 ? (
                                    <p>No reviews yet</p>
                                ) : (
                                    reviews.map((rev, i) => (
                                        <div key={i} className="border p-4 rounded">
                                            <h4 className="font-semibold">{rev.user_name}</h4>
                                            <p className="text-yellow-600">⭐ {rev.rating}/5</p>
                                            <p className="text-sm text-gray-600">{rev.comment}</p>
                                        </div>
                                    ))
                                )}

                                {/* Add Review Form */}
                                <div className="mt-6">
                                    <input
                                        type="text"
                                        placeholder="Your name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="border p-2 w-full mb-2"
                                    />

                                    <input
                                        type="number"
                                        placeholder="Rating (1-5)"
                                        value={rating}
                                        onChange={(e) => setRating(e.target.value)}
                                        className="border p-2 w-full mb-2"
                                    />

                                    <textarea
                                        placeholder="Write review..."
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        className="border p-2 w-full mb-2"
                                    />

                                    <button
                                        onClick={submitReview}
                                        className="bg-khajur-primary text-white px-6 py-2"
                                    >
                                        Submit Review
                                    </button>
                                </div>

                            </div>
                        )}
                    </div>
                </div>
                {/* RELATED PRODUCTS */}
                <RelatedProducts
                    products={products} // ✅ FIXED
                    currentProduct={product}
                />
            </div>
        </div>
    );
};

export default ProductDetail;
