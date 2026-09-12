import React, { useState } from 'react';
import { MessageCircle, Mail, Phone, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─── Constants ────────────────────────────────────────────────────────────────
const BUTTONS = [
    {
        label: 'WhatsApp',
        icon: MessageCircle,
        testId: 'whatsapp-button',
        className:
            'bg-green-500 hover:bg-green-600 text-white shadow-green-500/30',
        tooltip: 'Chat on WhatsApp',
        type: 'whatsapp',
    },
    {
        label: 'Email',
        icon: Mail,
        testId: 'email-button',
        className:
            'bg-khajur-gold hover:bg-khajur-gold/90 text-khajur-primary shadow-khajur-gold/30',
        tooltip: 'Send us an Email',
        type: 'email',
    },
    {
        label: 'Call Us',
        icon: Phone,
        testId: 'phone-button',
        className:
            'bg-khajur-primary hover:bg-khajur-primary/90 text-khajur-cream shadow-khajur-primary/30',
        tooltip: 'Call Us',
        type: 'call',
    },
];

// ─── FAB ──────────────────────────────────────────────────────────────────────
const FAB = ({ icon: Icon, label, tooltip, className, action, testId }) => (
    <div className="relative group flex items-center justify-end">

        <span
            className="
                absolute right-14 whitespace-nowrap
                bg-khajur-primary text-khajur-cream
                text-xs font-medium px-3 py-1.5 rounded-sm
                shadow-lg pointer-events-none
                opacity-0 group-hover:opacity-100
                translate-x-1 group-hover:translate-x-0
                transition-all duration-200
            "
        >
            {tooltip}

            <span
                className="
                    absolute right-[-4px] top-1/2
                    -translate-y-1/2
                    w-2 h-2
                    bg-khajur-primary rotate-45
                "
            />
        </span>

        <button
            onClick={action}
            data-testid={testId}
            aria-label={label}
            className={`
                w-12 h-12 rounded-full
                flex items-center justify-center
                shadow-lg hover:shadow-xl
                hover:scale-110
                transition-all duration-300
                ${className}
            `}
        >
            <Icon className="w-5 h-5" />
        </button>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const FloatingButtons = () => {
    const navigate = useNavigate();

    // ADD THIS
    const [contactType, setContactType] = useState(null);

    const getAction = (type) => {
        switch (type) {

            // REPLACE OLD WHATSAPP CODE WITH THIS
            case 'whatsapp':
                return () => setContactType('whatsapp');

            case 'email':
                return () => navigate('/contact');

            // REPLACE OLD CALL CODE WITH THIS
            case 'call':
                return () => setContactType('call');

            default:
                return () => {};
        }
    };

    // Opens selected number
    const handleContact = (number) => {
        if (contactType === 'whatsapp') {
            window.open(`https://wa.me/${number}`, '_blank');
        }

        if (contactType === 'call') {
            window.location.href = `tel:+${number}`;
        }

        setContactType(null);
    };

    return (
        <>
            {/* Floating Buttons */}
            <div
                className="fixed bottom-8 right-8 flex flex-col items-end gap-3 z-40"
                data-testid="floating-buttons"
            >
                {BUTTONS.map((btn) => (
                    <FAB
                        key={btn.label}
                        {...btn}
                        action={getAction(btn.type)}
                    />
                ))}
            </div>

            {/* Contact Popup */}
            {contactType && (
                <div
                    className="
                        fixed inset-0 z-50
                        bg-black/50 backdrop-blur-sm
                        flex items-center justify-center
                        px-4
                    "
                    onClick={() => setContactType(null)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="
                            relative
                            w-full max-w-sm
                            bg-khajur-cream
                            rounded-2xl
                            shadow-2xl
                            p-6
                        "
                    >
                        {/* Close */}
                        <button
                            onClick={() => setContactType(null)}
                            className="
                                absolute top-4 right-4
                                text-khajur-primary/60
                                hover:text-khajur-primary
                                transition
                            "
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Heading */}
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-semibold text-khajur-primary">
                                {contactType === 'whatsapp'
                                    ? 'Chat With KhajurKart'
                                    : 'Call KhajurKart'}
                            </h2>

                            <p className="text-sm text-khajur-primary/60 mt-1">
                                Choose a contact number
                            </p>
                        </div>

                        {/* Number 1 */}
                        <button
                            onClick={() => handleContact('919133105000')}
                            className="
                                w-full
                                border border-khajur-gold/40
                                bg-white
                                hover:bg-khajur-gold/10
                                rounded-xl
                                px-4 py-4
                                mb-3
                                text-left
                                transition-all
                                hover:shadow-md
                            "
                        >
                            <div className="flex items-center gap-3">

                                {contactType === 'whatsapp' ? (
                                    <MessageCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                    <Phone className="w-5 h-5 text-khajur-gold" />
                                )}

                                <div>
                                    <p className="text-sm font-semibold text-khajur-primary">
                                        Sales
                                    </p>

                                    <p className="text-sm text-khajur-primary/70">
                                        +91 91331 05000
                                    </p>
                                </div>
                            </div>
                        </button>

                        {/* Number 2 */}
                        <button
                            onClick={() => handleContact('919133805000')}
                            className="
                                w-full
                                border border-khajur-gold/40
                                bg-white
                                hover:bg-khajur-gold/10
                                rounded-xl
                                px-4 py-4
                                text-left
                                transition-all
                                hover:shadow-md
                            "
                        >
                            <div className="flex items-center gap-3">

                                {contactType === 'whatsapp' ? (
                                    <MessageCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                    <Phone className="w-5 h-5 text-khajur-gold" />
                                )}

                                <div>
                                    <p className="text-sm font-semibold text-khajur-primary">
                                        Support
                                    </p>

                                    <p className="text-sm text-khajur-primary/70">
                                        +91 91338 05000
                                    </p>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default FloatingButtons;
