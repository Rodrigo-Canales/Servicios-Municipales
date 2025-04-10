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
    const { correo_electronico, password } = req.body;

    // Validación básica de entrada
    if (!correo_electronico || !password) {
        return res.status(400).json({ message: 'Correo electrónico y contraseña son requeridos.' });
    }

    try {
        // Buscar al usuario por correo y rol permitido
        const query = `
            SELECT RUT, nombre, apellido, correo_electronico, hash_password, rol
            FROM Usuarios
            WHERE correo_electronico = ? AND rol IN ('Funcionario', 'Administrador')
        `;
        const [rows] = await db.query(query, [correo_electronico]);

        // Verificar si se encontró usuario
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Credenciales incorrectas.' }); // Mensaje genérico
        }

        const usuario = rows[0];
        const hashDeLaBD = usuario.hash_password;

        // Verificar si el usuario tiene un hash_password
        if (!hashDeLaBD) {
            console.warn(`[LOGIN] Usuario ${correo_electronico} (RUT: ${usuario.RUT}) NO tiene hash_password en la BD.`);
            return res.status(401).json({ message: 'Credenciales incorrectas.' });
        }

        // Comparar contraseñas
        const esCorrecta = await bcrypt.compare(password, hashDeLaBD); // password (plain) vs hash

        if (!esCorrecta) {
            return res.status(401).json({ message: 'Credenciales incorrectas.' });
        }

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

        // Preparar los datos del usuario para enviar al frontend
        const userData = {
            rut: usuario.RUT,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            rol: usuario.rol,
            correo_electronico: usuario.correo_electronico || null
        };

        // Enviar respuesta exitosa
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
});

// Asegúrate de exportar el router al final del archivo
module.exports = router;