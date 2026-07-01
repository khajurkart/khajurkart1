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
    AlertCircle,
    CheckCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════════════════════════
// Constants & Configuration
// ═══════════════════════════════════════════════════════════════════════════════

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AUTH_MODES = {
    LOGIN: 'login',
    REGISTER: 'register',
    FORGOT_PASSWORD: 'forgot_password',
    VERIFY_EMAIL: 'verify_email',
};

const PASSWORD_STRENGTH = {
    WEAK: { label: 'Weak', color: 'text-red-600', score: 0 },
    MEDIUM: { label: 'Medium', color: 'text-yellow-600', score: 1 },
    STRONG: { label: 'Strong', color: 'text-green-600', score: 2 },
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
 * @param {string} password - The password to evaluate
 * @returns {Object} Password strength object with label, color, and score
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
 * @param {Object} formData - Form data to validate
 * @param {string} mode - Current authentication mode
 * @returns {Object} Validation result with isValid flag and errors object
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

    // Password validation (login and register)
    if (mode !== AUTH_MODES.VERIFY_EMAIL) {
        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < VALIDATION_RULES.password.minLength) {
            errors.password = `Password must be at least ${VALIDATION_RULES.password.minLength} characters`;
        }
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
 * @param {string} phone - Phone number input
 * @returns {string} Sanitized phone number
 */
const sanitizePhoneNumber = (phone) => {
    return phone.replace(/\D/g, '').slice(0, 10);
};

// ═══════════════════════════════════════════════════════════════════════════════
// Custom Hooks
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Custom hook for managing modal accessibility features
 * @param {boolean} isOpen - Modal open state
 * @param {Function} onClose - Close handler
 * @param {boolean} canClose - Whether modal can be closed
 */
const useModalAccessibility = (isOpen, onClose, canClose = true) => {
    const modalRef = useRef(null);

    // Escape key handler
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

    // Focus trap
    useEffect(() => {
        const handleTabKey = (e) => {
            if (!modalRef.current) return;

            const focusableElements = modalRef.current.querySelectorAll(
                'button:not([disabled]), input:not([disabled]), select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
            );

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.key === 'Tab') {
                if (e.shiftKey && document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                } else if (!e.shiftKey && document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleTabKey);

            // Auto-focus first input
            setTimeout(() => {
                const firstInput = modalRef.current?.querySelector('input:not([disabled]), button:not([disabled])');
                firstInput?.focus();
            }, 100);
        }

        return () => document.removeEventListener('keydown', handleTabKey);
    }, [isOpen]);

    return { modalRef };
};

/**
 * Custom hook for OTP countdown timer
 * @param {number} initialSeconds - Initial countdown time in seconds
 * @returns {Object} Timer state and controls
 */
const useOTPTimer = (initialSeconds = 600) => {
    const [timeLeft, setTimeLeft] = useState(initialSeconds);
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        if (!isActive || timeLeft <= 0) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setIsActive(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const reset = useCallback(() => {
        setTimeLeft(initialSeconds);
        setIsActive(true);
    }, [initialSeconds]);

    const formatTime = useMemo(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, [timeLeft]);

    return { timeLeft, formatTime, isExpired: timeLeft === 0, reset };
};

// ═══════════════════════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Form Input Component with validation and accessibility
 */
const FormInput = ({
    id,
    label,
    type = 'text',
    value,
    onChange,
    error,
    required = false,
    autoComplete,
    placeholder,
    disabled = false,
    maxLength,
    icon: Icon,
    testId,
    inputMode,
    pattern,
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasError = Boolean(error);

    return (
        <div className="space-y-2">
            <label
                htmlFor={id}
                className="block text-sm font-medium text-khajur-primary"
            >
                {label} {required && <span className="text-khajur-gold">*</span>}
            </label>

            <div className="relative">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-khajur-primary/40">
                        <Icon className="w-4 h-4" />
                    </div>
                )}

                <input
                    id={id}
                    type={type}
                    value={value}
                    onChange={onChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    disabled={disabled}
                    required={required}
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    inputMode={inputMode}
                    pattern={pattern}
                    data-testid={testId}
                    aria-invalid={hasError}
                    aria-describedby={hasError ? `${id}-error` : undefined}
                    className={`
                        w-full bg-white border-2 rounded-sm
                        ${Icon ? 'pl-10 pr-4' : 'px-4'} py-3
                        text-khajur-dark outline-none
                        transition-all duration-200
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${hasError
                            ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-200'
                            : isFocused
                                ? 'border-khajur-gold focus:ring-2 focus:ring-khajur-gold/20'
                                : 'border-khajur-primary/20 hover:border-khajur-primary/30'
                        }
                    `}
                />

                {hasError && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                        <AlertCircle className="w-4 h-4" />
                    </div>
                )}
            </div>

            {hasError && (
                <p
                    id={`${id}-error`}
                    className="text-xs text-red-600 flex items-center gap-1"
                    role="alert"
                >
                    <AlertCircle className="w-3 h-3" />
                    {error}
                </p>
            )}
        </div>
    );
};

/**
 * Password Input with strength indicator
 */
const PasswordInput = ({
    id,
    label,
    value,
    onChange,
    error,
    required = false,
    autoComplete,
    showStrength = false,
    testId,
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const strength = useMemo(() => calculatePasswordStrength(value), [value]);
    const hasError = Boolean(error);

    return (
        <div className="space-y-2">
            <label
                htmlFor={id}
                className="block text-sm font-medium text-khajur-primary"
            >
                {label} {required && <span className="text-khajur-gold">*</span>}
            </label>

            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-khajur-primary/40">
                    <Lock className="w-4 h-4" />
                </div>

                <input
                    id={id}
                    type={showPassword ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    required={required}
                    autoComplete={autoComplete}
                    data-testid={testId}
                    aria-invalid={hasError}
                    aria-describedby={hasError ? `${id}-error` : showStrength ? `${id}-strength` : undefined}
                    className={`
                        w-full bg-white border-2 rounded-sm
                        pl-10 pr-12 py-3
                        text-khajur-dark outline-none
                        transition-all duration-200
                        ${hasError
                            ? 'border-red-500 focus:border-red-600'
                            : 'border-khajur-primary/20 focus:border-khajur-gold'
                        }
                    `}
                />

                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-khajur-primary/60 hover:text-khajur-primary transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>

            {showStrength && value && !hasError && (
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-khajur-border rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-300 ${strength.color.replace('text-', 'bg-')}`}
                                style={{ width: `${((strength.score + 1) / 3) * 100}%` }}
                            />
                        </div>
                        <span
                            id={`${id}-strength`}
                            className={`text-xs font-medium ${strength.color}`}
                            role="status"
                            aria-live="polite"
                        >
                            {strength.label}
                        </span>
                    </div>
                    <p className="text-xs text-khajur-dark/50">
                        Use 8+ characters with uppercase, numbers for strong password
                    </p>
                </div>
            )}

            {hasError && (
                <p
                    id={`${id}-error`}
                    className="text-xs text-red-600 flex items-center gap-1"
                    role="alert"
                >
                    <AlertCircle className="w-3 h-3" />
                    {error}
                </p>
            )}
        </div>
    );
};

/**
 * OTP Verification Screen
 */
const OTPVerification = ({
    email,
    phone,
    sentViaPhone,
    onVerify,
    onResend,
    onBack,
    loading,
}) => {
    const [otp, setOTP] = useState('');
    const { timeLeft, formatTime, isExpired, reset } = useOTPTimer(600);
    const [resendLoading, setResendLoading] = useState(false);

    const handleOTPChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setOTP(value);

        // Auto-submit when 6 digits entered
        if (value.length === 6) {
            setTimeout(() => onVerify(value), 100);
        }
    };

    const handleResend = async () => {
        setResendLoading(true);
        try {
            await onResend();
            reset();
            setOTP('');
            toast.success('New code sent successfully');
        } catch (error) {
            toast.error('Failed to resend code');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-khajur-gold/10 rounded-full flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-8 h-8 text-khajur-gold" />
                </div>
                <div>
                    <h3 className="font-serif text-3xl font-bold text-khajur-primary">
                        Verify Your Account
                    </h3>
                    <p className="text-sm text-khajur-dark/60 mt-2">
                        Enter the 6-digit code sent to
                    </p>
                    <p className="font-semibold text-khajur-primary">
                        {sentViaPhone ? phone : email}
                    </p>
                </div>
            </div>

            {/* Alert Box */}
            <div
                className={`rounded-lg p-4 ${sentViaPhone
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-yellow-50 border border-yellow-200'
                    }`}
            >
                <p
                    className={`text-sm text-center ${sentViaPhone ? 'text-green-800' : 'text-yellow-800'
                        }`}
                >
                    {sentViaPhone ? (
                        <>
                            <Phone className="w-4 h-4 inline mr-1" />
                            <strong>Code sent to your phone!</strong>
                            <br />
                            Check SMS on {phone}
                        </>
                    ) : (
                        <>
                            <Mail className="w-4 h-4 inline mr-1" />
                            <strong>Check your inbox & spam folder!</strong>
                            <br />
                            Mark as "Not Spam" if found there
                        </>
                    )}
                </p>
            </div>

            {/* OTP Input */}
            <div className="space-y-3">
                <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    placeholder="••••••"
                    value={otp}
                    onChange={handleOTPChange}
                    maxLength={6}
                    disabled={loading}
                    aria-label="6-digit verification code"
                    className="
                        w-full bg-white border-2 border-khajur-primary/30
                        focus:border-khajur-gold rounded-sm
                        text-center font-mono font-bold text-4xl
                        tracking-[0.5em] px-4 py-6
                        outline-none transition-all
                        disabled:opacity-50
                    "
                    style={{ letterSpacing: '0.5em' }}
                />

                {/* Timer */}
                <div className="flex items-center justify-between text-sm">
                    <p className={`${isExpired ? 'text-red-600' : 'text-khajur-dark/60'}`}>
                        {isExpired ? (
                            <span className="flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                Code expired
                            </span>
                        ) : (
                            <span>⏳ Expires in {formatTime}</span>
                        )}
                    </p>
                </div>
            </div>

            {/* Resend Button */}
            <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading || (!isExpired && timeLeft > 540)}
                className="
                    w-full text-sm text-khajur-primary hover:text-khajur-gold
                    transition-colors underline disabled:opacity-50
                    disabled:cursor-not-allowed flex items-center justify-center gap-2
                "
            >
                {resendLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                    </>
                ) : (
                    <>
                        <RefreshCw className="w-4 h-4" />
                        Resend Code
                        {!isExpired && timeLeft > 540 && ` (in ${Math.ceil((timeLeft - 540) / 60)}m)`}
                    </>
                )}
            </button>

            {/* Verify Button */}
            <button
                type="button"
                onClick={() => onVerify(otp)}
                disabled={otp.length !== 6 || loading}
                className="
                    w-full bg-khajur-gold text-khajur-primary
                    hover:bg-khajur-gold/90 rounded-sm px-8 py-4
                    font-bold text-sm uppercase tracking-widest
                    transition-all disabled:opacity-50
                    disabled:cursor-not-allowed shadow-lg
                    hover:shadow-xl flex items-center justify-center gap-2
                "
            >
                {loading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying...
                    </>
                ) : (
                    <>
                        <CheckCircle className="w-4 h-4" />
                        Verify & Continue
                    </>
                )}
            </button>

            {/* Back Button */}
            <button
                type="button"
                onClick={onBack}
                disabled={loading}
                className="
                    w-full text-sm text-khajur-dark/60 hover:text-khajur-primary
                    transition-colors flex items-center justify-center gap-1
                "
            >
                <ArrowLeft className="w-4 h-4" />
                Back to registration
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
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Callback when modal closes
 */
const AuthModal = ({ isOpen, onClose }) => {
    // ─────────────────────────────────────────────────────────────────────────
    // State Management
    // ─────────────────────────────────────────────────────────────────────────

    const [mode, setMode] = useState(AUTH_MODES.LOGIN);
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [verificationData, setVerificationData] = useState({
        email: '',
        phone: '',
        sentViaPhone: false,
    });

    const { login, register, setAuth } = useAuth();
    const { modalRef } = useModalAccessibility(
        isOpen,
        onClose,
        mode !== AUTH_MODES.VERIFY_EMAIL
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Reset form when modal closes
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!isOpen) {
            setMode(AUTH_MODES.LOGIN);
            setFormData(INITIAL_FORM_STATE);
            setErrors({});
            setLoading(false);
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

        // Clear error for this field
        setErrors((prev) => ({ ...prev, [field]: '' }));
    }, []);

    const handleModeSwitch = useCallback((newMode) => {
        setMode(newMode);
        setErrors({});
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // API Handlers
    // ─────────────────────────────────────────────────────────────────────────

    const handleLogin = async () => {
        try {
            await login(formData.email, formData.password);
            toast.success('Welcome back! Login successful');
            onClose();
        } catch (error) {
            throw new Error(error.response?.data?.detail || 'Invalid email or password');
        }
    };

    const handleRegister = async () => {
        try {
            const result = await register(
                formData.name,
                formData.email,
                formData.password,
                formData.phone
            );

            setVerificationData({
                email: formData.email,
                phone: formData.phone,
                sentViaPhone: result.sms_sent || false,
            });

            setMode(AUTH_MODES.VERIFY_EMAIL);

            toast.success(
                result.sms_sent
                    ? `Verification code sent to ${formData.phone}`
                    : 'Verification code sent to your email'
            );
        } catch (error) {
            throw new Error(
                error.response?.data?.detail || 'Registration failed. Please try again'
            );
        }
    };

    const handleForgotPassword = async () => {
        try {
            const response = await fetch(
                `${BACKEND_URL}/api/auth/forgot-password?email=${encodeURIComponent(formData.email)}`,
                { method: 'POST' }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to send reset email');
            }

            toast.success('Password reset instructions sent to your email');
            handleModeSwitch(AUTH_MODES.LOGIN);
        } catch (error) {
            throw error;
        }
    };

    const handleVerifyOTP = async (otp) => {
        if (!VALIDATION_RULES.otp.test(otp)) {
            toast.error('Please enter a valid 6-digit code');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${BACKEND_URL}/api/auth/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: verificationData.email,
                    verification_code: otp,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Invalid verification code');
            }

            const data = await response.json();
            setAuth(data.access_token, data.user);

            toast.success('Account verified successfully! Welcome to KhajurKart');
            onClose();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        const response = await fetch(
            `${BACKEND_URL}/api/auth/resend-code?email=${encodeURIComponent(verificationData.email)}`,
            { method: 'POST' }
        );

        if (!response.ok) {
            throw new Error('Failed to resend code');
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
            setErrors(validation.errors);
            toast.error('Please fix the errors in the form');
            return;
        }

        setLoading(true);
        setErrors({});

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
            subtitle: 'Sign in to your account',
        },
        [AUTH_MODES.REGISTER]: {
            title: 'Create Account',
            subtitle: 'Join KhajurKart today',
        },
        [AUTH_MODES.FORGOT_PASSWORD]: {
            title: 'Reset Password',
            subtitle: 'Enter your email to reset password',
        },
        [AUTH_MODES.VERIFY_EMAIL]: {
            title: 'Verify Email',
            subtitle: 'Complete your registration',
        },
    };

    const currentConfig = modalConfig[mode];

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
            onClick={(e) => {
                if (e.target === e.currentTarget && mode !== AUTH_MODES.VERIFY_EMAIL) {
                    onClose();
                }
            }}
            role="presentation"
        >
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                className="
                    bg-khajur-cream max-w-md w-full rounded-lg shadow-2xl
                    relative border-2 border-khajur-gold/30
                    animate-slideUp
                "
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                {mode !== AUTH_MODES.VERIFY_EMAIL && (
                    <button
                        onClick={onClose}
                        aria-label="Close authentication modal"
                        className="
                            absolute top-4 right-4 z-10
                            text-khajur-primary hover:text-khajur-gold
                            transition-colors p-2 rounded-full
                            hover:bg-khajur-primary/5
                        "
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}

                {/* Modal Content */}
                <div className="p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2
                            id="modal-title"
                            className="font-serif text-4xl font-bold text-khajur-primary mb-2"
                        >
                            {currentConfig.title}
                        </h2>
                        <p className="text-khajur-dark/60 text-sm">
                            {currentConfig.subtitle}
                        </p>
                    </div>

                    {/* Forms */}
                    {mode === AUTH_MODES.VERIFY_EMAIL ? (
                        <OTPVerification
                            email={verificationData.email}
                            phone={verificationData.phone}
                            sentViaPhone={verificationData.sentViaPhone}
                            onVerify={handleVerifyOTP}
                            onResend={handleResendOTP}
                            onBack={() => handleModeSwitch(AUTH_MODES.REGISTER)}
                            loading={loading}
                        />
                    ) : (
                        <>
                            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                                {/* Register: Name Field */}
                                {mode === AUTH_MODES.REGISTER && (
                                    <FormInput
                                        id="full-name"
                                        label="Full Name"
                                        type="text"
                                        value={formData.name}
                                        onChange={handleInputChange('name')}
                                        error={errors.name}
                                        required
                                        autoComplete="name"
                                        placeholder="John Doe"
                                        icon={User}
                                        testId="register-name-input"
                                    />
                                )}

                                {/* Register: Phone Field */}
                                {mode === AUTH_MODES.REGISTER && (
                                    <FormInput
                                        id="phone"
                                        label="Phone Number"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleInputChange('phone')}
                                        error={errors.phone}
                                        required
                                        autoComplete="tel"
                                        placeholder="9876543210"
                                        maxLength={10}
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        icon={Phone}
                                        testId="register-phone-input"
                                    />
                                )}

                                {/* Email Field */}
                                <FormInput
                                    id="email"
                                    label="Email Address"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange('email')}
                                    error={errors.email}
                                    required
                                    autoComplete="email"
                                    placeholder="john@example.com"
                                    icon={Mail}
                                    testId="auth-email-input"
                                />

                                {/* Password Field */}
                                {mode !== AUTH_MODES.FORGOT_PASSWORD && (
                                    <PasswordInput
                                        id="password"
                                        label="Password"
                                        value={formData.password}
                                        onChange={handleInputChange('password')}
                                        error={errors.password}
                                        required
                                        autoComplete={mode === AUTH_MODES.LOGIN ? 'current-password' : 'new-password'}
                                        showStrength={mode === AUTH_MODES.REGISTER}
                                        testId="auth-password-input"
                                    />
                                )}

                                {/* Register: Confirm Password */}
                                {mode === AUTH_MODES.REGISTER && (
                                    <PasswordInput
                                        id="confirm-password"
                                        label="Confirm Password"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange('confirmPassword')}
                                        error={errors.confirmPassword}
                                        required
                                        autoComplete="new-password"
                                        testId="register-confirm-password-input"
                                    />
                                )}

                                {/* Forgot Password Link */}
                                {mode === AUTH_MODES.LOGIN && (
                                    <div className="text-right">
                                        <button
                                            type="button"
                                            onClick={() => handleModeSwitch(AUTH_MODES.FORGOT_PASSWORD)}
                                            className="text-sm text-khajur-primary hover:text-khajur-gold transition-colors font-medium"
                                            data-testid="forgot-password-link"
                                        >
                                            Forgot Password?
                                        </button>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    aria-busy={loading}
                                    className="
                                        w-full bg-khajur-gold text-khajur-primary
                                        hover:bg-khajur-gold/90 rounded-sm px-8 py-4
                                        uppercase tracking-widest text-xs font-bold
                                        transition-all shadow-lg hover:shadow-xl
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        flex items-center justify-center gap-2
                                    "
                                    data-testid="auth-submit-button"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Please wait...
                                        </>
                                    ) : mode === AUTH_MODES.FORGOT_PASSWORD ? (
                                        'Send Reset Link'
                                    ) : mode === AUTH_MODES.REGISTER ? (
                                        'Create Account'
                                    ) : (
                                        'Sign In'
                                    )}
                                </button>
                            </form>

                            {/* Mode Switcher */}
                            <div className="mt-6 text-center">
                                {mode === AUTH_MODES.FORGOT_PASSWORD ? (
                                    <button
                                        type="button"
                                        onClick={() => handleModeSwitch(AUTH_MODES.LOGIN)}
                                        className="text-sm text-khajur-primary hover:text-khajur-gold transition-colors inline-flex items-center gap-1"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Back to Login
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleModeSwitch(
                                                mode === AUTH_MODES.LOGIN
                                                    ? AUTH_MODES.REGISTER
                                                    : AUTH_MODES.LOGIN
                                            )
                                        }
                                        className="text-sm text-khajur-primary hover:text-khajur-gold transition-colors"
                                        data-testid="mode-switch-button"
                                    >
                                        {mode === AUTH_MODES.LOGIN
                                            ? "Don't have an account? Create one"
                                            : 'Already have an account? Sign in'}
                                    </button>
                                )}
                            </div>

                            {/* Terms & Privacy */}
                            {mode === AUTH_MODES.REGISTER && (
                                <p className="text-xs text-khajur-dark/40 text-center mt-6">
                                    By creating an account, you agree to our{' '}
                                    <a href="/terms" className="text-khajur-primary hover:text-khajur-gold underline">
                                        Terms of Service
                                    </a>{' '}
                                    and{' '}
                                    <a href="/privacy-policy" className="text-khajur-primary hover:text-khajur-gold underline">
                                        Privacy Policy
                                    </a>
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
