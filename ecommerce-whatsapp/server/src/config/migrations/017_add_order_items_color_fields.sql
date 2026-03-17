-- Add color and variant fields to order_items table
ALTER TABLE order_items 
ADD COLUMN selected_color TEXT,
ADD COLUMN selected_condition TEXT,
ADD COLUMN purchase_type TEXT DEFAULT 'paquete';

-- Create index for better performance
CREATE INDEX idx_order_items_selected_color ON order_items(selected_color);
CREATE INDEX idx_order_items_purchase_type ON order_items(purchase_type);
