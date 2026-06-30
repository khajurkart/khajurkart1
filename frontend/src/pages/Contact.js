import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, Loader2 } from 'lucide-react';
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
        details:
            '10-3-313/a, AR Raheem Residency, beside Govt IASE College, Potti Sriramulu Nagar, Vijaya Nagar Colony, Hyderabad, Telangana — 500057',
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

const HeroSection = () => (
    <section className="relative h-[420px] bg-khajur-primary overflow-hidden">
        <img
            src="https://images.pexels.com/photos/4198755/pexels-photo-4198755.jpeg"
            alt="Contact Us"
            className="absolute inset-0 w-full h-full object-cover opacity-25"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-khajur-primary/80 to-transparent" />

        <div className="relative h-full flex items-center">
            <div className="max-w-7xl mx-auto px-6 md:px-12 w-full">
                <p className="text-xs uppercase tracking-widest text-khajur-gold mb-3">
                    We'd love to hear from you
                </p>
                <h1 className="font-serif text-5xl md:text-7xl font-medium text-khajur-cream mb-4 leading-tight">
                    Contact Us
                </h1>
                <p className="font-sans text-base md:text-lg text-khajur-cream/70 max-w-xl leading-relaxed">
                    Have a question, feedback or just want to say hello? We're here and ready to help.
                </p>
            </div>
        </div>
    </section>
);

// ── Field ──────────────────────────────────────────────────────────────────────

const Field = ({ label, required, children }) => (
    <div className="space-y-2">
        <label className="block text-xs font-medium uppercase tracking-widest text-khajur-dark/60">
            {label}
            {required && <span className="text-khajur-gold ml-1">*</span>}
        </label>
        {children}
    </div>
);

const inputBase = `
  w-full bg-transparent border-b border-khajur-primary/20
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
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Valid email required';
        if (formData.phone && !/^[\d\s\+\-]{7,15}$/.test(formData.phone)) return 'Valid phone required';
        if (formData.message.trim().length < 10) return 'Message must be at least 10 characters';
        if (formData.message.length > 1000) return 'Message too long (max 1000 chars)';
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
                toast.success('Message sent successfully! We\'ll get back to you soon.');
                setFormData(INITIAL_FORM);
            } else {
                toast.error('Failed to send message. Please try again.');
            }
        } catch {
            toast.error('Something went wrong. Please try again later.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white border border-khajur-border p-8 md:p-12">
            {/* Form Header */}
            <p className="text-xs uppercase tracking-widest text-khajur-gold mb-1">
                Reach Out
            </p>
            <h2 className="font-serif text-3xl font-medium text-khajur-primary mb-2">
                Send Us a Message
            </h2>
            <p className="text-sm text-khajur-dark/50 mb-10 leading-relaxed">
                Fill out the form below and our team will respond within 24 hours.
            </p>

            <form onSubmit={handleSubmit} className="space-y-8" data-testid="contact-form">

                {/* Name & Email — side by side on larger screens */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <Field label="Your Name" required>
                        <input
                            type="text"
                            required
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={set('name')}
                            className={inputBase}
                            data-testid="contact-name"
                        />
                    </Field>
                    <Field label="Email Address" required>
                        <input
                            type="email"
                            required
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={set('email')}
                            className={inputBase}
                            data-testid="contact-email"
                        />
                    </Field>
                </div>

                <Field label="Phone Number">
                    <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={set('phone')}
                        className={inputBase}
                        data-testid="contact-phone"
                    />
                </Field>

                <Field label="Message" required>
                    <textarea
                        required
                        rows={5}
                        placeholder="Tell us how we can help you…"
                        value={formData.message}
                        onChange={set('message')}
                        className={`
              w-full bg-transparent border border-khajur-primary/20
              focus:border-khajur-gold px-4 py-3 rounded-sm
              text-sm text-khajur-primary placeholder:text-khajur-dark/25
              focus:outline-none transition-colors duration-200 resize-none
            `}
                        data-testid="contact-message"
                    />
                </Field>

                <button
                    type="submit"
                    disabled={submitting}
                    className="
            flex items-center justify-center gap-2
            w-full bg-khajur-gold text-khajur-primary
            hover:bg-khajur-gold/90 hover:shadow-[0_0_20px_rgba(198,169,98,0.35)]
            disabled:opacity-60 disabled:cursor-not-allowed
            rounded-sm px-8 py-4 uppercase tracking-widest text-xs font-bold
            transition-all duration-300
          "
                    data-testid="submit-contact-form"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending…
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4" />
                            Send Message
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

// ── Contact Info Card ──────────────────────────────────────────────────────────

const ContactInfoCard = ({ icon: Icon, title, details, link }) => (
    <div className="flex items-start gap-5 p-6 bg-white border border-khajur-border hover:border-khajur-gold/40 transition-colors duration-300 group">
        <div className="w-10 h-10 flex items-center justify-center bg-khajur-cream flex-shrink-0 group-hover:bg-khajur-gold/10 transition-colors duration-300">
            <Icon className="w-5 h-5 text-khajur-gold" />
        </div>
        <div>
            <h3 className="text-xs uppercase tracking-widest font-medium text-khajur-dark/50 mb-1">
                {title}
            </h3>
            {link ? (
                <a
                    href={link}
                    className="text-sm text-khajur-primary hover:text-khajur-gold transition-colors leading-relaxed"
                >
                    {details}
                </a>
            ) : (
                <p className="text-sm text-khajur-primary leading-relaxed">{details}</p>
            )}
        </div>
    </div>
);

// ── Info Panel ─────────────────────────────────────────────────────────────────

const InfoPanel = () => (
    <div className="flex flex-col gap-8">
        <div>
            <p className="text-xs uppercase tracking-widest text-khajur-gold mb-1">
                Our Details
            </p>
            <h2 className="font-serif text-3xl font-medium text-khajur-primary mb-2">
                Get in Touch
            </h2>
            <p className="text-sm text-khajur-dark/50 leading-relaxed">
                We're available across multiple channels. Choose what's most convenient for you.
            </p>
        </div>

        <div className="space-y-4">
            {CONTACT_INFO.map((info) => (
                <ContactInfoCard key={info.title} {...info} />
            ))}
        </div>

        {/* Divider with note */}
        <div className="border-t border-khajur-border pt-6">
            <p className="text-xs text-khajur-dark/40 leading-relaxed">
                For bulk orders or wholesale inquiries, please reach out via email with your
                requirements and we'll get back to you with a custom quote.
            </p>
        </div>
    </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const Contact = () => (
    <div className="min-h-screen bg-white" data-testid="contact-page">

        <HeroSection />

        <section className="py-20 md:py-32">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20">
                    <ContactForm />
                    <InfoPanel />
                </div>
            </div>
        </section>

    </div>
);

export default Contact;
