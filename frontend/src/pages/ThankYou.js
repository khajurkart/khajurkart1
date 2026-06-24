import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Package, ShoppingBag, ArrowRight, Truck } from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const REDIRECT_SECONDS = 5;

// ─── Sub-Components ────────────────────────────────────────────────────────────

// ── Animated Checkmark ─────────────────────────────────────────────────────────

const SuccessIcon = () => (
  <div className="relative flex items-center justify-center mb-8">
    {/* Outer pulse ring */}
    <div className="absolute w-24 h-24 rounded-full bg-green-100 animate-ping opacity-30" />
    {/* Inner circle */}
    <div className="relative w-20 h-20 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
      <CheckCircle2 className="w-10 h-10 text-green-500" strokeWidth={1.5} />
    </div>
  </div>
);

// ── Countdown Bar ──────────────────────────────────────────────────────────────

const CountdownBar = ({ seconds, total }) => (
  <div className="space-y-2">
    <div className="h-0.5 w-full bg-khajur-border rounded-full overflow-hidden">
      <div
        className="h-full bg-khajur-gold transition-all duration-1000 ease-linear rounded-full"
        style={{ width: `${((total - seconds) / total) * 100}%` }}
      />
    </div>
    <p className="text-center text-xs text-khajur-dark/40">
      Redirecting to your orders in{' '}
      <span className="font-semibold text-khajur-primary">{seconds}s</span>…
    </p>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const ThankYou = () => {
  const navigate                  = useNavigate();
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  // ── Countdown + Redirect ───────────────────────────────────────────────────

  useEffect(() => {
    // Redirect after N seconds
    const redirectTimer = setTimeout(() => {
      navigate('/my-orders');
    }, REDIRECT_SECONDS * 1000);

    // Tick countdown every second
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(redirectTimer);
      clearInterval(countdownInterval);
    };
  }, [navigate]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen bg-khajur-cream flex items-center justify-center px-6 py-16"
      data-testid="thank-you-page"
    >
      <div className="w-full max-w-md">

        {/* ── Card ── */}
        <div className="bg-white border border-khajur-border rounded-sm shadow-[0_8px_40px_rgba(0,0,0,0.08)] overflow-hidden">

          {/* Gold top accent */}
          <div className="h-1 w-full bg-khajur-gold" />

          <div className="px-10 py-12 text-center">

            {/* ── Success Icon ── */}
            <SuccessIcon />

            {/* ── Heading ── */}
            <p className="text-xs uppercase tracking-widest text-khajur-gold font-medium mb-2">
              Order Confirmed
            </p>
            <h1 className="font-serif text-3xl font-medium text-khajur-primary mb-4 leading-tight">
              Thank You for Your Order!
            </h1>
            <p className="text-sm text-khajur-dark/55 leading-relaxed mb-8">
              Your order has been placed successfully. We'll send a confirmation
              email shortly and deliver your order as soon as possible.
            </p>

            {/* ── Delivery Note ── */}
            <div className="flex items-center justify-center gap-2 bg-khajur-cream rounded-sm px-4 py-3 mb-8">
              <Truck className="w-4 h-4 text-khajur-gold flex-shrink-0" />
              <p className="text-xs text-khajur-dark/60">
                Expected delivery within <strong className="text-khajur-primary">1–3 business days</strong>
              </p>
            </div>

            {/* ── Divider ── */}
            <div className="border-t border-khajur-border mb-8" />

            {/* ── Action Buttons ── */}
            <div className="space-y-3">
              <Link
                to="/my-orders"
                className="
                  flex items-center justify-center gap-2
                  w-full bg-khajur-gold hover:bg-khajur-gold/90
                  hover:shadow-[0_0_20px_rgba(198,169,98,0.35)]
                  text-khajur-primary rounded-sm px-8 py-4
                  uppercase tracking-widest text-xs font-bold
                  transition-all duration-300
                "
              >
                <Package className="w-4 h-4" />
                View My Orders
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/products"
                className="
                  flex items-center justify-center gap-2
                  w-full bg-transparent border border-khajur-border
                  hover:border-khajur-primary hover:bg-khajur-primary
                  text-khajur-primary hover:text-khajur-cream
                  rounded-sm px-8 py-4
                  uppercase tracking-widest text-xs font-bold
                  transition-all duration-300
                "
              >
                <ShoppingBag className="w-4 h-4" />
                Continue Shopping
              </Link>
            </div>

            {/* ── Countdown ── */}
            <div className="mt-8">
              <CountdownBar seconds={countdown} total={REDIRECT_SECONDS} />
            </div>

          </div>
        </div>

        {/* ── Below card note ── */}
        <p className="text-center text-xs text-khajur-dark/30 mt-6">
          Questions? Contact us at{' '}
          <a
            href="mailto:khajurkart@gmail.com"
            className="text-khajur-gold hover:underline"
          >
            khajurkart@gmail.com
          </a>
        </p>

      </div>
    </div>
  );
};

export default ThankYou;
