import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setError('');
            setLoading(true);
            const { error: signInError } = await signIn(email, password);
            
            if (signInError) {
                throw signInError;
            }
            
            navigate(from, { replace: true });
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            
            // Manejar errores específicos de Supabase
            if (error.message?.includes('Invalid login credentials') || error.message?.includes('invalid')) {
                setError('Correo electrónico o contraseña incorrectos. Por favor verifica tus datos.');
            } else if (error.message?.includes('Email not confirmed') || error.message?.includes('confirm')) {
                setError('Tu correo electrónico no ha sido confirmado. Revisa tu bandeja de entrada.');
            } else if (error.message?.includes('rate limit')) {
                setError('Demasiados intentos fallidos. Por favor espera unos minutos antes de volver a intentar.');
            } else if (error.message?.includes('User not found')) {
                setError('No existe una cuenta con este correo electrónico.');
            } else {
                setError(error.message || 'Error al iniciar sesión. Verifica tus credenciales.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Iniciar Sesión</h2>
                {error && <div className="error-message">{error}</div>}
                
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Correo Electrónico</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="tu@email.com"
                            autoComplete="email"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="password">Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            autoComplete="current-password"
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        className="btn btn-primary btn-block"
                        disabled={loading}
                    >
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>
                
                <div className="auth-footer">
                    <p>
                        Para crear una cuenta añade productos al carrito y consíguela gratis al finalizar tu compra.
                    </p>
                    <Link to="/recuperar-contrasena" className="auth-link">
                        ¿Olvidaste tu contraseña?
                    </Link>
                </div>
            </div>
        </div>
    );
}
