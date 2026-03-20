import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Importar rutas
import facebookRoutes from './routes/facebook.js';
import authRoutes from './routes/auth.js';
import ordersRoutes from './routes/orders.js';

// Configuración
dotenv.config({ override: true });
console.log('ENV LOADED: PORT=' + (process.env.PORT || 'undefined'));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

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

// Registrar rutas de Facebook
app.use('/api/facebook', facebookRoutes);

// Registrar rutas de autenticación
app.use('/api/auth', authRoutes);

// Registrar rutas de pedidos
app.use('/api/orders', ordersRoutes);

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
