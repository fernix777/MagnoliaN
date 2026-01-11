import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function ProtectedRoute({ children }) {
    const { user, loading, isAdmin } = useAuth()

    console.log('🔍 ProtectedRoute Debug:', { user, loading, isAdmin: isAdmin() })

    if (loading) {
        console.log('⏳ ProtectedRoute: Loading...')
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: 'var(--off-white)'
            }}>
                <div className="spinner"></div>
                <p>Cargando...</p>
            </div>
        )
    }

    if (!user) {
        console.log('❌ ProtectedRoute: No user, redirecting to /admin/login')
        return <Navigate to="/admin/login" replace />
    }

    if (!isAdmin()) {
        console.log('❌ ProtectedRoute: User is not admin, redirecting to /')
        return <Navigate to="/" replace />
    }

    console.log('✅ ProtectedRoute: Access granted')
    return children
}
