import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { createOrder } from '../../services/orderService'
import { trackInitiateCheckout, trackPurchase } from '../../services/facebookService'
import Header from '../../components/customer/Header'
import Footer from '../../components/customer/Footer'
import WhatsAppButton from '../../components/customer/WhatsAppButton'
import './CheckoutPage.css'

export default function CheckoutPage() {
    const navigate = useNavigate()
    const { user, signIn } = useAuth()
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
    const [createAccount, setCreateAccount] = useState(false)

    const cartTotal = getCartTotal()
    const cartItemsCount = getCartCount()

    // Rastrear InitiateCheckout cuando el componente se monta
    useEffect(() => {
        if (cart && cart.length > 0 && !checkoutInitiated && Array.isArray(cart)) {
            const userData = user ? {
                email: user.email,
                user_id: user.id,
                phone: user.phone,
                first_name: user.first_name,
                last_name: user.last_name
            } : null
            
            trackInitiateCheckout(cartTotal, cart, userData)
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
            // Si el usuario quiere crear cuenta y no está logueado
            let createdUser = null
            if (createAccount && !user) {
                // Crear usuario con los datos del formulario
                const userPayload = {
                    email: formData.email,
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    phone: formData.phone,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    zip: formData.zipCode,
                    country: formData.country
                }
                
                try {
                    const response = await fetch('/api/auth/register', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(userPayload)
                    })
                    
                    if (response.ok) {
                        const userData = await response.json()
                        createdUser = userData.user
                        console.log('✅ Cuenta creada automáticamente')
                        
                        // Auto-iniciar sesión con la contraseña temporal que devuelve el backend
                        if (userData.tempPassword) {
                            try {
                                await signIn(formData.email, userData.tempPassword)
                                console.log('✅ Sesión iniciada automáticamente')
                            } catch (signInErr) {
                                console.warn('⚠️ No se pudo iniciar sesión automáticamente:', signInErr)
                            }
                        }
                    } else {
                        // Si falla la creación de usuario, continuar con el checkout normal
                        console.warn('⚠️ No se pudo crear la cuenta, continuando con checkout')
                    }
                } catch (error) {
                    console.warn('⚠️ Error al crear cuenta, continuando con checkout:', error)
                }
            }
            // Preparar datos de la orden
            const orderPayload = {
                customer: formData,
                items: cart.map(item => ({
                    ...item,
                    // Asegurar que los datos de variante se incluyan
                    selectedColor: item.selectedColor,
                    selectedCondition: item.selectedCondition,
                    purchaseType: item.purchaseType
                })),
                total: cartTotal,
                paymentMethod,
                user_id: user?.id || createdUser?.id
            }

            // 1. Guardar orden en base de datos
            const { data: savedOrder, error: orderError } = await createOrder(orderPayload)
            
            if (orderError) {
                console.error('Error saving order:', orderError)
                // Continuamos con el flujo de WhatsApp aunque falle el guardado en BD?
                // Mejor mostrar error o intentarlo de nuevo.
                // Pero para no bloquear ventas, podríamos generar un ID temporal si falla.
                // Por ahora, asumimos que debe guardarse.
                throw new Error('No se pudo procesar el pedido. Por favor intenta nuevamente.')
            }

            const orderId = savedOrder ? `ORD-${String(savedOrder.id).padStart(6, '0')}` : `ORD-${Date.now()}`
            const orderWithId = { ...orderPayload, order_id: orderId, id: savedOrder?.id }
            
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
                    price: item.price || 0
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
                
                // Incluir instrucciones especiales si existen
                if (formData.instructions && formData.instructions.trim()) {
                    message += `📝 *Instrucciones Especiales:*\n${formData.instructions}\n\n`
                }
                
                message += '📋 *Productos solicitados:*\n'
                cart.forEach((item, index) => {
                    const price = item.price || 0
                    message += `\n${index + 1}. *${item.name}*\n`
                    message += `   - Cantidad: ${item.quantity} ${item.purchaseType === 'paquete' ? 'paquetes' : item.purchaseType === 'bulto' ? 'bultos' : 'unidades'}\n`
                    message += `   - Precio unitario: ${price.toLocaleString('es-AR')}\n`
                    message += `   - Subtotal: ${(price * item.quantity).toLocaleString('es-AR')}\n`
                    
                    // Agregar información de color si existe
                    if (item.selectedColor) {
                        message += `   - 🎨 Color: ${item.selectedColor}\n`
                    }
                    
                    // Agregar información de condición/tipo de venta
                    if (item.selectedCondition) {
                        message += `   - 📦 Tipo: ${item.selectedCondition}\n`
                    }
                })
                
                message += `\n💰 *Total a pagar: ${cartTotal.toLocaleString('es-AR')}*\n\n`
                message += `ID de Orden: ${orderId}\n`
                message += '¡Hola! Quisiera confirmar este pedido.'

                const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
                
                // Disparar evento de conversión GA4
                if (typeof window !== 'undefined' && window.gtag) {
                    window.gtag('event', 'purchase_whatsapp', {
                        event_category: 'ecommerce',
                        event_label: 'WhatsApp Checkout',
                        value: cartTotal,
                        currency: 'ARS',
                        transaction_id: orderId
                    });
                }

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
                                            Cantidad: {item.quantity} {item.purchaseType === 'paquete' ? 'paquetes' : item.purchaseType === 'bulto' ? 'bultos' : 'unidades'}
                                            {item.selectedColor && ` • 🎨 Color: ${item.selectedColor}`}
                                            {item.selectedCondition && ` • 📦 Tipo: ${item.selectedCondition}`}
                                        </p>
                                    </div>
                                    <div className="item-price">
                                        ${((item.price || 0) * item.quantity).toLocaleString('es-AR')}
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

                            {/* Opción de crear cuenta - Solo si no está logueado */}
                            {!user && (
                                <div className="form-section account-section">
                                    <div className="account-option">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={createAccount}
                                                onChange={(e) => setCreateAccount(e.target.checked)}
                                                disabled={processing}
                                            />
                                            <span className="checkbox-text">
                                                <strong>Crear una cuenta con estos datos para mi próxima compra</strong>
                                                <br />
                                                <small>Tu contraseña por defecto será tu <strong>número de WhatsApp</strong> para que puedas entrar fácilmente más tarde.</small>
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            )}

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

                            {/* Método de pago - Solo WhatsApp */}
                            <div className="form-section payment-section">
                                <h3>Método de Pago</h3>
                                <div className="payment-options">
                                    <label className="payment-option payment-whatsapp">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="whatsapp"
                                            checked={paymentMethod === 'whatsapp'}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            disabled={processing}
                                        />
                                        <div className="payment-option-content">
                                            <span className="payment-icon">💬</span>
                                            <span className="payment-label">Coordinar por WhatsApp</span>
                                            <span className="payment-description">Te contactaremos para confirmar tu pedido y acordar el pago</span>
                                        </div>
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
