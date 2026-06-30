import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { useRazorpay } from 'react-razorpay';
import {
    ChevronLeft,
    MapPin,
    CreditCard,
    Truck,
    ShoppingBag,
    Loader2,
    Check,
    Plus,
    Banknote,
    Smartphone,
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ─── Constants ─────────────────────────────────────────────────────────────────

const INITIAL_FORM = {
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'cod',
};

const SHIPPING_FIELDS = [
    [
        { name: 'fullName', label: 'Full Name', type: 'text', placeholder: 'John Doe', testId: 'checkout-fullname', half: true },
        { name: 'email', label: 'Email Address', type: 'email', placeholder: 'john@example.com', testId: 'checkout-email', half: true },
    ],
    [
        { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+91 98765 43210', testId: 'checkout-phone', half: false },
    ],
    [
        { name: 'address', label: 'Street Address', type: 'text', placeholder: '123, MG Road…', testId: 'checkout-address', half: false },
    ],
    [
        { name: 'city', label: 'City', type: 'text', placeholder: 'Hyderabad', testId: 'checkout-city', half: true },
        { name: 'state', label: 'State', type: 'text', placeholder: 'Telangana', testId: 'checkout-state', half: true },
        { name: 'pincode', label: 'Pincode', type: 'text', placeholder: '500001', testId: 'checkout-pincode', half: true },
    ],
];

const PAYMENT_METHODS = [
    {
        value: 'cod',
        label: 'Cash on Delivery',
        description: 'Pay when your order arrives.',
        icon: Banknote,
        testId: 'payment-cod',
    },
    {
        value: 'razorpay',
        label: 'Pay Online',
        description: 'UPI, Cards, Net Banking via Razorpay.',
        icon: Smartphone,
        testId: 'payment-razorpay',
    },
];

// ─── Sub-Components ────────────────────────────────────────────────────────────

// ── Not Logged In ──────────────────────────────────────────────────────────────

const NotLoggedIn = () => (
    <div className="min-h-screen bg-khajur-cream flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="w-16 h-16 flex items-center justify-center bg-khajur-cream rounded-full">
            <ShoppingBag className="w-7 h-7 text-khajur-dark/30" />
        </div>
        <div>
            <p className="font-serif text-2xl font-medium text-khajur-primary mb-2">
                Please sign in to checkout
            </p>
            <p className="text-sm text-khajur-dark/50">
                You need an account to place an order.
            </p>
        </div>
        <Link
            to="/"
            className="
        bg-khajur-gold hover:bg-khajur-gold/90
        text-khajur-primary px-8 py-3 rounded-sm
        uppercase tracking-widest text-xs font-bold transition-all duration-300
      "
        >
            Go to Home
        </Link>
    </div>
);

// ── Field Label ────────────────────────────────────────────────────────────────

const FieldLabel = ({ label }) => (
    <label className="block text-xs uppercase tracking-widest font-medium text-khajur-dark/50 mb-2">
        {label} <span className="text-khajur-gold">*</span>
    </label>
);

const inputBase = `
  w-full bg-transparent border-b border-khajur-primary/20
  focus:border-khajur-gold px-0 py-3
  text-sm text-khajur-primary placeholder:text-khajur-dark/20
  focus:outline-none transition-colors duration-200
`;

// ── Saved Address Card ─────────────────────────────────────────────────────────

const SavedAddressCard = ({ addr, index, selected, onSelect }) => (
    <div
        onClick={() => onSelect(index, addr)}
        className={`
      relative p-5 border rounded-sm cursor-pointer transition-all duration-200
      ${selected
                ? 'border-khajur-gold bg-khajur-gold/5 shadow-[0_0_12px_rgba(198,169,98,0.2)]'
                : 'border-khajur-border hover:border-khajur-gold/40'
            }
    `}
    >
        {selected && (
            <div className="absolute top-3 right-3 w-5 h-5 bg-khajur-gold rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-khajur-primary" />
            </div>
        )}
        <p className="text-sm font-semibold text-khajur-primary mb-1">{addr.name}</p>
        <p className="text-xs text-khajur-dark/50">{addr.phone}</p>
        <p className="text-xs text-khajur-dark/70 mt-1 leading-relaxed">
            {addr.address}{addr.city ? `, ${addr.city}` : ''}
            {addr.state ? `, ${addr.state}` : ''}
            {addr.pincode ? ` — ${addr.pincode}` : ''}
        </p>
    </div>
);

// ── Order Summary ──────────────────────────────────────────────────────────────

const OrderSummary = ({ cart, cartTotal, finalTotal, loading }) => (
    <div
        className="bg-white border border-khajur-border rounded-sm sticky top-28"
        data-testid="checkout-summary"
    >
        {/* Header */}
        <div className="flex items-center gap-3 px-7 py-5 border-b border-khajur-border">
            <ShoppingBag className="w-4 h-4 text-khajur-gold" />
            <h2 className="font-serif text-lg font-medium text-khajur-primary">Order Summary</h2>
        </div>

        {/* Items */}
        <div className="px-7 py-5 space-y-3 border-b border-khajur-border">
            {cart.items.map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-khajur-dark/80 truncate">{item.product?.name}</p>
                        <p className="text-xs text-khajur-dark/40 mt-0.5">
                            {item.size ? `${item.size} · ` : ''}Qty: {item.quantity}
                        </p>
                    </div>
                    <p className="text-sm font-medium text-khajur-primary whitespace-nowrap">
                        ₹{(item.product?.price * item.quantity).toFixed(2)}
                    </p>
                </div>
            ))}
        </div>

        {/* Totals */}
        <div className="px-7 py-5 space-y-3 border-b border-khajur-border">
            <div className="flex justify-between text-sm">
                <span className="text-khajur-dark/60">Subtotal</span>
                <span className="text-khajur-primary font-medium">₹{cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-khajur-dark/60">Delivery</span>
                <span className="text-green-600 font-semibold flex items-center gap-1">
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
                    data-testid="checkout-total"
                >
                    ₹{finalTotal.toFixed(2)}
                </span>
            </div>
        </div>

        {/* CTA */}
        <div className="px-7 py-5">
            <button
                type="submit"
                disabled={loading}
                data-testid="place-order-button"
                className="
          w-full flex items-center justify-center gap-2
          bg-khajur-gold hover:bg-khajur-gold/90
          hover:shadow-[0_0_20px_rgba(198,169,98,0.4)]
          disabled:opacity-60 disabled:cursor-not-allowed
          text-khajur-primary rounded-sm px-8 py-4
          uppercase tracking-widest text-xs font-bold
          transition-all duration-300
        "
            >
                {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                    : <><CreditCard className="w-4 h-4" /> Place Order</>
                }
            </button>
            <p className="text-center text-xs text-khajur-dark/30 mt-4">
                By placing your order, you agree to our terms & conditions.
            </p>
        </div>
    </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const Checkout = () => {
    useEffect(() => {
        document.title = 'Checkout — KhajurKart';
        return () => {
            document.title = 'KhajurKart — Premium Dates, Dry Fruits & Spices';
        };
    }, []);
    const { cart, cartTotal, clearCart } = useCart();
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const { Razorpay } = useRazorpay();

    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [formData, setFormData] = useState({
        ...INITIAL_FORM,
        fullName: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });
    const [loading, setLoading] = useState(false);

    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // ── Fetch Saved Addresses ──────────────────────────────────────────────────

    const fetchAddresses = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API}/user/address`, authHeaders);
            setAddresses(data);
        } catch {
            // silent — saved addresses are optional
        }
    }, [token]);

    useEffect(() => {
        if (token) fetchAddresses();
    }, [token, fetchAddresses]);

    // ── Handlers ───────────────────────────────────────────────────────────────

    const set = (name) => (e) =>
        setFormData((prev) => ({ ...prev, [name]: e.target.value }));

    const handleSelectAddress = (index, addr) => {
        setSelectedAddress(index);
        setFormData((prev) => ({
            ...prev,
            fullName: addr.name || '',
            phone: addr.phone || '',
            address: addr.address || '',
            city: addr.city || '',
            state: addr.state || '',
            pincode: addr.pincode || '',
        }));
    };

    const buildOrderPayload = () => ({
        items: cart.items.map((item) => ({
            product_id: item.product.id,
            product_name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
            size: item.size || item.product.sizes?.[0]?.weight,
        })),
        total_amount: finalTotal,
        delivery_charge: 0,
        shipping_address: {
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
        },
    });

    // ── COD ────────────────────────────────────────────────────────────────────

    const handleCODOrder = async () => {
        setLoading(true);
        try {
            await axios.post(
                `${API}/orders`,
                { ...buildOrderPayload(), payment_method: 'cod' },
                authHeaders
            );
            toast.success('Order placed successfully!');
            await clearCart();
            navigate('/thank-you');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to place order.');
        } finally {
            setLoading(false);
        }
    };

    // ── Razorpay ───────────────────────────────────────────────────────────────

    const handleRazorpayPayment = async () => {
        setLoading(true);
        try {
            const orderRes = await axios.post(
                `${API}/orders`,
                { ...buildOrderPayload(), payment_method: 'razorpay' },
                authHeaders
            );
            const orderId = orderRes.data.order_id;

            const rzpOrderRes = await axios.post(
                `${API}/razorpay/create-order`,
                { amount: finalTotal, currency: 'INR' },
                authHeaders
            );
            const rzpOrder = rzpOrderRes.data;

            const options = {
                key: rzpOrder.key_id,
                amount: rzpOrder.amount,
                currency: rzpOrder.currency,
                order_id: rzpOrder.id,
                name: 'KhajurKart',
                description: 'Premium Dry Fruits & Spices',
                image: 'https://customer-assets.emergentagent.com/job_premium-spice-cart/artifacts/p1zf2opj_WhatsApp%20Image%202026-02-23%20at%204.12.54%20PM.jpeg',
                prefill: {
                    name: formData.fullName,
                    email: formData.email,
                    contact: formData.phone,
                },
                theme: { color: '#0F3D2E' },
                handler: async (response) => {
                    try {
                        await axios.post(
                            `${API}/razorpay/verify-payment`,
                            {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                order_id: orderId,
                            },
                            authHeaders
                        );
                        toast.success('Payment successful! Order confirmed.');
                        await clearCart();
                        navigate('/thank-you');
                    } catch {
                        toast.error('Payment verification failed. Please contact support.');
                    }
                },
                modal: {
                    ondismiss: () => {
                        setLoading(false);
                        toast.error('Payment cancelled.');
                    },
                },
            };

            const rzpInstance = new Razorpay(options);
            rzpInstance.open();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to initiate payment.');
            setLoading(false);
        }
    };

    // ── Submit ─────────────────────────────────────────────────────────────────

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!cart.items || cart.items.length === 0) {
            toast.error('Your cart is empty.');
            return;
        }
        formData.paymentMethod === 'razorpay'
            ? await handleRazorpayPayment()
            : await handleCODOrder();
    };

    // ── Guards ─────────────────────────────────────────────────────────────────

    if (!user) return <NotLoggedIn />;

    const finalTotal = cartTotal;

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-white py-16 md:py-24" data-testid="checkout-page">
            <div className="max-w-6xl mx-auto px-6 md:px-12">

                {/* ── Page Header ── */}
                <div className="flex items-center gap-4 border-b border-khajur-gold/20 pb-8 mb-12">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-khajur-primary hover:text-khajur-gold transition-colors"
                        aria-label="Go back"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <p className="text-xs uppercase tracking-widest text-khajur-gold mb-0.5">
                            Secure Checkout
                        </p>
                        <h1 className="font-serif text-4xl md:text-5xl font-medium text-khajur-primary leading-tight">
                            Checkout
                        </h1>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                        {/* ── Left Column ── */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* Saved Addresses */}
                            {addresses.length > 0 && (
                                <div className="bg-white border border-khajur-border rounded-sm">
                                    <div className="flex items-center justify-between px-8 py-5 border-b border-khajur-border">
                                        <div className="flex items-center gap-3">
                                            <MapPin className="w-4 h-4 text-khajur-gold" />
                                            <h2 className="font-serif text-lg font-medium text-khajur-primary">
                                                Saved Addresses
                                            </h2>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => navigate('/addresses')}
                                            className="flex items-center gap-1.5 text-xs text-khajur-gold hover:text-khajur-gold/70 font-medium transition-colors"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            Manage
                                        </button>
                                    </div>
                                    <div className="px-8 py-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {addresses.map((addr, index) => (
                                            <SavedAddressCard
                                                key={index}
                                                addr={addr}
                                                index={index}
                                                selected={selectedAddress === index}
                                                onSelect={handleSelectAddress}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Shipping Information */}
                            <div className="bg-white border border-khajur-border rounded-sm">
                                <div className="flex items-center gap-3 px-8 py-5 border-b border-khajur-border">
                                    <Truck className="w-4 h-4 text-khajur-gold" />
                                    <h2 className="font-serif text-lg font-medium text-khajur-primary">
                                        Shipping Information
                                    </h2>
                                </div>

                                <div className="px-8 py-8 space-y-8">
                                    {/* Row 1: Name + Email */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                        {SHIPPING_FIELDS[0].map((field) => (
                                            <div key={field.name}>
                                                <FieldLabel label={field.label} />
                                                <input
                                                    type={field.type}
                                                    name={field.name}
                                                    required
                                                    placeholder={field.placeholder}
                                                    value={formData[field.name]}
                                                    onChange={set(field.name)}
                                                    className={inputBase}
                                                    data-testid={field.testId}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Row 2: Phone */}
                                    <div>
                                        <FieldLabel label="Phone Number" />
                                        <input
                                            type="tel"
                                            name="phone"
                                            required
                                            placeholder="+91 98765 43210"
                                            value={formData.phone}
                                            onChange={set('phone')}
                                            className={inputBase}
                                            data-testid="checkout-phone"
                                        />
                                    </div>

                                    {/* Row 3: Address */}
                                    <div>
                                        <FieldLabel label="Street Address" />
                                        <input
                                            type="text"
                                            name="address"
                                            required
                                            placeholder="123, MG Road, Near City Mall…"
                                            value={formData.address}
                                            onChange={set('address')}
                                            className={inputBase}
                                            data-testid="checkout-address"
                                        />
                                    </div>

                                    {/* Row 4: City + State + Pincode */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                                        {[
                                            { name: 'city', label: 'City', placeholder: 'Hyderabad', testId: 'checkout-city' },
                                            { name: 'state', label: 'State', placeholder: 'Telangana', testId: 'checkout-state' },
                                            { name: 'pincode', label: 'Pincode', placeholder: '500001', testId: 'checkout-pincode' },
                                        ].map((field) => (
                                            <div key={field.name}>
                                                <FieldLabel label={field.label} />
                                                <input
                                                    type="text"
                                                    name={field.name}
                                                    required
                                                    placeholder={field.placeholder}
                                                    value={formData[field.name]}
                                                    onChange={set(field.name)}
                                                    className={inputBase}
                                                    data-testid={field.testId}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="bg-white border border-khajur-border rounded-sm">
                                <div className="flex items-center gap-3 px-8 py-5 border-b border-khajur-border">
                                    <CreditCard className="w-4 h-4 text-khajur-gold" />
                                    <h2 className="font-serif text-lg font-medium text-khajur-primary">
                                        Payment Method
                                    </h2>
                                </div>
                                <div className="px-8 py-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {PAYMENT_METHODS.map(({ value, label, description, icon: Icon, testId }) => (
                                        <label
                                            key={value}
                                            className={`
                        flex items-start gap-4 p-5 border rounded-sm cursor-pointer
                        transition-all duration-200
                        ${formData.paymentMethod === value
                                                    ? 'border-khajur-gold bg-khajur-gold/5'
                                                    : 'border-khajur-border hover:border-khajur-gold/40'
                                                }
                      `}
                                        >
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value={value}
                                                checked={formData.paymentMethod === value}
                                                onChange={set('paymentMethod')}
                                                className="accent-khajur-gold mt-1 flex-shrink-0"
                                                data-testid={testId}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Icon className="w-4 h-4 text-khajur-gold" />
                                                    <p className="text-sm font-semibold text-khajur-primary">{label}</p>
                                                </div>
                                                <p className="text-xs text-khajur-dark/50">{description}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ── Right Column: Order Summary ── */}
                        <div className="lg:col-span-1">
                            <OrderSummary
                                cart={cart}
                                cartTotal={cartTotal}
                                finalTotal={finalTotal}
                                loading={loading}
                            />
                        </div>

                    </div>
                </form>
            </div>
        </div>
    );
};

export default Checkout;
