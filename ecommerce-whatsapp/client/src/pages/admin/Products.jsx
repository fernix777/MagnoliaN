import { useState, useEffect } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { getProducts, deleteProduct } from '../../services/productService'
import { getCategories } from '../../services/categoryService'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useNavigate } from 'react-router-dom'
import './Products.css'

export default function Products() {
    const navigate = useNavigate()
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, product: null })
    const [filters, setFilters] = useState({
        search: '',
        category_id: '',
        active: undefined,
        featured: undefined
    })

    useEffect(() => {
        const controller = new AbortController()
        loadCategories()
        loadProducts(controller.signal)

        return () => controller.abort()
    }, [])

    useEffect(() => {
        const controller = new AbortController()
        loadProducts(controller.signal)

        return () => controller.abort()
    }, [filters])

    const loadCategories = async () => {
        const { data } = await getCategories({ active: true })
        setCategories(data || [])
    }

    const loadProducts = async (signal) => {
        setLoading(true)
        const { data, error } = await getProducts(filters, signal)

        if (error) {
            toast.error('Error al cargar productos')
            console.error(error)
        } else if (data) {
            // Only update if not aborted (data comes back as empty array on abort but we should verify signal if possible, 
            // but since service returns empty array on abort, we rely on component mounted state or signal check)
            if (!signal?.aborted) {
                setProducts(data || [])
            }
        }
        if (!signal?.aborted) {
            setLoading(false)
        }
    }

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value === '' ? undefined : value
        }))
    }

    const handleCreate = () => {
        navigate('/admin/products/new')
    }

    const handleEdit = (productId) => {
        navigate(`/admin/products/edit/${productId}`)
    }

    const handleDeleteClick = (product) => {
        setDeleteDialog({ isOpen: true, product })
    }

    const handleDeleteConfirm = async () => {
        const { success, deactivated, error } = await deleteProduct(deleteDialog.product.id)

        if (success) {
            if (deactivated) {
                toast('Producto desactivado (tiene órdenes asociadas)', {
                    icon: '⚠️',
                    style: { background: '#fff8e1', color: '#5d4037' }
                })
            } else {
                toast.success('Producto eliminado')
            }
            loadProducts()
        } else {
            toast.error('Error al eliminar producto')
            console.error(error)
        }

        setDeleteDialog({ isOpen: false, product: null })
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

    return (
        <div className="products-page">
            <Toaster position="top-right" />

            <div className="page-header">
                <div>
                    <h1>Productos</h1>
                    <p>Gestiona el catálogo de productos</p>
                </div>
                <button onClick={handleCreate} className="btn btn-primary">
                    + Agregar Producto
                </button>
            </div>

            <div className="products-filters">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Buscar productos..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                </div>

                <select
                    value={filters.category_id || ''}
                    onChange={(e) => handleFilterChange('category_id', e.target.value)}
                >
                    <option value="">Todas las categorías</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>

                <select
                    value={filters.active === undefined ? '' : filters.active}
                    onChange={(e) => handleFilterChange('active', e.target.value === '' ? '' : e.target.value === 'true')}
                >
                    <option value="">Todos los estados</option>
                    <option value="true">Activos</option>
                    <option value="false">Inactivos</option>
                </select>

                <select
                    value={filters.featured === undefined ? '' : filters.featured}
                    onChange={(e) => handleFilterChange('featured', e.target.value === '' ? '' : e.target.value === 'true')}
                >
                    <option value="">Destacados</option>
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                </select>
            </div>

            {loading ? (
                <LoadingSpinner size="large" message="Cargando productos..." />
            ) : products.length === 0 ? (
                <div className="empty-state">
                    <p>📦 No hay productos todavía</p>
                    <button onClick={handleCreate} className="btn btn-primary">
                        Crear primer producto
                    </button>
                </div>
            ) : (
                <div className="products-grid">
                    {products.map(product => {
                        const primaryImage = getPrimaryImage(product)

                        return (
                            <div key={product.id} className="product-card">
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

                                <div className="product-content">
                                    <div className="product-header">
                                        <h3>{product.name}</h3>
                                        <span className={`status-badge ${product.active ? 'active' : 'inactive'}`}>
                                            {product.active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>

                                    {product.description && (
                                        <p className="product-description">{product.description}</p>
                                    )}

                                    <div className="product-meta">
                                        <span className="product-price">{formatPrice(product.base_price)}</span>
                                        {product.category && (
                                            <span className="product-category">{product.category.name}</span>
                                        )}
                                    </div>

                                    <div className="product-stats">
                                        <span>{product.images?.length || 0} imágenes</span>
                                        <span>{product.variants?.length || 0} variantes</span>
                                        <span>{product.stock > 0 ? '✓ Disponible' : '✗ No Disponible'}</span>
                                    </div>
                                </div>

                                <div className="product-actions">
                                    <button
                                        onClick={() => handleEdit(product.id)}
                                        className="btn btn-outline btn-sm"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(product)}
                                        className="btn btn-outline btn-sm btn-danger-outline"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({ isOpen: false, product: null })}
                onConfirm={handleDeleteConfirm}
                title="Eliminar Producto"
                message={`¿Estás seguro de eliminar "${deleteDialog.product?.name}"? Se eliminarán todas las imágenes y variantes. Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                type="danger"
            />
        </div>
    )
}
