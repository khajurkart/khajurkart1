import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-khajur-cream">
      <div className="text-center px-6">
        <h1 className="font-serif text-9xl font-bold text-khajur-gold mb-4">
          404
        </h1>
        <h2 className="font-serif text-3xl font-medium text-khajur-primary mb-4">
          Page Not Found
        </h2>
        <p className="text-khajur-dark/60 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button
          onClick={() => navigate('/')}
          className="bg-khajur-gold text-khajur-primary hover:bg-khajur-gold/90 rounded-sm px-8 py-4 uppercase tracking-widest text-xs font-bold transition-all"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;
