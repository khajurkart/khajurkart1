import React from 'react';
import { Link } from 'react-router-dom';

const ThankYou = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-khajur-cream">
      <div className="text-center px-6">
        <p className="text-6xl mb-6">🎉</p>
        <h1 className="font-serif text-4xl font-medium text-khajur-primary mb-4">
          Thank You for Your Order!
        </h1>
        <p className="text-khajur-dark/60 mb-8">
          Your order has been placed successfully. We will deliver it soon!
        </p>
        <Link
          to="/my-orders"
          className="bg-khajur-gold text-khajur-primary px-8 py-4 rounded-sm uppercase tracking-widest text-xs font-bold"
        >
          View My Orders
        </Link>
      </div>
    </div>
  );
};

export default ThankYou;
