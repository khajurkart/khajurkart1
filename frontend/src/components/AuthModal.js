import React, { useState, useEffect, useRef } from 'react';
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
    const [sentViaPhone, setSentViaPhone] = useState(false);

    const { login, register, setAuth } = useAuth();

    // ✅ Ref for focus trap
    const modalRef = useRef(null);
    const firstFocusableRef = useRef(null);
    const lastFocusableRef = useRef(null);

    // ✅ Escape key handler
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && !showverification_code) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // ✅ Prevent background scroll
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose, showverification_code]);

    // ✅ Focus trap — Tab key stays inside modal
    useEffect(() => {
        const handleTabKey = (e) => {
            if (!modalRef.current) return;

            const focusableElements = modalRef.current.querySelectorAll(
                'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
            );

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    // Shift+Tab — going backwards
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    // Tab — going forwards
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleTabKey);
            // ✅ Auto-focus first input when modal opens
            setTimeout(() => {
                const firstInput = modalRef.current?.querySelector('input, button');
                if (firstInput) firstInput.focus();
            }, 50);
        }
        return () => document.removeEventListener('keydown', handleTabKey);
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isForgotPassword) {
                const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
                const response = await fetch(
                    `${BACKEND_URL}/api/auth/forgot-password?email=${formData.email}`,
                    { method: 'POST' }
                );
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
                const result = await register(
                    formData.name,
                    formData.email,
                    formData.password,
                    formData.phone
                );
                if (result.sms_sent) {
                    toast.success(`Verification code sent to ${formData.phone}`);
                    setSentViaPhone(true);
                } else {
                    toast.success('Verification code sent to your email');
                    setSentViaPhone(false);
                }
                setShowverification_code(true);
                setFormData({
                    name: '',
                    phone: '',
                    email: formData.email,
                    password: '',
                    confirmPassword: ''
                });
            }
        } catch (error) {
            toast.error(
                error.response?.data?.detail || error.message || 'Authentication failed'
            );
        } finally {
            setLoading(false);
        }
    };

    const verifyverification_code = async () => {
        if (!verification_code) {
            toast.error("Please enter verification code ❌");
            return;
        }
        try {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
            const res = await fetch(`${BACKEND_URL}/api/auth/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    verification_code: verification_code
                })
            });

            if (!res.ok) {
                const err = await res.json();
                toast.error(err.detail || "Invalid verification code ❌");
                return;
            }

            const data = await res.json();
            setAuth(data.access_token, data.user);
            toast.success("Verified successfully ✅");
            setShowverification_code(false);
            setverification_code("");
            onClose();
        } catch (err) {
            toast.error("Invalid verification code ❌");
        }
    };

    const resendCode = async () => {
        try {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
            await fetch(
                `${BACKEND_URL}/api/auth/resend-code?email=${formData.email}`,
                { method: "POST" }
            );
            toast.success("Verification code resent ✅");
        } catch (err) {
            toast.error("Failed to resend code ❌");
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
        // ✅ Backdrop click closes modal
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            data-testid="auth-modal"
            onClick={(e) => {
                if (e.target === e.currentTarget && !showverification_code) {
                    onClose();
                }
            }}
            role="presentation"
        >
            {/* ✅ Modal with proper ARIA attributes */}
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                className="bg-khajur-cream max-w-md w-full rounded-sm shadow-2xl relative border-2 border-khajur-gold/30"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ✅ Close button with aria-label */}
                {!showverification_code && (
                    <button
                        onClick={onClose}
                        aria-label="Close dialog"
                        className="absolute top-4 right-4 text-khajur-primary hover:text-khajur-gold transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                )}

                <div className="p-8">
                    {/* ✅ id="modal-title" for aria-labelledby */}
                    <h2
                        id="modal-title"
                        className="font-serif text-4xl font-bold text-khajur-primary mb-2 text-center"
                    >
                        {isForgotPassword
                            ? 'Reset Password'
                            : isLogin
                                ? 'Welcome Back'
                                : 'Create Account'}
                    </h2>
                    <p className="text-center text-khajur-dark/60 mb-8 text-sm">
                        {isForgotPassword
                            ? 'Enter your email to reset password'
                            : isLogin
                                ? 'Login to your account'
                                : 'Join KhajurKart today'}
                    </p>

                    {showverification_code ? (
                        <div className="space-y-4">
                            <h3 className="text-center font-serif text-3xl font-bold text-khajur-primary">
                                Enter Verification Code
                            </h3>
                            <p className="text-center text-sm text-khajur-dark/60">
                                Code sent to <strong className="text-khajur-primary">{formData.email}</strong>
                            </p>

                            {/* Spam / SMS info box */}
                            {sentViaPhone ? (
                                <div style={{
                                    background: '#dcfce7',
                                    border: '1px solid #16a34a',
                                    borderRadius: '8px',
                                    padding: '12px 16px',
                                }}>
                                    <p style={{ margin: 0, color: '#15803d', fontSize: '13px', textAlign: 'center' }}>
                                        📱 <strong>Code sent to your phone!</strong><br />
                                        Check your SMS on <strong>{formData.phone}</strong>
                                    </p>
                                </div>
                            ) : (
                                <div style={{
                                    background: '#fff3cd',
                                    border: '1px solid #ffc107',
                                    borderRadius: '8px',
                                    padding: '12px 16px',
                                }}>
                                    <p style={{ margin: 0, color: '#856404', fontSize: '13px', textAlign: 'center' }}>
                                        📬 <strong>Check your Spam folder!</strong><br />
                                        If in spam, mark as <strong>"Not Spam"</strong>
                                    </p>
                                </div>
                            )}

                            {/* ✅ OTP input with numeric keyboard */}
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                autoComplete="one-time-code"
                                placeholder="000000"
                                value={verification_code}
                                onChange={(e) => setverification_code(e.target.value.replace(/[^0-9]/g, ''))}
                                className="w-full bg-white border-2 border-khajur-primary/30 focus:border-khajur-gold text-khajur-primary px-4 py-4 rounded-sm outline-none text-center font-serif font-bold"
                                style={{ fontSize: '32px', letterSpacing: '12px' }}
                                maxLength={6}
                                aria-label="6-digit verification code"
                            />

                            <p className="text-center text-xs text-khajur-dark/50">
                                ⏳ Code expires in <strong>10 minutes</strong>
                            </p>

                            <button
                                onClick={resendCode}
                                className="w-full text-sm text-khajur-primary hover:text-khajur-gold transition-colors underline"
                            >
                                {sentViaPhone
                                    ? "Didn't receive SMS? Resend Code"
                                    : "Didn't receive email? Resend Code"}
                            </button>

                            <button
                                onClick={verifyverification_code}
                                className="w-full bg-khajur-gold text-khajur-primary hover:bg-khajur-gold/90 rounded-sm px-8 py-4 font-serif font-bold transition-all"
                                style={{ fontSize: '16px', letterSpacing: '2px' }}
                            >
                                VERIFY MY EMAIL
                            </button>
                        </div>
                    ) : (
                        <>
                            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                                {!isLogin && !isForgotPassword && (
                                    <div>
                                        {/* ✅ Proper label/id linking */}
                                        <label
                                            htmlFor="full-name"
                                            className="block text-sm font-medium text-khajur-primary mb-2"
                                        >
                                            Full Name *
                                        </label>
                                        <input
                                            id="full-name"
                                            type="text"
                                            required
                                            autoComplete="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-white border-2 border-khajur-primary/20 focus:border-khajur-gold text-khajur-dark px-4 py-3 rounded-sm focus:ring-0 outline-none transition-colors"
                                            data-testid="register-name-input"
                                        />
                                    </div>
                                )}

                                {!isLogin && !isForgotPassword && (
                                    <div>
                                        <label
                                            htmlFor="phone"
                                            className="block text-sm font-medium text-khajur-primary mb-2"
                                        >
                                            Phone Number *
                                        </label>
                                        <input
                                            id="phone"
                                            type="tel"
                                            required
                                            autoComplete="tel"
                                            inputMode="numeric"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full bg-white border-2 border-khajur-primary/20 focus:border-khajur-gold text-khajur-dark px-4 py-3 rounded-sm"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block text-sm font-medium text-khajur-primary mb-2"
                                    >
                                        Email Address *
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        autoComplete="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-white border-2 border-khajur-primary/20 focus:border-khajur-gold text-khajur-dark px-4 py-3 rounded-sm focus:ring-0 outline-none transition-colors"
                                        data-testid="auth-email-input"
                                    />
                                </div>

                                {!isForgotPassword && (
                                    <div>
                                        <label
                                            htmlFor="password"
                                            className="block text-sm font-medium text-khajur-primary mb-2"
                                        >
                                            Password *
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                required
                                                autoComplete={isLogin ? "current-password" : "new-password"}
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full bg-white border-2 border-khajur-primary/20 focus:border-khajur-gold text-khajur-dark px-4 py-3 pr-10 rounded-sm focus:ring-0 outline-none transition-colors"
                                                data-testid="auth-password-input"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-khajur-primary"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                            {formData.password && (
                                                <p
                                                    className={`text-sm mt-1 ${getPasswordStrength(formData.password) === "Strong"
                                                        ? "text-green-600"
                                                        : getPasswordStrength(formData.password) === "Medium"
                                                            ? "text-yellow-600"
                                                            : "text-red-600"
                                                        }`}
                                                    role="status"
                                                    aria-live="polite"
                                                >
                                                    Password Strength: {getPasswordStrength(formData.password)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {!isLogin && !isForgotPassword && (
                                    <div>
                                        <label
                                            htmlFor="confirm-password"
                                            className="block text-sm font-medium text-khajur-primary mb-2"
                                        >
                                            Confirm Password *
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="confirm-password"
                                                type={showPassword ? "text" : "password"}
                                                required
                                                autoComplete="new-password"
                                                value={formData.confirmPassword || ""}
                                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                className="w-full bg-white border-2 border-khajur-primary/20 focus:border-khajur-gold text-khajur-dark px-4 py-3 pr-10 rounded-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-khajur-primary"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {formData.confirmPassword &&
                                            formData.password !== formData.confirmPassword && (
                                                <p
                                                    className="text-red-500 text-sm mt-1"
                                                    role="alert"
                                                >
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
                                    aria-busy={loading}
                                    className="w-full bg-khajur-gold text-khajur-primary hover:bg-khajur-gold/90 hover:shadow-[0_0_15px_rgba(198,169,98,0.4)] rounded-sm px-8 py-4 uppercase tracking-widest text-xs font-bold transition-all mt-6 disabled:opacity-50"
                                    data-testid="auth-submit-button"
                                >
                                    {loading
                                        ? 'Please wait...'
                                        : isForgotPassword
                                            ? 'Send Reset Link'
                                            : isLogin ? 'Login' : 'Register'}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                {isForgotPassword ? (
                                    <button
                                        onClick={handleBackToLogin}
                                        className="text-sm text-khajur-primary hover:text-khajur-gold transition-colors"
                                    >
                                        ← Back to Login
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setIsLogin(!isLogin)}
                                        className="text-sm text-khajur-primary hover:text-khajur-gold transition-colors"
                                    >
                                        {isLogin
                                            ? "Don't have an account? Register"
                                            : 'Already have an account? Login'}
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
