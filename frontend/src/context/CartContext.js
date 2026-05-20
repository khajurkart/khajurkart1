import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
console.log("Backend URL:", BACKEND_URL);

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState({ items: [] });
    const [loading, setLoading] = useState(false);
    const { user, token } = useAuth();

    const fetchCart = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API}/cart`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCart(response.data);
        } catch (error) {
            console.error('Failed to fetch cart', error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (user && token) {
            fetchCart();
        }
    }, [user, token, fetchCart]);

    const addToCart = (productId, quantity, size) => {
        setCart(prev => {
            const existing = prev.items.find(
                item => item.product.id === productId && item.size === size
            );

            if (existing) {
                return {
                    ...prev,
                    items: prev.items.map(item =>
                        item.product.id === productId && item.size === size
                            ? { ...item, quantity: item.quantity + quantity }
                            : item
                    )
                };
            }

            return {
                ...prev,
                items: [
                    ...prev.items,
                    {
                        product: products.find(p => p.id === productId), // make sure products exists here
                        quantity,
                        size // ✅ THIS FIXES YOUR ISSUE
                    }
                ]
            };
        });
    };

    const updateCartItem = async (productId, quantity, size) => {
        try {
            await axios.post(
                `${API}/cart/update`,
                { product_id: productId, quantity, size },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchCart();
        } catch (error) {
            toast.error('Failed to update cart');
            console.error('Failed to update cart', error);
        }
    };

    const removeFromCart = async (productId) => {
        try {
            await axios.delete(`${API}/cart/remove/${productId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchCart();
            toast.success('Removed from cart');
        } catch (error) {
            toast.error('Failed to remove from cart');
            console.error('Failed to remove from cart', error);
        }
    };

    const clearCart = async () => {
        try {
            await axios.delete(`${API}/cart/clear`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCart({ items: [] });
        } catch (error) {
            console.error('Failed to clear cart', error);
        }
    };

    const cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
    const cartTotal = cart.items.reduce((total, item) => {
        return total + (item.product ? item.product.price * item.quantity : 0);
    }, 0);


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
                cartTotal
            }}
        >
            {children}
        </CartContext.Provider>
    );
};
