const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors'); // Importar cors para manejar CORS
const db = require('./config/db');

// Cargar variables de entorno antes de usarlas
dotenv.config({ path: path.resolve(__dirname, '.env.development') });

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de CORS para desarrollo
const corsOptions = {
    origin: '*', // Permitir cualquier origen en desarrollo
    credentials: true,
};

app.use(cors(corsOptions)); // Usar CORS con las opciones definidas

// Middlewares
app.use(express.json()); // Parsear JSON
app.use(express.urlencoded({ extended: true })); // Parsear URL-encoded

// Seguridad con Helmet (descomentarlo cuando sea necesario)
const helmet = require('helmet');
app.use(helmet()); // Usar Helmet para agregar cabeceras de seguridad

// Configuración opcional de Content Security Policy (CSP)
/*
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        frameAncestors: ["'self'", "https://sitio-web-municipalidad.com"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "https://dominio-confiable.com"],
    }
}));
*/

// Importar y usar routers
const usuariosRoutes = require('./api/usuarios');
const areasRoutes = require('./api/areas');
const respuestasRoutes = require('./api/respuestas');
const solicitudesRoutes = require('./api/solicitudes');
const tiposSolicitudesRoutes = require('./api/tipos_solicitudes');
const authClaveUnicaRoutes = require('./auth/auth_claveunica');
const authTrabajadoresRoutes = require('./auth/auth_trabajadores');

app.use('/api/usuarios', usuariosRoutes);
app.use('/api/areas', areasRoutes);
app.use('/api/respuestas', respuestasRoutes);
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api/tipos_solicitudes', tiposSolicitudesRoutes);
app.use('/api/auth/claveunica', authClaveUnicaRoutes);
app.use('/api/auth/trabajadores', authTrabajadoresRoutes);

// Ruta raíz
app.get('/', (req, res) => {
    res.send('¡Hola Mundo!');
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en: http://localhost:${PORT}`);
});