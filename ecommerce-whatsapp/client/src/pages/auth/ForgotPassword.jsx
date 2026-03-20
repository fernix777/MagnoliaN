import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import './Auth.css';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            return setError('Por favor ingresa tu correo electrónico');
        }

        try {
            setError('');
            setSuccess('');
            setLoading(true);

            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/actualizar-contrasena`,
            });

            if (resetError) {
                throw resetError;
            }

            setSuccess('Se ha enviado un enlace a tu correo para restablecer tu contraseña. Por favor revisa tu bandeja de entrada (y spam).');
            setEmail('');
        } catch (error) {
            console.error('Error al enviar correo de recuperación:', error);
            
            // Manejar errores específicos de Supabase
            if (error.message?.includes('User not found') || error.message?.includes('no registered')) {
                setError('Este correo electrónico no está registrado en nuestra tienda.');
            } else if (error.message?.includes('rate limit')) {
                setError('Demasiados intentos. Por favor espera unos minutos antes de volver a intentar.');
            } else {
                setError(error.message || 'Error al enviar el correo de recuperación. Intenta de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Recuperar Contraseña</h2>
                
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                {!success ? (
                    <>
                        <p className="auth-description">
                            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                        </p>

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

                            <button
                                type="submit"
                                className="btn btn-primary btn-block"
                                disabled={loading}
                            >
                                {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="success-info">
                        <div className="success-icon">📧</div>
                        <p>Revisa tu correo electrónico</p>
                    </div>
                )}

                <div className="auth-footer">
                    <p>
                        ¿Recordaste tu contraseña?{' '}
                        <Link to="/login" className="auth-link">
                            Inicia sesión aquí
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
