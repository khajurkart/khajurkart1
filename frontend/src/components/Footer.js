import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-khajur-primary text-khajur-cream" data-testid="main-footer">
            <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    {/* Brand */}
                    <div>
                        <Link to="/" className="flex items-center space-x-2.5 mb-4">
                            <img
                                src="https://res.cloudinary.com/dwpqa8pgl/image/upload/v1777381692/Logo-Photoroom_nslk5u.png"
                                alt="KhajurKart Logo"
                                className="h-15 w-auto -mr-1"
                            />
                            <span className="font-serif text-2xl font-bold text-khajur-gold">
                                KhajurKart
                            </span>
                        </Link>
                        <p className="text-sm text-khajur-cream/70 leading-relaxed">
                            Premium destination for the world's finest dates, dry fruits, and spices.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-serif text-lg font-medium text-khajur-gold mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            <li><Link to="/" className="text-sm hover:text-khajur-gold transition-colors">Home</Link></li>
                            <li><Link to="/about" className="text-sm hover:text-khajur-gold transition-colors">About Us</Link></li>
                            <li><Link to="/products" className="text-sm hover:text-khajur-gold transition-colors">Products</Link></li>
                            <li><Link to="/contact" className="text-sm hover:text-khajur-gold transition-colors">Contact Us</Link></li>
                            <li><Link to="/returns" className="text-sm hover:text-khajur-gold transition-colors">Returns & Exchange</Link></li>
                            <li><Link to="/faq">FAQ</Link></li>
                        </ul>
                    </div>

                    {/* Categories */}
                    <div>
                        <h3 className="font-serif text-lg font-medium text-khajur-gold mb-4">Categories</h3>
                        <ul className="space-y-2">
                            <li><Link to="/products?category=dates" className="text-sm hover:text-khajur-gold transition-colors">Dates</Link></li>
                            <li><Link to="/products?category=nuts" className="text-sm hover:text-khajur-gold transition-colors">Nuts</Link></li>
                            <li><Link to="/products?category=dry-fruits" className="text-sm hover:text-khajur-gold transition-colors">Dry Fruits</Link></li>
                            <li><Link to="/products?category=spices" className="text-sm hover:text-khajur-gold transition-colors">Spices</Link></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="font-serif text-lg font-medium text-khajur-gold mb-4">Contact Us</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start space-x-3">
                                <Phone className="w-5 h-5 text-khajur-gold flex-shrink-0 mt-0.5" />
                                <span className="text-sm">7981002137</span>
                            </li>
                            <li className="flex items-start space-x-3">
                                <Mail className="w-5 h-5 text-khajur-gold flex-shrink-0 mt-0.5" />
                                <span className="text-sm">khajurkart@gmail.com</span>
                            </li>
                            <li className="flex items-start space-x-3">
                                <MapPin className="w-5 h-5 text-khajur-gold flex-shrink-0 mt-0.5" />
                                <span className="text-sm">
                                    10-3-313/a, AR Raheem Residency<br />
                                    beside gove IASE college,<br />
                                    Potti Sriramulu Nagar,<br />
                                    Vijaya Nagar Colony,<br />
                                    Hyderabad, Telangana 500057
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-khajur-gold/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-sm text-khajur-cream/70 mb-4 md:mb-0">
                        © 2026 KhajurKart. All rights reserved.
                    </p>
                    <div className="flex items-center space-x-5">

                        <a
                            href="https://www.facebook.com/profile.php?id=61572011713195"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-full border border-khajur-gold/30 hover:border-khajur-gold hover:bg-khajur-gold/10 transition-all hover:scale-110"
                        >
                            <Facebook className="w-5 h-5 text-khajur-cream hover:text-khajur-gold" />
                        </a>

                        <a
                            href="https://www.instagram.com/_khajurkart_/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-full border border-khajur-gold/30 hover:border-khajur-gold hover:bg-khajur-gold/10 transition-all hover:scale-110"
                        >
                            <Instagram className="w-5 h-5 text-khajur-cream hover:text-khajur-gold" />
                        </a>

                        <a
                            href="https://in.pinterest.com/khajurkart/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-full border border-khajur-gold/30 hover:border-khajur-gold hover:bg-khajur-gold/10 transition-all hover:scale-110"
                        >
                            <img
                                src="https://cdn-icons-png.flaticon.com/512/145/145808.png"
                                alt="Pinterest"
                                className="w-5 h-5"
                            />
                        </a>

                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
