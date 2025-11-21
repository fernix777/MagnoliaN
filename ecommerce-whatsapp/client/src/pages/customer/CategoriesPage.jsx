import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getActiveCategories } from '../../services/storeService'
import Header from '../../components/customer/Header'
import Footer from '../../components/customer/Footer'
import WhatsAppButton from '../../components/customer/WhatsAppButton'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import './CategoriesPage.css'

export default function CategoriesPage() {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadCategories()
    }, [])

    const loadCategories = async () => {
        setLoading(true)
        const { data, error } = await getActiveCategories()

        if (!error && data) {
            setCategories(data)
        }
        setLoading(false)
    }

    if (loading) {
        return (
            <div className="categories-page">
                <Header />
                <main className="container">
                    <LoadingSpinner size="large" message="Cargando categorías..." />
                </main>
                <Footer />
            </div>
        )
    }

    return (
        <div className="categories-page">
            <Header />

            <main className="container">
                <div className="breadcrumb">
                    <Link to="/">Inicio</Link>
                    <span>/</span>
                    <span>Categorías</span>
                </div>

                <div className="page-header">
                    <h1>Nuestras Categorías</h1>
                    <p>Explora nuestras colecciones organizadas</p>
                </div>

                {categories.length === 0 ? (
                    <div className="empty-state">
                        <p>📂 No hay categorías disponibles todavía</p>
                        <Link to="/" className="btn btn-primary">Volver al inicio</Link>
                    </div>
                ) : (
                    <div className="categories-grid">
                        {categories.map(category => (
                            <Link
                                key={category.id}
                                to={`/categoria/${category.slug}`}
                                className="category-card"
                            >
                                <div className="category-image">
                                    {category.image_url ? (
                                        <img src={category.image_url} alt={category.name} />
                                    ) : (
                                        <div className="no-image">📁</div>
                                    )}
                                    <div className="category-overlay">
                                        <h3>{category.name}</h3>
                                        {category.description && (
                                            <p>{category.description}</p>
                                        )}
                                        <span className="view-products">Ver productos →</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
            <WhatsAppButton />
        </div>
    )
}
