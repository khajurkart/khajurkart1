import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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

// ═══════════════════════════════════════════════════════════════════════════════
// Constants & Configuration
// ═══════════════════════════════════════════════════════════════════════════════

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AUTH_MODES = {
    LOGIN: 'login',
    REGISTER: 'register',
    FORGOT_PASSWORD: 'forgot',
};

const PASSWORD_STRENGTH = {
    WEAK: { label: 'Weak', color: 'bg-red-400', text: 'text-red-500' },
    MEDIUM: { label: 'Medium', color: 'bg-yellow-400', text: 'text-yellow-600' },
    STRONG: { label: 'Strong', color: 'bg-green-500', text: 'text-green-600' },
};

const VALIDATION_RULES = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[6-9]\d{9}$/,
    password: {
        minLength: 6,
        hasUpperCase: /[A-Z]/,
        hasNumber: /[0-9]/,
    },
    otp: /^\d{6}$/,
};

const INITIAL_FORM_STATE = {
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
};

// ═══════════════════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculates password strength based on multiple criteria
 */
const calculatePasswordStrength = (password) => {
    if (!password || password.length < VALIDATION_RULES.password.minLength) {
        return PASSWORD_STRENGTH.WEAK;
    }

    const hasUpperCase = VALIDATION_RULES.password.hasUpperCase.test(password);
    const hasNumber = VALIDATION_RULES.password.hasNumber.test(password);
    const hasMinLength = password.length >= 8;

    if (hasUpperCase && hasNumber && hasMinLength) {
        return PASSWORD_STRENGTH.STRONG;
    }

    if ((hasUpperCase || hasNumber) && password.length >= VALIDATION_RULES.password.minLength) {
        return PASSWORD_STRENGTH.MEDIUM;
    }

    return PASSWORD_STRENGTH.WEAK;
};

/**
 * Validates form data based on current auth mode
 */
const validateFormData = (formData, mode) => {
    const errors = {};

    // Email validation
    if (!formData.email?.trim()) {
        errors.email = 'Email is required';
    } else if (!VALIDATION_RULES.email.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
    }

    if (mode === AUTH_MODES.FORGOT_PASSWORD) {
        return { isValid: Object.keys(errors).length === 0, errors };
    }

    // Password validation
    if (!formData.password) {
        errors.password = 'Password is required';
    } else if (formData.password.length < VALIDATION_RULES.password.minLength) {
        errors.password = `Password must be at least ${VALIDATION_RULES.password.minLength} characters`;
    }

    // Register-specific validation
    if (mode === AUTH_MODES.REGISTER) {
        if (!formData.name?.trim()) {
            errors.name = 'Full name is required';
        } else if (formData.name.trim().length < 2) {
            errors.name = 'Name must be at least 2 characters';
        }

        if (!formData.phone?.trim()) {
            errors.phone = 'Phone number is required';
        } else if (!VALIDATION_RULES.phone.test(formData.phone.replace(/\D/g, ''))) {
            errors.phone = 'Please enter a valid 10-digit phone number';
        }

        if (!formData.confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

/**
 * Sanitizes phone number to 10 digits
 */
const sanitizePhoneNumber = (phone) => {
    return phone.replace(/\D/g, '').slice(0, 10);
};

// ═══════════════════════════════════════════════════════════════════════════════
// Custom Hooks
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Custom hook for managing modal accessibility
 */
const useModalAccessibility = (isOpen, onClose, canClose = true) => {
    const modalRef = useRef(null);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && canClose) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose, canClose]);

    return { modalRef };
};

// ═══════════════════════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════════════════════

const inputBase = `
  w-full bg-white border border-khajur-border
  hover:border-khajur-gold/40 focus:border-khajur-gold
  text-sm text-khajur-primary placeholder:text-khajur-dark/25
  px-4 py-3 rounded-sm focus:outline-none transition-colors duration-200
`;

/**
 * Field Label Component
 */
const Field = ({ icon: Icon, label, children }) => (
    <div className="space-y-1.5">
        <label className="flex items-center gap-2 text-xs uppercase tracking-widest font-medium text-khajur-dark/50">
            <Icon className="w-3.5 h-3.5 text-khajur-gold" />
            {label}
        </label>
        {children}
    </div>
);

/**
 * Password Input with strength indicator
 */
const PasswordInput = ({
    value,
    onChange,
    testId,
    placeholder = 'Enter password',
    showStrength = false
}) => {
    const [show, setShow] = useState(false);
    const strength = useMemo(() => calculatePasswordStrength(value), [value]);

    // ✅ Only show strength bar when user has typed something
    const shouldShowStrength = showStrength && value && value.length > 0;

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
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={`${inputBase} pr-10`}
                />
                <button
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        setShow((s) => !s);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-khajur-dark/40 hover:text-khajur-primary transition-colors"
                    tabIndex={-1}
                    aria-label={show ? 'Hide password' : 'Show password'}
                >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>

            {/* ✅ Password Strength Bar - only renders when user has typed */}
            {shouldShowStrength && (
                <div className="space-y-1">
                    <div className="h-1 bg-khajur-border rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                            style={{
                                width: strength.label === 'Weak' ? '33%' :
                                    strength.label === 'Medium' ? '66%' : '100%'
                            }}
                        />
                    </div>
                    <p className={`text-xs font-medium ${strength.text}`}>
                        {strength.label} password
                    </p>
                </div>
            )}
        </div>
    );
};

/**
 * Modal Header Component
 */
const ModalHeader = ({ title, subtitle }) => (
    <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-khajur-gold/10 rounded-full mb-4">
            <ShieldCheck className="w-5 h-5 text-khajur-gold" />
        </div>
        <h2 className="font-serif text-3xl font-medium text-khajur-primary mb-1">
            {title}
        </h2>
        <p className="text-sm text-khajur-dark/50">
            {subtitle}
        </p>
    </div>
);

/**
 * Divider Component
 */
const Divider = ({ label }) => (
    <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-khajur-border" />
        <span className="text-xs text-khajur-dark/30 uppercase tracking-widest">
            {label}
        </span>
        <div className="flex-1 h-px bg-khajur-border" />
    </div>
);

/**
 * Submit Button Component
 */
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
        {loading ? (
            <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Please wait…
            </>
        ) : (
            label
        )}
    </button>
);

/**
 * OTP Verification Screen
 */
const OTPScreen = ({ email, onVerify, onResend }) => {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    const handleVerify = async () => {
        if (!code.trim() || code.length !== 6) {
            toast.error('Please enter a valid 6-digit code.');
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
            />

            {/* Spam Notice */}
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
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="000000"
                    autoComplete="one-time-code"
                    className="
                        w-full bg-white border-2 border-khajur-primary/30 
                        focus:border-khajur-gold text-khajur-primary 
                        px-4 py-4 rounded-sm outline-none text-center 
                        tracking-widest font-serif font-bold 
                        transition-colors duration-200
                    "
                    style={{ fontSize: '32px', letterSpacing: '12px' }}
                />
                <p className="text-center text-xs text-khajur-dark/40">
                    ⏳ Code expires in <strong>10 minutes</strong>
                </p>
            </div>

            {/* Verify Button */}
            <button
                onClick={handleVerify}
                disabled={loading || code.length < 6}
                className="
                    w-full bg-khajur-gold text-khajur-primary 
                    hover:bg-khajur-gold/90 hover:shadow-[0_0_15px_rgba(198,169,98,0.4)]
                    disabled:opacity-60 disabled:cursor-not-allowed 
                    rounded-sm px-8 py-4 font-serif font-bold 
                    transition-all duration-300 
                    flex items-center justify-center gap-2
                "
                style={{ fontSize: '16px', letterSpacing: '2px' }}
            >
                {loading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying…
                    </>
                ) : (
                    <>
                        <ShieldCheck className="w-4 h-4" />
                        Verify &amp; Continue
                    </>
                )}
            </button>

            {/* Resend Button */}
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
                {resending ? (
                    <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Resending…
                    </>
                ) : (
                    <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        Didn't receive? Resend Code
                    </>
                )}
            </button>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * AuthModal - Professional authentication modal component
 * Handles login, registration, password reset, and email verification
 */
const AuthModal = ({ isOpen, onClose }) => {
    // ─────────────────────────────────────────────────────────────────────────
    // State Management
    // ─────────────────────────────────────────────────────────────────────────

    const [mode, setMode] = useState(AUTH_MODES.LOGIN);
    const [showOTP, setShowOTP] = useState(false);
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [loading, setLoading] = useState(false);
    const [otpEmail, setOtpEmail] = useState('');

    const { login, register, setAuth } = useAuth();
    const { modalRef } = useModalAccessibility(isOpen, onClose, !showOTP);

    // ─────────────────────────────────────────────────────────────────────────
    // Reset form when modal closes
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!isOpen) {
            setMode(AUTH_MODES.LOGIN);
            setFormData(INITIAL_FORM_STATE);
            setShowOTP(false);
            setLoading(false);
        }
    }, [isOpen]);

    // Add this useEffect
    useEffect(() => {
        if (isOpen) {
            // Save previously focused element
            const previouslyFocused = document.activeElement;
            return () => {
                // Restore focus when modal closes
                previouslyFocused?.focus();
            };
        }
    }, [isOpen]);

    // ─────────────────────────────────────────────────────────────────────────
    // Form Handlers
    // ─────────────────────────────────────────────────────────────────────────

    const handleInputChange = useCallback((field) => (e) => {
        let value = e.target.value;

        // Sanitize phone number
        if (field === 'phone') {
            value = sanitizePhoneNumber(value);
        }

        setFormData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const resetForm = useCallback(() => {
        setFormData(INITIAL_FORM_STATE);
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // API Handlers
    // ─────────────────────────────────────────────────────────────────────────

    const handleLogin = async () => {
        try {
            await login(formData.email, formData.password);
            toast.success('Welcome back!');
            resetForm();
            onClose();
        } catch (error) {
            throw new Error(error.response?.data?.detail || 'Invalid email or password');
        }
    };

    const handleRegister = async () => {
        try {
            await register(formData.name, formData.email, formData.password, formData.phone);
            toast.success('Verification code sent to your email.');
            setOtpEmail(formData.email);
            setShowOTP(true);
            setFormData((prev) => ({ ...INITIAL_FORM_STATE, email: prev.email }));
        } catch (error) {
            throw new Error(error.response?.data?.detail || 'Registration failed. Please try again');
        }
    };

    const handleForgotPassword = async () => {
        try {
            const response = await fetch(
                `${API}/auth/forgot-password?email=${encodeURIComponent(formData.email)}`,
                { method: 'POST' }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to send reset email');
            }

            toast.success('Password reset link sent to your email.');
            setMode(AUTH_MODES.LOGIN);
            resetForm();
        } catch (error) {
            throw error;
        }
    };

    const handleVerifyOTP = async (code) => {
        try {
            const response = await fetch(`${API}/auth/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: otpEmail,
                    verification_code: code,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Invalid verification code');
            }

            const data = await response.json();
            setAuth(data.access_token, data.user);

            toast.success('Email verified successfully!');
            setShowOTP(false);
            onClose();
        } catch (error) {
            toast.error(error.message || 'Verification failed. Please try again.');
        }
    };

    const handleResendOTP = async () => {
        try {
            await fetch(`${API}/auth/resend-code?email=${encodeURIComponent(otpEmail)}`, {
                method: 'POST'
            });
            toast.success('Verification code resent.');
        } catch {
            toast.error('Failed to resend code.');
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Form Submission
    // ─────────────────────────────────────────────────────────────────────────

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form
        const validation = validateFormData(formData, mode);
        if (!validation.isValid) {
            const firstError = Object.values(validation.errors)[0];
            toast.error(firstError);
            return;
        }

        setLoading(true);

        try {
            switch (mode) {
                case AUTH_MODES.LOGIN:
                    await handleLogin();
                    break;
                case AUTH_MODES.REGISTER:
                    await handleRegister();
                    break;
                case AUTH_MODES.FORGOT_PASSWORD:
                    await handleForgotPassword();
                    break;
                default:
                    break;
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Render Guards
    // ─────────────────────────────────────────────────────────────────────────

    if (!isOpen) return null;

    // ─────────────────────────────────────────────────────────────────────────
    // Modal Content Configuration
    // ─────────────────────────────────────────────────────────────────────────

    const modalConfig = {
        [AUTH_MODES.LOGIN]: {
            title: 'Welcome Back',
            subtitle: 'Sign in to your KhajurKart account.',
            btn: 'Sign In',
        },
        [AUTH_MODES.REGISTER]: {
            title: 'Create Account',
            subtitle: 'Join KhajurKart and shop premium dates.',
            btn: 'Create Account',
        },
        [AUTH_MODES.FORGOT_PASSWORD]: {
            title: 'Reset Password',
            subtitle: 'Enter your email to receive a reset link.',
            btn: 'Send Reset Link',
        },
    };

    const cfg = modalConfig[mode];

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            data-testid="auth-modal"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !showOTP) {
                    onClose();
                }
            }}
        >
            <div
                ref={modalRef}
                className="
                    bg-white w-full max-w-md rounded-sm shadow-2xl 
                    border border-khajur-border relative 
                    max-h-[95vh] overflow-y-auto
                "
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <div className="px-8 py-10">
                    {/* OTP Screen */}
                    {showOTP ? (
                        <OTPScreen
                            email={otpEmail}
                            onVerify={handleVerifyOTP}
                            onResend={handleResendOTP}
                        />
                    ) : (
                        <>
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="
                                    absolute top-5 right-5 
                                    text-khajur-dark/30 hover:text-khajur-primary 
                                    transition-colors
                                "
                                aria-label="Close modal"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Header */}
                            <ModalHeader title={cfg.title} subtitle={cfg.subtitle} />

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                                {/* Register: Name Field */}
                                {mode === AUTH_MODES.REGISTER && (
                                    <Field icon={User} label="Full Name">
                                        <input
                                            type="text"
                                            required
                                            placeholder="John Doe"
                                            value={formData.name}
                                            onChange={handleInputChange('name')}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            data-testid="register-name-input"
                                            autoComplete="name"
                                            className={inputBase}
                                        />
                                    </Field>
                                )}

                                {/* Register: Phone Field */}
                                {mode === AUTH_MODES.REGISTER && (
                                    <Field icon={Phone} label="Phone Number">
                                        <input
                                            type="tel"
                                            required
                                            placeholder="+91 98765 43210"
                                            value={formData.phone}
                                            onChange={handleInputChange('phone')}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            autoComplete="tel"
                                            inputMode="numeric"
                                            maxLength={10}
                                            className={inputBase}
                                        />
                                    </Field>
                                )}

                                {/* Email Field */}
                                <Field icon={Mail} label="Email Address">
                                    <input
                                        type="email"
                                        required
                                        placeholder="john@example.com"
                                        value={formData.email}
                                        onChange={handleInputChange('email')}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        data-testid="auth-email-input"
                                        autoComplete="email"
                                        className={inputBase}
                                    />
                                </Field>

                                {/* Password Field */}
                                {mode !== AUTH_MODES.FORGOT_PASSWORD && (
                                    <Field icon={Lock} label="Password">
                                        <PasswordInput
                                            value={formData.password}
                                            onChange={handleInputChange('password')}
                                            testId="auth-password-input"
                                            placeholder="Enter your password"
                                            showStrength={mode === AUTH_MODES.REGISTER}
                                        />
                                    </Field>
                                )}

                                {/* Register: Confirm Password */}
                                {mode === AUTH_MODES.REGISTER && (
                                    <Field icon={Lock} label="Confirm Password">
                                        <div className="space-y-1">
                                            <input
                                                type="password"
                                                required
                                                placeholder="Re-enter your password"
                                                value={formData.confirmPassword}
                                                onChange={handleInputChange('confirmPassword')}
                                                onMouseDown={(e) => e.stopPropagation()}
                                                autoComplete="new-password"
                                                className={inputBase}
                                            />
                                            {formData.confirmPassword &&
                                                formData.password !== formData.confirmPassword && (
                                                    <p className="text-xs text-red-500">
                                                        Passwords do not match.
                                                    </p>
                                                )}
                                        </div>
                                    </Field>
                                )}

                                {/* Forgot Password Link */}
                                {mode === AUTH_MODES.LOGIN && (
                                    <div className="text-right">
                                        <button
                                            type="button"
                                            onClick={() => setMode(AUTH_MODES.FORGOT_PASSWORD)}
                                            data-testid="forgot-password-link"
                                            className="
                                                text-xs text-khajur-dark/50 
                                                hover:text-khajur-gold transition-colors 
                                                font-medium
                                            "
                                        >
                                            Forgot password?
                                        </button>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <SubmitButton loading={loading} label={cfg.btn} />
                            </form>

                            {/* Toggle / Back */}
                            <Divider label="or" />

                            <div className="text-center">
                                {mode === AUTH_MODES.FORGOT_PASSWORD ? (
                                    <button
                                        type="button"
                                        onClick={() => setMode(AUTH_MODES.LOGIN)}
                                        className="
                                            flex items-center gap-1.5 text-sm 
                                            text-khajur-primary hover:text-khajur-gold 
                                            transition-colors mx-auto font-medium
                                        "
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Back to Sign In
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setMode(
                                                mode === AUTH_MODES.LOGIN
                                                    ? AUTH_MODES.REGISTER
                                                    : AUTH_MODES.LOGIN
                                            )
                                        }
                                        className="
                                            text-sm text-khajur-dark/60 
                                            hover:text-khajur-gold transition-colors
                                        "
                                    >
                                        {mode === AUTH_MODES.LOGIN ? (
                                            <>
                                                Don't have an account?{' '}
                                                <span className="font-semibold text-khajur-primary">
                                                    Register
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                Already have an account?{' '}
                                                <span className="font-semibold text-khajur-primary">
                                                    Sign In
                                                </span>
                                            </>
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
