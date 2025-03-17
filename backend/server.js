const express = require('express'); // Importamos Express
const mysql = require('mysql2'); // Importamos MySQL2 para la conexión con la base de datos
const jwt = require('jsonwebtoken'); // Importamos JSON Web Token para autenticación
const bcrypt = require('bcryptjs'); // Importamos bcryptjs para el cifrado de contraseñas
const dotenv = require('dotenv'); // Importamos dotenv para manejar variables de entorno
const multer = require('multer'); // Importamos Multer para la gestión de archivos
const path = require('path'); // Importamos path para manejar rutas de archivos

dotenv.config(); // Cargamos las variables de entorno

const app = express(); // Creamos una instancia de Express
const port = process.env.PORT || 5000; // Definimos el puerto del servidor

app.use(cors()); // Habilitamos CORS para todas las solicitudes
app.use(express.json()); // Habilitamos la recepción de JSON en las solicitudes

const db = mysql.createConnection({ // Configuración de la base de datos (Se obtiene del archivo .env)
    host: process.env.DB_HOST, // Dirección del host
    user: process.env.DB_USER, // Usuario de la base de datos
    password: process.env.DB_PASSWORD, // Contraseña de la base de datos
    database: process.env.DB_NAME // Nombre de la base de datos
});

db.connect((err) => { // Conectamos la base de datos
    if (err) { // Si hay un error en la conexión
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database!'); // Confirmación de conexión exitosa
});

const storage = multer.diskStorage({ // Configuración de Multer para almacenamiento de archivos
    destination: (req, file, cb) => { // Definimos la carpeta donde se guardarán los archivos
        cb(null, path.join(__dirname, '..', 'archivos_adjuntos'));
    },
    filename: (req, file, cb) => { // Definimos el nombre del archivo
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage }); // Inicializamos Multer con la configuración

const areasRoutes = require('./areas/areas')(app, db); // Importamos las rutas de áreas
const tiposSolicitudesRoutes = require('./tiposSolicitudes/tiposSolicitudes')(app, db); // Importamos las rutas de tipos de solicitudes
const usuariosRoutes = require('./usuarios/usuarios')(app, db); // Importamos las rutas de usuarios
const trabajadoresRoutes = require('./trabajadores/trabajadores')(app, db); // Importamos las rutas de trabajadores
const solicitudesRoutes = require('./solicitudes/solicitudes')(app, db); // Importamos las rutas de solicitudes
const respuestasRoutes = require('./respuestas/respuestas')(app, db); // Importamos las rutas de respuestas

app.use('/api/areas', areasRoutes); // Definimos la ruta base para áreas
app.use('/api/tipos-solicitudes', tiposSolicitudesRoutes); // Definimos la ruta base para tipos de solicitudes
app.use('/api/usuarios', usuariosRoutes); // Definimos la ruta base para usuarios
app.use('/api/trabajadores', trabajadoresRoutes); // Definimos la ruta base para trabajadores
app.use('/api/solicitudes', solicitudesRoutes); // Definimos la ruta base para solicitudes
app.use('/api/respuestas', respuestasRoutes); // Definimos la ruta base para respuestas

app.listen(port, () => { // Iniciamos el servidor en el puerto especificado
    console.log(`Server listening on port ${port}`); // Mensaje de confirmación
});