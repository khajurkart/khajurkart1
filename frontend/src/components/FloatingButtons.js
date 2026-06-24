import React from 'react';
import { MessageCircle, Mail, Phone } from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const BUTTONS = [
    {
        label: 'WhatsApp',
        icon: MessageCircle,
        testId: 'whatsapp-button',
        className: 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/30',
        action: () => window.open('https://wa.me/917981002137', '_blank'),
        tooltip: 'Chat on WhatsApp',
    },
    {
        label: 'Email',
        icon: Mail,
        testId: 'email-button',
        className: 'bg-khajur-gold hover:bg-khajur-gold/90 text-khajur-primary shadow-khajur-gold/30',

        // ✅ Opens Gmail directly in browser — no OS popup
        action: () => window.open(
            'https://mail.google.com/mail/?view=cm&to=khajurkart@gmail.com',
            '_blank'
        ),
        tooltip: 'Send us an Email',
    },
    {
        label: 'Call Us',
        icon: Phone,
        testId: 'phone-button',
        className: 'bg-khajur-primary hover:bg-khajur-primary/90 text-khajur-cream shadow-khajur-primary/30',
        action: () => window.location.href = 'tel:+917981002137',
        tooltip: 'Call Us',
    },
];

// ─── Sub-Components ────────────────────────────────────────────────────────────

const FAB = ({ icon: Icon, label, tooltip, className, action, testId }) => (
    <div className="relative group flex items-center justify-end">

        {/* Tooltip */}
        <span className="
      absolute right-14 whitespace-nowrap
      bg-khajur-primary text-khajur-cream
      text-xs font-medium px-3 py-1.5 rounded-sm
      shadow-lg pointer-events-none
      opacity-0 group-hover:opacity-100
      translate-x-1 group-hover:translate-x-0
      transition-all duration-200
    ">
            {tooltip}
            {/* Tooltip arrow */}
            <span className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-khajur-primary rotate-45" />
        </span>

        {/* Button */}
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

// ─── Main Component ────────────────────────────────────────────────────────────

const FloatingButtons = () => (
    <div
        className="fixed bottom-8 right-8 flex flex-col items-end gap-3 z-40"
        data-testid="floating-buttons"
    >
        {BUTTONS.map((btn) => (
            <FAB key={btn.label} {...btn} />
        ))}
    </div>
);

export default FloatingButtons;
