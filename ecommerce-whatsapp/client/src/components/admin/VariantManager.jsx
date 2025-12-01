import { useState } from 'react'
import './VariantManager.css'

export default function VariantManager({ variants, onChange }) {
    const [editingIndex, setEditingIndex] = useState(null)
    const [newVariant, setNewVariant] = useState({
        name: '',
        sku: '',
        price_modifier: 0,
        stock: 0
    })

    const handleAdd = () => {
        if (!newVariant.name.trim()) {
            alert('El nombre de la variante es requerido')
            return
        }

        // Verificar si ya existe una variante con el mismo nombre
        const variantExists = variants.some((v, i) =>
            v.name.toLowerCase() === newVariant.name.toLowerCase().trim() &&
            i !== editingIndex
        )

        if (variantExists) {
            alert(`Ya existe una variante con el nombre "${newVariant.name}"`)
            return
        }

        // Si estamos editando, actualizamos la variante existente
        if (editingIndex !== null) {
            const updatedVariants = [...variants]
            updatedVariants[editingIndex] = { ...newVariant }
            onChange(updatedVariants)
        } else {
            // Si no, agregamos una nueva variante
            onChange([...variants, { ...newVariant }])
        }

        // Reset form
        setNewVariant({
            name: '',
            sku: '',
            price_modifier: 0,
            stock: 0
        })

        // Si estábamos editando, limpiamos el índice de edición
        if (editingIndex !== null) {
            setEditingIndex(null)
        }
    }

    const handleEdit = (index) => {
        setEditingIndex(index)
        setNewVariant({
            ...variants[index]
        })
    }

    const handleSave = (index) => {
        if (!newVariant.name.trim()) {
            alert('El nombre de la variante es requerido')
            return
        }

        const updatedVariants = [...variants]
        updatedVariants[index] = { ...newVariant }
        onChange(updatedVariants)

        // Resetear el formulario y el índice de edición
        setNewVariant({
            name: '',
            sku: '',
            price_modifier: 0,
            stock: 0
        })
        setEditingIndex(null)
    }

    const handleChange = (index, field, value) => {
        const newVariants = [...variants]
        newVariants[index] = {
            ...newVariants[index],
            [field]: field === 'price_modifier' || field === 'stock' ? Number(value) : value
        }
        onChange(newVariants)
    }

    const handleRemove = (index) => {
        if (confirm('¿Eliminar esta variante?')) {
            onChange(variants.filter((_, i) => i !== index))
        }
    }

    const handleNewVariantChange = (field, value) => {
        setNewVariant(prev => ({
            ...prev,
            [field]: field === 'price_modifier' || field === 'stock' ? Number(value) : value
        }))
    }

    const handleCancelEdit = () => {
        setEditingIndex(null)
        setNewVariant({
            name: '',
            sku: '',
            price_modifier: 0,
            stock: 0
        })
    }

    return (
        <div className="variant-manager">
            <div className="variant-header">
                <h3>Variantes del Producto</h3>
                <p>Define diferentes variantes como colores, tipos, etc. (ej: Cálido, Blanco, Multicolor)</p>
            </div>

            {variants.length > 0 && (
                <div className="variants-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>SKU</th>
                                <th>Modificador de Precio</th>
                                <th>Stock</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {variants.map((variant, index) => (
                                <tr key={index}>
                                    <td>
                                        {editingIndex === index ? (
                                            <input
                                                type="text"
                                                value={variant.name || ''}
                                                onChange={(e) => handleChange(index, 'name', e.target.value)}
                                                placeholder="Nombre (ej: Cálido)"
                                            />
                                        ) : (
                                            <strong>{variant.name}</strong>
                                        )}
                                    </td>
                                    <td>
                                        {editingIndex === index ? (
                                            <input
                                                type="text"
                                                value={variant.sku || ''}
                                                onChange={(e) => handleChange(index, 'sku', e.target.value)}
                                                placeholder="SKU"
                                            />
                                        ) : (
                                            variant.sku || '-'
                                        )}
                                    </td>
                                    <td>
                                        {editingIndex === index ? (
                                            <input
                                                type="number"
                                                value={variant.price_modifier || 0}
                                                onChange={(e) => handleChange(index, 'price_modifier', e.target.value)}
                                                step="0.01"
                                            />
                                        ) : (
                                            `$${variant.price_modifier || 0}`
                                        )}
                                    </td>
                                    <td>
                                        {editingIndex === index ? (
                                            <input
                                                type="number"
                                                value={variant.stock || 0}
                                                onChange={(e) => handleChange(index, 'stock', e.target.value)}
                                                min="0"
                                            />
                                        ) : (
                                            variant.stock || 0
                                        )}
                                    </td>
                                    <td>
                                        <div className="variant-actions">
                                            {editingIndex === index ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleSave(index)}
                                                    className="btn-icon save"
                                                >
                                                    ✓
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleEdit(index)}
                                                    className="btn-icon edit"
                                                >
                                                    ✎
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleRemove(index)}
                                                className="btn-icon delete"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="add-variant-form">
                <h4>{editingIndex !== null ? 'Editar Variante' : 'Agregar Nueva Variante'}</h4>
                <div className="variant-form-grid">
                    <div className="form-field">
                        <label>Nombre *</label>
                        <input
                            type="text"
                            value={newVariant.name || ''}
                            onChange={(e) => handleNewVariantChange('name', e.target.value)}
                            placeholder="Ej: Cálido, Blanco, Multicolor"
                        />
                    </div>

                    <div className="form-field">
                        <label>SKU</label>
                        <input
                            type="text"
                            value={newVariant.sku}
                            onChange={(e) => handleNewVariantChange('sku', e.target.value)}
                            placeholder="Código único (opcional)"
                        />
                    </div>

                    <div className="form-field">
                        <label>Modificador de Precio ($)</label>
                        <input
                            type="number"
                            value={newVariant.price_modifier}
                            onChange={(e) => handleNewVariantChange('price_modifier', e.target.value)}
                            step="0.01"
                            placeholder="0.00"
                        />
                        <small>Ajuste al precio base (puede ser negativo)</small>
                    </div>

                    <div className="form-field">
                        <label>Stock</label>
                        <input
                            type="number"
                            value={newVariant.stock}
                            onChange={(e) => handleNewVariantChange('stock', e.target.value)}
                            min="0"
                            placeholder="0"
                        />
                    </div>

                    <div className="form-field form-actions-field">
                        <button
                            type="button"
                            onClick={handleAdd}
                            className="btn btn-primary"
                        >
                            {editingIndex !== null ? '✓ Guardar Cambios' : '+ Agregar Variante'}
                        </button>
                        {editingIndex !== null && (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="btn btn-outline"
                            >
                                Cancelar
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
