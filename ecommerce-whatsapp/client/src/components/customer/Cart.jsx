import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { FaTimes, FaMinus, FaPlus, FaWhatsapp, FaShoppingCart } from 'react-icons/fa';
import './Cart.css';

export default function Cart({ onClose }) {
    const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isCheckout, setIsCheckout] = useState(false);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    };

    const handleCheckout = () => {
        if (!user) {
            navigate('/login?redirect=/carrito');
            return;
        }
        setIsCheckout(true);
    };

    const handleWhatsAppOrder = () => {
        if (!user) return;

        const phoneNumber = '543885171795';
        let message = '🛒 *PEDIDO DE COMPRA*\n\n';

        // Detalles del cliente
        message += `👤 *Cliente:* ${user.user_metadata?.full_name || 'Cliente'}\n`;
        message += `📧 *Email:* ${user.email}\n\n`;

        // Productos
        message += '📋 *Productos solicitados:*\n';
        cart.forEach((item, index) => {
            message += `\n${index + 1}. *${item.name}*\n`;
            message += `   - Cantidad: ${item.quantity} ${item.purchaseType === 'caja' ? 'cajas' : item.purchaseType === 'bulto' ? 'bultos' : 'unidades'}\n`;
            message += `   - Precio unitario: ${formatPrice(item.price)}\n`;
            message += `   - Subtotal: ${formatPrice(item.price * item.quantity)}\n`;

            if (item.selectedColor) {
                message += `   - Color: ${item.selectedColor}\n`;
            }
            if (item.selectedCondition) {
                message += `   - Condición: ${item.selectedCondition}\n`;
            }
        });

        // Total
        message += `\n💰 *Total a pagar: ${formatPrice(getCartTotal())}*\n\n`;
        message += '¡Hola! Me gustaría realizar este pedido. ¿Podrían confirmarme disponibilidad y forma de pago?';

        // Abrir WhatsApp
        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');

        // Limpiar carrito después de enviar
        clearCart();
        onClose();
    };

    if (cart.length === 0) {
        return (
            <div className="cart-overlay active" onClick={onClose}>
                <div className="cart-container empty-cart" onClick={(e) => e.stopPropagation()}>
                    <div className="cart-header">
                        <h3>Tu carrito está vacío</h3>
                        <button className="close-cart" onClick={onClose}>
                            <FaTimes />
                        </button>
                    </div>
                    <div className="empty-cart-message">
                        <FaShoppingCart className="empty-cart-icon" />
                        <p>No hay productos en tu carrito</p>
                        <button className="btn btn-primary" onClick={onClose}>
                            Seguir comprando
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-overlay active" onClick={onClose}>
            <div className="cart-container" onClick={(e) => e.stopPropagation()}>
                <div className="cart-header">
                    <h3>Tu Carrito</h3>
                    <button className="close-cart" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className="cart-items">
                    {cart.map(item => (
                        <div key={`${item.id}-${item.selectedColor}-${item.selectedCondition}`} className="cart-item">
                            <div className="item-image">
                                <img src={item.images?.[0]?.image_url || item.images?.[0]?.url || '/placeholder-product.jpg'} alt={item.name} />
                            </div>
                            <div className="item-details">
                                <h4>{item.name}</h4>
                                <p className="item-variant">
                                    {item.purchaseType === 'caja' ? 'Caja' : 'Bulto'}
                                    {item.selectedColor && ` • ${item.selectedColor}`}
                                    {item.selectedCondition && ` • ${item.selectedCondition}`}
                                </p>
                                <p className="item-price">{formatPrice(item.price)} c/u</p>

                                <div className="item-quantity">
                                    <button
                                        onClick={() => updateQuantity(
                                            item.id,
                                            item.quantity - 1,
                                            {
                                                purchaseType: item.purchaseType,
                                                selectedColor: item.selectedColor,
                                                selectedCondition: item.selectedCondition
                                            }
                                        )}
                                        disabled={item.quantity <= 1}
                                    >
                                        <FaMinus />
                                    </button>
                                    <span>{item.quantity}</span>
                                    <button onClick={() => updateQuantity(
                                        item.id,
                                        item.quantity + 1,
                                        {
                                            purchaseType: item.purchaseType,
                                            selectedColor: item.selectedColor,
                                            selectedCondition: item.selectedCondition
                                        }
                                    )}>
                                        <FaPlus />
                                    </button>
                                </div>
                            </div>
                            <div className="item-total">
                                <button
                                    className="remove-item"
                                    onClick={() => removeFromCart(
                                        item.id,
                                        {
                                            purchaseType: item.purchaseType,
                                            selectedColor: item.selectedColor,
                                            selectedCondition: item.selectedCondition
                                        }
                                    )}
                                >
                                    <FaTimes />
                                </button>
                                <span>{formatPrice(item.price * item.quantity)}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="cart-summary">
                    <div className="cart-total">
                        <span>Total:</span>
                        <span className="total-amount">{formatPrice(getCartTotal())}</span>
                    </div>

                    {isCheckout ? (
                        <div className="checkout-options">
                            <p>¿Cómo deseas realizar tu pedido?</p>
                            <button
                                className="btn btn-whatsapp"
                                onClick={handleWhatsAppOrder}
                            >
                                <FaWhatsapp /> Completar por WhatsApp
                            </button>
                            <button
                                className="btn btn-outline"
                                onClick={() => setIsCheckout(false)}
                            >
                                Volver al carrito
                            </button>
                        </div>
                    ) : (
                        <div className="cart-actions">
                            <button
                                className="btn btn-primary"
                                onClick={handleCheckout}
                            >
                                Iniciar compra
                            </button>
                            <button
                                className="btn btn-text"
                                onClick={clearCart}
                            >
                                Vaciar carrito
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
