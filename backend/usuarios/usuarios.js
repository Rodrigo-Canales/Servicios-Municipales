const express = require('express'); // Importamos Express
const router = express.Router(); // Creamos un enrutador para definir las rutas relacionadas con "Usuarios"

module.exports = (app, db) => {

    router.get('/', (req, res) => { // Ruta para Obtener Todos los Usuarios (Solo Administradores)
        const query = 'SELECT * FROM Usuarios'; // Consulta SQL para obtener todos los usuarios
        db.query(query, (err, results) => { // Ejecutamos la consulta en la base de datos
            if (err) { // Si hay un error en la consulta
                console.error('Error fetching users:', err);
                res.status(500).json({ error: 'Error fetching users' }); // Respondemos con error 500
                return;
            }
            res.json(results); // Enviamos los resultados en formato JSON
        });
    });

    router.get('/:rut', (req, res) => { // Ruta para Obtener un Usuario por RUT (Solo Administradores)
        const rut = req.params.rut; // Obtenemos el RUT desde los parámetros de la URL
        const query = 'SELECT * FROM Usuarios WHERE rut = ?'; // Consulta SQL para obtener un usuario por RUT

        db.query(query, [rut], (err, results) => { // Ejecutamos la consulta con el RUT proporcionado
            if (err) { // Si hay un error en la consulta
                console.error('Error fetching user:', err);
                res.status(500).json({ error: 'Error fetching user' }); // Respondemos con error 500
                return;
            }
            if (results.length === 0) { // Si no se encuentra un usuario con ese RUT
                res.status(404).json({ message: 'User not found' }); // Respondemos con error 404
                return;
            }
            res.json(results[0]); // Enviamos el primer resultado encontrado
        });
    });

    router.post('/', (req, res) => { // Ruta para Crear un Nuevo Usuario (Solo Administradores)
        const { rut, nombres, apellidos, correo } = req.body; // Extraemos los datos del cuerpo de la solicitud
        const query = 'INSERT INTO Usuarios (rut, nombres, apellidos, correo) VALUES (?, ?, ?, ?)'; // Consulta SQL para insertar un nuevo usuario
        db.query(query, [rut, nombres, apellidos, correo], (err, result) => { // Ejecutamos la consulta con los datos proporcionados
            if (err) { // Si hay un error en la consulta
                console.error('Error creating user:', err);
                res.status(500).json({ error: 'Error creating user' }); // Respondemos con error 500
                return;
            }
            res.status(201).json({ message: 'User created successfully', id: result.insertId }); // Respondemos con éxito
        });
    });

    router.put('/:rut', (req, res) => { // Ruta para Actualizar un Usuario Existente (Solo Administradores)
        const rut = req.params.rut; // Obtenemos el RUT desde los parámetros de la URL
        const { nombres, apellidos, correo } = req.body; // Extraemos los datos del cuerpo de la solicitud
        const query = 'UPDATE Usuarios SET nombres = ?, apellidos = ?, correo = ? WHERE rut = ?'; // Consulta SQL para actualizar un usuario
        db.query(query, [nombres, apellidos, correo, rut], (err, result) => { // Ejecutamos la consulta con los nuevos datos
            if (err) { // Si hay un error en la consulta
                console.error('Error updating user:', err);
                res.status(500).json({ error: 'Error updating user' }); // Respondemos con error 500
                return;
            }
            if (result.affectedRows === 0) { // Si no se encuentra el usuario para actualizar
                res.status(404).json({ message: 'User not found' }); // Respondemos con error 404
                return;
            }
            res.json({ message: 'User updated successfully' }); // Respondemos con éxito
        });
    });

    router.delete('/:rut', (req, res) => { // Ruta para Eliminar un Usuario (Solo Administradores)
        const rut = req.params.rut; // Obtenemos el RUT desde los parámetros de la URL
        const query = 'DELETE FROM Usuarios WHERE rut = ?'; // Consulta SQL para eliminar un usuario
        db.query(query, [rut], (err, result) => { // Ejecutamos la consulta con el RUT proporcionado
            if (err) { // Si hay un error en la consulta
                console.error('Error deleting user:', err);
                res.status(500).json({ error: 'Error deleting user' }); // Respondemos con error 500
                return;
            }
            if (result.affectedRows === 0) { // Si no se encuentra el usuario para eliminar
                res.status(404).json({ message: 'User not found' }); // Respondemos con error 404
                return;
            }
            res.json({ message: 'User deleted successfully' }); // Respondemos con éxito
        });
    });
    return router; // Retornamos el enrutador configurado
};