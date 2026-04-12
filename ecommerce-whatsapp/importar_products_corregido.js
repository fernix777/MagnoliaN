#!/usr/bin/env node
/**
 * IMPORTAR PRODUCTS - CSV CON DESCRIPCIONES MULTILÍNEA
 * Maneja correctamente las descripciones con saltos de línea
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://dsovrmquhgkquqsvkptc.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzb3ZybXF1aGdrcXVxc3ZrcHRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTkzNzI1MiwiZXhwIjoyMDkxNTEzMjUyfQ.wXoOTwXEJaEA-PHuQ9TfwnvEWpXAd-VkcRRlzKzqtXw';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function log(msg, type = 'info') {
    const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️', process: '🔄' };
    console.log(`${icons[type]} ${msg}`);
}

function parseArray(value) {
    if (!value || value === 'null' || value === 'NULL' || value === '') {
        return ['unidad', 'caja', 'bulto'];
    }
    try {
        // Intentar parsear como JSON
        const cleaned = value.replace(/"""/g, '"').replace(/^"|"$/g, '');
        return JSON.parse(cleaned);
    } catch {
        return ['unidad', 'caja', 'bulto'];
    }
}

function parseBoolean(value) {
    if (value === undefined || value === null || value === '') return true;
    return value.toString().toLowerCase() === 'true';
}

function parseNumeric(value) {
    if (!value || value === '' || value === 'null') return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
}

function parseInteger(value) {
    if (!value || value === '' || value === 'null') return null;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? null : parsed;
}

async function importProducts() {
    log('Leyendo CSV de products...', 'process');
    
    const file = 'Supabase Snippet Retrieve Product Images Column Metadata (5).csv';
    const content = fs.readFileSync(file, 'utf-8');
    
    // Parsear CSV manualmente considerando multilínea
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    log(`Headers encontrados: ${headers.join(', ')}`, 'info');
    
    const records = [];
    let currentRecord = {};
    let currentField = '';
    let fieldIndex = 0;
    let inQuotes = false;
    
    // Procesar línea por línea
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        
        if (!inQuotes) {
            // Nueva fila
            if (line.trim() === '') continue;
            
            currentRecord = {};
            currentField = '';
            fieldIndex = 0;
            inQuotes = false;
        }
        
        // Procesar caracteres de la línea
        let fieldStart = 0;
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            const nextChar = line[j + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // Comilla escapada
                    currentField += '"';
                    j++; // Saltar siguiente comilla
                } else {
                    // Inicio o fin de campo entre comillas
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // Fin de campo
                const header = headers[fieldIndex];
                if (header) {
                    currentRecord[header] = currentField.trim();
                }
                currentField = '';
                fieldIndex++;
            } else {
                currentField += char;
            }
        }
        
        // Si no estamos entre comillas, esta línea terminó
        if (!inQuotes) {
            // Guardar último campo
            const header = headers[fieldIndex];
            if (header) {
                currentRecord[header] = currentField.trim();
            }
            
            // Solo agregar si tiene ID válido
            if (currentRecord.id && currentRecord.id !== '') {
                records.push(currentRecord);
            }
        } else {
            // Continuamos en la siguiente línea (dentro de un campo)
            currentField += '\n';
        }
    }
    
    log(`Total de registros encontrados: ${records.length}`, 'info');
    
    // Transformar registros
    const transformed = records.map(r => ({
        id: parseInteger(r.id),
        name: r.name || '',
        slug: r.slug || '',
        description: r.description || null,
        base_price: parseNumeric(r.base_price),
        stock: parseInteger(r.stock) || 0,
        category_id: parseInteger(r.category_id),
        subcategory_id: parseInteger(r.subcategory_id),
        featured: parseBoolean(r.featured),
        active: parseBoolean(r.active),
        created_at: r.created_at || new Date().toISOString(),
        updated_at: r.updated_at || new Date().toISOString(),
        units_per_box: parseInteger(r.units_per_box) || 12,
        boxes_per_bundle: parseInteger(r.boxes_per_bundle) || 40,
        price_box: parseNumeric(r.price_box),
        price_bundle: parseNumeric(r.price_bundle),
        has_colors: parseBoolean(r.has_colors),
        sale_types: parseArray(r.sale_types)
    }));
    
    log(`Transformados ${transformed.length} registros`, 'info');
    
    // Insertar en batches
    const BATCH_SIZE = 50;
    let imported = 0;
    
    for (let i = 0; i < transformed.length; i += BATCH_SIZE) {
        const batch = transformed.slice(i, i + BATCH_SIZE);
        
        const { data, error } = await supabase
            .from('products')
            .upsert(batch, { onConflict: 'id' });
        
        if (error) {
            log(`Error en batch ${i}: ${error.message}`, 'error');
            console.error('Primer registro del batch:', batch[0]);
        } else {
            imported += batch.length;
            log(`Batch ${i}-${i + batch.length}: OK`, 'success');
        }
    }
    
    log(`Importación completada: ${imported} productos`, 'success');
    
    // Verificar
    const { count, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
    
    if (!countError) {
        log(`Total en base de datos: ${count} productos`, 'info');
    }
}

importProducts().catch(err => {
    log(`Error fatal: ${err.message}`, 'error');
    console.error(err);
});
