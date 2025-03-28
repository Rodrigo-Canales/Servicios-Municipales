const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db'); 


// Obtener todos los usuarios
router.get('/', async (req, res) => {
    try {
        // Selecciona todos los campos EXCEPTO hash_password para la lista general
        const [rows] = await db.query('SELECT RUT, nombre, apellido, correo_electronico, rol, area_id FROM Usuarios');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error interno al obtener usuarios' });
    }
});


// Obtener un usuario por RUT
router.get('/:rut', async (req, res) => {
    const rut = req.params.rut;
    try {
        // Selecciona todos los campos EXCEPTO hash_password
        const [rows] = await db.query('SELECT RUT, nombre, apellido, correo_electronico, rol, area_id FROM Usuarios WHERE RUT = ?', [rut]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        // No es necesario borrar hash_password porque no se seleccionó
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error al obtener usuario por RUT:', error);
        res.status(500).json({ message: 'Error interno al obtener usuario por RUT' });
    }
});


// Crear Usuario (Permite usuarios con o sin contraseña)
router.post('/', async (req, res) => {
    const { rut, nombre, apellido, correo_electronico, password, rol, area_id } = req.body;

    // Validación básica de campos obligatorios
    if (!rut || !nombre || !apellido) {
        return res.status(400).json({ message: 'RUT, Nombre y Apellido son obligatorios.' });
    }
    // Validar rol 
    const rolesPermitidos = ['Vecino', 'Funcionario', 'Administrador'];
    if (rol && !rolesPermitidos.includes(rol)) {
        return res.status(400).json({ message: `Rol inválido. Roles permitidos: ${rolesPermitidos.join(', ')}.` });
    }

    try {
        let hashedPassword = null;
        // Hashear contraseña solo si se proporciona una
        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10); // Usar salt para mayor seguridad
            hashedPassword = await bcrypt.hash(password, salt);
            console.log(`[POST /api/usuarios] Hashing password for RUT: ${rut}`);
        }

        // Insertar en la base de datos
        const [result] = await db.query(
            'INSERT INTO Usuarios (RUT, nombre, apellido, correo_electronico, hash_password, rol, area_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                rut,
                nombre,
                apellido,
                correo_electronico || null,
                hashedPassword,
                rol || 'Vecino',
                area_id || null
            ]
        );

        console.log(`[POST /api/usuarios] Usuario creado exitosamente con RUT: ${rut}, ID: ${result.insertId}`);
        res.status(201).json({ message: 'Usuario creado exitosamente' });

    } catch (error) {
        console.error('[POST /api/usuarios] Error al crear usuario:', error);
        // Manejar error de duplicado de RUT
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: `El RUT ${rut} ya está registrado.` });
        }
        // Manejar error de clave foránea (area_id inválido)
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ message: `El área con ID ${area_id} no existe.` });
        }
        res.status(500).json({ message: 'Error interno al crear usuario' });
    }
});



// Actualizar Usuario (Maneja deletePassword y campos individuales)
router.put('/:rut', async (req, res) => {
    const rut = req.params.rut;
    // Extraer todos los posibles campos del body
    const { correo_electronico, password, rol, area_id, deletePassword } = req.body;

    // Validación de Rol si se proporciona
    const rolesPermitidos = ['Vecino', 'Funcionario', 'Administrador'];
    if (rol && !rolesPermitidos.includes(rol)) {
        return res.status(400).json({ message: `Rol inválido. Roles permitidos: ${rolesPermitidos.join(', ')}.` });
    }
    // Asegurarse de que no se intente eliminar y establecer contraseña al mismo tiempo
    if (deletePassword === true && password && password.trim() !== '') {
        return res.status(400).json({ message: 'No se puede eliminar y establecer una nueva contraseña al mismo tiempo.' });
    }
    try {
        let query = 'UPDATE Usuarios SET ';
        const values = [];
        const updates = [];
        if ('correo_electronico' in req.body) {
            updates.push('correo_electronico = ?');
            // Permitir establecer correo a NULL si se envía explícitamente null o ''
            values.push(correo_electronico || null);
        }
        if ('rol' in req.body) {
            if (!rol || !rolesPermitidos.includes(rol)) {
                return res.status(400).json({ message: `Rol proporcionado inválido.` });
            }
            updates.push('rol = ?');
            values.push(rol);
        }
        if ('area_id' in req.body) {
            // Permitir establecer area_id a NULL si se envía null o ''
            updates.push('area_id = ?');
            values.push(area_id || null);
        }

        // Lógica de Contraseña (basada en deletePassword y password)
        if (deletePassword === true) {
            // Opción 1: Eliminar contraseña (establecer a NULL)
            updates.push('hash_password = NULL');
            console.log(`[PUT /api/usuarios/${rut}] Setting password to NULL.`);
        } else if (password && password.trim() !== '') {
            // Opción 2: Establecer NUEVA contraseña (hashearla)
            const hashedPassword = await bcrypt.hash(password, 10); // Costo 10 es un buen balance
            updates.push('hash_password = ?');
            values.push(hashedPassword);
            console.log(`[PUT /api/usuarios/${rut}] Setting new password hash.`);
        }
        // Opción 3: Si deletePassword no es true Y password está vacío/no se envió,
        // NO se añade 'hash_password' a 'updates', por lo que la contraseña actual se mantiene.

        // Verificar si hay algo para actualizar
        if (updates.length === 0) {
            // No se envió ningún campo válido para actualizar
            return res.status(400).json({ message: 'No se proporcionaron campos válidos para actualizar.' });
        }

        // Construir y Ejecutar la Query Final
        query += updates.join(', '); // Unir las partes del SET: 'campo1 = ?, campo2 = ?'
        query += ' WHERE RUT = ?'; // Añadir la condición WHERE
        values.push(rut); // Añadir el RUT al final del array de valores

        console.log(`[PUT /api/usuarios/${rut}] Executing query: ${query}`);
        // console.log(`[PUT /api/usuarios/${rut}] With values:`, values); // Cuidado al loguear hashes

        const [result] = await db.query(query, values);

        // Verificar si alguna fila fue afectada
        if (result.affectedRows === 0) {
            // Si no se afectó ninguna fila, el RUT no existía
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.status(200).json({ message: 'Usuario actualizado exitosamente' });

    } catch (error) {
        console.error(`[PUT /api/usuarios/${rut}] Error al actualizar usuario:`, error);
        if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_NO_REFERENCED_ROW') {
            return res.status(400).json({ message: `El área proporcionada no existe.` });
        }
        res.status(500).json({ message: 'Error interno al actualizar usuario' });
    }
});


// Eliminar Usuario
router.delete('/:rut', async (req, res) => {
    const rut = req.params.rut;
    try {
        console.log(`[DELETE /api/usuarios/${rut}] Attempting to delete user.`);
        // Ejecutar la consulta DELETE
        const [result] = await db.query('DELETE FROM Usuarios WHERE RUT = ?', [rut]);

        // Verificar si se eliminó alguna fila
        if (result.affectedRows === 0) {
            console.log(`[DELETE /api/usuarios/${rut}] User not found.`);
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        console.log(`[DELETE /api/usuarios/${rut}] User deleted successfully.`);
        // Éxito
        res.status(200).json({ message: 'Usuario eliminado exitosamente' });

    } catch (error) {
        console.error(`[DELETE /api/usuarios/${rut}] Error al eliminar usuario:`, error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
            console.log(`[DELETE /api/usuarios/${rut}] Cannot delete user due to foreign key constraints.`);
            return res.status(409).json({ message: 'No se puede eliminar el usuario porque tiene solicitudes o respuestas asociadas.' });
        }
        res.status(500).json({ message: 'Error interno al eliminar usuario' });
    }
});

module.exports = router;
