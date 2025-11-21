export default function Home() {
    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, var(--off-white) 0%, var(--light-gray) 100%)' }}>
            {/* Header */}
            <header style={{
                padding: '1.5rem 0',
                backgroundColor: 'var(--white)',
                boxShadow: 'var(--shadow-sm)'
            }}>
                <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <img src="/logo.jpg" alt="Magnolia Novedades" style={{ height: '60px', borderRadius: 'var(--radius-md)' }} />
                    <nav style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                        <a href="/" style={{ color: 'var(--dark-gray)', textDecoration: 'none', fontWeight: '500' }}>Inicio</a>
                        <a href="/tienda" style={{ color: 'var(--dark-gray)', textDecoration: 'none', fontWeight: '500' }}>Tienda</a>
                        <a href="/contacto" style={{ color: 'var(--dark-gray)', textDecoration: 'none', fontWeight: '500' }}>Contacto</a>
                        <a href="/admin/login" className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: 'var(--text-sm)' }}>
                            Admin
                        </a>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <div className="container" style={{ padding: '4rem 0' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 style={{
                        fontSize: 'var(--text-5xl)',
                        color: 'var(--primary)',
                        marginBottom: '1rem',
                        textShadow: '2px 2px 4px rgba(233, 30, 140, 0.1)'
                    }}>
                        Bienvenido a Magnolia Novedades
                    </h1>
                    <p style={{
                        fontSize: 'var(--text-xl)',
                        color: 'var(--dark-gray)',
                        maxWidth: '600px',
                        margin: '0 auto'
                    }}>
                        Tu tienda de accesorios para el hogar y decoración
                    </p>
                </div>

                {/* Status Card */}
                <div style={{
                    padding: '2.5rem',
                    backgroundColor: 'var(--white)',
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: 'var(--shadow-lg)',
                    maxWidth: '900px',
                    margin: '0 auto'
                }}>
                    <h3 style={{ color: 'var(--primary)', marginBottom: '1.5rem' }}>
                        ✅ Sistema Configurado
                    </h3>

                    <div style={{ marginTop: '2rem' }}>
                        <h4 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Completado:</h4>
                        <ul style={{
                            listStyle: 'none',
                            padding: 0,
                            display: 'grid',
                            gap: '0.75rem'
                        }}>
                            <li style={{
                                padding: '0.75rem 1rem',
                                backgroundColor: 'var(--off-white)',
                                borderRadius: 'var(--radius-md)',
                                borderLeft: '4px solid var(--primary)'
                            }}>
                                ✅ Paleta de colores Magnolia (rosa/magenta)
                            </li>
                            <li style={{
                                padding: '0.75rem 1rem',
                                backgroundColor: 'var(--off-white)',
                                borderRadius: 'var(--radius-md)',
                                borderLeft: '4px solid var(--primary-light)'
                            }}>
                                ✅ Supabase configurado (PostgreSQL + Auth + Storage)
                            </li>
                            <li style={{
                                padding: '0.75rem 1rem',
                                backgroundColor: 'var(--off-white)',
                                borderRadius: 'var(--radius-md)',
                                borderLeft: '4px solid var(--accent)'
                            }}>
                                ✅ Sistema de autenticación implementado
                            </li>
                            <li style={{
                                padding: '0.75rem 1rem',
                                backgroundColor: 'var(--off-white)',
                                borderRadius: 'var(--radius-md)',
                                borderLeft: '4px solid var(--secondary)'
                            }}>
                                ✅ Dashboard administrativo creado
                            </li>
                        </ul>
                    </div>

                    <div style={{
                        marginTop: '2rem',
                        display: 'flex',
                        gap: '1rem',
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                    }}>
                        <a href="/admin/login" className="btn btn-primary" style={{
                            padding: '1rem 2rem',
                            fontSize: 'var(--text-lg)',
                            fontWeight: '600'
                        }}>
                            Acceder al Dashboard
                        </a>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer style={{
                marginTop: '4rem',
                padding: '2rem 0',
                backgroundColor: 'var(--white)',
                borderTop: '2px solid var(--light-gray)'
            }}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <p style={{ color: 'var(--gray)', fontSize: 'var(--text-sm)' }}>
                        © 2024 Magnolia Novedades - Todos los derechos reservados
                    </p>
                </div>
            </footer>
        </div>
    )
}
