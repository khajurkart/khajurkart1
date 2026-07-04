import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram } from 'lucide-react';

const QUICK_LINKS = [
    { label: 'Home', to: '/' },
    { label: 'About Us', to: '/about' },
    { label: 'Products', to: '/products' },
    { label: 'Bulk Orders', to: '/bulk-orders' },
    { label: 'Contact Us', to: '/contact' },
];

const CATEGORIES = [
    { label: 'Dates', to: '/products?category=dates' },
    { label: 'Nuts', to: '/products?category=nuts' },
    { label: 'Dry Fruits', to: '/products?category=dry-fruits' },
    { label: 'Spices', to: '/products?category=spices' },
];

const CUSTOMER_SERVICE = [
    { label: 'FAQ', to: '/faq' },
    { label: 'Returns & Refunds', to: '/returns-refunds' },
    { label: 'Delivery Info', to: '/delivery-info' },
    { label: 'Privacy Policy', to: '/privacy-policy' },
    { label: 'Track Your Order', to: '/track-order' },
];

const SOCIAL_LINKS = [
    {
        label: 'Facebook',
        href: 'https://www.facebook.com/profile.php?id=61572011713195',
        icon: <Facebook className="w-4 h-4" />,
    },
    {
        label: 'Instagram',
        href: 'https://www.instagram.com/_khajurkart_/',
        icon: <Instagram className="w-4 h-4" />,
    },
    {
        label: 'Pinterest',
        href: 'https://in.pinterest.com/khajurkart/',
        icon: (
            <img
                src="https://cdn-icons-png.flaticon.com/512/145/145808.png"
                alt="Pinterest"
                className="w-4 h-4"
            />
        ),
    },
];

const ColHeading = ({ children }) => (
    <h3 className="font-serif text-base font-medium text-khajur-gold mb-5 uppercase tracking-widest">
        {children}
    </h3>
);

const FooterLink = ({ to, children }) => (
    <li>
        <Link
            to={to}
            className="text-sm text-khajur-cream/70 hover:text-white transition-colors duration-200"
        >
            {children}
        </Link>
    </li>
);

const ContactItem = ({ icon: Icon, content, href }) => (
    <div className="flex items-start gap-3">
        <div className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-sm flex-shrink-0 mt-0.5">
            <Icon className="w-3.5 h-3.5 text-khajur-gold" />
        </div>
        {href ? (
            <a
                href={href}
                className="text-sm text-khajur-cream/70 hover:text-white transition-colors duration-200 leading-relaxed"
            >
                {content}
            </a>
        ) : (
            <div className="text-sm text-khajur-cream/70 leading-relaxed">{content}</div>
        )}
    </div>
);

const SocialButton = ({ href, label, icon }) => (
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className="
      group w-9 h-9 flex items-center justify-center
      border border-white/10 hover:border-white/40
      bg-transparent hover:bg-white/5
      text-khajur-cream/60 hover:text-white
      rounded-sm transition-all duration-300
    "
    >
        {icon}
    </a>
);

const Footer = () => (
    <footer className="bg-khajur-primary text-khajur-cream" data-testid="main-footer">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 py-16 border-b border-white/5">
                <div className="lg:col-span-3">
                    <Link to="/" className="flex items-center gap-2 mb-5 group">
                        <img
                            src="https://res.cloudinary.com/dwpqa8pgl/image/upload/v1777381692/Logo-Photoroom_nslk5u.png"
                            alt="KhajurKart Logo"
                            className="h-12 w-auto"
                        />
                        <span className="font-serif text-xl font-bold text-khajur-gold group-hover:text-khajur-gold/80 transition-colors">
                            KhajurKart
                        </span>
                    </Link>
                    <p className="text-sm text-khajur-cream/70 leading-relaxed mb-6 max-w-xs">
                        Premium destination for the world's finest dates, dry fruits, and spices — delivered to your door.
                    </p>
                    <div className="flex items-center gap-3">
                        {SOCIAL_LINKS.map((s) => (
                            <SocialButton key={s.label} {...s} />
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <ColHeading>Quick Links</ColHeading>
                    <ul className="space-y-3">
                        {QUICK_LINKS.map((link) => (
                            <FooterLink key={link.to} to={link.to}>
                                {link.label}
                            </FooterLink>
                        ))}
                    </ul>
                </div>

                <div className="lg:col-span-2">
                    <ColHeading>Categories</ColHeading>
                    <ul className="space-y-3">
                        {CATEGORIES.map((cat) => (
                            <FooterLink key={cat.to} to={cat.to}>
                                {cat.label}
                            </FooterLink>
                        ))}
                    </ul>
                </div>

                <div className="lg:col-span-2">
                    <ColHeading>Customer Service</ColHeading>
                    <ul className="space-y-3">
                        {CUSTOMER_SERVICE.map((item) => (
                            <FooterLink key={item.to} to={item.to}>
                                {item.label}
                            </FooterLink>
                        ))}
                    </ul>
                </div>

                <div className="lg:col-span-3">
                    <ColHeading>Contact Us</ColHeading>
                    <div className="space-y-4">
                        <ContactItem icon={Phone} content="+91 79810 02137" href="tel:+917981002137" />
                        <ContactItem icon={Mail} content="khajurkart@gmail.com" href="mailto:khajurkart@gmail.com" />
                        <ContactItem
                            icon={MapPin}
                            content={<>10-3-313/a, AR Raheem Residency, Hyderabad, Telangana — 500057</>}
                            href={null}
                        />
                    </div>
                </div>
            </div>

            <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-khajur-cream/50 tracking-wide">
                    © {new Date().getFullYear()} KhajurKart. All rights reserved.
                </p>
                <p className="text-xs text-khajur-cream/50 uppercase tracking-widest font-medium">
                    Crafted with care
                </p>
            </div>
        </div>
    </footer>
);

export default Footer;
