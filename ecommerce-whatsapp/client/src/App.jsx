import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/common/ProtectedRoute'

// Páginas públicas
import StorePage from './pages/customer/StorePage'
import ProductDetail from './pages/customer/ProductDetail'
import CategoryPage from './pages/customer/CategoryPage'
import ProductsPage from './pages/customer/ProductsPage'
import CategoriesPage from './pages/customer/CategoriesPage'
import ContactPage from './pages/customer/ContactPage'

// Páginas admin
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import Categories from './pages/admin/Categories'
import Products from './pages/admin/Products'
import ProductForm from './pages/admin/ProductForm'

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Rutas públicas */}
                    <Route path="/" element={<StorePage />} />
                    <Route path="/productos" element={<ProductsPage />} />
                    <Route path="/categorias" element={<CategoriesPage />} />
                    <Route path="/producto/:slug" element={<ProductDetail />} />
                    <Route path="/categoria/:slug" element={<CategoryPage />} />
                    <Route path="/contacto" element={<ContactPage />} />

                    {/* Rutas de autenticación */}
                    <Route path="/admin/login" element={<Login />} />

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
        </AuthProvider>
    )
}

export default App
