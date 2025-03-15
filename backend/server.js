const express = require('express');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Configuración de la base de datos (Se sacan los parametros desde el archivo .env)
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database!');
});

// CRUD para Áreas

// Ruta para Obtener Todas las Áreas
app.get('/api/areas', (req, res) => {
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
app.get('/api/areas/:id', (req, res) => {
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
app.post('/api/areas', (req, res) => {
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
app.put('/api/areas/:id', (req, res) => {
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
app.delete('/api/areas/:id', (req, res) => {
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

// CRUD para Tipos de Solicitudes

// Ruta para Obtener Todos los Tipos de Solicitudes
app.get('/api/tipos-solicitudes', (req, res) => {
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
app.get('/api/tipos-solicitudes/:id', (req, res) => {
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
app.post('/api/tipos-solicitudes', (req, res) => {
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
app.put('/api/tipos-solicitudes/:id', (req, res) => {
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
app.delete('/api/tipos-solicitudes/:id', (req, res) => {
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

// CRUD para Trabajadores

// Ruta para Obtener Todos los Trabajadores (Solo Administradores)
app.get('/api/trabajadores', (req, res) => {
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
app.get('/api/trabajadores/:rut', (req, res) => {
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
app.post('/api/trabajadores', (req, res) => {
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
app.put('/api/trabajadores/:rut', (req, res) => {
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
app.delete('/api/trabajadores/:rut', (req, res) => {
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

// Ruta para Obtener Todos los Usuarios (Solo Administradores)
app.get('/api/usuarios', (req, res) => {
    // TODO: Implementar la autenticación y verificación de roles aquí
    // Por ahora, asumimos que el usuario es un administrador
    // En la implementación real, deberías verificar el rol del usuario a través del token JWT

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
app.get('/api/usuarios/:rut', (req, res) => {
    // TODO: Implementar la autenticación y verificación de roles aquí
    // Por ahora, asumimos que el usuario es un administrador

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
app.post('/api/usuarios', (req, res) => {
    // TODO: Implementar la autenticación y verificación de roles aquí
    // Por ahora, asumimos que el usuario es un administrador

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
app.put('/api/usuarios/:rut', (req, res) => {
    // TODO: Implementar la autenticación y verificación de roles aquí
    // Por ahora, asumimos que el usuario es un administrador

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
app.delete('/api/usuarios/:rut', (req, res) => {
    // TODO: Implementar la autenticación y verificación de roles aquí
    // Por ahora, asumimos que el usuario es un administrador

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

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});