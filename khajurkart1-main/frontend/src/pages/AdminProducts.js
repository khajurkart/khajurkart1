import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ToggleLeft,
  ToggleRight,
  Loader2,
  X,
  Package,
  Search,
  ImageOff,
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ─── Constants ─────────────────────────────────────────────────────────────────

const EMPTY_SIZE = { weight: '', price: '', original_price: '' };

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

const buildProductPayload = (formData) => ({
  ...formData,
  sizes: formData.sizes.map((s) => ({
    weight: s.weight,
    price: parseFloat(s.price),
    original_price: s.original_price
      ? parseFloat(s.original_price)
      : parseFloat(s.price),
  })),
  original_price: formData.original_price
    ? parseFloat(formData.original_price)
    : null,
  stock: parseInt(formData.stock, 10),
  delivery_charge: parseFloat(formData.delivery_charge || 0),
});

const productToForm = (product) => ({
  name: product.name,
  description: product.description,
  sizes: product.sizes?.length
    ? product.sizes.map((s) => ({
        weight: s.weight,
        price: s.price,
        original_price: s.original_price ?? '',
      }))
    : [{ ...EMPTY_SIZE }],
  original_price: product.original_price ?? '',
  category: product.category,
  image: product.image,
  stock: product.stock,
  featured: product.featured,
  delivery_charge: product.delivery_charge ?? '',
});

// ─── Sub-Components ────────────────────────────────────────────────────────────

const FormField = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-medium text-khajur-dark/60 uppercase tracking-wide">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputBase = `
  w-full bg-transparent border-b border-khajur-primary/20
  focus:border-khajur-gold px-0 py-2.5 text-sm text-khajur-primary
  placeholder:text-khajur-dark/30 focus:outline-none transition-colors
`;

const EmptyState = () => (
  <tr>
    <td colSpan={8}>
      <div className="flex flex-col items-center justify-center py-20 text-khajur-dark/30">
        <Package className="w-12 h-12 mb-3" />
        <p className="text-sm">No products found</p>
      </div>
    </td>
  </tr>
);

// ── Size Row ───────────────────────────────────────────────────────────────────

const SizeRow = ({ item, index, onChange, onRemove, canRemove }) => (
  <div className="grid grid-cols-3 gap-2 items-center">
    <input
      type="text"
      placeholder="Weight (e.g. 250g)"
      value={item.weight}
      onChange={(e) => onChange(index, 'weight', e.target.value)}
      className="
        border border-khajur-border px-3 py-2 text-sm text-khajur-primary
        focus:outline-none focus:border-khajur-gold transition-colors bg-white
      "
    />
    <input
      type="number"
      placeholder="Price (₹)"
      value={item.price}
      onChange={(e) => onChange(index, 'price', e.target.value)}
      className="
        border border-khajur-border px-3 py-2 text-sm text-khajur-primary
        focus:outline-none focus:border-khajur-gold transition-colors bg-white
      "
    />
    <div className="flex gap-2">
      <input
        type="number"
        placeholder="Original Price (₹)"
        value={item.original_price}
        onChange={(e) => onChange(index, 'original_price', e.target.value)}
        className="
          flex-1 border border-khajur-border px-3 py-2 text-sm text-khajur-primary
          focus:outline-none focus:border-khajur-gold transition-colors bg-white
        "
      />
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-red-400 hover:text-red-600 transition-colors p-1"
          aria-label="Remove size"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  </div>
);

// ── Product Form Modal ─────────────────────────────────────────────────────────

const ProductModal = ({
  editingProduct,
  formData,
  setFormData,
  categories,
  onSubmit,
  onClose,
  saving,
}) => {
  const updateField = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const updateSize = (index, field, value) => {
    const newSizes = formData.sizes.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    );
    updateField('sizes', newSizes);
  };

  const removeSize = (index) =>
    updateField(
      'sizes',
      formData.sizes.filter((_, i) => i !== index)
    );

  const addSize = () =>
    updateField('sizes', [...formData.sizes, { ...EMPTY_SIZE }]);

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      data-testid="product-modal"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-w-2xl rounded-sm shadow-2xl max-h-[92vh] flex flex-col">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-khajur-border flex-shrink-0">
          <div>
            <p className="text-xs uppercase tracking-widest text-khajur-gold mb-0.5">
              {editingProduct ? 'Editing' : 'New Product'}
            </p>
            <h2 className="font-serif text-2xl font-medium text-khajur-primary">
              {editingProduct ? 'Update Product' : 'Add Product'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-khajur-dark/40 hover:text-khajur-primary transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form
          onSubmit={onSubmit}
          className="overflow-y-auto px-8 py-6 space-y-6 flex-1"
        >
          {/* Name & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Product Name" required>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g. Premium Medjool Dates"
                className={inputBase}
                data-testid="product-name-input"
              />
            </FormField>

            <FormField label="Category" required>
              <select
                required
                value={formData.category}
                onChange={(e) => updateField('category', e.target.value)}
                className={`${inputBase} cursor-pointer`}
                data-testid="product-category-input"
              >
                <option value="">Select a category…</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          {/* Description */}
          <FormField label="Description" required>
            <textarea
              required
              rows={5}
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Write a detailed product description…"
              className="
                w-full bg-white border border-khajur-primary/20
                focus:border-khajur-gold px-4 py-3 text-sm text-khajur-primary
                placeholder:text-khajur-dark/30 focus:outline-none transition-colors
                resize-none
              "
              data-testid="product-description-input"
            />
          </FormField>

          {/* Numeric Fields */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <FormField label="Original Price (₹)">
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.original_price}
                onChange={(e) => updateField('original_price', e.target.value)}
                placeholder="0.00"
                className={inputBase}
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
                className={inputBase}
                data-testid="product-delivery-input"
              />
            </FormField>

            <FormField label="Stock" required>
              <input
                type="number"
                required
                min="0"
                value={formData.stock}
                onChange={(e) => updateField('stock', e.target.value)}
                placeholder="0"
                className={inputBase}
                data-testid="product-stock-input"
              />
            </FormField>
          </div>

          {/* Sizes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-khajur-dark/60 uppercase tracking-wide">
                Sizes & Pricing
              </p>
              <div className="grid grid-cols-3 gap-2 text-xs text-khajur-dark/40 w-2/3">
                <span>Weight</span>
                <span>Sale Price</span>
                <span>Original Price</span>
              </div>
            </div>
            <div className="space-y-2">
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
            <button
              type="button"
              onClick={addSize}
              className="
                mt-3 flex items-center gap-1.5 text-xs font-medium
                text-khajur-gold hover:text-khajur-primary transition-colors
              "
            >
              <Plus className="w-3.5 h-3.5" />
              Add size variant
            </button>
          </div>

          {/* Image URL */}
          <FormField label="Image URL" required>
            <input
              type="url"
              required
              value={formData.image}
              onChange={(e) => updateField('image', e.target.value)}
              placeholder="https://example.com/image.jpg"
              className={inputBase}
              data-testid="product-image-input"
            />
            {formData.image && (
              <img
                src={formData.image}
                alt="Preview"
                className="mt-2 w-24 h-24 object-cover border border-khajur-border"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
          </FormField>

          {/* Featured */}
          <label className="flex items-center gap-3 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={formData.featured}
              onChange={(e) => updateField('featured', e.target.checked)}
              className="w-4 h-4 accent-khajur-gold"
              data-testid="product-featured-input"
            />
            <span className="text-sm text-khajur-dark">
              Mark as <span className="font-medium">Featured Product</span>
            </span>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-2 pb-2">
            <button
              type="submit"
              disabled={saving}
              className="
                flex-1 flex items-center justify-center gap-2
                bg-khajur-gold text-khajur-primary hover:bg-khajur-gold/90
                px-6 py-3 text-xs font-bold uppercase tracking-widest
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed
              "
              data-testid="save-product-button"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingProduct ? 'Update Product' : 'Add Product'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="
                flex-1 border border-khajur-primary text-khajur-primary
                hover:bg-khajur-primary hover:text-khajur-cream
                px-6 py-3 text-xs font-bold uppercase tracking-widest
                transition-colors
              "
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

// ─── Main Component ────────────────────────────────────────────────────────────

const AdminProducts = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts]           = useState([]);
  const [categories, setCategories]       = useState([]);
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [deletingId, setDeletingId]       = useState(null);
  const [showModal, setShowModal]         = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData]           = useState(INITIAL_FORM);
  const [searchQuery, setSearchQuery]     = useState('');

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        axios.get(`${API}/products`, authHeaders),
        axios.get(`${API}/categories`, authHeaders),
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch {
      toast.error('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Modal Handlers ─────────────────────────────────────────────────────────

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData(INITIAL_FORM);
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData(productToForm(product));
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.sizes.some((s) => !s.weight || !s.price)) {
      toast.error('Please fill in all size weight and price fields.');
      return;
    }

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
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product? This cannot be undone.')) {
      return;
    }
    setDeletingId(productId);
    try {
      await axios.delete(`${API}/admin/products/${productId}`, authHeaders);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      toast.success('Product deleted.');
    } catch {
      toast.error('Failed to delete product.');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Toggle Stock ───────────────────────────────────────────────────────────

  const toggleStock = async (product) => {
    const newStock = product.stock > 0 ? 0 : 10;
    try {
      await axios.put(
        `${API}/admin/products/${product.id}`,
        { stock: newStock },
        authHeaders
      );
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, stock: newStock } : p))
      );
      toast.success(
        newStock > 0 ? 'Product marked as in stock.' : 'Product marked as out of stock.'
      );
    } catch {
      toast.error('Failed to update stock status.');
    }
  };

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      p.name?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    );
  });

  // ── Render States ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-khajur-dark/40">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-sm">Loading products…</p>
      </div>
    );
  }

  // ── Main Render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen py-20 bg-white" data-testid="admin-products-page">
      <div className="max-w-7xl mx-auto px-6 md:px-12">

        {/* Page Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="text-khajur-primary hover:text-khajur-gold transition-colors"
              aria-label="Back to dashboard"
              data-testid="back-to-dashboard"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <p className="text-xs uppercase tracking-widest text-khajur-gold mb-0.5">
                Administration
              </p>
              <h1 className="font-serif text-4xl font-medium text-khajur-primary">
                Manage Products
              </h1>
            </div>
          </div>

          <button
            onClick={openAddModal}
            className="
              flex items-center gap-2 bg-khajur-gold text-khajur-primary
              hover:bg-khajur-gold/90 px-5 py-2.5
              text-xs font-bold uppercase tracking-widest transition-colors
            "
            data-testid="add-product-button"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-khajur-dark/30" />
          <input
            type="text"
            placeholder="Search by name or category…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
              w-full pl-10 pr-4 py-2.5 text-sm border border-khajur-border bg-white
              text-khajur-primary placeholder:text-khajur-dark/30
              focus:outline-none focus:ring-1 focus:ring-khajur-gold
            "
          />
        </div>

        {/* Count */}
        <p className="text-sm text-khajur-dark/50 mb-4">
          Showing{' '}
          <span className="font-medium text-khajur-primary">{filteredProducts.length}</span> of{' '}
          <span className="font-medium text-khajur-primary">{products.length}</span> products
        </p>

        {/* Table */}
        <div className="border border-khajur-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-khajur-cream border-b border-khajur-border">
              <tr>
                {[
                  'Image', 'Name', 'Category', 'Price',
                  'Delivery', 'Stock', 'Status', 'Actions',
                ].map((col) => (
                  <th
                    key={col}
                    className={`
                      px-5 py-3.5 text-xs font-medium text-khajur-dark/60
                      uppercase tracking-wide whitespace-nowrap
                      ${col === 'Actions' ? 'text-right' : 'text-left'}
                    `}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-khajur-border bg-white">
              {filteredProducts.length === 0 ? (
                <EmptyState />
              ) : (
                filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-khajur-cream/40 transition-colors"
                  >
                    {/* Image */}
                    <td className="px-5 py-4">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-14 h-14 object-cover border border-khajur-border"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-14 h-14 bg-khajur-cream flex items-center justify-center">
                          <ImageOff className="w-5 h-5 text-khajur-dark/30" />
                        </div>
                      )}
                    </td>

                    {/* Name */}
                    <td className="px-5 py-4">
                      <p className="font-medium text-khajur-primary">{product.name}</p>
                      {product.weight && (
                        <p className="text-xs text-khajur-dark/50 mt-0.5">{product.weight}</p>
                      )}
                    </td>

                    {/* Category */}
                    <td className="px-5 py-4 text-khajur-dark/70 capitalize">
                      {product.category}
                    </td>

                    {/* Price */}
                    <td className="px-5 py-4 font-semibold text-khajur-gold whitespace-nowrap">
                      ₹{product.price}
                    </td>

                    {/* Delivery */}
                    <td className="px-5 py-4 text-khajur-dark/70 whitespace-nowrap">
                      ₹{product.delivery_charge ?? 0}
                    </td>

                    {/* Stock Count */}
                    <td className="px-5 py-4">
                      <span
                        className={`
                          text-sm font-medium
                          ${product.stock <= 0
                            ? 'text-red-500'
                            : product.stock < 5
                            ? 'text-orange-500'
                            : 'text-khajur-dark/70'
                          }
                        `}
                      >
                        {product.stock}
                      </span>
                    </td>

                    {/* Stock Toggle */}
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleStock(product)}
                        className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
                        data-testid={`toggle-stock-${product.id}`}
                        aria-label={`Toggle stock for ${product.name}`}
                      >
                        {product.stock > 0 ? (
                          <>
                            <ToggleRight className="w-6 h-6 text-green-500" />
                            <span className="text-xs font-medium text-green-600">In Stock</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-6 h-6 text-red-400" />
                            <span className="text-xs font-medium text-red-500">Out of Stock</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => openEditModal(product)}
                          className="text-khajur-primary hover:text-khajur-gold transition-colors"
                          aria-label={`Edit ${product.name}`}
                          data-testid={`edit-product-${product.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={deletingId === product.id}
                          className="text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
                          aria-label={`Delete ${product.name}`}
                          data-testid={`delete-product-${product.id}`}
                        >
                          {deletingId === product.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Trash2 className="w-4 h-4" />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal */}
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
