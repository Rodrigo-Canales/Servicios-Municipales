// backend/routes/auth_trabajadores.js (COMPLETO Y CORREGIDO)
const express = require('express');
const bcrypt = require('bcrypt'); // Asegúrate que esté importado
const jwt = require('jsonwebtoken');
const db = require('../config/db'); // Importar la conexión a la BD
// No necesitas dotenv aquí si las variables de entorno vienen de Docker/Compose
// require('dotenv').config(); // Comentado o eliminado

const router = express.Router();

// Ruta de Login para Funcionarios y Administradores
router.post('/login', async (req, res) => {
    const { correo_electronico, password } = req.body;

    // Validación básica de entrada
    if (!correo_electronico || !password) {
        return res.status(400).json({ message: 'Correo electrónico y contraseña son requeridos.' });
    }

    try {
        // --- CONSULTA SQL MODIFICADA ---
        // Buscamos al usuario por correo, rol permitido y hacemos JOIN con Areas
        const query = `
            SELECT
                u.RUT,
                u.nombre,
                u.apellido,
                u.correo_electronico,
                u.hash_password,
                u.rol,
                u.area_id,          -- Seleccionamos el ID del área del usuario
                a.nombre_area       -- Seleccionamos el nombre del área usando el JOIN
            FROM Usuarios u
            LEFT JOIN Areas a ON u.area_id = a.id_area -- Unimos con Areas (LEFT JOIN por si Admin no tiene área)
            WHERE u.correo_electronico = ? AND u.rol IN ('Funcionario', 'Administrador')
        `;
        const [rows] = await db.query(query, [correo_electronico]);

        // Verificar si se encontró usuario
        if (rows.length === 0) {
            // No diferenciar si el correo no existe o el rol no es correcto por seguridad
            return res.status(401).json({ message: 'Credenciales incorrectas o rol no permitido.' });
        }

        const usuario = rows[0]; // Ahora 'usuario' contiene area_id y nombre_area
        const hashDeLaBD = usuario.hash_password;

        // Verificar si el usuario tiene un hash_password en la BD
        if (!hashDeLaBD) {
            console.warn(`[LOGIN TRABAJADOR] Usuario ${correo_electronico} (RUT: ${usuario.RUT}) NO tiene hash_password en la BD.`);
            // Considerar este caso como credenciales incorrectas para el usuario final
            return res.status(401).json({ message: 'Credenciales incorrectas.' });
        }

        // Comparar la contraseña proporcionada con el hash almacenado
        const esCorrecta = await bcrypt.compare(password, hashDeLaBD);

        if (!esCorrecta) {
            return res.status(401).json({ message: 'Credenciales incorrectas.' });
        }

        // --- Autenticación Exitosa ---

        // Preparar el Payload para el Token JWT
        // Incluimos solo lo esencial y no sensible que pueda necesitarse
        // directamente del token en el futuro (rut y rol son comunes).
        const payload = {
            rut: usuario.RUT,
            rol: usuario.rol
            // Podrías añadir area_id aquí si fuera estrictamente necesario decodificarlo
            // directamente del token en el frontend, pero generalmente es mejor
            // enviarlo en el objeto 'user' de la respuesta.
            // area_id: usuario.area_id
        };

        // Obtener Secreto y Tiempo de Expiración desde variables de entorno
        const secret = process.env.JWT_SECRET;
        const expiresIn = process.env.JWT_EXPIRES_IN || '2h'; // Default 2 horas

        // Verificación CRUCIAL del Secreto JWT
        if (!secret) {
            console.error("¡ERROR CRÍTICO EN LOGIN TRABAJADOR: JWT_SECRET no está definido en las variables de entorno!");
            // No dar detalles específicos al cliente
            return res.status(500).json({ message: 'Error interno de configuración del servidor.' });
        }

        // Generar el Token JWT
        const token = jwt.sign(payload, secret, { expiresIn: expiresIn });

        // --- Preparar los datos del usuario para enviar al frontend ---
        // Incluimos TODOS los datos necesarios para el estado inicial del frontend
        const userData = {
            rut: usuario.RUT,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            rol: usuario.rol,
            correo_electronico: usuario.correo_electronico || null, // Fallback a null si no existe
            area_id: usuario.area_id || null,          // <-- Incluido (con fallback a null)
            nombre_area: usuario.nombre_area || null   // <-- Incluido (con fallback a null)
        };

        // Log Opcional en el servidor para verificar los datos enviados
        console.log(`[LOGIN TRABAJADOR] Login exitoso para ${userData.rol} RUT: ${userData.rut}. Enviando datos:`, { rut: userData.rut, rol: userData.rol, area_id: userData.area_id, nombre_area: userData.nombre_area });

        // Enviar respuesta exitosa con el token y los datos del usuario
        res.status(200).json({
            message: 'Inicio de sesión exitoso',
            token: token, // El token JWT para guardar en el cliente
            user: userData // El objeto con los datos del usuario para el estado del frontend
        });

    } catch (error) {
        // Manejo de errores inesperados durante el proceso
        console.error('--- ERROR EN BLOQUE CATCH de LOGIN TRABAJADOR ---');
        console.error('Error durante el proceso de login:', error);
        console.error('--- FIN ERROR EN BLOQUE CATCH de LOGIN TRABAJADOR ---');
        res.status(500).json({ message: 'Error interno del servidor. Por favor, intente más tarde.' });
    }
});

// Asegúrate de exportar el router al final del archivo
module.exports = router;