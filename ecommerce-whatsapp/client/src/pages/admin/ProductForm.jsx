import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getProductById, createProduct, updateProduct, addProductImages } from '../../services/productService'
import { getCategories } from '../../services/categoryService'
import ImageUploader from '../../components/admin/ImageUploader'
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
        stock: 0,
        active: true,
        featured: false,
        units_per_box: 12,
        boxes_per_bundle: 40,
        price_box: '',
        price_bundle: '',
        has_colors: true,
        sale_types: ['unidad', 'paquete', 'bulto'],
        variants: [],
        categories: [], // [{ category_id, subcategory_id }]
        weight_g: '',
        height_cm: '',
        width_cm: '',
        length_cm: ''
    })

    const [images, setImages] = useState([])
    const [newColor, setNewColor] = useState('') // Para agregar color personalizado
    const [errors, setErrors] = useState({})

    useEffect(() => {
        loadCategories()
        if (isEditing) {
            loadProduct()
        }
    }, [id])

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

        // Cargar variantes existentes
        let variants = [];
        let colors = [];

        if (data.variants && data.variants.length > 0) {
            variants = data.variants.map(v => ({
                ...v,
                active: v.active !== undefined ? v.active : true
            }));
        }

        // Cargar categorías
        let productCategories = [];
        if (data.product_categories && data.product_categories.length > 0) {
            productCategories = data.product_categories.map(pc => ({
                category_id: pc.category_id || '',
                subcategory_id: pc.subcategory_id || ''
            }));
        } else if (data.category_id) {
            // Migración: Si tiene category_id pero no product_categories
            productCategories = [{ 
                category_id: data.category_id || '', 
                subcategory_id: data.subcategory_id || '' 
            }];
        }

        setFormData({
            name: data.name || '',
            description: data.description || '',
            base_price: data.base_price || '',
            stock: data.stock || 0,
            active: data.active ?? true,
            featured: data.featured ?? false,
            units_per_box: data.units_per_box || 12,
            boxes_per_bundle: data.boxes_per_bundle || 40,
            price_box: data.price_box || '',
            price_bundle: data.price_bundle || '',
            has_colors: data.has_colors ?? true,
            sale_types: data.sale_types || ['unidad', 'paquete', 'bulto'],
            variants: variants,
            categories: productCategories,
            weight_g: data.weight_g || '',
            height_cm: data.height_cm || '',
            width_cm: data.width_cm || '',
            length_cm: data.length_cm || ''
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

        setLoading(false)
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;

        setFormData(prev => {
            const newFormData = {
                ...prev,
                [name]: newValue
            };

            // Si se desactiva has_colors, limpiar los variantes
            if (name === 'has_colors' && !newValue) {
                return {
                    ...newFormData,
                    variants: []
                };
            }

            return newFormData;
        });

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    }

    const handleSaleTypeChange = (type) => {
        setFormData(prev => {
            const currentTypes = prev.sale_types || []
            const newTypes = currentTypes.includes(type)
                ? currentTypes.filter(t => t !== type)
                : [...currentTypes, type]
            return { ...prev, sale_types: newTypes }
        })

        if (errors.sale_types) {
            setErrors(prev => ({ ...prev, sale_types: null }))
        }
    }

    const handleAddCategory = () => {
        setFormData(prev => ({
            ...prev,
            categories: [...prev.categories, { category_id: '', subcategory_id: '', tempId: Date.now() }]
        }))
    }

    const handleRemoveCategory = (index) => {
        setFormData(prev => {
            const newCats = [...prev.categories]
            newCats.splice(index, 1)
            return { ...prev, categories: newCats }
        })
    }

    const handleCategoryChange = (index, field, value) => {
        setFormData(prev => {
            const newCats = [...prev.categories]
            newCats[index] = { ...newCats[index], [field]: value }
            
            // Si cambia la categoría, resetear subcategoría
            if (field === 'category_id') {
                newCats[index].subcategory_id = ''
            }
            
            return { ...prev, categories: newCats }
        })
    }

    const handleAddVariant = () => {
        if (!newColor.trim()) return
        
        // Verificar si ya existe
        const exists = formData.variants.some(v => 
            (v.name || v.variant_value).toLowerCase() === newColor.trim().toLowerCase()
        )
        
        if (exists) {
            toast.error('Este color ya está en la lista')
            return
        }

        setFormData(prev => ({
            ...prev,
            variants: [...prev.variants, { 
                name: newColor.trim(), 
                variant_value: newColor.trim(), 
                active: true,
                variant_type: 'color'
            }]
        }))
        setNewColor('')
    }

    const handleRemoveVariant = (index) => {
        setFormData(prev => {
            const newVars = [...prev.variants]
            newVars.splice(index, 1)
            return { ...prev, variants: newVars }
        })
    }

    const handleToggleVariantActive = (index) => {
        setFormData(prev => {
            const newVars = [...prev.variants]
            newVars[index] = { ...newVars[index], active: !newVars[index].active }
            return { ...prev, variants: newVars }
        })
    }

    const validate = () => {
        const newErrors = {}

        if (!formData.name.trim()) {
            newErrors.name = 'El nombre es requerido'
        }

        if (!formData.base_price || Number(formData.base_price) <= 0) {
            newErrors.base_price = 'El precio debe ser mayor a 0'
        }
        
        if (!formData.weight_g || Number(formData.weight_g) <= 0) {
            newErrors.weight_g = 'El peso es requerido (en gramos)'
        }

        if (!formData.categories || formData.categories.length === 0) {
            newErrors.categories = 'Selecciona al menos una categoría'
        }

        if (images.length === 0) {
            newErrors.images = 'Agrega al menos una imagen'
        }

        // Validar que al menos un tipo de venta esté seleccionado
        if (!formData.sale_types || formData.sale_types.length === 0) {
            newErrors.sale_types = 'Selecciona al menos un tipo de venta'
        }

        // Validar precios según tipos de venta seleccionados
        if (formData.sale_types?.includes('paquete') && (!formData.price_box || Number(formData.price_box) <= 0)) {
            newErrors.price_box = 'El precio por paquete es requerido'
        }

        if (formData.sale_types?.includes('bulto') && (!formData.price_bundle || Number(formData.price_bundle) <= 0)) {
            newErrors.price_bundle = 'El precio por bulto es requerido'
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
                // Asignar primera categoría como principal para compatibilidad
                category_id: formData.categories[0]?.category_id ? Number(formData.categories[0].category_id) : null,
                subcategory_id: formData.categories[0]?.subcategory_id ? Number(formData.categories[0].subcategory_id) : null,
                categories: formData.categories,
                units_per_box: Number(formData.units_per_box),
                boxes_per_bundle: Number(formData.boxes_per_bundle),
                price_box: formData.price_box ? Number(formData.price_box) : null,
                price_bundle: formData.price_bundle ? Number(formData.price_bundle) : null,
                has_colors: formData.has_colors,
                sale_types: formData.sale_types,
                weight_g: formData.weight_g ? Number(formData.weight_g) : null,
                height_cm: formData.height_cm ? Number(formData.height_cm) : null,
                width_cm: formData.width_cm ? Number(formData.width_cm) : null,
                length_cm: formData.length_cm ? Number(formData.length_cm) : null,
                // Usar las variantes de formData
                variants: formData.has_colors && formData.variants && formData.variants.length > 0
                    ? formData.variants.map(v => ({
                        name: v.name || v.variant_value,
                        variant_value: v.variant_value || v.name,
                        variant_type: 'color',
                        sku: v.sku || '',
                        active: v.active !== undefined ? v.active : true,
                        price_modifier: 0, 
                        stock: 0 
                    }))
                    : []
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
                
                // Si hay imágenes nuevas, agregarlas
                if (result.error) {
                    throw result.error
                }
                
                if (newImageFiles.length > 0) {
                    console.log(`[DEBUG] Agregando ${newImageFiles.length} imágenes nuevas al producto ${productId}`)
                    const { data: addedImages, error: imagesError } = await addProductImages(productId, newImageFiles)
                    if (imagesError) {
                        console.error('[DEBUG] Error agregando imágenes:', imagesError)
                        toast.error('Producto actualizado pero error al agregar imágenes')
                    } else {
                        console.log('[DEBUG] Imágenes agregadas:', addedImages)
                    }
                }
            } else {
                // Crear producto con imágenes
                result = await createProduct(productData, newImageFiles)
                productId = result.data?.id
                
                if (result.error) {
                    throw result.error
                }
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
                            rows="6"
                            disabled={saving}
                            placeholder="Ingresa la descripción del producto. Usa un asterisco (*) al inicio de cada línea para crear características que se mostrarán como tags redondeados.&#10;&#10;Ejemplo:&#10;Este es mi producto&#10;* 30 LED&#10;* Medida 3 metros&#10;* 3 pilas incluidas"
                        />
                        <small style={{ color: 'var(--gray)', marginTop: 'var(--spacing-xs)' }}>
                            💡 Tip: Usa un asterisco (*) al inicio de cada línea para crear tags. La primera línea sin asterisco será el título.
                        </small>
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
                            <label htmlFor="stock">Disponibilidad</label>
                            <select
                                id="stock"
                                name="stock"
                                value={formData.stock > 0 ? 'available' : 'unavailable'}
                                onChange={(e) => {
                                    const val = e.target.value === 'available' ? 1000 : 0;
                                    setFormData(prev => ({ ...prev, stock: val }))
                                }}
                                disabled={saving}
                                style={{ borderColor: formData.stock > 0 ? 'var(--success)' : 'var(--danger)' }}
                            >
                                <option value="available">Disponible</option>
                                <option value="unavailable">No disponible</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="units_per_box">Unidades por Paquete</label>
                            <input
                                id="units_per_box"
                                name="units_per_box"
                                type="number"
                                min="1"
                                value={formData.units_per_box}
                                onChange={handleChange}
                                disabled={saving}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="boxes_per_bundle">Paquetes por Bulto</label>
                            <input
                                id="boxes_per_bundle"
                                name="boxes_per_bundle"
                                type="number"
                                min="1"
                                value={formData.boxes_per_bundle}
                                onChange={handleChange}
                                disabled={saving}
                            />
                        </div>
                    </div>

                    {/* Precios Explícitos - Condicionales */}
                    {formData.sale_types?.includes('paquete') && (
                        <div className="form-group">
                            <label htmlFor="price_box">Precio por Paquete ({formData.units_per_box} u) *</label>
                            <input
                                id="price_box"
                                name="price_box"
                                type="number"
                                step="0.01"
                                value={formData.price_box}
                                onChange={handleChange}
                                disabled={saving}
                                className={errors.price_box ? 'error' : ''}
                            />
                            {errors.price_box && <span className="error-text">{errors.price_box}</span>}
                        </div>
                    )}

                    {formData.sale_types?.includes('bulto') && (
                        <div className="form-group">
                            <label htmlFor="price_bundle">Precio por Bulto ({Number(formData.units_per_box || 12) * Number(formData.boxes_per_bundle || 40)} u) *</label>
                            <input
                                id="price_bundle"
                                name="price_bundle"
                                type="number"
                                step="0.01"
                                value={formData.price_bundle}
                                onChange={handleChange}
                                disabled={saving}
                                className={errors.price_bundle ? 'error' : ''}
                            />
                            {errors.price_bundle && <span className="error-text">{errors.price_bundle}</span>}
                        </div>
                    )}
                </section>

                {/* Categorización */}
                <section className="form-section">
                    <h2>Categorización</h2>
                    <p className="section-description">Asigna una o más categorías a este producto.</p>

                    {formData.categories.map((cat, index) => {
                        const selectedCategory = categories.find(c => c.id === Number(cat.category_id))
                        const availableSubcategories = selectedCategory?.subcategories || []

                        return (
                            <div key={cat.tempId || index} className="category-row" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                    <label>Categoría {index + 1} *</label>
                                    <select
                                        value={cat.category_id || ''}
                                        onChange={(e) => handleCategoryChange(index, 'category_id', e.target.value)}
                                        disabled={saving}
                                        className={errors.categories && index === 0 && !cat.category_id ? 'error' : ''}
                                    >
                                        <option value="">Selecciona una categoría</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                    <label>Subcategoría</label>
                                    <select
                                        value={cat.subcategory_id || ''}
                                        onChange={(e) => handleCategoryChange(index, 'subcategory_id', e.target.value)}
                                        disabled={saving || !cat.category_id}
                                    >
                                        <option value="">Sin subcategoría</option>
                                        {availableSubcategories.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleRemoveCategory(index)}
                                    className="btn-icon danger"
                                    title="Eliminar categoría"
                                    style={{ padding: '10px', height: '42px', marginTop: '24px' }}
                                    disabled={formData.categories.length === 1}
                                >
                                    ×
                                </button>
                            </div>
                        )
                    })}

                    <button
                        type="button"
                        onClick={handleAddCategory}
                        className="btn-secondary"
                        style={{ marginTop: '0.5rem' }}
                    >
                        + Agregar otra categoría
                    </button>
                    {errors.categories && <span className="error-text" style={{ display: 'block', marginTop: '0.5rem' }}>{errors.categories}</span>}
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



                {/* Configuración de Venta */}
                <section className="form-section">
                    <h2>Configuración de Venta</h2>

                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                name="has_colors"
                                type="checkbox"
                                checked={formData.has_colors}
                                onChange={handleChange}
                                disabled={saving}
                            />
                            <span>Este producto tiene opciones de color/variantes</span>
                        </label>
                    </div>

                    {/* Gestión de Variantes */}
                    {formData.has_colors && (
                        <div className="form-group">
                            <label>Gestión de Variantes</label>
                            <p className="section-description">Agrega los colores disponibles. Puedes ocultar los que no tengan stock temporalmente.</p>
                            
                            <div className="add-variant-row" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                <input
                                    type="text"
                                    value={newColor}
                                    onChange={(e) => setNewColor(e.target.value)}
                                    placeholder="Nombre del color (ej. Celeste)"
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddVariant())}
                                    style={{ flex: 1 }}
                                />
                                <button 
                                    type="button" 
                                    onClick={handleAddVariant}
                                    className="btn-secondary"
                                    disabled={!newColor.trim()}
                                >
                                    Agregar
                                </button>
                            </div>

                            <div className="variants-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {formData.variants.map((variant, index) => (
                                    <div key={index} className="variant-item" style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        padding: '8px 12px',
                                        background: '#f3f4f6',
                                        borderRadius: '6px',
                                        border: '1px solid #e5e7eb'
                                    }}>
                                        <span style={{ fontWeight: 500 }}>{variant.name || variant.variant_value}</span>
                                        
                                        <div className="variant-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <label className="checkbox-label" style={{ marginBottom: 0, fontSize: '14px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={variant.active}
                                                    onChange={() => handleToggleVariantActive(index)}
                                                />
                                                <span>{variant.active ? 'Visible' : 'Oculto'}</span>
                                            </label>
                                            
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveVariant(index)}
                                                className="btn-icon danger"
                                                title="Eliminar variante"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {formData.variants.length === 0 && (
                                    <p className="no-data-text" style={{ color: 'var(--gray)', fontStyle: 'italic' }}>No hay variantes agregadas.</p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Tipos de venta disponibles *</label>
                        <div className="form-checkboxes">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.sale_types?.includes('unidad')}
                                    onChange={() => handleSaleTypeChange('unidad')}
                                    disabled={saving}
                                />
                                <span>Venta por Unidad</span>
                            </label>

                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.sale_types?.includes('paquete')}
                                    onChange={() => handleSaleTypeChange('paquete')}
                                    disabled={saving}
                                    id="sale_type_paquete"
                                />
                                <span>Venta por Paquete ({formData.units_per_box} unidades)</span>
                            </label>

                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.sale_types?.includes('bulto')}
                                    onChange={() => handleSaleTypeChange('bulto')}
                                    disabled={saving}
                                />
                                <span>Venta por Bulto ({formData.boxes_per_bundle} paquetes)</span>
                            </label>
                        </div>
                        {errors.sale_types && <span className="error-text">{errors.sale_types}</span>}
                    </div>
                </section>

                {/* Envíos / Logística */}
                <section className="form-section">
                    <h2>Logística y Envíos</h2>
                    <p className="section-description">Datos necesarios para el cálculo de costos de envío (Correo Argentino, Vía Cargo).</p>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="weight_g">Peso (g) *</label>
                            <input
                                id="weight_g"
                                name="weight_g"
                                type="number"
                                value={formData.weight_g}
                                onChange={handleChange}
                                className={errors.weight_g ? 'error' : ''}
                                disabled={saving}
                                placeholder="Ej: 500"
                            />
                            {errors.weight_g && <span className="error-text">{errors.weight_g}</span>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="height_cm">Alto (cm)</label>
                            <input
                                id="height_cm"
                                name="height_cm"
                                type="number"
                                value={formData.height_cm}
                                onChange={handleChange}
                                disabled={saving}
                                placeholder="Ej: 10"
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="width_cm">Ancho (cm)</label>
                            <input
                                id="width_cm"
                                name="width_cm"
                                type="number"
                                value={formData.width_cm}
                                onChange={handleChange}
                                disabled={saving}
                                placeholder="Ej: 20"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="length_cm">Largo (cm)</label>
                            <input
                                id="length_cm"
                                name="length_cm"
                                type="number"
                                value={formData.length_cm}
                                onChange={handleChange}
                                disabled={saving}
                                placeholder="Ej: 30"
                            />
                        </div>
                    </div>
                    <small style={{ color: 'var(--gray)', display: 'block', marginTop: '-10px', marginBottom: '20px' }}>
                        Nota: Las dimensiones en centímetros son obligatorias si utilizas Correo Argentino.
                    </small>
                </section>

                {/* Configuración General */}
                <section className="form-section">
                    <h2>Configuración General</h2>

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
        </div >
    )
}
