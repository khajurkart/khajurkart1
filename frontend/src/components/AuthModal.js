import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  X,
  Mail,
  Lock,
  User,
  Phone,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ─── Constants ─────────────────────────────────────────────────────────────────

const INITIAL_FORM = {
  name: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const getPasswordStrength = (password) => {
  if (!password) return null;
  if (password.length < 6) return { label: 'Weak',   color: 'bg-red-400',    text: 'text-red-500'    };
  if (password.match(/^(?=.*[A-Z])(?=.*[0-9])/))
    return              { label: 'Strong', color: 'bg-green-500',  text: 'text-green-600'  };
  return                { label: 'Medium', color: 'bg-yellow-400', text: 'text-yellow-600' };
};

// ─── Sub-Components ────────────────────────────────────────────────────────────

// ── Field ──────────────────────────────────────────────────────────────────────

const Field = ({ icon: Icon, label, children }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-2 text-xs uppercase tracking-widest font-medium text-khajur-dark/50">
      <Icon className="w-3.5 h-3.5 text-khajur-gold" />
      {label}
    </label>
    {children}
  </div>
);

const inputBase = `
  w-full bg-white border border-khajur-border
  hover:border-khajur-gold/40 focus:border-khajur-gold
  text-sm text-khajur-primary placeholder:text-khajur-dark/25
  px-4 py-3 rounded-sm focus:outline-none transition-colors duration-200
`;

// ── Password Input ─────────────────────────────────────────────────────────────

const PasswordInput = ({ value, onChange, testId, placeholder = 'Enter password' }) => {
  const [show, setShow] = useState(false);
  const strength = getPasswordStrength(value);

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          required
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          data-testid={testId}
          className={`${inputBase} pr-10`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-khajur-dark/40 hover:text-khajur-primary transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* Password strength */}
      {strength && (
        <div className="space-y-1">
          <div className="h-1 bg-khajur-border rounded-full overflow-hidden">
            <div className={`
              h-full rounded-full transition-all duration-300
              ${strength.label === 'Weak'   ? 'w-1/3 bg-red-400'    : ''}
              ${strength.label === 'Medium' ? 'w-2/3 bg-yellow-400' : ''}
              ${strength.label === 'Strong' ? 'w-full bg-green-500' : ''}
            `} />
          </div>
          <p className={`text-xs font-medium ${strength.text}`}>
            {strength.label} password
          </p>
        </div>
      )}
    </div>
  );
};

// ── Modal Header ───────────────────────────────────────────────────────────────

const ModalHeader = ({ title, subtitle, onClose, showClose }) => (
  <div className="text-center mb-8">
    {showClose && (
      <button
        onClick={onClose}
        className="absolute top-5 right-5 text-khajur-dark/30 hover:text-khajur-primary transition-colors"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>
    )}
    <div className="inline-flex items-center justify-center w-12 h-12 bg-khajur-gold/10 rounded-full mb-4">
      <ShieldCheck className="w-5 h-5 text-khajur-gold" />
    </div>
    <h2 className="font-serif text-3xl font-medium text-khajur-primary mb-1">{title}</h2>
    <p className="text-sm text-khajur-dark/50">{subtitle}</p>
  </div>
);

// ── Divider ────────────────────────────────────────────────────────────────────

const Divider = ({ label }) => (
  <div className="flex items-center gap-3 my-6">
    <div className="flex-1 h-px bg-khajur-border" />
    <span className="text-xs text-khajur-dark/30 uppercase tracking-widest">{label}</span>
    <div className="flex-1 h-px bg-khajur-border" />
  </div>
);

// ── Submit Button ──────────────────────────────────────────────────────────────

const SubmitButton = ({ loading, label }) => (
  <button
    type="submit"
    disabled={loading}
    data-testid="auth-submit-button"
    className="
      w-full flex items-center justify-center gap-2
      bg-khajur-gold hover:bg-khajur-gold/90
      hover:shadow-[0_0_20px_rgba(198,169,98,0.35)]
      disabled:opacity-60 disabled:cursor-not-allowed
      text-khajur-primary rounded-sm px-8 py-4
      uppercase tracking-widest text-xs font-bold
      transition-all duration-300
    "
  >
    {loading
      ? <><Loader2 className="w-4 h-4 animate-spin" /> Please wait…</>
      : label
    }
  </button>
);

// ── OTP Screen ─────────────────────────────────────────────────────────────────

const OTPScreen = ({ email, onVerify, onResend, onClose }) => {
  const [code, setCode]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    if (!code.trim()) {
      toast.error('Please enter the verification code.');
      return;
    }
    setLoading(true);
    await onVerify(code);
    setLoading(false);
  };

  const handleResend = async () => {
    setResending(true);
    await onResend();
    setResending(false);
  };

  return (
    <div className="space-y-6">
      <ModalHeader
        title="Verify Email"
        subtitle={`A 6-digit code was sent to ${email}`}
        showClose={false}
      />

      {/* Spam notice */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-sm px-4 py-3">
        <span className="text-amber-500 text-base mt-0.5">📬</span>
        <p className="text-xs text-amber-700 leading-relaxed">
          <strong>Check your spam folder.</strong> If the email landed there,
          mark it as <em>"Not Spam"</em> so future emails arrive in your inbox.
        </p>
      </div>

      {/* OTP Input */}
      <div className="space-y-2">
        <label className="block text-xs uppercase tracking-widest font-medium text-khajur-dark/50 text-center">
          Enter 6-digit Code
        </label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="——————"
          className="
            w-full bg-white border border-khajur-border focus:border-khajur-gold
            text-khajur-primary text-3xl font-bold font-mono tracking-[0.5em]
            text-center px-4 py-4 rounded-sm focus:outline-none transition-colors
          "
        />
        <p className="text-center text-xs text-khajur-dark/40">
          ⏳ Code expires in <strong>10 minutes</strong>
        </p>
      </div>

      {/* Verify */}
      <button
        onClick={handleVerify}
        disabled={loading || code.length < 6}
        className="
          w-full flex items-center justify-center gap-2
          bg-khajur-gold hover:bg-khajur-gold/90
          hover:shadow-[0_0_20px_rgba(198,169,98,0.35)]
          disabled:opacity-60 disabled:cursor-not-allowed
          text-khajur-primary rounded-sm px-8 py-4
          uppercase tracking-widest text-xs font-bold
          transition-all duration-300
        "
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</>
          : <><ShieldCheck className="w-4 h-4" /> Verify &amp; Continue</>
        }
      </button>

      {/* Resend */}
      <button
        type="button"
        onClick={handleResend}
        disabled={resending}
        className="
          w-full flex items-center justify-center gap-2
          text-xs text-khajur-dark/50 hover:text-khajur-gold
          transition-colors disabled:opacity-40
        "
      >
        {resending
          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Resending…</>
          : <><RefreshCw className="w-3.5 h-3.5" /> Didn't receive? Resend Code</>
        }
      </button>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const AuthModal = ({ isOpen, onClose }) => {
  const { login, register, setAuth } = useAuth();

  const [mode, setMode]                     = useState('login'); // 'login' | 'register' | 'forgot'
  const [showOTP, setShowOTP]               = useState(false);
  const [formData, setFormData]             = useState(INITIAL_FORM);
  const [loading, setLoading]               = useState(false);
  const [otpEmail, setOtpEmail]             = useState('');

  if (!isOpen) return null;

  const set = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const resetForm = () => setFormData(INITIAL_FORM);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'forgot') {
        const res = await fetch(
          `${API}/auth/forgot-password?email=${formData.email}`,
          { method: 'POST' }
        );
        if (res.ok) {
          toast.success('Password reset link sent to your email.');
          setMode('login');
          resetForm();
        } else {
          const err = await res.json();
          toast.error(err.detail || 'Failed to send reset link.');
        }

      } else if (mode === 'login') {
        await login(formData.email, formData.password);
        toast.success('Welcome back!');
        resetForm();
        onClose();

      } else {
        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match.');
          return;
        }
        await register(formData.name, formData.email, formData.password, formData.phone);
        toast.success('Verification code sent to your email.');
        setOtpEmail(formData.email);
        setShowOTP(true);
        setFormData((prev) => ({ ...INITIAL_FORM, email: prev.email }));
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || error.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (code) => {
    try {
      const res = await fetch(`${API}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail, verification_code: code }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.detail || 'Invalid verification code.');
        return;
      }

      const data = await res.json();
      setAuth(data.access_token, data.user);
      toast.success('Email verified successfully!');
      setShowOTP(false);
      onClose();
    } catch {
      toast.error('Verification failed. Please try again.');
    }
  };

  const handleResendOTP = async () => {
    try {
      await fetch(`${API}/auth/resend-code?email=${otpEmail}`, { method: 'POST' });
      toast.success('Verification code resent.');
    } catch {
      toast.error('Failed to resend code.');
    }
  };

  // ── Mode config ────────────────────────────────────────────────────────────

  const modeConfig = {
    login:    { title: 'Welcome Back',    subtitle: 'Sign in to your KhajurKart account.',   btn: 'Sign In'        },
    register: { title: 'Create Account',  subtitle: 'Join KhajurKart and shop premium dates.', btn: 'Create Account' },
    forgot:   { title: 'Reset Password',  subtitle: 'Enter your email to receive a reset link.', btn: 'Send Reset Link' },
  };
  const cfg = modeConfig[mode];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      data-testid="auth-modal"
      onClick={(e) => e.target === e.currentTarget && !showOTP && onClose()}
    >
      <div className="bg-white w-full max-w-md rounded-sm shadow-2xl border border-khajur-border relative max-h-[95vh] overflow-y-auto">
        <div className="px-8 py-10">

          {/* ── OTP Screen ── */}
          {showOTP ? (
            <OTPScreen
              email={otpEmail}
              onVerify={handleVerifyOTP}
              onResend={handleResendOTP}
              onClose={onClose}
            />
          ) : (
            <>
              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-5 right-5 text-khajur-dark/30 hover:text-khajur-primary transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <ModalHeader
                title={cfg.title}
                subtitle={cfg.subtitle}
                showClose={false}
              />

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Register-only fields */}
                {mode === 'register' && (
                  <>
                    <Field icon={User} label="Full Name">
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={set('name')}
                        data-testid="register-name-input"
                        className={inputBase}
                      />
                    </Field>
                    <Field icon={Phone} label="Phone Number">
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={set('phone')}
                        className={inputBase}
                      />
                    </Field>
                  </>
                )}

                {/* Email */}
                <Field icon={Mail} label="Email Address">
                  <input
                    type="email"
                    required
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={set('email')}
                    data-testid="auth-email-input"
                    className={inputBase}
                  />
                </Field>

                {/* Password */}
                {mode !== 'forgot' && (
                  <Field icon={Lock} label="Password">
                    <PasswordInput
                      value={formData.password}
                      onChange={set('password')}
                      testId="auth-password-input"
                      placeholder="Enter your password"
                    />
                  </Field>
                )}

                {/* Confirm Password */}
                {mode === 'register' && (
                  <Field icon={Lock} label="Confirm Password">
                    <div className="space-y-1">
                      <input
                        type="password"
                        required
                        placeholder="Re-enter your password"
                        value={formData.confirmPassword}
                        onChange={set('confirmPassword')}
                        className={inputBase}
                      />
                      {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <p className="text-xs text-red-500">Passwords do not match.</p>
                      )}
                    </div>
                  </Field>
                )}

                {/* Forgot password link */}
                {mode === 'login' && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      data-testid="forgot-password-link"
                      className="text-xs text-khajur-dark/50 hover:text-khajur-gold transition-colors font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <SubmitButton loading={loading} label={cfg.btn} />
              </form>

              {/* Toggle / Back */}
              <Divider label="or" />

              <div className="text-center">
                {mode === 'forgot' ? (
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="flex items-center gap-1.5 text-sm text-khajur-primary hover:text-khajur-gold transition-colors mx-auto font-medium"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Sign In
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                    className="text-sm text-khajur-dark/60 hover:text-khajur-gold transition-colors"
                  >
                    {mode === 'login' ? (
                      <>Don't have an account? <span className="font-semibold text-khajur-primary">Register</span></>
                    ) : (
                      <>Already have an account? <span className="font-semibold text-khajur-primary">Sign In</span></>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
