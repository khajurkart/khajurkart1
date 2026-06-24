import React from 'react';
import { RefreshCcw, XCircle, CheckCircle, CreditCard, AlertCircle, PhoneCall } from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const RETURN_SECTIONS = [
  {
    icon: CheckCircle,
    title: 'Eligible Returns',
    content: [
      {
        heading: 'Damaged or Defective Products',
        text: 'If you receive a product that is damaged, defective, or not as described, you are eligible for a full return or replacement. Please report the issue within 48 hours of delivery.',
      },
      {
        heading: 'Wrong Item Received',
        text: 'If we shipped the wrong product, we will arrange a free pickup and send the correct item at no additional cost to you.',
      },
      {
        heading: 'Quality Issues',
        text: 'If the product does not meet our quality standards — such as stale dates or improperly sealed packaging — you may raise a return request.',
      },
    ],
  },
  {
    icon: XCircle,
    title: 'Non-Returnable Items',
    content: [
      {
        heading: 'Opened or Used Products',
        text: 'For hygiene and food safety reasons, products that have been opened or partially consumed cannot be returned.',
      },
      {
        heading: 'Change of Mind',
        text: 'We are unable to accept returns due to a change of mind or if you ordered the wrong item by mistake. Please review your cart carefully before placing an order.',
      },
      {
        heading: 'Products Past Return Window',
        text: 'Return requests raised after 48 hours of delivery will not be accepted unless there are exceptional circumstances.',
      },
    ],
  },
  {
    icon: RefreshCcw,
    title: 'Return Process',
    content: [
      {
        heading: 'Step 1 — Contact Us',
        text: 'Email us at khajurkart@gmail.com or call +91 79810 02137 within 48 hours of receiving your order. Include your order number and a brief description of the issue.',
      },
      {
        heading: 'Step 2 — Submit Photos',
        text: 'Send clear photos of the product and its packaging so our team can assess the issue and initiate the return process.',
      },
      {
        heading: 'Step 3 — Pickup Arranged',
        text: 'Once your return is approved, we will arrange a free pickup from your delivery address within 2–3 business days.',
      },
      {
        heading: 'Step 4 — Refund or Replacement',
        text: 'Upon receiving and inspecting the returned item, we will process your refund or send a replacement within 5–7 business days.',
      },
    ],
  },
  {
    icon: CreditCard,
    title: 'Refund Policy',
    content: [
      {
        heading: 'Refund Timeline',
        text: 'Approved refunds are processed within 5–7 business days. Depending on your bank or payment provider, it may take an additional 3–5 days to reflect in your account.',
      },
      {
        heading: 'Refund Method',
        text: 'Refunds are credited back to the original payment method — UPI, credit/debit card, or net banking. Cash on delivery orders will be refunded via bank transfer.',
      },
      {
        heading: 'Partial Refunds',
        text: 'In cases where only part of the order is eligible for return, a partial refund will be issued for the affected items only.',
      },
    ],
  },
  {
    icon: AlertCircle,
    title: 'Cancellations',
    content: [
      {
        heading: 'Before Dispatch',
        text: 'Orders can be cancelled free of charge before they are dispatched. Contact us immediately after placing the order if you wish to cancel.',
      },
      {
        heading: 'After Dispatch',
        text: 'Once an order has been dispatched, it cannot be cancelled. You may initiate a return once the product is delivered.',
      },
      {
        heading: 'Bulk or Custom Orders',
        text: 'Bulk or custom orders are non-cancellable once confirmed, as they are specially prepared based on your requirements.',
      },
    ],
  },
  {
    icon: PhoneCall,
    title: 'Need Help?',
    content: [
      {
        heading: 'Customer Support',
        text: 'Our support team is available Monday to Saturday, 9:00 AM – 8:00 PM. We are committed to resolving your concerns as quickly as possible.',
      },
      {
        heading: 'Escalations',
        text: 'If your issue is not resolved within 7 business days, please escalate by emailing khajurkart@gmail.com with "ESCALATION" in the subject line.',
      },
    ],
  },
];

// ─── Sub-Components ────────────────────────────────────────────────────────────

const HeroSection = ({ title, subtitle, image }) => (
  <section className="relative h-[380px] bg-khajur-primary overflow-hidden">
    <img
      src={image}
      alt={title}
      className="absolute inset-0 w-full h-full object-cover opacity-20"
    />
    <div className="absolute inset-0 bg-gradient-to-r from-khajur-primary/90 to-transparent" />
    <div className="relative h-full flex items-center">
      <div className="max-w-7xl mx-auto px-6 md:px-12 w-full">
        <p className="text-xs uppercase tracking-widest text-khajur-gold mb-3">
          KhajurKart Policies
        </p>
        <h1 className="font-serif text-5xl md:text-6xl font-medium text-khajur-cream mb-4 leading-tight">
          {title}
        </h1>
        <p className="text-base text-khajur-cream/70 max-w-xl leading-relaxed">
          {subtitle}
        </p>
      </div>
    </div>
  </section>
);

const SectionCard = ({ icon: Icon, title, content }) => (
  <div className="bg-[#F8F4EC] border border-khajur-border p-8 flex flex-col gap-6">
    <div className="flex items-center gap-4">
      <div className="w-11 h-11 flex items-center justify-center bg-khajur-primary flex-shrink-0">
        <Icon className="w-5 h-5 text-khajur-gold" />
      </div>
      <h2 className="font-serif text-xl font-medium text-khajur-primary">
        {title}
      </h2>
    </div>
    <div className="h-px bg-khajur-gold/20" />
    <div className="flex flex-col gap-5">
      {content.map((item) => (
        <div key={item.heading}>
          <p className="text-xs uppercase tracking-widest font-semibold text-khajur-gold mb-1.5">
            {item.heading}
          </p>
          <p className="text-sm text-khajur-dark/60 leading-relaxed">
            {item.text}
          </p>
        </div>
      ))}
    </div>
  </div>
);

const InfoBanner = ({ text }) => (
  <div className="bg-khajur-primary px-8 py-5 flex items-center gap-4">
    <AlertCircle className="w-5 h-5 text-khajur-gold flex-shrink-0" />
    <p className="text-sm text-khajur-cream/80 leading-relaxed">{text}</p>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const ReturnsRefunds = () => (
  <div className="min-h-screen bg-white" data-testid="returns-refunds-page">

    <HeroSection
      title="Returns & Refunds"
      subtitle="We stand behind the quality of every product we deliver. Here's everything you need to know about our returns and refund process."
      image="https://images.pexels.com/photos/3944405/pexels-photo-3944405.jpeg"
    />

    <section className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col gap-12">

        <InfoBanner text="As our products are perishable food items, we follow strict return guidelines to ensure food safety. We urge customers to inspect their orders upon delivery and report any issues within 48 hours." />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {RETURN_SECTIONS.map((section) => (
            <SectionCard key={section.title} {...section} />
          ))}
        </div>

        <div className="border-t border-khajur-border pt-8 text-center">
          <p className="text-sm text-khajur-dark/50 leading-relaxed">
            For return and refund queries, contact us at{' '}
            <a
              href="mailto:khajurkart@gmail.com"
              className="text-khajur-gold hover:underline font-medium"
            >
              khajurkart@gmail.com
            </a>{' '}
            or call{' '}
            <a
              href="tel:+917981002137"
              className="text-khajur-gold hover:underline font-medium"
            >
              +91 79810 02137
            </a>
          </p>
        </div>

      </div>
    </section>

  </div>
);

export default ReturnsRefunds;
