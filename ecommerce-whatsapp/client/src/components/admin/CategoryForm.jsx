import { useState, useEffect } from 'react'
import { createCategory, updateCategory } from '../../services/categoryService'
import './CategoryForm.css'

export default function CategoryForm({ category, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        active: true,
        display_order: 0
    })
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState({})

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name || '',
                description: category.description || '',
                active: category.active ?? true,
                display_order: category.display_order || 0
            })
            if (category.image_url) {
                setImagePreview(category.image_url)
            }
        }
    }, [category])

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
        // Limpiar error del campo
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }))
        }
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            // Validar tipo
            if (!file.type.startsWith('image/')) {
                setErrors(prev => ({ ...prev, image: 'Debe ser una imagen' }))
                return
            }
            // Validar tamaño (5MB)
            if (file.size > 5 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, image: 'La imagen debe ser menor a 5MB' }))
                return
            }

            setImageFile(file)
            setErrors(prev => ({ ...prev, image: null }))

            // Preview
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const removeImage = () => {
        setImageFile(null)
        setImagePreview(category?.image_url || null)
    }

    const validate = () => {
        const newErrors = {}

        if (!formData.name.trim()) {
            newErrors.name = 'El nombre es requerido'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validate()) return

        setLoading(true)

        try {
            let result
            if (category) {
                // Actualizar
                result = await updateCategory(category.id, formData, imageFile)
            } else {
                // Crear
                result = await createCategory(formData, imageFile)
            }

            if (result.error) {
                setErrors({ submit: result.error.message })
            } else {
                onSuccess()
            }
        } catch (error) {
            setErrors({ submit: 'Error al guardar la categoría' })
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="form-modal-overlay" onClick={onClose}>
            <div className="form-modal" onClick={(e) => e.stopPropagation()}>
                <div className="form-modal-header">
                    <h2>{category ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
                    <button onClick={onClose} className="close-button">×</button>
                </div>

                <form onSubmit={handleSubmit} className="category-form">
                    {errors.submit && (
                        <div className="error-banner">
                            {errors.submit}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="name">Nombre *</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            className={errors.name ? 'error' : ''}
                            disabled={loading}
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
                            rows="3"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label>Imagen</label>
                        <div className="image-upload-area">
                            {imagePreview ? (
                                <div className="image-preview">
                                    <img src={imagePreview} alt="Preview" />
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="remove-image-btn"
                                        disabled={loading}
                                    >
                                        ×
                                    </button>
                                </div>
                            ) : (
                                <label className="upload-placeholder">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        disabled={loading}
                                        style={{ display: 'none' }}
                                    />
                                    <div className="upload-icon">📷</div>
                                    <p>Click para subir imagen</p>
                                    <span>JPG, PNG o WebP (máx. 5MB)</span>
                                </label>
                            )}
                        </div>
                        {errors.image && <span className="error-text">{errors.image}</span>}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="display_order">Orden de visualización</label>
                            <input
                                id="display_order"
                                name="display_order"
                                type="number"
                                value={formData.display_order}
                                onChange={handleChange}
                                min="0"
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    name="active"
                                    type="checkbox"
                                    checked={formData.active}
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                                <span>Categoría activa</span>
                            </label>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-outline"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Guardando...' : (category ? 'Actualizar' : 'Crear')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
