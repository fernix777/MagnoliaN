import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../config/supabase'
import './Dashboard.css'

export default function Dashboard() {
    const { user, signOut } = useAuth()
    const navigate = useNavigate()
    const [stats, setStats] = useState({
        products: 0,
        categories: 0,
        orders: 0,
        sales: 0
    })
    const [loading, setLoading] = useState(true)

    console.log('🔍 Dashboard Component:', { user, loading })

    useEffect(() => {
        console.log('🚀 Dashboard: useEffect called')
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            console.log('📊 Dashboard: Fetching stats...')
            setLoading(true)

            // Fetch products count
            const { count: productsCount } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })

            // Fetch categories count
            const { count: categoriesCount } = await supabase
                .from('categories')
                .select('*', { count: 'exact', head: true })

            console.log('📈 Dashboard: Stats fetched:', { productsCount, categoriesCount })

            setStats({
                products: productsCount || 0,
                categories: categoriesCount || 0,
                orders: 0, // TODO: Implement when orders table exists
                sales: 0   // TODO: Implement when orders table exists
            })
        } catch (error) {
            console.error('❌ Dashboard: Error fetching stats:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        await signOut()
        navigate('/admin/login')
    }

    return (
        <div className="dashboard-container">
            <aside className="dashboard-sidebar">
                <div className="sidebar-header">
                    <img src="/logo.jpg" alt="Magnolia" className="sidebar-logo" />
                    <h2>Magnolia Admin</h2>
                </div>

                <nav className="sidebar-nav">
                    <a href="/admin/dashboard" className="nav-item active">
                        <span>📊</span> Dashboard
                    </a>
                    <a href="/admin/products" className="nav-item">
                        <span>📦</span> Productos
                    </a>
                    <a href="/admin/categories" className="nav-item">
                        <span>🏷️</span> Categorías
                    </a>
                    <a href="/admin/orders" className="nav-item">
                        <span>🛒</span> Pedidos
                    </a>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <p className="user-email">{user?.email}</p>
                        <span className="user-role">Administrador</span>
                    </div>
                    <button onClick={handleLogout} className="btn-logout">
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            <main className="dashboard-main">
                <header className="dashboard-header">
                    <h1>Dashboard</h1>
                    <p>Bienvenido al panel de administración de Magnolia Novedades</p>
                </header>

                <div className="dashboard-stats">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: 'var(--primary-light)' }}>
                            📦
                        </div>
                        <div className="stat-content">
                            <h3>Productos</h3>
                            <p className="stat-value">{loading ? '...' : stats.products}</p>
                            <span className="stat-label">Total de productos</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: 'var(--secondary)' }}>
                            🏷️
                        </div>
                        <div className="stat-content">
                            <h3>Categorías</h3>
                            <p className="stat-value">{loading ? '...' : stats.categories}</p>
                            <span className="stat-label">Total de categorías</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: 'var(--accent)' }}>
                            🛒
                        </div>
                        <div className="stat-content">
                            <h3>Pedidos</h3>
                            <p className="stat-value">{loading ? '...' : stats.orders}</p>
                            <span className="stat-label">Pedidos pendientes</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: 'var(--accent-2)' }}>
                            💰
                        </div>
                        <div className="stat-content">
                            <h3>Ventas</h3>
                            <p className="stat-value">{loading ? '...' : `$${stats.sales}`}</p>
                            <span className="stat-label">Este mes</span>
                        </div>
                    </div>
                </div>

                <div className="dashboard-content">
                    <div className="welcome-card">
                        <h2>🎉 ¡Bienvenido al Dashboard!</h2>
                        <p>Tu panel de administración está listo. Aquí podrás:</p>
                        <ul>
                            <li>✅ Gestionar productos y categorías</li>
                            <li>✅ Ver y administrar pedidos</li>
                        </ul>
                        <div style={{ marginTop: 'var(--spacing-lg)' }}>
                            <a href="/admin/products" className="btn btn-primary">
                                Comenzar a agregar productos
                            </a>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
