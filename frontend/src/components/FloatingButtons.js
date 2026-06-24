import React, { useState } from 'react';
import { MessageCircle, Mail, X, Phone } from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const ACTIONS = [
  {
    icon: MessageCircle,
    label: 'WhatsApp',
    description: 'Chat with us',
    onClick: () => window.open('https://wa.me/917981002137', '_blank'),
    className: 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/30',
    testId: 'whatsapp-button',
  },
  {
    icon: Mail,
    label: 'Email',
    description: 'Send us a mail',
    onClick: () => window.location.href = 'mailto:khajurkart@gmail.com',
    className: 'bg-khajur-gold hover:bg-khajur-gold/90 text-khajur-primary shadow-khajur-gold/30',
    testId: 'email-button',
  },
  {
    icon: Phone,
    label: 'Call Us',
    description: 'Talk to support',
    onClick: () => window.location.href = 'tel:+917981002137',
    className: 'bg-khajur-primary hover:bg-khajur-primary/90 text-khajur-cream shadow-khajur-primary/30',
    testId: 'call-button',
  },
];

// ─── Sub-Components ────────────────────────────────────────────────────────────

// ── Action Item ────────────────────────────────────────────────────────────────

const ActionItem = ({ icon: Icon, label, description, onClick, className, testId, visible }) => (
  <div
    className={`
      flex items-center gap-3 justify-end
      transition-all duration-300 ease-out
      ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
    `}
  >
    {/* Label tooltip */}
    <div className="flex flex-col items-end">
      <span className="text-xs font-semibold text-white bg-khajur-primary/80 backdrop-blur-sm px-2.5 py-1 rounded-sm whitespace-nowrap">
        {label}
      </span>
    </div>

    {/* Icon Button */}
    <button
      onClick={onClick}
      aria-label={label}
      data-testid={testId}
      className={`
        w-12 h-12 rounded-full flex items-center justify-center
        shadow-lg transition-all duration-300
        hover:scale-110 hover:shadow-xl
        ${className}
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
      className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-3"
      data-testid="floating-buttons"
    >

      {/* ── Action Items — visible when open ── */}
      <div className="flex flex-col gap-3">
        {ACTIONS.map((action, index) => (
          <ActionItem
            key={action.label}
            {...action}
            visible={open}
          />
        ))}
      </div>

      {/* ── Toggle Button ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close contact options' : 'Open contact options'}
        data-testid="floating-toggle"
        className={`
          w-14 h-14 rounded-full flex items-center justify-center
          shadow-[0_8px_24px_rgba(0,0,0,0.2)]
          transition-all duration-300
          hover:scale-110 hover:shadow-[0_12px_32px_rgba(0,0,0,0.25)]
          ${open
            ? 'bg-red-500 hover:bg-red-600 text-white rotate-0'
            : 'bg-khajur-gold hover:bg-khajur-gold/90 text-khajur-primary'
          }
        `}
      >
        <div className={`transition-transform duration-300 ${open ? 'rotate-0' : 'rotate-0'}`}>
          {open
            ? <X className="w-5 h-5" />
            : <MessageCircle className="w-5 h-5" />
          }
        </div>
      </button>

    </div>
  );
};

export default FloatingButtons;
