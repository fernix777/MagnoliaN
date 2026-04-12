#!/usr/bin/env node
/**
 * SCRIPT DE MIGRACIÓN AUTOMÁTICA - SUPABASE
 * Importa todos los CSVs al nuevo proyecto
 * 
 * Uso:
 * 1. npm install @supabase/supabase-js csv-parse
 * 2. node importar_todos_csv.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// ============================================
// CONFIGURACIÓN - Credenciales del Nuevo Proyecto
// ============================================

const SUPABASE_URL = 'https://dsovrmquhgkquqsvkptc.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzb3ZybXF1aGdrcXVxc3ZrcHRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTkzNzI1MiwiZXhwIjoyMDkxNTEzMjUyfQ.wXoOTwXEJaEA-PHuQ9TfwnvEWpXAd-VkcRRlzKzqtXw';

// ============================================
// MAPEO DE ARCHIVOS CSV A TABLAS
// ============================================

const CSV_FILES = [
    {
        table: 'categories',
        file: 'Supabase Snippet Retrieve Product Images Column Metadata (6).csv',
        required: true
    },
    {
        table: 'banners',
        file: 'Supabase Snippet Retrieve Product Images Column Metadata (7).csv',
        required: true
    },
    {
        table: 'products',
        file: 'Supabase Snippet Retrieve Product Images Column Metadata (5).csv',
        required: true
    },
    {
        table: 'product_images',
        file: 'Supabase Snippet Retrieve Product Images Column Metadata (8).csv',
        required: true
    },
    {
        table: 'product_variants',
        file: 'Supabase Snippet Retrieve Product Images Column Metadata (9).csv',
        required: true
    },
    {
        table: 'orders',
        file: 'Supabase Snippet Retrieve Product Images Column Metadata (10).csv',
        required: true
    },
    {
        table: 'order_items',
        file: 'Supabase Snippet Retrieve Product Images Column Metadata (11).csv',
        required: true
    }
];

// ============================================
// INICIALIZAR CLIENTE SUPABASE
// ============================================

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function log(message, type = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const icons = {
        info: 'ℹ️',
        success: '✅',
        error: '❌',
        warning: '⚠️',
        process: '🔄'
    };
    console.log(`[${timestamp}] ${icons[type] || 'ℹ️'} ${message}`);
}

function parseArray(value) {
    if (!value || value === 'null' || value === 'NULL') {
        return ['unidad', 'caja', 'bulto'];
    }
    try {
        // Intentar parsear como JSON
        return JSON.parse(value);
    } catch {
        // Si falla, devolver array por defecto
        return ['unidad', 'caja', 'bulto'];
    }
}

function parseValue(value, column, table) {
    // Manejar null/undefined
    if (value === undefined || value === null || value === '' || value === 'null' || value === 'NULL') {
        if (column === 'sale_types') return ['unidad', 'caja', 'bulto'];
        if (column === 'active') return true;
        if (column === 'featured') return false;
        if (column === 'has_colors') return true;
        if (column === 'is_primary') return false;
        if (column === 'stock') return 0;
        if (column === 'display_order') return 0;
        if (column === 'price_modifier') return 0;
        if (column === 'price_box' || column === 'price_bundle') return null;
        if (column === 'created_at' || column === 'updated_at') return new Date().toISOString();
        if (column === 'customer_info' || column === 'variant_info') return {};
        return null;
    }

    // Arrays (sale_types)
    if (column === 'sale_types') {
        return parseArray(value);
    }

    // Booleanos
    if (['active', 'featured', 'has_colors', 'is_primary'].includes(column)) {
        if (typeof value === 'boolean') return value;
        return value.toString().toLowerCase() === 'true';
    }

    // JSONB
    if (['customer_info', 'variant_info'].includes(column)) {
        try {
            return JSON.parse(value);
        } catch {
            return {};
        }
    }

    // Números enteros
    if (['id', 'product_id', 'category_id', 'subcategory_id', 'order_id', 'stock', 'quantity', 
         'display_order', 'units_per_box', 'boxes_per_bundle'].includes(column)) {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? null : parsed;
    }

    // Números decimales
    if (['base_price', 'price', 'total', 'price_modifier', 'price_box', 'price_bundle'].includes(column)) {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
    }

    // Timestamps - mantener como string si ya está en formato correcto
    if (['created_at', 'updated_at'].includes(column)) {
        return value;
    }

    // Texto
    return value;
}

async function importCSV(config) {
    const { table, file, required } = config;
    
    log(`Procesando ${file} → ${table}`, 'process');

    // Verificar que el archivo existe
    if (!fs.existsSync(file)) {
        const message = `Archivo no encontrado: ${file}`;
        if (required) {
            log(message, 'error');
            throw new Error(message);
        } else {
            log(`${message} (opcional, ignorando)`, 'warning');
            return { table, imported: 0, skipped: true };
        }
    }

    // Leer y parsear CSV
    const content = fs.readFileSync(file, 'utf-8');
    const records = parse(content, { 
        columns: true,
        skip_empty_lines: true,
        trim: true
    });

    if (records.length === 0) {
        log(`${table}: No hay registros para importar`, 'warning');
        return { table, imported: 0, skipped: true };
    }

    log(`${table}: ${records.length} registros encontrados`, 'info');

    // Transformar datos según el tipo de columna
    const transformedRecords = records.map((record, index) => {
        const transformed = {};
        for (const [key, value] of Object.entries(record)) {
            transformed[key] = parseValue(value, key, table);
        }
        return transformed;
    });

    // Insertar en batches de 100 para mejor performance
    const BATCH_SIZE = 100;
    let imported = 0;
    let errors = [];

    for (let i = 0; i < transformedRecords.length; i += BATCH_SIZE) {
        const batch = transformedRecords.slice(i, i + BATCH_SIZE);
        
        const { data, error } = await supabase
            .from(table)
            .insert(batch);

        if (error) {
            log(`Error en batch ${i}-${i + batch.length}: ${error.message}`, 'error');
            errors.push({ batch: i, error: error.message });
        } else {
            imported += batch.length;
            log(`Batch ${i}-${i + batch.length}: OK (${batch.length} registros)`, 'success');
        }
    }

    if (errors.length > 0) {
        log(`${table}: Completado con ${errors.length} errores`, 'warning');
    } else {
        log(`${table}: ${imported} registros importados exitosamente`, 'success');
    }

    return { 
        table, 
        imported, 
        total: records.length, 
        errors: errors.length,
        skipped: false 
    };
}

async function verifyImport() {
    log('\n🔍 Verificando importación...', 'info');

    const tables = ['categories', 'products', 'product_images', 'product_variants', 'orders', 'order_items', 'banners'];
    const results = [];

    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (error) {
            log(`${table}: Error al verificar - ${error.message}`, 'error');
            results.push({ table, count: 0, error: true });
        } else {
            const expected = {
                categories: 7,
                products: 456,
                product_images: 260,
                product_variants: 185,
                orders: 59,
                order_items: 142,
                banners: 6
            }[table];

            const status = count === expected ? '✅' : '⚠️';
            log(`${status} ${table}: ${count} registros (esperado: ${expected})`, 
                count === expected ? 'success' : 'warning');
            
            results.push({ table, count, expected, match: count === expected });
        }
    }

    return results;
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

async function main() {
    console.log('\n' + '='.repeat(60));
    console.log('  MIGRACIÓN AUTOMÁTICA - SUPABASE');
    console.log('  Magnolia Novedades');
    console.log('='.repeat(60) + '\n');

    // Verificar dependencias
    try {
        require('@supabase/supabase-js');
        require('csv-parse/sync');
    } catch (e) {
        console.error('❌ Error: Dependencias no instaladas');
        console.log('Ejecuta: npm install @supabase/supabase-js csv-parse');
        process.exit(1);
    }

    const results = [];

    // Importar cada archivo
    for (const config of CSV_FILES) {
        try {
            const result = await importCSV(config);
            results.push(result);
        } catch (error) {
            log(`Error fatal en ${config.table}: ${error.message}`, 'error');
            results.push({ 
                table: config.table, 
                imported: 0, 
                error: error.message,
                skipped: false 
            });
        }
        console.log(''); // Línea en blanco entre tablas
    }

    // Verificación final
    const verification = await verifyImport();

    // Resumen
    console.log('\n' + '='.repeat(60));
    console.log('  RESUMEN DE MIGRACIÓN');
    console.log('='.repeat(60));

    const totalImported = results.reduce((sum, r) => sum + (r.imported || 0), 0);
    const totalErrors = results.reduce((sum, r) => sum + (r.errors || 0), 0);
    const allMatch = verification.every(v => v.match);

    console.log(`Total registros importados: ${totalImported}`);
    console.log(`Total errores: ${totalErrors}`);
    console.log(`Verificación: ${allMatch ? '✅ TODAS LAS TABLAS COINCIDEN' : '⚠️ ALGUNAS TABLAS NO COINCIDEN'}`);

    if (allMatch && totalErrors === 0) {
        console.log('\n🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!');
    } else {
        console.log('\n⚠️ La migración se completó pero hay discrepancias. Revisa los logs arriba.');
    }

    console.log('\nPróximos pasos:');
    console.log('1. Configura RLS policies (archivo 11_rls_policies.sql)');
    console.log('2. Actualiza variables de entorno en frontend/backend');
    console.log('3. Reinicia los servidores');
    console.log('4. Prueba la tienda online\n');
}

// Manejo de errores
process.on('unhandledRejection', (err) => {
    console.error('❌ Error no manejado:', err);
    process.exit(1);
});

// Ejecutar
main();
