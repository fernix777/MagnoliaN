import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Header.css'

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    const handleSearch = (e) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            window.location.href = `/buscar?q=${encodeURIComponent(searchQuery)}`
        }
    }

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
                    <Link to="/" className="nav-link">Inicio</Link>
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

                {/* Carrito */}
                <Link to="/carrito" className="header-cart">
                    🛒
                    <span className="cart-badge">0</span>
                </Link>

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
                    <Link to="/" onClick={() => setMenuOpen(false)}>Inicio</Link>
                    <Link to="/productos" onClick={() => setMenuOpen(false)}>Productos</Link>
                    <Link to="/categorias" onClick={() => setMenuOpen(false)}>Categorías</Link>
                    <Link to="/contacto" onClick={() => setMenuOpen(false)}>Contacto</Link>
                </nav>
            )}
        </header>
    )
}
