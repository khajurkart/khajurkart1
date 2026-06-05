import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ThankYou = () => {
  const navigate = useNavigate();

  // ✅ Auto redirect to orders after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/my-orders');
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-khajur-cream px-6">
      <div className="bg-white border border-khajur-border p-12 max-w-md w-full text-center rounded-sm shadow-lg">
        
        {/* Success Icon */}
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl">🎉</span>
        </div>

        <h1 className="font-serif text-3xl font-medium text-khajur-primary mb-4">
          Order Placed Successfully!
        </h1>

        <p className="text-khajur-dark/60 mb-2 text-sm">
          Thank you for shopping with KhajurKart
        </p>

        <p className="text-khajur-dark/60 mb-8 text-sm">
          You will receive an order confirmation email shortly.
          We will deliver your order soon! 🚚
        </p>

        {/* Divider */}
        <div className="border-t border-khajur-border my-6" />

        {/* Buttons */}
        <div className="space-y-3">
          <Link
            to="/my-orders"
            className="block w-full bg-khajur-gold text-khajur-primary hover:bg-khajur-gold/90 rounded-sm px-8 py-4 uppercase tracking-widest text-xs font-bold transition-all"
          >
            View My Orders
          </Link>
          <Link
            to="/products"
            className="block w-full bg-transparent border border-khajur-primary text-khajur-primary hover:bg-khajur-primary hover:text-khajur-cream rounded-sm px-8 py-4 uppercase tracking-widest text-xs font-bold transition-all"
          >
            Continue Shopping
          </Link>
        </div>

        <p className="text-khajur-dark/40 text-xs mt-6">
          Redirecting to your orders in 5 seconds...
        </p>

      </div>
    </div>
  );
};

export default ThankYou;
