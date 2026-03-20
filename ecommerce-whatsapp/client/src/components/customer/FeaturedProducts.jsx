import { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { getTopSellingProductsPerCategory } from '../../services/storeService'
import { CartContext } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../common/LoadingSpinner'
import './FeaturedProducts.css'

export default function FeaturedProducts() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const { addToCart } = useContext(CartContext)
    const { user } = useAuth()

    useEffect(() => {
        loadProducts()
    }, [])

    const loadProducts = async () => {
        const { data } = await getTopSellingProductsPerCategory()
        if (data) {
            setProducts(data)
        }
        setLoading(false)
    }

    const handleAddToCart = (e, product) => {
        e.preventDefault()
        e.stopPropagation()
        
        // Obtener imagen principal
        const primaryImage = product.images?.find(img => img.is_primary)?.image_url 
            || product.images?.[0]?.image_url 
            || product.image_url

        addToCart({
            id: product.id,
            name: product.name,
            price: product.base_price,
            base_price: product.base_price, // Added for CartContext compatibility
            image: primaryImage,
            stock: product.stock,
            variants: product.variants,
            slug: product.slug
        })
    }

    if (loading) {
        return (
            <section className="featured-section">
                <LoadingSpinner size="large" message="Cargando productos destacados..." />
            </section>
        )
    }

    if (products.length === 0) {
        return null
    }

    return (
        <section className="featured-section">
            <div className="section-container">
                <h2 className="section-title">Los Más Populares</h2>
                <p className="section-subtitle">Productos que nuestros clientes aman</p>

                <div className="featured-grid">
                    {products.map(product => {
                        const primaryImage = product.images?.find(img => img.is_primary)?.image_url 
                            || product.images?.[0]?.image_url 
                            || product.image_url
                        const isAvailable = product.stock > 0

                        return (
                            <Link
                                key={product.id}
                                to={`/producto/${product.slug}`}
                                className={`featured-card ${!isAvailable ? 'out-of-stock' : ''}`}
                            >
                                <div className="featured-image">
                                    {primaryImage ? (
                                        <img src={primaryImage} alt={product.name} loading="lazy" />
                                    ) : (
                                        <div className="no-image">Sin imagen</div>
                                    )}
                                    {isAvailable ? (
                                        <span className="stock-badge available">✓ Disponible</span>
                                    ) : (
                                        <span className="stock-badge unavailable">✗ No Disponible</span>
                                    )}
                                </div>
                                
                                <div className="featured-info">
                                    <h3 className="featured-name">{product.name}</h3>
                                    {product.category && (
                                        <span className="featured-category">{product.category.name}</span>
                                    )}
                                    <div className="featured-footer">
                                        <span className="featured-price">
                                            ${!isNaN(parseFloat(product.base_price)) ? parseFloat(product.base_price).toLocaleString('es-AR') : '0.00'}
                                        </span>
                                        {isAvailable && (
                                            <button 
                                                className="featured-add-btn"
                                                onClick={(e) => handleAddToCart(e, product)}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="9" cy="21" r="1"/>
                                                    <circle cx="20" cy="21" r="1"/>
                                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                                                </svg>
                                                Agregar
                                            </button>
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
