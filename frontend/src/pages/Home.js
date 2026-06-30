import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Slider from 'react-slick';
import axios from 'axios';
import {
    ChevronRight,
    Award,
    Truck,
    Shield,
    CreditCard,
    Star,
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ─── Constants ─────────────────────────────────────────────────────────────────

const HERO_SLIDES = [
    {
        url: 'https://static.prod-images.emergentagent.com/jobs/1488ece7-7b71-4c89-a940-ced66486fd5e/images/9ef22138b1ac284627d8ada276fc5bfcc8c70f752587e055521011939341415b.png',
        title: 'Premium Dates Collection',
        subtitle: 'Discover the finest dates sourced from around the world',
        category: 'dates',
    },
    {
        url: 'https://static.prod-images.emergentagent.com/jobs/1488ece7-7b71-4c89-a940-ced66486fd5e/images/d0209b13fd7a6d1c6476d2f8679946333984b9966f56d36444d5f94197d0170f.png',
        title: 'Luxury Nuts Selection',
        subtitle: 'Handpicked nuts for your health and daily delight',
        category: 'nuts',
    },
    {
        url: 'https://images.pexels.com/photos/33654800/pexels-photo-33654800.jpeg',
        title: 'Exotic Spices',
        subtitle: 'Authentic spices for truly authentic flavours',
        category: 'spices',
    },
];

const STATUS_FEATURES = [
    {
        icon: Award,
        title: 'Premium Quality',
        description: 'Only the finest selection makes it to your table',
    },
    {
        icon: Truck,
        title: 'Fast & Free Delivery',
        description: 'Quick and secure shipping across India',
    },
    {
        icon: Shield,
        title: 'Trusted Products',
        description: '100% authentic quality guarantee',
    },
    {
        icon: CreditCard,
        title: 'Secure Payment',
        description: 'Multiple safe transaction methods',
    },
];

const REVIEWS = [
    {
        name: 'Fatima Hassan',
        image: 'https://i.pravatar.cc/150?img=47',
        rating: 5,
        text: 'The quality of dates and nuts is exceptional. Best premium dry fruits I have purchased online!',
        location: 'Hyderabad',
    },
    {
        name: 'Mohammed Abdullah',
        image: 'https://i.pravatar.cc/150?img=12',
        rating: 5,
        text: 'Fresh products, beautiful packaging, and timely delivery. KhajurKart is my go-to store now.',
        location: 'Mumbai',
    },
    {
        name: 'Aisha Rahman',
        image: 'https://i.pravatar.cc/150?img=45',
        rating: 5,
        text: 'Ordered the stuffed dates for Ramadan. Everyone loved them! Excellent quality and taste.',
        location: 'Chennai',
    },
];

const HERO_SLIDER_SETTINGS = {
    dots: true,
    infinite: true,
    speed: 1000,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    fade: true,
    cssEase: 'ease-in-out',
    lazyLoad: 'ondemand',
    pauseOnHover: false,
    appendDots: (dots) => (
        <div className="absolute bottom-6 left-0 right-0">
            <ul className="flex justify-center gap-2">{dots}</ul>
        </div>
    ),
};

// ─── Sub-Components ────────────────────────────────────────────────────────────

// ── Section Header ─────────────────────────────────────────────────────────────

const SectionHeader = ({ eyebrow, title, subtitle, light = false }) => (
    <div className="text-center mb-10">
        {eyebrow && (
            <p className={`
                text-xs uppercase tracking-widest font-semibold mb-3
                ${light ? 'text-khajur-gold' : 'text-khajur-gold'}
            `}>
                {eyebrow}
            </p>
        )}
        <h2 className={`
            font-serif text-3xl md:text-5xl font-medium mb-4
            ${light ? 'text-khajur-cream' : 'text-khajur-primary'}
        `}>
            {title}
        </h2>
        {subtitle && (
            <p className={`
                text-base max-w-2xl mx-auto leading-relaxed
                ${light ? 'text-khajur-cream/70' : 'text-khajur-dark/60'}
            `}>
                {subtitle}
            </p>
        )}
    </div>
);

// ── Thin Divider ───────────────────────────────────────────────────────────────

const Divider = () => <div className="w-full h-px bg-khajur-border" />;

// ── Product Skeleton ───────────────────────────────────────────────────────────

const ProductSkeleton = () => (
    <div className="bg-white border border-khajur-border animate-pulse">
        <div className="aspect-square bg-khajur-cream" />
        <div className="p-5 space-y-3">
            <div className="h-3 bg-khajur-cream rounded w-1/3" />
            <div className="h-4 bg-khajur-cream rounded w-3/4" />
            <div className="h-3 bg-khajur-cream rounded w-full" />
            <div className="flex items-center justify-between mt-2">
                <div className="h-6 bg-khajur-cream rounded w-1/3" />
                <div className="w-11 h-11 bg-khajur-cream rounded" />
            </div>
        </div>
    </div>
);

// ── Hero Slide ─────────────────────────────────────────────────────────────────

const HeroSlide = ({ slide, index }) => (
    <div className="relative h-[520px] md:h-[720px]">
        <img
            src={slide.url}
            alt={slide.title}
            loading={index === 0 ? 'eager' : 'lazy'}
            fetchpriority={index === 0 ? 'high' : 'low'}
            className="w-full h-full object-cover"
            width="1920"
            height="720"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-khajur-primary/85 via-khajur-primary/50 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto px-6 md:px-12 w-full">
                <div className="max-w-xl">
                    <p className="text-xs uppercase tracking-widest text-khajur-gold font-semibold mb-4">
                        KhajurKart — Premium Selection
                    </p>
                    <h1 className="font-serif text-5xl md:text-7xl font-medium text-khajur-cream mb-5 leading-tight">
                        {slide.title}
                    </h1>
                    <p className="text-lg text-khajur-cream/75 mb-8 leading-relaxed max-w-md">
                        {slide.subtitle}
                    </p>
                    <Link
                        to={`/products?category=${slide.category}`}
                        className="
                            inline-flex items-center gap-2
                            bg-khajur-gold text-khajur-primary
                            hover:bg-khajur-gold/90
                            px-8 py-3.5 text-xs font-bold uppercase tracking-widest
                            transition-all duration-300
                            hover:shadow-[0_0_20px_rgba(198,169,98,0.4)]
                        "
                        data-testid="hero-shop-now-button"
                    >
                        Shop Now
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    </div>
);

// ── Category Card ──────────────────────────────────────────────────────────────

const CategoryCard = ({ category }) => (
    <Link
        to={`/products?category=${category.slug}`}
        className="group relative overflow-hidden block"
        data-testid={`category-card-${category.slug}`}
    >
        <div className="aspect-square overflow-hidden">
            <img
                src={category.image}
                alt={category.name}
                loading="lazy"
                width="400"
                height="400"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
        </div>
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-khajur-primary/90 via-khajur-primary/30 to-transparent" />
        {/* Bottom text */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
            <h3 className="font-serif text-2xl font-medium text-khajur-cream mb-1">
                {category.name}
            </h3>
            {category.description && (
                <p className="text-sm text-khajur-cream/70 line-clamp-1">
                    {category.description}
                </p>
            )}
            <div className="mt-3 flex items-center gap-1.5 text-khajur-gold text-xs font-semibold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Explore <ChevronRight className="w-3.5 h-3.5" />
            </div>
        </div>
    </Link>
);

// ── Feature Card ───────────────────────────────────────────────────────────────

const FeatureCard = ({ feature, index }) => {
    const Icon = feature.icon;
    return (
        <div
            className="
                group flex flex-col items-center text-center
                p-8 border border-khajur-border bg-khajur-cream
                hover:bg-white hover:border-khajur-gold hover:shadow-lg
                transition-all duration-300
            "
            data-testid={`status-feature-${index}`}
        >
            <div className="w-14 h-14 bg-khajur-primary/5 flex items-center justify-center mb-5 group-hover:bg-khajur-gold/10 transition-colors">
                <Icon className="w-7 h-7 text-khajur-gold" aria-hidden="true" />
            </div>
            <h3 className="font-serif text-lg font-medium text-khajur-primary mb-2">
                {feature.title}
            </h3>
            <p className="text-sm text-khajur-dark/55 leading-relaxed">
                {feature.description}
            </p>
        </div>
    );
};

// ── Review Card ────────────────────────────────────────────────────────────────

const ReviewCard = ({ review, index }) => (
    <div
        className="bg-khajur-cream border border-khajur-border p-8 flex flex-col gap-5"
        data-testid={`review-${index}`}
    >
        {/* Stars */}
        <div className="flex gap-1" aria-label={`${review.rating} out of 5 stars`}>
            {Array.from({ length: review.rating }, (_, i) => (
                <Star key={i} className="w-4 h-4 fill-khajur-gold text-khajur-gold" aria-hidden="true" />
            ))}
        </div>

        {/* Quote */}
        <p className="text-sm text-khajur-dark/75 leading-relaxed italic flex-1">
            "{review.text}"
        </p>

        {/* Reviewer */}
        <div className="flex items-center gap-4 pt-4 border-t border-khajur-border">
            <img
                src={review.image}
                alt={review.name}
                loading="lazy"
                width="48"
                height="48"
                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
            />
            <div>
                <p className="font-serif text-base font-medium text-khajur-primary">
                    {review.name}
                </p>
                {review.location && (
                    <p className="text-xs text-khajur-dark/40 mt-0.5">{review.location}</p>
                )}
            </div>
        </div>
    </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const Home = () => {
    const [categories, setCategories] = useState([]);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const [categoriesRes, productsRes] = await Promise.all([
                axios.get(`${API}/categories`),
                axios.get(`${API}/products?featured=true`),
            ]);
            setCategories(categoriesRes.data);
            setFeaturedProducts(productsRes.data);
        } catch {
            // fail silently
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div className="min-h-screen bg-white" data-testid="home-page">
            {/* ── Hero Slider ──────────────────────────────────────────────────────── */}
            <section className="relative" data-testid="hero-slider">
                <Slider {...HERO_SLIDER_SETTINGS}>
                    {HERO_SLIDES.map((slide, index) => (
                        <HeroSlide key={index} slide={slide} index={index} />
                    ))}
                </Slider>
            </section>

            {/* ── Categories Grid ──────────────────────────────────────────────────── */}
            <section className="py-16 md:py-20 bg-white" data-testid="categories-section">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <SectionHeader
                        eyebrow="Browse by Category"
                        title="Explore Our Collections"
                        subtitle="Discover premium categories of dates, nuts, dry fruits, and exotic spices"
                    />
                    {categories.length === 0 && !loading ? (
                        <p className="text-center text-khajur-dark/40 text-sm py-12">
                            No categories available at the moment.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {categories.map((category) => (
                                <CategoryCard key={category.id} category={category} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <Divider />

            {/* ── Featured Products ─────────────────────────────────────────────────── */}
            <section className="py-16 md:py-20 bg-white" data-testid="featured-products-section">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <SectionHeader
                        eyebrow="Handpicked For You"
                        title="Featured Products"
                        subtitle="Our most loved premium selection — curated for discerning customers"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {loading
                            ? Array.from({ length: 4 }, (_, i) => <ProductSkeleton key={i} />)
                            : featuredProducts.slice(0, 4).map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))
                        }
                    </div>
                    {!loading && (
                        <div className="text-center mt-12">
                            <Link
                                to="/products"
                                className="
                                    inline-flex items-center gap-2
                                    bg-khajur-primary text-khajur-cream
                                    hover:bg-khajur-primary/90
                                    px-8 py-3.5 text-xs font-bold uppercase tracking-widest
                                    transition-all duration-300
                                    border border-transparent hover:border-khajur-gold
                                "
                                data-testid="view-all-products-button"
                            >
                                View All Products
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            <Divider />

            {/* ── Bulk Orders Banner ────────────────────────────────────────────────── */}
            <section className="py-16 bg-khajur-primary">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="max-w-xl">
                            <p className="text-xs uppercase tracking-widest text-khajur-gold font-semibold mb-3">
                                For Businesses & Events
                            </p>
                            <h2 className="font-serif text-3xl md:text-4xl font-medium text-khajur-cream mb-4">
                                Bulk Orders Available
                            </h2>
                            <p className="text-khajur-cream/65 text-base leading-relaxed">
                                Special pricing for offices, hotels, restaurants and event planners.
                                Minimum order ₹5,000. Free delivery within Hyderabad.
                            </p>
                        </div>
                        <Link
                            to="/bulk-orders"
                            className="
                                flex-shrink-0 inline-flex items-center gap-2
                                bg-khajur-gold text-khajur-primary
                                hover:bg-khajur-gold/90
                                px-10 py-4 text-xs font-bold uppercase tracking-widest
                                transition-all duration-300
                                hover:shadow-[0_0_20px_rgba(198,169,98,0.35)]
                            "
                        >
                            Get a Bulk Quote
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>

            <Divider />

            {/* ── Trust Features ────────────────────────────────────────────────────── */}
            <section className="py-16 md:py-20" data-testid="status-section">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <SectionHeader
                        eyebrow="Why Choose Us"
                        title="The KhajurKart Promise"
                        subtitle="We are committed to quality, authenticity, and your satisfaction"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {STATUS_FEATURES.map((feature, index) => (
                            <FeatureCard key={index} feature={feature} index={index} />
                        ))}
                    </div>
                </div>
            </section>

            <Divider />

            {/* ── Customer Reviews ──────────────────────────────────────────────────── */}
            <section className="py-16 md:py-20 bg-white" data-testid="reviews-section">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <SectionHeader
                        eyebrow="Customer Stories"
                        title="What Our Customers Say"
                        subtitle="Trusted by thousands of happy customers across India"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {REVIEWS.map((review, index) => (
                            <ReviewCard key={index} review={review} index={index} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Final CTA Banner ──────────────────────────────────────────────────── */}
            <section className="py-16 bg-khajur-cream border-t border-khajur-border">
                <div className="max-w-3xl mx-auto px-6 md:px-12 text-center">
                    <p className="text-xs uppercase tracking-widest text-khajur-gold font-semibold mb-4">
                        Start Shopping
                    </p>
                    <h2 className="font-serif text-3xl md:text-4xl font-medium text-khajur-primary mb-5">
                        Taste the Difference of Premium Quality
                    </h2>
                    <p className="text-khajur-dark/60 text-base leading-relaxed mb-8 max-w-xl mx-auto">
                        From gift-worthy dates to everyday nuts and spices — find everything
                        you need in one trusted store.
                    </p>
                    <Link
                        to="/products"
                        className="
                            inline-flex items-center gap-2
                            bg-khajur-primary text-khajur-cream
                            hover:bg-khajur-primary/90
                            px-10 py-4 text-xs font-bold uppercase tracking-widest
                            transition-all duration-300
                            border border-transparent hover:border-khajur-gold
                        "
                    >
                        Shop All Products
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>

        </div>
    );
};

export default Home;
