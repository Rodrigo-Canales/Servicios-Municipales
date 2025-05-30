// backend/routes/areas.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
// *** 1. Importar los middlewares de autenticación y autorización ***
const { protect, restrictTo } = require('../middleware/authMiddleware');


// Obtener todas las áreas
router.get('/', protect, async (req, res) => {
    // Middleware 'protect' ya verificó el token
    // req.user contiene { rut, rol }
    try {
        const [rows] = await db.query('SELECT * FROM Areas ORDER BY nombre_area ASC'); // Ordenar alfabéticamente
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener áreas:', error);
        res.status(500).json({ message: 'Error al obtener áreas' });
    }
});

// Obtener una área por ID
router.get('/:id', protect, async (req, res) => {
    // Middleware 'protect' ya verificó el token
    const id = req.params.id;
    try {
        const [rows] = await db.query('SELECT * FROM Areas WHERE id_area = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Área no encontrada' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error(`Error al obtener área por ID (${id}):`, error);
        res.status(500).json({ message: 'Error al obtener área por ID' });
    }
});

// Crear una nueva área
router.post('/', protect, restrictTo('Administrador'), async (req, res) => {
    // Middlewares 'protect' y 'restrictTo' ya verificaron token y rol Admin
    const { nombre_area } = req.body;
    // Validación específica y amigable para cada campo obligatorio
    if (!nombre_area || nombre_area.trim() === '') {
        return res.status(400).json({ message: "El campo 'nombre_area' es obligatorio." });
    }
    try {
        const [result] = await db.query(
            'INSERT INTO Areas (nombre_area) VALUES (?)',
            [nombre_area.trim()] // Guardar sin espacios extra
        );
        res.status(201).json({ message: 'Área creada exitosamente', id: result.insertId });
    } catch (error) {
        console.error(`[POST /api/areas] (Admin: ${req.user.rut}) Error al crear área:`, error);
        // Manejar posible error de nombre duplicado si tienes un índice UNIQUE
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: `El área '${nombre_area}' ya existe.` });
        }
        res.status(500).json({ message: 'Error al crear área' });
    }
});

// Actualizar una área existente
router.put('/:id', protect, restrictTo('Administrador'), async (req, res) => {
    // Middlewares 'protect' y 'restrictTo' ya verificaron token y rol Admin
    const id = req.params.id;
    const { nombre_area } = req.body;
    // Validación específica y amigable para cada campo obligatorio
    if (!nombre_area || nombre_area.trim() === '') {
        return res.status(400).json({ message: "El campo 'nombre_area' es obligatorio." });
    }
    try {
        const [result] = await db.query(
            'UPDATE Areas SET nombre_area = ? WHERE id_area = ?',
            [nombre_area.trim(), id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Área no encontrada' });
        }
        res.status(200).json({ message: 'Área actualizada exitosamente' });
    } catch (error) {
        console.error(`[PUT /api/areas/${id}] (Admin: ${req.user.rut}) Error al actualizar área:`, error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: `El nombre de área '${nombre_area}' ya está en uso.` });
        }
        res.status(500).json({ message: 'Error al actualizar área' });
    }
});

// Eliminar una área existente
router.delete('/:id', protect, restrictTo('Administrador'), async (req, res) => {
    // Middlewares 'protect' y 'restrictTo' ya verificaron token y rol Admin
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
        console.error(`[DELETE /api/areas/${id}] (Admin: ${req.user.rut}) Error al eliminar área:`, error);
        // Manejar error si el área está referenciada por otras tablas (Tipos_Solicitudes, Usuarios)
        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
            return res.status(409).json({ message: 'No se puede eliminar el área porque está asignada a tipos de solicitud o usuarios.' });
        }
        res.status(500).json({ message: 'Error al eliminar área' });
    }
});

module.exports = router;