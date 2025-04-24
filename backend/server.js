// backend/server.js
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const db = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const corsOptions = {
    origin: 'http://localhost:8080', //CAMBIARLO
    credentials: true,
};

app.use(cors(corsOptions));

// Middlewares
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

// Seguridad con Helmet 
const helmet = require('helmet');
app.use(helmet()); 

// Log de depuración para archivos estáticos de solicitudes
app.use('/solicitudes', (req, res, next) => {
  console.log('Intentando servir archivo:', req.path);
  next();
});

// Servir archivos estáticos desde la carpeta 'solicitudes'
app.use('/solicitudes', express.static(path.join(__dirname, 'solicitudes')));

// Importar y usar routers
const usuariosRoutes = require('./api/usuarios');
const areasRoutes = require('./api/areas');
const respuestasRoutes = require('./api/respuestas');
const solicitudesRoutes = require('./api/solicitudes');
const tiposSolicitudesRoutes = require('./api/tipos_solicitudes');
const authClaveUnicaRoutes = require('./auth/auth_claveunica');
const authTrabajadoresRoutes = require('./auth/auth_trabajadores');
const preguntasFrecuentesRoutes = require('./api/preguntas_frecuentes');

app.use('/api/usuarios', usuariosRoutes);
app.use('/api/areas', areasRoutes);
app.use('/api/respuestas', respuestasRoutes);
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api/tipos_solicitudes', tiposSolicitudesRoutes);
app.use('/api/auth/claveunica', authClaveUnicaRoutes);
app.use('/api/auth/trabajadores', authTrabajadoresRoutes);
app.use('/api/preguntas_frecuentes', preguntasFrecuentesRoutes);

// Ruta raíz
app.get('/', (req, res) => {
    res.send('Servidor privado');
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});