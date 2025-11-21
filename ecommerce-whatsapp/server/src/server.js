import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas de prueba
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'E-commerce WhatsApp API is running',
        timestamp: new Date().toISOString()
    });
});

// Importar rutas (se agregarán después)
// import authRoutes from './routes/authRoutes.js';
// import productRoutes from './routes/productRoutes.js';
// import categoryRoutes from './routes/categoryRoutes.js';
// import shippingRoutes from './routes/shippingRoutes.js';
// import settingsRoutes from './routes/settingsRoutes.js';

// Usar rutas
// app.use('/api/auth', authRoutes);
// app.use('/api/products', productRoutes);
// app.use('/api/categories', categoryRoutes);
// app.use('/api/shipping', shippingRoutes);
// app.use('/api/settings', settingsRoutes);

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            status: err.status || 500
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: {
            message: 'Route not found',
            status: 404
        }
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📦 API available at http://localhost:${PORT}/api`);
});

export default app;
