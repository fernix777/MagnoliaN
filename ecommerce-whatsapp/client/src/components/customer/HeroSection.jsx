import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getActiveBanners } from '../../services/bannerService'
import './HeroSection.css'
import todoOctubreBanner from '../../assets/images/hero/todo_octubre.webp'

export default function HeroSection() {
    const [currentSlide, setCurrentSlide] = useState(0)
    const [banners, setBanners] = useState([])
    const [loading, setLoading] = useState(true)

    const defaultSlides = [
        {
            image: todoOctubreBanner,
            title: '¡Todo Octubre!',
            subtitle: 'Descuentos especiales en toda la tienda',
            link: '/productos'
        },
        {
            image: '/brillo.webp',
            title: 'Magnolia Novedades',
            subtitle: 'Decoración y regalos únicos para cada ocasión',
            link: '/productos'
        },
        {
            image: '/pic3.webp',
            title: 'Encuentra tu estilo',
            subtitle: 'Las mejores tendencias en decoración del hogar',
            link: '/categoria/decoracion'
        },
        {
            image: '/imagen1 (1).webp',
            title: 'Regalos especiales',
            subtitle: 'Para cada momento importante de tu vida',
            link: '/categoria/regalos'
        },
        {
            image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1920&q=80',
            title: 'Nuevas colecciones',
            subtitle: 'Descubre nuestros productos más recientes',
            link: '/productos'
        }
    ]

    useEffect(() => {
        loadBanners()
    }, [])

    const loadBanners = async () => {
        try {
            const { data } = await getActiveBanners()
            if (data && data.length > 0) {
                const formattedBanners = data.map(b => ({
                    id: b.id,
                    image: b.image_url,
                    title: b.title || '',
                    subtitle: '', // DB doesn't have subtitle yet
                    link: b.link || '/productos'
                }))
                setBanners(formattedBanners)
            }
        } catch (error) {
            console.error('Error loading banners:', error)
        } finally {
            setLoading(false)
        }
    }

    const slides = banners.length > 0 ? banners : defaultSlides

    useEffect(() => {
        if (slides.length === 0) return

        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length)
        }, 5000)

        return () => clearInterval(timer)
    }, [slides.length])

    if (loading && banners.length === 0) {
        // Optional: return loading skeleton or just show defaults initially
        // For now, we render defaults while loading if we want, or nothing.
        // But since we default to defaultSlides if empty, we can just proceed.
    }

    return (
        <section className="hero-section">
            {/* Slides */}
            {slides.map((slide, index) => {
                const isExternal = slide.link?.startsWith('http')
                const Tag = slide.link ? (isExternal ? 'a' : Link) : 'div'
                const props = slide.link ? (isExternal ? { href: slide.link, target: '_blank', rel: 'noopener noreferrer' } : { to: slide.link }) : {}

                return (
                    <Tag
                        key={index}
                        className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
                        style={{ backgroundImage: `url(${slide.image})` }}
                        {...props}
                    >
                        <div className="hero-overlay"></div>
                    </Tag>
                )
            })}

            {/* Contenido */}
            <div className="hero-content" style={{ display: 'none' }}>
                {slides[currentSlide].title && (
                    <h1 className="hero-title">{slides[currentSlide].title}</h1>
                )}
                {slides[currentSlide].subtitle && (
                    <p className="hero-subtitle">{slides[currentSlide].subtitle}</p>
                )}
                
                <Link to={slides[currentSlide].link} className="hero-cta">
                    Ver Catálogo
                </Link>
            </div>

            {/* Indicadores */}
            {slides.length > 1 && (
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
            )}
        </section>
    )
}
