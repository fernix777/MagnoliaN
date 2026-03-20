import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Analytics } from '@vercel/analytics/react';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { trackPageView } from './services/facebookService';

// Páginas públicas
import StorePage from './pages/customer/StorePage';
import ProductDetail from './pages/customer/ProductDetail';
import CategoryPage from './pages/customer/CategoryPage';
import ProductsPage from './pages/customer/ProductsPage';
import CategoriesPage from './pages/customer/CategoriesPage';
import ContactPage from './pages/customer/ContactPage';
import SearchPage from './pages/customer/SearchPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import OrderConfirmation from './pages/customer/OrderConfirmation';
import MyAccount from './pages/customer/MyAccount';
import MyOrders from './pages/customer/MyOrders';

// Páginas de autenticación
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import RegistrationSuccess from './pages/auth/RegistrationSuccess';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Páginas admin
import AdminLogin from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Categories from './pages/admin/Categories';
import Products from './pages/admin/Products';
import Orders from './pages/admin/Orders';
import ProductForm from './pages/admin/ProductForm';
import AdminBanners from './pages/admin/AdminBanners';
import AdminCustomers from './pages/admin/AdminCustomers';
import PerformanceAuditor from './components/common/PerformanceAuditor';

// Componente para tracking automático de PageView
function PageViewTracker() {
    const location = useLocation();
    
    useEffect(() => {
        trackPageView();
    }, [location]);
    
    return null; // No renderiza nada, solo tracking
}

// Componente para redirigir usuarios autenticados
function RedirectIfAuth({ children }) {
    const { user, isAdmin } = useAuth();
    
    if (user) {
        if (isAdmin()) {
            return <Navigate to="/admin/dashboard" replace />;
        }
        return <Navigate to="/" replace />;
    }
    
    return children;
}

function App() {
    return (
        <HelmetProvider>
            <AuthProvider>
                <CartProvider>
                    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                        <PageViewTracker />
                        <Routes>
                            {/* Rutas públicas */}
                            <Route path="/" element={<StorePage />} />
                            <Route path="/productos" element={<ProductsPage />} />
                            <Route path="/categorias" element={<CategoriesPage />} />
                            <Route path="/producto/:slug" element={<ProductDetail />} />
                            <Route path="/categoria/:slug" element={<CategoryPage />} />
                            <Route path="/buscar" element={<SearchPage />} />
                            <Route path="/contacto" element={<ContactPage />} />
                            <Route path="/checkout" element={<CheckoutPage />} />
                            <Route path="/order-confirmation" element={<OrderConfirmation />} />
                            
                            {/* Rutas de usuario autenticado */}
                            <Route path="/mi-cuenta" element={
                                <ProtectedRoute requireAdmin={false}>
                                    <MyAccount />
                                </ProtectedRoute>
                            } />
                            <Route path="/mis-pedidos" element={
                                <ProtectedRoute requireAdmin={false}>
                                    <MyOrders />
                                </ProtectedRoute>
                            } />

                            {/* Rutas de autenticación de administradores */}
                            <Route path="/admin/login" element={
                                <RedirectIfAuth>
                                    <AdminLogin />
                                </RedirectIfAuth>
                            } />

                            {/* Rutas de autenticación de usuarios */}
                            <Route path="/login" element={
                                <RedirectIfAuth>
                                    <Login />
                                </RedirectIfAuth>
                            } />
                            <Route path="/registro-exitoso" element={
                                <RegistrationSuccess />
                            } />
                            <Route path="/recuperar-contrasena" element={
                                <ForgotPassword />
                            } />
                            <Route path="/actualizar-contrasena" element={
                                <ResetPassword />
                            } />

                            {/* Rutas protegidas de admin */}
                            <Route
                                path="/admin/dashboard"
                                element={
                                    <ProtectedRoute>
                                        <Dashboard />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/categories"
                                element={
                                    <ProtectedRoute>
                                        <Categories />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/products"
                                element={
                                    <ProtectedRoute>
                                        <Products />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/orders"
                                element={
                                    <ProtectedRoute>
                                        <Orders />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/banners"
                                element={
                                    <ProtectedRoute>
                                        <AdminBanners />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/customers"
                                element={
                                    <ProtectedRoute>
                                        <AdminCustomers />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/products/new"
                                element={
                                    <ProtectedRoute>
                                        <ProductForm />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/products/edit/:id"
                                element={
                                    <ProtectedRoute>
                                        <ProductForm />
                                    </ProtectedRoute>
                                }
                            />
                        </Routes>
                    </Router>
                </CartProvider>
            </AuthProvider>
            <Analytics />
            <PerformanceAuditor />
        </HelmetProvider>
    )
}

export default App
