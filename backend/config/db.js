const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the parent directory
dotenv.config({ path: path.join('../.env') });

const connection = mysql.createConnection({
    host: process.env.DB_HOST,       
    user: process.env.DB_USER,       
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME,   
});

connection.connect((err) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err);
        process.exit(1); // Termina el proceso si hay error
    }
    console.log('Conexión a la base de datos exitosa');
});

module.exports = connection;