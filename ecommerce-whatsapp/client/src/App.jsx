import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Páginas públicas
import StorePage from './pages/customer/StorePage';
import ProductDetail from './pages/customer/ProductDetail';
import CategoryPage from './pages/customer/CategoryPage';
import ProductsPage from './pages/customer/ProductsPage';
import CategoriesPage from './pages/customer/CategoriesPage';
import ContactPage from './pages/customer/ContactPage';
import SearchPage from './pages/customer/SearchPage';

// Páginas de autenticación
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import RegistrationSuccess from './pages/auth/RegistrationSuccess';

// Páginas admin
import AdminLogin from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Categories from './pages/admin/Categories';
import Products from './pages/admin/Products';
import ProductForm from './pages/admin/ProductForm';

// Componente para redirigir usuarios autenticados
function RedirectIfAuth({ children }) {
    const { user } = useAuth();
    return user ? <Navigate to="/" replace /> : children;
}

function App() {
    return (
        <HelmetProvider>
            <AuthProvider>
                <CartProvider>
                    <Router>
                        <Routes>
                            {/* Rutas públicas */}
                            <Route path="/" element={<StorePage />} />
                            <Route path="/productos" element={<ProductsPage />} />
                            <Route path="/categorias" element={<CategoriesPage />} />
                            <Route path="/producto/:slug" element={<ProductDetail />} />
                            <Route path="/categoria/:slug" element={<CategoryPage />} />
                            <Route path="/buscar" element={<SearchPage />} />
                            <Route path="/contacto" element={<ContactPage />} />

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
                            <Route path="/registro" element={
                                <RedirectIfAuth>
                                    <Register />
                                </RedirectIfAuth>
                            } />
                            <Route path="/registro-exitoso" element={
                                <RegistrationSuccess />
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
        </HelmetProvider>
    )
}

export default App
