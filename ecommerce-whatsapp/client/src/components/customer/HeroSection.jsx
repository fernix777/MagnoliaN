import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './HeroSection.css'

export default function HeroSection() {
    const [currentSlide, setCurrentSlide] = useState(0)

    const slides = [
        {
            image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1920&q=80',
            title: 'Magnolia Novedades',
            subtitle: 'Decoración y regalos únicos para cada ocasión'
        },
        {
            image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1920&q=80',
            title: 'Encuentra tu estilo',
            subtitle: 'Las mejores tendencias en decoración del hogar'
        },
        {
            image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1920&q=80',
            title: 'Regalos especiales',
            subtitle: 'Para cada momento importante de tu vida'
        },
        {
            image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1920&q=80',
            title: 'Nuevas colecciones',
            subtitle: 'Descubre nuestros productos más recientes'
        }
    ]

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length)
        }, 5000) // Cambia cada 5 segundos

        return () => clearInterval(timer)
    }, [slides.length])

    return (
        <section className="hero-section">
            {/* Slides */}
            {slides.map((slide, index) => (
                <div
                    key={index}
                    className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
                    style={{ backgroundImage: `url(${slide.image})` }}
                >
                    <div className="hero-overlay"></div>
                </div>
            ))}

            {/* Contenido */}
            <div className="hero-content">
                <h1 className="hero-title">{slides[currentSlide].title}</h1>
                <p className="hero-subtitle">{slides[currentSlide].subtitle}</p>
                <Link to="/productos" className="hero-cta">
                    Ver Catálogo
                </Link>
            </div>

            {/* Indicadores */}
            <div className="hero-indicators">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        className={`indicator ${index === currentSlide ? 'active' : ''}`}
                        onClick={() => setCurrentSlide(index)}
                        aria-label={`Ir a slide ${index + 1}`}
                    />
                ))}
            </div>
        </section>
    )
}
