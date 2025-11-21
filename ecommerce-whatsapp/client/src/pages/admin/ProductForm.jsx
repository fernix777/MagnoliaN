import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getProductById, createProduct, updateProduct } from '../../services/productService'
import { getCategories } from '../../services/categoryService'
import ImageUploader from '../../components/admin/ImageUploader'
import VariantManager from '../../components/admin/VariantManager'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import './ProductForm.css'

export default function ProductForm() {
    const { id } = useParams()
    const navigate = useNavigate()
    const isEditing = Boolean(id)

    const [loading, setLoading] = useState(isEditing)
    const [saving, setSaving] = useState(false)
    const [categories, setCategories] = useState([])
    const [subcategories, setSubcategories] = useState([])

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        base_price: '',
        category_id: '',
        subcategory_id: '',
        stock: 0,
        active: true,
        featured: false
    })

    const [images, setImages] = useState([])
    const [variants, setVariants] = useState([])
    const [errors, setErrors] = useState({})

    useEffect(() => {
        loadCategories()
        if (isEditing) {
            loadProduct()
        }
    }, [id])

    useEffect(() => {
        // Cargar subcategorías cuando cambia la categoría
        if (formData.category_id) {
            const category = categories.find(c => c.id === Number(formData.category_id))
            setSubcategories(category?.subcategories || [])
        } else {
            setSubcategories([])
            setFormData(prev => ({ ...prev, subcategory_id: '' }))
        }
    }, [formData.category_id, categories])

    const loadCategories = async () => {
        const { data } = await getCategories({ active: true })
        setCategories(data || [])
    }

    const loadProduct = async () => {
        setLoading(true)
        const { data, error } = await getProductById(id)

        if (error) {
            toast.error('Error al cargar producto')
            navigate('/admin/products')
            return
        }

        setFormData({
            name: data.name || '',
            description: data.description || '',
            base_price: data.base_price || '',
            category_id: data.category_id || '',
            subcategory_id: data.subcategory_id || '',
            stock: data.stock || 0,
            active: data.active ?? true,
            featured: data.featured ?? false
        })

        // Cargar imágenes existentes
        if (data.images) {
            setImages(data.images.map(img => ({
                id: img.id,
                image_url: img.image_url,
                preview: img.image_url,
                is_primary: img.is_primary,
                display_order: img.display_order
            })))
        }

        // Cargar variantes existentes
        if (data.variants) {
            setVariants(data.variants)
        }

        setLoading(false)
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }))
        }
    }

    const validate = () => {
        const newErrors = {}

        if (!formData.name.trim()) {
            newErrors.name = 'El nombre es requerido'
        }

        if (!formData.base_price || Number(formData.base_price) <= 0) {
            newErrors.base_price = 'El precio debe ser mayor a 0'
        }

        if (!formData.category_id) {
            newErrors.category_id = 'Selecciona una categoría'
        }

        if (images.length === 0) {
            newErrors.images = 'Agrega al menos una imagen'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validate()) {
            toast.error('Por favor completa todos los campos requeridos')
            return
        }

        setSaving(true)

        try {
            const productData = {
                ...formData,
                base_price: Number(formData.base_price),
                stock: Number(formData.stock),
                category_id: Number(formData.category_id),
                subcategory_id: formData.subcategory_id ? Number(formData.subcategory_id) : null
            }

            // Obtener solo las imágenes nuevas (que tienen file)
            const newImageFiles = images
                .filter(img => img.file)
                .map(img => img.file)

            let result
            let productId

            if (isEditing) {
                // Actualizar producto
                result = await updateProduct(id, productData)
                productId = id
            } else {
                // Crear producto con imágenes
                result = await createProduct(productData, newImageFiles)
                productId = result.data?.id
            }

            if (result.error) {
                throw result.error
            }

            // Guardar variantes si hay
            console.log('Variants to save:', variants)
            console.log('Product ID:', productId)

            if (variants.length > 0 && productId) {
                const { createVariant } = await import('../../services/variantService')

                console.log('Saving variants...')
                for (const variant of variants) {
                    const variantData = {
                        product_id: Number(productId),
                        color: variant.color || null,
                        size: variant.size || null,
                        sku: variant.sku || null,
                        price_modifier: Number(variant.price_modifier) || 0,
                        stock: Number(variant.stock) || 0
                    }

                    console.log('Saving variant:', variantData)
                    const result = await createVariant(variantData)
                    console.log('Variant save result:', result)
                }
                console.log('All variants saved')
            } else {
                console.log('No variants to save or no product ID')
            }

            toast.success(isEditing ? 'Producto actualizado' : 'Producto creado')
            navigate('/admin/products')
        } catch (error) {
            toast.error('Error al guardar el producto')
            console.error(error)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="product-form-page">
                <LoadingSpinner size="large" message="Cargando producto..." />
            </div>
        )
    }

    return (
        <div className="product-form-page">
            <div className="form-header">
                <div>
                    <h1>{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h1>
                    <p>Completa la información del producto</p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/admin/products')}
                    className="btn btn-outline"
                >
                    Cancelar
                </button>
            </div>

            <form onSubmit={handleSubmit} className="product-form">
                {/* Información Básica */}
                <section className="form-section">
                    <h2>Información Básica</h2>

                    <div className="form-group">
                        <label htmlFor="name">Nombre del Producto *</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            className={errors.name ? 'error' : ''}
                            disabled={saving}
                        />
                        {errors.name && <span className="error-text">{errors.name}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Descripción</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="4"
                            disabled={saving}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="base_price">Precio Base *</label>
                            <input
                                id="base_price"
                                name="base_price"
                                type="number"
                                step="0.01"
                                value={formData.base_price}
                                onChange={handleChange}
                                className={errors.base_price ? 'error' : ''}
                                disabled={saving}
                            />
                            {errors.base_price && <span className="error-text">{errors.base_price}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="stock">Stock</label>
                            <input
                                id="stock"
                                name="stock"
                                type="number"
                                min="0"
                                value={formData.stock}
                                onChange={handleChange}
                                disabled={saving}
                            />
                        </div>
                    </div>
                </section>

                {/* Categorización */}
                <section className="form-section">
                    <h2>Categorización</h2>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="category_id">Categoría *</label>
                            <select
                                id="category_id"
                                name="category_id"
                                value={formData.category_id}
                                onChange={handleChange}
                                className={errors.category_id ? 'error' : ''}
                                disabled={saving}
                            >
                                <option value="">Selecciona una categoría</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            {errors.category_id && <span className="error-text">{errors.category_id}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="subcategory_id">Subcategoría</label>
                            <select
                                id="subcategory_id"
                                name="subcategory_id"
                                value={formData.subcategory_id}
                                onChange={handleChange}
                                disabled={saving || !formData.category_id}
                            >
                                <option value="">Sin subcategoría</option>
                                {subcategories.map(sub => (
                                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>

                {/* Imágenes */}
                <section className="form-section">
                    <h2>Imágenes del Producto</h2>
                    <ImageUploader
                        images={images}
                        onChange={setImages}
                        maxImages={10}
                    />
                    {errors.images && <span className="error-text">{errors.images}</span>}
                </section>

                {/* Variantes */}
                <section className="form-section">
                    <h2>Variantes (Opcional)</h2>
                    <p className="section-description">
                        Define diferentes combinaciones de color y tamaño con sus propios precios y stock
                    </p>
                    <VariantManager
                        variants={variants}
                        onChange={setVariants}
                    />
                </section>

                {/* Configuración */}
                <section className="form-section">
                    <h2>Configuración</h2>

                    <div className="form-checkboxes">
                        <label className="checkbox-label">
                            <input
                                name="active"
                                type="checkbox"
                                checked={formData.active}
                                onChange={handleChange}
                                disabled={saving}
                            />
                            <span>Producto activo (visible en la tienda)</span>
                        </label>

                        <label className="checkbox-label">
                            <input
                                name="featured"
                                type="checkbox"
                                checked={formData.featured}
                                onChange={handleChange}
                                disabled={saving}
                            />
                            <span>Producto destacado</span>
                        </label>
                    </div>
                </section>

                {/* Botones de acción */}
                <div className="form-actions">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/products')}
                        className="btn btn-outline"
                        disabled={saving}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={saving}
                    >
                        {saving ? 'Guardando...' : (isEditing ? 'Actualizar Producto' : 'Crear Producto')}
                    </button>
                </div>
            </form>
        </div>
    )
}
