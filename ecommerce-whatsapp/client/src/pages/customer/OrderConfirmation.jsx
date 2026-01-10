import { useState, useEffect } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { trackPurchase } from '../../services/facebookService'
import { trackPurchase as trackPixelPurchase } from '../../utils/facebookPixel'
import Header from '../../components/customer/Header'
import Footer from '../../components/customer/Footer'
import WhatsAppButton from '../../components/customer/WhatsAppButton'
import './OrderConfirmation.css'

export default function OrderConfirmation() {
    const location = useLocation()
    const navigate = useNavigate()
    const { user } = useAuth()
    
    const [order, setOrder] = useState(null)
    const [orderId, setOrderId] = useState(null)
    const [purchaseTracked, setPurchaseTracked] = useState(false)

    useEffect(() => {
        // Obtener datos de la orden del location state o localStorage
        const orderFromState = location.state?.order
        const orderIdFromState = location.state?.orderId
        
        if (orderFromState) {
            setOrder(orderFromState)
            setOrderId(orderIdFromState)
        } else {
            // Intentar obtener de localStorage si volvemos a la página
            const lastOrder = localStorage.getItem('lastOrder')
            if (lastOrder) {
                const parsedOrder = JSON.parse(lastOrder)
                setOrder(parsedOrder)
                setOrderId(parsedOrder.order_id)
            } else {
                // Si no hay orden, redirigir al inicio
                navigate('/')
            }
        }
    }, [location, navigate])

    // Rastrear evento de Purchase cuando se carga la orden
    useEffect(() => {
        if (order && !purchaseTracked) {
            const userData = user ? {
                email: user.email || order.customer.email,
                user_id: user.id,
                phone: user.phone || order.customer.phone,
                first_name: user.first_name || order.customer.firstName,
                last_name: user.last_name || order.customer.lastName
            } : {
                email: order.customer.email,
                phone: order.customer.phone
            }

            const purchaseData = {
                id: orderId || order.order_id,
                total: order.total,
                user: userData,
                items: order.items.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity,
                    price: item.price,
                    product_name: item.name
                }))
            }

            trackPurchase(purchaseData)
            // Rastrear en Facebook Pixel
            trackPixelPurchase(order.total, 'ARS', orderId || order.order_id)
            setPurchaseTracked(true)

            // Limpiar localStorage
            setTimeout(() => {
                localStorage.removeItem('lastOrder')
            }, 2000)
        }
    }, [order, purchaseTracked, user, orderId])

    if (!order) {
        return (
            <div className="order-confirmation-page">
                <Header />
                <main className="container">
                    <div className="loading">
                        <p>Cargando confirmación de orden...</p>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    const handleWhatsAppContact = () => {
        const phoneNumber = '543885171795'
        let message = `🛍️ *CONFIRMACIÓN DE COMPRA*\n\n`
        message += `Número de Orden: ${orderId || order.order_id}\n`
        message += `Total: $${order.total.toLocaleString('es-AR')}\n\n`
        message += `👤 Cliente: ${order.customer.firstName} ${order.customer.lastName}\n`
        message += `📧 Email: ${order.customer.email}\n`
        message += `📱 Teléfono: ${order.customer.phone}\n\n`
        message += `📦 Artículos:\n`
        
        order.items.forEach(item => {
            message += `• ${item.name} x${item.quantity} = $${(item.price * item.quantity).toLocaleString('es-AR')}\n`
        })
        
        message += `\n📍 Dirección: ${order.customer.address}, ${order.customer.city}, ${order.customer.state}\n`
        message += `Código Postal: ${order.customer.zipCode}\n`
        
        if (order.customer.instructions) {
            message += `\n💬 Instrucciones: ${order.customer.instructions}\n`
        }

        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
        window.open(url, '_blank')
    }

    return (
        <div className="order-confirmation-page">
            <Header />
            
            <main className="container">
                <div className="confirmation-container">
                    {/* Mensaje de éxito */}
                    <div className="success-section">
                        <div className="success-icon">✅</div>
                        <h1>¡Compra Confirmada!</h1>
                        <p>Tu orden ha sido registrada con éxito</p>
                    </div>

                    {/* Número de orden */}
                    <div className="order-number-section">
                        <div className="order-number-box">
                            <p className="label">Número de Orden</p>
                            <p className="number">{orderId || order.order_id}</p>
                            <p className="note">Guarda este número para tu referencia</p>
                        </div>
                    </div>

                    {/* Información de la orden */}
                    <div className="order-details">
                        <div className="details-section">
                            <h3>Datos del Cliente</h3>
                            <div className="detail-row">
                                <span className="label">Nombre:</span>
                                <span className="value">{order.customer.firstName} {order.customer.lastName}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Email:</span>
                                <span className="value">{order.customer.email}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Teléfono:</span>
                                <span className="value">{order.customer.phone}</span>
                            </div>
                        </div>

                        <div className="details-section">
                            <h3>Dirección de Envío</h3>
                            <div className="detail-row">
                                <span className="label">Dirección:</span>
                                <span className="value">{order.customer.address}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Ciudad:</span>
                                <span className="value">{order.customer.city}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Provincia:</span>
                                <span className="value">{order.customer.state}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Código Postal:</span>
                                <span className="value">{order.customer.zipCode}</span>
                            </div>
                        </div>

                        <div className="details-section">
                            <h3>Método de Pago</h3>
                            <div className="detail-row">
                                <span className="label">Opción Seleccionada:</span>
                                <span className="value">
                                    {order.paymentMethod === 'whatsapp' && 'Coordinar por WhatsApp'}
                                    {order.paymentMethod === 'transfer' && 'Transferencia Bancaria'}
                                    {order.paymentMethod === 'cash' && 'Efectivo en Sucursal'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Resumen de productos */}
                    <div className="order-items">
                        <h3>Artículos Comprados</h3>
                        <table className="items-table">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Cantidad</th>
                                    <th>Precio Unitario</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.name}</td>
                                        <td className="quantity">{item.quantity}</td>
                                        <td>${item.price.toLocaleString('es-AR')}</td>
                                        <td className="total">${(item.price * item.quantity).toLocaleString('es-AR')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="order-totals">
                            <div className="total-row">
                                <span>Total:</span>
                                <span className="amount">${order.total.toLocaleString('es-AR')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Próximos pasos */}
                    <div className="next-steps">
                        <h3>¿Qué Sucede Ahora?</h3>
                        <ol>
                            <li>
                                <strong>Confirmación:</strong> Recibirás un email con los detalles de tu compra
                            </li>
                            <li>
                                <strong>Contacto:</strong> Nos comunicaremos por WhatsApp o teléfono para confirmar detalles de envío
                            </li>
                            <li>
                                <strong>Preparación:</strong> Prepararemos tu pedido en 24-48 horas
                            </li>
                            <li>
                                <strong>Envío:</strong> Recibirás información de seguimiento de tu envío
                            </li>
                        </ol>
                    </div>

                    {/* Botones de acción */}
                    <div className="action-buttons">
                        <button 
                            onClick={handleWhatsAppContact}
                            className="btn btn-primary btn-large"
                        >
                            💬 Contactar por WhatsApp
                        </button>
                        <Link 
                            to="/products" 
                            className="btn btn-secondary btn-large"
                        >
                            Continuar Comprando
                        </Link>
                    </div>

                    {/* Información adicional */}
                    <div className="additional-info">
                        <div className="info-card">
                            <h4>📞 Soporte</h4>
                            <p>¿Preguntas? Contáctanos por WhatsApp al 📱 +54 388 517-1795</p>
                        </div>
                        <div className="info-card">
                            <h4>🚚 Envío</h4>
                            <p>Los tiempos de envío varían según la zona. Te contactaremos para confirmar.</p>
                        </div>
                        <div className="info-card">
                            <h4>💳 Seguridad</h4>
                            <p>Tus datos de pago y personales están protegidos y encriptados.</p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
            <WhatsAppButton />
        </div>
    )
}
