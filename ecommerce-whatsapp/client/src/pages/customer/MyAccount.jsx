import { useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { supabase } from '../../config/supabase'
import Header from '../../components/customer/Header'
import Footer from '../../components/customer/Footer'
import WhatsAppButton from '../../components/customer/WhatsAppButton'
import './MyAccount.css'

export default function MyAccount() {
    const { user, loading: authLoading, signOut } = useContext(AuthContext)
    const navigate = useNavigate()
    const [profile, setProfile] = useState(null)
    const [shippingData, setShippingData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [editingShipping, setEditingShipping] = useState(false)
    const [shippingForm, setShippingForm] = useState({
        full_name: '',
        phone: '',
        address: '',
        city: '',
        province: '',
        postal_code: '',
        observations: ''
    })

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/auth/login?redirect=/mi-cuenta')
            return
        }

        if (user) {
            loadUserData()
        }
    }, [user, authLoading])

    const loadUserData = async () => {
        try {
            // Cargar datos del cliente desde customers por email
            const { data: customerData } = await supabase
                .from('customers')
                .select('*')
                .eq('email', user.email)
                .maybeSingle()

            if (customerData) {
                setProfile(customerData)
                
                // Cargar datos de envío si existen
                const shippingFromCustomer = {
                    full_name: customerData.full_name || '',
                    phone: customerData.phone || '',
                    address: customerData.address || '',
                    city: customerData.city || '',
                    province: '',
                    postal_code: '',
                    observations: ''
                }
                setShippingData(shippingFromCustomer)
                setShippingForm(shippingFromCustomer)
            }
        } catch (error) {
            console.error('Error loading user data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleShippingSubmit = async (e) => {
        e.preventDefault()
        
        try {
            // Actualizar datos en customers
            const { error } = await supabase
                .from('customers')
                .upsert({ 
                    email: user.email,
                    full_name: shippingForm.full_name,
                    phone: shippingForm.phone,
                    address: shippingForm.address,
                    city: shippingForm.city,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'email' })

            if (error) throw error

            setShippingData(shippingForm)
            setEditingShipping(false)
            alert('Datos guardados correctamente')
        } catch (error) {
            console.error('Error saving shipping data:', error)
            alert('Error al guardar los datos de envío')
        }
    }

    const handleSignOut = async () => {
        await signOut()
        navigate('/')
    }

    if (authLoading || loading) {
        return (
            <div className="my-account-page">
                <Header />
                <main className="account-main">
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Cargando...</p>
                    </div>
                </main>
                <Footer />
                <WhatsAppButton />
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <div className="my-account-page">
            <Header />

            <main className="account-main">
                <div className="account-container">
                    <div className="account-header">
                        <h1>Mi Cuenta</h1>
                        <button className="btn btn-outline" onClick={handleSignOut}>
                            Cerrar Sesión
                        </button>
                    </div>

                    {/* Información del perfil */}
                    <div className="account-section">
                        <h2>Información Personal</h2>
                        <div className="info-card">
                            <div className="info-row">
                                <span className="info-label">Email:</span>
                                <span className="info-value">{user.email}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Nombre:</span>
                                <span className="info-value">{profile?.full_name || user.user_metadata?.full_name || 'No registrado'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Teléfono:</span>
                                <span className="info-value">{profile?.phone || user.user_metadata?.phone || 'No registrado'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Miembro desde:</span>
                                <span className="info-value">
                                    {user.created_at 
                                        ? new Date(user.created_at).toLocaleDateString('es-AR', { 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })
                                        : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Datos de envío */}
                    <div className="account-section">
                        <div className="section-header">
                            <h2>Datos de Envío</h2>
                            {!editingShipping && (
                                <button 
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setEditingShipping(true)}
                                >
                                    Editar
                                </button>
                            )}
                        </div>

                        {editingShipping ? (
                            <form className="shipping-form" onSubmit={handleShippingSubmit}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Nombre Completo</label>
                                        <input
                                            type="text"
                                            value={shippingForm.full_name}
                                            onChange={(e) => setShippingForm({...shippingForm, full_name: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Teléfono</label>
                                        <input
                                            type="tel"
                                            value={shippingForm.phone}
                                            onChange={(e) => setShippingForm({...shippingForm, phone: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Dirección</label>
                                    <input
                                        type="text"
                                        value={shippingForm.address}
                                        onChange={(e) => setShippingForm({...shippingForm, address: e.target.value})}
                                        placeholder="Calle y número"
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Ciudad</label>
                                        <input
                                            type="text"
                                            value={shippingForm.city}
                                            onChange={(e) => setShippingForm({...shippingForm, city: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Provincia</label>
                                        <input
                                            type="text"
                                            value={shippingForm.province}
                                            onChange={(e) => setShippingForm({...shippingForm, province: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Código Postal</label>
                                        <input
                                            type="text"
                                            value={shippingForm.postal_code}
                                            onChange={(e) => setShippingForm({...shippingForm, postal_code: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Observaciones</label>
                                    <textarea
                                        value={shippingForm.observations}
                                        onChange={(e) => setShippingForm({...shippingForm, observations: e.target.value})}
                                        placeholder="Referencias para la entrega, horario preferido, etc."
                                        rows={3}
                                    />
                                </div>

                                <div className="form-actions">
                                    <button type="button" className="btn btn-outline" onClick={() => setEditingShipping(false)}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Guardar
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="info-card">
                                {shippingData ? (
                                    <>
                                        <div className="info-row">
                                            <span className="info-label">Nombre:</span>
                                            <span className="info-value">{shippingData.full_name}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="info-label">Teléfono:</span>
                                            <span className="info-value">{shippingData.phone}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="info-label">Dirección:</span>
                                            <span className="info-value">
                                                {shippingData.address}, {shippingData.city}, {shippingData.province}
                                            </span>
                                        </div>
                                        {shippingData.postal_code && (
                                            <div className="info-row">
                                                <span className="info-label">CP:</span>
                                                <span className="info-value">{shippingData.postal_code}</span>
                                            </div>
                                        )}
                                        {shippingData.observations && (
                                            <div className="info-row">
                                                <span className="info-label">Observaciones:</span>
                                                <span className="info-value">{shippingData.observations}</span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="no-data">No tienes datos de envío guardados.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Acceso rápido */}
                    <div className="account-section">
                        <h2>Acceso Rápido</h2>
                        <div className="quick-links">
                            <Link to="/mis-pedidos" className="quick-link">
                                <div className="quick-link-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                                        <line x1="3" y1="6" x2="21" y2="6"/>
                                        <path d="M16 10a4 4 0 0 1-8 0"/>
                                    </svg>
                                </div>
                                <div className="quick-link-text">
                                    <span className="quick-link-title">Mis Pedidos</span>
                                    <span className="quick-link-desc">Ver historial de compras</span>
                                </div>
                                <div className="quick-link-arrow">→</div>
                            </Link>

                            <Link to="/carrito" className="quick-link">
                                <div className="quick-link-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="9" cy="21" r="1"/>
                                        <circle cx="20" cy="21" r="1"/>
                                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                                    </svg>
                                </div>
                                <div className="quick-link-text">
                                    <span className="quick-link-title">Mi Carrito</span>
                                    <span className="quick-link-desc">Ver productos en tu carrito</span>
                                </div>
                                <div className="quick-link-arrow">→</div>
                            </Link>

                            <Link to="/" className="quick-link">
                                <div className="quick-link-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                        <polyline points="9 22 9 12 15 12 15 22"/>
                                    </svg>
                                </div>
                                <div className="quick-link-text">
                                    <span className="quick-link-title">Volver a la Tienda</span>
                                    <span className="quick-link-desc">Explorar más productos</span>
                                </div>
                                <div className="quick-link-arrow">→</div>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
            <WhatsAppButton />
        </div>
    )
}
