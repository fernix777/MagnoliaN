import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../database.sqlite');

// Crear base de datos
const db = new Database(DB_PATH);

// Habilitar foreign keys
db.pragma('foreign_keys = ON');

// Función para inicializar la base de datos
export function initializeDatabase() {
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');

        // Ejecutar schema
        db.exec(schema);

        console.log('✅ Database initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        return false;
    }
}

// Función helper para ejecutar queries
export function query(sql, params = []) {
    try {
        const stmt = db.prepare(sql);
        return stmt.all(params);
    } catch (error) {
        console.error('Query error:', error);
        throw error;
    }
}

// Función helper para obtener un solo resultado
export function get(sql, params = []) {
    try {
        const stmt = db.prepare(sql);
        return stmt.get(params);
    } catch (error) {
        console.error('Get error:', error);
        throw error;
    }
}

// Función helper para ejecutar inserts/updates/deletes
export function run(sql, params = []) {
    try {
        const stmt = db.prepare(sql);
        return stmt.run(params);
    } catch (error) {
        console.error('Run error:', error);
        throw error;
    }
}

// Función para transacciones
export function transaction(callback) {
    const trans = db.transaction(callback);
    return trans();
}

export default db;
