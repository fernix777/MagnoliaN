import { createContext, useContext, useState, useEffect } from 'react';
import { trackAddToCart } from '../services/facebookService';
import { trackAddToCart as trackPixelAddToCart } from '../utils/facebookPixel';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cart, setCart] = useState(() => {
        // Cargar el carrito desde localStorage si existe
        if (typeof window !== 'undefined') {
            const savedCart = localStorage.getItem('cart');
            return savedCart ? JSON.parse(savedCart) : [];
        }
        return [];
    });

    const { user } = useAuth();

    // Guardar el carrito en localStorage cuando cambie
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('cart', JSON.stringify(cart));
        }
    }, [cart]);

    const addToCart = (product, quantity = 1, options = {}) => {
        // Rastrear en Facebook
        const currentUser = user ? {
            email: user.email,
            user_id: user.id
        } : null;
        trackAddToCart(product, quantity, currentUser);
        // Rastrear en Facebook Pixel
        const finalPrice = options.finalPrice || product.base_price;
        trackPixelAddToCart(product.name, finalPrice);

        setCart(prevCart => {
            // Verificar si el producto ya está en el carrito
            const existingItemIndex = prevCart.findIndex(item =>
                item.id === product.id &&
                item.purchaseType === options.purchaseType &&
                item.selectedColor === options.selectedColor &&
                item.selectedCondition === options.selectedCondition
            );

            if (existingItemIndex >= 0) {
                // Si ya existe, actualizar la cantidad
                const newCart = [...prevCart];
                newCart[existingItemIndex].quantity += quantity;
                return newCart;
            } else {
                // Si no existe, agregar nuevo ítem
                return [
                    ...prevCart,
                    {
                        ...product,
                        quantity,
                        purchaseType: options.purchaseType || 'paquete',
                        selectedColor: options.selectedColor || '',
                        selectedCondition: options.selectedCondition || '',
                        selectedVariant: options.selectedVariant || null,
                        price: options.finalPrice || product.base_price
                    }
                ];
            }
        });
    };

    const removeFromCart = (productId, options = {}) => {
        setCart(prevCart => prevCart.filter(item => {
            // Si se pasan opciones, comparar también las variantes
            if (options.purchaseType || options.selectedColor || options.selectedCondition) {
                return !(
                    item.id === productId &&
                    item.purchaseType === options.purchaseType &&
                    item.selectedColor === options.selectedColor &&
                    item.selectedCondition === options.selectedCondition
                );
            }
            // Si no hay opciones, eliminar solo por ID (para retrocompatibilidad)
            return item.id !== productId;
        }));
    };

    const updateQuantity = (productId, newQuantity, options = {}) => {
        if (newQuantity < 1) return;

        setCart(prevCart =>
            prevCart.map(item => {
                // Si se pasan opciones, comparar también las variantes
                if (options.purchaseType || options.selectedColor || options.selectedCondition) {
                    if (
                        item.id === productId &&
                        item.purchaseType === options.purchaseType &&
                        item.selectedColor === options.selectedColor &&
                        item.selectedCondition === options.selectedCondition
                    ) {
                        return { ...item, quantity: newQuantity };
                    }
                    return item;
                }
                // Si no hay opciones, actualizar solo por ID (para retrocompatibilidad)
                return item.id === productId
                    ? { ...item, quantity: newQuantity }
                    : item;
            })
        );
    };

    const clearCart = () => {
        setCart([]);
    };

    const getCartTotal = () => {
        return cart.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    };

    const getCartCount = () => {
        return cart.reduce((total, item) => total + item.quantity, 0);
    };

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                getCartTotal,
                getCartCount
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart debe usarse dentro de un CartProvider');
    }
    return context;
};
