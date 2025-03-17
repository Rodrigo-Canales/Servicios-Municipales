const express = require('express'); // Importamos el módulo Express para crear el servidor y manejar las rutas
const router = express.Router(); // Creamos un enrutador de Express para manejar las rutas específicas de "Áreas"

module.exports = (app, db) => { // Exportamos la función que recibe "app" y "db", el primero es el servidor Express y el segundo es la conexión a la base de datos

    router.get('/', (req, res) => { // Ruta GET para obtener todas las áreas
        const query = 'SELECT * FROM Areas'; // Consulta SQL que selecciona todas las áreas desde la tabla "Areas"
        db.query(query, (err, results) => { // Ejecutamos la consulta en la base de datos
            if (err) { // Si ocurre un error al ejecutar la consulta
                console.error('Error fetching areas:', err); // Mostramos el error en la consola
                res.status(500).json({ error: 'Error fetching areas' }); // Respondemos con un error 500 (interno del servidor)
                return;
            }
            res.json(results); // Si la consulta es exitosa, devolvemos los resultados en formato JSON
        });
    });

    router.get('/:id', (req, res) => { // Ruta GET para obtener un área por su ID
        const id = req.params.id; // Obtenemos el ID del área desde los parámetros de la URL
        const query = 'SELECT * FROM Areas WHERE id_area = ?'; // Consulta SQL para obtener el área con el ID proporcionado
        db.query(query, [id], (err, results) => { // Ejecutamos la consulta pasando el ID como parámetro
            if (err) { // Si ocurre un error en la consulta
                console.error('Error fetching area:', err); // Mostramos el error en la consola
                res.status(500).json({ error: 'Error fetching area' }); // Respondemos con un error 500
                return;
            }
            if (results.length === 0) { // Si no se encuentran resultados (ningún área con ese ID)
                res.status(404).json({ message: 'Area not found' }); // Respondemos con un error 404 indicando que no se encontró el área
                return;
            }
            res.json(results[0]); // Si encontramos el área, la devolvemos como un objeto JSON
        });
    });

    router.post('/', (req, res) => { // Ruta POST para crear una nueva área
        const { nombre_area } = req.body; // Extraemos el nombre del área desde el cuerpo de la solicitud
        const query = 'INSERT INTO Areas (nombre_area) VALUES (?)'; // Consulta SQL para insertar una nueva área
        db.query(query, [nombre_area], (err, result) => { // Ejecutamos la consulta con el nombre del área
            if (err) { // Si hay un error en la consulta
                console.error('Error creating area:', err); // Mostramos el error en la consola
                res.status(500).json({ error: 'Error creating area' }); // Respondemos con un error 500
                return;
            }
            res.status(201).json({ message: 'Area created successfully', id: result.insertId }); // Respondemos con un mensaje de éxito y el ID del área recién creada
        });
    });

    router.put('/:id', (req, res) => { // Ruta PUT para actualizar una área existente
        const id = req.params.id; // Obtenemos el ID del área desde los parámetros de la URL
        const { nombre_area } = req.body; // Extraemos el nuevo nombre del área desde el cuerpo de la solicitud
        const query = 'UPDATE Areas SET nombre_area = ? WHERE id_area = ?'; // Consulta SQL para actualizar el nombre del área
        db.query(query, [nombre_area, id], (err, result) => { // Ejecutamos la consulta con el nuevo nombre y el ID
            if (err) { // Si ocurre un error en la consulta
                console.error('Error updating area:', err); // Mostramos el error en la consola
                res.status(500).json({ error: 'Error updating area' }); // Respondemos con un error 500
                return;
            }
            if (result.affectedRows === 0) { // Si no se encuentra un área para actualizar
                res.status(404).json({ message: 'Area not found' }); // Respondemos con un error 404
                return;
            }
            res.json({ message: 'Area updated successfully' }); // Respondemos con un mensaje de éxito si se actualiza correctamente
        });
    });

    router.delete('/:id', (req, res) => { // Ruta DELETE para eliminar un área por su ID
        const id = req.params.id; // Obtenemos el ID del área desde los parámetros de la URL
        const query = 'DELETE FROM Areas WHERE id_area = ?'; // Consulta SQL para eliminar el área con el ID proporcionado
        db.query(query, [id], (err, result) => { // Ejecutamos la consulta con el ID
            if (err) { // Si hay un error en la consulta
                console.error('Error deleting area:', err); // Mostramos el error en la consola
                res.status(500).json({ error: 'Error deleting area' }); // Respondemos con un error 500
                return;
            }
            if (result.affectedRows === 0) { // Si no se encuentra un área para eliminar
                res.status(404).json({ message: 'Area not found' }); // Respondemos con un error 404
                return;
            }
            res.json({ message: 'Area deleted successfully' }); // Respondemos con un mensaje de éxito si se elimina correctamente
        });
    });
    return router; // Retornamos el enrutador con todas las rutas configuradas
};