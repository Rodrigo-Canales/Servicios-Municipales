const express = require('express');
const router = express.Router();

module.exports = (app, db) => {
    // Ruta para Obtener Todos los Trabajadores (Solo Administradores)
    router.get('/', (req, res) => {
        const query = 'SELECT * FROM Trabajadores';
        db.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching trabajadores:', err);
                res.status(500).json({ error: 'Error fetching trabajadores' });
                return;
            }
            res.json(results);
        });
    });

    // Ruta para Obtener un Trabajador por RUT
    router.get('/:rut', (req, res) => {
        const rut = req.params.rut;
        const query = 'SELECT * FROM Trabajadores WHERE rut = ?';
        db.query(query, [rut], (err, results) => {
            if (err) {
                console.error('Error fetching trabajador:', err);
                res.status(500).json({ error: 'Error fetching trabajador' });
                return;
            }
            if (results.length === 0) {
                res.status(404).json({ message: 'Trabajador not found' });
                return;
            }
            res.json(results[0]);
        });
    });

    // Ruta para Crear un Nuevo Trabajador (Solo Administradores)
    router.post('/', (req, res) => {
        const { rut, nombres, apellidos, correo_institucional, area_id, rol } = req.body;
        const query = 'INSERT INTO Trabajadores (rut, nombres, apellidos, correo_institucional, area_id, rol) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(query, [rut, nombres, apellidos, correo_institucional, area_id, rol], (err, result) => {
            if (err) {
                console.error('Error creating trabajador:', err);
                res.status(500).json({ error: 'Error creating trabajador' });
                return;
            }

            // Obtener el ID del último registro insertado directamente del objeto result
            const lastInsertId = result.insertId;

            res.status(201).json({ message: 'Trabajador created successfully', id: lastInsertId });
        });
    });

    // Ruta para Actualizar un Trabajador Existente (Solo Administradores)
    router.put('/:rut', (req, res) => {
        const rut = req.params.rut;
        const { nombres, apellidos, correo_institucional, area_id, rol } = req.body;
        const query = 'UPDATE Trabajadores SET nombres = ?, apellidos = ?, correo_institucional = ?, area_id = ?, rol = ? WHERE rut = ?';
        db.query(query, [nombres, apellidos, correo_institucional, area_id, rol, rut], (err, result) => {
            if (err) {
                console.error('Error updating trabajador:', err);
                res.status(500).json({ error: 'Error updating trabajador' });
                return;
            }
            if (result.affectedRows === 0) {
                res.status(404).json({ message: 'Trabajador not found' });
                return;
            }
            res.json({ message: 'Trabajador updated successfully' });
        });
    });

    // Ruta para Eliminar un Trabajador (Solo Administradores)
    router.delete('/:rut', (req, res) => {
        const rut = req.params.rut;
        const query = 'DELETE FROM Trabajadores WHERE rut = ?';
        db.query(query, [rut], (err, result) => {
            if (err) {
                console.error('Error deleting trabajador:', err);
                res.status(500).json({ error: 'Error deleting trabajador' });
                return;
            }
            if (result.affectedRows === 0) {
                res.status(404).json({ message: 'Trabajador not found' });
                return;
            }
            res.json({ message: 'Trabajador deleted successfully' });
        });
    });

    return router;
};