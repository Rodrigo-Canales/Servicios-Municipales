const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

module.exports = (app, db) => {

    // Configuración de Multer (no es necesario definir storage aquí, ya que se usa el de solicitudes.js)
    const upload = multer(); // No necesitamos storage aquí, ya que se define en solicitudes.js

    // Ruta para Crear una Nueva Respuesta
    router.post('/', upload.array('archivos'), (req, res) => {
        const { id_solicitud, rut_trabajador, respuesta } = req.body;

        // Obtener las rutas de los archivos subidos
        let rutasArchivos = [];
        if (req.files) {
            req.files.forEach(file => {
                rutasArchivos.push('/' + path.basename(file.path)); // Guarda solo el nombre del archivo y la carpeta
            });
        }

        const query = 'INSERT INTO Respuestas (id_solicitud, rut_trabajador, respuesta, archivo_adjunto) VALUES (?, ?, ?, ?)';
        db.query(query, [id_solicitud, rut_trabajador, respuesta, JSON.stringify(rutasArchivos)], (err, result) => {
            if (err) {
                console.error('Error creating respuesta:', err);
                res.status(500).json({ error: 'Error creating respuesta' });
                return;
            }
            res.status(201).json({ message: 'Respuesta created successfully', id: result.insertId });
        });
    });

    // Ruta para Obtener Todas las Respuestas (Ejemplo)
    router.get('/', (req, res) => {
        const query = 'SELECT * FROM Respuestas';
        db.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching respuestas:', err);
                res.status(500).json({ error: 'Error fetching respuestas' });
                return;
            }
            results.forEach(result => {
                try {
                    result.archivo_adjunto = JSON.parse(result.archivo_adjunto);
                } catch (error) {
                    result.archivo_adjunto = []; // Si el campo está vacío o no es un JSON válido
                }
            });
            res.json(results);
        });
    });

    // Ruta para Obtener una Respuesta por ID (Ejemplo)
    router.get('/:id', (req, res) => {
        const id = req.params.id;
        const query = 'SELECT * FROM Respuestas WHERE id_respuesta = ?';
        db.query(query, [id], (err, results) => {
            if (err) {
                console.error('Error fetching respuesta:', err);
                res.status(500).json({ error: 'Error fetching respuesta' });
                return;
            }
            if (results.length === 0) {
                res.status(404).json({ message: 'Respuesta not found' });
                return;
            }
            try {
                results[0].archivo_adjunto = JSON.parse(results[0].archivo_adjunto);
            } catch (error) {
                results[0].archivo_adjunto = [];
            }
            res.json(results[0]);
        });
    });

    // Ruta para Actualizar una Respuesta Existente
    router.put('/:id', upload.array('archivos'), (req, res) => {
        const id = req.params.id;
        const { id_solicitud, rut_trabajador, respuesta } = req.body;

        // Obtener las rutas de los archivos subidos
        let rutasArchivos = [];
        if (req.files) {
            req.files.forEach(file => {
                rutasArchivos.push('/' + path.basename(file.path)); // Guarda solo el nombre del archivo y la carpeta
            });
        }

        const query = 'UPDATE Respuestas SET id_solicitud = ?, rut_trabajador = ?, respuesta = ?, archivo_adjunto = ? WHERE id_respuesta = ?';
        db.query(query, [id_solicitud, rut_trabajador, respuesta, JSON.stringify(rutasArchivos), id], (err, result) => {
            if (err) {
                console.error('Error updating respuesta:', err);
                res.status(500).json({ error: 'Error updating respuesta' });
                return;
            }
            if (result.affectedRows === 0) {
                res.status(404).json({ message: 'Respuesta not found' });
                return;
            }
            res.json({ message: 'Respuesta updated successfully' });
        });
    });

    // Ruta para Eliminar una Respuesta
    router.delete('/:id', (req, res) => {
        const id = req.params.id;
        const query = 'SELECT archivo_adjunto FROM Respuestas WHERE id_respuesta = ?';
        db.query(query, [id], (err, results) => {
            if (err) {
                console.error('Error fetching respuesta:', err);
                res.status(500).json({ error: 'Error fetching respuesta' });
                return;
            }
            if (results.length === 0) {
                res.status(404).json({ message: 'Respuesta not found' });
                return;
            }

            // Eliminar los archivos adjuntos del sistema de archivos
            try {
                const archivosAdjuntos = JSON.parse(results[0].archivo_adjunto);
                archivosAdjuntos.forEach(archivo => {
                    fs.unlink(path.join(__dirname, '..', archivo), (err) => {
                        if (err) {
                            console.error('Error deleting file:', err);
                        }
                    });
                });
            } catch (error) {
                console.error('Error parsing archivo_adjunto:', error);
            }

            // Eliminar la respuesta de la base de datos
            const queryDelete = 'DELETE FROM Respuestas WHERE id_respuesta = ?';
            db.query(queryDelete, [id], (err, result) => {
                if (err) {
                    console.error('Error deleting respuesta:', err);
                    res.status(500).json({ error: 'Error deleting respuesta' });
                    return;
                }
                if (result.affectedRows === 0) {
                    res.status(404).json({ message: 'Respuesta not found' });
                    return;
                }
                res.json({ message: 'Respuesta deleted successfully' });
            });
        });
    });
    return router;
};