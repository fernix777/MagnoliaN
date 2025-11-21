import { useState, useEffect } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { getCategories, deleteCategory } from '../../services/categoryService'
import CategoryForm from '../../components/admin/CategoryForm'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import './Categories.css'

export default function Categories() {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingCategory, setEditingCategory] = useState(null)
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, category: null })
    const [filter, setFilter] = useState('all') // 'all' | 'active' | 'inactive'

    useEffect(() => {
        loadCategories()
    }, [filter])

    const loadCategories = async () => {
        setLoading(true)
        const options = filter === 'all' ? {} : { active: filter === 'active' }
        const { data, error } = await getCategories(options)

        if (error) {
            toast.error('Error al cargar categorías')
            console.error(error)
        } else {
            setCategories(data || [])
        }
        setLoading(false)
    }

    const handleCreate = () => {
        setEditingCategory(null)
        setShowForm(true)
    }

    const handleEdit = (category) => {
        setEditingCategory(category)
        setShowForm(true)
    }

    const handleFormClose = () => {
        setShowForm(false)
        setEditingCategory(null)
    }

    const handleFormSuccess = () => {
        setShowForm(false)
        setEditingCategory(null)
        loadCategories()
        toast.success(editingCategory ? 'Categoría actualizada' : 'Categoría creada')
    }

    const handleDeleteClick = (category) => {
        setDeleteDialog({ isOpen: true, category })
    }

    const handleDeleteConfirm = async () => {
        const { success, error } = await deleteCategory(deleteDialog.category.id)

        if (success) {
            toast.success('Categoría eliminada')
            loadCategories()
        } else {
            toast.error('Error al eliminar categoría')
            console.error(error)
        }

        setDeleteDialog({ isOpen: false, category: null })
    }

    return (
        <div className="categories-page">
            <Toaster position="top-right" />

            <div className="page-header">
                <div>
                    <h1>Categorías</h1>
                    <p>Gestiona las categorías de productos</p>
                </div>
                <button onClick={handleCreate} className="btn btn-primary">
                    + Agregar Categoría
                </button>
            </div>

            <div className="categories-filters">
                <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    Todas
                </button>
                <button
                    className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
                    onClick={() => setFilter('active')}
                >
                    Activas
                </button>
                <button
                    className={`filter-btn ${filter === 'inactive' ? 'active' : ''}`}
                    onClick={() => setFilter('inactive')}
                >
                    Inactivas
                </button>
            </div>

            {loading ? (
                <LoadingSpinner size="large" message="Cargando categorías..." />
            ) : categories.length === 0 ? (
                <div className="empty-state">
                    <p>📦 No hay categorías todavía</p>
                    <button onClick={handleCreate} className="btn btn-primary">
                        Crear primera categoría
                    </button>
                </div>
            ) : (
                <div className="categories-grid">
                    {categories.map(category => (
                        <div key={category.id} className="category-card">
                            {category.image_url && (
                                <div className="category-image">
                                    <img src={category.image_url} alt={category.name} />
                                </div>
                            )}

                            <div className="category-content">
                                <div className="category-header">
                                    <h3>{category.name}</h3>
                                    <span className={`status-badge ${category.active ? 'active' : 'inactive'}`}>
                                        {category.active ? 'Activa' : 'Inactiva'}
                                    </span>
                                </div>

                                {category.description && (
                                    <p className="category-description">{category.description}</p>
                                )}

                                <div className="category-meta">
                                    <span className="subcategory-count">
                                        {category.subcategories?.length || 0} subcategorías
                                    </span>
                                </div>
                            </div>

                            <div className="category-actions">
                                <button
                                    onClick={() => handleEdit(category)}
                                    className="btn btn-outline btn-sm"
                                >
                                    Editar
                                </button>
                                <button
                                    onClick={() => handleDeleteClick(category)}
                                    className="btn btn-outline btn-sm btn-danger-outline"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <CategoryForm
                    category={editingCategory}
                    onClose={handleFormClose}
                    onSuccess={handleFormSuccess}
                />
            )}

            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({ isOpen: false, category: null })}
                onConfirm={handleDeleteConfirm}
                title="Eliminar Categoría"
                message={`¿Estás seguro de eliminar "${deleteDialog.category?.name}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                type="danger"
            />
        </div>
    )
}
