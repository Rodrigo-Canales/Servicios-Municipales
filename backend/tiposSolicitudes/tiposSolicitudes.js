const express = require('express'); // Importamos Express
const router = express.Router(); // Creamos un enrutador para definir las rutas relacionadas con "Tipos de Solicitudes"

module.exports = (app, db) => {

    router.get('/', (req, res) => { // Ruta para Obtener Todos los Tipos de Solicitudes
        const query = 'SELECT * FROM Tipos_Solicitudes'; // Consulta SQL para obtener todos los registros

        db.query(query, (err, results) => { // Ejecutamos la consulta en la base de datos
            if (err) { // Si hay un error en la consulta
                console.error('Error fetching tipos de solicitudes:', err);
                res.status(500).json({ error: 'Error fetching tipos de solicitudes' }); // Respondemos con error 500
                return;
            }
            res.json(results); // Enviamos los resultados en formato JSON
        });
    });

    router.get('/:id', (req, res) => { // Ruta para Obtener un Tipo de Solicitud por ID
        const id = req.params.id; // Obtenemos el ID desde los parámetros de la URL
        const query = 'SELECT * FROM Tipos_Solicitudes WHERE id_solicitud = ?'; // Consulta SQL para obtener un registro por ID

        db.query(query, [id], (err, results) => { // Ejecutamos la consulta con el ID proporcionado
            if (err) { // Si hay un error en la consulta
                console.error('Error fetching tipo de solicitud:', err);
                res.status(500).json({ error: 'Error fetching tipo de solicitud' }); // Respondemos con error 500
                return;
            }
            if (results.length === 0) { // Si no se encuentra un registro con ese ID
                res.status(404).json({ message: 'Tipo de solicitud not found' }); // Respondemos con error 404
                return;
            }
            res.json(results[0]); // Enviamos el primer resultado encontrado
        });
    });

    router.post('/', (req, res) => { // Ruta para Crear un Nuevo Tipo de Solicitud
        const { tipo_solicitud, area_id } = req.body; // Extraemos los datos del cuerpo de la solicitud
        const query = 'INSERT INTO Tipos_Solicitudes (tipo_solicitud, area_id) VALUES (?, ?)'; // Consulta SQL para insertar un nuevo registro

        db.query(query, [tipo_solicitud, area_id], (err, result) => { // Ejecutamos la consulta con los datos proporcionados
            if (err) { // Si hay un error en la consulta
                console.error('Error creating tipo de solicitud:', err);
                res.status(500).json({ error: 'Error creating tipo de solicitud' }); // Respondemos con error 500
                return;
            }
            res.status(201).json({ message: 'Tipo de solicitud created successfully', id: result.insertId }); // Respondemos con éxito
        });
    });

    router.put('/:id', (req, res) => { // Ruta para Actualizar un Tipo de Solicitud Existente
        const id = req.params.id; // Obtenemos el ID desde los parámetros de la URL
        const { tipo_solicitud, area_id } = req.body; // Extraemos los datos del cuerpo de la solicitud
        const query = 'UPDATE Tipos_Solicitudes SET tipo_solicitud = ?, area_id = ? WHERE id_solicitud = ?'; // Consulta SQL para actualizar un registro

        db.query(query, [tipo_solicitud, area_id, id], (err, result) => { // Ejecutamos la consulta con los nuevos datos
            if (err) { // Si hay un error en la consulta
                console.error('Error updating tipo de solicitud:', err);
                res.status(500).json({ error: 'Error updating tipo de solicitud' }); // Respondemos con error 500
                return;
            }
            if (result.affectedRows === 0) { // Si no se encuentra el registro para actualizar
                res.status(404).json({ message: 'Tipo de solicitud not found' }); // Respondemos con error 404
                return;
            }
            res.json({ message: 'Tipo de solicitud updated successfully' }); // Respondemos con éxito
        });
    });

    router.delete('/:id', (req, res) => { // Ruta para Eliminar un Tipo de Solicitud
        const id = req.params.id; // Obtenemos el ID desde los parámetros de la URL
        const query = 'DELETE FROM Tipos_Solicitudes WHERE id_solicitud = ?'; // Consulta SQL para eliminar un registro

        db.query(query, [id], (err, result) => { // Ejecutamos la consulta con el ID proporcionado
            if (err) { // Si hay un error en la consulta
                console.error('Error deleting tipo de solicitud:', err);
                res.status(500).json({ error: 'Error deleting tipo de solicitud' }); // Respondemos con error 500
                return;
            }
            if (result.affectedRows === 0) { // Si no se encuentra el registro para eliminar
                res.status(404).json({ message: 'Tipo de solicitud not found' }); // Respondemos con error 404
                return;
            }
            res.json({ message: 'Tipo de solicitud deleted successfully' }); // Respondemos con éxito
        });
    });

    return router; // Retornamos el enrutador configurado
};