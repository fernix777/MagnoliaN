import { useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/customer/Header'
import Footer from '../../components/customer/Footer'
import WhatsAppButton from '../../components/customer/WhatsAppButton'
import { trackContact } from '../../services/facebookService'
import { useAuth } from '../../context/AuthContext'
import './ContactPage.css'

export default function ContactPage() {
    const { user } = useAuth()
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    })
    const [sending, setSending] = useState(false)
    const [sent, setSent] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSending(true)

        // Rastrear evento de contacto en Facebook
        const userData = user ? {
            email: user.email || formData.email,
            user_id: user.id,
            phone: user.phone || formData.phone
        } : {
            email: formData.email,
            phone: formData.phone
        }
        
        await trackContact(formData.message, userData)

        // Construir mensaje de WhatsApp con los datos del formulario
        const phoneNumber = '543885171795'
        let message = `📧 *MENSAJE DE CONTACTO*\n\n`
        message += `👤 *Nombre:* ${formData.name}\n`
        message += `📧 *Email:* ${formData.email}\n`
        message += `📱 *Teléfono:* ${formData.phone}\n`
        message += `📝 *Asunto:* ${formData.subject}\n\n`
        message += `💬 *Mensaje:*\n${formData.message}`

        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`

        // Abrir WhatsApp
        window.open(url, '_blank')

        // Marcar como enviado
        setTimeout(() => {
            setSending(false)
            setSent(true)
            // Limpiar formulario
            setFormData({
                name: '',
                email: '',
                phone: '',
                subject: '',
                message: ''
            })
            // Resetear mensaje de éxito después de 5 segundos
            setTimeout(() => setSent(false), 5000)
        }, 1000)
    }

    return (
        <div className="contact-page">
            <Header />

            <main className="container">
                <div className="breadcrumb">
                    <Link to="/">Inicio</Link>
                    <span>/</span>
                    <span>Contacto</span>
                </div>

                <div className="contact-header">
                    <h1>Contactanos</h1>
                    <p>Estamos aquí para ayudarte. Envíanos un mensaje y te responderemos a la brevedad.</p>
                </div>

                {/* Ubicaciones */}
                <div className="locations-section">
                    <h2>Nuestras Sucursales</h2>
                    <p className="locations-subtitle">Visítanos en cualquiera de nuestras ubicaciones</p>
                    
                    <div className="locations-grid">
                        {/* Ubicación Jujuy - Palpala */}
                        <div className="location-card">
                            <div className="location-header">
                                <h3>📍 Jujuy - Palpala</h3>
                                <span className="location-badge">Sucursal</span>
                            </div>
                            <div className="location-info">
                                <div className="info-item">
                                    <span className="info-label">📍 Dirección:</span>
                                    <p>Calle Palpala N°987, Sector B6, B° Alto Comedero, San Salvador de Jujuy</p>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">📞 Celular:</span>
                                    <a href="https://wa.me/543885171795" target="_blank" rel="noopener noreferrer">
                                        388-5171795
                                    </a>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">🕐 Horario:</span>
                                    <p>Lunes a sábado: 09:00 - 13:00</p>
                                </div>
                            </div>
                            <div className="location-map">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3617.965649599548!2d-65.28909672385!3d-24.19604697849!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x941b0d8f2e8b8b8b%3A0x8b8b8b8b8b8b8b8b!2sCalle%20Palpala%20987%2C%20San%20Salvador%20de%20Jujuy!5e0!3m2!1ses!2sar!4v1234567890124"
                                    width="100%"
                                    height="250"
                                    style={{ border: 0 }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="Ubicación Palpala - Magnolia Novedades"
                                ></iframe>
                            </div>
                        </div>

                        {/* Ubicación CABA */}
                        <div className="location-card">
                            <div className="location-header">
                                <h3>📍 Buenos Aires - CABA</h3>
                                <span className="location-badge">Sucursal</span>
                            </div>
                            <div className="location-info">
                                <div className="info-item">
                                    <span className="info-label">📍 Dirección:</span>
                                    <p>Calle Libertad N°121, B° San Nicolás, Buenos Aires</p>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">📞 Celular:</span>
                                    <a href="https://wa.me/541154705414" target="_blank" rel="noopener noreferrer">
                                        +54 11 5470-5414
                                    </a>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">🕐 Horario:</span>
                                    <p>Lunes a sábado: 09:00 - 15:00</p>
                                </div>
                            </div>
                            <div className="location-map">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3283.9352945297477!2d-58.38158892385!3d-34.603869978449!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95a334d7f4a4c4c4%3A0x8b8b8b8b8b8b8b8b!2sLibertad%20121%2C%20San%20Nicol%C3%A1s%2C%20CABA!5e0!3m2!1ses!2sar!4v1234567890125"
                                    width="100%"
                                    height="250"
                                    style={{ border: 0 }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="Ubicación CABA - Magnolia Novedades"
                                ></iframe>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contacto General */}
                <div className="contact-general-info">
                    <div className="info-box">
                        <span className="icon">📧</span>
                        <div>
                            <h4>Email</h4>
                            <a href="mailto:magnolianovedades56@gmail.com">magnolianovedades56@gmail.com</a>
                        </div>
                    </div>
                    <div className="info-box">
                        <span className="icon">📞</span>
                        <div>
                            <h4>Soporte por WhatsApp</h4>
                            <p>Disponible en cualquiera de nuestras sedes</p>
                        </div>
                    </div>
                </div>

                <div className="contact-content">
                    {/* Formulario de contacto */}
                    <div className="contact-form-wrapper">
                        <h2>Envíanos un mensaje</h2>

                        {sent && (
                            <div className="success-message">
                                ✅ ¡Mensaje enviado! Te contactaremos pronto.
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="contact-form">
                            <div className="form-group">
                                <label htmlFor="name">Nombre completo *</label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    disabled={sending}
                                    placeholder="Tu nombre"
                                />
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
                                        disabled={sending}
                                        placeholder="tu@email.com"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="phone">Teléfono</label>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        disabled={sending}
                                        placeholder="+54 9 ..."
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="subject">Asunto *</label>
                                <input
                                    id="subject"
                                    name="subject"
                                    type="text"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    required
                                    disabled={sending}
                                    placeholder="¿En qué podemos ayudarte?"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="message">Mensaje *</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    disabled={sending}
                                    rows="6"
                                    placeholder="Escribe tu mensaje aquí..."
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-large"
                                disabled={sending}
                            >
                                {sending ? 'Enviando...' : '💬 Enviar por WhatsApp'}
                            </button>

                            <p className="form-note">
                                * Al enviar, se abrirá WhatsApp con tu mensaje pre-cargado
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
