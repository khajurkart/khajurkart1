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

// Add 2.36% to the base product price.
const PRICE_UPLIFT_RATE = 0.0236;

const EMPTY_SIZE = {
    weight: '',
    price: '',
    original_price: '',
};

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

const capitalizeWords = (value) =>
    value.replace(/\b\w/g, (char) => char.toUpperCase());

const previewAdjustedPrice = (value) => {
    if (value === '' || value === null || value === undefined) {
        return '';
    }

    const amount = Number(value);

    if (!Number.isFinite(amount) || amount < 0) {
        return '';
    }

    return (amount * (1 + PRICE_UPLIFT_RATE)).toFixed(2);
};

// Send base prices to the backend.
// The backend should calculate and store the adjusted prices.
const buildProductPayload = (formData) => ({
    ...formData,

    sizes: formData.sizes.map((size) => {
        const basePrice = Number.parseFloat(size.price);

        const baseOriginalPrice =
            size.original_price !== '' &&
            size.original_price !== null &&
            size.original_price !== undefined
                ? Number.parseFloat(size.original_price)
                : basePrice;

        return {
            weight: size.weight,
            base_price: basePrice,
            base_original_price: baseOriginalPrice,
            price: basePrice,
            original_price: baseOriginalPrice,
        };
    }),

    base_original_price:
        formData.original_price !== '' &&
        formData.original_price !== null &&
        formData.original_price !== undefined
            ? Number.parseFloat(formData.original_price)
            : null,

    original_price:
        formData.original_price !== '' &&
        formData.original_price !== null &&
        formData.original_price !== undefined
            ? Number.parseFloat(formData.original_price)
            : null,

    stock: Number.parseInt(formData.stock, 10),
    delivery_charge: Number.parseFloat(formData.delivery_charge || 0),
});

// Load base prices when editing so the 2.36% adjustment is not compounded.
const productToForm = (product) => ({
    name: product.name || '',
    description: product.description || '',

    sizes: product.sizes?.length
        ? product.sizes.map((size) => ({
              weight: size.weight || '',
              price: size.base_price ?? size.price ?? '',
              original_price:
                  size.base_original_price ??
                  size.original_price ??
                  '',
          }))
        : [{ ...EMPTY_SIZE }],

    original_price:
        product.base_original_price ??
        product.original_price ??
        '',

    category: product.category || '',
    image: product.image || '',
    stock: product.stock ?? 0,
    featured: Boolean(product.featured),
    delivery_charge: product.delivery_charge ?? '',
});

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

const SizeRow = ({
    item,
    index,
    onChange,
    onRemove,
    canRemove,
}) => {
    const adjustedPrice = previewAdjustedPrice(item.price);

    const originalBase =
        item.original_price !== '' &&
        item.original_price !== null &&
        item.original_price !== undefined
            ? item.original_price
            : item.price;

    const adjustedOriginalPrice = previewAdjustedPrice(originalBase);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
            <div>
                <input
                    type="text"
                    required
                    placeholder="Weight (e.g. 250g)"
                    value={item.weight}
                    onChange={(e) =>
                        onChange(index, 'weight', e.target.value)
                    }
                    className="w-full border border-khajur-border px-3 py-2 text-sm text-khajur-primary focus:outline-none focus:border-khajur-gold bg-white"
                />
            </div>

            <div>
                <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="Base price (₹)"
                    value={item.price}
                    onChange={(e) =>
                        onChange(index, 'price', e.target.value)
                    }
                    className="w-full border border-khajur-border px-3 py-2 text-sm text-khajur-primary focus:outline-none focus:border-khajur-gold bg-white"
                />

                {adjustedPrice !== '' && (
                    <p className="mt-1 text-xs text-green-700">
                        Price after 2.36%: ₹{adjustedPrice}
                    </p>
                )}
            </div>

            <div>
                <div className="flex gap-2">
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Base original price (₹)"
                        value={item.original_price}
                        onChange={(e) =>
                            onChange(
                                index,
                                'original_price',
                                e.target.value
                            )
                        }
                        className="flex-1 min-w-0 border border-khajur-border px-3 py-2 text-sm text-khajur-primary focus:outline-none focus:border-khajur-gold bg-white"
                    />

                    {canRemove && (
                        <button
                            type="button"
                            onClick={() => onRemove(index)}
                            className="text-red-400 hover:text-red-600 p-1"
                            aria-label="Remove size"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {adjustedOriginalPrice !== '' && (
                    <p className="mt-1 text-xs text-green-700">
                        Adjusted original price: ₹{adjustedOriginalPrice}
                    </p>
                )}
            </div>
        </div>
    );
};

const ProductModal = ({
    editingProduct,
    formData,
    setFormData,
    categories,
    onSubmit,
    onClose,
    saving,
}) => {
    const updateField = (field, value) => {
        setFormData((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    const updateSize = (index, field, value) => {
        const newSizes = formData.sizes.map((size, sizeIndex) =>
            sizeIndex === index
                ? { ...size, [field]: value }
                : size
        );

        updateField('sizes', newSizes);
    };

    const removeSize = (index) => {
        updateField(
            'sizes',
            formData.sizes.filter((_, sizeIndex) => sizeIndex !== index)
        );
    };

    const addSize = () => {
        updateField('sizes', [
            ...formData.sizes,
            { ...EMPTY_SIZE },
        ]);
    };

    const adjustedTopLevelOriginalPrice = previewAdjustedPrice(
        formData.original_price
    );

    return (
        <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            data-testid="product-modal"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="bg-white w-full max-w-3xl rounded-sm shadow-2xl max-h-[92vh] flex flex-col">
                <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-khajur-border flex-shrink-0">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-khajur-gold mb-0.5">
                            {editingProduct ? 'Editing' : 'New Product'}
                        </p>

                        <h2 className="font-serif text-2xl font-medium text-khajur-primary">
                            {editingProduct
                                ? 'Update Product'
                                : 'Add Product'}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="text-khajur-dark/40 hover:text-khajur-primary"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form
                    onSubmit={onSubmit}
                    className="overflow-y-auto px-6 md:px-8 py-6 space-y-6 flex-1"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField label="Product Name" required>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) =>
                                    updateField(
                                        'name',
                                        capitalizeWords(e.target.value)
                                    )
                                }
                                placeholder="e.g. Premium Medjool Dates"
                                className={inputBase}
                                data-testid="product-name-input"
                            />
                        </FormField>

                        <FormField label="Category" required>
                            <select
                                required
                                value={formData.category}
                                onChange={(e) =>
                                    updateField('category', e.target.value)
                                }
                                className={`${inputBase} cursor-pointer`}
                                data-testid="product-category-input"
                            >
                                <option value="">
                                    Select a category…
                                </option>

                                {categories.map((category) => (
                                    <option
                                        key={category.id}
                                        value={category.slug}
                                    >
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </FormField>
                    </div>

                    <FormField label="Description" required>
                        <textarea
                            required
                            rows={5}
                            value={formData.description}
                            onChange={(e) =>
                                updateField(
                                    'description',
                                    e.target.value
                                )
                            }
                            placeholder="Write a detailed product description…"
                            className="w-full bg-white border border-khajur-primary/20 focus:border-khajur-gold px-4 py-3 text-sm text-khajur-primary placeholder:text-khajur-dark/30 focus:outline-none resize-none"
                            data-testid="product-description-input"
                        />
                    </FormField>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField label="Base Original Price (₹)">
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.original_price}
                                onChange={(e) =>
                                    updateField(
                                        'original_price',
                                        e.target.value
                                    )
                                }
                                placeholder="0.00"
                                className={inputBase}
                            />

                            {adjustedTopLevelOriginalPrice !== '' && (
                                <p className="mt-1 text-xs text-green-700">
                                    After 2.36%: ₹
                                    {adjustedTopLevelOriginalPrice}
                                </p>
                            )}
                        </FormField>

                        <FormField label="Delivery Charge (₹)" required>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={formData.delivery_charge}
                                onChange={(e) =>
                                    updateField(
                                        'delivery_charge',
                                        e.target.value
                                    )
                                }
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
                                step="1"
                                value={formData.stock}
                                onChange={(e) =>
                                    updateField('stock', e.target.value)
                                }
                                placeholder="0"
                                className={inputBase}
                                data-testid="product-stock-input"
                            />
                        </FormField>
                    </div>

                    <div>
                        <div className="flex flex-col gap-2 mb-3">
                            <p className="text-xs font-medium text-khajur-dark/60 uppercase tracking-wide">
                                Sizes & Pricing
                            </p>

                            <p className="text-xs text-khajur-dark/50">
                                Enter your base prices. The backend applies
                                the 2.36% adjustment when saving.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-khajur-dark/40">
                                <span>Weight</span>
                                <span>Base sale price / adjusted preview</span>
                                <span>Base original price</span>
                            </div>
                        </div>

                        <div className="space-y-3">
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
                            className="mt-3 flex items-center gap-1.5 text-xs font-medium text-khajur-gold hover:text-khajur-primary"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Add size variant
                        </button>
                    </div>

                    <FormField label="Image URL" required>
                        <input
                            type="url"
                            required
                            value={formData.image}
                            onChange={(e) =>
                                updateField('image', e.target.value)
                            }
                            placeholder="https://example.com/image.jpg"
                            className={inputBase}
                            data-testid="product-image-input"
                        />

                        {formData.image && (
                            <img
                                src={formData.image}
                                alt="Product preview"
                                className="mt-2 w-24 h-24 object-cover border border-khajur-border"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        )}
                    </FormField>

                    <label className="flex items-center gap-3 cursor-pointer w-fit">
                        <input
                            type="checkbox"
                            checked={formData.featured}
                            onChange={(e) =>
                                updateField('featured', e.target.checked)
                            }
                            className="w-4 h-4 accent-khajur-gold"
                            data-testid="product-featured-input"
                        />

                        <span className="text-sm text-khajur-dark">
                            Mark as{' '}
                            <span className="font-medium">
                                Featured Product
                            </span>
                        </span>
                    </label>

                    <div className="flex gap-3 pt-2 pb-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 bg-khajur-gold text-khajur-primary hover:bg-khajur-gold/90 px-6 py-3 text-xs font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                            data-testid="save-product-button"
                        >
                            {saving && (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            )}

                            {editingProduct
                                ? 'Update Product'
                                : 'Add Product'}
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 border border-khajur-primary text-khajur-primary hover:bg-khajur-primary hover:text-khajur-cream px-6 py-3 text-xs font-bold uppercase tracking-widest"
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

const AdminProducts = () => {
    const { token } = useAuth();
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [searchQuery, setSearchQuery] = useState('');

    const authHeaders = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const fetchData = useCallback(async () => {
        try {
            const [productsResponse, categoriesResponse] =
                await Promise.all([
                    axios.get(`${API}/products`, authHeaders),
                    axios.get(`${API}/categories`, authHeaders),
                ]);

            setProducts(productsResponse.data);
            setCategories(categoriesResponse.data);
        } catch (error) {
            console.error('Failed to load admin products:', error);
            toast.error('Failed to load products. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const openAddModal = () => {
        setEditingProduct(null);
        setFormData({
            ...INITIAL_FORM,
            sizes: [{ ...EMPTY_SIZE }],
        });
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

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!formData.sizes.length) {
            toast.error('Add at least one size variant.');
            return;
        }

        const invalidSize = formData.sizes.some(
            (size) =>
                !String(size.weight).trim() ||
                size.price === '' ||
                !Number.isFinite(Number(size.price)) ||
                Number(size.price) < 0
        );

        if (invalidSize) {
            toast.error(
                'Please enter a valid weight and base price for every size.'
            );
            return;
        }

        if (
            formData.sizes.some(
                (size) =>
                    size.original_price !== '' &&
                    (!Number.isFinite(Number(size.original_price)) ||
                        Number(size.original_price) < 0)
            )
        ) {
            toast.error('Please enter valid original prices.');
            return;
        }

        setSaving(true);

        try {
            const payload = buildProductPayload(formData);

            if (editingProduct) {
                await axios.put(
                    `${API}/admin/products/${editingProduct.id}`,
                    payload,
                    authHeaders
                );

                toast.success('Product updated successfully.');
            } else {
                await axios.post(
                    `${API}/admin/products`,
                    payload,
                    authHeaders
                );

                toast.success('Product added successfully.');
            }

            closeModal();
            await fetchData();
        } catch (error) {
            console.error('Failed to save product:', error);

            toast.error(
                error.response?.data?.detail ||
                    'Failed to save product.'
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (productId) => {
        const confirmed = window.confirm(
            'Are you sure you want to delete this product? This cannot be undone.'
        );

        if (!confirmed) {
            return;
        }

        setDeletingId(productId);

        try {
            await axios.delete(
                `${API}/admin/products/${productId}`,
                authHeaders
            );

            setProducts((previous) =>
                previous.filter((product) => product.id !== productId)
            );

            toast.success('Product deleted.');
        } catch (error) {
            console.error('Failed to delete product:', error);
            toast.error('Failed to delete product.');
        } finally {
            setDeletingId(null);
        }
    };

    const toggleStock = async (product) => {
        const newStock = product.stock > 0 ? 0 : 10;

        try {
            await axios.put(
                `${API}/admin/products/${product.id}`,
                { stock: newStock },
                authHeaders
            );

            setProducts((previous) =>
                previous.map((item) =>
                    item.id === product.id
                        ? { ...item, stock: newStock }
                        : item
                )
            );

            toast.success(
                newStock > 0
                    ? 'Product marked as in stock.'
                    : 'Product marked as out of stock.'
            );
        } catch (error) {
            console.error('Failed to update stock:', error);
            toast.error('Failed to update stock status.');
        }
    };

    const filteredProducts = products.filter((product) => {
        const query = searchQuery.toLowerCase();

        return (
            !query ||
            product.name?.toLowerCase().includes(query) ||
            product.category?.toLowerCase().includes(query)
        );
    });

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-khajur-dark/40">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-sm">Loading products…</p>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen py-20 bg-white"
            data-testid="admin-products-page"
        >
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/dashboard')}
                            className="text-khajur-primary hover:text-khajur-gold"
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
                        type="button"
                        onClick={openAddModal}
                        className="flex items-center gap-2 bg-khajur-gold text-khajur-primary hover:bg-khajur-gold/90 px-5 py-2.5 text-xs font-bold uppercase tracking-widest"
                        data-testid="add-product-button"
                    >
                        <Plus className="w-4 h-4" />
                        Add Product
                    </button>
                </div>

                <div className="relative mb-6 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-khajur-dark/30" />

                    <input
                        type="text"
                        placeholder="Search by name or category…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-khajur-border bg-white text-khajur-primary placeholder:text-khajur-dark/30 focus:outline-none focus:ring-1 focus:ring-khajur-gold"
                    />
                </div>

                <p className="text-sm text-khajur-dark/50 mb-4">
                    Showing{' '}
                    <span className="font-medium text-khajur-primary">
                        {filteredProducts.length}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium text-khajur-primary">
                        {products.length}
                    </span>{' '}
                    products
                </p>

                <div className="border border-khajur-border overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-khajur-cream border-b border-khajur-border">
                            <tr>
                                {[
                                    'Image',
                                    'Name',
                                    'Category',
                                    'Price',
                                    'Delivery',
                                    'Stock',
                                    'Status',
                                    'Actions',
                                ].map((column) => (
                                    <th
                                        key={column}
                                        className={`px-5 py-3.5 text-xs font-medium text-khajur-dark/60 uppercase tracking-wide whitespace-nowrap ${
                                            column === 'Actions'
                                                ? 'text-right'
                                                : 'text-left'
                                        }`}
                                    >
                                        {column}
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
                                        <td className="px-5 py-4">
                                            {product.image ? (
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="w-14 h-14 object-cover border border-khajur-border"
                                                    onError={(event) => {
                                                        event.currentTarget.style.display =
                                                            'none';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-14 h-14 bg-khajur-cream flex items-center justify-center">
                                                    <ImageOff className="w-5 h-5 text-khajur-dark/30" />
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-5 py-4">
                                            <p className="font-medium text-khajur-primary">
                                                {product.name}
                                            </p>

                                            {product.weight && (
                                                <p className="text-xs text-khajur-dark/50 mt-0.5">
                                                    {product.weight}
                                                </p>
                                            )}
                                        </td>

                                        <td className="px-5 py-4 text-khajur-dark/70 capitalize">
                                            {product.category}
                                        </td>

                                        <td className="px-5 py-4 font-semibold text-khajur-gold whitespace-nowrap">
                                            ₹
                                            {Number(
                                                product.price ?? 0
                                            ).toFixed(2)}
                                        </td>

                                        <td className="px-5 py-4 text-khajur-dark/70 whitespace-nowrap">
                                            ₹
                                            {Number(
                                                product.delivery_charge ?? 0
                                            ).toFixed(2)}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span
                                                className={`text-sm font-medium ${
                                                    product.stock <= 0
                                                        ? 'text-red-500'
                                                        : product.stock < 5
                                                        ? 'text-orange-500'
                                                        : 'text-khajur-dark/70'
                                                }`}
                                            >
                                                {product.stock}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleStock(product)
                                                }
                                                className="flex items-center gap-1.5 hover:opacity-70"
                                                data-testid={`toggle-stock-${product.id}`}
                                                aria-label={`Toggle stock for ${product.name}`}
                                            >
                                                {product.stock > 0 ? (
                                                    <>
                                                        <ToggleRight className="w-6 h-6 text-green-500" />
                                                        <span className="text-xs font-medium text-green-600">
                                                            In Stock
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ToggleLeft className="w-6 h-6 text-red-400" />
                                                        <span className="text-xs font-medium text-red-500">
                                                            Out of Stock
                                                        </span>
                                                    </>
                                                )}
                                            </button>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEditModal(product)
                                                    }
                                                    className="text-khajur-primary hover:text-khajur-gold"
                                                    aria-label={`Edit ${product.name}`}
                                                    data-testid={`edit-product-${product.id}`}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDelete(product.id)
                                                    }
                                                    disabled={
                                                        deletingId ===
                                                        product.id
                                                    }
                                                    className="text-red-400 hover:text-red-600 disabled:opacity-40"
                                                    aria-label={`Delete ${product.name}`}
                                                    data-testid={`delete-product-${product.id}`}
                                                >
                                                    {deletingId ===
                                                    product.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
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
