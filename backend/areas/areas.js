const express = require('express');
const router = express.Router();

module.exports = (app, db) => {
    // Ruta para Obtener Todas las Áreas
    router.get('/', (req, res) => {
        const query = 'SELECT * FROM Areas';
        db.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching areas:', err);
                res.status(500).json({ error: 'Error fetching areas' });
                return;
            }
            res.json(results);
        });
    });

    // Ruta para Obtener una Área por ID
    router.get('/:id', (req, res) => {
        const id = req.params.id;
        const query = 'SELECT * FROM Areas WHERE id_area = ?';
        db.query(query, [id], (err, results) => {
            if (err) {
                console.error('Error fetching area:', err);
                res.status(500).json({ error: 'Error fetching area' });
                return;
            }
            if (results.length === 0) {
                res.status(404).json({ message: 'Area not found' });
                return;
            }
            res.json(results[0]);
        });
    });

    // Ruta para Crear una Nueva Área
    router.post('/', (req, res) => {
        const { nombre_area } = req.body;
        const query = 'INSERT INTO Areas (nombre_area) VALUES (?)';
        db.query(query, [nombre_area], (err, result) => {
            if (err) {
                console.error('Error creating area:', err);
                res.status(500).json({ error: 'Error creating area' });
                return;
            }
            res.status(201).json({ message: 'Area created successfully', id: result.insertId });
        });
    });

    // Ruta para Actualizar una Área Existente
    router.put('/:id', (req, res) => {
        const id = req.params.id;
        const { nombre_area } = req.body;
        const query = 'UPDATE Areas SET nombre_area = ? WHERE id_area = ?';
        db.query(query, [nombre_area, id], (err, result) => {
            if (err) {
                console.error('Error updating area:', err);
                res.status(500).json({ error: 'Error updating area' });
                return;
            }
            if (result.affectedRows === 0) {
                res.status(404).json({ message: 'Area not found' });
                return;
            }
            res.json({ message: 'Area updated successfully' });
        });
    });

    // Ruta para Eliminar una Área
    router.delete('/:id', (req, res) => {
        const id = req.params.id;
        const query = 'DELETE FROM Areas WHERE id_area = ?';
        db.query(query, [id], (err, result) => {
            if (err) {
                console.error('Error deleting area:', err);
                res.status(500).json({ error: 'Error deleting area' });
                return;
            }
            if (result.affectedRows === 0) {
                res.status(404).json({ message: 'Area not found' });
                return;
            }
            res.json({ message: 'Area deleted successfully' });
        });
    });

    return router;
};
