import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
} from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GUEST_CART_KEY = 'khajurkart_guest_cart';

const CartContext = createContext(null);

// ------------------------------
// Public hook
// ------------------------------

export const useCart = () => {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }

    return context;
};

// ------------------------------
// Guest cart helpers
// ------------------------------

const emptyCart = { items: [] };

const readGuestCart = () => {
    try {
        const savedCart = localStorage.getItem(GUEST_CART_KEY);

        if (!savedCart) {
            return { items: [] };
        }

        const parsedCart = JSON.parse(savedCart);

        // Support both { items: [...] } and [...] formats.
        const items = Array.isArray(parsedCart)
            ? parsedCart
            : Array.isArray(parsedCart?.items)
                ? parsedCart.items
                : [];

        return { items };
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

const getProductId = (item) =>
    item.product_id ??
    item.product?.id ??
    item.product?._id ??
    item.id ??
    item._id;

const getItemKey = (item) => {
    const productId = getProductId(item);
    const size = String(item.size ?? '').trim();

    return `${String(productId)}::${size}`;
};

const normalizeCart = (data) => ({
    ...(data && typeof data === 'object' ? data : {}),
    items: Array.isArray(data?.items) ? data.items : [],
});

const getItemPrice = (item) =>
    Number(
        item.product?.price ??
        item.price ??
        0
    );

// ------------------------------
// Cart Provider
// ------------------------------

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState({ items: [] });
    const [loading, setLoading] = useState(false);

    const { user, token } = useAuth();

    const isLoggedIn = Boolean(user && token);

    // Prevent stale effects from updating the cart after auth changes.
    const authVersionRef = useRef(0);

    // Prevent concurrent synchronization attempts.
    const syncingRef = useRef(false);

    // ------------------------------
    // Fetch server cart
    // ------------------------------

    const fetchCart = useCallback(async () => {
        if (!isLoggedIn) {
            const guestCart = readGuestCart();
            setCart(guestCart);
            return guestCart;
        }

        try {
            setLoading(true);

            const response = await axios.get(`${API}/cart`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const serverCart = normalizeCart(response.data);

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

    // ------------------------------
    // Synchronize guest cart after login
    // ------------------------------

    useEffect(() => {
        const version = ++authVersionRef.current;
        let cancelled = false;

        const isCurrent = () =>
            !cancelled &&
            authVersionRef.current === version;

        const syncCart = async () => {
            if (!isLoggedIn) {
                setCart(readGuestCart());
                setLoading(false);
                return;
            }

            // Wait if another synchronization is already in progress.
            if (syncingRef.current) {
                return;
            }

            syncingRef.current = true;
            setLoading(true);

            try {
                // Read guest items before loading the server cart.
                const guestCart = readGuestCart();
                const guestItems = guestCart.items;

                // Fetch the customer's existing cart.
                const response = await axios.get(`${API}/cart`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!isCurrent()) return;

                let serverCart = normalizeCart(response.data);

                if (guestItems.length > 0) {
                    // Merge matching product/size combinations by adding
                    // quantities to the existing server quantity.
                    const serverKeys = new Set(
                        serverCart.items.map(getItemKey)
                    );

                    for (const guestItem of guestItems) {
                        if (!isCurrent()) return;

                        const productId = getProductId(guestItem);

                        if (!productId) {
                            throw new Error(
                                'A guest cart item has no product ID.'
                            );
                        }

                        const guestKey = getItemKey(guestItem);

                        // Skip duplicate submission if the item is already
                        // represented in the server cart. This avoids
                        // repeating the same add when synchronization retries.
                        if (serverKeys.has(guestKey)) {
                            const existingItem = serverCart.items.find(
                                (item) => getItemKey(item) === guestKey
                            );

                            const existingQuantity = Number(
                                existingItem?.quantity || 0
                            );

                            const guestQuantity = Number(
                                guestItem.quantity || 1
                            );

                            // Update to the combined quantity when the
                            // backend supports this endpoint.
                            await axios.post(
                                `${API}/cart/update`,
                                {
                                    product_id: productId,
                                    quantity:
                                        existingQuantity + guestQuantity,
                                    size: guestItem.size ?? null,
                                },
                                {
                                    headers: {
                                        Authorization: `Bearer ${token}`,
                                    },
                                }
                            );
                        } else {
                            await axios.post(
                                `${API}/cart/add`,
                                {
                                    product_id: productId,
                                    quantity: Number(
                                        guestItem.quantity || 1
                                    ),
                                    size: guestItem.size ?? null,
                                },
                                {
                                    headers: {
                                        Authorization: `Bearer ${token}`,
                                    },
                                }
                            );

                            serverKeys.add(guestKey);
                        }

                        if (!isCurrent()) return;
                    }

                    // Confirm that the backend contains the merged items
                    // before removing the guest cart.
                    const mergedResponse = await axios.get(
                        `${API}/cart`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    );

                    if (!isCurrent()) return;

                    serverCart = normalizeCart(mergedResponse.data);

                    // Only clear the guest cart if every guest item can
                    // be found in the server cart.
                    const allItemsSynced = guestItems.every(
                        (guestItem) =>
                            serverCart.items.some(
                                (serverItem) =>
                                    getItemKey(serverItem) ===
                                    getItemKey(guestItem)
                            )
                    );

                    if (!allItemsSynced) {
                        throw new Error(
                            'Some guest cart items were not found after syncing.'
                        );
                    }

                    // Clear only after the server cart has been verified.
                    localStorage.removeItem(GUEST_CART_KEY);
                }

                if (isCurrent()) {
                    setCart(serverCart);
                }
            } catch (error) {
                console.error(
                    'Failed to synchronize guest cart:',
                    error
                );

                // Keep the guest cart in localStorage if syncing fails.
                // Display it so the customer's items are not hidden.
                if (isCurrent()) {
                    setCart(readGuestCart());

                    toast.error(
                        'Your cart could not be synced. Your saved guest cart has been kept.'
                    );
                }
            } finally {
                syncingRef.current = false;

                if (isCurrent()) {
                    setLoading(false);
                }
            }
        };

        syncCart();

        return () => {
            cancelled = true;
        };
    }, [isLoggedIn, token]);

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
                ...(product
                    ? {
                        product: {
                            ...product,
                            id: product.id ?? productId,
                            price: Number(
                                product.price ??
                                product.sizes?.find(
                                    (s) => s.weight === size
                                )?.price ??
                                0
                            ),
                        },
                    }
                    : {}),
            };

            const itemKey = getItemKey(newItem);

            const existingIndex = currentCart.items.findIndex(
                (item) => getItemKey(item) === itemKey
            );

            let updatedItems;

            if (existingIndex !== -1) {
                updatedItems = currentCart.items.map(
                    (item, index) => {
                        if (index !== existingIndex) return item;

                        return {
                            ...item,
                            quantity:
                                Number(item.quantity || 0) + amount,
                            ...(product
                                ? { product: newItem.product }
                                : {}),
                        };
                    }
                );
            } else {
                updatedItems = [
                    ...currentCart.items,
                    newItem,
                ];
            }

            const updatedCart = { items: updatedItems };

            if (!saveGuestCart(updatedCart)) {
                toast.error(
                    'Unable to save your cart. Please check your browser storage.'
                );
                return false;
            }

            setCart(updatedCart);

            return true;
        }

        // Signed-in cart: use backend API.
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

        if (!isLoggedIn) {
            const currentCart = readGuestCart();

            const updatedCart = {
                items: currentCart.items.map((item) => {
                    const sameProduct =
                        String(getProductId(item)) ===
                        String(productId);

                    const sameSize =
                        String(item.size ?? '') ===
                        String(size ?? '');

                    return sameProduct && sameSize
                        ? { ...item, quantity: amount }
                        : item;
                }),
            };

            if (!saveGuestCart(updatedCart)) {
                toast.error('Unable to save your cart changes.');
                return false;
            }

            setCart(updatedCart);

            return true;
        }

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
        if (!isLoggedIn) {
            const currentCart = readGuestCart();

            const updatedCart = {
                items: currentCart.items.filter((item) => {
                    const sameProduct =
                        String(getProductId(item)) ===
                        String(productId);

                    const sameSize =
                        String(item.size ?? '') ===
                        String(size ?? '');

                    return !(sameProduct && sameSize);
                }),
            };

            if (!saveGuestCart(updatedCart)) {
                toast.error('Unable to update your cart.');
                return false;
            }

            setCart(updatedCart);

            toast.success('Removed from cart');

            return true;
        }

        try {
            // Note: this endpoint removes by product ID. If your backend
            // supports size-specific removal, pass size in its expected format.
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
        if (!isLoggedIn) {
            if (!saveGuestCart(emptyCart)) {
                toast.error('Unable to clear your cart.');
                return false;
            }

            setCart({ items: [] });

            return true;
        }

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

    const cartTotal = cart.items.reduce(
        (total, item) =>
            total + getItemPrice(item) * Number(item.quantity || 0),
        0
    );

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
