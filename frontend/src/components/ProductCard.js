import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, ImageOff, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const calcDiscount = (product) => {
  if (product.discount) return product.discount;
  if (product.original_price && product.original_price > product.price) {
    return Math.round(
      ((product.original_price - product.price) / product.original_price) * 100
    );
  }
  return 0;
};

const stripHtml = (html) => html?.replace(/<[^>]*>/g, '') ?? '';

// ─── Sub-Components ────────────────────────────────────────────────────────────

const DiscountBadge = ({ discount }) => (
  <div className="
    absolute top-3 right-0 z-10
    bg-khajur-gold text-khajur-primary
    text-[11px] font-extrabold tracking-wide
    px-3 py-1
    rounded-l-sm
    shadow-md
  ">
    {discount}% OFF
  </div>
);

const StockBadge = () => (
  <div className="
    absolute top-3 left-0 z-10
    bg-red-500 text-white
    text-[10px] font-bold tracking-widest uppercase
    px-3 py-1
    rounded-r-sm
  ">
    Sold Out
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const ProductCard = ({ product }) => {
  const { addToCart }   = useCart();
  const [adding, setAdding] = useState(false);
  const [imgError, setImgError] = useState(false);

  const discount    = calcDiscount(product);
  const hasDiscount = discount > 0;
  const isOutOfStock = product.stock === 0;
  const productUrl  = `/product/${product.id}?category=${product.category ?? ''}`;

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (isOutOfStock || adding) return;

    setAdding(true);
    try {
      await addToCart(product.id);
      toast.success(`${product.name} added to cart!`);
    } catch {
      toast.error('Failed to add to cart. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className={`
        group relative bg-white border transition-all duration-500 overflow-hidden
        ${isOutOfStock
          ? 'border-khajur-border opacity-75'
          : 'border-khajur-border hover:border-khajur-gold hover:shadow-xl'
        }
      `}
      data-testid={`product-card-${product.id}`}
    >

      {/* ── Badges ─────────────────────────────────────────────────────── */}
      {hasDiscount && !isOutOfStock && <DiscountBadge discount={discount} />}
      {isOutOfStock && <StockBadge />}

      {/* ── Product Image ───────────────────────────────────────────────── */}
      <Link to={productUrl} aria-label={`View ${product.name}`}>
        <div className="aspect-square overflow-hidden bg-khajur-cream">
          {imgError ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-khajur-dark/20 gap-2">
              <ImageOff className="w-10 h-10" />
              <p className="text-xs">No image</p>
            </div>
          ) : (
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              onError={() => setImgError(true)}
              className={`
                w-full h-full object-cover transition-transform duration-700
                ${isOutOfStock ? '' : 'group-hover:scale-105'}
              `}
            />
          )}
        </div>
      </Link>

      {/* ── Product Info ────────────────────────────────────────────────── */}
      <div className="p-5 flex flex-col gap-2">

        {/* Category */}
        {product.category && (
          <p className="text-xs uppercase tracking-widest text-khajur-gold font-medium">
            {product.category}
          </p>
        )}

        {/* Name */}
        <Link to={productUrl}>
          <h3
            className="
              font-serif text-lg font-medium text-khajur-primary
              group-hover:text-khajur-gold transition-colors
              line-clamp-1 leading-snug
            "
            data-testid={`product-name-${product.id}`}
          >
            {product.name}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-xs text-khajur-dark/50 line-clamp-2 leading-relaxed">
          {stripHtml(product.description)}
        </p>

        {/* ── Price & CTA ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mt-3">

          {/* Price Block */}
          <div className="flex flex-col gap-0.5">
            <span
              className="font-serif text-xl font-bold text-khajur-gold"
              data-testid={`product-price-${product.id}`}
            >
              ₹{product.price}
            </span>
            {hasDiscount && product.original_price && (
              <span className="text-xs text-khajur-dark/40 line-through">
                ₹{product.original_price}
              </span>
            )}
          </div>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || adding}
            aria-label={
              isOutOfStock
                ? `${product.name} is out of stock`
                : `Add ${product.name} to cart`
            }
            className={`
              flex items-center justify-center p-3 transition-all duration-300
              ${isOutOfStock
                ? 'bg-khajur-border text-khajur-dark/30 cursor-not-allowed'
                : adding
                ? 'bg-khajur-primary text-khajur-cream cursor-wait'
                : 'bg-khajur-primary text-khajur-cream hover:bg-khajur-gold hover:text-khajur-primary'
              }
            `}
            data-testid={`add-to-cart-${product.id}`}
          >
            {adding
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <ShoppingCart className="w-4 h-4" />
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
