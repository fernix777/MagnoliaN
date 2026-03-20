import { useState, useEffect, useContext } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../../config/supabase'
import { AuthContext } from '../../context/AuthContext'
import { trackSearch } from '../../services/facebookService'
import { trackSearch as trackPixelSearch } from '../../utils/facebookPixel'
import Header from '../../components/customer/Header'
import Footer from '../../components/customer/Footer'
import WhatsAppButton from '../../components/customer/WhatsAppButton'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import './SearchPage.css'

export default function SearchPage() {
    const [searchParams] = useSearchParams()
    const query = searchParams.get('q') || ''
    const { user } = useContext(AuthContext)

    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({
        category: '',
        minPrice: '',
        maxPrice: '',
        sortBy: 'name' // name, price-asc, price-desc
    })

    useEffect(() => {
        if (query) {
            searchProducts()
        }
    }, [query, filters])

    useEffect(() => {
        if (query && !loading) {
            // Rastrear búsqueda
            trackSearch(query, products.length, {
                email: user?.email,
                user_id: user?.id
            });
            // Rastrear en Facebook Pixel
            trackPixelSearch(query);
        }
    }, [query, products.length, loading, user]);

    const searchProducts = async () => {
        setLoading(true)
        try {
            // Búsqueda base
            let queryBuilder = supabase
                .from('products')
                .select(`
                    *,
                    category:categories(id, name, slug),
                    images:product_images(id, image_url, is_primary, display_order)
                `)
                .eq('active', true)

            // Búsqueda por texto (nombre o descripción)
            if (query) {
                queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
            }

            // Filtro por categoría
            if (filters.category) {
                queryBuilder = queryBuilder.eq('category_id', filters.category)
            }

            // Filtro por precio
            if (filters.minPrice) {
                queryBuilder = queryBuilder.gte('base_price', parseFloat(filters.minPrice))
            }
            if (filters.maxPrice) {
                queryBuilder = queryBuilder.lte('base_price', parseFloat(filters.maxPrice))
            }

            // Ordenamiento
            switch (filters.sortBy) {
                case 'price-asc':
                    queryBuilder = queryBuilder.order('base_price', { ascending: true })
                    break
                case 'price-desc':
                    queryBuilder = queryBuilder.order('base_price', { ascending: false })
                    break
                default:
                    queryBuilder = queryBuilder.order('name', { ascending: true })
            }

            const { data, error } = await queryBuilder

            if (error) throw error

            // Ordenar imágenes por display_order
            const productsWithSortedImages = data?.map(product => ({
                ...product,
                images: product.images?.sort((a, b) => a.display_order - b.display_order) || []
            })) || []

            setProducts(productsWithSortedImages)
        } catch (error) {
            console.error('Error searching products:', error)
            setProducts([])
        } finally {
            setLoading(false)
        }
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price)
    }

    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({ ...prev, [filterName]: value }))
    }

    const clearFilters = () => {
        setFilters({
            category: '',
            minPrice: '',
            maxPrice: '',
            sortBy: 'name'
        })
    }

    return (
        <div className="search-page">
            <Header />

            <main className="search-container">
                <div className="search-header">
                    <h1>Resultados de búsqueda</h1>
                    {query && (
                        <p className="search-query">
                            Buscando: <strong>"{query}"</strong>
                            {!loading && <span className="results-count"> - {products.length} resultado{products.length !== 1 ? 's' : ''}</span>}
                        </p>
                    )}
                </div>

                <div className="search-content">
                    {/* Filtros laterales */}
                    <aside className="search-filters">
                        <div className="filters-header">
                            <h3>Filtros</h3>
                            <button onClick={clearFilters} className="btn-clear-filters">
                                Limpiar
                            </button>
                        </div>

                        {/* Ordenar por */}
                        <div className="filter-group">
                            <label>Ordenar por</label>
                            <select
                                value={filters.sortBy}
                                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                className="filter-select"
                            >
                                <option value="name">Nombre (A-Z)</option>
                                <option value="price-asc">Precio (menor a mayor)</option>
                                <option value="price-desc">Precio (mayor a menor)</option>
                            </select>
                        </div>

                        {/* Rango de precio */}
                        <div className="filter-group">
                            <label>Rango de precio</label>
                            <div className="price-inputs">
                                <input
                                    type="number"
                                    placeholder="Mín"
                                    value={filters.minPrice}
                                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                                    className="filter-input"
                                />
                                <span>-</span>
                                <input
                                    type="number"
                                    placeholder="Máx"
                                    value={filters.maxPrice}
                                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                                    className="filter-input"
                                />
                            </div>
                        </div>
                    </aside>

                    {/* Resultados */}
                    <div className="search-results">
                        {loading ? (
                            <LoadingSpinner size="large" message="Buscando productos..." />
                        ) : products.length > 0 ? (
                            <div className="products-grid">
                                {products.map(product => (
                                    <Link
                                        key={product.id}
                                        to={`/producto/${product.slug}`}
                                        className="product-card"
                                    >
                                        <div className="product-image">
                                            {product.images?.[0] ? (
                                                <img src={product.images[0].image_url} alt={product.name} />
                                            ) : (
                                                <div className="no-image">📷</div>
                                            )}
                                            {product.featured && (
                                                <span className="badge-featured">Destacado</span>
                                            )}
                                        </div>
                                        <div className="product-info">
                                            <h3>{product.name}</h3>
                                            {product.category && (
                                                <p className="product-category">{product.category.name}</p>
                                            )}
                                            {product.description && (
                                                <p className="product-description">
                                                    {product.description.substring(0, 100)}
                                                    {product.description.length > 100 ? '...' : ''}
                                                </p>
                                            )}
                                            <div className="product-footer">
                                                <span className="product-price">
                                                    {formatPrice(product.base_price)}
                                                </span>
                                                <span className="product-stock">
                                                    {product.stock > 0 ? (
                                                        <span className="in-stock">✓ Disponible</span>
                                                    ) : (
                                                        <span className="out-of-stock">✗ No Disponible</span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="no-results">
                                <div className="no-results-icon">🔍</div>
                                <h2>No se encontraron productos</h2>
                                <p>
                                    {query
                                        ? `No encontramos productos que coincidan con "${query}"`
                                        : 'Intenta buscar con otros términos'
                                    }
                                </p>
                                <Link to="/productos" className="btn btn-primary">
                                    Ver todos los productos
                                </Link>
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
