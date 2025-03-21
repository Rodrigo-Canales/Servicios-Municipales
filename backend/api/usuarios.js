// backend/api/usuarios.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); // Importa bcrypt para hashear contraseñas
const db = require('../config/db');

// Obtener todos los usuarios (con precaución - solo para administradores)
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.promise().query('SELECT * FROM Usuarios');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
});

// Obtener un usuario por RUT
router.get('/:rut', async (req, res) => {
    const rut = req.params.rut;
    try {
        const [rows] = await db.promise().query('SELECT * FROM Usuarios WHERE RUT = ?', [rut]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        // No devolver la contraseña hasheada por seguridad
        const usuario = { ...rows[0] };
        delete usuario.hash_contrasena;
        res.status(200).json(usuario);
    } catch (error) {
        console.error('Error al obtener usuario por RUT:', error);
        res.status(500).json({ message: 'Error al obtener usuario por RUT' });
    }
});

// Crear Usuario
router.post('/', async (req, res) => {
    const { rut, nombres, apellidos, correo_electronico, password, rol, area_id } = req.body;

    try {
        let hashedPassword = null; 
        if (password) {
            const salt = await bcrypt.genSalt(10); // Generar un salt
            hashedPassword = await bcrypt.hash(password, salt); // Aplicar el salt antes de hashear
        }

        const [result] = await db.promise().query(
            'INSERT INTO Usuarios (RUT, nombres, apellidos, correo_electronico, hash_contra, rol, area_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [rut, nombres, apellidos, correo_electronico || null, hashedPassword, rol || null, area_id || null]
        );

        res.status(201).json({ message: 'Usuario creado exitosamente'});
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ message: 'Error al crear usuario' });
    }
});

//Actualizar Usuario 
router.put('/:rut', async (req, res) => {
    const rut = req.params.rut;
    const { correo_electronico, password, rol, area_id } = req.body;

    try {
        // Hashear la contraseña si se proporciona
        let hashedPassword = null;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        const [result] = await db.promise().query(
            'UPDATE Usuarios SET correo_electronico = ?, hash_contra = ?, rol = ?, area_id = ? WHERE RUT = ?', // Corregido: hash_contra
            [correo_electronico, hashedPassword, rol, area_id, rut]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.status(200).json({ message: 'Usuario actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ message: 'Error al actualizar usuario' });
    }
});


// Eliminar un usuario existente
router.delete('/:rut', async (req, res) => {
    const rut = req.params.rut;
    try {
        const [result] = await db.promise().query(
            'DELETE FROM Usuarios WHERE RUT = ?',
            [rut]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.status(200).json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ message: 'Error al eliminar usuario' });
    }
});

module.exports = router;