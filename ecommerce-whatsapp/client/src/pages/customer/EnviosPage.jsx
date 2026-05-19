import { Link } from 'react-router-dom'
import Header from '../../components/customer/Header'
import Footer from '../../components/customer/Footer'
import WhatsAppButton from '../../components/customer/WhatsAppButton'
import './EnviosPage.css'

export default function EnviosPage() {
    return (
        <div className="envios-page">
            <Header />
            <main className="container envios-container">
                <div className="breadcrumb">
                    <Link to="/">Inicio</Link>
                    <span>/</span>
                    <span>Envíos</span>
                </div>
                
                <h1>Métodos de Envío</h1>
                <p className="envios-intro">
                    Todos nuestros despachos se realizan desde nuestro depósito en CABA. 
                    Los pedidos se procesan y entregan al transporte en menos de 24 hs hábiles.
                </p>

                <div className="shipping-methods">
                    <div className="method-card recommended">
                        <div className="method-badge">OPCIÓN RECOMENDADA</div>
                        <h2>Vía Cargo</h2>
                        <div className="method-details">
                            <p><strong>Pago:</strong> En destino (abonás el envío al retirar tu paquete).</p>
                            <p><strong>Tarifas aproximadas:</strong></p>
                            <ul>
                                <li>0kg a 5kg: $0</li>
                                <li>5.1kg a 10kg: $0</li>
                                <li>10.1kg a 15kg: $0</li>
                                <li>15.1kg a 20kg: $0</li>
                            </ul>
                            <p className="note">El costo exacto lo calcula Vía Cargo al momento de despachar.</p>
                        </div>
                    </div>

                    <div className="method-card">
                        <h2>Correo Argentino</h2>
                        <div className="method-details">
                            <p><strong>Pago:</strong> Adelantado (se suma al total de tu compra).</p>
                            <p><strong>Plazo de entrega:</strong> 3 a 6 días hábiles.</p>
                            <p className="note">El costo se calcula automáticamente en el checkout en base al peso y dimensiones de los productos y tu código postal.</p>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
            <WhatsAppButton />
        </div>
    )
}
