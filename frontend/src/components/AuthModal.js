import React, { useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const AuthModal = ({ isOpen, onClose }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showverification_code, setShowverification_code] = useState(false);
  const [verification_code, setverification_code] = useState("");

  const { login, register } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isForgotPassword) {
        // Handle forgot password
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
        const response = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email })
        });

        if (response.ok) {
          toast.success('Password reset instructions sent to your email');
          setIsForgotPassword(false);
          setIsLogin(true);
        } else {
          const error = await response.json();
          toast.error(error.detail || 'Failed to send reset email');
        }
      } else if (isLogin) {
        await login(formData.email, formData.password);
        toast.success('Login successful');
        onClose();
        setFormData({ name: '', email: '', password: '', phone: '' });
      } else {
        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords do not match");
          setLoading(false);
          return;
        }
        await register(formData.name, formData.email, formData.password, formData.phone);

        toast.success('verification_code sent to your email');
        setShowverification_code(true);   // ✅ SHOW OTP SCREEN
        setFormData({
          name: '',
          phone: '',
          email: formData.email, // ✅ KEEP EMAIL
          password: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error(error.response?.data?.detail || error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const verifyverification_code = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

      await fetch(`${BACKEND_URL}/api/auth/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: formData.email,
          verification_code: verification_code
        })
      });

      toast.success("Verified successfully ✅");
      setShowverification_code(false);
      onClose(); // ✅ close modal instead of forcing login screen

    } catch (err) {
      toast.error("Invalid verification_code ❌");
    }
  };

  const handleBackToLogin = () => {
    setIsForgotPassword(false);
    setIsLogin(true);
  };

  const getPasswordStrength = (password) => {
    if (password.length < 6) return "Weak";
    if (password.match(/^(?=.*[A-Z])(?=.*[0-9])/)) return "Strong";
    return "Medium";
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" data-testid="auth-modal">
      <div className="bg-khajur-cream max-w-md w-full rounded-sm shadow-2xl relative border-2 border-khajur-gold/30">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-khajur-primary hover:text-khajur-gold transition-colors"
          data-testid="close-auth-modal"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8">
          <h2 className="font-serif text-4xl font-bold text-khajur-primary mb-2 text-center">
            {isForgotPassword ? 'Reset Password' : isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-center text-khajur-dark/60 mb-8 text-sm">
            {isForgotPassword ? 'Enter your email to reset password' : isLogin ? 'Login to your account' : 'Join KhajurKart today'}
          </p>

          {showverification_code ? (
            <div className="space-y-5">
              <h2 className="text-center text-xl font-semibold text-khajur-primary">
                Enter verification_code
              </h2>

              <input
                type="text"
                placeholder="Enter verification_code"
                value={verification_code}
                onChange={(e) => setverification_code(e.target.value)}
                className="w-full bg-white border-2 border-khajur-primary/20 focus:border-khajur-gold text-khajur-dark px-4 py-3 rounded-sm outline-none"
              />

              <button
                onClick={verifyverification_code}
                className="w-full bg-khajur-gold text-khajur-primary hover:bg-khajur-gold/90 rounded-sm px-8 py-4 uppercase tracking-widest text-xs font-bold transition-all"
              >
                VERIFYED 
              </button>
            </div>

          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && !isForgotPassword && (
                  <div>
                    <label className="block text-sm font-medium text-khajur-primary mb-2">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-white border-2 border-khajur-primary/20 focus:border-khajur-gold text-khajur-dark px-4 py-3 rounded-sm focus:ring-0 outline-none transition-colors"
                      data-testid="register-name-input"
                    />
                  </div>
                )}

                {!isLogin && !isForgotPassword && (
                  <div>
                    <label className="block text-sm font-medium text-khajur-primary mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full bg-white border-2 border-khajur-primary/20 focus:border-khajur-gold text-khajur-dark px-4 py-3 rounded-sm"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-khajur-primary mb-2">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white border-2 border-khajur-primary/20 focus:border-khajur-gold text-khajur-dark px-4 py-3 rounded-sm focus:ring-0 outline-none transition-colors"
                    data-testid="auth-email-input"
                  />
                </div>

                {!isForgotPassword && (
                  <div>
                    <label className="block text-sm font-medium text-khajur-primary mb-2">Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full bg-white border-2 border-khajur-primary/20 focus:border-khajur-gold text-khajur-dark px-4 py-3 pr-10 rounded-sm focus:ring-0 outline-none transition-colors"
                        data-testid="auth-password-input"
                      />
                      <span
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-khajur-primary">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </span>
                      {formData.password && (
                        <p className={`text-sm mt-1 ${getPasswordStrength(formData.password) === "Strong"
                            ? "text-green-600"
                            : getPasswordStrength(formData.password) === "Medium"
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          Password Strength: {getPasswordStrength(formData.password)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {!isLogin && !isForgotPassword && (
                  <div>
                    <label className="block text-sm font-medium text-khajur-primary mb-2">Confirm Password *</label>

                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={formData.confirmPassword || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, confirmPassword: e.target.value })
                        }
                        className="w-full bg-white border-2 border-khajur-primary/20 focus:border-khajur-gold text-khajur-dark px-4 py-3 pr-10 rounded-sm"
                      />

                      <span
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-khajur-primary"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </span>
                    </div>

                    {formData.confirmPassword &&
                      formData.password !== formData.confirmPassword && (
                        <p className="text-red-500 text-sm mt-1">
                          Passwords do not match
                        </p>
                      )}
                  </div>
                )}

                {isLogin && !isForgotPassword && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-sm text-khajur-primary hover:text-khajur-gold transition-colors font-medium"
                      data-testid="forgot-password-link"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-khajur-gold text-khajur-primary hover:bg-khajur-gold/90 hover:shadow-[0_0_15px_rgba(198,169,98,0.4)] rounded-sm px-8 py-4 uppercase tracking-widest text-xs font-bold transition-all mt-6 disabled:opacity-50"
                  data-testid="auth-submit-button"
                >
                  {loading ? 'Please wait...' : isForgotPassword ? 'Send Reset Link' : (isLogin ? 'Login' : 'Register')}
                </button>
              </form>

              {/* ✅ FIX: this div must be INSIDE fragment */}
              <div className="mt-6 text-center">
                {isForgotPassword ? (
                  <button onClick={handleBackToLogin}>
                    ← Back to Login
                  </button>
                ) : (
                  <button onClick={() => setIsLogin(!isLogin)}>
                    {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
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
