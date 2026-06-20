import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product }) => {
    const { addToCart } = useCart();

    return (
        <div
            className="group relative bg-white border border-khajur-border hover:border-khajur-gold hover:shadow-xl transition-all duration-500 overflow-hidden rounded-sm"
            data-testid={`product-card-${product.id}`}
        >
            {/* Discount Badge */}
            {product.original_price && product.original_price > product.price && (
                <div className="absolute top-0 right-0 z-10">
                    <div style={{
                        background: '#C6A962',
                        color: '#064E3B',
                        fontSize: '10px',
                        fontWeight: '800',
                        padding: '6px 12px',
                        letterSpacing: '1px',
                        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 8% 50%)',
                    }}>
                        UPTO {Math.round(((product.original_price - product.price) / product.original_price) * 100)}% OFF
                    </div>
                </div>
            )}

            {/* Product Image */}
            <Link to={`/product/${product.id}?category=${product.category}`}>
                <div className="aspect-square overflow-hidden bg-khajur-cream">
                    <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                </div>
            </Link>

            {/* Product Info */}
            <div className="p-5">

                {/* Name */}
                <Link to={`/product/${product.id}?category=${product.category}`}>
                    <h3
                        className="font-serif text-lg font-medium text-khajur-primary mb-2 group-hover:text-khajur-gold transition-colors line-clamp-1"
                        data-testid={`product-name-${product.id}`}
                    >
                        {product.name}
                    </h3>
                </Link>

                {/* Description */}
                <p className="text-xs text-khajur-dark/50 mb-4 line-clamp-2 leading-relaxed">
                    {product.description?.replace(/<[^>]*>/g, '')}
                </p>

                {/* Price + Cart */}
                <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                        <span
                            className="font-serif text-xl text-khajur-gold font-bold"
                        >
                            ₹{product.price}
                        </span>
                        {product.original_price && product.original_price > product.price && (
                            <span className="line-through text-gray-400 text-xs">
                                ₹{product.original_price}
                            </span>
                        )}
                    </div>

                    <button
                        onClick={() => addToCart(product.id)}
                        aria-label={`Add ${product.name} to cart`}
                        className="bg-khajur-primary text-khajur-cream hover:bg-khajur-gold hover:text-khajur-primary p-3 rounded-sm transition-all duration-300 flex items-center gap-2"
                        data-testid={`add-to-cart-${product.id}`}
                    >
                        <ShoppingCart className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
