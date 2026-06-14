import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BulkOrders = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        business_name: '',
        business_type: '',
        products_needed: '',
        quantity: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${API}/contact`, {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                message: `
BULK ORDER ENQUIRY
==================
Business: ${formData.business_name}
Type: ${formData.business_type}
Products: ${formData.products_needed}
Quantity: ${formData.quantity}
Message: ${formData.message}
                `
            });
            toast.success('Bulk order enquiry sent! We will contact you within 24 hours.');
            setFormData({
                name: '', email: '', phone: '',
                business_name: '', business_type: '',
                products_needed: '', quantity: '', message: ''
            });
        } catch (error) {
            toast.error('Failed to send enquiry. Please call us directly.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen" data-testid="bulk-orders-page">

            {/* ===== HERO ===== */}
            <section className="bg-khajur-primary py-20 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <p className="text-khajur-gold text-sm uppercase tracking-widest mb-4">
                        — For Businesses
                    </p>
                    <h1 className="font-serif text-5xl md:text-6xl font-medium text-khajur-cream mb-6">
                        Bulk Orders
                    </h1>
                    <p className="text-khajur-cream/70 text-lg max-w-2xl mx-auto">
                        Special pricing for offices, hotels, restaurants, 
                        event planners and retailers across Hyderabad
                    </p>
                </div>
            </section>

            {/* ===== BENEFITS ===== */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { number: '5%', label: 'Off on ₹2,000+' },
                            { number: '10%', label: 'Off on ₹5,000+' },
                            { number: '15%', label: 'Off on ₹10,000+' },
                            { number: '20%', label: 'Off on ₹25,000+' },
                        ].map((item, index) => (
                            <div key={index} className="bg-khajur-cream p-6 border border-khajur-border">
                                <p className="font-serif text-4xl font-bold text-khajur-gold mb-2">
                                    {item.number}
                                </p>
                                <p className="text-sm text-khajur-dark/60">
                                    {item.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== WHO WE SERVE ===== */}
            <section className="py-16 bg-khajur-cream">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <h2 className="font-serif text-3xl font-medium text-khajur-primary text-center mb-12">
                        Who We Serve
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[
                            { icon: '🏢', label: 'Corporate Offices' },
                            { icon: '🏨', label: 'Hotels & Restaurants' },
                            { icon: '🎉', label: 'Event Planners' },
                            { icon: '🕌', label: 'Mosques & Madrasas' },
                            { icon: '💪', label: 'Gyms & Fitness' },
                            { icon: '🍰', label: 'Bakeries & Sweet Shops' },
                            { icon: '🛒', label: 'Supermarkets' },
                            { icon: '🎁', label: 'Gift Shops' },
                        ].map((item, index) => (
                            <div
                                key={index}
                                className="bg-white border border-khajur-border p-6 text-center hover:border-khajur-gold transition-colors"
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
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

                        {/* Form */}
                        <div>
                            <h2 className="font-serif text-3xl font-medium text-khajur-primary mb-8">
                                Get a Quote
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-khajur-dark mb-2">
                                            Your Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            className="w-full bg-transparent border-b border-khajur-primary/20 focus:border-khajur-primary px-0 py-3 outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-khajur-dark mb-2">
                                            Business Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.business_name}
                                            onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                                            className="w-full bg-transparent border-b border-khajur-primary/20 focus:border-khajur-primary px-0 py-3 outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-khajur-dark mb-2">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            className="w-full bg-transparent border-b border-khajur-primary/20 focus:border-khajur-primary px-0 py-3 outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-khajur-dark mb-2">
                                            Phone *
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            value={formData.phone}
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                            className="w-full bg-transparent border-b border-khajur-primary/20 focus:border-khajur-primary px-0 py-3 outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-khajur-dark mb-2">
                                        Business Type *
                                    </label>
                                    <select
                                        required
                                        value={formData.business_type}
                                        onChange={(e) => setFormData({...formData, business_type: e.target.value})}
                                        className="w-full bg-transparent border-b border-khajur-primary/20 focus:border-khajur-primary px-0 py-3 outline-none transition-colors"
                                    >
                                        <option value="">Select business type</option>
                                        <option>Corporate Office</option>
                                        <option>Hotel / Restaurant</option>
                                        <option>Event Planner</option>
                                        <option>Mosque / Madrasa</option>
                                        <option>Gym / Fitness Center</option>
                                        <option>Bakery / Sweet Shop</option>
                                        <option>Supermarket / Kirana</option>
                                        <option>Gift Shop</option>
                                        <option>Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-khajur-dark mb-2">
                                        Products Needed *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Ajwa Dates, Cashews, Mixed Nuts"
                                        value={formData.products_needed}
                                        onChange={(e) => setFormData({...formData, products_needed: e.target.value})}
                                        className="w-full bg-transparent border-b border-khajur-primary/20 focus:border-khajur-primary px-0 py-3 outline-none transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-khajur-dark mb-2">
                                        Estimated Quantity / Budget *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. 10kg or ₹10,000"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                                        className="w-full bg-transparent border-b border-khajur-primary/20 focus:border-khajur-primary px-0 py-3 outline-none transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-khajur-dark mb-2">
                                        Additional Message
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={formData.message}
                                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                                        placeholder="Any special requirements..."
                                        className="w-full bg-transparent border-b border-khajur-primary/20 focus:border-khajur-primary px-0 py-3 outline-none transition-colors resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-khajur-gold text-khajur-primary hover:bg-khajur-gold/90 rounded-sm px-8 py-4 uppercase tracking-widest text-xs font-bold transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Sending...' : 'Send Bulk Enquiry'}
                                </button>
                            </form>
                        </div>

                        {/* Contact Info */}
                        <div>
                            <h2 className="font-serif text-3xl font-medium text-khajur-primary mb-8">
                                Or Contact Us Directly
                            </h2>

                            <div className="space-y-6">
                                <div className="bg-khajur-cream border border-khajur-border p-6">
                                    <p className="text-sm text-khajur-dark/60 mb-1">WhatsApp / Call</p>
                                    
                                        href="tel:+917981002137"
                                        className="font-serif text-2xl font-medium text-khajur-primary hover:text-khajur-gold transition-colors"
                                    >
                                        +91 7981002137
                                    </a>
                                </div>

                                <div className="bg-khajur-cream border border-khajur-border p-6">
                                    <p className="text-sm text-khajur-dark/60 mb-1">Email</p>
                                    
                                        href="mailto:khajurkart@gmail.com"
                                        className="font-serif text-xl font-medium text-khajur-primary hover:text-khajur-gold transition-colors"
                                    >
                                        khajurkart@gmail.com
                                    </a>
                                </div>

                                <div className="bg-khajur-cream border border-khajur-border p-6">
                                    <p className="text-sm text-khajur-dark/60 mb-2">Response Time</p>
                                    <p className="font-serif text-xl font-medium text-khajur-primary">
                                        Within 24 hours ⚡
                                    </p>
                                </div>

                                {/* WhatsApp Button */}
                                
                                    href="https://wa.me/917981002137?text=Hi KhajurKart! I am interested in placing a bulk order."
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-center gap-3 w-full bg-green-600 hover:bg-green-700 text-white rounded-sm px-8 py-4 uppercase tracking-widest text-xs font-bold transition-all"
                                >
                                    <span className="text-xl">💬</span>
                                    WhatsApp Us Now
                                </a>
                            </div>

                            {/* Min Order Info */}
                            <div className="mt-8 bg-khajur-primary p-6">
                                <h3 className="font-serif text-xl font-medium text-khajur-cream mb-4">
                                    Bulk Order Benefits
                                </h3>
                                <ul className="space-y-3">
                                    {[
                                        'Minimum order ₹2,000',
                                        'Free delivery in Hyderabad',
                                        'Upto 20% discount',
                                        'Custom packaging available',
                                        'Monthly subscription available',
                                        'Invoice provided for GST',
                                        'COD & online payment accepted',
                                    ].map((item, index) => (
                                        <li key={index} className="flex items-center gap-3 text-khajur-cream/80 text-sm">
                                            <span className="text-khajur-gold">✓</span>
                                            {item}
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
