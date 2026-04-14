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
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");

  const { login, register } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isForgotPassword) {
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

        toast.success('OTP sent to your email');
        setShowOtp(true);
        setFormData({ name: '', phone: '', email: '', password: '', confirmPassword: '' });
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error(error.response?.data?.detail || error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

      await fetch(`${BACKEND_URL}/api/auth/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: formData.email,
          otp: otp
        })
      });

      toast.success("Verified successfully ✅");
      setShowOtp(false);
      setIsLogin(true);

    } catch (err) {
      toast.error("Invalid OTP ❌");
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-khajur-cream max-w-md w-full rounded-sm shadow-2xl relative border-2 border-khajur-gold/30">

        <button onClick={onClose} className="absolute top-4 right-4 text-khajur-primary">
          <X className="w-6 h-6" />
        </button>

        <div className="p-8">

          <h2 className="font-serif text-4xl font-bold text-khajur-primary mb-2 text-center">
            {isForgotPassword ? 'Reset Password' : isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>

          <p className="text-center text-khajur-dark/60 mb-8 text-sm">
            {isForgotPassword ? 'Enter your email to reset password' : isLogin ? 'Login to your account' : 'Join KhajurKart today'}
          </p>

          {showOtp ? (
            <div className="space-y-5">
              <h2 className="text-center text-xl font-semibold">Enter OTP</h2>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full border px-4 py-3"
              />
              <button onClick={verifyOtp} className="w-full bg-green-500 text-white py-3">
                Verify OTP
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">

                <div>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white border-2 px-4 py-3"
                  />
                </div>

                <button type="submit" className="w-full bg-khajur-gold py-3">
                  {isLogin ? 'Login' : 'Register'}
                </button>

              </form>

              <div className="mt-6 text-center">
                {isForgotPassword ? (
                  <button onClick={handleBackToLogin}>← Back to Login</button>
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
