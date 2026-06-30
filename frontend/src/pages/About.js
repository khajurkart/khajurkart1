import React from 'react';
import { Award, Heart, Leaf, Users, MapPin, Phone, Mail } from 'lucide-react';

const About = () => {
    const values = [
        {
            icon: Award,
            title: 'Premium Quality',
            description: 'We source only the finest dates, nuts, and spices from the best regions worldwide. Every product is carefully selected and quality checked.'
        },
        {
            icon: Heart,
            title: 'Customer First',
            description: 'Your satisfaction is our priority. We strive to deliver excellence in every order with prompt support and care.'
        },
        {
            icon: Leaf,
            title: 'Natural & Pure',
            description: 'All our products are 100% natural with no artificial additives or preservatives. Pure goodness in every bite.'
        },
        {
            icon: Users,
            title: 'Trusted by Thousands',
            description: 'Join our growing family of satisfied customers across India who trust KhajurKart for their daily needs.'
        }
    ];

    const stats = [
        { number: '500+', label: 'Happy Customers' },
        { number: '50+', label: 'Premium Products' },
        { number: '100%', label: 'Natural & Pure' },
        { number: '5★', label: 'Average Rating' },
    ];

    return (
        <div className="min-h-screen" data-testid="about-page">

            {/* ===== HERO ===== */}
            <section className="relative h-[500px] bg-khajur-primary overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="https://images.pexels.com/photos/18740976/pexels-photo-18740976.jpeg"
                        alt="About KhajurKart"
                        loading="lazy"
                        className="w-full h-full object-cover opacity-20"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-khajur-primary via-khajur-primary/90 to-transparent" />
                </div>
                <div className="relative h-full flex items-center">
                    <div className="max-w-7xl mx-auto px-6 md:px-12 w-full">
                        <p className="text-khajur-gold text-sm uppercase tracking-widest mb-4 font-medium">
                            — Who We Are
                        </p>
                        <h1 className="font-serif text-5xl md:text-7xl font-medium text-khajur-cream mb-6">
                            About KhajurKart
                        </h1>
                        <p className="font-sans text-lg md:text-xl text-khajur-cream/80 max-w-2xl leading-relaxed">
                            Your premium destination for the world's finest dates, dry fruits & spices — delivered fresh to your doorstep.
                        </p>
                    </div>
                </div>
            </section>

            {/* ===== STATS ===== */}
            <section className="bg-khajur-gold py-12">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {stats.map((stat, index) => (
                            <div key={index}>
                                <p className="font-serif text-4xl font-bold text-khajur-primary mb-1">
                                    {stat.number}
                                </p>
                                <p className="text-khajur-primary/70 text-sm uppercase tracking-widest">
                                    {stat.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== STORY ===== */}
            <section className="py-20 md:py-32">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div>
                            <p className="text-khajur-gold text-sm uppercase tracking-widest mb-3 font-medium">
                                — Our Story
                            </p>
                            <h2 className="font-serif text-3xl md:text-5xl font-medium text-khajur-primary mb-8">
                                From Passion to Premium
                            </h2>
                            <div className="space-y-5 text-khajur-dark/80 leading-relaxed">
                                <p>
                                    KhajurKart was born from a deep passion for bringing the finest quality dates, nuts, and spices to Indian households. We believe that everyone deserves access to premium, authentic products that taste exceptional and contribute to a healthier lifestyle.
                                </p>
                                <p>
                                    Our journey began with a simple mission — to source the best dry fruits and spices from around the world and make them accessible at the best prices. We work directly with trusted suppliers and farmers to ensure every product meets our rigorous quality standards.
                                </p>
                                <p>
                                    Today, KhajurKart serves hundreds of satisfied customers across India, delivering not just products, but a promise of quality, authenticity, and excellence in every package.
                                </p>
                            </div>

                            {/* Highlight boxes */}
                            <div className="grid grid-cols-2 gap-4 mt-8">
                                <div className="bg-khajur-cream border border-khajur-border p-4">
                                    <p className="font-serif text-2xl font-bold text-khajur-gold">2026</p>
                                    <p className="text-sm text-khajur-dark/60 mt-1">Year Founded</p>
                                </div>
                                <div className="bg-khajur-cream border border-khajur-border p-4">
                                    <p className="font-serif text-2xl font-bold text-khajur-gold">Hyderabad</p>
                                    <p className="text-sm text-khajur-dark/60 mt-1">Based In</p>
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <img
                                src="https://images.pexels.com/photos/31496295/pexels-photo-31496295.jpeg"
                                alt="Premium Products"
                                className="w-full h-auto shadow-card"
                            />
                            {/* Floating badge */}
                            <div className="absolute -bottom-6 -left-6 bg-khajur-primary text-khajur-cream p-6 shadow-lg hidden md:block">
                                <p className="font-serif text-3xl font-bold text-khajur-gold">100%</p>
                                <p className="text-sm mt-1">Natural & Pure</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== VALUES ===== */}
            <section className="py-20 md:py-32 bg-white">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="text-center mb-16">
                        <p className="text-khajur-gold text-sm uppercase tracking-widest mb-3 font-medium">
                            — What Drives Us
                        </p>
                        <h2 className="font-serif text-3xl md:text-5xl font-medium text-khajur-primary mb-4">
                            Our Values
                        </h2>
                        <p className="font-sans text-base text-khajur-dark/70 max-w-2xl mx-auto">
                            The principles that guide everything we do at KhajurKart
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {values.map((value, index) => {
                            const Icon = value.icon;
                            return (
                                <div
                                    key={index}
                                    className="p-8 border border-khajur-primary/10 bg-khajur-cream hover:bg-white hover:border-khajur-gold hover:shadow-lg transition-all duration-300 text-center group"
                                >
                                    <div className="bg-khajur-primary/5 group-hover:bg-khajur-gold/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 transition-colors">
                                        <Icon className="w-8 h-8 text-khajur-gold" />
                                    </div>
                                    <h3 className="font-serif text-xl font-medium text-khajur-primary mb-3">
                                        {value.title}
                                    </h3>
                                    <p className="text-sm text-khajur-dark/60 leading-relaxed">
                                        {value.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ===== MISSION ===== */}
            <section className="py-20 md:py-32">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="bg-khajur-primary p-12 md:p-20 text-center relative overflow-hidden">
                        {/* Decorative circles */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-khajur-gold/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-khajur-gold/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                        <div className="relative">
                            <p className="text-khajur-gold text-sm uppercase tracking-widest mb-4 font-medium">
                                — Our Mission
                            </p>
                            <h2 className="font-serif text-3xl md:text-5xl font-medium text-khajur-cream mb-8">
                                Why We Do What We Do
                            </h2>
                            <p className="font-sans text-lg md:text-xl max-w-3xl mx-auto leading-relaxed text-khajur-cream/80">
                                To become India's most trusted destination for premium dry fruits, dates, and spices by consistently delivering exceptional quality, authentic products, and outstanding customer service — one package at a time.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== CONTACT INFO ===== */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="text-center mb-12">
                        <p className="text-khajur-gold text-sm uppercase tracking-widest mb-3 font-medium">
                            — Get In Touch
                        </p>
                        <h2 className="font-serif text-3xl md:text-4xl font-medium text-khajur-primary">
                            Contact Us
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className="text-center p-8 border border-khajur-border hover:border-khajur-gold transition-colors">
                            <MapPin className="w-8 h-8 text-khajur-gold mx-auto mb-4" />
                            <h3 className="font-serif text-lg font-medium text-khajur-primary mb-2">Address</h3>
                            <p className="text-sm text-khajur-dark/60 leading-relaxed">
                                10-3-313/a, AR Raheem Residency<br />
                                Vijaya Nagar Colony<br />
                                Hyderabad, Telangana 500057
                            </p>
                        </div>

                        <div className="text-center p-8 border border-khajur-border hover:border-khajur-gold transition-colors">
                            <Phone className="w-8 h-8 text-khajur-gold mx-auto mb-4" />
                            <h3 className="font-serif text-lg font-medium text-khajur-primary mb-2">Phone</h3>
                            <a href="tel:+917981002137" className="text-sm text-khajur-dark/60 hover:text-khajur-gold transition-colors">
                                +91 7981002137
                            </a>
                        </div>

                        <div className="text-center p-8 border border-khajur-border hover:border-khajur-gold transition-colors">
                            <Mail className="w-8 h-8 text-khajur-gold mx-auto mb-4" />
                            <h3 className="font-serif text-lg font-medium text-khajur-primary mb-2">Email</h3>
                            <a href="mailto:khajurkart@gmail.com" className="text-sm text-khajur-dark/60 hover:text-khajur-gold transition-colors">
                                khajurkart@gmail.com
                            </a>
                        </div>
                    </div>

                </div>
            </section>

        </div>
    );
};

export default About;
