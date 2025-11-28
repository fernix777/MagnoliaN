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
    const { user, signOut } = useAuth();
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
                    <Link to="/categorias" className="nav-link">Categorías</Link>
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
                                <Link to="/mi-cuenta" className="dropdown-item">Mi Cuenta</Link>
                                <Link to="/mis-pedidos" className="dropdown-item">Mis Pedidos</Link>
                                <button onClick={handleSignOut} className="dropdown-item">
                                    Cerrar Sesión
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="auth-buttons">
                            <Link to="/login" className="btn btn-outline btn-sm">Iniciar Sesión</Link>
                            <Link to="/registro" className="btn btn-primary btn-sm">Registrarse</Link>
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
                    <Link to="/categorias" onClick={() => setMenuOpen(false)}>Categorías</Link>
                    <Link to="/contacto" onClick={() => setMenuOpen(false)}>Contacto</Link>
                </nav>
            )}

            {/* Cart Modal */}
            {cartOpen && <Cart onClose={() => setCartOpen(false)} />}
        </header>
    )
}
