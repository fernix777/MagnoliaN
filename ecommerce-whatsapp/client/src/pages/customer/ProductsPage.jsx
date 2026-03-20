import { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { getAllProducts } from '../../services/storeService'
import { AuthContext } from '../../context/AuthContext'
import Header from '../../components/customer/Header'
import Footer from '../../components/customer/Footer'
import WhatsAppButton from '../../components/customer/WhatsAppButton'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import './ProductsPage.css'

export default function ProductsPage() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const { user } = useContext(AuthContext)

    useEffect(() => {
        loadProducts()
    }, [])

    const loadProducts = async () => {
        setLoading(true)
        const { data, error } = await getAllProducts()

        if (!error && data) {
            setProducts(data)
        }
        setLoading(false)
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(price)
    }

    const getPrimaryImage = (product) => {
        if (!product.images || product.images.length === 0) return null
        const primary = product.images.find(img => img.is_primary)
        return primary ? primary.image_url : product.images[0].image_url
    }

    if (loading) {
        return (
            <div className="products-page">
                <Header />
                <main className="container">
                    <LoadingSpinner size="large" message="Cargando productos..." />
                </main>
                <Footer />
            </div>
        )
    }

    return (
        <div className="products-page">
            <Header />

            <main className="container">
                <div className="breadcrumb">
                    <Link to="/">Inicio</Link>
                    <span>/</span>
                    <span>Productos</span>
                </div>

                <div className="page-header">
                    <h1>Todos los Productos</h1>
                    <p>Descubre nuestra colección completa</p>
                </div>

                {products.length === 0 ? (
                    <div className="empty-state">
                        <p>📦 No hay productos disponibles todavía</p>
                        <Link to="/" className="btn btn-primary">Volver al inicio</Link>
                    </div>
                ) : (
                    <div className="products-grid">
                        {products.map(product => {
                            const primaryImage = getPrimaryImage(product)

                            return (
                                <Link
                                    key={product.id}
                                    to={`/producto/${product.slug}`}
                                    className={`product-card ${product.stock <= 0 ? 'unavailable' : ''}`}
                                >
                                    <div className="product-image">
                                        {primaryImage ? (
                                            <img src={primaryImage} alt={product.name} />
                                        ) : (
                                            <div className="no-image">📷</div>
                                        )}
                                        {product.featured && (
                                            <span className="featured-badge">⭐ Destacado</span>
                                        )}
                                    </div>

                                    <div className="product-info">
                                        <h3>{product.name}</h3>
                                        {product.description && (
                                            <p className="product-description">{product.description}</p>
                                        )}
                                        <div className="product-footer">
                                            <span className="product-price">{formatPrice(product.base_price)}</span>
                                            {product.stock > 0 ? (
                                                <span className="stock-badge available">✓ Disponible</span>
                                            ) : (
                                                <span className="stock-badge unavailable">✗ No Disponible</span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </main>

            <Footer />
            <WhatsAppButton />
        </div>
    )
}
