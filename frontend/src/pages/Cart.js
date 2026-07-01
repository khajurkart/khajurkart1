import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
    Trash2,
    Plus,
    Minus,
    ShoppingBag,
    Truck,
    ArrowRight,
    Loader2,
    ShoppingCart,
} from 'lucide-react';
import { toast } from 'sonner';
import Breadcrumb from '../components/Breadcrumb';

// ─── Sub-Components ────────────────────────────────────────────────────────────

// ── Loading ────────────────────────────────────────────────────────────────────

const LoadingScreen = () => (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3 text-khajur-dark/50">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-sm">Loading your cart…</p>
    </div>
);

// ── Empty State ────────────────────────────────────────────────────────────────

const EmptyCart = () => (
    <div className="min-h-screen bg-white" data-testid="empty-cart">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-24">
            {/* Breadcrumb for Empty Cart */}
            <div className="mb-10">
                <Breadcrumb
                    items={[
                        { label: 'Home', to: '/' },
                        { label: 'Products', to: '/products' },
                        { label: 'Cart', to: '#' },
                    ]}
                />
            </div>

            <div className="flex flex-col items-center justify-center gap-6 px-6 text-center min-h-[60vh]">
                <div className="w-20 h-20 flex items-center justify-center bg-khajur-cream rounded-full">
                    <ShoppingCart className="w-9 h-9 text-khajur-dark/25" />
                </div>
                <div>
                    <p className="font-serif text-3xl font-medium text-khajur-primary mb-2">
                        Your cart is empty
                    </p>
                    <p className="text-sm text-khajur-dark/50 max-w-xs">
                        Looks like you haven't added anything yet. Explore our premium collection.
                    </p>
                </div>
                <Link
                    to="/products"
                    data-testid="continue-shopping-empty"
                    className="
                        flex items-center gap-2 bg-khajur-gold hover:bg-khajur-gold/90
                        hover:shadow-[0_0_20px_rgba(198,169,98,0.35)]
                        text-khajur-primary px-8 py-3 rounded-sm
                        uppercase tracking-widest text-xs font-bold transition-all duration-300
                    "
                >
                    <ShoppingBag className="w-4 h-4" />
                    Browse Products
                </Link>
            </div>
        </div>
    </div>
);

// ── Quantity Control ───────────────────────────────────────────────────────────

const QuantityControl = ({ productId, quantity, onIncrease, onDecrease }) => (
    <div className="flex items-center gap-3">
        <button
            onClick={onDecrease}
            data-testid={`decrease-cart-quantity-${productId}`}
            className="
                w-8 h-8 flex items-center justify-center
                bg-khajur-cream hover:bg-khajur-gold/20
                text-khajur-primary rounded-sm transition-colors duration-200
            "
            aria-label="Decrease quantity"
        >
            <Minus className="w-3.5 h-3.5" />
        </button>

        <span
            className="w-8 text-center text-sm font-semibold text-khajur-primary"
            data-testid={`cart-item-quantity-${productId}`}
        >
            {quantity}
        </span>

        <button
            onClick={onIncrease}
            data-testid={`increase-cart-quantity-${productId}`}
            className="
                w-8 h-8 flex items-center justify-center
                bg-khajur-cream hover:bg-khajur-gold/20
                text-khajur-primary rounded-sm transition-colors duration-200
            "
            aria-label="Increase quantity"
        >
            <Plus className="w-3.5 h-3.5" />
        </button>
    </div>
);

// ── Cart Item Card ─────────────────────────────────────────────────────────────

const CartItem = ({ item, onQuantityChange, onRemove }) => {
    const product = item.product;
    if (!product || product.price === undefined) return null;

    const itemTotal = (product.price * item.quantity).toFixed(2);

    return (
        <div
            className="
                bg-white border border-khajur-border
                hover:border-khajur-gold/40 hover:shadow-[0_4px_20px_rgba(198,169,98,0.08)]
                rounded-sm transition-all duration-300
                flex flex-col sm:flex-row gap-0
            "
            data-testid={`cart-item-${item.product_id}`}
        >
            {/* Product Image */}
            <Link
                to={`/products/${product.id}?category=${product.category}`}
                className="block flex-shrink-0"
            >
                <img
                    src={product.image}
                    alt={product.name}
                    className="w-full sm:w-36 h-44 sm:h-full object-cover rounded-sm"
                />
            </Link>

            {/* Product Info */}
            <div className="flex-1 flex flex-col justify-between p-6 gap-4">

                {/* Top Row */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <Link to={`/products/${product.id}?category=${product.category}`}>
                            <h3 className="font-serif text-lg font-medium text-khajur-primary hover:text-khajur-gold transition-colors truncate">
                                {product.name}
                            </h3>
                        </Link>
                        {item.size && (
                            <p className="text-xs text-khajur-dark/50 mt-1 uppercase tracking-wide">
                                Weight: {item.size}
                            </p>
                        )}
                        <p
                            className="text-base font-semibold text-khajur-gold mt-2"
                            data-testid={`cart-item-price-${item.product_id}`}
                        >
                            ₹{(product.price || 0).toFixed(2)}
                            <span className="text-xs text-khajur-dark/40 font-normal ml-1">/ unit</span>
                        </p>
                    </div>

                    {/* Remove Button */}
                    <button
                        onClick={() => onRemove(item.product_id)}
                        data-testid={`remove-cart-item-${item.product_id}`}
                        className="text-red-300 hover:text-red-500 transition-colors flex-shrink-0"
                        aria-label="Remove item"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                {/* Bottom Row */}
                <div className="flex items-center justify-between gap-4">
                    <QuantityControl
                        productId={item.product_id}
                        quantity={item.quantity}
                        onIncrease={() => onQuantityChange(item.product_id, item.quantity + 1)}
                        onDecrease={() => onQuantityChange(item.product_id, item.quantity - 1)}
                    />
                    <p className="text-sm font-bold text-khajur-primary">
                        ₹{itemTotal}
                    </p>
                </div>
            </div>
        </div>
    );
};

// ── Order Summary Panel ────────────────────────────────────────────────────────

const OrderSummaryPanel = ({ cart, cartTotal, onCheckout }) => (
    <div
        className="bg-white border border-khajur-border rounded-sm sticky top-28"
        data-testid="order-summary"
    >
        {/* Header */}
        <div className="flex items-center gap-3 px-7 py-5 border-b border-khajur-border">
            <ShoppingBag className="w-4 h-4 text-khajur-gold" />
            <h2 className="font-serif text-lg font-medium text-khajur-primary">Order Summary</h2>
        </div>

        {/* Item Breakdown */}
        <div className="px-7 py-5 space-y-3 border-b border-khajur-border">
            {cart.items.map((item, i) => {
                const product = item.product;
                if (!product) return null;
                return (
                    <div key={i} className="flex justify-between gap-3 text-sm">
                        <span className="text-khajur-dark/70 flex-1 truncate">
                            {product.name}
                            {item.size ? ` (${item.size})` : ''}
                            {' '}× {item.quantity}
                        </span>
                        <span className="font-medium text-khajur-primary whitespace-nowrap">
                            ₹{(product.price * item.quantity).toFixed(2)}
                        </span>
                    </div>
                );
            })}
        </div>

        {/* Totals */}
        <div className="px-7 py-5 space-y-3 border-b border-khajur-border">
            <div className="flex justify-between text-sm">
                <span className="text-khajur-dark/60">Subtotal</span>
                <span
                    className="font-medium text-khajur-primary"
                    data-testid="cart-subtotal"
                >
                    ₹{(cartTotal || 0).toFixed(2)}
                </span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-khajur-dark/60">Delivery</span>
                <span className="font-semibold text-green-600 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" /> Free
                </span>
            </div>
        </div>

        {/* Grand Total */}
        <div className="px-7 py-5 border-b border-khajur-border">
            <div className="flex justify-between items-center">
                <span className="font-serif text-base font-medium text-khajur-primary">Total</span>
                <span
                    className="font-serif text-2xl font-bold text-khajur-gold"
                    data-testid="cart-total"
                >
                    ₹{(cartTotal || 0).toFixed(2)}
                </span>
            </div>
        </div>

        {/* Actions */}
        <div className="px-7 py-6 space-y-4">
            <button
                onClick={onCheckout}
                data-testid="proceed-to-checkout"
                className="
                    w-full flex items-center justify-center gap-2
                    bg-khajur-gold hover:bg-khajur-gold/90
                    hover:shadow-[0_0_20px_rgba(198,169,98,0.4)]
                    text-khajur-primary rounded-sm px-8 py-4
                    uppercase tracking-widest text-xs font-bold
                    transition-all duration-300
                "
            >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
            </button>

            <Link
                to="/products"
                data-testid="continue-shopping"
                className="
                    block text-center text-xs uppercase tracking-widest font-medium
                    text-khajur-dark/40 hover:text-khajur-gold transition-colors
                "
            >
                Continue Shopping
            </Link>
        </div>
    </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const Cart = () => {
    const { cart, updateCartItem, removeFromCart, cartTotal, loading } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'Your Cart — KhajurKart';
        return () => {
            document.title = 'KhajurKart — Premium Dates, Dry Fruits & Spices';
        };
    }, []);

    // ── Handlers ─────────────────────────────────────────────────────────────

    const handleQuantityChange = (productId, newQuantity) => {
        if (newQuantity > 0) {
            updateCartItem(productId, newQuantity);
        }
    };

    const handleCheckout = () => {
        if (!user) {
            toast.error('Please sign in to proceed to checkout.');
            return;
        }
        navigate('/checkout');
    };

    // ── Guards ────────────────────────────────────────────────────────────────

    if (loading) return <LoadingScreen />;
    if (!cart.items || cart.items.length === 0) return <EmptyCart />;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-white py-16 md:py-24" data-testid="cart-page">
            <div className="max-w-6xl mx-auto px-6 md:px-12">

                {/* ── Breadcrumb ── */}
                <div className="mb-10">
                    <Breadcrumb
                        items={[
                            { label: 'Home', to: '/' },
                            { label: 'Products', to: '/products' },
                            { label: 'Cart', to: '#' },
                        ]}
                    />
                </div>

                {/* ── Page Header ── */}
                <div className="border-b border-khajur-gold/20 pb-8 mb-12">
                    <p className="text-xs uppercase tracking-widest text-khajur-gold mb-1">
                        Review
                    </p>
                    <div className="flex items-end justify-between gap-4">
                        <h1 className="font-serif text-4xl md:text-5xl font-medium text-khajur-primary leading-tight">
                            Shopping Cart
                        </h1>
                        <p className="text-sm text-khajur-dark/50 mb-1">
                            <span className="font-semibold text-khajur-primary">
                                {cart.items.reduce((sum, i) => sum + i.quantity, 0)}
                            </span>{' '}
                            item{cart.items.length > 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                    {/* ── Cart Items ── */}
                    <div className="lg:col-span-2 space-y-5">
                        {cart.items.map((item) => (
                            <CartItem
                                key={item.product_id}
                                item={item}
                                onQuantityChange={handleQuantityChange}
                                onRemove={removeFromCart}
                            />
                        ))}
                    </div>

                    {/* ── Order Summary ── */}
                    <div className="lg:col-span-1">
                        <OrderSummaryPanel
                            cart={cart}
                            cartTotal={cartTotal}
                            onCheckout={handleCheckout}
                        />
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Cart;
