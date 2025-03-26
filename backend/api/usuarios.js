const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');

// Obtener todos los usuarios
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Usuarios');
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
        const [rows] = await db.query('SELECT * FROM Usuarios WHERE RUT = ?', [rut]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        const usuario = { ...rows[0] };
        delete usuario.hash_password;
        res.status(200).json(usuario);
    } catch (error) {
        console.error('Error al obtener usuario por RUT:', error);
        res.status(500).json({ message: 'Error al obtener usuario por RUT' });
    }
});

// Crear Usuario (Permite usuarios con o sin contraseña)
router.post('/', async (req, res) => {
    const { rut, nombre, apellido, correo_electronico, password, rol, area_id } = req.body;

    try {
        let hashedPassword = null;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(password, salt);
        }

        const [result] = await db.query(
            'INSERT INTO Usuarios (RUT, nombre, apellido, correo_electronico, hash_password, rol, area_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                rut,
                nombre,
                apellido,
                correo_electronico || null,
                hashedPassword,
                rol || 'Usuario',
                area_id || null
            ]
        );

        res.status(201).json({ message: 'Usuario creado exitosamente' });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ message: 'Error al crear usuario' });
    }
});

// Actualizar Usuario 
router.put('/:rut', async (req, res) => {
    const rut = req.params.rut;
    const { correo_electronico, password, rol, area_id } = req.body;

    try {
        let hashedPassword = null;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        // Verificar si se necesita actualizar la contraseña o no
        const query = password
            ? 'UPDATE Usuarios SET correo_electronico = ?, hash_password = ?, rol = ?, area_id = ? WHERE RUT = ?'
            : 'UPDATE Usuarios SET correo_electronico = ?, rol = ?, area_id = ? WHERE RUT = ?';

        const values = password
            ? [correo_electronico, hashedPassword, rol, area_id, rut]
            : [correo_electronico, rol, area_id, rut];

        const [result] = await db.query(query, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.status(200).json({ message: 'Usuario actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ message: 'Error al actualizar usuario' });
    }
});

// Eliminar Usuario
router.delete('/:rut', async (req, res) => {
    const rut = req.params.rut;
    try {
        const [result] = await db.query('DELETE FROM Usuarios WHERE RUT = ?', [rut]);
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

