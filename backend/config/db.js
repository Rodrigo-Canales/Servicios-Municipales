const mysql = require('mysql2/promise');  // Importar la versión promise de mysql2
const dotenv = require('dotenv');
const path = require('path');

// Cargar las variables de entorno desde el archivo .env
dotenv.config({ path: path.join('../.env.development') });

// Crear la conexión usando el pool de conexiones para manejo de múltiples conexiones
const connection = mysql.createPool({
    host: process.env.DB_HOST,       
    user: process.env.DB_USER,       
    password: '',  // Deja la contraseña vacía password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,   
    waitForConnections: true,  // Asegura que las conexiones se mantengan mientras se usan
    connectionLimit: 10,       // Número máximo de conexiones en el pool
    queueLimit: 0             // No hay límite de espera
});

connection.getConnection()
    .then(() => {
        console.log('✅ Conexión a la base de datos exitosa');
    })
    .catch((err) => {
        console.error('Error conectando a la base de datos:', err);
        process.exit(1); // Termina el proceso si hay error
    });

module.exports = connection;