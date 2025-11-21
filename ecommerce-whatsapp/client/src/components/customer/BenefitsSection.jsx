import './BenefitsSection.css'

export default function BenefitsSection() {
    const benefits = [
        {
            icon: '🚚',
            title: 'Envíos a todo el país',
            description: 'Llegamos a donde estés con los mejores precios de envío'
        },
        {
            icon: '⭐',
            title: 'Productos de calidad',
            description: 'Seleccionamos cuidadosamente cada artículo para ti'
        },
        {
            icon: '💬',
            title: 'Atención personalizada',
            description: 'Estamos disponibles por WhatsApp para ayudarte'
        }
    ]

    return (
        <section className="benefits-section">
            <div className="section-container">
                <div className="benefits-grid">
                    {benefits.map((benefit, index) => (
                        <div key={index} className="benefit-card">
                            <div className="benefit-icon">{benefit.icon}</div>
                            <h3>{benefit.title}</h3>
                            <p>{benefit.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
