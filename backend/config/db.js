const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Cargar las variables de entorno
require('dotenv').config();

console.log('Variables de entorno:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

const connection = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', // Si no hay contraseña, se deja como cadena vacía
    database: process.env.DB_NAME || 'servicios_municipales',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

connection.getConnection()
    .then(() => {
        console.log('✅ Conexión a la base de datos exitosa');
    })
    .catch((err) => {
        console.error('Error conectando a la base de datos:', err);
        process.exit(1);
    });

module.exports = connection;
