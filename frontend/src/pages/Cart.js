import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';

// ─── Sub-components ───────────────────────────────────────────────────────────

const LoadingState = () => (
  <div className="min-h-screen flex items-center justify-center">
    <p className="text-khajur-dark/60 animate-pulse">Loading cart...</p>
  </div>
);

const EmptyCartState = () => (
  <div
    className="min-h-screen flex flex-col items-center justify-center py-20 gap-4"
    data-testid="empty-cart"
  >
    <ShoppingBag className="w-24 h-24 text-khajur-muted" />

    <h2 className="font-serif text-3xl font-medium text-khajur-primary">
      Your cart is empty
    </h2>

    <p className="text-khajur-dark/60">
      Add some products to get started
    </p>

    <Link
      to="/products"
      className="mt-4 inline-flex items-center gap-2 bg-khajur-primary text-khajur-cream
                 px-8 py-3 rounded-sm uppercase tracking-widest text-xs font-bold
                 border border-transparent hover:bg-khajur-primary/90
                 hover:border-khajur-gold transition-all"
      data-testid="continue-shopping-empty"
    >
      Continue Shopping
      <ArrowRight className="w-4 h-4" />
    </Link>
  </div>
);

// ─── Cart Item ─────────────────────────────────────────────────────────────────

const QuantityControl = ({ productId, quantity, onIncrease, onDecrease }) => (
  <div className="flex items-center gap-3">
    <button
      onClick={onDecrease}
      aria-label="Decrease quantity"
      className="w-8 h-8 flex items-center justify-center rounded-sm
                 bg-khajur-cream text-khajur-primary hover:bg-khajur-accent
                 transition-colors"
      data-testid={`decrease-cart-quantity-${productId}`}
    >
      <Minus className="w-4 h-4" />
    </button>

    <span
      className="w-8 text-center text-lg font-medium"
      data-testid={`cart-item-quantity-${productId}`}
    >
      {quantity}
    </span>

    <button
      onClick={onIncrease}
      aria-label="Increase quantity"
      className="w-8 h-8 flex items-center justify-center rounded-sm
                 bg-khajur-cream text-khajur-primary hover:bg-khajur-accent
                 transition-colors"
      data-testid={`increase-cart-quantity-${productId}`}
    >
      <Plus className="w-4 h-4" />
    </button>
  </div>
);

const CartItem = ({ item, onQuantityChange, onRemove }) => {
  const { product, product_id, quantity, size } = item;

  if (!product || product.price === undefined) return null;

  return (
    <article
      className="bg-white border border-khajur-border p-6
                 flex flex-col sm:flex-row gap-6 transition-shadow hover:shadow-sm"
      data-testid={`cart-item-${product_id}`}
    >
      {/* Product Image */}
      <img
        src={product.image}
        alt={product.name}
        className="w-full sm:w-32 h-32 object-cover rounded-sm"
      />

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <Link to={`/products/${product.id}?category=${product.category}`}>
          <h3
            className="font-serif text-xl font-medium text-khajur-primary
                       hover:text-khajur-gold transition-colors mb-1 truncate"
          >
            {product.name}
          </h3>
        </Link>

        {size && (
          <p className="text-sm text-khajur-muted mb-2">Size: {size}</p>
        )}

        <p
          className="font-serif text-xl text-khajur-gold font-bold"
          data-testid={`cart-item-price-${product_id}`}
        >
          ₹{product.price.toFixed(2)}
        </p>
      </div>

      {/* Controls */}
      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-4">
        <QuantityControl
          productId={product_id}
          quantity={quantity}
          onIncrease={() => onQuantityChange(product_id, quantity + 1)}
          onDecrease={() => onQuantityChange(product_id, quantity - 1)}
        />

        <button
          onClick={() => onRemove(product_id)}
          aria-label={`Remove ${product.name} from cart`}
          className="text-red-400 hover:text-red-600 transition-colors"
          data-testid={`remove-cart-item-${product_id}`}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </article>
  );
};

// ─── Order Summary ─────────────────────────────────────────────────────────────

const OrderSummary = ({ cartTotal, onCheckout }) => {
  const summaryRows = [
    {
      label: 'Subtotal',
      value: `₹${(cartTotal || 0).toFixed(2)}`,
      testId: 'cart-subtotal',
    },
    {
      label: 'Delivery Charges',
      value: 'FREE',
      valueClassName: 'text-green-600',
    },
  ];

  return (
    <aside
      className="bg-white border border-khajur-border p-8 sticky top-24 rounded-sm"
      data-testid="order-summary"
    >
      <h2 className="font-serif text-2xl font-medium text-khajur-primary mb-6">
        Order Summary
      </h2>

      {/* Line Items */}
      <ul className="space-y-4 mb-6">
        {summaryRows.map(({ label, value, valueClassName, testId }) => (
          <li key={label} className="flex justify-between text-sm">
            <span className="text-khajur-dark/70">{label}</span>
            <span
              className={`font-medium ${valueClassName ?? ''}`}
              data-testid={testId}
            >
              {value}
            </span>
          </li>
        ))}

        {/* Total */}
        <li className="border-t border-khajur-border pt-4 flex justify-between items-baseline">
          <span className="font-serif font-medium text-khajur-primary text-lg">
            Total
          </span>
          <span
            className="font-serif text-2xl font-bold text-khajur-gold"
            data-testid="cart-total"
          >
            ₹{(cartTotal || 0).toFixed(2)}
          </span>
        </li>
      </ul>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={onCheckout}
          className="w-full flex items-center justify-center gap-2
                     bg-khajur-gold text-khajur-primary rounded-sm
                     px-8 py-4 uppercase tracking-widest text-xs font-bold
                     hover:bg-khajur-gold/90 hover:shadow-[0_0_15px_rgba(198,169,98,0.4)]
                     transition-all"
          data-testid="proceed-to-checkout"
        >
          Proceed to Checkout
          <ArrowRight className="w-4 h-4" />
        </button>

        <Link
          to="/products"
          className="block text-center text-sm text-khajur-primary
                     hover:text-khajur-gold transition-colors"
          data-testid="continue-shopping"
        >
          Continue Shopping
        </Link>
      </div>
    </aside>
  );
};

// ─── Page ──────────────────────────────────────────────────────────────────────

const Cart = () => {
  const { cart, updateCartItem, removeFromCart, cartTotal, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    updateCartItem(productId, newQuantity);
  };

  const handleCheckout = () => {
    if (!user) {
      alert('Please login to checkout');
      return;
    }
    navigate('/checkout');
  };

  if (loading) return <LoadingState />;
  if (!cart.items?.length) return <EmptyCartState />;

  return (
    <main className="min-h-screen py-20" data-testid="cart-page">
      <div className="max-w-7xl mx-auto px-6 md:px-12">

        {/* Page Header */}
        <header className="mb-12">
          <h1 className="font-serif text-4xl md:text-5xl font-medium text-khajur-primary">
            Shopping Cart
          </h1>
          <p className="mt-2 text-khajur-dark/50 text-sm">
            {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}
          </p>
        </header>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Cart Items */}
          <section className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <CartItem
                key={item.product_id}
                item={item}
                onQuantityChange={handleQuantityChange}
                onRemove={removeFromCart}
              />
            ))}
          </section>

          {/* Order Summary */}
          <section className="lg:col-span-1">
            <OrderSummary
              cartTotal={cartTotal}
              onCheckout={handleCheckout}
            />
          </section>

        </div>
      </div>
    </main>
  );
};

export default Cart;
