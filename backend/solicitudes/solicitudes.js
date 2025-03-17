const express = require('express'); // Importa el módulo express para gestionar rutas HTTP
const router = express.Router(); // Crea un router para definir las rutas
const mysql = require('mysql2'); // Importa el módulo mysql2 para interactuar con la base de datos MySQL
const path = require('path'); // Importa el módulo path para manejar rutas de archivos
const fs = require('fs'); // Importa el módulo fs para interactuar con el sistema de archivos
const multer = require('multer'); // Importa el módulo multer para gestionar la subida de archivos
const { v4: uuidv4 } = require('uuid'); // Importa la función uuidv4 para generar identificadores únicos

module.exports = (app, db) => { // Exporta una función que acepta 'app' (la aplicación express) y 'db' (la conexión a la base de datos)

    // Configuración de Multer para gestionar el almacenamiento de archivos
    const storage = multer.diskStorage({
        destination: (req, file, cb) => { // Define la ruta de destino para los archivos subidos
            const fecha = new Date(); // Obtiene la fecha actual
            const anio = fecha.getFullYear(); // Extrae el año actual
            const mes = fecha.toLocaleString('default', { month: 'long' }); // Extrae el mes en formato largo

            const rutaCarpetaAnio = path.join(__dirname, '..', 'Directorio de Solicitudes', anio); // Crea la ruta para la carpeta del año
            const rutaCarpetaMes = path.join(rutaCarpetaAnio, mes); // Crea la ruta para la carpeta del mes

            // Crea las carpetas si no existen
            if (!fs.existsSync(rutaCarpetaAnio)) { // Verifica si la carpeta del año no existe
                fs.mkdirSync(rutaCarpetaAnio); // Si no existe, la crea
            }
            if (!fs.existsSync(rutaCarpetaMes)) { // Verifica si la carpeta del mes no existe
                fs.mkdirSync(rutaCarpetaMes); // Si no existe, la crea
            }

            cb(null, rutaCarpetaMes); // Llama al callback con la ruta donde se guardarán los archivos
        },
        filename: (req, file, cb) => { // Define el nombre del archivo subido
            const fecha = new Date(); // Obtiene la fecha actual
            const fechaFormateada = fecha.toISOString().replace(/[:]/g, '-'); // Formatea la fecha para evitar caracteres no permitidos
            const nombreArchivo = uuidv4() + '-' + file.originalname; // Genera un nombre único para el archivo combinando un UUID con el nombre original del archivo
            cb(null, nombreArchivo); // Llama al callback con el nombre del archivo
        }
    });

    const upload = multer({ storage: storage }); // Inicializa multer con la configuración de almacenamiento

    // Ruta para Crear una Nueva Solicitud
    router.post('/', upload.array('archivos'), (req, res) => { // Define una ruta POST para crear una nueva solicitud
        const { rut_usuario, tipo_solicitud, descripcion } = req.body; // Extrae los datos del cuerpo de la solicitud

        // Obtener las rutas de los archivos subidos
        let rutasArchivos = []; // Inicializa un array para almacenar las rutas de los archivos subidos
        if (req.files) { // Si hay archivos subidos
            req.files.forEach(file => { // Itera sobre cada archivo subido
                rutasArchivos.push('/' + path.basename(file.path)); // Guarda la ruta del archivo en el array
            });
        }

        const query = 'INSERT INTO Solicitudes (rut_usuario, tipo_solicitud, descripcion, archivo_adjunto) VALUES (?, ?, ?, ?)'; // Define la consulta SQL para insertar la solicitud en la base de datos
        db.query(query, [rut_usuario, tipo_solicitud, descripcion, JSON.stringify(rutasArchivos)], (err, result) => { // Ejecuta la consulta
            if (err) { // Si ocurre un error en la consulta
                console.error('Error creating solicitud:', err); // Imprime el error
                res.status(500).json({ error: 'Error creating solicitud' }); // Responde con un error
                return;
            }
            res.status(201).json({ message: 'Solicitud created successfully', id: result.insertId }); // Responde con éxito y el ID de la nueva solicitud
        });
    });

    // Ruta para Obtener Todas las Solicitudes
    router.get('/', (req, res) => { // Define una ruta GET para obtener todas las solicitudes
        const query = 'SELECT * FROM Solicitudes'; // Define la consulta SQL para obtener todas las solicitudes
        db.query(query, (err, results) => { // Ejecuta la consulta
            if (err) { // Si ocurre un error en la consulta
                console.error('Error fetching solicitudes:', err); // Imprime el error
                res.status(500).json({ error: 'Error fetching solicitudes' }); // Responde con un error
                return;
            }
            results.forEach(result => { // Itera sobre los resultados de la consulta
                try {
                    result.archivo_adjunto = JSON.parse(result.archivo_adjunto); // Intenta parsear los archivos adjuntos (si existe)
                } catch (error) {
                    result.archivo_adjunto = []; // Si no es un JSON válido, asigna un array vacío
                }
            });
            res.json(results); // Responde con todos los resultados de la consulta
        });
    });

    // Ruta para Obtener una Solicitud por ID
    router.get('/:id', (req, res) => { // Define una ruta GET para obtener una solicitud por su ID
        const id = req.params.id; // Obtiene el ID de los parámetros de la ruta
        const query = 'SELECT * FROM Solicitudes WHERE id_solicitud = ?'; // Define la consulta SQL para obtener la solicitud por ID
        db.query(query, [id], (err, results) => { // Ejecuta la consulta
            if (err) { // Si ocurre un error en la consulta
                console.error('Error fetching solicitud:', err); // Imprime el error
                res.status(500).json({ error: 'Error fetching solicitud' }); // Responde con un error
                return;
            }
            if (results.length === 0) { // Si no se encuentra la solicitud
                res.status(404).json({ message: 'Solicitud not found' }); // Responde con un error 404
                return;
            }
            try {
                results[0].archivo_adjunto = JSON.parse(results[0].archivo_adjunto); // Intenta parsear los archivos adjuntos
            } catch (error) {
                results[0].archivo_adjunto = []; // Si no es un JSON válido, asigna un array vacío
            }
            res.json(results[0]); // Responde con la solicitud encontrada
        });
    });

    // Ruta para Actualizar una Solicitud Existente
    router.put('/:id', upload.array('archivos'), (req, res) => { // Define una ruta PUT para actualizar una solicitud por su ID
        const id = req.params.id; // Obtiene el ID de los parámetros de la ruta
        const { rut_usuario, tipo_solicitud, descripcion } = req.body; // Extrae los datos del cuerpo de la solicitud

        // Obtener las rutas de los archivos subidos
        let rutasArchivos = []; // Inicializa un array para almacenar las rutas de los archivos subidos
        if (req.files) { // Si hay archivos subidos
            req.files.forEach(file => { // Itera sobre cada archivo subido
                rutasArchivos.push('/' + path.basename(file.path)); // Guarda la ruta del archivo en el array
            });
        }

        const query = 'UPDATE Solicitudes SET rut_usuario = ?, tipo_solicitud = ?, descripcion = ?, archivo_adjunto = ? WHERE id_solicitud = ?'; // Define la consulta SQL para actualizar la solicitud
        db.query(query, [rut_usuario, tipo_solicitud, descripcion, JSON.stringify(rutasArchivos), id], (err, result) => { // Ejecuta la consulta
            if (err) { // Si ocurre un error en la consulta
                console.error('Error updating solicitud:', err); // Imprime el error
                res.status(500).json({ error: 'Error updating solicitud' }); // Responde con un error
                return;
            }
            if (result.affectedRows === 0) { // Si no se encontró la solicitud para actualizar
                res.status(404).json({ message: 'Solicitud not found' }); // Responde con un error 404
                return;
            }
            res.json({ message: 'Solicitud updated successfully' }); // Responde con éxito
        });
    });

    // Ruta para Eliminar una Solicitud
    router.delete('/:id', (req, res) => { // Define una ruta DELETE para eliminar una solicitud por su ID
        const id = req.params.id; // Obtiene el ID de los parámetros de la ruta
        const query = 'SELECT archivo_adjunto FROM Solicitudes WHERE id_solicitud = ?'; // Define la consulta SQL para obtener los archivos adjuntos de la solicitud
        db.query(query, [id], (err, results) => { // Ejecuta la consulta
            if (err) { // Si ocurre un error en la consulta
                console.error('Error fetching solicitud:', err); // Imprime el error
                res.status(500).json({ error: 'Error fetching solicitud' }); // Responde con un error
                return;
            }
            if (results.length === 0) { // Si no se encuentra la solicitud
                res.status(404).json({ message: 'Solicitud not found' }); // Responde con un error 404
                return;
            }

            // Eliminar los archivos adjuntos del sistema de archivos
            try {
                const archivosAdjuntos = JSON.parse(results[0].archivo_adjunto); // Intenta parsear los archivos adjuntos
                archivosAdjuntos.forEach(archivo => { // Itera sobre cada archivo adjunto
                    fs.unlink(path.join(__dirname, '..', archivo), (err) => { // Elimina cada archivo del sistema de archivos
                        if (err) {
                            console.error('Error deleting file:', err); // Imprime el error si ocurre
                        }
                    });
                });
            } catch (error) {
                console.error('Error parsing archivo_adjunto:', error); // Si ocurre un error al parsear los archivos adjuntos
            }

            // Eliminar la solicitud de la base de datos
            const queryDelete = 'DELETE FROM Solicitudes WHERE id_solicitud = ?'; // Define la consulta SQL para eliminar la solicitud
            db.query(queryDelete, [id], (err, result) => { // Ejecuta la consulta
                if (err) { // Si ocurre un error en la consulta
                    console.error('Error deleting solicitud:', err); // Imprime el error
                    res.status(500).json({ error: 'Error deleting solicitud' }); // Responde con un error
                    return;
                }
                if (result.affectedRows === 0) { // Si no se encontró la solicitud para eliminar
                    res.status(404).json({ message: 'Solicitud not found' }); // Responde con un error 404
                    return;
                }
                res.json({ message: 'Solicitud deleted successfully' }); // Responde con éxito
            });
        });
    });

    return router; // Devuelve el router con todas las rutas definidas
};
