import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Tarifas por defecto si la tabla no existe aún
const DEFAULT_RATES = [
    { id: 1, label: 'Hasta 1 kg',      min_g: 0,    max_g: 1000,  price: 5500 },
    { id: 2, label: '1 kg a 3 kg',     min_g: 1001, max_g: 3000,  price: 7200 },
    { id: 3, label: '3 kg a 5 kg',     min_g: 3001, max_g: 5000,  price: 9000 },
    { id: 4, label: '5 kg a 10 kg',    min_g: 5001, max_g: 10000, price: 12500 },
    { id: 5, label: '10 kg a 20 kg',   min_g: 10001,max_g: 20000, price: 18000 },
    { id: 6, label: 'Más de 20 kg',    min_g: 20001,max_g: 99999, price: 28000 },
];

// GET /api/via-cargo/tarifas → devuelve rangos de via_cargo_rates
router.get('/tarifas', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('via_cargo_rates')
            .select('*')
            .order('min_g', { ascending: true });
        
        if (error) {
            // Tabla no existe o error de permisos → devolver defaults
            console.warn('[via-cargo] Tabla no disponible, usando defaults:', error.message);
            return res.json(DEFAULT_RATES);
        }

        // Si la tabla existe pero está vacía, devolver defaults
        res.json(data && data.length > 0 ? data : DEFAULT_RATES);
    } catch (error) {
        console.error('[via-cargo] Error inesperado:', error.message);
        res.json(DEFAULT_RATES);
    }
});

// PUT /api/via-cargo/tarifas/:id → actualiza precio de un rango (solo admin)
router.put('/tarifas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { price } = req.body;
        
        const { data, error } = await supabase
            .from('via_cargo_rates')
            .update({ price })
            .eq('id', id)
            .select()
            .single();
            
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
