const express = require('express'); // Importamos Express
const router = express.Router(); // Creamos un enrutador para definir las rutas relacionadas con "Trabajadores"

module.exports = (app, db) => {

    router.get('/', (req, res) => { //  Ruta para Obtener Todos los Trabajadores (Solo Administradores)
        const query = 'SELECT * FROM Trabajadores'; // Consulta SQL para obtener todos los trabajadores
        db.query(query, (err, results) => { // Ejecutamos la consulta en la base de datos
            if (err) { // Si hay un error en la consulta
                console.error('Error fetching trabajadores:', err);
                res.status(500).json({ error: 'Error fetching trabajadores' }); // Respondemos con error 500
                return;
            }
            res.json(results); // Enviamos los resultados en formato JSON
        });
    });

    router.get('/:rut', (req, res) => { //  Ruta para Obtener un Trabajador por RUT
        const rut = req.params.rut; // Obtenemos el RUT desde los parámetros de la URL
        const query = 'SELECT * FROM Trabajadores WHERE rut = ?'; // Consulta SQL para obtener un trabajador por RUT
        db.query(query, [rut], (err, results) => { // Ejecutamos la consulta con el RUT proporcionado
            if (err) { // Si hay un error en la consulta
                console.error('Error fetching trabajador:', err);
                res.status(500).json({ error: 'Error fetching trabajador' }); // Respondemos con error 500
                return;
            }
            if (results.length === 0) { // Si no se encuentra un trabajador con ese RUT
                res.status(404).json({ message: 'Trabajador not found' }); // Respondemos con error 404
                return;
            }
            res.json(results[0]); // Enviamos el primer resultado encontrado
        });
    });

    router.post('/', (req, res) => { //  Ruta para Crear un Nuevo Trabajador (Solo Administradores)
        const { rut, nombres, apellidos, correo_institucional, area_id, rol } = req.body; // Extraemos los datos del cuerpo de la solicitud
        const query = 'INSERT INTO Trabajadores (rut, nombres, apellidos, correo_institucional, area_id, rol) VALUES (?, ?, ?, ?, ?, ?)'; // Consulta SQL para insertar un nuevo trabajador
        db.query(query, [rut, nombres, apellidos, correo_institucional, area_id, rol], (err, result) => { // Ejecutamos la consulta con los datos proporcionados
            if (err) { // Si hay un error en la consulta
                console.error('Error creating trabajador:', err);
                res.status(500).json({ error: 'Error creating trabajador' }); // Respondemos con error 500
                return;
            }
            const lastInsertId = result.insertId; // Obtenemos el ID del último registro insertado
            res.status(201).json({ message: 'Trabajador created successfully', id: lastInsertId }); // Respondemos con éxito
        });
    });

    router.put('/:rut', (req, res) => { //  Ruta para Actualizar un Trabajador Existente (Solo Administradores)
        const rut = req.params.rut; // Obtenemos el RUT desde los parámetros de la URL
        const { nombres, apellidos, correo_institucional, area_id, rol } = req.body; // Extraemos los datos del cuerpo de la solicitud
        const query = 'UPDATE Trabajadores SET nombres = ?, apellidos = ?, correo_institucional = ?, area_id = ?, rol = ? WHERE rut = ?'; // Consulta SQL para actualizar un trabajador
        db.query(query, [nombres, apellidos, correo_institucional, area_id, rol, rut], (err, result) => { // Ejecutamos la consulta con los nuevos datos
            if (err) { // Si hay un error en la consulta
                console.error('Error updating trabajador:', err);
                res.status(500).json({ error: 'Error updating trabajador' }); // Respondemos con error 500
                return;
            }
            if (result.affectedRows === 0) { // Si no se encuentra el trabajador para actualizar
                res.status(404).json({ message: 'Trabajador not found' }); // Respondemos con error 404
                return;
            }
            res.json({ message: 'Trabajador updated successfully' }); // Respondemos con éxito
        });
    });

    router.delete('/:rut', (req, res) => { //  Ruta para Eliminar un Trabajador (Solo Administradores)
        const rut = req.params.rut; // Obtenemos el RUT desde los parámetros de la URL
        const query = 'DELETE FROM Trabajadores WHERE rut = ?'; // Consulta SQL para eliminar un trabajador
        db.query(query, [rut], (err, result) => { // Ejecutamos la consulta con el RUT proporcionado
            if (err) { // Si hay un error en la consulta
                console.error('Error deleting trabajador:', err);
                res.status(500).json({ error: 'Error deleting trabajador' }); // Respondemos con error 500
                return;
            }
            if (result.affectedRows === 0) { // Si no se encuentra el trabajador para eliminar
                res.status(404).json({ message: 'Trabajador not found' }); // Respondemos con error 404
                return;
            }
            res.json({ message: 'Trabajador deleted successfully' }); // Respondemos con éxito
        });
    });
    return router; // Retornamos el enrutador configurado
};