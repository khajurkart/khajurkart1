import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ErrorBoundary from './components/ErrorBoundary';
import AdminProtectedRoute from './components/AdminProtectedRoute';

// ── Eagerly loaded components (always needed) ──────────────────────────────────
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FloatingButtons from './components/FloatingButtons';
import ScrollToTop from "./components/ScrollToTop";

// ── Lazy loaded pages ──────────────────────────────────────────────────────────
// Main Pages
const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const OrderDetails = lazy(() => import('./pages/OrderDetails'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Search = lazy(() => import('./pages/Search'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const BulkOrders = lazy(() => import('./pages/BulkOrders'));

// Account Pages
const Account = lazy(() => import('./pages/Account'));
const Profile = lazy(() => import('./pages/Profile'));
const Addresses = lazy(() => import('./pages/Addresses'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

// Admin Pages
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/AdminProducts'));
const AdminOrders = lazy(() => import('./pages/AdminOrders'));
const AdminReturns = lazy(() => import('./pages/AdminReturns'));
const AdminReviews = lazy(() => import("./pages/AdminReviews"));

// Support Pages
const Returns = lazy(() => import('./pages/Returns'));
const FAQ = lazy(() => import("./pages/FAQ"));
const ThankYou = lazy(() => import('./pages/ThankYou'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Policy Pages
const DeliveryInfo = lazy(() => import('./pages/DeliveryInfo'));
const ReturnsRefunds = lazy(() => import('./pages/ReturnsRefunds'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));

// ── Loading Fallback ───────────────────────────────────────────────────────────

const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
            <div className="animate-spin w-10 h-10 border-4 border-khajur-gold border-t-transparent rounded-full" />
            <p className="text-sm text-khajur-dark/50 font-medium">Loading...</p>
        </div>
    </div>
);

// ── Scroll Restoration ─────────────────────────────────────────────────────────

if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
}

// ── Main App Component ─────────────────────────────────────────────────────────

function App() {
    return (
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

                        <div className="min-h-screen flex flex-col">
                            <Navbar />

                            <main id="main-content" className="flex-grow">
                                <Suspense fallback={<PageLoader />}>
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
                                        <Route
                                            path="/admin/dashboard"
                                            element={
                                                <AdminProtectedRoute>
                                                    <AdminDashboard />
                                                </AdminProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/admin/products"
                                            element={
                                                <AdminProtectedRoute>
                                                    <AdminProducts />
                                                </AdminProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/admin/orders"
                                            element={
                                                <AdminProtectedRoute>
                                                    <AdminOrders />
                                                </AdminProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/admin/returns"
                                            element={
                                                <AdminProtectedRoute>
                                                    <AdminReturns />
                                                </AdminProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/admin/reviews"
                                            element={
                                                <AdminProtectedRoute>
                                                    <AdminReviews />
                                                </AdminProtectedRoute>
                                            }
                                        />

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
                                </Suspense>
                            </main>

                            <Footer />
                            <FloatingButtons />
                            <ScrollToTop />
                            <Toaster position="top-right" richColors />
                        </div>

                    </BrowserRouter>
                </CartProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
}

export default App;
