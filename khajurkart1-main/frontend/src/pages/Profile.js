import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ChevronLeft,
  User as UserIcon,
  Mail,
  Phone,
  Save,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ─── Sub-Components ────────────────────────────────────────────────────────────

// ── Avatar ─────────────────────────────────────────────────────────────────────

const Avatar = ({ name }) => {
  const initials = name
    ? name.trim().split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="
        w-20 h-20 rounded-full bg-khajur-gold/20 border-2 border-khajur-gold/30
        flex items-center justify-center
      ">
        <span className="font-serif text-2xl font-bold text-khajur-gold">
          {initials}
        </span>
      </div>
      <div className="text-center">
        <p className="font-serif text-lg font-medium text-khajur-primary">{name}</p>
        <p className="text-xs uppercase tracking-widest text-khajur-gold mt-0.5">
          Member
        </p>
      </div>
    </div>
  );
};

// ── Field ──────────────────────────────────────────────────────────────────────

const Field = ({ icon: Icon, label, hint, children }) => (
  <div className="space-y-2">
    <label className="flex items-center gap-2 text-xs uppercase tracking-widest font-medium text-khajur-dark/50">
      <Icon className="w-3.5 h-3.5 text-khajur-gold" />
      {label}
    </label>
    {children}
    {hint && (
      <p className="text-xs text-khajur-dark/40 flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3" />
        {hint}
      </p>
    )}
  </div>
);

const inputBase = `
  w-full border border-khajur-border
  text-sm text-khajur-primary placeholder:text-khajur-dark/25
  px-5 py-3.5 rounded-sm focus:outline-none transition-colors duration-200
`;

// ─── Main Component ────────────────────────────────────────────────────────────

const Profile = () => {
  const { user, token } = useAuth();
  const navigate        = useNavigate();

  const [formData, setFormData] = useState({
    name:  user?.name  || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [loading, setLoading] = useState(false);

  // ── Guard ──────────────────────────────────────────────────────────────────

  if (!user) {
    navigate('/');
    return null;
  }

  // ── Handler ────────────────────────────────────────────────────────────────

  const set = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(
        `${API}/user/profile`,
        { name: formData.name, phone: formData.phone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Profile updated successfully.');
    } catch {
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-khajur-cream py-16 md:py-24" data-testid="profile-page">
      <div className="max-w-xl mx-auto px-6 md:px-12 space-y-10">

        {/* ── Page Header ── */}
        <div className="flex items-center gap-4 border-b border-khajur-gold/20 pb-8">
          <Link
            to="/account"
            data-testid="back-to-account"
            className="text-khajur-primary hover:text-khajur-gold transition-colors"
            aria-label="Back to account"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <p className="text-xs uppercase tracking-widest text-khajur-gold mb-0.5">
              Account
            </p>
            <h1 className="font-serif text-4xl font-medium text-khajur-primary leading-tight">
              My Profile
            </h1>
          </div>
        </div>

        {/* ── Profile Card ── */}
        <div className="bg-white border border-khajur-border rounded-sm overflow-hidden">

          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-2 py-10 px-8 border-b border-khajur-border bg-khajur-cream/40">
            <Avatar name={formData.name} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-8">

            {/* Full Name */}
            <Field icon={UserIcon} label="Full Name">
              <input
                type="text"
                required
                placeholder="John Doe"
                value={formData.name}
                onChange={set('name')}
                data-testid="profile-name-input"
                className={`${inputBase} bg-white hover:border-khajur-gold/40 focus:border-khajur-gold`}
              />
            </Field>

            {/* Email — read only */}
            <Field
              icon={Mail}
              label="Email Address"
              hint="Email address cannot be changed."
            >
              <input
                type="email"
                value={formData.email}
                disabled
                data-testid="profile-email-input"
                className={`${inputBase} bg-khajur-cream/60 text-khajur-dark/50 cursor-not-allowed`}
              />
            </Field>

            {/* Phone */}
            <Field icon={Phone} label="Phone Number">
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={set('phone')}
                data-testid="profile-phone-input"
                className={`${inputBase} bg-white hover:border-khajur-gold/40 focus:border-khajur-gold`}
              />
            </Field>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              data-testid="save-profile-button"
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
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              ) : (
                <><Save className="w-4 h-4" /> Save Changes</>
              )}
            </button>
          </form>
        </div>

        {/* ── Account Note ── */}
        <p className="text-center text-xs text-khajur-dark/30 leading-relaxed">
          Your personal information is encrypted and stored securely.
          We never share your data with third parties.
        </p>

      </div>
    </div>
  );
};

export default Profile;
