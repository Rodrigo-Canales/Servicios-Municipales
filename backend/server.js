const express = require('express');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Configuración de la base de datos
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database!');
});

// Configuración de Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'archivos_adjuntos'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Importar los módulos CRUD
const areasRoutes = require('./areas/areas')(app, db);
const tiposSolicitudesRoutes = require('./tiposSolicitudes/tiposSolicitudes')(app, db);
const usuariosRoutes = require('./usuarios/usuarios')(app, db);
const trabajadoresRoutes = require('./trabajadores/trabajadores')(app, db);
const solicitudesRoutes = require('./solicitudes/solicitudes')(app, db);
const respuestasRoutes = require('./respuestas/respuestas')(app, db);

// Usar las rutas
app.use('/api/areas', areasRoutes);
app.use('/api/tipos-solicitudes', tiposSolicitudesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/trabajadores', trabajadoresRoutes);
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api/respuestas', respuestasRoutes);

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});