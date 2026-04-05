import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, Heart, ChevronLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
console.log("Backend URL:", BACKEND_URL);


const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("description");
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProduct();
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
        <Link to="/products" className="text-khajur-primary hover:text-khajur-gold">
          Back to Products
        </Link>
      </div>
    );
  }

return (
  <div className="min-h-screen py-20" data-testid="product-detail-page">
    <div className="max-w-7xl mx-auto px-6 md:px-12">

      <Link
        to="/products"
        className="inline-flex items-center text-khajur-primary hover:text-khajur-gold mb-8"
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
            className="w-full object-contain"
          />
        </div>

        {/* INFO */}
        <div>
          <h1 className="text-4xl font-serif text-khajur-primary mb-4">
            {product.name}
          </h1>

          <p className="text-3xl text-khajur-gold font-bold mb-6">
            ₹{product.price.toFixed(2)}
          </p>

          <p className="text-sm mb-2">Weight: {product.weight}</p>
          <p className="text-sm mb-6">
            {product.stock > 0
              ? `In Stock (${product.stock})`
              : "Out of Stock"}
          </p>

          {/* Quantity */}
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button onClick={handleAddToCart} className="bg-green-800 text-white px-6 py-3">
              Add to Cart
            </button>
            <button onClick={handleBuyNow} className="bg-yellow-600 px-6 py-3">
              Buy Now
            </button>
          </div>

        </div>
      </div>

      {/* ✅ BELOW IMAGE SECTION (THIS IS THE FIX) */}
      <div className="mt-16 max-w-5xl mx-auto">

        {/* Tabs */}
        <div className="flex justify-center border-b mb-6">
          <button
            onClick={() => setActiveTab("description")}
            className={`px-6 py-3 ${
              activeTab === "description"
                ? "border-b-2 border-khajur-gold"
                : ""
            }`}
          >
            Description
          </button>

          <button
            onClick={() => setActiveTab("reviews")}
            className={`px-6 py-3 ${
              activeTab === "reviews"
                ? "border-b-2 border-khajur-gold"
                : ""
            }`}
          >
            Customer Reviews
          </button>
        </div>

        {/* Content */}
        <div className="text-center">
          {activeTab === "description" && (
            <p className="text-gray-700">
              {product.description}
            </p>
          )}

          {activeTab === "reviews" && (
            <div className="space-y-4">
              <div className="border p-4 rounded">
                <h4>Ali</h4>
                <p>Great quality!</p>
              </div>
              <div className="border p-4 rounded">
                <h4>Sara</h4>
                <p>Very fresh!</p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  </div>
);
};

export default ProductDetail;
