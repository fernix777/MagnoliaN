import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5174,
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            }
        }
    },
    build: {
        // Reducir tamaño de chunks para menor cache egress
        chunkSizeWarningLimit: 500,
        rollupOptions: {
            output: {
                manualChunks: {
                    // Separar librerías grandes en chunks propios
                    'vendor': ['react', 'react-dom', 'react-router-dom'],
                    'react-libs': ['react-dropzone', 'react-helmet-async', 'react-hot-toast', 'react-icons'],
                    'supabase': ['@supabase/supabase-js'],
                    'vercel': ['@vercel/analytics', '@vercel/blob']
                }
            }
        },
        // Minificar más agresivamente
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true
            }
        }
    }
})
