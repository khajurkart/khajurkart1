import React, { useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const AuthModal = ({ isOpen, onClose }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);

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
          toast.success('Password reset instructions sent');
          setIsForgotPassword(false);
          setIsLogin(true);
        } else {
          toast.error('Failed to send reset email');
        }
      } 
      
      else if (isLogin) {
        await login(formData.email, formData.password);
        toast.success('Login successful');
        onClose();
      } 
      
      else {
        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords do not match");
          setLoading(false);
          return;
        }

        await register(
          formData.name,
          formData.email,
          formData.password,
          formData.phone
        );

        toast.success('OTP sent');
        setShowOtp(true);
      }

    } catch (err) {
      toast.error("Something went wrong");
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

      toast.success("Verified ✅");
      setShowOtp(false);
      setIsLogin(true);

    } catch {
      toast.error("Invalid OTP ❌");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
      <div className="bg-white p-6 w-full max-w-md relative">

        <button onClick={onClose} className="absolute right-4 top-4">
          <X />
        </button>

        <h2 className="text-xl font-bold text-center mb-4">
          {isForgotPassword
            ? "Reset Password"
            : isLogin
            ? "Login"
            : "Register"}
        </h2>

        {showOtp ? (
          <div>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full border p-2 mb-3"
            />
            <button
              onClick={verifyOtp}
              className="w-full bg-green-500 text-white p-2"
            >
              Verify OTP
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-3">

              {!isLogin && !isForgotPassword && (
                <>
                  <input
                    type="text"
                    placeholder="Name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full border p-2"
                  />

                  <input
                    type="tel"
                    placeholder="Phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full border p-2"
                  />
                </>
              )}

              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full border p-2"
              />

              {!isForgotPassword && (
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full border p-2"
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2 cursor-pointer"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </span>
                </div>
              )}

              {!isLogin && !isForgotPassword && (
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value
                    })
                  }
                  className="w-full border p-2"
                />
              )}

              <button
                type="submit"
                className="w-full bg-blue-500 text-white p-2"
              >
                {loading ? "Loading..." : isLogin ? "Login" : "Register"}
              </button>
            </form>

            {/* ✅ Properly wrapped (NO JSX ERROR) */}
            <div className="mt-4 text-center">
              {isForgotPassword ? (
                <button onClick={() => setIsForgotPassword(false)}>
                  Back to Login
                </button>
              ) : (
                <button onClick={() => setIsLogin(!isLogin)}>
                  {isLogin
                    ? "Create account"
                    : "Already have account?"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
