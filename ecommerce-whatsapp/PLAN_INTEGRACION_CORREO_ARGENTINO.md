# 📦 Plan de Integración - API Correo Argentino para Magnolia-N

## 🎯 **Objetivo**
Integrar la API de Correo Argentino (PAQ.AR) en el ecommerce de Magnolia-N para automatizar cotizaciones, generación de etiquetas y seguimiento de envíos.

---

## 📋 **Resumen de Investigación API**

### **Endpoints Principales Disponibles**
- **Registro de Usuario** (`register`) - Crear cuenta en plataforma
- **Validación de Usuario** (`users/validate`) - Obtener CustomerId
- **Cotización de Envíos** (`rates`) - Calcular costos de envío
- **Consulta de Agencias** (`agencies`) - Listar sucursales

### **URLs de API**
- **Testing**: `https://apitest.correoargentino.com.ar/micorreo/v1`
- **Producción**: `https://api.correoargentino.com.ar/micorreo/v1`

### **Requisitos Previos**
1. Solicitar credenciales a través del formulario oficial
2. Obtener token de acceso
3. Registrar usuario en la plataforma
4. Obtener CustomerId para operaciones

---

## 🏗️ **Plan de Integración por Fases**

### **FASE 1: Configuración Inicial (1-2 días)**

#### **1.1 Obtención de Credenciales**
- [ ] Completar formulario de solicitud en Correo Argentino
- [ ] Recibir token de acceso API
- [ ] Configurar variables de entorno en el proyecto

#### **1.2 Configuración del Proyecto**
- [ ] Instalar cliente API de Correo Argentino
- [ ] Crear archivo de configuración `.env` para credenciales
- [ ] Configurar URLs según ambiente (test/prod)

#### **1.3 Estructura de Archivos**
```
server/src/services/
├── correoArgentinoService.js    # Servicio principal
├── correoConfig.js             # Configuración
└── correoTypes.js              # Tipos y enums

client/src/components/
├── shipping/                   # Componentes de envío
│   ├── ShippingCalculator.jsx   # Calculador de costos
│   ├── AgencySelector.jsx      # Selector de agencias
│   └── ShippingLabel.jsx       # Generador de etiquetas
```

---

### **FASE 1.5: Gestión de Dimensiones de Productos (2-3 días)**

#### **1.5.1 Análisis de Productos Existentes**
- [ ] Exportar catálogo actual de productos (100+ artículos)
- [ ] Clasificar productos por tipo/forma:
  - **Pequeños**: Accesorios LED, baterías, cables
  - **Medianos**: Lámparas, focos pequeños, decoración
  - **Grandes**: Guirnaldas largas, paneles LED
  - **Irregulares**: Kits, combos, productos con formas especiales

#### **1.5.2 Estrategia de Dimensiones**
```javascript
// Categorización por tipo de producto
const PRODUCT_DIMENSIONS = {
  // Cotillón LED Pequeño
  'led_small': {
    weight: 50,      // gramos
    height: 5,       // cm
    width: 8,        // cm
    length: 12,       // cm
    packaging: 'sobre'
  },
  // Focos LED Medianos
  'led_bulb': {
    weight: 120,     // gramos
    height: 10,      // cm
    width: 8,        // cm
    length: 8,       // cm
    packaging: 'caja_individual'
  },
  // Guirnaldas Largas
  'garland_long': {
    weight: 400,     // gramos
    height: 15,      // cm
    width: 15,       // cm
    length: 100,     // cm
    packaging: 'caja_larga'
  },
  // Kits/Combos
  'kit_combo': {
    weight: 800,     // gramos
    height: 20,      // cm
    width: 25,       // cm
    length: 30,      // cm
    packaging: 'caja_grande'
  }
};
```

#### **1.5.3 Modificación a Tabla de Productos**
```sql
-- Agregar dimensiones a productos existentes
ALTER TABLE products ADD COLUMN IF NOT EXISTS 
    package_weight DECIMAL(8,2),       -- Peso en gramos
    package_height DECIMAL(6,2),        -- Altura en cm
    package_width DECIMAL(6,2),         -- Ancho en cm
    package_length DECIMAL(6,2),        -- Largo en cm
    package_type VARCHAR(50),            -- Tipo de empaque
    shipping_category VARCHAR(50),        -- Categoría de envío
    requires_special_packaging BOOLEAN DEFAULT FALSE,
    fragile BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT NOW();

-- Nueva tabla de dimensiones predefinidas
CREATE TABLE shipping_dimensions_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    weight_min DECIMAL(8,2),
    weight_max DECIMAL(8,2),
    height DECIMAL(6,2),
    width DECIMAL(6,2),
    length DECIMAL(6,2),
    packaging_type VARCHAR(50),
    correo_product_type VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### **1.5.4 Herramienta de Migración**
```javascript
// scripts/migrateProductDimensions.js
const migrateProductDimensions = async () => {
  const products = await getAllProducts();
  
  for (const product of products) {
    // Asignar dimensiones según categoría
    const dimensions = assignDimensions(product);
    
    // Actualizar producto
    await updateProduct(product.id, {
      package_weight: dimensions.weight,
      package_height: dimensions.height,
      package_width: dimensions.width,
      package_length: dimensions.length,
      package_type: dimensions.packaging,
      shipping_category: dimensions.category,
      requires_special_packaging: dimensions.special,
      fragile: dimensions.fragile
    });
  }
  
  console.log(`Migrados ${products.length} productos con dimensiones`);
};
```

#### **1.5.5 Cálculo de Volumen y Peso Real**
```javascript
// server/src/services/shippingCalculator.js
class ShippingCalculator {
  calculatePackageDimensions(items) {
    let totalWeight = 0;
    let totalVolume = 0;
    let maxDimensions = { height: 0, width: 0, length: 0 };
    
    items.forEach(item => {
      const product = item.product;
      const quantity = item.quantity;
      
      // Sumar pesos
      totalWeight += (product.package_weight || 100) * quantity;
      
      // Calcular volumen individual
      const itemVolume = (product.package_height || 10) * 
                       (product.package_width || 10) * 
                       (product.package_length || 10) * quantity;
      totalVolume += itemVolume;
      
      // Actualizar dimensiones máximas
      maxDimensions.height = Math.max(maxDimensions.height, product.package_height || 10);
      maxDimensions.width = Math.max(maxDimensions.width, product.package_width || 10);
      maxDimensions.length = Math.max(maxDimensions.length, product.package_length || 10);
    });
    
    return {
      weight: Math.round(totalWeight),
      height: maxDimensions.height,
      width: maxDimensions.width,
      length: maxDimensions.length,
      volume: totalVolume,
      packagingType: this.determinePackagingType(totalVolume, totalWeight)
    };
  }
  
  determinePackagingType(volume, weight) {
    if (weight < 200 && volume < 1000) return 'sobre';
    if (weight < 1000 && volume < 5000) return 'caja_pequeña';
    if (weight < 2000 && volume < 15000) return 'caja_mediana';
    return 'caja_grande';
  }
}
```

---

### **FASE 2: Base de Datos (2-3 días)**

#### **2.1 Nuevas Tablas**
```sql
-- Configuración de Correo Argentino
CREATE TABLE correo_argentino_config (
    id SERIAL PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    api_token VARCHAR(500) NOT NULL,
    environment VARCHAR(20) DEFAULT 'test',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Envíos generados
CREATE TABLE shipments (
    id SERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(id),
    tracking_number VARCHAR(100),
    correo_customer_id VARCHAR(50),
    origin_postal_code VARCHAR(10),
    destination_postal_code VARCHAR(10),
    shipping_cost DECIMAL(10,2),
    shipping_method VARCHAR(50),
    label_url TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Cotizaciones de envío
CREATE TABLE shipping_quotes (
    id SERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(id),
    postal_code_origin VARCHAR(10),
    postal_code_destination VARCHAR(10),
    weight DECIMAL(8,2),
    dimensions JSONB,
    quote_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Agencias de Correo Argentino
CREATE TABLE correo_agencies (
    id SERIAL PRIMARY KEY,
    agency_id VARCHAR(50) UNIQUE,
    name VARCHAR(200),
    address TEXT,
    postal_code VARCHAR(10),
    province VARCHAR(100),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    last_updated TIMESTAMP DEFAULT NOW()
);
```

#### **2.2 Modificaciones a Tablas Existentes**
```sql
-- Agregar datos de envío a orders
ALTER TABLE orders ADD COLUMN shipping_data JSONB;
ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN shipping_cost DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN shipping_method VARCHAR(50);
```

---

### **FASE 3: Servicios Backend (3-4 días)**

#### **3.1 Servicio Principal con Gestión de Dimensiones**
```javascript
// server/src/services/correoArgentinoService.js
class CorreoArgentinoService {
    constructor() {
        this.api = new CorreoArgentinoAPI({
            token: process.env.CORREO_ARGENTINO_TOKEN,
            environment: process.env.NODE_ENV
        });
        this.customerId = null;
        this.shippingCalculator = new ShippingCalculator();
    }

    // Inicialización y autenticación
    async initialize() {
        this.customerId = await this.getCustomerId();
    }

    // Obtener CustomerId
    async getCustomerId() {
        // Implementar lógica de cache
        // Validar credenciales y obtener ID
    }

    // Cotizar envío con dimensiones de productos reales
    async quoteShipping(orderId, postalCodeDestination) {
        // Obtener items de la orden con dimensiones
        const orderItems = await this.getOrderItems(orderId);
        
        // Calcular dimensiones del paquete
        const packageDimensions = this.shippingCalculator.calculatePackageDimensions(orderItems);
        
        // Preparar para API de Correo Argentino
        const params = {
            customerId: this.customerId,
            postalCodeOrigin: "4600", // Origen Magnolia-N Jujuy
            postalCodeDestination: postalCodeDestination,
            deliveredType: DeliveredType.D,
            dimensions: [{
                weight: packageDimensions.weight,
                height: packageDimensions.height,
                width: packageDimensions.width,
                length: packageDimensions.length,
                quantity: 1
            }]
        };
        
        // Cotizar con API
        const quote = await this.api.getRates(params);
        
        // Guardar cotización en BD
        await this.saveShippingQuote({
            orderId,
            postalCodeOrigin: "4600",
            postalCodeDestination,
            weight: packageDimensions.weight,
            dimensions: packageDimensions,
            quoteData: quote
        });
        
        return {
            ...quote,
            calculatedDimensions: packageDimensions,
            packagingType: packageDimensions.packagingType
        };
    }

    // Crear envío con dimensiones optimizadas
    async createShipment(orderId) {
        // Obtener datos completos de la orden
        const order = await this.getOrderWithDimensions(orderId);
        const packageDimensions = this.shippingCalculator.calculatePackageDimensions(order.items);
        
        // Validar dimensiones máximas de Correo Argentino
        if (packageDimensions.weight > 30000) { // 30kg máximo
            throw new Error('Paquete excede peso máximo permitido por Correo Argentino');
        }
        
        if (packageDimensions.length > 100 || packageDimensions.width > 100 || packageDimensions.height > 100) {
            throw new Error('Paquete excede dimensiones máximas permitidas');
        }
        
        // Crear envío en API
        const shipmentData = {
            customerId: this.customerId,
            postalCodeOrigin: "4600",
            postalCodeDestination: order.shipping_address.postal_code,
            dimensions: [{
                weight: packageDimensions.weight,
                height: packageDimensions.height,
                width: packageDimensions.width,
                length: packageDimensions.length,
                quantity: 1
            }],
            // Datos del destinatario
            receiver: {
                name: order.customer_name,
                email: order.customer_email,
                phone: order.customer_phone,
                address: {
                    streetName: order.shipping_address.street,
                    streetNumber: order.shipping_address.number,
                    locality: order.shipping_address.locality,
                    city: order.shipping_address.city,
                    province: order.shipping_address.province,
                    postalCode: order.shipping_address.postal_code
                }
            }
        };
        
        const shipment = await this.api.createShipment(shipmentData);
        
        // Guardar en BD
        await this.saveShipment({
            orderId,
            trackingNumber: shipment.trackingNumber,
            correoCustomerId: this.customerId,
            originPostalCode: "4600",
            destinationPostalCode: order.shipping_address.postal_code,
            shippingCost: shipment.cost,
            shippingMethod: shipment.method,
            labelUrl: shipment.labelUrl,
            status: 'created',
            dimensions: packageDimensions
        });
        
        return shipment;
    }

    // Obtener agencias
    async getAgencies(province) {
        // Listar agencias por provincia
        // Actualizar cache local
    }

    // Consultar estado de envío
    async trackShipment(trackingNumber) {
        // Consultar estado actual
        // Actualizar BD local
    }
}
```

#### **3.2 Endpoints API**
```javascript
// server/src/routes/shipping.js

// POST /api/shipping/quote
// Cotizar envío para carrito
router.post('/quote', async (req, res) => {
    // Validar datos de entrada
    // Llamar a servicio de cotización
    // Retornar opciones y costos
});

// POST /api/shipping/create
// Crear envío para orden
router.post('/create', async (req, res) => {
    // Validar orden existente
    // Crear envío en Correo Argentino
    // Generar etiqueta PDF
    // Retornar tracking number
});

// GET /api/shipping/track/:trackingNumber
// Consultar estado de envío
router.get('/track/:trackingNumber', async (req, res) => {
    // Consultar estado en API
    // Retornar información actualizada
});

// GET /api/shipping/agencies
// Listar agencias disponibles
router.get('/agencies', async (req, res) => {
    // Listar agencias por provincia
    // Retornar con coordenadas para mapa
});
```

---

### **FASE 4: Interfaz de Usuario (3-4 días)**

#### **4.1 Calculador de Envío con Dimensiones Reales**
```jsx
// client/src/components/customer/ShippingCalculator.jsx
const ShippingCalculator = ({ cartItems, onShippingSelect }) => {
    const [postalCode, setPostalCode] = useState('');
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [packageInfo, setPackageInfo] = useState(null);

    const calculateShipping = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/shipping/quote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    postalCodeDestination: postalCode,
                    items: cartItems.map(item => ({
                        id: item.id,
                        quantity: item.quantity,
                        // Usar dimensiones reales del producto
                        dimensions: {
                            weight: item.product.package_weight,
                            height: item.product.package_height,
                            width: item.product.package_width,
                            length: item.product.package_length
                        }
                    }))
                })
            });
            const data = await response.json();
            setQuotes(data.quotes);
            setPackageInfo(data.calculatedDimensions);
        } catch (error) {
            console.error('Error calculating shipping:', error);
        }
        setLoading(false);
    };

    return (
        <div className="shipping-calculator">
            <h3>Calcular Envío</h3>
            <input
                type="text"
                placeholder="Código Postal"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
            />
            <button onClick={calculateShipping} disabled={loading}>
                {loading ? 'Calculando...' : 'Calcular Costo'}
            </button>
            
            {packageInfo && (
                <div className="package-info">
                    <h4>📦 Información del Paquete</h4>
                    <p><strong>Peso:</strong> {packageInfo.weight}g</p>
                    <p><strong>Dimensiones:</strong> {packageInfo.height}×{packageInfo.width}×{packageInfo.length}cm</p>
                    <p><strong>Empaque:</strong> {packageInfo.packagingType}</p>
                    <p><strong>Volumen:</strong> {packageInfo.volume}cm³</p>
                </div>
            )}
            
            {quotes.map((quote, index) => (
                <div key={index} className="shipping-option">
                    <h4>{quote.method}</h4>
                    <p>Costo: ${quote.cost}</p>
                    <p>Entrega: {quote.deliveryTime}</p>
                    <button onClick={() => onShippingSelect(quote)}>
                        Seleccionar esta opción
                    </button>
                </div>
            ))}
        </div>
    );
};
```

#### **4.2 Gestor de Dimensiones de Productos (Admin)**
```jsx
// client/src/components/admin/ProductDimensionsManager.jsx
const ProductDimensionsManager = () => {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [templates, setTemplates] = useState([]);

    useEffect(() => {
        loadProducts();
        loadTemplates();
    }, []);

    const loadProducts = async () => {
        const response = await fetch('/api/products/with-dimensions');
        const data = await response.json();
        setProducts(data);
    };

    const loadTemplates = async () => {
        const response = await fetch('/api/shipping/dimension-templates');
        const data = await response.json();
        setTemplates(data);
    };

    const applyTemplate = (templateId) => {
        const template = templates.find(t => t.id === templateId);
        if (selectedProduct && template) {
            setSelectedProduct({
                ...selectedProduct,
                package_weight: template.weight,
                package_height: template.height,
                package_width: template.width,
                package_length: template.length,
                package_type: template.packaging_type,
                shipping_category: template.correo_product_type
            });
        }
    };

    const saveDimensions = async () => {
        await fetch(`/api/products/${selectedProduct.id}/dimensions`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(selectedProduct)
        });
        
        // Actualizar lista
        loadProducts();
        alert('Dimensiones guardadas exitosamente');
    };

    return (
        <div className="dimensions-manager">
            <h2>Gestión de Dimensiones de Productos</h2>
            
            <div className="product-list">
                <h3>Productos ({products.length})</h3>
                <div className="product-grid">
                    {products.map(product => (
                        <div key={product.id} className="product-card">
                            <h4>{product.name}</h4>
                            <p>Categoría: {product.category}</p>
                            <p>Peso: {product.package_weight || 'No configurado'}g</p>
                            <button onClick={() => setSelectedProduct(product)}>
                                Editar Dimensiones
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {selectedProduct && (
                <div className="dimension-editor">
                    <h3>Editar: {selectedProduct.name}</h3>
                    
                    <div className="templates-section">
                        <h4>Plantillas Predefinidas</h4>
                        <select onChange={(e) => applyTemplate(e.target.value)}>
                            <option value="">Seleccionar plantilla...</option>
                            {templates.map(template => (
                                <option key={template.id} value={template.id}>
                                    {template.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="dimensions-form">
                        <div className="form-group">
                            <label>Peso (gramos):</label>
                            <input
                                type="number"
                                value={selectedProduct.package_weight || ''}
                                onChange={(e) => setSelectedProduct({
                                    ...selectedProduct,
                                    package_weight: parseFloat(e.target.value)
                                })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Altura (cm):</label>
                            <input
                                type="number"
                                value={selectedProduct.package_height || ''}
                                onChange={(e) => setSelectedProduct({
                                    ...selectedProduct,
                                    package_height: parseFloat(e.target.value)
                                })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Ancho (cm):</label>
                            <input
                                type="number"
                                value={selectedProduct.package_width || ''}
                                onChange={(e) => setSelectedProduct({
                                    ...selectedProduct,
                                    package_width: parseFloat(e.target.value)
                                })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Largo (cm):</label>
                            <input
                                type="number"
                                value={selectedProduct.package_length || ''}
                                onChange={(e) => setSelectedProduct({
                                    ...selectedProduct,
                                    package_length: parseFloat(e.target.value)
                                })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Tipo de Empaque:</label>
                            <select
                                value={selectedProduct.package_type || ''}
                                onChange={(e) => setSelectedProduct({
                                    ...selectedProduct,
                                    package_type: e.target.value
                                })}
                            >
                                <option value="sobre">Sobre</option>
                                <option value="caja_individual">Caja Individual</option>
                                <option value="caja_larga">Caja Larga</option>
                                <option value="caja_grande">Caja Grande</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={selectedProduct.fragile || false}
                                    onChange={(e) => setSelectedProduct({
                                        ...selectedProduct,
                                        fragile: e.target.checked
                                    })}
                                />
                                Frágil
                            </label>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button onClick={saveDimensions} className="btn-primary">
                            Guardar Dimensiones
                        </button>
                        <button onClick={() => setSelectedProduct(null)} className="btn-secondary">
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
```

#### **4.2 Selector de Agencias**
```jsx
// client/src/components/customer/AgencySelector.jsx
const AgencySelector = ({ province, onAgencySelect }) => {
    const [agencies, setAgencies] = useState([]);
    const [selectedAgency, setSelectedAgency] = useState(null);

    useEffect(() => {
        loadAgencies();
    }, [province]);

    const loadAgencies = async () => {
        const response = await fetch(`/api/shipping/agencies?province=${province}`);
        const data = await response.json();
        setAgencies(data);
    };

    return (
        <div className="agency-selector">
            <h3>Seleccionar Agencia de Retiro</h3>
            <select onChange={(e) => {
                const agency = agencies.find(a => a.id === e.target.value);
                setSelectedAgency(agency);
                onAgencySelect(agency);
            }}>
                <option value="">Seleccionar...</option>
                {agencies.map(agency => (
                    <option key={agency.id} value={agency.id}>
                        {agency.name} - {agency.address}
                    </option>
                ))}
            </select>
            
            {selectedAgency && (
                <div className="agency-details">
                    <p><strong>Dirección:</strong> {selectedAgency.address}</p>
                    <p><strong>Teléfono:</strong> {selectedAgency.phone}</p>
                    <p><strong>Horario:</strong> {selectedAgency.hours}</p>
                </div>
            )}
        </div>
    );
};
```

---

### **FASE 5: Integración con Flujo de Compra (2-3 días)**

#### **5.1 Modificación del Checkout**
```jsx
// client/src/pages/customer/CheckoutPage.jsx
const CheckoutPage = () => {
    const [shippingMethod, setShippingMethod] = useState('');
    const [shippingCost, setShippingCost] = useState(0);
    const [selectedAgency, setSelectedAgency] = useState(null);

    // Integrar calculador de envío
    // Permitir seleccionar método de envío
    // Mostrar costo total con envío
    // Guardar datos de envío en orden
};
```

#### **5.2 Confirmación de Orden**
```jsx
// client/src/pages/customer/OrderConfirmation.jsx
const OrderConfirmation = () => {
    // Mostrar número de seguimiento
    // Permitir descargar etiqueta
    // Mostrar estado del envío
    // Enviar actualizaciones por WhatsApp
};
```

---

### **FASE 6: Panel de Administración (2-3 días)**

#### **6.1 Gestión de Envíos**
```jsx
// client/src/components/admin/ShippingManagement.jsx
const ShippingManagement = () => {
    // Listar todos los envíos
    // Buscar por número de seguimiento
    // Actualizar estados manualmente
    // Reimprimir etiquetas
    // Exportar reportes
};
```

#### **6.2 Configuración de API**
```jsx
// client/src/components/admin/CorreoConfig.jsx
const CorreoConfig = () => {
    // Configurar credenciales de API
    // Cambiar ambiente (test/prod)
    // Probar conexión
    // Verificar límites de uso
};
```

---

## 🔄 **Flujo de Trabajo Completo**

### **1. Cliente Realiza Compra**
1. Agrega productos al carrito
2. Ingresa código postal en checkout
3. Sistema calcula opciones de envío
4. Selecciona método y agencia (si corresponde)
5. Confirma orden con costo de envío

### **2. Procesamiento Interno**
1. Se crea orden en sistema
2. Se genera envío en Correo Argentino
3. Se obtiene número de seguimiento
4. Se genera etiqueta PDF
5. Se envían confirmaciones por email/WhatsApp

### **3. Seguimiento y Entrega**
1. Cliente puede seguir envío en web
2. Sistema actualiza estados automáticamente
3. Se notifica entrega al cliente
4. Se actualiza inventario si corresponde

---

## 🌐 **Compatibilidad con Vercel Deployment**

### **✅ Totalmente Compatible con Vercel**

La integración de Correo Argentino está diseñada específicamente para funcionar perfectamente en Vercel. Aquí está el desglose:

#### **🏗️ Arquitectura Serverless Optimizada**
```javascript
// api/shipping/quote.js - Vercel Serverless Function
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { postalCodeDestination, items } = req.body;
    
    // Lógica de cotización con dimensiones
    const correoService = new CorreoArgentinoService();
    const quote = await correoService.quoteShipping(items, postalCodeDestination);
    
    res.status(200).json(quote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

#### **📁 Estructura de Archivos para Vercel**
```
├── api/
│   ├── shipping/
│   │   ├── quote.js              # Cotización de envíos
│   │   ├── create.js             # Crear envío
│   │   ├── track/[trackingNumber].js  # Seguimiento
│   │   └── agencies.js           # Listar agencias
│   ├── products/
│   │   ├── with-dimensions.js    # Productos con dimensiones
│   │   └── [id]/dimensions.js    # Actualizar dimensiones
│   └── admin/
│       ├── correo-config.js      # Configuración API
│       └── dimension-templates.js # Plantillas
├── components/
│   ├── shipping/
│   │   ├── ShippingCalculator.jsx
│   │   ├── AgencySelector.jsx
│   │   └── ShippingLabel.jsx
│   └── admin/
│       └── ProductDimensionsManager.jsx
└── lib/
    ├── correoArgentinoService.js
    └── shippingCalculator.js
```

#### **⚙️ Configuración Vercel**
```json
// vercel.json
{
  "functions": {
    "api/shipping/**/*.js": {
      "maxDuration": 30
    },
    "api/products/**/*.js": {
      "maxDuration": 10
    }
  },
  "env": {
    "CORREO_ARGENTINO_TOKEN": "@correo-argentino-token",
    "SUPABASE_URL": "@supabase-url",
    "SUPABASE_ANON_KEY": "@supabase-anon-key"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_API_URL": "https://your-domain.vercel.app/api"
    }
  }
}
```

#### **🔧 Variables de Entorno en Vercel**
```bash
# Configurar en Vercel Dashboard
CORREO_ARGENTINO_TOKEN=your_token_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=https://your-domain.vercel.app/api
```

#### **🚀 Ventajas de Vercel para esta Integración**

**1. Serverless Functions**
- **Sin mantenimiento de servidores**
- **Escalabilidad automática** para picos de tráfico
- **Cold starts optimizados** con keep-alive
- **Timeouts configurables** (30s para API externa)

**2. Edge Network**
- **Global CDN** para respuestas rápidas
- **Cache inteligente** para cotizaciones
- **Geo-distribution** para agencias por provincia

**3. Build Optimization**
- **Tree-shaking** automático de código no usado
- **Minificación** de componentes React
- **Bundle splitting** para mejor performance

**4. Environment Management**
- **Variables secretas** protegidas
- **Preview deployments** para testing
- **Rollback instantáneo** si hay problemas

#### **📊 Performance en Vercel**

```javascript
// lib/cache.js - Optimizado para Vercel Edge
import { kv } from '@vercel/kv';

export async function getCachedQuote(postalCode, itemsHash) {
  const cacheKey = `quote:${postalCode}:${itemsHash}`;
  return await kv.get(cacheKey);
}

export async function setCachedQuote(postalCode, itemsHash, quote, ttl = 86400) {
  const cacheKey = `quote:${postalCode}:${itemsHash}`;
  return await kv.set(cacheKey, quote, { ex: ttl });
}
```

#### **🔒 Seguridad en Vercel**

```javascript
// lib/security.js
export function validateRequest(req) {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://magnolia-n.com',
    'https://www.magnolia-n.com',
    'https://magnolia-n.vercel.app'
  ];
  
  if (!allowedOrigins.includes(origin)) {
    throw new Error('Origin not allowed');
  }
}
```

#### **⚡ Optimizaciones Específicas**

**1. API Rate Limiting**
```javascript
// lib/rateLimit.js
import rateLimit from 'express-rate-limit';

export const quoteRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 cotizaciones
  message: 'Too many quote requests'
});
```

**2. Background Jobs**
```javascript
// api/shipping/create.js
export default async function handler(req, res) {
  // Respuesta inmediata
  res.status(202).json({ message: 'Shipment created successfully' });
  
  // Procesamiento asíncrono
  processShipmentAsync(req.body);
}

async function processShipmentAsync(data) {
  // Procesar envío sin bloquear respuesta
}
```

#### **📈 Monitoreo y Logs**

```javascript
// lib/monitoring.js
export function logAPICall(endpoint, duration, success) {
  console.log({
    timestamp: new Date().toISOString(),
    endpoint,
    duration,
    success,
    vercel: {
      region: process.env.VERCEL_REGION,
      deployment: process.env.VERCEL_ENV
    }
  });
}
```

#### **🔄 Deploy Strategy**

```bash
# 1. Setup Vercel CLI
npm i -g vercel

# 2. Configurar proyecto
vercel link

# 3. Variables de entorno
vercel env add CORREO_ARGENTINO_TOKEN
vercel env add SUPABASE_URL

# 4. Deploy
vercel --prod
```

#### **⚠️ Consideraciones Especiales**

**1. Timeouts de API Externa**
- Correo Argentino API puede tardar hasta 10 segundos
- Configurar `maxDuration: 30` en functions
- Implementar timeouts internos

**2. Manejo de Archivos (Etiquetas PDF)**
```javascript
// api/shipping/label/[trackingNumber].js
export default async function handler(req, res) {
  try {
    const pdfBuffer = await getLabelPDF(req.query.trackingNumber);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="label.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: 'Label not found' });
  }
}
```

**3. Webhooks para Actualizaciones**
```javascript
// api/webhooks/correo-argentino.js
export default async function handler(req, res) {
  const { trackingNumber, status } = req.body;
  
  // Actualizar estado en Supabase
  await updateShipmentStatus(trackingNumber, status);
  
  // Notificar cliente
  await notifyCustomer(trackingNumber, status);
  
  res.status(200).json({ received: true });
}
```

---

## 📊 **Consideraciones Técnicas**

### **Manejo de Errores**
- Reintentos automáticos para fallos de API
- Logs detallados de errores
- Notificaciones automáticas al admin
- Mensajes de error amigables para usuarios

### **Performance**
- Cache de cotizaciones (24 horas)
- Cache de agencias (semanal)
- Procesamiento asíncrono de envíos
- Optimización de consultas a BD
- **Vercel Edge Cache** para respuestas estáticas

### **Seguridad**
- Encriptación de credenciales API
- Validación de datos de entrada
- Rate limiting para llamadas API
- Auditoría de operaciones
- **CORS configurado** para dominios permitidos
- **Variables de entorno** protegidas en Vercel

---

## 🚀 **Plan de Implementación**

### **Semana 1: Configuración y BD**
- Obtener credenciales API
- Crear estructura de base de datos
- Configurar servicio básico

### **Semana 2: Backend**
- Implementar servicios principales
- Crear endpoints API
- Realizar pruebas de integración

### **Semana 3: Frontend**
- Desarrollar componentes de envío
- Integrar con flujo de compra
- Implementar panel de admin

### **Semana 4: Testing y Deploy**
- Pruebas end-to-end
- Optimización de performance
- Deploy a producción
- Capacitación del equipo

---

## 📋 **Checklist Final**

### **Configuración**
- [ ] Credenciales API obtenidas
- [ ] Variables de entorno configuradas
- [ ] Base de datos actualizada
- [ ] Servicio API funcionando

### **Funcionalidades**
- [ ] Cotización de envíos
- [ ] Creación de envíos
- [ ] Generación de etiquetas
- [ ] Seguimiento en tiempo real
- [ ] Panel de administración

### **Integraciones**
- [ ] Flujo de compra actualizado
- [ ] Notificaciones por WhatsApp
- [ ] Emails automáticos
- [ ] Actualizaciones de estado

### **Testing**
- [ ] Pruebas unitarias
- [ ] Pruebas de integración
- [ ] Pruebas de carga
- [ ] Pruebas de usuario

---

## 💰 **Costos Estimados**

### **Desarrollo**
- **Horas de desarrollo**: 80-100 horas
- **Costo por hora**: $50-80 USD
- **Total desarrollo**: $4,000-8,000 USD

### **Costos Operativos**
- **API Correo Argentino**: Según consumo
- **Hosting adicional**: $10-20 USD/mes
- **Mantenimiento**: $200-500 USD/mes

---

## 🎯 **Próximos Pasos**

1. **Contactar a Correo Argentino** para obtener credenciales
2. **Setup del entorno de desarrollo**
3. **Comenzar con FASE 1** del plan
4. **Asignar recursos** para el desarrollo
5. **Establecer fechas límite** para cada fase

---

## 📞 **Soporte y Contacto**

Para consultas sobre la integración:
- **Documentación técnica**: Ver archivos adjuntos
- **Soporte Correo Argentino**: Portal MiCorreo
- **Desarrollo interno**: Equipo técnico Magnolia-N

---

**Estado del Plan**: 🟡 EN ESPERA DE APROBACIÓN
**Fecha de Creación**: 07/02/2025
**Responsable**: Equipo de Desarrollo Magnolia-N
