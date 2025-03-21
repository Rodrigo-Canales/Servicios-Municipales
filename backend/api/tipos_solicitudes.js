const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Obtener todos los tipos de solicitudes
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.promise().query('SELECT * FROM Tipos_Solicitudes');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener tipos de solicitudes:', error);
        res.status(500).json({ message: 'Error al obtener tipos de solicitudes' });
    }
});

// Obtener un tipo de solicitud por ID
router.get('/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const [rows] = await db.promise().query('SELECT * FROM Tipos_Solicitudes WHERE id_tipo = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Tipo de solicitud no encontrado' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error al obtener tipo de solicitud por ID:', error);
        res.status(500).json({ message: 'Error al obtener tipo de solicitud por ID' });
    }
});

// Crear un nuevo tipo de solicitud
router.post('/', async (req, res) => {
    const { nombre_tipo, area_id } = req.body;
    try {
        const [result] = await db.promise().query(
            'INSERT INTO Tipos_Solicitudes (nombre_tipo, area_id) VALUES (?, ?)',
            [nombre_tipo, area_id]
        );
        res.status(201).json({ message: 'Tipo de solicitud creado exitosamente', id: result.insertId });
    } catch (error) {
        console.error('Error al crear tipo de solicitud:', error);
        res.status(500).json({ message: 'Error al crear tipo de solicitud' });
    }
}); 

// Actualizar un tipo de solicitud existente
router.put('/:id', async (req, res) => {
    const id = req.params.id;
    const { nombre_tipo, area_id } = req.body;
    try {
        const [result] = await db.promise().query(
            'UPDATE Tipos_Solicitudes SET nombre_tipo = ?, area_id = ? WHERE id_tipo = ?',
            [nombre_tipo, area_id, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Tipo de solicitud no encontrado' });
        }
        res.status(200).json({ message: 'Tipo de solicitud actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar tipo de solicitud:', error);
        res.status(500).json({ message: 'Error al actualizar tipo de solicitud' });
    }
}); 

// Eliminar un tipo de solicitud existente
router.delete('/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const [result] = await db.promise().query(
            'DELETE FROM Tipos_Solicitudes WHERE id_tipo = ?',
            [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Tipo de solicitud no encontrado' });
        }
        res.status(200).json({ message: 'Tipo de solicitud eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar tipo de solicitud:', error);
        res.status(500).json({ message: 'Error al eliminar tipo de solicitud' });
    }
});

module.exports = router;