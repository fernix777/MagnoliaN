import { useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/customer/Header'
import Footer from '../../components/customer/Footer'
import WhatsAppButton from '../../components/customer/WhatsAppButton'
import './ContactPage.css'

export default function ContactPage() {
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

    const handleSubmit = (e) => {
        e.preventDefault()
        setSending(true)

        // Construir mensaje de WhatsApp con los datos del formulario
        const phoneNumber = '543765016293'
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

                <div className="contact-content">
                    {/* Información de contacto */}
                    <div className="contact-info">
                        <div className="info-card">
                            <div className="info-icon">📍</div>
                            <h3>Ubicación</h3>
                            <p>Posadas, Misiones<br />Argentina</p>
                        </div>

                        <div className="info-card">
                            <div className="info-icon">📱</div>
                            <h3>Teléfono</h3>
                            <p>
                                <a href="https://wa.me/543765016293" target="_blank" rel="noopener noreferrer">
                                    +54 376 501-6293
                                </a>
                            </p>
                        </div>

                        <div className="info-card">
                            <div className="info-icon">📧</div>
                            <h3>Email</h3>
                            <p>
                                <a href="mailto:contacto@magnolia.com">
                                    contacto@magnolia.com
                                </a>
                            </p>
                        </div>

                        <div className="info-card">
                            <div className="info-icon">🕐</div>
                            <h3>Horario</h3>
                            <p>
                                Lunes a Viernes: 9:00 - 18:00<br />
                                Sábados: 9:00 - 13:00
                            </p>
                        </div>

                        {/* Mapa */}
                        <div className="map-container">
                            <h3>Encuéntranos</h3>
                            <div className="map-wrapper">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3539.812280363473!2d-55.89615492378615!3d-27.36750207629984!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9457be1c53796d8b%3A0x5c7a7a68e5b4e8e8!2sPosadas%2C%20Misiones!5e0!3m2!1ses!2sar!4v1234567890123!5m2!1ses!2sar"
                                    width="100%"
                                    height="350"
                                    style={{ border: 0 }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="Ubicación de Magnolia Novedades"
                                ></iframe>
                            </div>
                        </div>
                    </div>

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
