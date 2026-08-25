import React, { useEffect, useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const FAQS = [
    {
        category: 'Product Quality',
        question: 'Are your dates premium quality?',
        answer:
            'Absolutely. Every batch of dates is carefully sourced and quality-checked for freshness, texture, and taste. We work directly with trusted suppliers to ensure only the finest products reach your doorstep.',
    },
    {
        category: 'Shipping',
        question: 'Do you offer free shipping?',
        answer:
            'Yes, we offer free shipping on orders above a certain cart value. Free delivery is automatically applied at checkout when your order qualifies.',
    },
    {
        category: 'Gifting',
        question: 'Do you provide gift packaging?',
        answer:
            'Yes! We offer premium gift packaging perfect for festivals, weddings, and corporate gifting. You can request gift packaging during checkout or contact us for bulk gifting orders.',
    },
    {
        category: 'Delivery',
        question: 'How many days does delivery take?',
        answer:
            'Standard delivery takes 3–7 business days depending on your location. Once your order is shipped, you will receive a tracking ID to monitor your delivery in real time.',
    },
    {
        category: 'Payment',
        question: 'Is Cash on Delivery available?',
        answer:
            'Yes, Cash on Delivery (COD) is available for most locations across India. You can select COD at checkout. Online payment via UPI, cards, and net banking is also supported.',
    },
    {
        category: 'Packaging',
        question: 'Are your dry fruits vacuum packed?',
        answer:
            'Yes, all our dry fruits and spices are packed using food-grade vacuum or airtight packaging to preserve freshness, flavour, and shelf life for as long as possible.',
    },
    {
        category: 'Returns',
        question: 'What is your return & exchange policy?',
        answer:
            'We accept return and exchange requests within 7 days of delivery, provided the product is unused and in its original packaging. Visit the Returns & Exchange page or contact our support team to initiate a request.',
    },
    {
        category: 'Orders',
        question: 'Can I modify or cancel my order after placing it?',
        answer:
            'Orders can be cancelled or modified only while they are in "Pending" or "Confirmed" status. Once the order is shipped, changes cannot be made. Please reach out to us immediately if you need assistance.',
    },
];

// ─── Sub-Components ────────────────────────────────────────────────────────────

// ── Hero ───────────────────────────────────────────────────────────────────────

const Hero = () => (
    <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-khajur-gold/10 rounded-full mb-5">
            <HelpCircle className="w-6 h-6 text-khajur-gold" />
        </div>
        <p className="text-xs uppercase tracking-widest text-khajur-gold font-medium mb-2">
            Support
        </p>
        <h1 className="font-serif text-4xl md:text-5xl font-medium text-khajur-primary mb-4 leading-tight">
            Frequently Asked Questions
        </h1>
        <p className="text-sm text-khajur-dark/50 max-w-md mx-auto leading-relaxed">
            Everything you need to know about KhajurKart — from product quality to
            delivery and returns.
        </p>
    </div>
);

// ── FAQ Item ───────────────────────────────────────────────────────────────────

const FAQItem = ({ faq, index, isOpen, onToggle }) => (
    <div
        className={`
      border rounded-sm transition-all duration-300 overflow-hidden
      ${isOpen
                ? 'border-khajur-gold/50 shadow-[0_4px_20px_rgba(198,169,98,0.1)]'
                : 'border-khajur-border hover:border-khajur-gold/30'
            }
    `}
    >
        {/* Question Row */}
        <button
            onClick={() => onToggle(index)}
            className="w-full flex items-center justify-between gap-4 px-7 py-5 text-left bg-white"
            aria-expanded={isOpen}
        >
            <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Index number */}
                <span className="
          flex-shrink-0 w-7 h-7 rounded-full
          bg-khajur-gold/10 text-khajur-gold
          text-xs font-bold flex items-center justify-center
        ">
                    {String(index + 1).padStart(2, '0')}
                </span>

                <div className="flex-1 min-w-0">
                    {/* Category tag */}
                    <p className="text-[10px] uppercase tracking-widest text-khajur-gold font-medium mb-0.5">
                        {faq.category}
                    </p>
                    <p className={`
            text-sm font-semibold leading-snug transition-colors duration-200
            ${isOpen ? 'text-khajur-gold' : 'text-khajur-primary'}
          `}>
                        {faq.question}
                    </p>
                </div>
            </div>

            {/* Chevron */}
            <ChevronDown
                className={`
          w-4 h-4 flex-shrink-0 text-khajur-gold
          transition-transform duration-300
          ${isOpen ? 'rotate-180' : 'rotate-0'}
        `}
            />
        </button>

        {/* Answer */}
        <div className={`
      transition-all duration-300 ease-in-out
      ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
    `}>
            <div className="px-7 pb-6 pt-1 bg-white border-t border-khajur-border/50">
                <p className="text-sm text-khajur-dark/65 leading-relaxed pl-11">
                    {faq.answer}
                </p>
            </div>
        </div>
    </div>
);

// ── Contact CTA ────────────────────────────────────────────────────────────────

const ContactCTA = () => (
    <div className="mt-16 text-center bg-white border border-khajur-border rounded-sm px-8 py-10">
        <p className="text-xs uppercase tracking-widest text-khajur-gold font-medium mb-2">
            Still have questions?
        </p>
        <h3 className="font-serif text-2xl font-medium text-khajur-primary mb-3">
            We're here to help
        </h3>
        <p className="text-sm text-khajur-dark/50 mb-6 max-w-xs mx-auto">
            Can't find the answer you're looking for? Our support team is ready to assist you.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
                href="mailto:khajurkart@gmail.com"
                className="
          flex items-center gap-2 bg-khajur-gold hover:bg-khajur-gold/90
          hover:shadow-[0_0_20px_rgba(198,169,98,0.35)]
          text-khajur-primary px-8 py-3 rounded-sm
          uppercase tracking-widest text-xs font-bold
          transition-all duration-300
        "
            >
                Email Us
            </a>
            <a
                href="https://wa.me/917981002137"
                target="_blank"
                rel="noopener noreferrer"
                className="
          flex items-center gap-2 border border-khajur-border
          hover:border-khajur-primary hover:bg-khajur-primary
          text-khajur-primary hover:text-khajur-cream
          px-8 py-3 rounded-sm
          uppercase tracking-widest text-xs font-bold
          transition-all duration-300
        "
            >
                WhatsApp Support
            </a>
        </div>
    </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const FAQ = () => {
    useEffect(() => {
        document.title = 'FAQ — KhajurKart';
        return () => {
            document.title = 'KhajurKart — Premium Dates, Dry Fruits & Spices';
        };
    }, []);
    const [openIndex, setOpenIndex] = useState(null);

    const handleToggle = (index) => {
        setOpenIndex((prev) => (prev === index ? null : index));
    };

    return (
        <div className="min-h-screen bg-khajur-cream py-16 md:py-24" data-testid="faq-page">
            <div className="max-w-3xl mx-auto px-6 md:px-12">

                {/* ── Hero ── */}
                <Hero />

                {/* ── FAQ List ── */}
                <div className="space-y-3">
                    {FAQS.map((faq, index) => (
                        <FAQItem
                            key={index}
                            faq={faq}
                            index={index}
                            isOpen={openIndex === index}
                            onToggle={handleToggle}
                        />
                    ))}
                </div>

                {/* ── Contact CTA ── */}
                <ContactCTA />

            </div>
        </div>
    );
};

export default FAQ;
