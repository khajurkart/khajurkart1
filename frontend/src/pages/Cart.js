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
    Package,
} from 'lucide-react';
import { toast } from 'sonner';
import Breadcrumb from '../components/Breadcrumb';

// -----------------------------------------
// Helpers
// -----------------------------------------

const getProductId = (item) =>
    item.product_id ??
    item.product?.id ??
    item.product?._id ??
    item.id;

const getProductDetails = (item) => {
    const product = item.product || {};

    return {
        ...product,
        id:
            product.id ??
            product._id ??
            item.product_id ??
            item.id,
        name: product.name ?? item.name ?? 'Product',
        image:
            product.image ??
            product.image_url ??
            item.image ??
            item.image_url ??
            '',
        category: product.category ?? item.category ?? '',
        price: Number(product.price ?? item.price ?? 0),
    };
};

const formatPrice = (amount) =>
    `₹${Number(amount || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

// -----------------------------------------
// Loading screen
// -----------------------------------------

const LoadingScreen = () => (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3 text-khajur-dark/50">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-sm">Loading your cart…</p>
    </div>
);

// -----------------------------------------
// Empty cart
// -----------------------------------------

const EmptyCart = () => (
    <div className="min-h-screen bg-white" data-testid="empty-cart">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-24">
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
                    className="flex items-center gap-2 bg-khajur-gold hover:bg-khajur-gold/90 text-khajur-primary px-8 py-3 rounded-sm uppercase tracking-widest text-xs font-bold transition-all duration-300"
                >
                    <ShoppingBag className="w-4 h-4" />
                    Browse Products
                </Link>
            </div>
        </div>
    </div>
);

// -----------------------------------------
// Quantity control
// -----------------------------------------

const QuantityControl = ({
    productId,
    quantity,
    onIncrease,
    onDecrease,
}) => (
    <div className="flex items-center gap-3">
        <button
            type="button"
            onClick={onDecrease}
            data-testid={`decrease-cart-quantity-${productId}`}
            className="w-8 h-8 flex items-center justify-center bg-khajur-cream hover:bg-khajur-gold/20 text-khajur-primary rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
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
            type="button"
            onClick={onIncrease}
            data-testid={`increase-cart-quantity-${productId}`}
            className="w-8 h-8 flex items-center justify-center bg-khajur-cream hover:bg-khajur-gold/20 text-khajur-primary rounded-sm transition-colors"
            aria-label="Increase quantity"
        >
            <Plus className="w-3.5 h-3.5" />
        </button>
    </div>
);

// -----------------------------------------
// Cart item
// -----------------------------------------

const CartItem = ({ item, onQuantityChange, onRemove }) => {
    const product = getProductDetails(item);
    const productId = getProductId(item);
    const quantity = Number(item.quantity || 1);
    const itemTotal = product.price * quantity;

    const productUrl = product.id
        ? `/product/${product.id}`
        : '/products';

    return (
        <div
            className="bg-white border border-khajur-border hover:border-khajur-gold/40 hover:shadow-[0_4px_20px_rgba(198,169,98,0.08)] rounded-sm transition-all duration-300 flex flex-col sm:flex-row"
            data-testid={`cart-item-${productId}`}
        >
            {/* Product image */}
            <Link
                to={productUrl}
                className="block flex-shrink-0 sm:w-36"
            >
                {product.image ? (
                    <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-44 sm:h-full sm:min-h-40 object-cover rounded-sm"
                    />
                ) : (
                    <div className="w-full h-44 sm:h-full sm:min-h-40 bg-khajur-cream flex items-center justify-center">
                        <Package className="w-10 h-10 text-khajur-dark/30" />
                    </div>
                )}
            </Link>

            {/* Product information */}
            <div className="flex-1 flex flex-col justify-between p-5 md:p-6 gap-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <Link to={productUrl}>
                            <h3 className="font-serif text-lg font-medium text-khajur-primary hover:text-khajur-gold transition-colors">
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
                            data-testid={`cart-item-price-${productId}`}
                        >
                            {formatPrice(product.price)}
                            <span className="text-xs text-khajur-dark/40 font-normal ml-1">
                                / unit
                            </span>
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            onRemove(productId, item.size ?? null)
                        }
                        data-testid={`remove-cart-item-${productId}`}
                        className="text-red-300 hover:text-red-500 transition-colors flex-shrink-0"
                        aria-label={`Remove ${product.name}`}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <QuantityControl
                        productId={productId}
                        quantity={quantity}
                        onIncrease={() =>
                            onQuantityChange(
                                productId,
                                quantity + 1,
                                item.size ?? null
                            )
                        }
                        onDecrease={() =>
                            onQuantityChange(
                                productId,
                                quantity - 1,
                                item.size ?? null
                            )
                        }
                    />

                    <p className="text-sm font-bold text-khajur-primary">
                        {formatPrice(itemTotal)}
                    </p>
                </div>
            </div>
        </div>
    );
};

// -----------------------------------------
// Order summary
// -----------------------------------------

const OrderSummaryPanel = ({
    cart,
    cartTotal,
    onCheckout,
}) => (
    <div
        className="bg-white border border-khajur-border rounded-sm sticky top-28"
        data-testid="order-summary"
    >
        <div className="flex items-center gap-3 px-7 py-5 border-b border-khajur-border">
            <ShoppingBag className="w-4 h-4 text-khajur-gold" />
            <h2 className="font-serif text-lg font-medium text-khajur-primary">
                Order Summary
            </h2>
        </div>

        <div className="px-7 py-5 space-y-3 border-b border-khajur-border">
            {cart.items.map((item, index) => {
                const product = getProductDetails(item);
                const productId = getProductId(item);

                return (
                    <div
                        key={`${productId}-${item.size ?? ''}-${index}`}
                        className="flex justify-between gap-3 text-sm"
                    >
                        <span className="text-khajur-dark/70 flex-1">
                            {product.name}
                            {item.size ? ` (${item.size})` : ''}
                            {' '}× {item.quantity}
                        </span>

                        <span className="font-medium text-khajur-primary whitespace-nowrap">
                            {formatPrice(
                                product.price * Number(item.quantity || 0)
                            )}
                        </span>
                    </div>
                );
            })}
        </div>

        <div className="px-7 py-5 space-y-3 border-b border-khajur-border">
            <div className="flex justify-between text-sm">
                <span className="text-khajur-dark/60">Subtotal</span>
                <span
                    className="font-medium text-khajur-primary"
                    data-testid="cart-subtotal"
                >
                    {formatPrice(cartTotal)}
                </span>
            </div>

            <div className="flex justify-between text-sm">
                <span className="text-khajur-dark/60">Delivery</span>

                {cartTotal >= 1999 ? (
                    <span className="font-semibold text-green-600 flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5" />
                        Free
                    </span>
                ) : (
                    <span className="font-semibold text-amber-700">
                        Confirmed after order
                    </span>
                )}
            </div>

            {cartTotal < 1999 && (
                <p className="text-xs text-amber-700">
                    Actual delivery fee will be confirmed before dispatch.
                </p>
            )}
        </div>

        <div className="px-7 py-5 border-b border-khajur-border">
            <div className="flex justify-between items-center">
                <span className="font-serif text-base font-medium text-khajur-primary">
                    Total
                </span>

                <span
                    className="font-serif text-2xl font-bold text-khajur-gold"
                    data-testid="cart-total"
                >
                    {formatPrice(cartTotal)}
                </span>
            </div>
        </div>

        <div className="px-7 py-6 space-y-4">
            <button
                type="button"
                onClick={onCheckout}
                data-testid="proceed-to-checkout"
                className="w-full flex items-center justify-center gap-2 bg-khajur-gold hover:bg-khajur-gold/90 text-khajur-primary rounded-sm px-8 py-4 uppercase tracking-widest text-xs font-bold transition-all duration-300"
            >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
            </button>

            <Link
                to="/products"
                data-testid="continue-shopping"
                className="block text-center text-xs uppercase tracking-widest font-medium text-khajur-dark/40 hover:text-khajur-gold transition-colors"
            >
                Continue Shopping
            </Link>
        </div>
    </div>
);

// -----------------------------------------
// Main Cart page
// -----------------------------------------

const Cart = () => {
    const {
        cart,
        updateCartItem,
        removeFromCart,
        cartTotal,
        loading,
    } = useCart();

    const { user, token } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'Your Cart — KhajurKart';

        return () => {
            document.title =
                'KhajurKart — Premium Dates, Dry Fruits & Spices';
        };
    }, []);

    const handleQuantityChange = async (
        productId,
        newQuantity,
        size = null
    ) => {
        if (newQuantity < 1) return;

        await updateCartItem(productId, newQuantity, size);
    };

    // Guests remain on the cart page and see only this message.
    const handleCheckout = (event) => {
        event?.preventDefault();

        if (!user || !token) {
            toast.error('Please sign in to order.');
            return;
        }

        navigate('/checkout');
    };

    if (loading) {
        return <LoadingScreen />;
    }

    const items = Array.isArray(cart?.items) ? cart.items : [];

    if (items.length === 0) {
        return <EmptyCart />;
    }

    // Calculate the displayed subtotal from the same details used
    // to render the cart items.
    const displayedTotal = items.reduce((total, item) => {
        const product = getProductDetails(item);

        return total +
            product.price * Number(item.quantity || 0);
    }, 0);

    const safeCartTotal = Number.isFinite(displayedTotal)
        ? displayedTotal
        : Number(cartTotal || 0);

    return (
        <div
            className="min-h-screen bg-white py-16 md:py-24"
            data-testid="cart-page"
        >
            <div className="max-w-6xl mx-auto px-6 md:px-12">
                <div className="mb-10">
                    <Breadcrumb
                        items={[
                            { label: 'Home', to: '/' },
                            { label: 'Products', to: '/products' },
                            { label: 'Cart', to: '#' },
                        ]}
                    />
                </div>

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
                                {items.reduce(
                                    (sum, item) =>
                                        sum + Number(item.quantity || 0),
                                    0
                                )}
                            </span>{' '}
                            item{items.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Cart items */}
                    <div className="lg:col-span-2 space-y-5">
                        {items.map((item, index) => {
                            const productId = getProductId(item);

                            return (
                                <CartItem
                                    key={`${productId}-${item.size ?? ''}-${index}`}
                                    item={item}
                                    onQuantityChange={handleQuantityChange}
                                    onRemove={removeFromCart}
                                />
                            );
                        })}
                    </div>

                    {/* Order summary */}
                    <div className="lg:col-span-1">
                        <OrderSummaryPanel
                            cart={{ items }}
                            cartTotal={safeCartTotal}
                            onCheckout={handleCheckout}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
