const express = require('express');
const dotenv = require('dotenv');
// const helmet = require('helmet');
const path = require('path');
const db = require('./config/db');

const app = express();

// Importa los routers
const usuariosRoutes = require('./api/usuarios');
const areasRoutes = require('./api/areas');
const respuestasRoutes = require('./api/respuestas')
const solicitudesRoutes = require('./api/solicitudes')
const tiposSolicitudesRoutes = require('./api/tipos_solicitudes')
const authClaveUnicaRoutes = require('./auth/auth_claveunica');
const authTrabajadoresRoutes = require('./auth/auth_trabajadores');


// Middlewares para parsear JSON y URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// // Configuración de Helmet
// app.use(helmet()); // Agrega protección básica a la aplicación contra vulnerabilidades comunes de seguridad.

// // Configuración de Content Security Policy (CSP)
// app.use(helmet.contentSecurityPolicy({
//     directives: {
//         defaultSrc: ["'self'"],  // Solo permite cargar contenido desde el mismo dominio.
//         frameAncestors: ["'self'", "https://sitio-web-municipalidad.com"], // Permite que la página sea cargada en un iframe solo desde el mismo dominio y el dominio especificado.
//         scriptSrc: ["'self'"], // Solo permite la ejecución de scripts alojados en el mismo dominio.
//         styleSrc: ["'self'", "'unsafe-inline'"], // Permite estilos desde el mismo dominio y permite estilos en línea (puede ser un riesgo de seguridad).
//         imgSrc: ["'self'", "https://dominio-confiable.com"], // Permite cargar imágenes desde el mismo dominio y un dominio específico confiable.
//     }
// }));

// Usa los routers
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/areas', areasRoutes);
app.use('/api/respuestas', respuestasRoutes)
app.use('/api/solicitudes', solicitudesRoutes)
app.use('/api/tipos_solicitudes', tiposSolicitudesRoutes)
app.use('/api/auth/claveunica', authClaveUnicaRoutes);
app.use('/api/auth/trabajadores', authTrabajadoresRoutes);


// Rutas
app.get('/', (req, res) => { 
    res.send('¡Hola Mundo!');
});

dotenv.config({ path: path.join('../.env') });
const PORT = process.env.PORT;

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Server is running on: http://localhost:${PORT}`);
});