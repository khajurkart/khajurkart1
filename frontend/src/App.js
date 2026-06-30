// App.js
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from 'sonner';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ErrorBoundary from './components/ErrorBoundary';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FloatingButtons from './components/FloatingButtons';
import ScrollToTop from "./components/ScrollToTop";

import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import OrderDetails from './pages/OrderDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import About from './pages/About';
import Contact from './pages/Contact';
import Search from './pages/Search';
import MyOrders from './pages/MyOrders';
import BulkOrders from './pages/BulkOrders';
import Account from './pages/Account';
import Profile from './pages/Profile';
import Addresses from './pages/Addresses';
import TrackOrder from './pages/TrackOrder';
import ResetPassword from './pages/ResetPassword';
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminOrders from './pages/AdminOrders';
import AdminReturns from './pages/AdminReturns';
import AdminReviews from "./pages/AdminReviews";
import Returns from './pages/Returns';
import FAQ from "./pages/FAQ";
import ThankYou from './pages/ThankYou';
import NotFound from './pages/NotFound';

// ── Policy Pages ───────────────────────────────────────────────────────────────
import DeliveryInfo from './pages/DeliveryInfo';
import ReturnsRefunds from './pages/ReturnsRefunds';
import PrivacyPolicy from './pages/PrivacyPolicy';

if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
}

function App() {
    return (
        <HelmetProvider>
            <ErrorBoundary>
                <AuthProvider>
                    <CartProvider>
                        <BrowserRouter>

                            {/* ── Skip Navigation Link (Accessibility) ── */}
                            <a
                                href="#main-content"
                                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] bg-khajur-gold text-khajur-primary px-4 py-2 text-xs font-bold uppercase tracking-widest"
                            >
                                Skip to main content
                            </a>

                            <ScrollToTop />
                            <div className="min-h-screen flex flex-col">
                                <Navbar />
                                <main id="main-content" className="flex-grow">
                                    <Routes>

                                        {/* ── Main Routes ───────────────────────────── */}
                                        <Route path="/" element={<Home />} />
                                        <Route path="/products" element={<Products />} />
                                        <Route path="/product/:id" element={<ProductDetail />} />
                                        <Route path="/bulk-orders" element={<BulkOrders />} />
                                        <Route path="/order/:id" element={<OrderDetails />} />
                                        <Route path="/cart" element={<Cart />} />
                                        <Route path="/checkout" element={<Checkout />} />
                                        <Route path="/about" element={<About />} />
                                        <Route path="/contact" element={<Contact />} />
                                        <Route path="/search" element={<Search />} />
                                        <Route path="/my-orders" element={<MyOrders />} />
                                        <Route path="/account" element={<Account />} />
                                        <Route path="/profile" element={<Profile />} />
                                        <Route path="/addresses" element={<Addresses />} />
                                        <Route path="/track-order" element={<TrackOrder />} />
                                        <Route path="/reset-password" element={<ResetPassword />} />

                                        {/* ── Admin Routes ──────────────────────────── */}
                                        <Route path="/admin/login" element={<AdminLogin />} />
                                        <Route path="/admin/dashboard" element={<AdminDashboard />} />
                                        <Route path="/admin/products" element={<AdminProducts />} />
                                        <Route path="/admin/orders" element={<AdminOrders />} />
                                        <Route path="/admin/returns" element={<AdminReturns />} />
                                        <Route path="/admin/reviews" element={<AdminReviews />} />

                                        {/* ── Support Routes ────────────────────────── */}
                                        <Route path="/returns" element={<Returns />} />
                                        <Route path="/faq" element={<FAQ />} />
                                        <Route path="/thank-you" element={<ThankYou />} />

                                        {/* ── Policy Routes ─────────────────────────── */}
                                        <Route path="/delivery-info" element={<DeliveryInfo />} />
                                        <Route path="/returns-refunds" element={<ReturnsRefunds />} />
                                        <Route path="/privacy-policy" element={<PrivacyPolicy />} />

                                        {/* ── 404 ───────────────────────────────────── */}
                                        <Route path="*" element={<NotFound />} />

                                    </Routes>
                                </main>
                                <Footer />
                                <FloatingButtons />
                                <Toaster position="top-right" richColors />
                            </div>

                        </BrowserRouter>
                    </CartProvider>
                </AuthProvider>
            </ErrorBoundary>
        </HelmetProvider>
    );
}

export default App;
