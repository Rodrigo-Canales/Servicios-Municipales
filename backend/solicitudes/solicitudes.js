const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

module.exports = (app, db) => {

    // Configuración de Multer
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const fecha = new Date();
            const anio = fecha.getFullYear();
            const mes = fecha.toLocaleString('default', { month: 'long' });

            const rutaCarpetaAnio = path.join(__dirname, '..', 'Directorio de Solicitudes', anio);
            const rutaCarpetaMes = path.join(rutaCarpetaAnio, mes);

            // Crea las carpetas si no existen
            if (!fs.existsSync(rutaCarpetaAnio)) {
                fs.mkdirSync(rutaCarpetaAnio);
            }
            if (!fs.existsSync(rutaCarpetaMes)) {
                fs.mkdirSync(rutaCarpetaMes);
            }

            cb(null, rutaCarpetaMes);
        },
        filename: (req, file, cb) => {
            const fecha = new Date();
            const fechaFormateada = fecha.toISOString().replace(/[:]/g, '-');
            const nombreArchivo = uuidv4() + '-' + file.originalname;
            cb(null, nombreArchivo);
        }
    });

    const upload = multer({ storage: storage });

    // Ruta para Crear una Nueva Solicitud
    router.post('/', upload.array('archivos'), (req, res) => {
        const { rut_usuario, tipo_solicitud, descripcion } = req.body;

        // Obtener las rutas de los archivos subidos
        let rutasArchivos = [];
        if (req.files) {
            req.files.forEach(file => {
                rutasArchivos.push('/' + path.basename(file.path)); // Guarda solo el nombre del archivo y la carpeta
            });
        }

        const query = 'INSERT INTO Solicitudes (rut_usuario, tipo_solicitud, descripcion, archivo_adjunto) VALUES (?, ?, ?, ?)';
        db.query(query, [rut_usuario, tipo_solicitud, descripcion, JSON.stringify(rutasArchivos)], (err, result) => {
            if (err) {
                console.error('Error creating solicitud:', err);
                res.status(500).json({ error: 'Error creating solicitud' });
                return;
            }
            res.status(201).json({ message: 'Solicitud created successfully', id: result.insertId });
        });
    });

    // Ruta para Obtener Todas las Solicitudes
    router.get('/', (req, res) => {
        const query = 'SELECT * FROM Solicitudes';
        db.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching solicitudes:', err);
                res.status(500).json({ error: 'Error fetching solicitudes' });
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

    // Ruta para Obtener una Solicitud por ID
    router.get('/:id', (req, res) => {
        const id = req.params.id;
        const query = 'SELECT * FROM Solicitudes WHERE id_solicitud = ?';
        db.query(query, [id], (err, results) => {
            if (err) {
                console.error('Error fetching solicitud:', err);
                res.status(500).json({ error: 'Error fetching solicitud' });
                return;
            }
            if (results.length === 0) {
                res.status(404).json({ message: 'Solicitud not found' });
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

    // Ruta para Actualizar una Solicitud Existente
    router.put('/:id', upload.array('archivos'), (req, res) => {
        const id = req.params.id;
        const { rut_usuario, tipo_solicitud, descripcion } = req.body;

        // Obtener las rutas de los archivos subidos
        let rutasArchivos = [];
        if (req.files) {
            req.files.forEach(file => {
                rutasArchivos.push('/' + path.basename(file.path)); // Guarda solo el nombre del archivo y la carpeta
            });
        }

        const query = 'UPDATE Solicitudes SET rut_usuario = ?, tipo_solicitud = ?, descripcion = ?, archivo_adjunto = ? WHERE id_solicitud = ?';
        db.query(query, [rut_usuario, tipo_solicitud, descripcion, JSON.stringify(rutasArchivos), id], (err, result) => {
            if (err) {
                console.error('Error updating solicitud:', err);
                res.status(500).json({ error: 'Error updating solicitud' });
                return;
            }
            if (result.affectedRows === 0) {
                res.status(404).json({ message: 'Solicitud not found' });
                return;
            }
            res.json({ message: 'Solicitud updated successfully' });
        });
    });

    // Ruta para Eliminar una Solicitud
    router.delete('/:id', (req, res) => {
        const id = req.params.id;
        const query = 'SELECT archivo_adjunto FROM Solicitudes WHERE id_solicitud = ?';
        db.query(query, [id], (err, results) => {
            if (err) {
                console.error('Error fetching solicitud:', err);
                res.status(500).json({ error: 'Error fetching solicitud' });
                return;
            }
            if (results.length === 0) {
                res.status(404).json({ message: 'Solicitud not found' });
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
            const queryDelete = 'DELETE FROM Solicitudes WHERE id_solicitud = ?';
            db.query(queryDelete, [id], (err, result) => {
                if (err) {
                    console.error('Error deleting solicitud:', err);
                    res.status(500).json({ error: 'Error deleting solicitud' });
                    return;
                }
                if (result.affectedRows === 0) {
                    res.status(404).json({ message: 'Solicitud not found' });
                    return;
                }
                res.json({ message: 'Solicitud deleted successfully' });
            });
        });
    });

    return router;
};