import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProductsByCategory } from '../../services/storeService'
import Header from '../../components/customer/Header'
import Footer from '../../components/customer/Footer'
import WhatsAppButton from '../../components/customer/WhatsAppButton'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import './CategoryPage.css'

export default function CategoryPage() {
    const { slug } = useParams()
    const [products, setProducts] = useState([])
    const [category, setCategory] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadProducts()
    }, [slug])

    const loadProducts = async () => {
        setLoading(true)
        const { data, error } = await getProductsByCategory(slug)

        if (error || !data) {
            setLoading(false)
            return
        }

        setProducts(data)
        if (data.length > 0 && data[0].category) {
            setCategory(data[0].category)
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
            <div className="category-page">
                <Header />
                <main className="container">
                    <LoadingSpinner size="large" message="Cargando productos..." />
                </main>
                <Footer />
            </div>
        )
    }

    return (
        <div className="category-page">
            <Header />

            <main className="container">
                <div className="breadcrumb">
                    <Link to="/">Inicio</Link>
                    <span>/</span>
                    <span>{category?.name || 'Categoría'}</span>
                </div>

                <div className="category-header">
                    <h1>{category?.name || 'Productos'}</h1>
                    {category?.description && (
                        <p>{category.description}</p>
                    )}
                </div>

                {products.length === 0 ? (
                    <div className="empty-state">
                        <p>📦 No hay productos en esta categoría todavía</p>
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
                                    className="product-card"
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
                                                <span className="stock-badge available">En stock</span>
                                            ) : (
                                                <span className="stock-badge unavailable">Sin stock</span>
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
