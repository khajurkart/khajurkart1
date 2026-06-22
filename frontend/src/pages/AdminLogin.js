import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck, Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ─── Constants ─────────────────────────────────────────────────────────────────

const ADMIN_EMAILS = ["admin@khajurkart.com", "khajurkart@gmail.com"];

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

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleChange = (field) => (e) => {
    setError("");
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Invalid credentials. Please try again.");
        return;
      }

      if (!ADMIN_EMAILS.includes(data.user?.email)) {
        setError("This account does not have administrator privileges.");
        return;
      }

      // Persist session
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("admin", "true");

      toast.success("Welcome back, Admin!");
      navigate("/admin/dashboard");
    } catch (err) {
      console.error("Admin login error:", err);
      setError("Unable to reach the server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-khajur-cream flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white border border-khajur-border shadow-sm">

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
              id="email"
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleChange("email")}
              placeholder="admin@khajurkart.com"
              autoComplete="email"
              disabled={loading}
            />

            {/* Password */}
            <InputField
              id="password"
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
                "Sign In"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="px-8 pb-6 text-center">
            <p className="text-xs text-khajur-dark/40">
              Access is logged and monitored. Unauthorised use is prohibited.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
