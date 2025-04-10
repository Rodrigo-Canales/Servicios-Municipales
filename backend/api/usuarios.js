// backend/routes/usuarios.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');
// *** 1. Importar los middlewares de autenticación y autorización ***
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Obtener todos los usuarios (Mantenido como estaba)
router.get('/', protect, restrictTo('Administrador'), async (req, res) => {
    try {
        const [rows] = await db.query('SELECT RUT, nombre, apellido, correo_electronico, rol, area_id FROM Usuarios');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error interno al obtener usuarios' });
    }
});

// Obtener un usuario por RUT (Mantenido como estaba)
router.get('/:rut', protect, restrictTo('Administrador'), async (req, res) => {
    const rut = req.params.rut;
    try {
        const [rows] = await db.query('SELECT RUT, nombre, apellido, correo_electronico, rol, area_id FROM Usuarios WHERE RUT = ?', [rut]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error al obtener usuario por RUT:', error);
        res.status(500).json({ message: 'Error interno al obtener usuario por RUT' });
    }
});

// Crear Usuario (Restaurada lógica original completa)
// Crear Usuario (CON LOGS DE DEPURACIÓN DETALLADOS)
router.post('/', protect, restrictTo('Administrador'), async (req, res) => {
    // El middleware protect/restrictTo está COMENTADO TEMPORALMENTE para esta prueba

    const { rut, nombre, apellido, correo_electronico, password, rol, area_id } = req.body;

    // Validación básica de campos obligatorios
    if (!rut || !nombre || !apellido) {
        console.error('[POST /api/usuarios] Error de Validación: Faltan RUT, Nombre o Apellido.');
        return res.status(400).json({ message: 'RUT, Nombre y Apellido son obligatorios.' });
    }
    // Validar rol
    const rolesPermitidos = ['Vecino', 'Funcionario', 'Administrador'];
    if (rol && !rolesPermitidos.includes(rol)) {
        console.error(`[POST /api/usuarios] Error de Validación: Rol inválido "${rol}".`);
        return res.status(400).json({ message: `Rol inválido. Roles permitidos: ${rolesPermitidos.join(', ')}.` });
    }


    try {
        let hashedPassword = null;

        // Hashear contraseña solo si se proporciona una no vacía
        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10); // Asegúrate que bcrypt esté importado arriba
            hashedPassword = await bcrypt.hash(password, salt);
        } else {
        }

        // Preparar valores para la inserción
        const valuesToInsert = [
            rut,
            nombre,
            apellido,
            correo_electronico || null,
            hashedPassword, // Usamos la variable que puede ser string o null
            rol || 'Vecino',
            area_id || null
        ];

        // Insertar en la base de datos
        const [result] = await db.query( // Asegúrate que db esté importado y conectado arriba
            'INSERT INTO Usuarios (RUT, nombre, apellido, correo_electronico, hash_password, rol, area_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            valuesToInsert
        );

        // Log después de la inserción exitosa (ajustado para middleware desactivado)
        res.status(201).json({ message: 'Usuario creado exitosamente' });

    } catch (error) {
        // Log detallado en caso de error
        console.error('--- ERROR EN BLOQUE CATCH de POST /api/usuarios ---');
        const adminInfo = req.user ? `(Admin: ${req.user.rut})` : '(Middleware Protect Desactivado)'; // Aún útil tenerlo así
        console.error(`Contexto: ${adminInfo}`);
        // Imprimir el objeto de error completo para ver todos los detalles
        console.error('Objeto de Error Completo:', error);
        console.error('--- FIN ERROR EN BLOQUE CATCH ---');

        // Manejo de errores específicos
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: `El RUT ${rut} ya está registrado.` });
        }
        // El código ER_NO_REFERENCED_ROW_2 es correcto para claves foráneas en InnoDB
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ message: `El área con ID ${area_id} no existe.` });
        }
        // Respuesta genérica si no es un error conocido
        res.status(500).json({ message: 'Error interno al crear usuario' });
    }
});

// Actualizar Usuario (Restaurada lógica original completa)
router.put('/:rut', protect, restrictTo('Administrador'), async (req, res) => {
    // El middleware ya verificó rol Admin
    const rut = req.params.rut;
    const { correo_electronico, password, rol, area_id, deletePassword } = req.body;

    // Validación de Rol si se proporciona
    const rolesPermitidos = ['Vecino', 'Funcionario', 'Administrador'];
    if (rol && !rolesPermitidos.includes(rol)) {
        return res.status(400).json({ message: `Rol inválido. Roles permitidos: ${rolesPermitidos.join(', ')}.` });
    }
    // Validación de conflicto contraseña
    if (deletePassword === true && password && password.trim() !== '') {
        return res.status(400).json({ message: 'No se puede eliminar y establecer una nueva contraseña al mismo tiempo.' });
    }

    try {
        // Construcción dinámica de la query (como en tu original)
        let query = 'UPDATE Usuarios SET ';
        const values = [];
        const updates = [];

        // Añadir campos a actualizar si están presentes en el body
        if ('correo_electronico' in req.body) {
            updates.push('correo_electronico = ?');
            values.push(correo_electronico || null); // Permite NULL
        }
        if ('rol' in req.body) {
            // La validación del rol ya se hizo arriba
            updates.push('rol = ?');
            values.push(rol);
        }
        if ('area_id' in req.body) {
            updates.push('area_id = ?');
            values.push(area_id || null); // Permite NULL
        }

        // Lógica de Contraseña (como en tu original)
        if (deletePassword === true) {
            updates.push('hash_password = NULL');
        } else if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push('hash_password = ?');
            values.push(hashedPassword);
        }
        // Si no se cumple ninguna condición de contraseña, no se añade a 'updates'

        // Verificar si hay algo para actualizar
        if (updates.length === 0) {
            return res.status(400).json({ message: 'No se proporcionaron campos válidos para actualizar.' });
        }

        // Construir y Ejecutar la Query Final
        query += updates.join(', ');
        query += ' WHERE RUT = ?';
        values.push(rut);

        const [result] = await db.query(query, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.status(200).json({ message: 'Usuario actualizado exitosamente' });

    } catch (error) {
        console.error(`[PUT /api/usuarios/${rut}] (Admin: ${req.user.rut}) Error al actualizar usuario:`, error);
        if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_NO_REFERENCED_ROW') {
            return res.status(400).json({ message: `El área proporcionada no existe.` });
        }
        res.status(500).json({ message: 'Error interno al actualizar usuario' });
    }
});

// Eliminar Usuario (Mantenido como estaba)
router.delete('/:rut', protect, restrictTo('Administrador'), async (req, res) => {
    // El middleware ya verificó rol Admin
    const rut = req.params.rut;
    try {
        const [result] = await db.query('DELETE FROM Usuarios WHERE RUT = ?', [rut]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.status(200).json({ message: 'Usuario eliminado exitosamente' });

    } catch (error) {
        console.error(`[DELETE /api/usuarios/${rut}] (Admin: ${req.user.rut}) Error al eliminar usuario:`, error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
            return res.status(409).json({ message: 'No se puede eliminar el usuario porque tiene solicitudes o respuestas asociadas.' });
        }
        res.status(500).json({ message: 'Error interno al eliminar usuario' });
    }
});

module.exports = router;