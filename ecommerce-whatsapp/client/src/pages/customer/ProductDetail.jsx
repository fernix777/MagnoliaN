import { useState, useEffect, useContext } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getProductBySlug } from '../../services/storeService'
import { Helmet } from 'react-helmet-async'
import Header from '../../components/customer/Header'
import Footer from '../../components/customer/Footer'
import WhatsAppButton from '../../components/customer/WhatsAppButton'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { AuthContext } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { trackViewContent, trackAddToCart } from '../../services/facebookService'
import { trackViewContent as trackPixelViewContent, trackAddToCart as trackPixelAddToCart } from '../../utils/facebookPixel'
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
    const [purchaseType, setPurchaseType] = useState('') // 'unidad', 'paquete' o 'bulto'
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

        // Cargar variantes
        let variants = []
        let colors = []

        if (data.variants && data.variants.length > 0) {
            // Filtrar variantes inactivas
            variants = data.variants.filter(v => v.active !== false)
            
            // Extraer colores de variant_value
            colors = variants
                .map(v => v.variant_value || v.name)
        }

        setProduct({
            ...data,
            variants: variants
        })

        // Establecer imagen inicial
        if (data.images && data.images.length > 0) {
            // Buscar imagen primaria
            const primaryIndex = data.images.findIndex(img => img.is_primary)
            setSelectedImage(primaryIndex >= 0 ? primaryIndex : 0)
        }

        // Si hay variantes, preseleccionar la primera
        if (variants.length > 0) {
            // No seleccionamos automáticamente para obligar al usuario a elegir si lo desea
            // o se puede seleccionar el primero:
            // setSelectedVariant(variants[0])
            // setSelectedColor(variants[0].variant_value || variants[0].name)
        }

        setLoading(false)
    }

    useEffect(() => {
        if (product) {
            // Rastrear visualización del producto
            const currentUser = user ? {
                email: user.email,
                user_id: user.id
            } : null;

            trackViewContent(product, currentUser);
        }
    }, [product, user]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price)
    }

    const formatDescription = (description) => {
        if (!description) return null

        // Detectar si la descripción tiene líneas con asteriscos
        const lines = description.split('\n').map(line => line.trim()).filter(line => line)
        const hasBullets = lines.some(line => line.startsWith('*'))

        if (hasBullets) {
            // Separar el título (primera línea sin asterisco) de los tags
            const titleLine = lines.find(line => !line.startsWith('*'))
            const tagLines = lines.filter(line => line.startsWith('*')).map(line => line.substring(1).trim())

            return (
                <div className="description-container">
                    {titleLine && <p className="description-title">{titleLine}</p>}
                    <div className="description-tags">
                        {tagLines.map((tag, index) => (
                            <span key={index} className="description-tag">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            )
        }

        // Si no tiene viñetas, mostrar línea por línea
        return (
            <div className="description-container">
                {lines.map((line, index) => (
                    <p key={index} className="description-line">
                        {line}
                    </p>
                ))}
            </div>
        )
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

        // Rastrear evento AddToCart en Facebook
        const currentUser = user ? {
            email: user.email,
            user_id: user.id
        } : null;
        trackAddToCart(product, quantity, currentUser);

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
            case 'paquete':
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

    // Definir metadatos base incluso antes de cargar el producto
    const images = product?.images || []
    const mainImage = images.length > 0 
        ? images[selectedImage]?.image_url 
        : (product?.image_url && !product?.image_url.includes('logo.jpg') 
            ? product?.image_url 
            : 'https://www.magnolia-n.com/hero-banner.jpg')

    const absoluteMainImage = mainImage.startsWith('http') 
        ? mainImage 
        : `https://www.magnolia-n.com${mainImage.startsWith('/') ? '' : '/'}${mainImage}`

    // Añadir un parámetro de versión para forzar a Facebook a recargar la imagen
    const imageWithCacheBuster = absoluteMainImage.includes('?') 
        ? `${absoluteMainImage}&v=1.1` 
        : `${absoluteMainImage}?v=1.1`

    const productUrl = product ? `https://www.magnolia-n.com/producto/${product.slug}` : window.location.href

    const helmetContent = (
        <Helmet>
            <title>{product ? `${product.name} - Magnolia Novedades` : 'Magnolia Novedades'}</title>
            <meta name="description" content={product?.description || 'Compra productos de calidad en Magnolia Novedades.'} />
            <link rel="canonical" href={productUrl} />
            
            <meta property="og:type" content={product ? "product" : "website"} />
            <meta property="og:url" content={productUrl} />
            <meta property="og:title" content={product?.name || 'Magnolia Novedades'} />
            <meta property="og:description" content={product?.description || 'Compra productos de calidad en Magnolia Novedades.'} />
            <meta property="og:image" content={imageWithCacheBuster} />
            <meta property="og:image:secure_url" content={imageWithCacheBuster} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:type" content="image/jpeg" />
            {product && <meta property="product:price:amount" content={product.base_price} />}
            {product && <meta property="product:price:currency" content="ARS" />}
            {product && <meta property="product:retailer_item_id" content={product.id.toString()} />}
            
            <meta name="twitter:title" content={product?.name || 'Magnolia Novedades'} />
            <meta name="twitter:description" content={product?.description || 'Compra productos de calidad en Magnolia Novedades.'} />
            <meta name="twitter:image" content={imageWithCacheBuster} />
            <meta name="twitter:url" content={productUrl} />
        </Helmet>
    )

    if (loading) {
        return (
            <div className="product-detail-page">
                {helmetContent}
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
                {helmetContent}
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

    const variants = product.variants || []

    return (
        <div className="product-detail-page">
            {helmetContent}
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
                    {/* Galería de imágenes con descripción abajo */}
                    <div className="product-gallery-section">
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

                        {/* Descripción debajo de las fotos */}
                        {product.description && (
                            <div className="product-description-section">
                                {formatDescription(product.description)}
                            </div>
                        )}
                    </div>

                    {/* Información del producto - Panel de compra */}
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
                                {product.sale_types?.includes('paquete') && (
                                    <option value="paquete">Paquete ({product.units_per_box || 12} unidades)</option>
                                )}
                                {product.sale_types?.includes('bulto') && (
                                    <option value="bulto">Bulto ({product.boxes_per_bundle || 40} paquetes)</option>
                                )}
                            </select>
                        </div>

                        {/* Selector de variante - Solo si el producto tiene variantes */}
                        {product.has_colors && product.variants && product.variants.length > 0 && (
                            <div className="form-group">
                                <label>Color</label>
                                <select
                                    className="form-control"
                                    value={selectedColor}
                                    onChange={(e) => {
                                        setSelectedColor(e.target.value)
                                        // Buscar la variante seleccionada para obtener el modificador de precio
                                        const selected = product.variants.find(v => v.variant_value === e.target.value)
                                        setSelectedVariant(selected || null)
                                    }}
                                >
                                    <option value="">Elige una opción</option>
                                    {product.variants.map((variant) => (
                                        <option key={variant.id} value={variant.variant_value}>
                                            {variant.variant_value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Acciones de compra */}
                        <div className="purchase-actions">
                            <div className="quantity-wrapper">
                                <div className="product-quantity">
                                    <h3>Cantidad de {purchaseType === 'paquete' ? 'paquetes' : purchaseType === 'bulto' ? 'bultos' : 'unidades'}</h3>
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
                                        ✓ Disponible
                                    </div>
                                ) : (
                                    <div className="stock-info unavailable">
                                        ✗ No Disponible
                                    </div>
                                )}
                            </div>

                            {/* Botón de compra */}
                            <button
                                onClick={handleAddToCart}
                                className="btn btn-primary btn-large add-to-cart-btn"
                                disabled={product.stock <= 0 || !purchaseType || (product.has_colors && !selectedColor) || !user}
                            >
                                {product.stock <= 0 ? (
                                    <>❌ No Disponible</>
                                ) : (
                                    <>🛒 Agregar al Carrito</>
                                )}
                            </button>
                        </div>

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
