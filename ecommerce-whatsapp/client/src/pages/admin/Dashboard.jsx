import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

export default function Dashboard() {
    const { user, signOut } = useAuth()
    const navigate = useNavigate()

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
                    <a href="/admin/shipping" className="nav-item">
                        <span>🚚</span> Envíos
                    </a>
                    <a href="/admin/settings" className="nav-item">
                        <span>⚙️</span> Configuración
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
                            <p className="stat-value">0</p>
                            <span className="stat-label">Total de productos</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: 'var(--secondary)' }}>
                            🏷️
                        </div>
                        <div className="stat-content">
                            <h3>Categorías</h3>
                            <p className="stat-value">0</p>
                            <span className="stat-label">Total de categorías</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: 'var(--accent)' }}>
                            🛒
                        </div>
                        <div className="stat-content">
                            <h3>Pedidos</h3>
                            <p className="stat-value">0</p>
                            <span className="stat-label">Pedidos pendientes</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: 'var(--accent-2)' }}>
                            💰
                        </div>
                        <div className="stat-content">
                            <h3>Ventas</h3>
                            <p className="stat-value">$0</p>
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
                            <li>✅ Configurar métodos de envío</li>
                            <li>✅ Personalizar la configuración de la tienda</li>
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
