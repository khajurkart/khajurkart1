import React, { useEffect } from 'react'; // ← add useEffect here
import { Shield, Eye, Database, Lock, UserCheck, AlertCircle, RefreshCcw, Mail } from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const PRIVACY_SECTIONS = [
  {
    icon: Database,
    title: 'Information We Collect',
    content: [
      {
        heading: 'Personal Information',
        text: 'When you place an order or create an account, we collect your name, email address, phone number, and delivery address to process and fulfill your orders.',
      },
      {
        heading: 'Payment Information',
        text: 'We do not store your payment details. All transactions are securely processed through our payment partners who are PCI-DSS compliant.',
      },
      {
        heading: 'Usage Data',
        text: 'We collect information on how you interact with our website, including pages visited, products viewed, and time spent, to improve your shopping experience.',
      },
      {
        heading: 'Device & Technical Data',
        text: 'We may collect your IP address, browser type, device information, and cookies to ensure the proper functioning of our website and for analytics purposes.',
      },
    ],
  },
  {
    icon: Eye,
    title: 'How We Use Your Information',
    content: [
      {
        heading: 'Order Fulfillment',
        text: 'Your personal information is primarily used to process, fulfill, and deliver your orders, and to communicate order updates with you.',
      },
      {
        heading: 'Customer Support',
        text: 'We use your information to respond to queries, complaints, and return requests in a timely and effective manner.',
      },
      {
        heading: 'Marketing Communications',
        text: 'With your consent, we may send you promotional emails, offers, and updates. You can opt out at any time by clicking "Unsubscribe" in any email.',
      },
      {
        heading: 'Website Improvement',
        text: 'Usage and analytics data helps us understand customer behavior and improve our website, product listings, and overall shopping experience.',
      },
    ],
  },
  {
    icon: Shield,
    title: 'How We Protect Your Data',
    content: [
      {
        heading: 'SSL Encryption',
        text: 'Our website uses SSL (Secure Socket Layer) encryption to protect data transmitted between your browser and our servers.',
      },
      {
        heading: 'Secure Storage',
        text: 'All personal data is stored on secure servers with restricted access. We regularly audit our security practices to maintain the highest standards.',
      },
      {
        heading: 'No Unauthorized Access',
        text: 'We implement firewalls and access controls to prevent unauthorized access to your personal information.',
      },
    ],
  },
  {
    icon: UserCheck,
    title: 'Sharing Your Information',
    content: [
      {
        heading: 'Third-Party Partners',
        text: 'We share your information only with trusted partners — including delivery and logistics providers, and payment gateways — strictly to fulfill your orders.',
      },
      {
        heading: 'Legal Requirements',
        text: 'We may disclose your information if required to do so by law or in response to valid requests by public authorities such as courts or government agencies.',
      },
      {
        heading: 'No Sale of Data',
        text: 'We will never sell, rent, or trade your personal information to third parties for marketing purposes.',
      },
    ],
  },
  {
    icon: Lock,
    title: 'Cookies Policy',
    content: [
      {
        heading: 'What Are Cookies',
        text: 'Cookies are small text files stored on your device when you visit our website. They help us remember your preferences and improve your experience.',
      },
      {
        heading: 'Types of Cookies We Use',
        text: 'We use essential cookies (for website functionality), analytical cookies (to understand usage), and preference cookies (to remember your settings).',
      },
      {
        heading: 'Managing Cookies',
        text: 'You can control and manage cookies through your browser settings. Note that disabling certain cookies may affect the functionality of our website.',
      },
    ],
  },
  {
    icon: UserCheck,
    title: 'Your Rights',
    content: [
      {
        heading: 'Access & Correction',
        text: 'You have the right to access the personal information we hold about you and request corrections if any data is inaccurate or incomplete.',
      },
      {
        heading: 'Data Deletion',
        text: 'You may request the deletion of your personal data at any time by contacting us, subject to any legal obligations we may have to retain certain information.',
      },
      {
        heading: 'Withdraw Consent',
        text: 'If you have provided consent for marketing communications, you may withdraw it at any time without affecting the lawfulness of prior processing.',
      },
    ],
  },
  {
    icon: RefreshCcw,
    title: 'Policy Updates',
    content: [
      {
        heading: 'Changes to This Policy',
        text: 'We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. The updated policy will be posted on this page with a revised date.',
      },
      {
        heading: 'Notification of Changes',
        text: 'For significant changes, we will notify registered users via email. We encourage you to review this page periodically to stay informed.',
      },
    ],
  },
  {
    icon: Mail,
    title: 'Contact & Grievances',
    content: [
      {
        heading: 'Privacy Concerns',
        text: 'If you have any questions, concerns, or complaints regarding this Privacy Policy or how we handle your data, please contact our team.',
      },
      {
        heading: 'Response Time',
        text: 'We are committed to addressing all privacy-related concerns within 7 business days of receiving your request.',
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
      fetchpriority="high"
      decoding="async"
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

// ─── Last Updated Badge ────────────────────────────────────────────────────────

const LastUpdated = () => (
  <div className="flex items-center justify-end gap-2 mb-2">
    <div className="h-px flex-1 bg-khajur-border" />
    <span className="text-[11px] uppercase tracking-widest text-khajur-dark/35 whitespace-nowrap px-3">
      Last Updated: January 2025
    </span>
    <div className="h-px flex-1 bg-khajur-border" />
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

// ← Changed from () => (...) to () => { ... return (...) }
const PrivacyPolicy = () => {

  // ── Page Title ───────────────────────────────────────────────────────────────
  useEffect(() => {
    document.title = 'Privacy Policy — KhajurKart';
    return () => {
      document.title = 'KhajurKart — Premium Dates, Dry Fruits & Spices';
    };
  }, []);

  return (
    <div className="min-h-screen bg-white" data-testid="privacy-policy-page">

      <HeroSection
        title="Privacy Policy"
        subtitle="Your privacy matters to us. This policy explains what data we collect, how we use it, and how we keep it safe."
        image="https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg"
      />

      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col gap-12">

          <LastUpdated />

          <InfoBanner text="By using the KhajurKart website and placing orders, you consent to the collection and use of your information as described in this Privacy Policy. Please read it carefully." />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PRIVACY_SECTIONS.map((section) => (
              <SectionCard key={section.title} {...section} />
            ))}
          </div>

          <div className="border-t border-khajur-border pt-8 text-center">
            <p className="text-sm text-khajur-dark/50 leading-relaxed">
              For privacy-related concerns, contact us at{' '}
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

};

export default PrivacyPolicy;
