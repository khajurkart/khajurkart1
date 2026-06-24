import React, { useState } from 'react';
import { MessageCircle, Mail, X, Phone } from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const BUTTONS = [
  {
    label:     'WhatsApp',
    icon:      MessageCircle,
    testId:    'whatsapp-button',
    className: 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/30',
    action:    () => window.open('https://wa.me/917981002137', '_blank'),
    tooltip:   'Chat on WhatsApp',
  },
  {
    label:     'Email',
    icon:      Mail,
    testId:    'email-button',
    className: 'bg-khajur-gold hover:bg-khajur-gold/90 text-khajur-primary shadow-khajur-gold/30',
    action:    () => window.location.href = 'mailto:khajurkart@gmail.com',
    tooltip:   'Send us an Email',
  },
];

// ─── Sub-Components ────────────────────────────────────────────────────────────

// ── Floating Action Button ─────────────────────────────────────────────────────

const FAB = ({ icon: Icon, label, tooltip, className, action, testId, visible }) => (
  <div className="relative group flex items-center justify-end">

    {/* Tooltip */}
    <span className={`
      absolute right-14 whitespace-nowrap
      bg-khajur-primary text-khajur-cream
      text-xs font-medium px-3 py-1.5 rounded-sm
      shadow-lg pointer-events-none
      transition-all duration-200
      ${visible
        ? 'opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0'
        : 'opacity-0'
      }
    `}>
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
        w-12 h-12 rounded-full flex items-center justify-center
        shadow-lg transition-all duration-300
        hover:scale-110 hover:shadow-xl
        ${className}
        ${visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4 pointer-events-none'
        }
      `}
    >
      <Icon className="w-5 h-5" />
    </button>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const FloatingButtons = () => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="fixed bottom-8 right-8 flex flex-col items-end gap-3 z-40"
      data-testid="floating-buttons"
    >
      {/* ── Action Buttons ── */}
      {BUTTONS.map((btn) => (
        <FAB key={btn.label} {...btn} visible={open} />
      ))}

      {/* ── Toggle Button ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close contact options' : 'Open contact options'}
        className={`
          w-14 h-14 rounded-full flex items-center justify-center
          bg-khajur-primary text-khajur-cream
          shadow-[0_4px_20px_rgba(0,0,0,0.25)]
          hover:shadow-[0_4px_28px_rgba(0,0,0,0.35)]
          transition-all duration-300
          ${open ? 'rotate-45 bg-khajur-primary/90' : 'rotate-0 hover:scale-110'}
        `}
      >
        {open
          ? <X className="w-5 h-5" />
          : <Phone className="w-5 h-5" />
        }
      </button>
    </div>
  );
};

export default FloatingButtons;
