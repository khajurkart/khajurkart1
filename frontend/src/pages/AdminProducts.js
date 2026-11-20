import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
    Plus, Edit, Trash2, ChevronLeft, ToggleLeft, ToggleRight,
    Loader2, X, Package, Search, ImageOff, List, LayoutGrid,
    RefreshCw, Tag, IndianRupee, Truck, Star, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PRICE_UPLIFT_RATE = 0.0236;

// Profit markup intentionally disabled.
const EMPTY_SIZE = { weight: '', cost_price: '', original_price: '' };

const INITIAL_FORM = {
    name: '',
    description: '',
    sizes: [{ ...EMPTY_SIZE }],
    original_price: '',
    category: '',
    image: '',
    stock: '',
    featured: false,
    delivery_charge: '',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const capitalizeWords = (value) =>
    value.replace(/\b\w/g, (char) => char.toUpperCase());

const roundKhajurKartPrice = (value) => {
    const amount      = Math.max(0, Number(value) || 0);
    const wholeRupees = Math.floor(amount);
    const decimalPart = amount - wholeRupees;
    const lowerTen    = Math.floor(wholeRupees / 10) * 10;
    const rounded     = decimalPart < 0.5 ? lowerTen : lowerTen + 9;
    return rounded === 130 ? 129 : rounded;
};

const previewFinalSellingPrice = (value) => {
    if (value === '' || value === null || value === undefined) return '';
    const costPrice = Number(value);
    if (!Number.isFinite(costPrice) || costPrice < 0) return '';
    const afterProfit        = costPrice;
    const razorpayAdjustment = Math.round((afterProfit * PRICE_UPLIFT_RATE + Number.EPSILON) * 100) / 100;
    const beforeRounding     = Math.round((afterProfit + razorpayAdjustment + Number.EPSILON) * 100) / 100;
    return String(roundKhajurKartPrice(beforeRounding));
};

const buildProductPayload = (formData) => ({
    ...formData,
    sizes: formData.sizes.map((size) => {
        const costPrice    = Number.parseFloat(size.cost_price);
        const originalPrice =
            size.original_price !== '' && size.original_price !== null && size.original_price !== undefined
                ? Number.parseFloat(size.original_price)
                : null;
        return {
            weight: size.weight,
            cost_price: costPrice,
            base_original_price: originalPrice,
            original_price: originalPrice,
        };
    }),
    base_original_price:
        formData.original_price !== '' && formData.original_price !== null && formData.original_price !== undefined
            ? Number.parseFloat(formData.original_price)
            : null,
    original_price:
        formData.original_price !== '' && formData.original_price !== null && formData.original_price !== undefined
            ? Number.parseFloat(formData.original_price)
            : null,
    stock:           Number.parseInt(formData.stock, 10),
    delivery_charge: Number.parseFloat(formData.delivery_charge || 0),
});

const productToForm = (product) => ({
    name:           product.name        || '',
    description:    product.description || '',
    sizes: product.sizes?.length
        ? product.sizes.map((size) => ({
            weight:         size.weight || '',
            cost_price:     size.cost_price ?? '',
            original_price: size.base_original_price ?? size.original_price ?? '',
        }))
        : [{ ...EMPTY_SIZE }],
    original_price:  product.base_original_price ?? product.original_price ?? '',
    category:        product.category       || '',
    image:           product.image          || '',
    stock:           product.stock          ?? 0,
    featured:        Boolean(product.featured),
    delivery_charge: product.delivery_charge ?? '',
});

// ─── Form Field Wrapper ────────────────────────────────────────────────────────

const FormField = ({ label, required, hint, children }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-khajur-dark/60 uppercase tracking-wide">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {children}
        {hint && <p className="text-xs text-khajur-dark/40 italic">{hint}</p>}
    </div>
);

const inputCls = `
    w-full border border-khajur-border bg-white px-3.5 py-2.5 text-sm text-khajur-primary
    placeholder:text-khajur-dark/30 focus:outline-none focus:ring-2 focus:ring-khajur-gold
    transition-all
`;

// ─── Size Row ──────────────────────────────────────────────────────────────────

const SizeRow = ({ item, index, onChange, onRemove, canRemove }) => {
    const adjustedPrice = previewFinalSellingPrice(item.cost_price);

    return (
        <div
            className="bg-khajur-cream/50 border border-khajur-border/60 p-3 space-y-3"
            style={{ borderRadius: '10px' }}
        >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Weight */}
                <div>
                    <label className="block text-[10px] uppercase tracking-wide text-khajur-dark/40 font-semibold mb-1">Weight</label>
                    <input
                        type="text"
                        required
                        placeholder="e.g. 250g"
                        value={item.weight}
                        onChange={(e) => onChange(index, 'weight', e.target.value)}
                        className={inputCls}
                        style={{ borderRadius: '8px' }}
                    />
                </div>

                {/* Cost Price */}
                <div>
                    <label className="block text-[10px] uppercase tracking-wide text-khajur-dark/40 font-semibold mb-1">Cost Price (₹)</label>
                    <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={item.cost_price}
                        onChange={(e) => onChange(index, 'cost_price', e.target.value)}
                        className={inputCls}
                        style={{ borderRadius: '8px' }}
                    />
                    {adjustedPrice !== '' && (
                        <p className="mt-1 text-[11px] text-green-700 font-medium">
                            → Final selling price: ₹{adjustedPrice} (after 2.36% Razorpay + rounding)
                        </p>
                    )}
                </div>

                {/* Original Price */}
                <div>
                    <label className="block text-[10px] uppercase tracking-wide text-khajur-dark/40 font-semibold mb-1">Original Price (₹)</label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={item.original_price}
                            onChange={(e) => onChange(index, 'original_price', e.target.value)}
                            className={`${inputCls} flex-1 min-w-0`}
                            style={{ borderRadius: '8px' }}
                        />
                        {canRemove && (
                            <button
                                type="button"
                                onClick={() => onRemove(index)}
                                className="flex items-center justify-center w-10 h-10 bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition-colors flex-shrink-0"
                                style={{ borderRadius: '8px' }}
                                aria-label="Remove size"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Product Add/Edit Modal ────────────────────────────────────────────────────

const ProductModal = ({ editingProduct, formData, setFormData, categories, onSubmit, onClose, saving }) => {
    const updateField = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

    const updateSize = (index, field, value) => {
        const newSizes = formData.sizes.map((size, i) => i === index ? { ...size, [field]: value } : size);
        updateField('sizes', newSizes);
    };

    const removeSize = (index) => updateField('sizes', formData.sizes.filter((_, i) => i !== index));
    const addSize    = ()      => updateField('sizes', [...formData.sizes, { ...EMPTY_SIZE }]);

    return (
        <div
            className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
            data-testid="product-modal"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="bg-white w-full sm:max-w-3xl shadow-2xl max-h-[94vh] sm:max-h-[92vh] flex flex-col overflow-hidden"
                style={{ borderRadius: '20px 20px 0 0' }}
            >
                {/* Drag handle — mobile only */}
                <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
                    <div className="w-10 h-1 bg-gray-200 rounded-full" />
                </div>

                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 sm:px-8 py-4 border-b border-khajur-border flex-shrink-0">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-khajur-gold mb-0.5 font-semibold">
                            {editingProduct ? 'Editing Product' : 'New Product'}
                        </p>
                        <h2 className="font-serif text-xl sm:text-2xl font-medium text-khajur-primary">
                            {editingProduct ? 'Update Product' : 'Add Product'}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-khajur-dark/40 hover:text-khajur-primary transition-colors p-2 hover:bg-khajur-cream"
                        style={{ borderRadius: '999px' }}
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={onSubmit} className="overflow-y-auto px-5 sm:px-8 py-5 space-y-5 flex-1">

                    {/* Row 1: Name + Category */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FormField label="Product Name" required>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => updateField('name', capitalizeWords(e.target.value))}
                                placeholder="e.g. Premium Medjool Dates"
                                className={inputCls}
                                style={{ borderRadius: '10px' }}
                                data-testid="product-name-input"
                            />
                        </FormField>

                        <FormField label="Category" required>
                            <select
                                required
                                value={formData.category}
                                onChange={(e) => updateField('category', e.target.value)}
                                className={`${inputCls} cursor-pointer`}
                                style={{ borderRadius: '10px' }}
                                data-testid="product-category-input"
                            >
                                <option value="">Select a category…</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                                ))}
                            </select>
                        </FormField>
                    </div>

                    {/* Description */}
                    <FormField label="Description" required>
                        <textarea
                            required
                            rows={4}
                            value={formData.description}
                            onChange={(e) => updateField('description', e.target.value)}
                            placeholder="Write a detailed product description…"
                            className={`${inputCls} resize-none`}
                            style={{ borderRadius: '10px' }}
                            data-testid="product-description-input"
                        />
                    </FormField>

                    {/* Row 2: Original Price, Delivery Charge, Stock */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <FormField label="Original Price (₹)" hint="Shown as strikethrough price">
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.original_price}
                                onChange={(e) => updateField('original_price', e.target.value)}
                                placeholder="0.00"
                                className={inputCls}
                                style={{ borderRadius: '10px' }}
                            />
                        </FormField>

                        <FormField label="Delivery Charge (₹)" required>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={formData.delivery_charge}
                                onChange={(e) => updateField('delivery_charge', e.target.value)}
                                placeholder="0.00"
                                className={inputCls}
                                style={{ borderRadius: '10px' }}
                                data-testid="product-delivery-input"
                            />
                        </FormField>

                        <FormField label="Stock" required>
                            <input
                                type="number"
                                required
                                min="0"
                                step="1"
                                value={formData.stock}
                                onChange={(e) => updateField('stock', e.target.value)}
                                placeholder="0"
                                className={inputCls}
                                style={{ borderRadius: '10px' }}
                                data-testid="product-stock-input"
                            />
                        </FormField>
                    </div>

                    {/* Sizes & Pricing Section */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <p className="text-xs font-bold text-khajur-dark/60 uppercase tracking-wide mb-0.5">
                                    Sizes &amp; Pricing
                                </p>
                                <p className="text-xs text-khajur-dark/40">
                                    Cost price → system applies 2.36% Razorpay adjustment + custom rounding. Original price saved as entered.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={addSize}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-khajur-gold/10 border border-khajur-gold/30 text-khajur-gold text-xs font-bold hover:bg-khajur-gold/20 transition-colors flex-shrink-0"
                                style={{ borderRadius: '8px' }}
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add Size
                            </button>
                        </div>

                        <div className="space-y-2.5">
                            {formData.sizes.map((item, index) => (
                                <SizeRow
                                    key={index}
                                    item={item}
                                    index={index}
                                    onChange={updateSize}
                                    onRemove={removeSize}
                                    canRemove={formData.sizes.length > 1}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Image URL */}
                    <FormField label="Image URL" required>
                        <input
                            type="url"
                            required
                            value={formData.image}
                            onChange={(e) => updateField('image', e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            className={inputCls}
                            style={{ borderRadius: '10px' }}
                            data-testid="product-image-input"
                        />
                        {formData.image && (
                            <img
                                src={formData.image}
                                alt="Product preview"
                                className="mt-2 w-24 h-24 object-cover border border-khajur-border"
                                style={{ borderRadius: '10px' }}
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                        )}
                    </FormField>

                    {/* Featured Toggle */}
                    <label
                        className="flex items-center gap-3 cursor-pointer p-3 border border-khajur-border hover:bg-khajur-cream/50 transition-colors"
                        style={{ borderRadius: '10px' }}
                    >
                        <input
                            type="checkbox"
                            checked={formData.featured}
                            onChange={(e) => updateField('featured', e.target.checked)}
                            className="w-4 h-4 accent-khajur-gold"
                            data-testid="product-featured-input"
                        />
                        <div>
                            <p className="text-sm font-semibold text-khajur-dark">Mark as Featured Product</p>
                            <p className="text-xs text-khajur-dark/50">Featured products are highlighted on the home page</p>
                        </div>
                        <Star className={`w-4 h-4 ml-auto flex-shrink-0 ${formData.featured ? 'text-khajur-gold fill-khajur-gold' : 'text-khajur-dark/20'}`} />
                    </label>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2 pb-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 bg-khajur-gold text-khajur-primary hover:bg-khajur-gold/90 px-6 py-3 text-sm font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            style={{ borderRadius: '10px' }}
                            data-testid="save-product-button"
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {editingProduct ? 'Update Product' : 'Add Product'}
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 border border-khajur-border text-khajur-dark/70 hover:bg-khajur-cream px-6 py-3 text-sm font-bold uppercase tracking-widest transition-colors"
                            style={{ borderRadius: '10px' }}
                            data-testid="cancel-product-button"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── Mobile Product Card ───────────────────────────────────────────────────────

const MobileProductCard = ({ product, onEdit, onDelete, onToggleStock, deletingId }) => {
    const inStock   = product.stock > 0;
    const lowStock  = product.stock > 0 && product.stock < 5;

    return (
        <div
            className="border border-khajur-border bg-white shadow-sm overflow-hidden transition-all"
            style={{ borderRadius: '16px' }}
        >
            {/* Top image + info row */}
            <div className="flex gap-3 p-4">
                {/* Product image */}
                <div className="flex-shrink-0">
                    {product.image ? (
                        <img
                            src={product.image}
                            alt={product.name}
                            className="w-20 h-20 object-cover border border-khajur-border"
                            style={{ borderRadius: '12px' }}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                    ) : (
                        <div
                            className="w-20 h-20 bg-khajur-cream flex items-center justify-center border border-khajur-border"
                            style={{ borderRadius: '12px' }}
                        >
                            <ImageOff className="w-6 h-6 text-khajur-dark/30" />
                        </div>
                    )}
                </div>

                {/* Name + category + featured */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-khajur-primary text-sm leading-tight">
                            {product.name}
                        </p>
                        {product.featured && (
                            <Star className="w-4 h-4 text-khajur-gold fill-khajur-gold flex-shrink-0" />
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 mt-1">
                        <Tag className="w-3 h-3 text-khajur-dark/40" />
                        <p className="text-xs text-khajur-dark/50 capitalize">{product.category || 'Uncategorized'}</p>
                    </div>

                    {/* Price + delivery */}
                    <div className="flex items-center gap-3 mt-2.5">
                        <span className="flex items-center gap-0.5 text-sm font-bold text-khajur-gold">
                            <IndianRupee className="w-3.5 h-3.5" />
                            {Number(product.price ?? 0).toFixed(2)}
                        </span>
                        <span className="flex items-center gap-0.5 text-xs text-khajur-dark/50">
                            <Truck className="w-3 h-3" />
                            ₹{Number(product.delivery_charge ?? 0).toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 divide-x divide-khajur-border border-t border-khajur-border">
                {/* Stock count */}
                <div className="flex flex-col items-center py-2.5 px-2">
                    <p className="text-[9px] uppercase tracking-wider text-khajur-dark/40 font-bold mb-0.5">Stock</p>
                    <span className={`text-sm font-bold ${product.stock <= 0 ? 'text-red-500' : lowStock ? 'text-orange-500' : 'text-khajur-primary'}`}>
                        {product.stock}
                    </span>
                    {lowStock && (
                        <div className="flex items-center gap-0.5 mt-0.5">
                            <AlertTriangle className="w-2.5 h-2.5 text-orange-400" />
                            <span className="text-[9px] text-orange-500 font-semibold">Low</span>
                        </div>
                    )}
                </div>

                {/* Status toggle */}
                <div className="flex flex-col items-center justify-center py-2.5 px-2">
                    <p className="text-[9px] uppercase tracking-wider text-khajur-dark/40 font-bold mb-1">Status</p>
                    <button
                        type="button"
                        onClick={() => onToggleStock(product)}
                        className="flex items-center gap-1 hover:opacity-70 transition-opacity"
                        data-testid={`toggle-stock-${product.id}`}
                        aria-label={`Toggle stock for ${product.name}`}
                    >
                        {inStock ? (
                            <>
                                <ToggleRight className="w-5 h-5 text-green-500" />
                                <span className="text-[10px] font-bold text-green-600">In Stock</span>
                            </>
                        ) : (
                            <>
                                <ToggleLeft className="w-5 h-5 text-red-400" />
                                <span className="text-[10px] font-bold text-red-500">Out of Stock</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Featured */}
                <div className="flex flex-col items-center justify-center py-2.5 px-2">
                    <p className="text-[9px] uppercase tracking-wider text-khajur-dark/40 font-bold mb-1">Featured</p>
                    <Star className={`w-4 h-4 ${product.featured ? 'text-khajur-gold fill-khajur-gold' : 'text-gray-300'}`} />
                </div>
            </div>

            {/* Action row */}
            <div className="flex gap-2.5 p-3 bg-khajur-cream/30 border-t border-khajur-border/50">
                <button
                    type="button"
                    onClick={() => onEdit(product)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-khajur-primary text-white text-xs font-bold hover:bg-khajur-primary/90 transition-colors"
                    style={{ borderRadius: '10px' }}
                    data-testid={`edit-product-${product.id}`}
                >
                    <Edit className="w-3.5 h-3.5" />
                    Edit
                </button>

                <button
                    type="button"
                    onClick={() => onDelete(product.id)}
                    disabled={deletingId === product.id}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-red-50 border border-red-200 text-red-500 text-xs font-bold hover:bg-red-100 transition-colors disabled:opacity-40"
                    style={{ borderRadius: '10px' }}
                    data-testid={`delete-product-${product.id}`}
                >
                    {deletingId === product.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />
                    }
                    Delete
                </button>
            </div>
        </div>
    );
};

// ─── Desktop Product Table ─────────────────────────────────────────────────────

const ProductTable = ({ items, showCategoryColumn = true, onEdit, onDelete, onToggleStock, deletingId }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-sm">
            <thead className="bg-khajur-cream border-b border-khajur-border">
                <tr>
                    {['Image', 'Name', ...(showCategoryColumn ? ['Category'] : []), 'Price', 'Delivery', 'Stock', 'Status', 'Actions'].map((col) => (
                        <th
                            key={col}
                            className={`px-4 py-3.5 text-xs font-bold text-khajur-dark/60 uppercase tracking-wide whitespace-nowrap ${col === 'Actions' ? 'text-right' : 'text-left'}`}
                        >
                            {col}
                        </th>
                    ))}
                </tr>
            </thead>

            <tbody className="divide-y divide-khajur-border bg-white">
                {items.length === 0 ? (
                    <tr>
                        <td colSpan={showCategoryColumn ? 8 : 7}>
                            <div className="flex flex-col items-center justify-center py-20 text-khajur-dark/30">
                                <Package className="w-12 h-12 mb-3" />
                                <p className="text-sm font-medium">No products found</p>
                            </div>
                        </td>
                    </tr>
                ) : (
                    items.map((product) => {
                        const lowStock = product.stock > 0 && product.stock < 5;
                        return (
                            <tr key={product.id} className="hover:bg-khajur-cream/40 transition-colors align-middle">

                                {/* Image */}
                                <td className="px-4 py-3.5">
                                    {product.image ? (
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-14 h-14 object-cover border border-khajur-border"
                                            style={{ borderRadius: '10px' }}
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                    ) : (
                                        <div
                                            className="w-14 h-14 bg-khajur-cream flex items-center justify-center border border-khajur-border"
                                            style={{ borderRadius: '10px' }}
                                        >
                                            <ImageOff className="w-5 h-5 text-khajur-dark/30" />
                                        </div>
                                    )}
                                </td>

                                {/* Name */}
                                <td className="px-4 py-3.5">
                                    <div className="flex items-center gap-1.5">
                                        <p className="font-semibold text-khajur-primary">{product.name}</p>
                                        {product.featured && (
                                            <Star className="w-3.5 h-3.5 text-khajur-gold fill-khajur-gold flex-shrink-0" title="Featured" />
                                        )}
                                    </div>
                                    {product.weight && (
                                        <p className="text-xs text-khajur-dark/50 mt-0.5">{product.weight}</p>
                                    )}
                                </td>

                                {/* Category */}
                                {showCategoryColumn && (
                                    <td className="px-4 py-3.5 text-khajur-dark/70 capitalize text-xs">
                                        <span
                                            className="inline-block px-2 py-0.5 bg-khajur-cream border border-khajur-border text-khajur-dark/70 font-medium"
                                            style={{ borderRadius: '6px' }}
                                        >
                                            {product.category || 'Uncategorized'}
                                        </span>
                                    </td>
                                )}

                                {/* Price */}
                                <td className="px-4 py-3.5 font-bold text-khajur-gold whitespace-nowrap">
                                    ₹{Number(product.price ?? 0).toFixed(2)}
                                </td>

                                {/* Delivery */}
                                <td className="px-4 py-3.5 text-khajur-dark/60 whitespace-nowrap text-xs">
                                    ₹{Number(product.delivery_charge ?? 0).toFixed(2)}
                                </td>

                                {/* Stock */}
                                <td className="px-4 py-3.5">
                                    <div className="flex items-center gap-1">
                                        <span className={`text-sm font-bold ${product.stock <= 0 ? 'text-red-500' : lowStock ? 'text-orange-500' : 'text-khajur-dark/70'}`}>
                                            {product.stock}
                                        </span>
                                        {lowStock && (
                                            <AlertTriangle className="w-3.5 h-3.5 text-orange-400" title="Low stock" />
                                        )}
                                    </div>
                                </td>

                                {/* Status toggle */}
                                <td className="px-4 py-3.5">
                                    <button
                                        type="button"
                                        onClick={() => onToggleStock(product)}
                                        className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
                                        data-testid={`toggle-stock-${product.id}`}
                                        aria-label={`Toggle stock for ${product.name}`}
                                    >
                                        {product.stock > 0 ? (
                                            <>
                                                <ToggleRight className="w-6 h-6 text-green-500" />
                                                <span className="text-xs font-semibold text-green-600">In Stock</span>
                                            </>
                                        ) : (
                                            <>
                                                <ToggleLeft className="w-6 h-6 text-red-400" />
                                                <span className="text-xs font-semibold text-red-500">Out of Stock</span>
                                            </>
                                        )}
                                    </button>
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-3.5">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => onEdit(product)}
                                            className="flex items-center gap-1 px-2.5 py-1.5 bg-khajur-primary/5 border border-khajur-primary/20 text-khajur-primary hover:bg-khajur-primary hover:text-white transition-colors font-semibold text-xs"
                                            style={{ borderRadius: '8px' }}
                                            aria-label={`Edit ${product.name}`}
                                            data-testid={`edit-product-${product.id}`}
                                        >
                                            <Edit className="w-3.5 h-3.5" />
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => onDelete(product.id)}
                                            disabled={deletingId === product.id}
                                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 border border-red-100 text-red-500 hover:bg-red-500 hover:text-white transition-colors font-semibold text-xs disabled:opacity-40"
                                            style={{ borderRadius: '8px' }}
                                            aria-label={`Delete ${product.name}`}
                                            data-testid={`delete-product-${product.id}`}
                                        >
                                            {deletingId === product.id
                                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                : <Trash2 className="w-3.5 h-3.5" />
                                            }
                                            Del
                                        </button>
                                    </div>
                                </td>

                            </tr>
                        );
                    })
                )}
            </tbody>
        </table>
    </div>
);

// ─── Main AdminProducts Component ──────────────────────────────────────────────

const AdminProducts = () => {
    const { token }   = useAuth();
    const navigate    = useNavigate();

    const [products,        setProducts]        = useState([]);
    const [categories,      setCategories]      = useState([]);
    const [loading,         setLoading]         = useState(true);
    const [refreshing,      setRefreshing]      = useState(false);
    const [saving,          setSaving]          = useState(false);
    const [deletingId,      setDeletingId]      = useState(null);
    const [showModal,       setShowModal]       = useState(false);
    const [editingProduct,  setEditingProduct]  = useState(null);
    const [formData,        setFormData]        = useState(INITIAL_FORM);
    const [searchQuery,     setSearchQuery]     = useState('');
    const [viewMode,        setViewMode]        = useState('list');

    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // ─── Fetch Products & Categories ──────────────────────────────────────────

    const fetchData = useCallback(async (silent = false) => {
        if (silent) setRefreshing(true); else setLoading(true);
        try {
            const [productsRes, categoriesRes] = await Promise.all([
                axios.get(`${API}/admin/products`, authHeaders),
                axios.get(`${API}/categories`,       authHeaders),
            ]);
            setProducts(productsRes.data);
            setCategories(categoriesRes.data);
        } catch (error) {
            console.error('Failed to load admin products:', error);
            toast.error('Failed to load products. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { fetchData(); }, [fetchData]);

    // ─── Modal Helpers ─────────────────────────────────────────────────────────

    const openAddModal  = ()        => { setEditingProduct(null); setFormData({ ...INITIAL_FORM, sizes: [{ ...EMPTY_SIZE }] }); setShowModal(true); };
    const openEditModal = (product) => { setEditingProduct(product); setFormData(productToForm(product)); setShowModal(true); };
    const closeModal    = ()        => { setShowModal(false); setEditingProduct(null); };

    // ─── Save Product ──────────────────────────────────────────────────────────

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!formData.sizes.length) { toast.error('Add at least one size variant.'); return; }

        const invalidSize = formData.sizes.some((size) =>
            !String(size.weight).trim() || size.cost_price === '' ||
            !Number.isFinite(Number(size.cost_price)) || Number(size.cost_price) < 0
        );
        if (invalidSize) { toast.error('Please enter a valid weight and cost price for every size.'); return; }

        const invalidOriginalPrice = formData.sizes.some((size) =>
            size.original_price !== '' && (!Number.isFinite(Number(size.original_price)) || Number(size.original_price) < 0)
        );
        if (invalidOriginalPrice) { toast.error('Please enter valid original prices.'); return; }

        setSaving(true);
        try {
            const payload = buildProductPayload(formData);
            if (editingProduct) {
                await axios.put(`${API}/admin/products/${editingProduct.id}`, payload, authHeaders);
                toast.success('Product updated successfully.');
            } else {
                await axios.post(`${API}/admin/products`, payload, authHeaders);
                toast.success('Product added successfully.');
            }
            closeModal();
            await fetchData();
        } catch (error) {
            console.error('Failed to save product:', error);
            toast.error(error.response?.data?.detail || 'Failed to save product.');
        } finally {
            setSaving(false);
        }
    };

    // ─── Delete Product ────────────────────────────────────────────────────────

    const handleDelete = async (productId) => {
        if (!window.confirm('Are you sure you want to delete this product? This cannot be undone.')) return;
        setDeletingId(productId);
        try {
            await axios.delete(`${API}/admin/products/${productId}`, authHeaders);
            setProducts((prev) => prev.filter((p) => p.id !== productId));
            toast.success('Product deleted.');
        } catch (error) {
            console.error('Failed to delete product:', error);
            toast.error('Failed to delete product.');
        } finally {
            setDeletingId(null);
        }
    };

    // ─── Stock Toggle ──────────────────────────────────────────────────────────

    const toggleStock = async (product) => {
        const newStock = product.stock > 0 ? 0 : 10;
        try {
            await axios.put(`${API}/admin/products/${product.id}`, { stock: newStock }, authHeaders);
            setProducts((prev) => prev.map((item) => item.id === product.id ? { ...item, stock: newStock } : item));
            toast.success(newStock > 0 ? 'Product marked as in stock.' : 'Product marked as out of stock.');
        } catch (error) {
            console.error('Failed to update stock:', error);
            toast.error('Failed to update stock status.');
        }
    };

    // ─── Filter + Category Groups ──────────────────────────────────────────────

    const filteredProducts = products.filter((product) => {
        const q = searchQuery.toLowerCase();
        return !q || product.name?.toLowerCase().includes(q) || product.category?.toLowerCase().includes(q);
    });

    const categoryGroups = categories
        .map((cat) => ({
            key:   cat.slug,
            name:  cat.name,
            items: filteredProducts.filter((p) => (p.category || '').toLowerCase() === (cat.slug || '').toLowerCase()),
        }))
        .filter((g) => g.items.length > 0);

    const knownSlugs             = new Set(categories.map((c) => (c.slug || '').toLowerCase()));
    const uncategorizedProducts  = filteredProducts.filter((p) => !knownSlugs.has((p.category || '').toLowerCase()));
    if (uncategorizedProducts.length > 0) categoryGroups.push({ key: 'uncategorized', name: 'Uncategorized', items: uncategorizedProducts });

    // ─── Loading Screen ────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-khajur-dark/50 bg-white">
                <Loader2 className="w-9 h-9 animate-spin text-khajur-primary" />
                <p className="text-sm font-medium">Loading products…</p>
            </div>
        );
    }

    // ─── Shared action props ───────────────────────────────────────────────────
    const tableActions = { onEdit: openEditModal, onDelete: handleDelete, onToggleStock: toggleStock, deletingId };

    // ─── Main Render ───────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen py-20 bg-white" data-testid="admin-products-page">
            <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">

                {/* ── Page Header ── */}
                <div className="flex items-start gap-3 mb-8">

                    {/* Back button */}
                    <button
                        type="button"
                        onClick={() => navigate('/admin/dashboard')}
                        className="mt-1.5 flex items-center justify-center w-9 h-9 rounded-full border border-khajur-border text-khajur-primary hover:text-khajur-gold hover:border-khajur-gold transition-colors flex-shrink-0"
                        style={{ borderRadius: '999px' }}
                        aria-label="Back to dashboard"
                        data-testid="back-to-dashboard"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500 flex-shrink-0" style={{ borderRadius: '999px' }} />
                            <p className="text-xs uppercase tracking-widest text-khajur-gold font-semibold">
                                KhajurKart Administrator
                            </p>
                        </div>
                        <h1 className="font-serif text-3xl md:text-4xl font-medium text-khajur-primary leading-tight">
                            Manage Products
                        </h1>
                    </div>

                    {/* Right: Refresh + Add Product */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={() => fetchData(true)}
                            disabled={refreshing}
                            className="flex items-center justify-center w-9 h-9 border border-khajur-border text-khajur-primary hover:bg-khajur-cream transition-colors disabled:opacity-50"
                            style={{ borderRadius: '999px' }}
                            aria-label="Refresh products"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>

                        <button
                            type="button"
                            onClick={openAddModal}
                            className="flex items-center gap-2 bg-khajur-gold text-khajur-primary hover:bg-khajur-gold/90 px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors shadow-sm"
                            style={{ borderRadius: '10px' }}
                            data-testid="add-product-button"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Add Product</span>
                            <span className="sm:hidden">Add</span>
                        </button>
                    </div>
                </div>

                {/* ── Search + View Toggle ── */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">

                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-khajur-dark/30 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search by name or category…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 text-sm border border-khajur-border bg-white text-khajur-primary placeholder:text-khajur-dark/30 focus:outline-none focus:ring-2 focus:ring-khajur-gold shadow-sm"
                            style={{ borderRadius: '12px' }}
                        />
                    </div>

                    {/* View mode toggle */}
                    <div
                        className="inline-flex border border-khajur-border bg-khajur-cream/40 p-1 flex-shrink-0"
                        role="group"
                        aria-label="Product display mode"
                        style={{ borderRadius: '12px' }}
                    >
                        {[
                            { mode: 'list',     label: 'List',     Icon: List },
                            { mode: 'category', label: 'Category', Icon: LayoutGrid },
                        ].map(({ mode, label, Icon }) => (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => setViewMode(mode)}
                                aria-pressed={viewMode === mode}
                                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${viewMode === mode ? 'bg-khajur-primary text-white shadow-sm' : 'text-khajur-dark/60 hover:text-khajur-primary'}`}
                                style={{ borderRadius: '8px' }}
                                data-testid={`products-${mode}-view`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Results Count ── */}
                <p className="text-sm text-khajur-dark/50 mb-5">
                    Showing{' '}
                    <span className="font-bold text-khajur-primary">{filteredProducts.length}</span>
                    {' '}of{' '}
                    <span className="font-bold text-khajur-primary">{products.length}</span>
                    {' '}products
                </p>

                {/* ══════════════════════════════════════════════════════════════
                    MOBILE: Product Cards  (< md)
                ══════════════════════════════════════════════════════════════ */}
                <div className="md:hidden">
                    {viewMode === 'list' ? (
                        /* Flat list */
                        <div className="space-y-4">
                            {filteredProducts.length === 0 ? (
                                <div className="border border-khajur-border bg-white py-16 text-center shadow-sm" style={{ borderRadius: '16px' }}>
                                    <Package className="w-12 h-12 mx-auto mb-3 text-khajur-dark/30" />
                                    <p className="text-sm font-medium text-khajur-dark/50">No products found</p>
                                </div>
                            ) : (
                                filteredProducts.map((product) => (
                                    <MobileProductCard key={product.id} product={product} onEdit={openEditModal} onDelete={handleDelete} onToggleStock={toggleStock} deletingId={deletingId} />
                                ))
                            )}
                        </div>
                    ) : (
                        /* Category grouped */
                        <div className="space-y-6">
                            {categoryGroups.length === 0 ? (
                                <div className="border border-khajur-border bg-white py-16 text-center shadow-sm" style={{ borderRadius: '16px' }}>
                                    <Package className="w-12 h-12 mx-auto mb-3 text-khajur-dark/30" />
                                    <p className="text-sm font-medium text-khajur-dark/50">No products found</p>
                                </div>
                            ) : (
                                categoryGroups.map((group) => (
                                    <div key={group.key}>
                                        {/* Category header */}
                                        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-khajur-cream border border-khajur-border mb-3" style={{ borderRadius: '12px' }}>
                                            <h2 className="font-serif text-lg font-medium text-khajur-primary">{group.name}</h2>
                                            <span
                                                className="inline-flex items-center justify-center min-w-7 h-7 px-2 bg-white border border-khajur-border text-xs font-bold text-khajur-primary"
                                                style={{ borderRadius: '999px' }}
                                            >
                                                {group.items.length}
                                            </span>
                                        </div>
                                        <div className="space-y-3.5">
                                            {group.items.map((product) => (
                                                <MobileProductCard key={product.id} product={product} onEdit={openEditModal} onDelete={handleDelete} onToggleStock={toggleStock} deletingId={deletingId} />
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* ══════════════════════════════════════════════════════════════
                    DESKTOP: Product Table  (≥ md)
                ══════════════════════════════════════════════════════════════ */}
                <div className="hidden md:block">
                    {viewMode === 'list' ? (
                        <div className="border border-khajur-border shadow-sm overflow-hidden" style={{ borderRadius: '16px' }}>
                            <ProductTable items={filteredProducts} showCategoryColumn {...tableActions} />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {categoryGroups.length === 0 ? (
                                <div className="border border-khajur-border shadow-sm overflow-hidden" style={{ borderRadius: '16px' }}>
                                    <ProductTable items={[]} showCategoryColumn={false} {...tableActions} />
                                </div>
                            ) : (
                                categoryGroups.map((group) => (
                                    <section key={group.key} className="border border-khajur-border bg-white shadow-sm overflow-hidden" style={{ borderRadius: '16px' }}>
                                        <div className="flex items-center justify-between gap-3 px-5 py-4 bg-khajur-cream border-b border-khajur-border">
                                            <div>
                                                <h2 className="font-serif text-xl font-medium text-khajur-primary">{group.name}</h2>
                                                <p className="text-xs text-khajur-dark/50 mt-0.5">{group.items.length} {group.items.length === 1 ? 'product' : 'products'} in this category</p>
                                            </div>
                                            <span
                                                className="inline-flex items-center justify-center min-w-8 h-8 px-2 bg-white border border-khajur-border text-xs font-bold text-khajur-primary"
                                                style={{ borderRadius: '999px' }}
                                            >
                                                {group.items.length}
                                            </span>
                                        </div>
                                        <ProductTable items={group.items} showCategoryColumn={false} {...tableActions} />
                                    </section>
                                ))
                            )}
                        </div>
                    )}
                </div>

            </div>

            {/* ── Product Modal ── */}
            {showModal && (
                <ProductModal
                    editingProduct={editingProduct}
                    formData={formData}
                    setFormData={setFormData}
                    categories={categories}
                    onSubmit={handleSubmit}
                    onClose={closeModal}
                    saving={saving}
                />
            )}
        </div>
    );
};

export default AdminProducts;
