import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Login.css'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const { signIn } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const { data, error } = await signIn(email, password)

        if (error) {
            setError(error.message || 'Error al iniciar sesión')
            setLoading(false)
            return
        }

        // Verificar que sea admin
        if (data.user?.user_metadata?.role !== 'admin') {
            setError('No tienes permisos de administrador')
            setLoading(false)
            return
        }

        // Redirigir al dashboard
        navigate('/admin/dashboard')
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <img src="/logo.jpg" alt="Magnolia Novedades" className="login-logo" />
                    <h1>Panel de Administración</h1>
                    <p>Magnolia Novedades</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@magnolia.com"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary login-button"
                        disabled={loading}
                    >
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className="login-footer">
                    <a href="/">← Volver a la tienda</a>
                </div>
            </div>
        </div>
    )
}
