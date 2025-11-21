import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProductBySlug } from '../../services/storeService'
import Header from '../../components/customer/Header'
import Footer from '../../components/customer/Footer'
import WhatsAppButton from '../../components/customer/WhatsAppButton'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import './ProductDetail.css'

export default function ProductDetail() {
    const { slug } = useParams()
    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [selectedImage, setSelectedImage] = useState(0)
    const [selectedVariant, setSelectedVariant] = useState(null)
    const [quantity, setQuantity] = useState(1)

    useEffect(() => {
        loadProduct()
    }, [slug])

    const loadProduct = async () => {
        setLoading(true)
        const { data, error } = await getProductBySlug(slug)

        if (error || !data) {
            setLoading(false)
            return
        }

        setProduct(data)
        setLoading(false)
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(price)
    }

    const handleWhatsAppOrder = () => {
        const phoneNumber = '543765016293'

        // Construir URL completa del producto
        const productUrl = `${window.location.origin}/producto/${slug}`

        // Construir mensaje profesional
        let message = `🛍️ *CONSULTA DE PRODUCTO*\n\n`
        message += `📦 *Producto:* ${product.name}\n`

        if (selectedVariant) {
            if (selectedVariant.color) message += `🎨 *Color:* ${selectedVariant.color}\n`
            if (selectedVariant.size) message += `📏 *Tamaño:* ${selectedVariant.size}\n`
        }

        message += `🔢 *Cantidad:* ${quantity}\n`
        message += `💰 *Precio:* ${formatPrice(getFinalPrice())}\n\n`
        message += `🔗 *Ver producto:*\n${productUrl}\n\n`
        message += `¡Hola! Me interesa este producto. ¿Está disponible?`

        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
        window.open(url, '_blank')
    }

    const getFinalPrice = () => {
        let price = product.base_price
        if (selectedVariant && selectedVariant.price_modifier) {
            price += selectedVariant.price_modifier
        }
        return price * quantity
    }

    if (loading) {
        return (
            <div className="product-detail-page">
                <Header />
                <main className="container">
                    <LoadingSpinner size="large" message="Cargando producto..." />
                </main>
                <Footer />
            </div>
        )
    }

    if (!product) {
        return (
            <div className="product-detail-page">
                <Header />
                <main className="container">
                    <div className="not-found">
                        <h1>Producto no encontrado</h1>
                        <Link to="/" className="btn btn-primary">Volver al inicio</Link>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    const images = product.images || []
    const variants = product.variants || []

    return (
        <div className="product-detail-page">
            <Header />

            <main className="container">
                <div className="breadcrumb">
                    <Link to="/">Inicio</Link>
                    {product.category && (
                        <>
                            <span>/</span>
                            <Link to={`/categoria/${product.category.slug}`}>{product.category.name}</Link>
                        </>
                    )}
                    <span>/</span>
                    <span>{product.name}</span>
                </div>

                <div className="product-detail">
                    {/* Galería de imágenes */}
                    <div className="product-gallery">
                        <div className="main-image">
                            {images.length > 0 ? (
                                <img src={images[selectedImage]?.image_url} alt={product.name} />
                            ) : (
                                <div className="no-image">📷</div>
                            )}
                        </div>
                        {images.length > 1 && (
                            <div className="image-thumbnails">
                                {images.map((img, index) => (
                                    <div
                                        key={img.id}
                                        className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                                        onClick={() => setSelectedImage(index)}
                                    >
                                        <img src={img.image_url} alt={`${product.name} ${index + 1}`} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Información del producto */}
                    <div className="product-info">
                        <h1>{product.name}</h1>

                        {product.category && (
                            <div className="product-category">
                                <Link to={`/categoria/${product.category.slug}`}>
                                    {product.category.name}
                                </Link>
                            </div>
                        )}

                        <div className="product-price">
                            {formatPrice(getFinalPrice())}
                        </div>

                        {product.description && (
                            <div className="product-description">
                                <h3>Descripción</h3>
                                <p>{product.description}</p>
                            </div>
                        )}

                        {/* Variantes */}
                        {variants.length > 0 && (
                            <div className="product-variants">
                                <h3>Opciones disponibles</h3>
                                <div className="variants-list">
                                    {variants.map((variant) => (
                                        <button
                                            key={variant.id}
                                            className={`variant-btn ${selectedVariant?.id === variant.id ? 'active' : ''}`}
                                            onClick={() => setSelectedVariant(variant)}
                                        >
                                            {variant.color && <span>{variant.color}</span>}
                                            {variant.size && <span>{variant.size}</span>}
                                            {variant.price_modifier !== 0 && (
                                                <span className="price-mod">
                                                    {variant.price_modifier > 0 ? '+' : ''}
                                                    {formatPrice(variant.price_modifier)}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Cantidad */}
                        <div className="product-quantity">
                            <h3>Cantidad</h3>
                            <div className="quantity-selector">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    min="1"
                                />
                                <button onClick={() => setQuantity(quantity + 1)}>+</button>
                            </div>
                        </div>

                        {/* Stock */}
                        {product.stock > 0 ? (
                            <div className="stock-info available">
                                ✓ {product.stock} disponibles
                            </div>
                        ) : (
                            <div className="stock-info unavailable">
                                ✗ Sin stock
                            </div>
                        )}

                        {/* Botón de compra */}
                        <button
                            onClick={handleWhatsAppOrder}
                            className="btn btn-primary btn-large"
                            disabled={product.stock === 0}
                        >
                            💬 Consultar por WhatsApp
                        </button>
                    </div>
                </div>
            </main>

            <Footer />
            <WhatsAppButton />
        </div>
    )
}
