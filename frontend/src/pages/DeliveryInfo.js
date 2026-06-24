import React from 'react';
import { Truck, Clock, MapPin, PackageCheck, AlertCircle, ShieldCheck } from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const DELIVERY_SECTIONS = [
  {
    icon: Truck,
    title: 'Shipping Methods',
    content: [
      {
        heading: 'Standard Delivery',
        text: 'Orders are delivered within 5–7 business days across India. Standard shipping is available for all pin codes we service.',
      },
      {
        heading: 'Express Delivery',
        text: 'Need it faster? Express delivery ensures your order arrives within 2–3 business days. Available for select cities and pin codes.',
      },
      {
        heading: 'Same-Day Delivery',
        text: 'Available in Hyderabad for orders placed before 12:00 PM. Subject to availability and distance from our warehouse.',
      },
    ],
  },
  {
    icon: Clock,
    title: 'Processing Time',
    content: [
      {
        heading: 'Order Processing',
        text: 'All orders are processed within 1–2 business days after payment confirmation. Orders placed on weekends or public holidays will be processed on the next business day.',
      },
      {
        heading: 'Dispatch Confirmation',
        text: 'You will receive an email and SMS notification with your tracking details once your order has been dispatched from our facility.',
      },
    ],
  },
  {
    icon: MapPin,
    title: 'Delivery Locations',
    content: [
      {
        heading: 'Pan-India Shipping',
        text: 'We ship to all major cities and towns across India. Remote or hard-to-reach areas may require additional delivery time.',
      },
      {
        heading: 'International Shipping',
        text: 'Currently, we do not offer international shipping. We are working to expand our reach globally — stay tuned for updates.',
      },
    ],
  },
  {
    icon: PackageCheck,
    title: 'Packaging',
    content: [
      {
        heading: 'Premium Packaging',
        text: 'All products are carefully packed in food-grade, airtight packaging to preserve freshness and quality during transit.',
      },
      {
        heading: 'Eco-Friendly Materials',
        text: 'We use recyclable and eco-friendly packaging materials wherever possible as part of our commitment to sustainability.',
      },
    ],
  },
  {
    icon: AlertCircle,
    title: 'Delivery Issues',
    content: [
      {
        heading: 'Failed Delivery Attempts',
        text: 'If a delivery attempt fails due to an incorrect address or unavailability of the recipient, the courier will make up to 2 more attempts before returning the package.',
      },
      {
        heading: 'Damaged in Transit',
        text: 'In the rare event that your order arrives damaged, please contact us within 48 hours with photos of the damaged item and we will resolve it promptly.',
      },
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Shipping Charges',
    content: [
      {
        heading: 'Free Shipping',
        text: 'Enjoy free standard shipping on all orders above ₹999.',
      },
      {
        heading: 'Below Minimum Order',
        text: 'A flat shipping fee of ₹60 applies to orders below ₹999.',
      },
      {
        heading: 'Express & Same-Day',
        text: 'Additional charges apply for express and same-day delivery options and will be displayed at checkout.',
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
    {/* Card Header */}
    <div className="flex items-center gap-4">
      <div className="w-11 h-11 flex items-center justify-center bg-khajur-primary flex-shrink-0">
        <Icon className="w-5 h-5 text-khajur-gold" />
      </div>
      <h2 className="font-serif text-xl font-medium text-khajur-primary">
        {title}
      </h2>
    </div>

    {/* Divider */}
    <div className="h-px bg-khajur-gold/20" />

    {/* Content Items */}
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
    <p className="text-sm text-khajur-cream/80 leading-relaxed">
      {text}
    </p>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const DeliveryInfo = () => (
  <div className="min-h-screen bg-white" data-testid="delivery-info-page">

    <HeroSection
      title="Delivery Information"
      subtitle="Everything you need to know about how we get your order to your doorstep — safely, freshly, and on time."
      image="https://images.pexels.com/photos/4246120/pexels-photo-4246120.jpeg"
    />

    <section className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col gap-12">

        {/* Info Banner */}
        <InfoBanner text="Delivery timelines may vary during peak seasons, festivals, or due to unforeseen circumstances such as natural disasters or courier disruptions. We appreciate your patience in such cases." />

        {/* Section Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {DELIVERY_SECTIONS.map((section) => (
            <SectionCard key={section.title} {...section} />
          ))}
        </div>

        {/* Contact Note */}
        <div className="border-t border-khajur-border pt-8 text-center">
          <p className="text-sm text-khajur-dark/50 leading-relaxed">
            For delivery-related queries, reach us at{' '}
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

export default DeliveryInfo;
