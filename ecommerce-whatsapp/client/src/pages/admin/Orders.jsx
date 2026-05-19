import { useState, useEffect } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { getOrders, updateOrderStatus } from '../../services/orderService'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import './Orders.css'

export default function Orders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [filter, setFilter] = useState('all') // all, pending, completed, cancelled

    useEffect(() => {
        loadOrders()
    }, [filter])

    const loadOrders = async () => {
        setLoading(true)
        const options = filter === 'all' ? {} : { status: filter }
        const { data, error } = await getOrders(options)

        if (error) {
            toast.error('Error al cargar pedidos')
            console.error(error)
        } else {
            setOrders(data || [])
        }
        setLoading(false)
    }

    const handleStatusChange = async (orderId, newStatus) => {
        const order = orders.find(o => o.id === orderId)
        const loadingToast = toast.loading('Actualizando estado...')
        const { error } = await updateOrderStatus(orderId, newStatus)
        
        toast.dismiss(loadingToast)

        if (error) {
            toast.error('Error al actualizar estado')
        } else {
            toast.success(`Pedido marcado como ${newStatus === 'completed' ? 'completado' : newStatus}`)
            
            // Si se completó y es correo argentino, generar y abrir etiqueta
            if (newStatus === 'completed' && order && order.shipping_method === 'correo_argentino') {
                try {
                    const labelToast = toast.loading('Generando etiqueta de envío...');
                    const res = await fetch(`/api/correo/etiqueta/${order.id}`, { method: 'POST' });
                    const data = await res.json();
                    toast.dismiss(labelToast);
                    if (data.url) {
                        toast.success('Etiqueta generada con éxito');
                        window.open(data.url, '_blank');
                    }
                } catch(e) {
                    toast.error('Error generando etiqueta');
                }
            }

            loadOrders()
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder(prev => ({ ...prev, status: newStatus }))
            }
        }
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(price)
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-AR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="orders-page">
            <Toaster position="top-right" />

            <div className="page-header">
                <h1>Pedidos</h1>
                <div className="header-actions">
                    <select 
                        value={filter} 
                        onChange={(e) => setFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="pending">Pendientes</option>
                        <option value="completed">Completados</option>
                        <option value="cancelled">Cancelados</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <LoadingSpinner />
            ) : (
                <div className="orders-table-container">
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>
                                        No hay pedidos registrados
                                    </td>
                                </tr>
                            ) : (
                                orders.map(order => (
                                    <tr key={order.id}>
                                        <td>#{String(order.id).padStart(6, '0')}</td>
                                        <td>{formatDate(order.created_at)}</td>
                                        <td className="customer-info">
                                            <strong>{order.customer_info.firstName} {order.customer_info.lastName}</strong>
                                            <small>{order.customer_info.phone}</small>
                                        </td>
                                        <td>{formatPrice(order.total)}</td>
                                        <td>
                                            <span className={`status-badge status-${order.status}`}>
                                                {order.status === 'pending' ? 'Pendiente' :
                                                 order.status === 'completed' ? 'Completado' :
                                                 order.status === 'cancelled' ? 'Cancelado' : order.status}
                                            </span>
                                        </td>
                                        <td className="order-actions">
                                            <button 
                                                className="btn-view"
                                                onClick={() => setSelectedOrder(order)}
                                                title="Ver detalles"
                                            >
                                                👁️
                                            </button>
                                            {order.status === 'pending' && (
                                                <>
                                                    <button 
                                                        className="btn-complete"
                                                        onClick={() => handleStatusChange(order.id, 'completed')}
                                                        title="Marcar como completado"
                                                    >
                                                        ✅
                                                    </button>
                                                    <button 
                                                        className="btn-cancel"
                                                        onClick={() => handleStatusChange(order.id, 'cancelled')}
                                                        title="Cancelar pedido"
                                                    >
                                                        ❌
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {selectedOrder && (
                <div className="order-modal" onClick={() => setSelectedOrder(null)}>
                    <div className="order-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="close-modal" onClick={() => setSelectedOrder(null)}>×</button>
                        
                        <h2>Detalle del Pedido #{String(selectedOrder.id).padStart(6, '0')}</h2>
                        
                        <div className="order-details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div>
                                <h3>Información del Cliente</h3>
                                <p><strong>Nombre:</strong> {selectedOrder.customer_info.firstName} {selectedOrder.customer_info.lastName}</p>
                                <p><strong>Email:</strong> {selectedOrder.customer_info.email}</p>
                                <p><strong>Teléfono:</strong> {selectedOrder.customer_info.phone}</p>
                                <p><strong>Dirección:</strong> {selectedOrder.customer_info.address}, {selectedOrder.customer_info.city}</p>
                            </div>
                            <div>
                                <h3>Información del Pedido</h3>
                                <p><strong>Fecha:</strong> {formatDate(selectedOrder.created_at)}</p>
                                <p><strong>Estado:</strong> <span className={`status-badge status-${selectedOrder.status}`}>{selectedOrder.status}</span></p>
                                <p><strong>Método de Pago:</strong> {selectedOrder.payment_method}</p>
                                <p><strong>Total:</strong> <span style={{ fontSize: '1.2em', fontWeight: 'bold' }}>{formatPrice(selectedOrder.total)}</span></p>
                                
                                {selectedOrder.shipping_method && (
                                    <div style={{ marginTop: '10px', padding: '10px', background: '#e3f2fd', borderRadius: '4px' }}>
                                        <strong>Logística:</strong><br/>
                                        Método: {selectedOrder.shipping_method === 'correo_argentino' ? 'Correo Argentino' : 'Vía Cargo'}<br/>
                                        Costo: {selectedOrder.shipping_cost ? formatPrice(selectedOrder.shipping_cost) : 'A pagar en destino'}
                                        
                                        {selectedOrder.shipping_label_url && (
                                            <div style={{ marginTop: '10px' }}>
                                                <a href={selectedOrder.shipping_label_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                                                    🖨️ Reimprimir Etiqueta
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <h3>Productos ({selectedOrder.items?.length || 0})</h3>
                        <div className="order-items-list">
                            {selectedOrder.items && selectedOrder.items.map((item, index) => (
                                <div key={index} className="order-item">
                                    <div className="item-details">
                                        <h4>{item.product_name}</h4>
                                        <p>Cantidad: {item.quantity} {item.purchase_type === 'paquete' ? 'paquetes' : item.purchase_type === 'bulto' ? 'bultos' : 'unidades'}</p>
                                        
                                        {/* Mostrar color si existe */}
                                        {item.selected_color && (
                                            <p style={{ color: '#e91e63', fontSize: '0.9em', fontWeight: '500' }}>
                                                🎨 Color: {item.selected_color}
                                            </p>
                                        )}
                                        
                                        {/* Mostrar tipo/condición si existe */}
                                        {item.selected_condition && (
                                            <p style={{ color: '#2196f3', fontSize: '0.9em' }}>
                                                📦 Tipo: {item.selected_condition}
                                            </p>
                                        )}
                                        
                                        {/* Mantener compatibilidad con variant_info existente */}
                                        {item.variant_info && !item.selected_color && (
                                            <p style={{ color: '#666', fontSize: '0.9em' }}>
                                                Variante: {item.variant_info.variant_value || item.variant_info.name}
                                            </p>
                                        )}
                                    </div>
                                    <div className="item-price">
                                        {formatPrice(item.price * item.quantity)}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {selectedOrder.customer_info.instructions && (
                            <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                                <strong>Notas del cliente:</strong>
                                <p>{selectedOrder.customer_info.instructions}</p>
                            </div>
                        )}

                        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            {selectedOrder.status === 'pending' && (
                                <>
                                    <button 
                                        className="btn-complete"
                                        style={{ padding: '10px 20px', fontSize: '1em' }}
                                        onClick={() => handleStatusChange(selectedOrder.id, 'completed')}
                                    >
                                        Marcar como Completado
                                    </button>
                                    <button 
                                        className="btn-cancel"
                                        style={{ padding: '10px 20px', fontSize: '1em' }}
                                        onClick={() => handleStatusChange(selectedOrder.id, 'cancelled')}
                                    >
                                        Cancelar Pedido
                                    </button>
                                </>
                            )}
                            <button 
                                style={{ padding: '10px 20px', fontSize: '1em', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                onClick={() => setSelectedOrder(null)}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
