import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { ChevronDown } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ═══════════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════════

const BUSINESS_TYPES = [
    { value: 'corporate', label: 'Corporate Office', icon: '🏢' },
    { value: 'hotel-restaurant', label: 'Hotel / Restaurant', icon: '🏨' },
    { value: 'event-planner', label: 'Event Planner', icon: '🎉' },
    { value: 'mosque-madrasa', label: 'Mosque / Madrasa', icon: '🕌' },
    { value: 'gym-fitness', label: 'Gym / Fitness Center', icon: '💪' },
    { value: 'bakery-sweet', label: 'Bakery / Sweet Shop', icon: '🍰' },
    { value: 'supermarket', label: 'Supermarket', icon: '🛒' },
    { value: 'wholesale', label: 'Wholesale Dealer', icon: '📦' },
    { value: 'retail', label: 'Retail Store', icon: '🏪' },
    { value: 'gift-shop', label: 'Gift Shop', icon: '🎁' },
    { value: 'other', label: 'Other', icon: '💼' },
];

const DISCOUNT_TIERS = [
    { threshold: '₹5,000+', discount: '5%' },
    { threshold: '₹15,000+', discount: '10%' },
    { threshold: '₹25,000+', discount: '15%' },
    { threshold: '₹50,000+', discount: '20%' },
];

const WHO_WE_SERVE = [
    { icon: '🏢', label: 'Corporate Offices' },
    { icon: '🏨', label: 'Hotels & Restaurants' },
    { icon: '🎉', label: 'Event Planners' },
    { icon: '🕌', label: 'Mosques & Madrasas' },
    { icon: '💪', label: 'Gyms & Fitness' },
    { icon: '🍰', label: 'Bakeries & Sweet Shops' },
    { icon: '🛒', label: 'Supermarkets' },
    { icon: '📦', label: 'Wholesale Dealers' },
    { icon: '🏪', label: 'Retail Stores' },
    { icon: '🎁', label: 'Gift Shops' },
];

const BULK_BENEFITS = [
    'Minimum order ₹5,000',
    'Free delivery in Hyderabad',
    'Up to 20% discount',
    'Custom packaging available',
    'COD & online payment accepted',
    'Dedicated account manager',
];

// ═══════════════════════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════════════════════

const FormInput = ({ label, type = 'text', required = true, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-khajur-dark mb-2">
            {label} {required && <span className="text-khajur-gold">*</span>}
        </label>
        <input
            type={type}
            required={required}
            className="
                w-full bg-transparent 
                border-b border-khajur-primary/20 
                focus:border-khajur-gold
                px-0 py-3 outline-none 
                transition-colors duration-200
                text-khajur-primary
                placeholder:text-khajur-dark/30
            "
            {...props}
        />
    </div>
);

const FormTextarea = ({ label, required = false, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-khajur-dark mb-2">
            {label} {required && <span className="text-khajur-gold">*</span>}
        </label>
        <textarea
            required={required}
            className="
                w-full bg-transparent 
                border-b border-khajur-primary/20 
                focus:border-khajur-gold
                px-0 py-3 outline-none 
                transition-colors duration-200
                resize-none
                text-khajur-primary
                placeholder:text-khajur-dark/30
            "
            {...props}
        />
    </div>
);

const BusinessTypeSelect = ({ value, onChange, required = true }) => {
    const selectedBusiness = BUSINESS_TYPES.find(b => b.value === value);

    return (
        <div>
            <label className="block text-sm font-medium text-khajur-dark mb-2">
                Business Type {required && <span className="text-khajur-gold">*</span>}
            </label>
            <div className="relative">
                <select
                    required={required}
                    value={value}
                    onChange={onChange}
                    className="
                        w-full bg-transparent appearance-none
                        border-b border-khajur-primary/20 
                        focus:border-khajur-gold
                        px-0 py-3 pr-8 outline-none 
                        transition-colors duration-200
                        text-khajur-primary
                        cursor-pointer
                    "
                    style={{
                        backgroundImage: 'none',
                    }}
                >
                    <option value="" disabled>Select your business type</option>
                    {BUSINESS_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                            {type.icon} {type.label}
                        </option>
                    ))}
                </select>
                <ChevronDown className="
                    absolute right-0 top-1/2 -translate-y-1/2 
                    w-4 h-4 text-khajur-primary/40 
                    pointer-events-none
                " />
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════

const BulkOrders = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        business_name: '',
        business_type: '',
        products_needed: '',
        quantity: '',
        address: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        document.title = 'Bulk Orders — KhajurKart';
        return () => {
            document.title = 'KhajurKart — Premium Dates, Dry Fruits & Spices';
        };
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // Form Validation
    // ─────────────────────────────────────────────────────────────────────────

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.business_name.trim()) newErrors.business_name = 'Business name is required';

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone is required';
        } else if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/\D/g, ''))) {
            newErrors.phone = 'Invalid phone number';
        }

        if (!formData.business_type) newErrors.business_type = 'Business type is required';
        if (!formData.products_needed.trim()) newErrors.products_needed = 'Products needed is required';
        if (!formData.quantity.trim()) newErrors.quantity = 'Quantity/Budget is required';
        if (!formData.address.trim()) newErrors.address = 'Delivery address is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Form Handlers
    // ─────────────────────────────────────────────────────────────────────────

    const handleInputChange = (field) => (e) => {
        let value = e.target.value;

        // Sanitize phone number
        if (field === 'phone') {
            value = value.replace(/\D/g, '').slice(0, 10);
        }

        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fill in all required fields correctly');
            return;
        }

        setLoading(true);

        try {
            const businessType = BUSINESS_TYPES.find(b => b.value === formData.business_type);

            await axios.post(`${API}/contact`, {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                message: `
🛒 BULK ORDER ENQUIRY

👤 Contact Person: ${formData.name}
🏢 Business: ${formData.business_name}
📊 Type: ${businessType?.label || formData.business_type}
📦 Products: ${formData.products_needed}
⚖️ Quantity/Budget: ${formData.quantity}
📍 Address: ${formData.address}

💬 Message: ${formData.message || 'No additional message'}
                `.trim()
            });

            toast.success('Bulk order enquiry sent successfully! We will contact you within 24 hours.');

            // Reset form
            setFormData({
                name: '',
                email: '',
                phone: '',
                business_name: '',
                business_type: '',
                products_needed: '',
                quantity: '',
                address: '',
                message: ''
            });
            setErrors({});

        } catch (error) {
            console.error('Bulk order error:', error);
            toast.error('Failed to send enquiry. Please try calling us directly at +91 7981002137');
        } finally {
            setLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-white" data-testid="bulk-orders-page">

            {/* ===== HERO ===== */}
            <section className="bg-khajur-primary py-20 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <p className="text-khajur-gold text-sm uppercase tracking-widest mb-4">
                        — For Businesses
                    </p>
                    <h1 className="font-serif text-5xl md:text-6xl font-medium text-khajur-cream mb-6">
                        Bulk Orders
                    </h1>
                    <p className="text-khajur-cream/70 text-lg max-w-2xl mx-auto leading-relaxed">
                        Special pricing for offices, hotels, restaurants,
                        event planners and retailers across Hyderabad
                    </p>
                </div>
            </section>

            {/* ===== DISCOUNT TIERS ===== */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                        {DISCOUNT_TIERS.map((tier, index) => (
                            <div
                                key={index}
                                className="
                                    bg-khajur-cream p-6 
                                    border border-khajur-border
                                    hover:border-khajur-gold
                                    transition-all duration-300
                                    text-center
                                "
                            >
                                <p className="font-serif text-4xl font-bold text-khajur-gold mb-2">
                                    {tier.discount}
                                </p>
                                <p className="text-sm text-khajur-dark/60 font-medium">
                                    Off on {tier.threshold}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== WHO WE SERVE ===== */}
            <section className="py-16 bg-khajur-cream">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="text-center mb-12">
                        <p className="text-xs uppercase tracking-widest text-khajur-gold mb-2">
                            Our Clients
                        </p>
                        <h2 className="font-serif text-3xl md:text-4xl font-medium text-khajur-primary">
                            Who We Serve
                        </h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                        {WHO_WE_SERVE.map((item, index) => (
                            <div
                                key={index}
                                className="
                                    bg-white border border-khajur-border 
                                    p-6 text-center 
                                    hover:border-khajur-gold hover:shadow-md
                                    transition-all duration-300
                                "
                            >
                                <p className="text-4xl mb-3">{item.icon}</p>
                                <p className="text-sm font-medium text-khajur-primary">
                                    {item.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== ENQUIRY FORM + CONTACT ===== */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

                        {/* Form */}
                        <div>
                            <div className="mb-8">
                                <p className="text-xs uppercase tracking-widest text-khajur-gold mb-2">
                                    Request Quote
                                </p>
                                <h2 className="font-serif text-3xl md:text-4xl font-medium text-khajur-primary">
                                    Get a Quote
                                </h2>
                                <p className="text-sm text-khajur-dark/60 mt-2">
                                    Fill in the details below and we'll get back to you within 24 hours
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Row 1: Name & Business Name */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormInput
                                        label="Your Name"
                                        type="text"
                                        value={formData.name}
                                        onChange={handleInputChange('name')}
                                        placeholder="John Doe"
                                        autoComplete="name"
                                    />
                                    <FormInput
                                        label="Business Name"
                                        type="text"
                                        value={formData.business_name}
                                        onChange={handleInputChange('business_name')}
                                        placeholder="ABC Enterprises"
                                        autoComplete="organization"
                                    />
                                </div>

                                {/* Row 2: Email & Phone */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormInput
                                        label="Email Address"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange('email')}
                                        placeholder="john@example.com"
                                        autoComplete="email"
                                    />
                                    <FormInput
                                        label="Phone Number"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleInputChange('phone')}
                                        placeholder="9876543210"
                                        autoComplete="tel"
                                        inputMode="numeric"
                                        maxLength={10}
                                    />
                                </div>

                                {/* Business Type */}
                                <BusinessTypeSelect
                                    value={formData.business_type}
                                    onChange={handleInputChange('business_type')}
                                />

                                {/* Products Needed */}
                                <FormInput
                                    label="Products Needed"
                                    type="text"
                                    value={formData.products_needed}
                                    onChange={handleInputChange('products_needed')}
                                    placeholder="e.g. Ajwa Dates, Cashews, Mixed Nuts"
                                />

                                {/* Quantity/Budget */}
                                <FormInput
                                    label="Estimated Quantity / Budget"
                                    type="text"
                                    value={formData.quantity}
                                    onChange={handleInputChange('quantity')}
                                    placeholder="e.g. 10kg or ₹10,000"
                                />

                                {/* Delivery Address */}
                                <FormInput
                                    label="Delivery Address"
                                    type="text"
                                    value={formData.address}
                                    onChange={handleInputChange('address')}
                                    placeholder="Full delivery address with pincode"
                                    autoComplete="street-address"
                                />

                                {/* Additional Message */}
                                <FormTextarea
                                    label="Additional Message"
                                    required={false}
                                    rows={3}
                                    value={formData.message}
                                    onChange={handleInputChange('message')}
                                    placeholder="Any special requirements or questions..."
                                />

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="
                                        w-full bg-khajur-gold text-khajur-primary 
                                        hover:bg-khajur-gold/90 hover:shadow-lg
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        rounded-sm px-8 py-4 
                                        uppercase tracking-widest text-xs font-bold 
                                        transition-all duration-300
                                        flex items-center justify-center gap-2
                                    "
                                >
                                    {loading ? (
                                        <>
                                            <span className="inline-block w-4 h-4 border-2 border-khajur-primary/30 border-t-khajur-primary rounded-full animate-spin" />
                                            Sending Enquiry...
                                        </>
                                    ) : (
                                        <>
                                            📦 Send Bulk Enquiry
                                        </>
                                    )}
                                </button>

                                <p className="text-xs text-khajur-dark/40 text-center">
                                    All fields marked with <span className="text-khajur-gold">*</span> are mandatory
                                </p>
                            </form>
                        </div>

                        {/* Contact Info */}
                        <div>
                            <div className="mb-8">
                                <p className="text-xs uppercase tracking-widest text-khajur-gold mb-2">
                                    Quick Contact
                                </p>
                                <h2 className="font-serif text-3xl md:text-4xl font-medium text-khajur-primary">
                                    Or Contact Us Directly
                                </h2>
                            </div>

                            <div className="space-y-6">
                                {/* Phone */}
                                <div className="bg-khajur-cream border border-khajur-border p-6 hover:border-khajur-gold transition-colors">
                                    <p className="text-sm text-khajur-dark/60 mb-2 uppercase tracking-wide">
                                        WhatsApp / Call
                                    </p>
                                    <a
                                        href="tel:+917981002137"
                                        className="font-serif text-2xl font-medium text-khajur-primary hover:text-khajur-gold transition-colors"
                                    >
                                        +91 79810 02137
                                    </a>
                                </div>

                                {/* Email */}
                                <div className="bg-khajur-cream border border-khajur-border p-6 hover:border-khajur-gold transition-colors">
                                    <p className="text-sm text-khajur-dark/60 mb-2 uppercase tracking-wide">
                                        Email
                                    </p>
                                    <a
                                        href="mailto:khajurkart@gmail.com"
                                        className="font-serif text-xl font-medium text-khajur-primary hover:text-khajur-gold transition-colors break-all"
                                    >
                                        khajurkart@gmail.com
                                    </a>
                                </div>

                                {/* Response Time */}
                                <div className="bg-khajur-cream border border-khajur-border p-6">
                                    <p className="text-sm text-khajur-dark/60 mb-2 uppercase tracking-wide">
                                        Response Time
                                    </p>
                                    <p className="font-serif text-xl font-medium text-khajur-primary">
                                        Within 24 hours ⚡
                                    </p>
                                </div>

                                {/* WhatsApp Button */}
                                <a
                                    href="https://wa.me/917981002137?text=Hi%20KhajurKart!%20I%20am%20interested%20in%20placing%20a%20bulk%20order."
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="
                                        flex items-center justify-center gap-3 
                                        w-full bg-green-600 hover:bg-green-700 
                                        text-white rounded-sm px-8 py-4 
                                        uppercase tracking-widest text-xs font-bold 
                                        transition-all duration-300
                                        shadow-lg hover:shadow-xl
                                    "
                                >
                                    <span className="text-xl">💬</span>
                                    WhatsApp Us Now
                                </a>
                            </div>

                            {/* Benefits Box */}
                            <div className="mt-8 bg-khajur-primary p-6 border border-khajur-gold/20">
                                <h3 className="font-serif text-xl font-medium text-khajur-cream mb-4">
                                    Bulk Order Benefits
                                </h3>
                                <ul className="space-y-3">
                                    {BULK_BENEFITS.map((benefit, index) => (
                                        <li
                                            key={index}
                                            className="flex items-start gap-3 text-khajur-cream/80 text-sm"
                                        >
                                            <span className="text-khajur-gold mt-0.5">✓</span>
                                            <span>{benefit}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

        </div>
    );
};

export default BulkOrders;
