import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GUEST_CART_KEY = 'khajurkart_guest_cart';

const CartContext = createContext(null);

export const useCart = () => {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }

    return context;
};

// ------------------------------
// Guest cart helper functions
// ------------------------------

const emptyCart = { items: [] };

const readGuestCart = () => {
    try {
        const savedCart = localStorage.getItem(GUEST_CART_KEY);

        if (!savedCart) {
            return { items: [] };
        }

        const parsedCart = JSON.parse(savedCart);

        return {
            items: Array.isArray(parsedCart.items)
                ? parsedCart.items
                : [],
        };
    } catch (error) {
        console.error('Failed to read guest cart:', error);
        return { items: [] };
    }
};

const saveGuestCart = (cartData) => {
    try {
        localStorage.setItem(
            GUEST_CART_KEY,
            JSON.stringify(cartData)
        );

        return true;
    } catch (error) {
        console.error('Failed to save guest cart:', error);
        return false;
    }
};

// Identify a cart item by product and selected size.
const getItemKey = (item) => {
    const productId =
        item.product_id ??
        item.product?.id ??
        item.product?._id ??
        item.id;

    const size = item.size ?? '';

    return `${String(productId)}:${String(size)}`;
};

const getProductId = (item) =>
    item.product_id ??
    item.product?.id ??
    item.product?._id ??
    item.id;

// ------------------------------
// Cart Provider
// ------------------------------

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState({ items: [] });
    const [loading, setLoading] = useState(false);

    const { user, token } = useAuth();

    const isLoggedIn = Boolean(user && token);

    // ------------------------------
    // Fetch cart
    // ------------------------------

    const fetchCart = useCallback(async () => {
        // Guest: load cart from this browser.
        if (!isLoggedIn) {
            const guestCart = readGuestCart();
            setCart(guestCart);
            return guestCart;
        }

        // Logged-in customer: load cart from backend.
        try {
            setLoading(true);

            const response = await axios.get(`${API}/cart`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const serverCart = {
                ...response.data,
                items: Array.isArray(response.data?.items)
                    ? response.data.items
                    : [],
            };

            setCart(serverCart);

            return serverCart;
        } catch (error) {
            console.error('Failed to fetch cart:', error);

            toast.error('Unable to load your cart.');

            return null;
        } finally {
            setLoading(false);
        }
    }, [isLoggedIn, token]);

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    // ------------------------------
    // Add product to cart
    // ------------------------------

    const addToCart = async (
        productId,
        quantity = 1,
        size = null,
        product = null
    ) => {
        if (!productId) {
            toast.error('Unable to identify this product.');
            return false;
        }

        const amount = Number(quantity);

        if (!Number.isInteger(amount) || amount < 1) {
            toast.error('Please select a valid quantity.');
            return false;
        }

        // Guest cart: no login required.
        if (!isLoggedIn) {
            const currentCart = readGuestCart();

            const newItem = {
                id: productId,
                product_id: productId,
                quantity: amount,
                size,
                ...(product ? { product } : {}),
            };

            const itemKey = getItemKey(newItem);

            const existingIndex = currentCart.items.findIndex(
                (item) => getItemKey(item) === itemKey
            );

            let updatedItems;

            if (existingIndex !== -1) {
                updatedItems = currentCart.items.map(
                    (item, index) => {
                        if (index !== existingIndex) {
                            return item;
                        }

                        return {
                            ...item,
                            quantity:
                                Number(item.quantity || 0) + amount,
                            ...(product ? { product } : {}),
                        };
                    }
                );
            } else {
                updatedItems = [
                    ...currentCart.items,
                    newItem,
                ];
            }

            const updatedCart = {
                items: updatedItems,
            };

            const saved = saveGuestCart(updatedCart);

            if (!saved) {
                toast.error(
                    'Unable to save your cart. Please check your browser storage.'
                );
                return false;
            }

            setCart(updatedCart);

            return true;
        }

        // Authenticated cart: use backend API.
        try {
            await axios.post(
                `${API}/cart/add`,
                {
                    product_id: productId,
                    quantity: amount,
                    size,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            await fetchCart();

            return true;
        } catch (error) {
            console.error('Failed to add to cart:', error);

            toast.error(
                error.response?.data?.detail ||
                'Failed to add to cart.'
            );

            return false;
        }
    };

    // ------------------------------
    // Update cart quantity
    // ------------------------------

    const updateCartItem = async (
        productId,
        quantity,
        size = null
    ) => {
        const amount = Number(quantity);

        if (!Number.isInteger(amount) || amount < 1) {
            toast.error('Please select a valid quantity.');
            return false;
        }

        // Guest cart.
        if (!isLoggedIn) {
            const currentCart = readGuestCart();

            const updatedCart = {
                items: currentCart.items.map((item) => {
                    const sameProduct =
                        String(getProductId(item)) ===
                        String(productId);

                    const sameSize =
                        (item.size ?? null) === (size ?? null);

                    if (sameProduct && sameSize) {
                        return {
                            ...item,
                            quantity: amount,
                        };
                    }

                    return item;
                }),
            };

            const saved = saveGuestCart(updatedCart);

            if (!saved) {
                toast.error('Unable to save your cart changes.');
                return false;
            }

            setCart(updatedCart);

            return true;
        }

        // Authenticated cart.
        try {
            await axios.post(
                `${API}/cart/update`,
                {
                    product_id: productId,
                    quantity: amount,
                    size,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            await fetchCart();

            return true;
        } catch (error) {
            console.error('Failed to update cart:', error);

            toast.error(
                error.response?.data?.detail ||
                'Failed to update cart.'
            );

            return false;
        }
    };

    // ------------------------------
    // Remove product from cart
    // ------------------------------

    const removeFromCart = async (
        productId,
        size = null
    ) => {
        // Guest cart.
        if (!isLoggedIn) {
            const currentCart = readGuestCart();

            const updatedCart = {
                items: currentCart.items.filter((item) => {
                    const sameProduct =
                        String(getProductId(item)) ===
                        String(productId);

                    const sameSize =
                        (item.size ?? null) === (size ?? null);

                    return !(sameProduct && sameSize);
                }),
            };

            const saved = saveGuestCart(updatedCart);

            if (!saved) {
                toast.error('Unable to update your cart.');
                return false;
            }

            setCart(updatedCart);

            toast.success('Removed from cart');

            return true;
        }

        // Authenticated cart.
        try {
            await axios.delete(
                `${API}/cart/remove/${productId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            await fetchCart();

            toast.success('Removed from cart');

            return true;
        } catch (error) {
            console.error('Failed to remove from cart:', error);

            toast.error(
                error.response?.data?.detail ||
                'Failed to remove from cart.'
            );

            return false;
        }
    };

    // ------------------------------
    // Clear cart
    // ------------------------------

    const clearCart = async () => {
        // Guest cart.
        if (!isLoggedIn) {
            const saved = saveGuestCart(emptyCart);

            if (!saved) {
                toast.error('Unable to clear your cart.');
                return false;
            }

            setCart({ items: [] });

            return true;
        }

        // Authenticated cart.
        try {
            await axios.delete(`${API}/cart/clear`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setCart({ items: [] });

            return true;
        } catch (error) {
            console.error('Failed to clear cart:', error);

            toast.error('Failed to clear cart.');

            return false;
        }
    };

    // ------------------------------
    // Cart count and subtotal
    // ------------------------------

    const cartCount = cart.items.reduce(
        (total, item) =>
            total + Number(item.quantity || 0),
        0
    );

    const cartTotal = cart.items.reduce((total, item) => {
        const price = Number(
            item.product?.price ??
            item.price ??
            0
        );

        return total + price * Number(item.quantity || 0);
    }, 0);

    // ------------------------------
    // Provider
    // ------------------------------

    return (
        <CartContext.Provider
            value={{
                cart,
                loading,
                addToCart,
                updateCartItem,
                removeFromCart,
                clearCart,
                fetchCart,
                cartCount,
                cartTotal,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};
