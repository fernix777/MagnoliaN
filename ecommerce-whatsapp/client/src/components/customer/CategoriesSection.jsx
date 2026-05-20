import { useState, useEffect, isNaN } from 'react'
import { Link } from 'react-router-dom'
import { getActiveCategories, getProductsByCategory } from '../../services/storeService'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../common/LoadingSpinner'
import './CategoriesSection.css'

export default function CategoriesSection() {
    const [categories, setCategories] = useState([])
    const [categoryProducts, setCategoryProducts] = useState({})
    const [loading, setLoading] = useState(true)
    const { user } = useAuth()

    useEffect(() => {
        loadCategories()
    }, [])

    const loadCategories = async () => {
        const { data } = await getActiveCategories()
        const categoriesData = data?.slice(0, 4) || []
        setCategories(categoriesData)
        
        // Cargar productos para cada categoría
        const productsMap = {}
        for (const category of categoriesData) {
            const { data: products } = await getProductsByCategory(category.slug)
            if (products && products.length > 0) {
                // Tomar solo los primeros 3 productos
                productsMap[category.id] = products.slice(0, 3)
            }
        }
        setCategoryProducts(productsMap)
        setLoading(false)
    }

    if (loading) {
        return (
            <section className="categories-section">
                <LoadingSpinner size="large" message="Cargando categorías..." />
            </section>
        )
    }

    if (categories.length === 0) {
        return null
    }

    return (
        <section className="categories-section">
            <div className="section-container">
                <h2 className="section-title">Nuestras Categorías</h2>
                <p className="section-subtitle">Explora nuestra variedad de productos</p>

                <div className="categories-grid">
                    {categories.map(category => (
                        <div key={category.id} className="category-card-wrapper">
                            <Link
                                to={`/categoria/${category.slug}`}
                                className="category-card"
                            >
                                {category.image_url && (
                                    <div className="category-image">
                                        <img src={category.image_url} alt={category.name} loading="lazy" />
                                    </div>
                                )}
                                <div className="category-info">
                                    <h3>{category.name}</h3>
                                    {/* {category.description && (
                                        <p>{category.description}</p>
                                    )} */}
                                </div>
                            </Link>
                            
                            {/* Productos destacados de la categoría */}
                            {categoryProducts[category.id] && categoryProducts[category.id].length > 0 && (
                                <div className="category-products">
                                    <div className="category-products-grid">
                                        {categoryProducts[category.id].map(product => (
                                            <Link
                                                key={product.id}
                                                to={`/producto/${product.slug}`}
                                                className="category-product-item"
                                            >
                                                {product.image_url && (
                                                    <div className="category-product-image">
                                                        <img src={product.image_url} alt={product.name} loading="lazy" />
                                                    </div>
                                                )}
                                                <div className="category-product-info">
                                                    <span className="category-product-name">{product.name}</span>
                                                    {product.price && (
                                                        <span className="category-product-price">
                                                            ${!isNaN(parseFloat(product.price)) ? parseFloat(product.price).toLocaleString('es-AR') : '0.00'}
                                                        </span>
                                                    )}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="section-cta">
                    <Link to="/categorias" className="btn btn-outline">
                        Ver Todas las Categorías
                    </Link>
                </div>
            </div>
        </section>
    )
}
