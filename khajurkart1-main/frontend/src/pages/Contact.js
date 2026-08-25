import React, { useEffect, useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, Loader2, MessageCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ─── Constants ─────────────────────────────────────────────────────────────────

const CONTACT_INFO = [
    {
        icon: Phone,
        title: 'Phone',
        details: '+91 79810 02137',
        link: 'tel:+917981002137',
    },
    {
        icon: Mail,
        title: 'Email',
        details: 'khajurkart@gmail.com',
        link: 'mailto:khajurkart@gmail.com',
    },
    {
        icon: MapPin,
        title: 'Address',
        details: '10-3-313/a, AR Raheem Residency, Hyderabad, Telangana — 500057',
        link: null,
    },
    {
        icon: Clock,
        title: 'Business Hours',
        details: 'Monday – Saturday: 9:00 AM – 8:00 PM',
        link: null,
    },
];

const INITIAL_FORM = { name: '', email: '', phone: '', message: '' };

// ─── Sub-Components ────────────────────────────────────────────────────────────

// ── Hero ───────────────────────────────────────────────────────────────────────

const HeroSection = () => (
    <section className="relative h-[380px] md:h-[440px] bg-khajur-primary overflow-hidden">
        <img
            src="https://images.pexels.com/photos/4198755/pexels-photo-4198755.jpeg"
            alt="Contact Us"
            className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-khajur-primary via-khajur-primary/80 to-transparent" />
        <div className="relative h-full flex items-center">
            <div className="max-w-7xl mx-auto px-6 md:px-12 w-full">
                <p className="text-xs uppercase tracking-widest font-semibold text-khajur-gold mb-4">
                    We'd love to hear from you
                </p>
                <h1 className="font-serif text-5xl md:text-7xl font-medium text-khajur-cream mb-5 leading-tight">
                    Contact Us
                </h1>
                <p className="text-base md:text-lg text-khajur-cream/65 max-w-lg leading-relaxed">
                    Have a question, feedback or just want to say hello?
                    We're here and ready to help.
                </p>
            </div>
        </div>
    </section>
);

// ── Field wrapper ──────────────────────────────────────────────────────────────

const Field = ({ label, required, children, htmlFor }) => (
    <div className="space-y-2">
        <label
            htmlFor={htmlFor}
            className="block text-xs font-semibold uppercase tracking-widest text-khajur-dark/50"
        >
            {label}
            {required && <span className="text-khajur-gold ml-1">*</span>}
        </label>
        {children}
    </div>
);

const inputBase = `
    w-full bg-transparent border-b border-khajur-primary/15
    focus:border-khajur-gold px-0 py-3
    text-sm text-khajur-primary placeholder:text-khajur-dark/25
    focus:outline-none transition-colors duration-200
`;

// ── Contact Form ───────────────────────────────────────────────────────────────

const ContactForm = () => {
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [submitting, setSubmitting] = useState(false);

    const set = (field) => (e) =>
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));

    const validate = () => {
        if (!formData.name.trim()) return 'Name is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
            return 'Valid email required';
        if (formData.phone && !/^[\d\s+\-]{7,15}$/.test(formData.phone))
            return 'Valid phone required';
        if (formData.message.trim().length < 10)
            return 'Message must be at least 10 characters';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const error = validate();
        if (error) return toast.error(error);
        setSubmitting(true);
        try {
            const res = await fetch(`${API}/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                toast.success('Message sent successfully!');
                setFormData(INITIAL_FORM);
            } else {
                toast.error('Failed to send message.');
            }
        } catch {
            toast.error('Something went wrong.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white border border-khajur-border p-8 md:p-14">
            {/* Form Header */}
            <p className="text-xs uppercase tracking-widest font-semibold text-khajur-gold mb-2">
                Reach Out
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-medium text-khajur-primary mb-2 leading-tight">
                Send Us a Message
            </h2>
            <p className="text-sm text-khajur-dark/40 mb-12 leading-relaxed">
                Fill out the form below and our team will respond within 24 hours.
            </p>

            <form onSubmit={handleSubmit} className="space-y-10" noValidate>

                {/* Row 1: Name + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                    <Field label="Your Name" required htmlFor="contact-name">
                        <input
                            id="contact-name"
                            type="text"
                            required
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={set('name')}
                            className={inputBase}
                        />
                    </Field>
                    <Field label="Email Address" required htmlFor="contact-email">
                        <input
                            id="contact-email"
                            type="email"
                            required
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={set('email')}
                            className={inputBase}
                        />
                    </Field>
                </div>

                {/* Phone */}
                <Field label="Phone Number" htmlFor="contact-phone">
                    <input
                        id="contact-phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={set('phone')}
                        className={inputBase}
                    />
                </Field>

                {/* Message */}
                <Field label="Message" required htmlFor="contact-message">
                    <textarea
                        id="contact-message"
                        required
                        rows={6}
                        placeholder="Tell us how we can help you…"
                        value={formData.message}
                        onChange={set('message')}
                        className="
                            w-full bg-transparent
                            border border-khajur-primary/10
                            hover:border-khajur-primary/20
                            focus:border-khajur-gold
                            px-4 py-4 rounded-sm
                            text-sm text-khajur-primary
                            placeholder:text-khajur-dark/25
                            focus:outline-none transition-colors duration-200
                            resize-none
                        "
                    />
                </Field>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={submitting}
                    className="
                        w-full flex items-center justify-center gap-2
                        bg-khajur-gold hover:bg-khajur-gold/90
                        hover:shadow-[0_0_20px_rgba(198,169,98,0.35)]
                        disabled:opacity-60 disabled:cursor-not-allowed
                        text-khajur-primary rounded-sm px-8 py-4
                        uppercase tracking-widest text-xs font-bold
                        transition-all duration-300
                    "
                >
                    {submitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                    ) : (
                        <><Send className="w-4 h-4" /> Send Message</>
                    )}
                </button>
            </form>
        </div>
    );
};

// ── Contact Info Card ──────────────────────────────────────────────────────────

const ContactInfoCard = ({ icon: Icon, title, details, link }) => (
    <div className="
        flex items-start gap-5 p-5
        bg-khajur-cream border border-khajur-border
        hover:border-khajur-gold/40
        transition-all duration-300 group
    ">
        {/* Icon box */}
        <div className="
            w-10 h-10 flex items-center justify-center
            bg-white border border-khajur-border
            flex-shrink-0
            group-hover:border-khajur-gold/30
            transition-colors duration-300
        ">
            <Icon className="w-4 h-4 text-khajur-gold" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-widest font-semibold text-khajur-dark/40 mb-1">
                {title}
            </p>
            {link ? (
                <a
                    href={link}
                    className="
                        text-sm font-medium text-khajur-primary
                        hover:text-khajur-gold transition-colors duration-200
                    "
                >
                    {details}
                </a>
            ) : (
                <p className="text-sm font-medium text-khajur-primary leading-relaxed">
                    {details}
                </p>
            )}
        </div>
    </div>
);

// ── Info Panel ─────────────────────────────────────────────────────────────────

const InfoPanel = () => (
    <div className="flex flex-col gap-8">

        {/* Header */}
        <div>
            <p className="text-xs uppercase tracking-widest font-semibold text-khajur-gold mb-2">
                Our Details
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-medium text-khajur-primary mb-3 leading-tight">
                Get in Touch
            </h2>
            <p className="text-sm text-khajur-dark/50 leading-relaxed">
                We're available across multiple channels.
                Choose what's most convenient for you.
            </p>
        </div>

        {/* Contact Cards */}
        <div className="space-y-3">
            {CONTACT_INFO.map((info) => (
                <ContactInfoCard key={info.title} {...info} />
            ))}
        </div>

        {/* WhatsApp CTA */}
        <a
            href="https://wa.me/917981002137"
            target="_blank"
            rel="noopener noreferrer"
            className="
                flex items-center justify-center gap-3
                bg-green-500 hover:bg-green-600
                text-white rounded-sm px-8 py-4
                uppercase tracking-widest text-xs font-bold
                transition-all duration-300
                hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]
            "
        >
            <MessageCircle className="w-4 h-4" />
            WhatsApp Us Now
        </a>

        {/* Response time chip */}
        <div className="flex items-center gap-3 bg-khajur-cream border border-khajur-border px-5 py-4">
            <Zap className="w-4 h-4 text-khajur-gold flex-shrink-0" />
            <div>
                <p className="text-xs uppercase tracking-widest font-semibold text-khajur-dark/40 mb-0.5">
                    Response Time
                </p>
                <p className="text-sm font-semibold text-khajur-primary">
                    We reply within 24 hours
                </p>
            </div>
        </div>

        {/* Footer note */}
        <div className="border-t border-khajur-border pt-5">
            <p className="text-xs text-khajur-dark/40 leading-relaxed">
                For bulk orders or wholesale inquiries, please reach out via
                email or WhatsApp for a custom quote.
            </p>
        </div>
    </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const Contact = () => {
    useEffect(() => {
        document.title = 'Contact Us — KhajurKart';
        return () => {
            document.title = 'KhajurKart — Premium Dates, Dry Fruits & Spices';
        };
    }, []);

    return (
        <div className="min-h-screen bg-white" data-testid="contact-page">

            {/* Hero */}
            <HeroSection />

            {/* Main Section */}
            <section className="py-20 md:py-28 bg-white">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20">
                        <ContactForm />
                        <InfoPanel />
                    </div>
                </div>
            </section>

            {/* Bottom CTA strip */}
            <section className="bg-khajur-primary py-14">
                <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <p className="text-xs uppercase tracking-widest font-semibold text-khajur-gold mb-1">
                            Bulk Orders
                        </p>
                        <h3 className="font-serif text-2xl md:text-3xl font-medium text-khajur-cream">
                            Need large quantities?
                        </h3>
                        <p className="text-sm text-khajur-cream/60 mt-1">
                            Special pricing for businesses, hotels & events.
                        </p>
                    </div>
                    <a
                        href="https://wa.me/917981002137"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                            flex-shrink-0 flex items-center gap-2
                            bg-khajur-gold hover:bg-khajur-gold/90
                            text-khajur-primary px-8 py-4 rounded-sm
                            uppercase tracking-widest text-xs font-bold
                            transition-all duration-300
                            hover:shadow-[0_0_20px_rgba(198,169,98,0.35)]
                        "
                    >
                        <MessageCircle className="w-4 h-4" />
                        Get Bulk Quote
                    </a>
                </div>
            </section>

        </div>
    );
};

export default Contact;
