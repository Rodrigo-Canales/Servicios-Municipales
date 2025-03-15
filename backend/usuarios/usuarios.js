const express = require('express');
const router = express.Router();

module.exports = (app, db) => {
    // Ruta para Obtener Todos los Usuarios (Solo Administradores)
    router.get('/', (req, res) => {
        const query = 'SELECT * FROM Usuarios';
        db.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching users:', err);
                res.status(500).json({ error: 'Error fetching users' });
                return;
            }
            res.json(results);
        });
    });

    // Ruta para Obtener un Usuario por RUT (Solo Administradores)
    router.get('/:rut', (req, res) => {
        const rut = req.params.rut;
        const query = 'SELECT * FROM Usuarios WHERE rut = ?';
        db.query(query, [rut], (err, results) => {
            if (err) {
                console.error('Error fetching user:', err);
                res.status(500).json({ error: 'Error fetching user' });
                return;
            }
            if (results.length === 0) {
                res.status(404).json({ message: 'User not found' });
                return;
            }
            res.json(results[0]);
        });
    });

    // Ruta para Crear un Nuevo Usuario (Solo Administradores)
    router.post('/', (req, res) => {
        const { rut, nombres, apellidos, correo } = req.body;
        const query = 'INSERT INTO Usuarios (rut, nombres, apellidos, correo) VALUES (?, ?, ?, ?)';
        db.query(query, [rut, nombres, apellidos, correo], (err, result) => {
            if (err) {
                console.error('Error creating user:', err);
                res.status(500).json({ error: 'Error creating user' });
                return;
            }
            res.status(201).json({ message: 'User created successfully', id: result.insertId });
        });
    });

    // Ruta para Actualizar un Usuario Existente (Solo Administradores)
    router.put('/:rut', (req, res) => {
        const rut = req.params.rut;
        const { nombres, apellidos, correo } = req.body;
        const query = 'UPDATE Usuarios SET nombres = ?, apellidos = ?, correo = ? WHERE rut = ?';
        db.query(query, [nombres, apellidos, correo, rut], (err, result) => {
            if (err) {
                console.error('Error updating user:', err);
                res.status(500).json({ error: 'Error updating user' });
                return;
            }
            if (result.affectedRows === 0) {
                res.status(404).json({ message: 'User not found' });
                return;
            }
            res.json({ message: 'User updated successfully' });
        });
    });

    // Ruta para Eliminar un Usuario (Solo Administradores)
    router.delete('/:rut', (req, res) => {
        const rut = req.params.rut;
        const query = 'DELETE FROM Usuarios WHERE rut = ?';
        db.query(query, [rut], (err, result) => {
            if (err) {
                console.error('Error deleting user:', err);
                res.status(500).json({ error: 'Error deleting user' });
                return;
            }
            if (result.affectedRows === 0) {
                res.status(404).json({ message: 'User not found' });
                return;
            }
            res.json({ message: 'User deleted successfully' });
        });
    });

    return router;
};