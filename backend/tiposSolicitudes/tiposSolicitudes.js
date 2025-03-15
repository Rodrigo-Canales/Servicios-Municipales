const express = require('express');
const router = express.Router();

module.exports = (app, db) => {
    // Ruta para Obtener Todos los Tipos de Solicitudes
    router.get('/', (req, res) => {
        const query = 'SELECT * FROM Tipos_Solicitudes';
        db.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching tipos de solicitudes:', err);
                res.status(500).json({ error: 'Error fetching tipos de solicitudes' });
                return;
            }
            res.json(results);
        });
    });

    // Ruta para Obtener un Tipo de Solicitud por ID
    router.get('/:id', (req, res) => {
        const id = req.params.id;
        const query = 'SELECT * FROM Tipos_Solicitudes WHERE id_solicitud = ?';
        db.query(query, [id], (err, results) => {
            if (err) {
                console.error('Error fetching tipo de solicitud:', err);
                res.status(500).json({ error: 'Error fetching tipo de solicitud' });
                return;
            }
            if (results.length === 0) {
                res.status(404).json({ message: 'Tipo de solicitud not found' });
                return;
            }
            res.json(results[0]);
        });
    });

    // Ruta para Crear un Nuevo Tipo de Solicitud
    router.post('/', (req, res) => {
        const { tipo_solicitud, area_id } = req.body;
        const query = 'INSERT INTO Tipos_Solicitudes (tipo_solicitud, area_id) VALUES (?, ?)';
        db.query(query, [tipo_solicitud, area_id], (err, result) => {
            if (err) {
                console.error('Error creating tipo de solicitud:', err);
                res.status(500).json({ error: 'Error creating tipo de solicitud' });
                return;
            }
            res.status(201).json({ message: 'Tipo de solicitud created successfully', id: result.insertId });
        });
    });

    // Ruta para Actualizar un Tipo de Solicitud Existente
    router.put('/:id', (req, res) => {
        const id = req.params.id;
        const { tipo_solicitud, area_id } = req.body;
        const query = 'UPDATE Tipos_Solicitudes SET tipo_solicitud = ?, area_id = ? WHERE id_solicitud = ?';
        db.query(query, [tipo_solicitud, area_id, id], (err, result) => {
            if (err) {
                console.error('Error updating tipo de solicitud:', err);
                res.status(500).json({ error: 'Error updating tipo de solicitud' });
                return;
            }
            if (result.affectedRows === 0) {
                res.status(404).json({ message: 'Tipo de solicitud not found' });
                return;
            }
            res.json({ message: 'Tipo de solicitud updated successfully' });
        });
    });

    // Ruta para Eliminar un Tipo de Solicitud
    router.delete('/:id', (req, res) => {
        const id = req.params.id;
        const query = 'DELETE FROM Tipos_Solicitudes WHERE id_solicitud = ?';
        db.query(query, [id], (err, result) => {
            if (err) {
                console.error('Error deleting tipo de solicitud:', err);
                res.status(500).json({ error: 'Error deleting tipo de solicitud' });
                return;
            }
            if (result.affectedRows === 0) {
                res.status(404).json({ message: 'Tipo de solicitud not found' });
                return;
            }
            res.json({ message: 'Tipo de solicitud deleted successfully' });
        });
    });

    return router;
};