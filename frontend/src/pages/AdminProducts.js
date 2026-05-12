import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit, Trash2, ChevronLeft, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
console.log("Backend URL:", BACKEND_URL);


const AdminProducts = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        sizes: [{ weight: "", price: "" }],
        original_price: '',
        category: '',
        image: '',

        stock: '',
        featured: false,
        delivery_charge: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [productsRes, categoriesRes] = await Promise.all([
                axios.get(`${API}/products`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API}/categories`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setProducts(productsRes.data);
            setCategories(categoriesRes.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const handleAddProduct = () => {
        setEditingProduct(null);
        setFormData({
            name: '',
            description: '',
            sizes: [{ weight: "", price: "" }],
            category: '',
            image: '',
            stock: '',
            featured: false,
            delivery_charge: ''
        });
        setShowModal(true);
    };

    const handleEditProduct = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description,
            sizes: product.sizes || [{ weight: "", price: "" }],
            category: product.category,
            image: product.image,
            stock: product.stock,
            featured: product.featured,
            delivery_charge: product.delivery_charge || 0
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.sizes.some(s => !s.weight || !s.price)) {
            toast.error("Please fill all size and price fields");
            return;
        }

        try {
            const productData = {
                ...formData,
                sizes: formData.sizes.map(s => ({
                    weight: s.weight,
                    price: parseFloat(s.price)
                })),
                original_price: formData.original_price
                    ? parseFloat(formData.original_price)
                    : null,   // ✅ ADD THIS
                stock: parseInt(formData.stock),
                delivery_charge: parseFloat(formData.delivery_charge || 0)
            };

            if (editingProduct) {
                await axios.put(
                    `${API}/admin/products/${editingProduct.id}`,
                    productData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.success('Product updated successfully');
            } else {
                await axios.post(
                    `${API}/admin/products`,
                    productData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.success('Product added successfully');
            }

            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error('Failed to save product', error);
            toast.error(error.response?.data?.detail || 'Failed to save product');
        }
    };

    const handleDelete = async (productId) => {
        if (!window.confirm('Are you sure you want to delete this product?')) {
            return;
        }

        try {
            await axios.delete(`${API}/admin/products/${productId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Product deleted successfully');
            fetchData();
        } catch (error) {
            console.error('Failed to delete product', error);
            toast.error('Failed to delete product');
        }
    };

    const toggleStock = async (product) => {
        try {
            await axios.put(
                `${API}/admin/products/${product.id}`,
                { stock: product.stock > 0 ? 0 : 10 },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(product.stock > 0 ? 'Product marked out of stock' : 'Product marked in stock');
            fetchData();
        } catch (error) {
            toast.error('Failed to update stock status');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-khajur-dark/60">Loading products...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-20 bg-white" data-testid="admin-products-page">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center">
                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            className="mr-4 text-khajur-primary hover:text-khajur-gold"
                            data-testid="back-to-dashboard"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <h1 className="font-serif text-4xl font-medium text-khajur-primary">
                            Manage Products
                        </h1>
                    </div>
                    <button
                        onClick={handleAddProduct}
                        className="bg-khajur-gold text-khajur-primary hover:bg-khajur-gold/90 rounded-sm px-6 py-3 uppercase tracking-widest text-xs font-bold transition-all inline-flex items-center"
                        data-testid="add-product-button"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Product
                    </button>
                </div>

                {/* Products Table */}
                <div className="bg-white border border-khajur-border overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-khajur-cream">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-khajur-primary uppercase tracking-wider">Image</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-khajur-primary uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-khajur-primary uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-khajur-primary uppercase tracking-wider">Price</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-khajur-primary uppercase tracking-wider">Delivery</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-khajur-primary uppercase tracking-wider">Stock</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-khajur-primary uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-khajur-primary uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-khajur-border">
                            {products.map((product) => (
                                <tr key={product.id} className="hover:bg-khajur-cream/50">
                                    <td className="px-6 py-4">
                                        <img src={product.image} alt={product.name} className="w-16 h-16 object-cover" />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-khajur-primary">{product.name}</div>
                                        <div className="text-xs text-khajur-dark/60">{product.weight}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-khajur-dark/80">{product.category}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-khajur-gold">₹{product.price}</td>
                                    <td className="px-6 py-4 text-sm text-khajur-dark/80">₹{product.delivery_charge || 0}</td>
                                    <td className="px-6 py-4 text-sm text-khajur-dark/80">{product.stock}</td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => toggleStock(product)}
                                            className="flex items-center space-x-2"
                                            data-testid={`toggle-stock-${product.id}`}
                                        >
                                            {product.stock > 0 ? (
                                                <>
                                                    <ToggleRight className="w-6 h-6 text-green-600" />
                                                    <span className="text-xs text-green-600 font-medium">In Stock</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ToggleLeft className="w-6 h-6 text-red-600" />
                                                    <span className="text-xs text-red-600 font-medium">Out of Stock</span>
                                                </>
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-3">
                                        <button
                                            onClick={() => handleEditProduct(product)}
                                            className="text-khajur-primary hover:text-khajur-gold"
                                            data-testid={`edit-product-${product.id}`}
                                        >
                                            <Edit className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product.id)}
                                            className="text-red-600 hover:text-red-800"
                                            data-testid={`delete-product-${product.id}`}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Add/Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="product-modal">
                        <div className="bg-white max-w-2xl w-full rounded-sm shadow-2xl max-h-[90vh] overflow-y-auto">
                            <div className="p-8">
                                <h2 className="font-serif text-3xl font-medium text-khajur-primary mb-6">
                                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                                </h2>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-khajur-dark mb-2">Product Name *</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-transparent border-b border-khajur-primary/20 focus:border-khajur-primary px-0 py-3 focus:ring-0 outline-none transition-colors"
                                                data-testid="product-name-input"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-khajur-dark mb-2">Category *</label>
                                            <select
                                                required
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full bg-transparent border-b border-khajur-primary/20 focus:border-khajur-primary px-0 py-3 focus:ring-0 outline-none transition-colors"
                                                data-testid="product-category-input"
                                            >
                                                <option value="">Select Category</option>
                                                {categories.map((cat) => (
                                                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-khajur-dark mb-2">Description *</label>
                                        <textarea
                                            required
                                            rows={12}
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full bg-transparent border border-khajur-primary/20 focus:border-khajur-primary px-4 py-3 focus:ring-0 outline-none transition-colors rounded-sm"
                                            data-testid="product-description-input"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                                        <div>
                                            <label className="block text-sm font-medium text-khajur-dark mb-2">Original Price (₹)</label>
                                            <input
                                                type="number"
                                                value={formData.original_price}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, original_price: e.target.value })
                                                }
                                                className="w-full bg-transparent border-b border-khajur-primary/20 focus:border-khajur-primary px-0 py-3 outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-khajur-dark mb-2">Delivery (₹) *</label>
                                            <input
                                                type="number"
                                                required
                                                step="0.01"
                                                value={formData.delivery_charge}
                                                onChange={(e) => setFormData({ ...formData, delivery_charge: e.target.value })}
                                                className="w-full bg-transparent border-b border-khajur-primary/20 focus:border-khajur-primary px-0 py-3 focus:ring-0 outline-none transition-colors"
                                                data-testid="product-delivery-input"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-khajur-dark mb-2">Stock *</label>
                                            <input
                                                type="number"
                                                required
                                                value={formData.stock}
                                                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                                className="w-full bg-transparent border-b border-khajur-primary/20 focus:border-khajur-primary px-0 py-3 focus:ring-0 outline-none transition-colors"
                                                data-testid="product-stock-input"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-khajur-dark mb-2">
                                            Sizes & Prices
                                        </label>

                                        {formData.sizes.map((item, index) => (
                                            <div key={index} className="flex gap-3 mb-2">

                                                <input
                                                    type="text"
                                                    placeholder="Weight (e.g. 250g)"
                                                    value={item.weight}
                                                    onChange={(e) => {
                                                        const newSizes = [...formData.sizes];
                                                        newSizes[index].weight = e.target.value;
                                                        setFormData({ ...formData, sizes: newSizes });
                                                    }}
                                                    className="border px-3 py-2 w-1/2"
                                                />

                                                <input
                                                    type="number"
                                                    placeholder="Price"
                                                    value={item.price}
                                                    onChange={(e) => {
                                                        const newSizes = [...formData.sizes];
                                                        newSizes[index].price = e.target.value;
                                                        setFormData({ ...formData, sizes: newSizes });
                                                    }}
                                                    className="border px-3 py-2 w-1/2"
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newSizes = formData.sizes.filter((_, i) => i !== index);
                                                        setFormData({ ...formData, sizes: newSizes });
                                                    }}
                                                    className="text-red-500"
                                                >
                                                    ❌
                                                </button>

                                            </div>
                                        ))}

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setFormData({
                                                    ...formData,
                                                    sizes: [...formData.sizes, { weight: "", price: "" }]
                                                })
                                            }
                                            className="mt-2 text-sm text-khajur-primary"
                                        >
                                            + Add Size
                                        </button>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-khajur-dark mb-2">Image URL *</label>
                                        <input
                                            type="url"
                                            required
                                            value={formData.image}
                                            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                            className="w-full bg-transparent border-b border-khajur-primary/20 focus:border-khajur-primary px-0 py-3 focus:ring-0 outline-none transition-colors"
                                            data-testid="product-image-input"
                                        />
                                    </div>

                                    <div>
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.featured}
                                                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                                                className="text-khajur-primary focus:ring-khajur-gold"
                                                data-testid="product-featured-input"
                                            />
                                            <span className="text-sm font-medium text-khajur-dark">Featured Product</span>
                                        </label>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="submit"
                                            className="flex-1 bg-khajur-gold text-khajur-primary hover:bg-khajur-gold/90 rounded-sm px-8 py-3 uppercase tracking-widest text-xs font-bold transition-all"
                                            data-testid="save-product-button"
                                        >
                                            {editingProduct ? 'Update Product' : 'Add Product'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="flex-1 bg-transparent border border-khajur-primary text-khajur-primary hover:bg-khajur-primary hover:text-khajur-cream rounded-sm px-8 py-3 uppercase tracking-widest text-xs font-bold transition-all"
                                            data-testid="cancel-product-button"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminProducts;
