// Google Analytics 4 - Ecommerce Event Helpers
// Documentación: https://developers.google.com/analytics/devguides/collection/ga4/ecommerce

const gtag = (...args) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag(...args)
    }
}

// Vista de producto
export function ga4ViewItem(product) {
    gtag('event', 'view_item', {
        currency: 'ARS',
        value: product?.base_price || product?.price || 0,
        items: [{
            item_id: product?.id,
            item_name: product?.name,
            item_category: product?.category,
            price: product?.base_price || product?.price || 0,
            quantity: 1
        }]
    })
}

// Agregar al carrito
export function ga4AddToCart(product, quantity = 1) {
    const price = product?.base_price || product?.price || 0
    gtag('event', 'add_to_cart', {
        currency: 'ARS',
        value: price * quantity,
        items: [{
            item_id: product?.id,
            item_name: product?.name,
            item_category: product?.category,
            price,
            quantity
        }]
    })
}

// Inicio de checkout
export function ga4BeginCheckout(cartItems = [], cartTotal = 0) {
    gtag('event', 'begin_checkout', {
        currency: 'ARS',
        value: cartTotal,
        items: cartItems.map(item => ({
            item_id: item?.id,
            item_name: item?.name,
            item_category: item?.category,
            price: item?.price || item?.base_price || 0,
            quantity: item?.quantity || 1
        }))
    })
}

// Registro de new user
export function ga4SignUp(method = 'checkout') {
    gtag('event', 'sign_up', { method })
}
