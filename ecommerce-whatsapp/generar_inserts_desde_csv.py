#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para generar INSERTs SQL desde archivos CSV
Magnolia Novedades - Migración Supabase
"""

import csv
import os
import re

# Configuración de archivos CSV y sus tablas correspondientes
CSV_FILES = {
    'products': {
        'file': 'Supabase Snippet Retrieve Product Images Column Metadata (5).csv',
        'table': 'products',
        'columns': ['id', 'name', 'slug', 'description', 'base_price', 'stock', 'category_id', 
                   'subcategory_id', 'featured', 'active', 'created_at', 'updated_at',
                   'units_per_box', 'boxes_per_bundle', 'price_box', 'price_bundle', 
                   'has_colors', 'sale_types'],
        'sequence': 'products_id_seq'
    },
    'categories': {
        'file': 'Supabase Snippet Retrieve Product Images Column Metadata (6).csv',
        'table': 'categories',
        'columns': ['id', 'name', 'slug', 'description', 'image_url', 'display_order', 
                   'created_at', 'active', 'parent_id'],
        'sequence': 'categories_id_seq'
    },
    'banners': {
        'file': 'Supabase Snippet Retrieve Product Images Column Metadata (7).csv',
        'table': 'banners',
        'columns': ['id', 'title', 'subtitle', 'image_url', 'link', 'display_order', 
                   'active', 'created_at', 'updated_at'],
        'sequence': 'banners_id_seq'
    },
    'product_images': {
        'file': 'Supabase Snippet Retrieve Product Images Column Metadata (8).csv',
        'table': 'product_images',
        'columns': ['id', 'product_id', 'image_url', 'is_primary', 'display_order', 'created_at'],
        'sequence': 'product_images_id_seq'
    },
    'product_variants': {
        'file': 'Supabase Snippet Retrieve Product Images Column Metadata (9).csv',
        'table': 'product_variants',
        'columns': ['id', 'product_id', 'variant_type', 'variant_value', 'price_modifier', 
                   'stock', 'sku', 'created_at', 'active'],
        'sequence': 'product_variants_id_seq'
    },
    'orders': {
        'file': 'Supabase Snippet Retrieve Product Images Column Metadata (10).csv',
        'table': 'orders',
        'columns': ['id', 'user_id', 'customer_info', 'total', 'status', 
                   'payment_method', 'created_at', 'updated_at'],
        'sequence': 'orders_id_seq'
    },
    'order_items': {
        'file': 'Supabase Snippet Retrieve Product Images Column Metadata (11).csv',
        'table': 'order_items',
        'columns': ['id', 'order_id', 'product_id', 'quantity', 'price', 'product_name', 
                   'variant_info', 'created_at', 'selected_color', 'selected_condition', 
                   'purchase_type'],
        'sequence': 'order_items_id_seq'
    }
}


def escape_sql_string(value):
    """Escapar strings para SQL"""
    if value is None:
        return 'NULL'
    if value == '':
        return "''"
    
    # Reemplazar caracteres problemáticos
    value = str(value)
    value = value.replace("'", "''")  # Escapar comillas simples
    value = value.replace("\\", "\\\\")  # Escapar backslashes
    
    return f"'{value}'"


def parse_value(value, column_type):
    """Parsear valores según el tipo de columna"""
    if value is None or value == '' or value == 'NULL':
        return 'NULL'
    
    # Booleanos
    if column_type in ['active', 'featured', 'is_primary', 'has_colors']:
        if value.lower() in ['true', 't', '1', 'yes']:
            return 'true'
        elif value.lower() in ['false', 'f', '0', 'no']:
            return 'false'
        else:
            return 'NULL'
    
    # Números
    if column_type in ['id', 'product_id', 'category_id', 'subcategory_id', 'order_id',
                      'stock', 'display_order', 'quantity', 'units_per_box', 'boxes_per_bundle']:
        try:
            return str(int(float(value)))
        except:
            return 'NULL'
    
    # Decimales
    if column_type in ['base_price', 'price', 'price_modifier', 'price_box', 
                      'price_bundle', 'total']:
        try:
            return str(float(value))
        except:
            return 'NULL'
    
    # Timestamps - mantener como están si ya están en formato correcto
    if column_type in ['created_at', 'updated_at']:
        if value == '' or value == 'NULL':
            return 'NULL'
        return escape_sql_string(value)
    
    # JSONB
    if column_type in ['customer_info', 'variant_info']:
        if value == '' or value == 'NULL' or value == '{}':
            return "'{}'"
        return escape_sql_string(value)
    
    # Arrays (sale_types)
    if column_type == 'sale_types':
        if value == '' or value == 'NULL' or value == '{}':
            return "'{}'"
        # Convertir formato de array PostgreSQL
        return escape_sql_string(value)
    
    # Texto general
    return escape_sql_string(value)


def process_csv_file(config):
    """Procesar un archivo CSV y generar INSERTs"""
    table = config['table']
    columns = config['columns']
    filename = config['file']
    
    output = []
    output.append(f"\n-- ============================================")
    output.append(f"-- INSERTS PARA TABLA: {table.upper()}")
    output.append(f"-- ============================================\n")
    
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            
            # Leer headers
            headers = next(reader)
            print(f"Procesando {filename}: {len(headers)} columnas, {len(columns)} esperadas")
            
            # Mapear índices de columnas
            column_indices = {}
            for i, col in enumerate(columns):
                # Buscar columna en headers (case insensitive, sin espacios extra)
                for j, header in enumerate(headers):
                    if header.strip().lower() == col.lower():
                        column_indices[col] = j
                        break
            
            rows = []
            max_id = 0
            
            for row in reader:
                if not row:
                    continue
                
                values = []
                for col in columns:
                    if col in column_indices:
                        idx = column_indices[col]
                        value = row[idx] if idx < len(row) else None
                        parsed = parse_value(value, col)
                        values.append(parsed)
                        
                        # Guardar max ID para la secuencia
                        if col == 'id' and parsed != 'NULL':
                            try:
                                max_id = max(max_id, int(parsed))
                            except:
                                pass
                    else:
                        # Si la columna no existe en el CSV, usar NULL
                        if col == 'sale_types':
                            values.append("ARRAY['unidad'::text, 'caja'::text, 'bulto'::text]")
                        elif col == 'active':
                            values.append('true')
                        elif col == 'featured':
                            values.append('false')
                        elif col == 'created_at':
                            values.append('now()')
                        elif col == 'updated_at':
                            values.append('now()')
                        else:
                            values.append('NULL')
                
                rows.append(values)
            
            # Generar INSERTs en bloques de 100 para mejor performance
            batch_size = 100
            for i in range(0, len(rows), batch_size):
                batch = rows[i:i+batch_size]
                
                output.append(f"INSERT INTO {table} ({', '.join(columns)}) VALUES")
                
                for j, row_values in enumerate(batch):
                    if j > 0:
                        output.append(",")
                    else:
                        output.append("")
                    
                    output.append(f"    ({', '.join(row_values)})")
                
                output.append(";")
            
            output.append(f"\n-- Reset sequence")
            output.append(f"SELECT setval('{config['sequence']}', {max_id});\n")
            
            print(f"✅ {table}: {len(rows)} filas procesadas, max ID: {max_id}")
            
    except FileNotFoundError:
        print(f"⚠️  No se encontró: {filename}")
        return ""
    except Exception as e:
        print(f"❌ Error procesando {filename}: {e}")
        return ""
    
    return "\n".join(output)


def main():
    """Función principal"""
    print("=" * 60)
    print("GENERADOR DE INSERTS SQL DESDE CSV")
    print("Magnolia Novedades - Migración Supabase")
    print("=" * 60)
    print()
    
    all_output = []
    
    # Header del archivo SQL
    all_output.append("-- ============================================")
    all_output.append("-- INSERTS COMPLETOS GENERADOS DESDE CSV")
    all_output.append("-- Magnolia Novedades - Migración Completa")
    all_output.append("-- ============================================")
    all_output.append("")
    all_output.append("-- IMPORTANTE: Ejecutar DESPUÉS de crear las tablas")
    all_output.append("-- y ANTES de crear las llaves foráneas")
    all_output.append("")
    
    # Procesar cada archivo
    for key, config in CSV_FILES.items():
        print(f"Procesando {key}...")
        result = process_csv_file(config)
        if result:
            all_output.append(result)
    
    # Escribir archivo de salida
    output_file = 'migracion_datos_completos.sql'
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("\n".join(all_output))
    
    print()
    print("=" * 60)
    print(f"✅ Archivo generado: {output_file}")
    print("=" * 60)


if __name__ == "__main__":
    main()
