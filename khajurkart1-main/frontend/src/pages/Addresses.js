import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ChevronLeft,
  MapPin,
  Plus,
  Trash2,
  Pencil,
  Star,
  Loader2,
  X,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ─── Constants ─────────────────────────────────────────────────────────────────

const EMPTY_ADDRESS = {
  name: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
};

const FIELDS = [
  { key: 'name',     label: 'Full Name',     placeholder: 'John Doe',          type: 'text',     half: true  },
  { key: 'phone',    label: 'Phone Number',  placeholder: '+91 98765 43210',   type: 'tel',      half: true  },
  { key: 'address',  label: 'Street Address',placeholder: '123, MG Road…',     type: 'textarea', half: false },
  { key: 'city',     label: 'City',          placeholder: 'Hyderabad',         type: 'text',     half: true  },
  { key: 'state',    label: 'State',         placeholder: 'Telangana',         type: 'text',     half: true  },
  { key: 'pincode',  label: 'Pincode',       placeholder: '500001',            type: 'text',     half: true  },
];

// ─── Sub-Components ────────────────────────────────────────────────────────────

// ── Loading ────────────────────────────────────────────────────────────────────

const LoadingScreen = () => (
  <div className="min-h-screen bg-khajur-cream flex flex-col items-center justify-center gap-3 text-khajur-dark/50">
    <Loader2 className="w-8 h-8 animate-spin" />
    <p className="text-sm">Loading your addresses…</p>
  </div>
);

// ── Empty State ────────────────────────────────────────────────────────────────

const EmptyState = ({ onAdd }) => (
  <div className="bg-white border border-khajur-border rounded-sm p-16 flex flex-col items-center text-center gap-6">
    <div className="w-16 h-16 flex items-center justify-center bg-khajur-cream rounded-full">
      <MapPin className="w-7 h-7 text-khajur-dark/30" />
    </div>
    <div>
      <p className="font-serif text-2xl font-medium text-khajur-primary mb-2">
        No addresses saved
      </p>
      <p className="text-sm text-khajur-dark/50 max-w-xs">
        Add your delivery addresses for a faster, smoother checkout experience.
      </p>
    </div>
    <button
      onClick={onAdd}
      data-testid="add-first-address-button"
      className="
        flex items-center gap-2 bg-khajur-gold hover:bg-khajur-gold/90
        hover:shadow-[0_0_20px_rgba(198,169,98,0.35)]
        text-khajur-primary px-8 py-3 rounded-sm
        uppercase tracking-widest text-xs font-bold transition-all duration-300
      "
    >
      <Plus className="w-4 h-4" />
      Add Your First Address
    </button>
  </div>
);

// ── Address Card ───────────────────────────────────────────────────────────────

const AddressCard = ({ addr, index, onEdit, onDelete, onSetDefault, deletingIndex }) => (
  <div className="
    group bg-white border border-khajur-border
    hover:border-khajur-gold/50 hover:shadow-[0_4px_20px_rgba(198,169,98,0.12)]
    rounded-sm p-7 flex flex-col justify-between gap-6
    transition-all duration-300
  ">
    {/* Card Body */}
    <div className="space-y-3">

      {/* Name + Default Badge */}
      <div className="flex items-start justify-between gap-3">
        <p className="font-serif text-lg font-medium text-khajur-primary leading-tight">
          {addr.name}
        </p>
        {addr.isDefault && (
          <span className="
            flex items-center gap-1 px-2.5 py-1
            bg-khajur-gold/15 text-khajur-gold
            text-[10px] font-bold uppercase tracking-widest
            rounded-full border border-khajur-gold/30 flex-shrink-0
          ">
            <Star className="w-3 h-3 fill-khajur-gold" />
            Default
          </span>
        )}
      </div>

      {/* Contact */}
      <p className="text-sm text-khajur-dark/50">{addr.phone}</p>

      {/* Address Lines */}
      <div className="text-sm text-khajur-dark/80 leading-relaxed space-y-0.5">
        <p>{addr.address}</p>
        <p>
          {addr.city}{addr.city && addr.state ? ', ' : ''}{addr.state}
          {addr.pincode ? ` — ${addr.pincode}` : ''}
        </p>
      </div>
    </div>

    {/* Card Footer */}
    <div className="flex items-center justify-between border-t border-khajur-border pt-5">

      {/* Delete */}
      <button
        onClick={() => onDelete(index)}
        disabled={deletingIndex === index}
        className="flex items-center gap-1.5 text-red-400 hover:text-red-600 text-xs font-medium transition-colors disabled:opacity-40"
      >
        {deletingIndex === index
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <Trash2 className="w-3.5 h-3.5" />
        }
        Delete
      </button>

      {/* Edit + Set Default */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => onEdit(addr, index)}
          className="flex items-center gap-1.5 text-khajur-primary hover:text-khajur-gold text-xs font-medium transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </button>
        {!addr.isDefault && (
          <button
            onClick={() => onSetDefault(index)}
            className="flex items-center gap-1.5 text-khajur-gold hover:text-khajur-gold/70 text-xs font-medium transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Set Default
          </button>
        )}
      </div>
    </div>
  </div>
);

// ── Address Form Modal ─────────────────────────────────────────────────────────

const AddressFormModal = ({ initial, isEdit, onSave, onClose, saving }) => {
  const [form, setForm] = useState(initial);

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const inputBase = `
    w-full bg-white border border-khajur-border
    hover:border-khajur-gold/40 focus:border-khajur-gold
    text-sm text-khajur-primary placeholder:text-khajur-dark/25
    px-4 py-3 rounded-sm focus:outline-none transition-colors duration-200
  `;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-w-2xl rounded-sm shadow-2xl max-h-[92vh] flex flex-col">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-khajur-border flex-shrink-0">
          <div>
            <p className="text-xs uppercase tracking-widest text-khajur-gold mb-0.5">
              {isEdit ? 'Edit' : 'New'}
            </p>
            <h2 className="font-serif text-2xl font-medium text-khajur-primary">
              {isEdit ? 'Update Address' : 'Add Address'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-khajur-dark/40 hover:text-khajur-primary transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto px-8 py-8 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FIELDS.map(({ key, label, placeholder, type, half }) => (
              <div
                key={key}
                className={!half ? 'sm:col-span-2' : ''}
              >
                <label className="block text-xs uppercase tracking-widest font-medium text-khajur-dark/50 mb-2">
                  {label}
                </label>
                {type === 'textarea' ? (
                  <textarea
                    rows={3}
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={set(key)}
                    className={`${inputBase} resize-none`}
                  />
                ) : (
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={set(key)}
                    className={inputBase}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex gap-4 px-8 py-6 border-t border-khajur-border flex-shrink-0">
          <button
            onClick={() => onSave(form)}
            disabled={saving}
            className="
              flex-1 flex items-center justify-center gap-2
              bg-khajur-gold hover:bg-khajur-gold/90
              hover:shadow-[0_0_20px_rgba(198,169,98,0.35)]
              disabled:opacity-60 disabled:cursor-not-allowed
              text-khajur-primary px-8 py-4 rounded-sm
              uppercase tracking-widest text-xs font-bold transition-all duration-300
            "
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              : <><Check className="w-4 h-4" /> Save Address</>
            }
          </button>
          <button
            onClick={onClose}
            className="
              flex-1 border border-khajur-primary
              hover:bg-khajur-primary text-khajur-primary hover:text-khajur-cream
              px-8 py-4 rounded-sm uppercase tracking-widest text-xs font-bold
              transition-all duration-300
            "
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const Addresses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [editIndex, setEditIndex]       = useState(null);
  const [formInitial, setFormInitial]   = useState(EMPTY_ADDRESS);
  const [saving, setSaving]             = useState(false);
  const [deletingIndex, setDeletingIndex] = useState(null);

  const token = localStorage.getItem('token');
  const authHeaders = { Authorization: `Bearer ${token}` };

  // ── Redirect ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await fetch(`${API}/user/address`, { headers: authHeaders });
      const data = await res.json();
      setAddresses(data);
    } catch {
      toast.error('Failed to load addresses.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (user) fetchAddresses();
  }, [user, fetchAddresses]);

  // ── Open Form ──────────────────────────────────────────────────────────────

  const openAdd = () => {
    setFormInitial(EMPTY_ADDRESS);
    setEditIndex(null);
    setShowForm(true);
  };

  const openEdit = (addr, index) => {
    setFormInitial(addr);
    setEditIndex(index);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditIndex(null);
    setFormInitial(EMPTY_ADDRESS);
  };

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = async (form) => {
    setSaving(true);
    try {
      const isEdit = editIndex !== null;
      const url = isEdit
        ? `${API}/user/address/${editIndex}`
        : `${API}/user/address`;
      const method = isEdit ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(form),
      });

      toast.success(isEdit ? 'Address updated.' : 'Address added.');
      closeForm();
      fetchAddresses();
    } catch {
      toast.error('Failed to save address.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async (index) => {
    if (!window.confirm('Delete this address? This cannot be undone.')) return;
    setDeletingIndex(index);
    try {
      await fetch(`${API}/user/address/${index}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      toast.success('Address deleted.');
      fetchAddresses();
    } catch {
      toast.error('Failed to delete address.');
    } finally {
      setDeletingIndex(null);
    }
  };

  // ── Set Default ────────────────────────────────────────────────────────────

  const handleSetDefault = async (index) => {
    try {
      await fetch(`${API}/user/address/default/${index}`, {
        method: 'PUT',
        headers: authHeaders,
      });
      toast.success('Default address updated.');
      fetchAddresses();
    } catch {
      toast.error('Failed to set default address.');
    }
  };

  // ── Guards ─────────────────────────────────────────────────────────────────

  if (!user) return null;
  if (loading) return <LoadingScreen />;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-khajur-cream py-16 md:py-24" data-testid="addresses-page">
      <div className="max-w-4xl mx-auto px-6 md:px-12 space-y-12">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between border-b border-khajur-gold/20 pb-8">
          <div className="flex items-center gap-4">
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
              <h1 className="font-serif text-4xl md:text-5xl font-medium text-khajur-primary leading-tight">
                My Addresses
              </h1>
            </div>
          </div>

          {addresses.length > 0 && (
            <button
              onClick={openAdd}
              data-testid="add-address-button"
              className="
                flex items-center gap-2 bg-khajur-gold hover:bg-khajur-gold/90
                hover:shadow-[0_0_20px_rgba(198,169,98,0.35)]
                text-khajur-primary px-6 py-3 rounded-sm
                uppercase tracking-widest text-xs font-bold transition-all duration-300
              "
            >
              <Plus className="w-4 h-4" />
              Add New
            </button>
          )}
        </div>

        {/* ── Address Grid / Empty State ── */}
        {addresses.length === 0 ? (
          <EmptyState onAdd={openAdd} />
        ) : (
          <>
            <p className="text-sm text-khajur-dark/50">
              {addresses.length} saved address{addresses.length > 1 ? 'es' : ''}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {addresses.map((addr, index) => (
                <AddressCard
                  key={index}
                  addr={addr}
                  index={index}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onSetDefault={handleSetDefault}
                  deletingIndex={deletingIndex}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Form Modal ── */}
      {showForm && (
        <AddressFormModal
          initial={formInitial}
          isEdit={editIndex !== null}
          onSave={handleSave}
          onClose={closeForm}
          saving={saving}
        />
      )}
    </div>
  );
};

export default Addresses;
