import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import Cart from './Cart';
import './Header.css';

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [cartOpen, setCartOpen] = useState(false);
    const { user, signOut, isAdmin } = useAuth();
    const { getCartCount } = useCart();
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/buscar?q=${encodeURIComponent(searchQuery)}`);
            setSearchQuery(''); // Limpiar el campo de búsqueda
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            navigate('/');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    return (
        <header className="store-header">
            <div className="header-container">
                {/* Logo */}
                <Link to="/" className="header-logo">
                    <img src="/logo.jpg" alt="Magnolia Novedades" />
                    <span>Magnolia</span>
                </Link>

                {/* Navegación Desktop */}
                <nav className="header-nav desktop-nav">
                    <Link to="/" className="nav-link">Nosotros</Link>
                    <Link to="/productos" className="nav-link">Productos</Link>
                    <Link to="/envios" className="nav-link">Envíos</Link>
                    <Link to="/contacto" className="nav-link">Contacto</Link>
                </nav>

                {/* Búsqueda */}
                <form onSubmit={handleSearch} className="header-search">
                    <input
                        type="text"
                        placeholder="Buscar productos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button type="submit">🔍</button>
                </form>

                <div className="header-actions">
                    {/* Carrito */}
                    <button
                        className="header-cart"
                        title="Carrito"
                        onClick={() => setCartOpen(true)}
                    >
                        🛒
                        {getCartCount() > 0 && (
                            <span className="cart-badge">{getCartCount()}</span>
                        )}
                    </button>

                    {/* Usuario */}
                    {user ? (
                        <div className="user-dropdown">
                            <button className="user-button">
                                👤 {user.email.split('@')[0]}
                            </button>
                            <div className="dropdown-menu">
                                {isAdmin() && (
                                    <Link to="/admin/dashboard" className="dropdown-item">
                                        📊 Panel Admin
                                    </Link>
                                )}
                                <Link to="/mi-cuenta" className="dropdown-item">Mi Cuenta</Link>
                                <Link to="/mis-pedidos" className="dropdown-item">Mis Pedidos</Link>
                                <button onClick={handleSignOut} className="dropdown-item">
                                    Cerrar Sesión
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="auth-buttons">
                            <Link to="/login" className="btn btn-primary btn-sm">Iniciar Sesión</Link>
                        </div>
                    )}
                </div>

                {/* Hamburger Menu (Mobile) */}
                <button
                    className="hamburger-menu"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    {menuOpen ? '✕' : '☰'}
                </button>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <nav className="mobile-nav">
                    <form onSubmit={handleSearch} className="mobile-search-form">
                        <input
                            type="text"
                            placeholder="Buscar productos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="submit">🔍</button>
                    </form>
                    <Link to="/" onClick={() => setMenuOpen(false)}>Nosotros</Link>
                    <Link to="/productos" onClick={() => setMenuOpen(false)}>Productos</Link>
                    <Link to="/envios" onClick={() => setMenuOpen(false)}>Envíos</Link>
                    <Link to="/contacto" onClick={() => setMenuOpen(false)}>Contacto</Link>
                    
                    {/* Auth Buttons en Mobile */}
                    {!user && (
                        <>
                            <Link to="/login" className="mobile-auth-link mobile-auth-primary" onClick={() => setMenuOpen(false)}>Iniciar Sesión</Link>
                        </>
                    )}
                    
                    {user && (
                        <>
                            <Link to="/mi-cuenta" className="mobile-auth-link" onClick={() => setMenuOpen(false)}>Mi Cuenta</Link>
                            <Link to="/mis-pedidos" className="mobile-auth-link" onClick={() => setMenuOpen(false)}>Mis Pedidos</Link>
                            <button onClick={() => { handleSignOut(); setMenuOpen(false); }} className="mobile-auth-link" style={{ color: 'var(--error)' }}>
                                Cerrar Sesión
                            </button>
                        </>
                    )}
                </nav>
            )}

            {/* Cart Modal */}
            {cartOpen && <Cart onClose={() => setCartOpen(false)} />}
        </header>
    )
}
