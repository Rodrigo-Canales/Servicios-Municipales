const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Asegúrate que la ruta a tu config de DB sea correcta

// --- Rutas CRUD para Preguntas Frecuentes ---

/**
 * @route   GET /api/preguntas_frecuentes
 * @desc    Obtener todas las preguntas frecuentes con el nombre del tipo de solicitud
 * @access  Public or Private (depende de tu caso de uso)
 */
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT
                pf.id_pregunta,
                pf.pregunta,
                pf.respuesta,
                pf.id_tipo,
                ts.nombre_tipo AS nombre_tipo_solicitud
            FROM Preguntas_Frecuentes pf
            JOIN Tipos_Solicitudes ts ON pf.id_tipo = ts.id_tipo
            ORDER BY pf.id_tipo ASC, pf.id_pregunta ASC -- Ordenar por tipo y luego por ID de pregunta
        `;
        const [preguntas] = await db.query(query);
        res.status(200).json({ preguntas_frecuentes: preguntas });
    } catch (error) {
        console.error('Error al obtener preguntas frecuentes:', error);
        res.status(500).json({ message: 'Error interno al obtener preguntas frecuentes' });
    }
});

/**
 * @route   GET /api/preguntas_frecuentes/:id
 * @desc    Obtener una pregunta frecuente por su ID
 * @access  Public or Private
 */
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    if (!id || isNaN(parseInt(id)) || parseInt(id) <= 0) {
        return res.status(400).json({ message: 'ID de pregunta inválido.' });
    }

    try {
        const query = `
            SELECT
                pf.id_pregunta,
                pf.pregunta,
                pf.respuesta,
                pf.id_tipo,
                ts.nombre_tipo AS nombre_tipo_solicitud
            FROM Preguntas_Frecuentes pf
            JOIN Tipos_Solicitudes ts ON pf.id_tipo = ts.id_tipo
            WHERE pf.id_pregunta = ?
        `;
        const [pregunta] = await db.query(query, [id]);

        if (pregunta.length === 0) {
            return res.status(404).json({ message: 'Pregunta frecuente no encontrada' });
        }
        res.status(200).json({ pregunta_frecuente: pregunta[0] });
    } catch (error) {
        console.error(`Error al obtener la pregunta frecuente ${id}:`, error);
        res.status(500).json({ message: 'Error interno al obtener la pregunta frecuente' });
    }
});

/**
 * @route   GET /api/preguntas_frecuentes/tipo/:id_tipo
 * @desc    Obtener todas las preguntas frecuentes para un tipo de solicitud específico
 * @access  Public or Private
 */
router.get('/tipo/:id_tipo', async (req, res) => {
    const { id_tipo } = req.params;
    if (!id_tipo || isNaN(parseInt(id_tipo)) || parseInt(id_tipo) <= 0) {
        return res.status(400).json({ message: 'ID de tipo de solicitud inválido.' });
    }

    try {
        // Primero, verificar si el tipo de solicitud existe (opcional pero recomendado)
        const [tipoExists] = await db.query('SELECT 1 FROM Tipos_Solicitudes WHERE id_tipo = ?', [id_tipo]);
        if (tipoExists.length === 0) {
             return res.status(404).json({ message: 'Tipo de solicitud no encontrado.' });
        }

        // Obtener las preguntas para ese tipo
        const query = `
            SELECT
                pf.id_pregunta,
                pf.pregunta,
                pf.respuesta,
                pf.id_tipo
                -- No necesitamos el nombre del tipo aquí, ya lo sabemos por el parámetro
            FROM Preguntas_Frecuentes pf
            WHERE pf.id_tipo = ?
            ORDER BY pf.id_pregunta ASC
        `;
        const [preguntas] = await db.query(query, [id_tipo]);

        // Devolver un array vacío si no hay preguntas para ese tipo es correcto (status 200)
        res.status(200).json({ preguntas_frecuentes: preguntas });
    } catch (error) {
        console.error(`Error al obtener preguntas frecuentes para el tipo ${id_tipo}:`, error);
        res.status(500).json({ message: 'Error interno al obtener preguntas frecuentes por tipo' });
    }
});


/**
 * @route   POST /api/preguntas_frecuentes
 * @desc    Crear una nueva pregunta frecuente
 * @access  Private (Admin)
 */
router.post('/', async (req, res) => {
    const { pregunta, respuesta, id_tipo } = req.body;

    // Validaciones
    if (!pregunta || !respuesta || !id_tipo) {
        return res.status(400).json({ message: 'Faltan campos obligatorios: pregunta, respuesta, id_tipo' });
    }
    if (isNaN(parseInt(id_tipo))) {
        return res.status(400).json({ message: 'El campo id_tipo debe ser un número.' });
    }

    try {
        // Verificar si el id_tipo existe antes de insertar (buena práctica)
        const [tipoExists] = await db.query('SELECT 1 FROM Tipos_Solicitudes WHERE id_tipo = ?', [id_tipo]);
        if (tipoExists.length === 0) {
             return res.status(400).json({ message: 'El id_tipo proporcionado no corresponde a un tipo de solicitud existente.' });
        }

        // Insertar la nueva pregunta
        const query = 'INSERT INTO Preguntas_Frecuentes (pregunta, respuesta, id_tipo) VALUES (?, ?, ?)';
        const [result] = await db.query(query, [pregunta, respuesta, id_tipo]);

        res.status(201).json({
            message: 'Pregunta frecuente creada exitosamente',
            id_pregunta: result.insertId, // Devolver el ID de la nueva pregunta
            pregunta: pregunta,
            respuesta: respuesta,
            id_tipo: id_tipo
        });
    } catch (error) {
        console.error('Error al crear pregunta frecuente:', error);
        // Manejar error de clave foránea si la validación anterior fallara por alguna razón
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
             return res.status(400).json({ message: 'El id_tipo proporcionado no existe.' });
        }
        res.status(500).json({ message: 'Error interno al crear la pregunta frecuente' });
    }
});

/**
 * @route   PUT /api/preguntas_frecuentes/:id
 * @desc    Actualizar una pregunta frecuente existente
 * @access  Private (Admin)
 */
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { pregunta, respuesta, id_tipo } = req.body;

    // Validar ID de la URL
    if (!id || isNaN(parseInt(id)) || parseInt(id) <= 0) {
        return res.status(400).json({ message: 'ID de pregunta inválido.' });
    }
    // Validar campos del body (al menos uno debe estar presente para actualizar)
    if (!pregunta && !respuesta && !id_tipo) {
        return res.status(400).json({ message: 'Debe proporcionar al menos un campo para actualizar (pregunta, respuesta o id_tipo).' });
    }
    // Validar id_tipo si se proporciona
    if (id_tipo && isNaN(parseInt(id_tipo))) {
         return res.status(400).json({ message: 'El campo id_tipo debe ser un número si se proporciona.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Verificar si la pregunta existe
        const [preguntaExists] = await connection.query('SELECT 1 FROM Preguntas_Frecuentes WHERE id_pregunta = ?', [id]);
        if (preguntaExists.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Pregunta frecuente no encontrada.' });
        }

        // Si se proporciona un nuevo id_tipo, verificar que exista
        if (id_tipo) {
            const [tipoExists] = await connection.query('SELECT 1 FROM Tipos_Solicitudes WHERE id_tipo = ?', [id_tipo]);
            if (tipoExists.length === 0) {
                 await connection.rollback();
                 return res.status(400).json({ message: 'El nuevo id_tipo proporcionado no existe.' });
            }
        }

        // Construir la consulta UPDATE dinámicamente
        let query = 'UPDATE Preguntas_Frecuentes SET ';
        const fieldsToUpdate = [];
        const values = [];

        if (pregunta) {
            fieldsToUpdate.push('pregunta = ?');
            values.push(pregunta);
        }
        if (respuesta) {
            fieldsToUpdate.push('respuesta = ?');
            values.push(respuesta);
        }
        if (id_tipo) {
            fieldsToUpdate.push('id_tipo = ?');
            values.push(id_tipo);
        }

        query += fieldsToUpdate.join(', '); // Añadir los campos a actualizar
        query += ' WHERE id_pregunta = ?'; // Condición WHERE
        values.push(id); // Añadir el ID al final de los valores

        // Ejecutar la actualización
        const [result] = await connection.query(query, values);

        await connection.commit();

        if (result.affectedRows === 0) {
            // Esto no debería ocurrir si la verificación inicial funcionó, pero por si acaso
            return res.status(404).json({ message: 'Pregunta frecuente no encontrada para actualizar.' });
        }

        res.status(200).json({ message: 'Pregunta frecuente actualizada exitosamente' });

    } catch (error) {
        console.error(`Error al actualizar la pregunta frecuente ${id}:`, error);
        if (connection) await connection.rollback();
         // Manejar error de clave foránea si la validación falló
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
             return res.status(400).json({ message: 'El id_tipo proporcionado no existe.' });
        }
        res.status(500).json({ message: 'Error interno al actualizar la pregunta frecuente' });
    } finally {
        if (connection) connection.release();
    }
});

/**
 * @route   DELETE /api/preguntas_frecuentes/:id
 * @desc    Eliminar una pregunta frecuente
 * @access  Private (Admin)
 */
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    if (!id || isNaN(parseInt(id)) || parseInt(id) <= 0) {
        return res.status(400).json({ message: 'ID de pregunta inválido.' });
    }

    try {
        const query = 'DELETE FROM Preguntas_Frecuentes WHERE id_pregunta = ?';
        const [result] = await db.query(query, [id]);

        if (result.affectedRows === 0) {
            // Si no se eliminó ninguna fila, la pregunta no existía
            return res.status(404).json({ message: 'Pregunta frecuente no encontrada' });
        }

        res.status(200).json({ message: 'Pregunta frecuente eliminada exitosamente' });
    } catch (error) {
        console.error(`Error al eliminar la pregunta frecuente ${id}:`, error);
        // Nota: No se esperan errores de FK aquí debido a ON DELETE CASCADE en otras tablas,
        // pero podrían ocurrir otros errores de base de datos.
        res.status(500).json({ message: 'Error interno al eliminar la pregunta frecuente' });
    }
});


module.exports = router;