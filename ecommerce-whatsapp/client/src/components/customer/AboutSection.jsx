import './AboutSection.css';
import {
    FaBookOpen,
    FaTruckFast,
    FaStore,
    FaMotorcycle,
    FaMapLocationDot,
    FaCircleCheck,
    FaShieldHalved,
    FaWhatsapp,
    FaStar
} from 'react-icons/fa6';

export default function AboutSection() {
    return (
        <section className="about-section">
            <div className="about-container">
                <div className="about-header">
                    <h2 className="about-title">Nosotros</h2>
                    <p className="about-subtitle">Conoce más sobre nuestra historia y servicios</p>
                </div>

                <div className="about-content">
                    {/* Historia de la Empresa */}
                    <div className="about-card history-card">
                        <div className="card-icon">
                            <FaBookOpen />
                        </div>
                        <h3>Nuestra Historia</h3>
                        <p>
                            Magnolia Novedades nació con la misión de ofrecer productos de calidad y un servicio
                            excepcional a nuestros clientes. Con años de experiencia en el mercado, nos hemos
                            consolidado como una tienda de confianza, comprometida con la satisfacción de cada
                            persona que nos elige.
                        </p>
                        <p>
                            Nuestra pasión por la innovación y la atención al detalle nos impulsa a seguir creciendo
                            y mejorando día a día, siempre pensando en brindarte la mejor experiencia de compra.
                        </p>
                    </div>

                    {/* Métodos de Envío */}
                    <div className="about-card shipping-card">
                        <div className="card-icon">
                            <FaTruckFast />
                        </div>
                        <h3>Métodos de Envío</h3>
                        <p>Hacemos llegar tus productos de forma rápida y segura:</p>
                        <ul className="shipping-list">
                            <li>
                                <span className="shipping-icon"><FaStore /></span>
                                <div>
                                    <strong>Retiro en Tienda</strong>
                                    <p>Sin costo - Retira en nuestro local</p>
                                </div>
                            </li>
                            <li>
                                <span className="shipping-icon"><FaMotorcycle /></span>
                                <div>
                                    <strong>ENTREGAS EN SALTA CAPITAL</strong>
                                    <p>Sin costo los sábados</p>
                                </div>
                            </li>
                            <li>
                                <span className="shipping-icon"><FaMapLocationDot /></span>
                                <div>
                                    <strong>Envío Nacional</strong>
                                    <p>A todo el país mediante todos los expresos</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Valores adicionales */}
                <div className="values-section">
                    <div className="value-item">
                        <span className="value-icon"><FaCircleCheck /></span>
                        <h4>Calidad Garantizada</h4>
                        <p>Productos 100% originales</p>
                    </div>
                    <div className="value-item">
                        <span className="value-icon"><FaShieldHalved /></span>
                        <h4>Compra Segura</h4>
                        <p>Protección de datos</p>
                    </div>
                    <div className="value-item">
                        <span className="value-icon"><FaWhatsapp /></span>
                        <h4>Atención Personalizada</h4>
                        <p>Soporte por WhatsApp</p>
                    </div>
                    <div className="value-item">
                        <span className="value-icon"><FaStar /></span>
                        <h4>Mejores Precios</h4>
                        <p>Ofertas exclusivas</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
