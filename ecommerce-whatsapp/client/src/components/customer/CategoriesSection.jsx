import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getActiveCategories } from '../../services/storeService'
import LoadingSpinner from '../common/LoadingSpinner'
import './CategoriesSection.css'

export default function CategoriesSection() {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadCategories()
    }, [])

    const loadCategories = async () => {
        const { data } = await getActiveCategories()
        setCategories(data?.slice(0, 4) || []) // Mostrar solo 4 categorías
        setLoading(false)
    }

    if (loading) {
        return (
            <section className="categories-section">
                <LoadingSpinner size="large" message="Cargando categorías..." />
            </section>
        )
    }

    if (categories.length === 0) {
        return null
    }

    return (
        <section className="categories-section">
            <div className="section-container">
                <h2 className="section-title">Nuestras Categorías</h2>
                <p className="section-subtitle">Explora nuestra variedad de productos</p>

                <div className="categories-grid">
                    {categories.map(category => (
                        <Link
                            key={category.id}
                            to={`/categoria/${category.slug}`}
                            className="category-card"
                        >
                            {category.image_url && (
                                <div className="category-image">
                                    <img src={category.image_url} alt={category.name} />
                                </div>
                            )}
                            <div className="category-info">
                                <h3>{category.name}</h3>
                                {category.description && (
                                    <p>{category.description}</p>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="section-cta">
                    <Link to="/categorias" className="btn btn-outline">
                        Ver Todas las Categorías
                    </Link>
                </div>
            </div>
        </section>
    )
}
