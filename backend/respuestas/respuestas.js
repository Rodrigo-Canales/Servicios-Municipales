const express = require('express'); // Importamos el módulo Express para crear el servidor y manejar las rutas
const router = express.Router(); // Creamos un enrutador de Express para manejar las rutas de "Respuestas"
const mysql = require('mysql2'); // Importamos el módulo mysql2 para interactuar con la base de datos
const path = require('path'); // Importamos el módulo path para manejar las rutas de los archivos
const fs = require('fs'); // Importamos el módulo fs para interactuar con el sistema de archivos
const multer = require('multer'); // Importamos multer para gestionar la subida de archivos
const { v4: uuidv4 } = require('uuid'); // Importamos la función uuidv4 para generar identificadores únicos

module.exports = (app, db) => { // Exportamos la función que recibe "app" (el servidor Express) y "db" (la conexión a la base de datos)
    
    // Configuración de Multer (no se define "storage" aquí, ya que se usa en solicitudes.js)
    const upload = multer(); // Inicializamos multer para manejar las cargas de archivos sin definir el almacenamiento aquí
    // Ruta POST para crear una nueva respuesta
    router.post('/', upload.array('archivos'), (req, res) => {
        const { id_solicitud, rut_trabajador, respuesta } = req.body; // Extraemos los datos de la solicitud, trabajador y respuesta desde el cuerpo de la petición

        // Obtenemos las rutas de los archivos subidos
        let rutasArchivos = [];
        if (req.files) {
            req.files.forEach(file => {
                rutasArchivos.push('/' + path.basename(file.path)); // Guardamos solo el nombre del archivo y la ruta relativa
            });
        }

        // Consulta SQL para insertar una nueva respuesta en la base de datos
        const query = 'INSERT INTO Respuestas (id_solicitud, rut_trabajador, respuesta, archivo_adjunto) VALUES (?, ?, ?, ?)';
        db.query(query, [id_solicitud, rut_trabajador, respuesta, JSON.stringify(rutasArchivos)], (err, result) => { // Ejecutamos la consulta
            if (err) {
                console.error('Error creating respuesta:', err); // Si ocurre un error, lo mostramos en la consola
                res.status(500).json({ error: 'Error creating respuesta' }); // Respondemos con un error 500
                return;
            }
            res.status(201).json({ message: 'Respuesta created successfully', id: result.insertId }); // Respondemos con éxito y el ID de la nueva respuesta
        });
    });

    // Ruta GET para obtener todas las respuestas
    router.get('/', (req, res) => {
        const query = 'SELECT * FROM Respuestas'; // Consulta SQL para obtener todas las respuestas
        db.query(query, (err, results) => { // Ejecutamos la consulta
            if (err) {
                console.error('Error fetching respuestas:', err); // Si ocurre un error, lo mostramos en la consola
                res.status(500).json({ error: 'Error fetching respuestas' }); // Respondemos con un error 500
                return;
            }
            results.forEach(result => { // Iteramos sobre los resultados de la consulta
                try {
                    result.archivo_adjunto = JSON.parse(result.archivo_adjunto); // Intentamos convertir el campo "archivo_adjunto" de JSON a un array
                } catch (error) {
                    result.archivo_adjunto = []; // Si hay un error, lo inicializamos como un array vacío
                }
            });
            res.json(results); // Respondemos con los resultados en formato JSON
        });
    });

    // Ruta GET para obtener una respuesta por ID
    router.get('/:id', (req, res) => {
        const id = req.params.id; // Obtenemos el ID de la respuesta desde los parámetros de la URL
        const query = 'SELECT * FROM Respuestas WHERE id_respuesta = ?'; // Consulta SQL para obtener la respuesta con ese ID
        db.query(query, [id], (err, results) => { // Ejecutamos la consulta con el ID
            if (err) {
                console.error('Error fetching respuesta:', err); // Si hay un error, lo mostramos en la consola
                res.status(500).json({ error: 'Error fetching respuesta' }); // Respondemos con un error 500
                return;
            }
            if (results.length === 0) { // Si no se encuentra la respuesta
                res.status(404).json({ message: 'Respuesta not found' }); // Respondemos con un error 404
                return;
            }
            try {
                results[0].archivo_adjunto = JSON.parse(results[0].archivo_adjunto); // Intentamos convertir el campo "archivo_adjunto" de JSON a un array
            } catch (error) {
                results[0].archivo_adjunto = []; // Si hay un error, lo inicializamos como un array vacío
            }
            res.json(results[0]); // Respondemos con la respuesta encontrada en formato JSON
        });
    });

    // Ruta PUT para actualizar una respuesta existente
    router.put('/:id', upload.array('archivos'), (req, res) => {
        const id = req.params.id; // Obtenemos el ID de la respuesta desde los parámetros de la URL
        const { id_solicitud, rut_trabajador, respuesta } = req.body; // Extraemos los datos del cuerpo de la solicitud
        // Obtenemos las rutas de los archivos subidos
        let rutasArchivos = [];
        if (req.files) {
            req.files.forEach(file => {
                rutasArchivos.push('/' + path.basename(file.path)); // Guardamos solo el nombre del archivo y la ruta relativa
            });
        }

        // Consulta SQL para actualizar una respuesta existente
        const query = 'UPDATE Respuestas SET id_solicitud = ?, rut_trabajador = ?, respuesta = ?, archivo_adjunto = ? WHERE id_respuesta = ?';
        db.query(query, [id_solicitud, rut_trabajador, respuesta, JSON.stringify(rutasArchivos), id], (err, result) => { // Ejecutamos la consulta
            if (err) {
                console.error('Error updating respuesta:', err); // Si ocurre un error, lo mostramos en la consola
                res.status(500).json({ error: 'Error updating respuesta' }); // Respondemos con un error 500
                return;
            }
            if (result.affectedRows === 0) { // Si no se encuentra la respuesta a actualizar
                res.status(404).json({ message: 'Respuesta not found' }); // Respondemos con un error 404
                return;
            }
            res.json({ message: 'Respuesta updated successfully' }); // Respondemos con éxito
        });
    });

    // Ruta DELETE para eliminar una respuesta por ID
    router.delete('/:id', (req, res) => {
        const id = req.params.id; // Obtenemos el ID de la respuesta desde los parámetros de la URL
        const query = 'SELECT archivo_adjunto FROM Respuestas WHERE id_respuesta = ?'; // Consulta SQL para obtener los archivos adjuntos de la respuesta
        db.query(query, [id], (err, results) => { // Ejecutamos la consulta
            if (err) {
                console.error('Error fetching respuesta:', err); // Si ocurre un error, lo mostramos en la consola
                res.status(500).json({ error: 'Error fetching respuesta' }); // Respondemos con un error 500
                return;
            }
            if (results.length === 0) { // Si no se encuentra la respuesta
                res.status(404).json({ message: 'Respuesta not found' }); // Respondemos con un error 404
                return;
            }

            // Eliminamos los archivos adjuntos del sistema de archivos
            try {
                const archivosAdjuntos = JSON.parse(results[0].archivo_adjunto); // Intentamos convertir el campo "archivo_adjunto" de JSON a un array
                archivosAdjuntos.forEach(archivo => { // Iteramos sobre los archivos adjuntos
                    fs.unlink(path.join(__dirname, '..', archivo), (err) => { // Eliminamos cada archivo del sistema de archivos
                        if (err) {
                            console.error('Error deleting file:', err); // Si ocurre un error, lo mostramos en la consola
                        }
                    });
                });
            } catch (error) {
                console.error('Error parsing archivo_adjunto:', error); // Si hay un error al analizar el campo "archivo_adjunto"
            }

            // Eliminamos la respuesta de la base de datos
            const queryDelete = 'DELETE FROM Respuestas WHERE id_respuesta = ?';
            db.query(queryDelete, [id], (err, result) => { // Ejecutamos la consulta de eliminación
                if (err) {
                    console.error('Error deleting respuesta:', err); // Si ocurre un error, lo mostramos en la consola
                    res.status(500).json({ error: 'Error deleting respuesta' }); // Respondemos con un error 500
                    return;
                }
                if (result.affectedRows === 0) { // Si no se encuentra la respuesta a eliminar
                    res.status(404).json({ message: 'Respuesta not found' }); // Respondemos con un error 404
                    return;
                }
                res.json({ message: 'Respuesta deleted successfully' }); // Respondemos con éxito
            });
        });
    });
    return router; // Retornamos el enrutador con todas las rutas configuradas
};