import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getProductById, createProduct, updateProduct } from '../../services/productService'
import { getCategories } from '../../services/categoryService'
import ImageUploader from '../../components/admin/ImageUploader'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import './ProductForm.css'

const AVAILABLE_COLORS = [
    'Cálido', 'Blanco', 'Multicolor',
    'Rojo', 'Azul', 'Verde', 'Amarillo',
    'Rosa', 'Violeta', 'Naranja', 'Negro',
    'Plateado', 'Dorado'
]

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
        featured: false,
        units_per_box: 12,
        boxes_per_bundle: 40,
        price_box: '',
        price_bundle: '',
        has_colors: true,
        sale_types: ['unidad', 'paquete', 'bulto'],
        variants: []
    })

    const [images, setImages] = useState([])
    const [selectedColors, setSelectedColors] = useState([])
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

        // Cargar variantes existentes y mapear a colores seleccionados
        let variants = [];
        let colors = [];
        
        if (data.variants && data.variants.length > 0) {
            variants = data.variants;
            // Extraer colores de variant_value, asegurando que sean válidos
            colors = data.variants
                .map(v => v.variant_value || v.name)
                .filter(color => AVAILABLE_COLORS.includes(color));
        }

        setFormData({
            name: data.name || '',
            description: data.description || '',
            base_price: data.base_price || '',
            category_id: data.category_id || '',
            subcategory_id: data.subcategory_id || '',
            stock: data.stock || 0,
            active: data.active ?? true,
            featured: data.featured ?? false,
            units_per_box: data.units_per_box || 12,
            boxes_per_bundle: data.boxes_per_bundle || 40,
            price_box: data.price_box || '',
            price_bundle: data.price_bundle || '',
            has_colors: data.has_colors ?? true,
            sale_types: data.sale_types || ['unidad', 'paquete', 'bulto'],
            variants: variants
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

        // Establecer colores seleccionados
        setSelectedColors(colors);
        
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
            
            // Si se desactiva has_colors, limpiar los colores seleccionados
            if (name === 'has_colors' && !newValue) {
                setSelectedColors([]);
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

    const handleColorChange = (color) => {
        setSelectedColors(prev => {
            const newSelectedColors = prev.includes(color)
                ? prev.filter(c => c !== color)
                : [...prev, color];
            
            return newSelectedColors;
        });

        // Actualizar las variantes cuando cambie la selección de colores
        setFormData(prevData => {
            const newSelectedColors = prevData.selectedColors || selectedColors;
            const colorToToggle = color;
            const isAdding = !newSelectedColors.includes(colorToToggle);

            if (isAdding) {
                // Agregar nueva variante para este color
                const newVariant = {
                    name: colorToToggle,
                    variant_value: colorToToggle,
                    variant_type: 'color',
                    sku: '',
                    price_modifier: 0,
                    stock: 0
                };
                return {
                    ...prevData,
                    variants: [...(prevData.variants || []), newVariant]
                };
            } else {
                // Remover variante para este color
                return {
                    ...prevData,
                    variants: (prevData.variants || []).filter(v => v.variant_value !== colorToToggle)
                };
            }
        });
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
                category_id: Number(formData.category_id),
                subcategory_id: formData.subcategory_id ? Number(formData.subcategory_id) : null,
                units_per_box: Number(formData.units_per_box),
                boxes_per_bundle: Number(formData.boxes_per_bundle),
                price_box: formData.price_box ? Number(formData.price_box) : null,
                price_bundle: formData.price_bundle ? Number(formData.price_bundle) : null,
                has_colors: formData.has_colors,
                sale_types: formData.sale_types,
                // Usar las variantes de formData directamente si existen, sino usar selectedColors
                variants: formData.has_colors && formData.variants && formData.variants.length > 0 
                    ? formData.variants.map(v => ({
                        name: v.name || v.variant_value,
                        variant_value: v.variant_value || v.name,
                        variant_type: 'color',
                        sku: v.sku || '',
                        price_modifier: v.price_modifier || 0,
                        stock: v.stock || 0
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
            } else {
                // Crear producto con imágenes
                result = await createProduct(productData, newImageFiles)
                productId = result.data?.id
            }

            if (result.error) {
                throw result.error
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

                    {/* Selector de Colores Simplificado */}
                    {formData.has_colors && (
                        <div className="form-group">
                            <label>Variantes de Color Disponibles</label>
                            <div className="color-grid">
                                {AVAILABLE_COLORS.map(color => (
                                    <label key={color} className="checkbox-label color-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedColors.includes(color)}
                                            onChange={() => handleColorChange(color)}
                                            disabled={saving}
                                        />
                                        <span>{color}</span>
                                    </label>
                                ))}
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
