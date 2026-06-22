import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, ImageOff, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const calcDiscount = (product) => {
  if (product.discount && product.discount > 0) return product.discount;

  if (product.sizes?.length) {
    const discounts = product.sizes
      .filter((s) => s.original_price && s.original_price > s.price)
      .map((s) =>
        Math.round(((s.original_price - s.price) / s.original_price) * 100)
      );
    if (discounts.length) return Math.max(...discounts);
  }

  if (product.original_price && product.original_price > product.price) {
    return Math.round(
      ((product.original_price - product.price) / product.original_price) * 100
    );
  }

  return 0;
};

const getDisplayPrice = (product) => {
  if (product.sizes?.length) {
    const prices = product.sizes.map((s) => s.price).filter(Boolean);
    if (prices.length) return Math.min(...prices);
  }
  return product.price ?? 0;
};

const stripHtml = (html) => html?.replace(/<[^>]*>/g, '') ?? '';

// ─── Discount Ribbon Badge ──────────────────────────────────────────────────────
// Matches your site: khajur-gold color, sharp edges, uppercase tracking-widest

const DiscountBadge = ({ discount }) => (
  <div className="absolute top-0 right-0 z-10 flex items-center">
    {/* Left pointing notch — uses khajur-gold color */}
    <div
      style={{
        width:        0,
        height:       0,
        borderTop:    '16px solid transparent',
        borderBottom: '16px solid transparent',
        borderRight:  '12px solid #C6A962', // khajur-gold hex
      }}
    />
    {/* Ribbon body */}
    <div
      className="
        bg-khajur-gold text-khajur-primary
        pr-3 pl-1 h-8
        flex items-center
        text-[10px] font-extrabold tracking-[0.12em] uppercase
        select-none whitespace-nowrap
      "
    >
      {discount}% OFF
    </div>
  </div>
);

// ─── Out of Stock Badge ─────────────────────────────────────────────────────────

const OutOfStockBadge = () => (
  <div
    className="
      absolute top-3 left-0 z-10
      bg-khajur-primary text-khajur-cream
      px-3 py-1
      text-[10px] font-bold tracking-widest uppercase
    "
  >
    Sold Out
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const ProductCard = ({ product }) => {
  const { addToCart }           = useCart();
  const [adding, setAdding]     = useState(false);
  const [imgError, setImgError] = useState(false);

  const discount     = calcDiscount(product);
  const hasDiscount  = discount > 0;
  const displayPrice = getDisplayPrice(product);
  const isOutOfStock = product.stock === 0;
  const productUrl   = `/product/${product.id}?category=${product.category ?? ''}`;

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

  return (
    <div
      className={`
        group relative bg-white border transition-all duration-500 overflow-hidden
        ${isOutOfStock
          ? 'border-khajur-border opacity-70'
          : 'border-khajur-border hover:border-khajur-gold hover:shadow-xl'
        }
      `}
      data-testid={`product-card-${product.id}`}
    >

      {/* ── Badges ─────────────────────────────────────────────────────────── */}
      {hasDiscount && !isOutOfStock && <DiscountBadge discount={discount} />}
      {isOutOfStock && <OutOfStockBadge />}

      {/* ── Product Image ───────────────────────────────────────────────────── */}
      <Link to={productUrl} aria-label={`View ${product.name}`}>
        <div className="aspect-square overflow-hidden bg-khajur-cream">
          {imgError ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-khajur-dark/20">
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
                ${!isOutOfStock ? 'group-hover:scale-105' : ''}
              `}
            />
          )}
        </div>
      </Link>

      {/* ── Product Info ─────────────────────────────────────────────────────── */}
      <div className="p-5 flex flex-col gap-2">

        {/* Category */}
        {product.category && (
          <p className="text-[10px] uppercase tracking-widest text-khajur-gold font-semibold">
            {product.category}
          </p>
        )}

        {/* Name */}
        <Link to={productUrl}>
          <h3
            className="
              font-serif text-lg font-medium text-khajur-primary leading-snug
              group-hover:text-khajur-gold transition-colors line-clamp-1
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

        {/* ── Price + Cart ──────────────────────────────────────────────────── */}
        <div className="flex items-end justify-between mt-3 gap-2">

          {/* Price Block */}
          <div className="flex flex-col gap-0.5">

            {hasDiscount && (
              <p className="text-[10px] text-khajur-dark/40 font-medium tracking-wide">
                On Sale from
              </p>
            )}

            <div className="flex items-baseline gap-2">
              <span
                className="font-serif text-xl font-bold text-khajur-gold"
                data-testid={`product-price-${product.id}`}
              >
                ₹{displayPrice}
              </span>

              {hasDiscount &&
                (product.original_price || product.sizes?.[0]?.original_price) && (
                  <span className="text-xs text-khajur-dark/35 line-through">
                    ₹{product.original_price ?? product.sizes[0].original_price}
                  </span>
                )}
            </div>
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
              flex-shrink-0 flex items-center justify-center
              w-11 h-11 transition-all duration-300
              ${isOutOfStock
                ? 'bg-khajur-border text-khajur-dark/30 cursor-not-allowed'
                : adding
                ? 'bg-khajur-primary text-khajur-cream cursor-wait scale-95'
                : 'bg-khajur-primary text-khajur-cream hover:bg-khajur-gold hover:text-khajur-primary hover:scale-105'
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
