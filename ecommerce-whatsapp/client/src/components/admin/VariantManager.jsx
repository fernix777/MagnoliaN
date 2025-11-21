import { useState } from 'react'
import './VariantManager.css'

export default function VariantManager({ variants, onChange }) {
    const [editingIndex, setEditingIndex] = useState(null)
    const [newVariant, setNewVariant] = useState({
        color: '',
        size: '',
        sku: '',
        price_modifier: 0,
        stock: 0
    })

    const handleAdd = () => {
        if (!newVariant.color && !newVariant.size) {
            alert('Debes especificar al menos color o tamaño')
            return
        }

        onChange([...variants, { ...newVariant }])

        // Reset form
        setNewVariant({
            color: '',
            size: '',
            sku: '',
            price_modifier: 0,
            stock: 0
        })
    }

    const handleEdit = (index) => {
        setEditingIndex(index)
    }

    const handleSave = (index) => {
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

    return (
        <div className="variant-manager">
            <div className="variant-header">
                <h3>Variantes del Producto</h3>
                <p>Define diferentes colores, tamaños y precios</p>
            </div>

            {variants.length > 0 && (
                <div className="variants-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Color</th>
                                <th>Tamaño</th>
                                <th>SKU</th>
                                <th>Modificador $</th>
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
                                                value={variant.color || ''}
                                                onChange={(e) => handleChange(index, 'color', e.target.value)}
                                                placeholder="Ej: Rojo"
                                            />
                                        ) : (
                                            variant.color || '-'
                                        )}
                                    </td>
                                    <td>
                                        {editingIndex === index ? (
                                            <input
                                                type="text"
                                                value={variant.size || ''}
                                                onChange={(e) => handleChange(index, 'size', e.target.value)}
                                                placeholder="Ej: M"
                                            />
                                        ) : (
                                            variant.size || '-'
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
                <h4>Agregar Nueva Variante</h4>
                <div className="variant-form-grid">
                    <div className="form-field">
                        <label>Color</label>
                        <input
                            type="text"
                            value={newVariant.color}
                            onChange={(e) => handleNewVariantChange('color', e.target.value)}
                            placeholder="Ej: Rojo, Azul"
                        />
                    </div>

                    <div className="form-field">
                        <label>Tamaño</label>
                        <input
                            type="text"
                            value={newVariant.size}
                            onChange={(e) => handleNewVariantChange('size', e.target.value)}
                            placeholder="Ej: S, M, L"
                        />
                    </div>

                    <div className="form-field">
                        <label>SKU</label>
                        <input
                            type="text"
                            value={newVariant.sku}
                            onChange={(e) => handleNewVariantChange('sku', e.target.value)}
                            placeholder="Código único"
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

                    <div className="form-field">
                        <button
                            type="button"
                            onClick={handleAdd}
                            className="btn btn-primary"
                        >
                            + Agregar Variante
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
