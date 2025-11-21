import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getFeaturedProducts } from '../../services/storeService'
import LoadingSpinner from '../common/LoadingSpinner'
import './FeaturedProducts.css'

export default function FeaturedProducts() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadProducts()
    }, [])

    const loadProducts = async () => {
        const { data } = await getFeaturedProducts(8)
        setProducts(data || [])
        setLoading(false)
    }

    const getPrimaryImage = (product) => {
        if (!product.images || product.images.length === 0) return null
        const primary = product.images.find(img => img.is_primary)
        return primary ? primary.image_url : product.images[0].image_url
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(price)
    }

    if (loading) {
        return (
            <section className="featured-products">
                <LoadingSpinner size="large" message="Cargando productos..." />
            </section>
        )
    }

    if (products.length === 0) {
        return null
    }

    return (
        <section className="featured-products">
            <div className="section-container">
                <h2 className="section-title">Productos Destacados</h2>
                <p className="section-subtitle">Descubre nuestras mejores opciones</p>

                <div className="products-grid">
                    {products.map(product => {
                        const primaryImage = getPrimaryImage(product)

                        return (
                            <Link
                                key={product.id}
                                to={`/producto/${product.slug}`}
                                className="product-card"
                            >
                                <div className="product-image">
                                    {primaryImage ? (
                                        <img src={primaryImage} alt={product.name} />
                                    ) : (
                                        <div className="no-image">📷</div>
                                    )}
                                    <span className="featured-badge">⭐ Destacado</span>
                                </div>

                                <div className="product-info">
                                    <h3>{product.name}</h3>
                                    {product.description && (
                                        <p className="product-description">{product.description}</p>
                                    )}
                                    <div className="product-footer">
                                        <span className="product-price">{formatPrice(product.base_price)}</span>
                                        {product.category && (
                                            <span className="product-category">{product.category.name}</span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>

                <div className="section-cta">
                    <Link to="/productos" className="btn btn-primary">
                        Ver Todos los Productos
                    </Link>
                </div>
            </div>
        </section>
    )
}
