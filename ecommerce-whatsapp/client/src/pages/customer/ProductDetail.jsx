import { useState, useEffect, useContext } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getProductBySlug } from '../../services/storeService'
import Header from '../../components/customer/Header'
import Footer from '../../components/customer/Footer'
import WhatsAppButton from '../../components/customer/WhatsAppButton'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { AuthContext } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import './ProductDetail.css'

export default function ProductDetail() {
    const { slug } = useParams()
    const navigate = useNavigate()
    const { user } = useContext(AuthContext)
    const { addToCart } = useCart()
    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [selectedImage, setSelectedImage] = useState(0)
    const [selectedVariant, setSelectedVariant] = useState(null)
    const [quantity, setQuantity] = useState(1)
    const [purchaseType, setPurchaseType] = useState('') // 'unidad', 'caja' o 'bulto'
    const [selectedColor, setSelectedColor] = useState('')
    const [showNotification, setShowNotification] = useState(false)

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
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price)
    }

    const handleAddToCart = () => {
        if (!user) {
            navigate('/login?redirect=' + encodeURIComponent(window.location.pathname))
            return
        }

        if (!purchaseType) {
            alert('Por favor selecciona el tipo de venta')
            return
        }

        // Solo validar color si el producto tiene opciones de color
        if (product.has_colors && !selectedColor) {
            alert('Por favor selecciona el color del producto')
            return
        }

        const finalPrice = getFinalPrice() / quantity // Precio unitario

        addToCart(product, quantity, {
            purchaseType,
            selectedColor,
            selectedCondition: purchaseType, // Usar purchaseType como condición
            selectedVariant,
            finalPrice
        })

        // Mostrar notificación
        setShowNotification(true)
        setTimeout(() => setShowNotification(false), 3000)

        // Resetear cantidad
        setQuantity(1)
    }

    const getPriceByType = () => {
        let basePrice = product.base_price

        // Ajustar según el tipo de venta
        switch (purchaseType) {
            case 'unidad':
                return basePrice // Precio base por unidad
            case 'caja':
                // Usar precio explícito si existe, sino calcular
                return product.price_box ? Number(product.price_box) : basePrice * (product.units_per_box || 12)
            case 'bulto':
                // Usar precio explícito si existe, sino calcular
                return product.price_bundle ? Number(product.price_bundle) : basePrice * (product.units_per_box || 12) * (product.boxes_per_bundle || 40)
            default:
                return basePrice
        }
    }

    const getFinalPrice = () => {
        let price = getPriceByType()
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

                        {user ? (
                            <div className="product-price">
                                {formatPrice(getFinalPrice())}
                            </div>
                        ) : (
                            <div className="login-required">
                                <i className="fas fa-lock"></i> Inicia sesión para ver precios
                            </div>
                        )}

                        {product.description && (
                            <div className="product-description">
                                <h3>Descripción</h3>
                                <p>{product.description}</p>
                            </div>
                        )}

                        {/* Información de paquete y bulto */}
                        <div className="package-info">
                            <div className="info-item">
                                <i className="fas fa-box"></i>
                                <span>{product.units_per_box || 12} unidades por paquete</span>
                            </div>
                            <div className="info-item">
                                <i className="fas fa-pallet"></i>
                                <span>{product.boxes_per_bundle || 40} paquetes por bulto</span>
                            </div>
                        </div>

                        {/* Selector de Tipo de Venta */}
                        <div className="form-group">
                            <label>Tipo de Venta</label>
                            <select
                                className="form-control"
                                value={purchaseType}
                                onChange={(e) => setPurchaseType(e.target.value)}
                            >
                                <option value="">Elige una opción</option>
                                {product.sale_types?.includes('unidad') && (
                                    <option value="unidad">Unidad</option>
                                )}
                                {product.sale_types?.includes('caja') && (
                                    <option value="caja">Caja ({product.units_per_box || 12} unidades)</option>
                                )}
                                {product.sale_types?.includes('bulto') && (
                                    <option value="bulto">Bulto ({product.boxes_per_bundle || 40} cajas)</option>
                                )}
                            </select>
                        </div>

                        {/* Selector de color - Solo si el producto tiene colores */}
                        {product.has_colors && (
                            <div className="form-group">
                                <label>Color</label>
                                <select
                                    className="form-control"
                                    value={selectedColor}
                                    onChange={(e) => setSelectedColor(e.target.value)}
                                >
                                    <option value="">Elige una opción</option>
                                    <option value="Rojo">Rojo</option>
                                    <option value="Azul">Azul</option>
                                    <option value="Verde">Verde</option>
                                    <option value="Amarillo">Amarillo</option>
                                    <option value="Negro">Negro</option>
                                    <option value="Blanco">Blanco</option>
                                </select>
                            </div>
                        )}

                        {/* Cantidad */}
                        <div className="product-quantity">
                            <h3>Cantidad de {purchaseType === 'caja' ? 'cajas' : purchaseType === 'bulto' ? 'bultos' : 'unidades'}</h3>
                            <div className="quantity-selector">
                                <button
                                    onClick={(e) => {
                                        e.preventDefault()
                                        setQuantity(Math.max(1, quantity - 1))
                                    }}
                                >-</button>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    min="1"
                                />
                                <button
                                    onClick={(e) => {
                                        e.preventDefault()
                                        setQuantity(quantity + 1)
                                    }}
                                >+</button>
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
                            onClick={handleAddToCart}
                            className="btn btn-primary btn-large btn-block"
                            disabled={!purchaseType || (product.has_colors && !selectedColor) || !user}
                        >
                            🛒 Agregar al Carrito
                        </button>

                        {/* Notificación de éxito */}
                        {showNotification && (
                            <div className="success-notification">
                                ✓ Producto agregado al carrito
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
            <WhatsAppButton />
        </div>
    )
}
