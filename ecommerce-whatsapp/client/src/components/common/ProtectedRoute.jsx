import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function ProtectedRoute({ children }) {
    const { user, loading, isAdmin } = useAuth()

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: 'var(--off-white)'
            }}>
                <div className="spinner"></div>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/admin/login" replace />
    }

    if (!isAdmin()) {
        return <Navigate to="/" replace />
    }

    return children
}
