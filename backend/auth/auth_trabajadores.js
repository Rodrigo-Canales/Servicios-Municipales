// backend/routes/auth_trabajadores.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // *** 1. Importar jsonwebtoken ***
const db = require('../config/db'); // Asegúrate que la ruta a tu config de BD sea correcta
require('dotenv').config({ path: '../.env' }); // *** 2. Cargar variables de entorno (ajusta la ruta a tu .env si es necesario) ***

const router = express.Router();

/**
 * @route POST /api/auth/trabajadores/login
 * @desc Autentica a un usuario con rol 'Funcionario' o 'Administrador' y devuelve un JWT.
 * @access Public
 */
router.post('/login', async (req, res) => {
    // Extraer credenciales (sin cambios)
    const { correo_electronico, password } = req.body;

    // Validación básica de entrada (sin cambios)
    if (!correo_electronico || !password) {
        return res.status(400).json({ message: 'Correo electrónico y contraseña son requeridos.' });
    }

    try {
        // Buscar al usuario (sin cambios en la query)
        const query = `
            SELECT RUT, nombre, apellido, correo_electronico, hash_password, rol
            FROM Usuarios
            WHERE correo_electronico = ? AND rol IN ('Funcionario', 'Administrador')
        `;
        const [rows] = await db.query(query, [correo_electronico]);

        // Verificar si se encontró usuario (sin cambios)
        if (rows.length === 0) {
            console.log(`Intento de login fallido (usuario no encontrado o rol incorrecto): ${correo_electronico}`);
            return res.status(401).json({ message: 'Credenciales incorrectas.' });
        }

        const usuario = rows[0];

        // Verificar hash_password (sin cambios)
        if (!usuario.hash_password) {
            console.warn(`Usuario ${correo_electronico} (RUT: ${usuario.RUT}) no tiene hash_password en la BD.`);
            return res.status(401).json({ message: 'Credenciales incorrectas.' });
        }

        // Comparar contraseña (sin cambios)
        const validPassword = await bcrypt.compare(password, usuario.hash_password);

        // Verificar contraseña válida (sin cambios)
        if (!validPassword) {
            console.log(`Intento de login fallido (contraseña incorrecta): ${correo_electronico}`);
            return res.status(401).json({ message: 'Credenciales incorrectas.' });
        }

        // --- Autenticación Exitosa ---

        // *** 3. Preparar el Payload para el JWT ***
        //    Incluye información esencial y no sensible para identificar al usuario y su rol.
        const payload = {
            rut: usuario.RUT, // Identificador único del usuario
            rol: usuario.rol  // Rol para control de acceso
            // Puedes añadir más datos si son necesarios frecuentemente y no sensibles,
            // pero mantenlo ligero. NO incluyas la contraseña.
        };

        // *** 4. Obtener Secreto y Expiración de .env ***
        const secret = process.env.JWT_SECRET;
        const expiresIn = process.env.JWT_EXPIRES_IN || '1h'; // Usa valor de .env o default '1h'

        // *** 5. Verificación CRUCIAL del Secreto ***
        if (!secret) {
            console.error("¡ERROR CRÍTICO: JWT_SECRET no está definido en el archivo .env!");
            // En producción, podrías querer detener la aplicación o alertar de forma más robusta.
            return res.status(500).json({ message: 'Error interno de configuración del servidor.' });
        }

        // *** 6. Generar el Token JWT ***
        const token = jwt.sign(payload, secret, { expiresIn: expiresIn });

        // 7. Preparar los datos del usuario para enviar al frontend (sin cambios)
        //    Esto es útil para que el frontend tenga la info inicial sin decodificar el token.
        const userData = {
            rut: usuario.RUT,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            rol: usuario.rol,
            correo_electronico: usuario.correo_electronico || null
        };

        // 8. Enviar respuesta exitosa con el TOKEN y los datos del usuario
        console.log(`Login exitoso para: ${correo_electronico} (Rol: ${usuario.rol})`);
        res.status(200).json({
            message: 'Inicio de sesión exitoso',
            token: token,   // <-- El token JWT generado
            user: userData  // <-- Los datos del usuario para el frontend
        });

    } catch (error) {
        // Manejo de errores (sin cambios)
        console.error('Error crítico durante el proceso de login:', error);
        res.status(500).json({ message: 'Error interno del servidor. Por favor, intente más tarde.' });
    }
});

// Otros endpoints relacionados con auth...

module.exports = router;