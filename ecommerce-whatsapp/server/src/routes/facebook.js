import express from 'express';
import {
    trackServerViewContent,
    trackServerAddToCart,
    trackServerInitiateCheckout,
    trackServerPurchase,
    trackServerCompleteRegistration,
    trackServerPageView
} from '../services/facebookCAPI.js';

const router = express.Router();

// Endpoint para rastrear pageview
router.post('/track-pageview', async (req, res) => {
    try {
        const { user, eventSourceUrl } = req.body;
        const result = await trackServerPageView(user, eventSourceUrl);
        res.json({ success: !!result, data: result });
    } catch (error) {
        console.error('Error tracking pageview:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint para rastrear visualización de producto
router.post('/track-view', async (req, res) => {
    try {
        const { product, user, eventSourceUrl } = req.body;
        const result = await trackServerViewContent(product, user, eventSourceUrl);
        res.json({ success: !!result, data: result });
    } catch (error) {
        console.error('Error tracking view:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint para rastrear agregar al carrito
router.post('/track-add-to-cart', async (req, res) => {
    try {
        const { product, quantity, user, eventSourceUrl } = req.body;
        const result = await trackServerAddToCart(product, quantity, user, eventSourceUrl);
        res.json({ success: !!result, data: result });
    } catch (error) {
        console.error('Error tracking add to cart:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint para rastrear checkout
router.post('/track-checkout', async (req, res) => {
    try {
        const { cartTotal, itemsCount, user, eventSourceUrl } = req.body;
        const result = await trackServerInitiateCheckout(cartTotal, itemsCount, user, eventSourceUrl);
        res.json({ success: !!result, data: result });
    } catch (error) {
        console.error('Error tracking checkout:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint para rastrear compra
router.post('/track-purchase', async (req, res) => {
    try {
        const { order, eventSourceUrl } = req.body;
        const result = await trackServerPurchase(order, eventSourceUrl);
        res.json({ success: !!result, data: result });
    } catch (error) {
        console.error('Error tracking purchase:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint para rastrear registro
router.post('/track-registration', async (req, res) => {
    try {
        const { user, eventSourceUrl } = req.body;
        const result = await trackServerCompleteRegistration(user, eventSourceUrl);
        res.json({ success: !!result, data: result });
    } catch (error) {
        console.error('Error tracking registration:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
