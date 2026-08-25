import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck, Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

// ─── Sub-Components ────────────────────────────────────────────────────────────

const InputField = ({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  disabled,
  rightElement,
}) => (
  <div className="flex flex-col gap-1.5">
    <label
      htmlFor={id}
      className="text-sm font-medium text-khajur-dark/70 tracking-wide"
    >
      {label}
    </label>
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        required
        className="
          w-full px-4 py-3 bg-white border border-khajur-border
          text-khajur-primary placeholder:text-khajur-dark/30
          focus:outline-none focus:border-khajur-gold focus:ring-1 focus:ring-khajur-gold
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-150
          pr-12
        "
      />
      {rightElement && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {rightElement}
        </div>
      )}
    </div>
  </div>
);

const ErrorBanner = ({ message }) => (
  <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm text-sm">
    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
    <p>{message}</p>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login, user, isAdmin, ADMIN_EMAILS } = useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Check if already logged in as admin ────────────────────────────────────

  useEffect(() => {
    document.title = 'Admin Login — KhajurKart';
    
    // Redirect if already logged in as admin
    if (user && isAdmin()) {
      navigate('/admin/dashboard', { replace: true });
    }

    return () => {
      document.title = 'KhajurKart — Premium Dates, Dry Fruits & Spices';
    };
  }, [user, isAdmin, navigate]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleChange = (field) => (e) => {
    setError("");
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    // Validate inputs
    if (!formData.email.trim() || !formData.password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    // Pre-check if email is authorized for admin
    if (!ADMIN_EMAILS.includes(formData.email.toLowerCase().trim())) {
      setError("This email is not authorized for admin access.");
      return;
    }

    setLoading(true);

    try {
      // Use the AuthContext login method
      const userData = await login(formData.email, formData.password);

      // Double-check admin status (should already be set by login)
      if (!ADMIN_EMAILS.includes(userData.email)) {
        setError("This account does not have administrator privileges.");
        return;
      }

      // Success notification
      toast.success("Welcome back, Admin!");

      // Redirect to admin dashboard
      navigate("/admin/dashboard", { replace: true });

    } catch (err) {
      console.error("Admin login error:", err);
      
      // Handle different error types
      if (err.response?.status === 401) {
        setError("Invalid email or password. Please try again.");
      } else if (err.response?.status === 403) {
        setError("This account does not have administrator privileges.");
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Unable to sign in. Please check your credentials and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-khajur-cream flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white border border-khajur-border shadow-lg">

          {/* Header */}
          <div className="bg-khajur-primary px-8 py-10 text-center">
            <ShieldCheck className="w-12 h-12 text-khajur-gold mx-auto mb-3" />
            <h1 className="font-serif text-3xl font-medium text-khajur-cream mb-1">
              Admin Portal
            </h1>
            <p className="text-khajur-cream/60 text-sm">
              Restricted access — authorised personnel only
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} noValidate className="px-8 py-8 flex flex-col gap-5">

            {/* Error Banner */}
            {error && <ErrorBanner message={error} />}

            {/* Email */}
            <InputField
              id="admin-email"
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleChange("email")}
              placeholder="Admin Email"
              autoComplete="username"
              disabled={loading}
            />

            {/* Password */}
            <InputField
              id="admin-password"
              label="Password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange("password")}
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={loading}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  className="text-khajur-dark/40 hover:text-khajur-primary transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />
                  }
                </button>
              }
            />

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !formData.email || !formData.password}
              className="
                mt-2 w-full flex items-center justify-center gap-2
                bg-khajur-primary text-khajur-cream
                px-6 py-3.5 font-medium tracking-wide
                hover:bg-khajur-primary/90 transition-colors duration-150
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-khajur-gold focus:ring-offset-2
              "
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Sign In as Admin
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="px-8 pb-6 space-y-3">
            <div className="border-t border-khajur-border pt-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-xs text-khajur-primary hover:text-khajur-gold transition-colors underline underline-offset-2"
              >
                ← Back to main site
              </button>
            </div>
            <p className="text-xs text-khajur-dark/40 text-center">
              Access is logged and monitored. Unauthorised use is prohibited.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
