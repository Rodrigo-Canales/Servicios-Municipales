// backend/routes/auth_trabajadores.js
const express = require('express');
const bcrypt = require('bcrypt'); // Asegúrate que esté importado
const jwt = require('jsonwebtoken');
const db = require('../config/db');
// OJO: dotenv aquí podría intentar leer ../.env relativo a ESTE archivo,
// lo cual no funcionaría bien. En Docker, las variables vienen de process.env
// inyectadas por Docker Compose desde el .env RAÍZ. Es mejor quitar esta línea
// si solo confías en process.env dentro de Docker.
// require('dotenv').config({ path: '../.env' });

const router = express.Router();

// Ruta de Login con Logs de Depuración Detallados
router.post('/login', async (req, res) => {
    console.log('--- INICIO LOGIN ---');
    console.log('Login REQ.BODY:', req.body);

    const { correo_electronico, password } = req.body;

    // Validación básica de entrada
    if (!correo_electronico || !password) {
        console.log('[LOGIN] Error: Correo o contraseña no proporcionados en el body.');
        return res.status(400).json({ message: 'Correo electrónico y contraseña son requeridos.' });
    }

    try {
        console.log(`[LOGIN] Buscando usuario con correo: ${correo_electronico}`);

        // Buscar al usuario por correo y rol permitido
        const query = `
            SELECT RUT, nombre, apellido, correo_electronico, hash_password, rol
            FROM Usuarios
            WHERE correo_electronico = ? AND rol IN ('Funcionario', 'Administrador')
        `;
        const [rows] = await db.query(query, [correo_electronico]);

        console.log('[LOGIN] Resultado de la búsqueda de usuario (rows.length):', rows.length);

        // Verificar si se encontró usuario
        if (rows.length === 0) {
            console.log(`[LOGIN] Usuario no encontrado o rol no permitido para correo: ${correo_electronico}`);
            return res.status(401).json({ message: 'Credenciales incorrectas.' }); // Mensaje genérico
        }

        const usuario = rows[0];
        const hashDeLaBD = usuario.hash_password;

        console.log('[LOGIN] Usuario encontrado:', usuario.RUT, usuario.rol);
        console.log('[LOGIN] Hash recuperado de la BD:', hashDeLaBD);
        console.log('[LOGIN] Tipo de Hash recuperado:', typeof hashDeLaBD);
        console.log('[LOGIN] Password enviada por el usuario:', password);

        // Verificar si el usuario tiene un hash_password
        if (!hashDeLaBD) {
            console.warn(`[LOGIN] Usuario ${correo_electronico} (RUT: ${usuario.RUT}) NO tiene hash_password en la BD.`);
            return res.status(401).json({ message: 'Credenciales incorrectas.' });
        }

        // Comparar contraseñas
        console.log('[LOGIN] Comparando contraseñas con bcrypt.compare...');
        const esCorrecta = await bcrypt.compare(password, hashDeLaBD); // password (plain) vs hash
        console.log('[LOGIN] Resultado de bcrypt.compare:', esCorrecta); // <-- ¡¡RESULTADO CLAVE!!

        if (!esCorrecta) {
            console.log(`[LOGIN] Contraseña INCORRECTA para ${correo_electronico}`);
            return res.status(401).json({ message: 'Credenciales incorrectas.' });
        }

        console.log(`[LOGIN] Contraseña CORRECTA para ${correo_electronico}. Generando token...`);

        // --- Autenticación Exitosa ---

        // Preparar el Payload para el JWT
        const payload = {
            rut: usuario.RUT,
            rol: usuario.rol
        };

        // Obtener Secreto y Expiración (AHORA confía en process.env inyectado por Docker Compose)
        const secret = process.env.JWT_SECRET;
        const expiresIn = process.env.JWT_EXPIRES_IN || '2h';

        // Verificación CRUCIAL del Secreto
        if (!secret) {
            console.error("¡ERROR CRÍTICO: JWT_SECRET no está definido en las variables de entorno del contenedor!");
            return res.status(500).json({ message: 'Error interno de configuración del servidor.' });
        }

        // Generar el Token JWT
        const token = jwt.sign(payload, secret, { expiresIn: expiresIn });

        console.log(`[LOGIN] Token generado para ${correo_electronico}`);

        // Preparar los datos del usuario para enviar al frontend
        const userData = {
            rut: usuario.RUT,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            rol: usuario.rol,
            correo_electronico: usuario.correo_electronico || null
        };

        // Enviar respuesta exitosa
        console.log(`Login exitoso para: ${correo_electronico} (Rol: ${usuario.rol})`);
        res.status(200).json({
            message: 'Inicio de sesión exitoso',
            token: token,
            user: userData
        });

    } catch (error) {
        console.error('--- ERROR EN BLOQUE CATCH de LOGIN ---');
        console.error('Error durante el proceso de login:', error);
        console.error('--- FIN ERROR EN BLOQUE CATCH de LOGIN ---');
        res.status(500).json({ message: 'Error interno del servidor. Por favor, intente más tarde.' });
    }
    console.log('--- FIN LOGIN ---');
});

// Asegúrate de exportar el router al final del archivo
module.exports = router;