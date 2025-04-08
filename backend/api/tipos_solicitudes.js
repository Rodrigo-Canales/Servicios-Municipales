//backend/api/tipos_solicitudes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Obtener todos los tipos de solicitudes con el nombre del área
router.get('/', protect, async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT t.*, a.nombre_area 
                FROM Tipos_Solicitudes t
                INNER JOIN Areas a ON t.area_id = a.id_area`
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener tipos de solicitudes:', error);
        res.status(500).json({ message: 'Error al obtener tipos de solicitudes' });
    }
});

// Obtener un tipo de solicitud por ID con el nombre del área
router.get('/:id', protect, async (req, res) => {
    const id = req.params.id;
    try {
        const [rows] = await db.query(
            `SELECT t.*, a.nombre_area 
                FROM Tipos_Solicitudes t
                INNER JOIN Areas a ON t.area_id = a.id_area
                WHERE t.id_tipo = ?`,
            [id]
        );
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
router.post('/', protect, restrictTo('Administrador'), async (req, res) => {
    const { nombre_tipo, descripcion, area_id } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO Tipos_Solicitudes (nombre_tipo, descripcion, area_id) VALUES (?, ?, ?)',
            [nombre_tipo, descripcion, area_id]
        );
        res.status(201).json({ message: 'Tipo de solicitud creado exitosamente', id: result.insertId });
    } catch (error) {
        console.error('Error al crear tipo de solicitud:', error);
        res.status(500).json({ message: 'Error al crear tipo de solicitud' });
    }
});

// Actualizar un tipo de solicitud existente
router.put('/:id', protect, restrictTo('Administrador'), async (req, res) => {
    const id = req.params.id;
    const { nombre_tipo, descripcion, area_id } = req.body;
    try {
        const [result] = await db.query(
            'UPDATE Tipos_Solicitudes SET nombre_tipo = ?, descripcion = ?, area_id = ? WHERE id_tipo = ?',
            [nombre_tipo, descripcion, area_id, id]
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
router.delete('/:id', protect, restrictTo('Administrador'), async (req, res) => {
    const id = req.params.id;
    try {
        const [result] = await db.query(
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

// Obtener tipos de solicitudes por área
router.get('/area/:areaId', protect, async (req, res) => {
    const areaId = req.params.areaId;
    try {
        const [rows] = await db.query(`
            SELECT ts.id_tipo, ts.nombre_tipo, ts.descripcion, a.nombre_area
            FROM Tipos_Solicitudes ts
            JOIN Areas a ON ts.area_id = a.id_area
            WHERE ts.area_id = ?
        `, [areaId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener tipos de solicitudes por área:', error);
        res.status(500).json({ message: 'Error al obtener tipos de solicitudes por área' });
    }
});


module.exports = router;
