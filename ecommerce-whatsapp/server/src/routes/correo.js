import express from 'express';
import axios from 'axios';
import { supabase } from '../config/supabase.js';

const router = express.Router();

const getAuthToken = async () => {
    const user = process.env.CORREO_USER;
    const password = process.env.CORREO_PASSWORD;
    const baseUrl = process.env.CORREO_API_URL || 'https://api.correoargentino.com.ar/micorreo/v1';
    
    const res = await axios.post(`${baseUrl}/token`, {}, {
        headers: {
            'Authorization': 'Basic ' + Buffer.from(`${user}:${password}`).toString('base64')
        }
    });
    return { token: res.data.token, baseUrl };
};

// POST /api/correo/cotizar → llama a /rates de la API
router.post('/cotizar', async (req, res) => {
    try {
        const { customerId, postalCodeDestination, deliveredType, dimensions } = req.body;
        
        const { token, baseUrl } = await getAuthToken();
        
        const payload = {
            customerId: customerId || process.env.CORREO_CUSTOMER_ID,
            postalCodeOrigin: process.env.CORREO_POSTAL_CODE_ORIGIN || '1000',
            postalCodeDestination,
            deliveredType: deliveredType || 'D',
            dimensions
        };
        
        const response = await axios.post(`${baseUrl}/rates`, payload, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('Error in cotizar:', error.response?.data || error.message);
        res.status(500).json({ error: 'Error al cotizar envío' });
    }
});

// POST /api/correo/registrar → llama a /shipping/import
router.post('/registrar', async (req, res) => {
    try {
        const { token, baseUrl } = await getAuthToken();
        // Here we'd pass the full payload for importing a shipment
        const response = await axios.post(`${baseUrl}/shipping/import`, req.body, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('Error in registrar:', error.response?.data || error.message);
        res.status(500).json({ error: 'Error al registrar envío' });
    }
});

// GET /api/correo/tracking/:id → llama a /shipping/tracking
router.get('/tracking/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const customerId = process.env.CORREO_CUSTOMER_ID;
        const { token, baseUrl } = await getAuthToken();
        
        const response = await axios.get(`${baseUrl}/shipping/tracking`, {
            params: { customerId, shippingId: id },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('Error in tracking:', error.response?.data || error.message);
        res.status(500).json({ error: 'Error al obtener tracking' });
    }
});

// POST /api/correo/etiqueta/:orderId → genera PDF de etiqueta
router.post('/etiqueta/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        // Generate a URL for the label print view
        const labelUrl = `/api/correo/etiqueta/view/${orderId}`;
        
        await supabase
            .from('orders')
            .update({ shipping_label_url: labelUrl })
            .eq('id', orderId);
            
        res.json({ url: labelUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/correo/etiqueta/view/:orderId -> Muestra la etiqueta para imprimir
router.get('/etiqueta/view/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { data: order } = await supabase.from('orders').select('*, items:order_items(*)').eq('id', orderId).single();
        if (!order) return res.status(404).send('Order not found');
        
        // Simple HTML label for printing
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                .label { border: 2px solid #000; width: 10cm; height: 15cm; padding: 20px; box-sizing: border-box; }
                h1 { font-size: 24px; text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-top:0; }
                .tracking { font-size: 32px; text-align: center; font-weight: bold; margin: 20px 0; }
                .info { font-size: 14px; line-height: 1.5; }
                .sender { border-top: 1px solid #000; margin-top: 20px; padding-top: 10px; font-size: 12px; }
                @media print {
                    body { margin: 0; padding: 0; }
                    .label { border: none; width: 100%; height: 100%; }
                }
            </style>
        </head>
        <body onload="window.print()">
            <div class="label">
                <h1>CORREO ARGENTINO</h1>
                <div class="tracking">\${order.tracking_number || 'TRK-' + orderId.substring(0, 8).toUpperCase()}</div>
                <div class="info">
                    <strong>Destinatario:</strong><br>
                    \${order.customer_name}<br>
                    \${order.customer_phone}<br>
                    <strong>ID Orden:</strong> \${orderId}
                </div>
                <div class="sender">
                    <strong>Remitente:</strong><br>
                    Magnolia-N<br>
                    Depósito CABA - CP 1000
                </div>
            </div>
        </body>
        </html>`;
        res.send(html);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

export default router;
