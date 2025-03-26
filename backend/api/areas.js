const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Verifica si db está retornando una instancia con promesas

// Obtener todas las áreas
router.get('/', async (req, res) => {
    try {
        // Verifica que db.query sea compatible con promesas
        const [rows] = await db.query('SELECT * FROM Areas');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener áreas:', error);
        res.status(500).json({ message: 'Error al obtener áreas' });
    }
});

// Obtener una área por ID
router.get('/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const [rows] = await db.query('SELECT * FROM Areas WHERE id_area = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Área no encontrada' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error al obtener área por ID:', error);
        res.status(500).json({ message: 'Error al obtener área por ID' });
    }
});

// Crear una nueva área
router.post('/', async (req, res) => {
    const { nombre_area } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO Areas (nombre_area) VALUES (?)',
            [nombre_area]
        );
        res.status(201).json({ message: 'Área creada exitosamente', id: result.insertId });
    } catch (error) {
        console.error('Error al crear área:', error);
        res.status(500).json({ message: 'Error al crear área' });
    }
});

// Actualizar una área existente
router.put('/:id', async (req, res) => {
    const id = req.params.id;
    const { nombre_area } = req.body;
    try {
        const [result] = await db.query(
            'UPDATE Areas SET nombre_area = ? WHERE id_area = ?',
            [nombre_area, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Área no encontrada' });
        }
        res.status(200).json({ message: 'Área actualizada exitosamente' });
    } catch (error) {
        console.error('Error al actualizar área:', error);
        res.status(500).json({ message: 'Error al actualizar área' });
    }
});

// Eliminar una área existente
router.delete('/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const [result] = await db.query(
            'DELETE FROM Areas WHERE id_area = ?',
            [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Área no encontrada' });
        }
        res.status(200).json({ message: 'Área eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar área:', error);
        res.status(500).json({ message: 'Error al eliminar área' });
    }
});

module.exports = router;


// funcionana todas