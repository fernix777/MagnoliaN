import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { trackInitiateCheckout, trackPurchase } from '../../services/facebookService'
import { trackInitiateCheckout as trackPixelInitiateCheckout } from '../../utils/facebookPixel'
import Header from '../../components/customer/Header'
import Footer from '../../components/customer/Footer'
import WhatsAppButton from '../../components/customer/WhatsAppButton'
import './CheckoutPage.css'

export default function CheckoutPage() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { cart, getCartTotal, getCartCount, clearCart } = useCart()
    
    const [formData, setFormData] = useState({
        firstName: user?.first_name || '',
        lastName: user?.last_name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || '',
        city: user?.city || 'San Salvador de Jujuy',
        state: user?.state || 'Jujuy',
        zipCode: user?.zip || '',
        country: user?.country || 'AR',
        instructions: ''
    })
    
    const [paymentMethod, setPaymentMethod] = useState('whatsapp')
    const [processing, setProcessing] = useState(false)
    const [checkoutInitiated, setCheckoutInitiated] = useState(false)

    const cartTotal = getCartTotal()
    const cartItemsCount = getCartCount()

    // Rastrear InitiateCheckout cuando el componente se monta
    useEffect(() => {
        if (cart.length > 0 && !checkoutInitiated) {
            const userData = user ? {
                email: user.email,
                user_id: user.id,
                phone: user.phone,
                first_name: user.first_name,
                last_name: user.last_name
            } : null
            
            trackInitiateCheckout(cartTotal, cartItemsCount, userData)
            // Rastrear en Facebook Pixel
            trackPixelInitiateCheckout(cartTotal)
            setCheckoutInitiated(true)
        }
    }, [cart, user, cartTotal, cartItemsCount, checkoutInitiated])

    if (cart.length === 0) {
        return (
            <div className="checkout-page">
                <Header />
                <main className="container">
                    <div className="empty-cart">
                        <h2>Tu carrito está vacío</h2>
                        <p>Agrega productos antes de proceder al checkout</p>
                        <Link to="/products" className="btn btn-primary">
                            Continuar comprando
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setProcessing(true)

        try {
            // Preparar datos de la orden
            const orderData = {
                customer: formData,
                items: cart,
                total: cartTotal,
                itemsCount: cartItemsCount,
                paymentMethod,
                timestamp: new Date().toISOString()
            }

            // Guardar la orden en localStorage o enviarla al servidor
            const orderId = `ORD-${Date.now()}`
            const orderWithId = { ...orderData, order_id: orderId }
            
            localStorage.setItem('lastOrder', JSON.stringify(orderWithId))

            // Rastrear la compra en Facebook
            const fbOrderData = {
                id: orderId,
                user: {
                    email: user?.email,
                    user_id: user?.id
                },
                total: cartTotal,
                items: cart.map(item => ({
                    product_id: item.id,
                    product_name: item.name,
                    quantity: item.quantity,
                    price: item.price
                }))
            }
            trackPurchase(fbOrderData)

            // Si el método de pago es WhatsApp, abrir el chat
            if (paymentMethod === 'whatsapp') {
                const phoneNumber = '543885171795'
                let message = '🛒 *PEDIDO DE COMPRA*\n\n'
                message += `👤 *Cliente:* ${formData.firstName} ${formData.lastName}\n`
                message += `📧 *Email:* ${formData.email}\n`
                message += `📞 *Teléfono:* ${formData.phone}\n`
                message += `📍 *Dirección:* ${formData.address}, ${formData.city}, ${formData.state}\n\n`
                
                message += '📋 *Productos solicitados:*\n'
                cart.forEach((item, index) => {
                    message += `\n${index + 1}. *${item.name}*\n`
                    message += `   - Cantidad: ${item.quantity}\n`
                    message += `   - Precio unitario: $${item.price.toLocaleString('es-AR')}\n`
                    message += `   - Subtotal: $${(item.price * item.quantity).toLocaleString('es-AR')}\n`
                })
                
                message += `\n💰 *Total a pagar: $${cartTotal.toLocaleString('es-AR')}*\n\n`
                message += `ID de Orden: ${orderId}\n`
                message += '¡Hola! Quisiera confirmar este pedido.'

                const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
                window.open(url, '_blank')
            }

            // Redirigir a confirmación
            navigate('/order-confirmation', { state: { orderId, order: orderWithId } })
            
            // Limpiar carrito
            clearCart()

        } catch (error) {
            console.error('Error al procesar la compra:', error)
            alert('Hubo un error al procesar tu compra. Por favor intenta nuevamente.')
        } finally {
            setProcessing(false)
        }
    }

    return (
        <div className="checkout-page">
            <Header />
            
            <main className="container">
                <div className="breadcrumb">
                    <Link to="/">Inicio</Link>
                    <span>/</span>
                    <Link to="/cart">Carrito</Link>
                    <span>/</span>
                    <span>Checkout</span>
                </div>

                <h1>Carrito de Compras</h1>

                <div className="checkout-container">
                    {/* Resumen de carrito */}
                    <div className="cart-summary">
                        <h2>Resumen de tu compra</h2>
                        <div className="cart-items">
                            {cart.map((item, index) => (
                                <div key={index} className="cart-item-checkout">
                                    <div className="item-info">
                                        <h4>{item.name}</h4>
                                        <p className="item-details">
                                            Cantidad: {item.quantity}
                                        </p>
                                    </div>
                                    <div className="item-price">
                                        ${(item.price * item.quantity).toLocaleString('es-AR')}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="checkout-totals">
                            <div className="total-row">
                                <span>Subtotal:</span>
                                <span>${cartTotal.toLocaleString('es-AR')}</span>
                            </div>
                            <div className="total-row">
                                <span>Envío:</span>
                                <span>A confirmar</span>
                            </div>
                            <div className="total-row final">
                                <span>Total:</span>
                                <span>${cartTotal.toLocaleString('es-AR')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Formulario de checkout */}
                    <div className="checkout-form-wrapper">
                        <h2>Datos de Envío</h2>

                        <form onSubmit={handleSubmit} className="checkout-form">
                            {/* Datos personales */}
                            <div className="form-section">
                                <h3>Datos Personales</h3>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="firstName">Nombre *</label>
                                        <input
                                            id="firstName"
                                            name="firstName"
                                            type="text"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            required
                                            disabled={processing}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="lastName">Apellido *</label>
                                        <input
                                            id="lastName"
                                            name="lastName"
                                            type="text"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            required
                                            disabled={processing}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="email">Email *</label>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            disabled={processing}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="phone">Teléfono *</label>
                                        <input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            required
                                            disabled={processing}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Dirección */}
                            <div className="form-section">
                                <h3>Dirección de Envío</h3>
                                
                                <div className="form-group">
                                    <label htmlFor="address">Dirección Completa *</label>
                                    <input
                                        id="address"
                                        name="address"
                                        type="text"
                                        value={formData.address}
                                        onChange={handleChange}
                                        required
                                        disabled={processing}
                                        placeholder="Calle y número"
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="city">Ciudad *</label>
                                        <input
                                            id="city"
                                            name="city"
                                            type="text"
                                            value={formData.city}
                                            onChange={handleChange}
                                            required
                                            disabled={processing}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="state">Provincia *</label>
                                        <input
                                            id="state"
                                            name="state"
                                            type="text"
                                            value={formData.state}
                                            onChange={handleChange}
                                            required
                                            disabled={processing}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="zipCode">Código Postal *</label>
                                        <input
                                            id="zipCode"
                                            name="zipCode"
                                            type="text"
                                            value={formData.zipCode}
                                            onChange={handleChange}
                                            required
                                            disabled={processing}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="country">País *</label>
                                        <input
                                            id="country"
                                            name="country"
                                            type="text"
                                            value={formData.country}
                                            onChange={handleChange}
                                            required
                                            disabled={processing}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="instructions">Instrucciones Especiales</label>
                                    <textarea
                                        id="instructions"
                                        name="instructions"
                                        value={formData.instructions}
                                        onChange={handleChange}
                                        disabled={processing}
                                        rows="3"
                                        placeholder="Ej: Dejar en puerta, tocar timbre, etc."
                                    />
                                </div>
                            </div>

                            {/* Método de pago */}
                            <div className="form-section">
                                <h3>Método de Pago</h3>
                                <div className="payment-options">
                                    <label className="payment-option">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="whatsapp"
                                            checked={paymentMethod === 'whatsapp'}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            disabled={processing}
                                        />
                                        <span>Coordinar por WhatsApp</span>
                                    </label>
                                    <label className="payment-option">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="transfer"
                                            checked={paymentMethod === 'transfer'}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            disabled={processing}
                                        />
                                        <span>Transferencia Bancaria</span>
                                    </label>
                                    <label className="payment-option">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="cash"
                                            checked={paymentMethod === 'cash'}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            disabled={processing}
                                        />
                                        <span>Efectivo en Sucursal</span>
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-large"
                                disabled={processing}
                            >
                                {processing ? 'Procesando...' : 'Finalizar Compra'}
                            </button>

                            <p className="checkout-note">
                                * Tus datos estarán protegidos y no serán compartidos
                            </p>
                        </form>
                    </div>
                </div>
            </main>

            <Footer />
            <WhatsAppButton />
        </div>
    )
}
