const express = require('express');
const router = express.Router();
const db = require('../config/db');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const multer = require('multer');
const path = require('path');
const { format } = require('date-fns');
const { es } = require('date-fns/locale');

// Función para crear carpetas si no existen
function crearCarpeta(ruta) {
    if (!fs.existsSync(ruta)) {
        try {
            fs.mkdirSync(ruta, { recursive: true });
            console.log(`Carpeta creada: ${ruta}`);
        } catch (mkdirError) {
            console.error(`Error al crear carpeta ${ruta}:`, mkdirError);
            // Lanzar error para manejo centralizado
            throw new Error(`No se pudo crear la estructura de carpetas: ${mkdirError.message}`);
        }
    }
}

// Configuración de Multer
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pptx', '.docx', '.pdf'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(fileExtension)) {
        cb(null, true);
    } else {
        console.warn(`Archivo rechazado (tipo no permitido): ${file.originalname}`);
        // Pasar el error específico a Multer
        cb(new Error('Tipo de archivo no permitido para la solicitud'), false);
    }
};
const upload = multer({ storage, fileFilter });


// Obtener las solicitudes de un usuario en específico
router.get('/vecino/:rut', async (req, res) => {
    try {
        const { rut } = req.params;
        if (!rut) {
            return res.status(400).json({ message: 'Falta el parámetro RUT del vecino.' });
        }

        // MODIFICADO: Añadir correo_notificacion
        const query = `
            SELECT
                s.id_solicitud, LPAD(s.id_solicitud, 10, '0') AS id_formateado,
                s.RUT_ciudadano, t.nombre_tipo, s.fecha_hora_envio, s.estado,
                s.correo_notificacion -- <<< AÑADIDO
            FROM Solicitudes s
            JOIN tipos_solicitudes t ON s.id_tipo = t.id_tipo
            WHERE s.RUT_ciudadano = ?
            ORDER BY s.fecha_hora_envio DESC
        `;

        const [solicitudes] = await db.query(query, [rut]);
        res.status(200).json({ solicitudes });

    } catch (error) {
        console.error(`Error al obtener solicitudes para el vecino ${req.params.rut}:`, error);
        res.status(500).json({ message: 'Error interno al obtener las solicitudes del vecino' });
    }
});

// Obtener todas las solicitudes
router.get('/', async (req, res) => {
    try {
        // MODIFICADO: Añadir correo_notificacion
        const [solicitudes] = await db.query(`
            SELECT
                s.id_solicitud, LPAD(s.id_solicitud, 10, '0') AS id_formateado,
                s.RUT_ciudadano, t.nombre_tipo, s.fecha_hora_envio, s.estado,
                s.ruta_carpeta, s.correo_notificacion -- <<< AÑADIDO
            FROM Solicitudes s
            JOIN tipos_solicitudes t ON s.id_tipo = t.id_tipo
            ORDER BY s.id_solicitud ASC
        `);
        res.status(200).json({ solicitudes });
    } catch (error) {
        console.error('Error al obtener solicitudes:', error);
        res.status(500).json({ message: 'Error al obtener solicitudes' });
    }
});

// Obtener una solicitud por su ID
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        // MODIFICADO: Añadir correo_notificacion
        const [solicitud] = await db.query(`
            SELECT
                s.id_solicitud, LPAD(s.id_solicitud, 10, '0') AS id_formateado,
                s.RUT_ciudadano, t.nombre_tipo, s.fecha_hora_envio, s.estado,
                s.ruta_carpeta, s.correo_notificacion -- <<< AÑADIDO
            FROM Solicitudes s
            JOIN tipos_solicitudes t ON s.id_tipo = t.id_tipo
            WHERE s.id_solicitud = ?
        `, [id]);
        if (solicitud.length === 0) {
            return res.status(404).json({ message: 'Solicitud no encontrada' });
        }
        res.status(200).json({ solicitud: solicitud[0] });
    } catch (error) {
        console.error('Error al obtener la solicitud:', error);
        res.status(500).json({ message: 'Error al obtener la solicitud' });
    }
});

// Actualizar ESTADO de una solicitud
router.put('/estado/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;
        const estadosValidos = ['Pendiente', 'Aprobada', 'Rechazada'];
        if (!estado || !estadosValidos.includes(estado)) {
            return res.status(400).json({ message: `Estado no válido. Debe ser uno de: ${estadosValidos.join(', ')}` });
        }
        const [result] = await db.query(
            'UPDATE Solicitudes SET estado = ? WHERE id_solicitud = ?',
            [estado, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Solicitud no encontrada' });
        }
        res.status(200).json({ message: 'Estado actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar el estado:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// NUEVA RUTA: Actualizar Múltiples Campos de una Solicitud (incluyendo estado y correo)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { estado, correo_notificacion /* , otros_campos... */ } = req.body;

    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ message: 'ID de solicitud inválido.' });
    }

    const fieldsToUpdate = [];
    const values = [];

    // Validar y añadir estado si se proporciona
    if (estado) {
        const estadosValidos = ['Pendiente', 'Aprobada', 'Rechazada'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ message: `Estado no válido. Debe ser uno de: ${estadosValidos.join(', ')}` });
        }
        fieldsToUpdate.push('estado = ?');
        values.push(estado);
    }

    // Validar y añadir correo_notificacion si se proporciona (permitir null o string vacío para borrarlo)
    if (req.body.hasOwnProperty('correo_notificacion')) { // Verificar si la clave existe, incluso si es null/""
         if (correo_notificacion && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo_notificacion)) {
             return res.status(400).json({ message: 'El formato del correo de notificación es inválido.' });
         }
        fieldsToUpdate.push('correo_notificacion = ?');
        values.push(correo_notificacion || null); // Guardar null si es vacío
    }

    // Añadir otros campos aquí si fuera necesario...

    if (fieldsToUpdate.length === 0) {
        return res.status(400).json({ message: 'No se proporcionaron campos válidos para actualizar.' });
    }

    // Construir y ejecutar la consulta
    let query = `UPDATE Solicitudes SET ${fieldsToUpdate.join(', ')} WHERE id_solicitud = ?`;
    values.push(id);

    try {
        const [result] = await db.query(query, values);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Solicitud no encontrada para actualizar.' });
        }
        res.status(200).json({ message: 'Solicitud actualizada correctamente' });
    } catch (error) {
        console.error(`Error al actualizar la solicitud ${id}:`, error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar la solicitud' });
    }
});


// Crear una nueva solicitud
router.post('/', upload.array('archivos'), async (req, res) => {
    // MODIFICADO: Extraer correo_notificacion
    const { rut_ciudadano, id_tipo, estado, correo_notificacion, ...otrosDatos } = req.body;
    const fecha = new Date();

    if (!rut_ciudadano || !id_tipo) {
        return res.status(400).json({ message: 'Faltan campos obligatorios: rut_ciudadano, id_tipo' });
    }
    if (correo_notificacion && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo_notificacion)) {
         return res.status(400).json({ message: 'El formato del correo de notificación es inválido.' });
    }

    let connection;
    let pdfPath = ''; // Para posible limpieza en caso de error
    let rutaSolicitud = ''; // Para posible limpieza en caso de error

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Obtener el nombre del tipo de solicitud
        const [tipoResult] = await connection.query( 'SELECT nombre_tipo FROM tipos_solicitudes WHERE id_tipo = ?', [id_tipo] );
        if (tipoResult.length === 0) { await connection.rollback(); return res.status(400).json({ message: 'El tipo de solicitud especificado no existe.' }); }
        const nombre_tipo = tipoResult[0].nombre_tipo;

        // Insertar la solicitud en la BD (con correo_notificacion)
        const estado_inicial = estado || 'Pendiente';
        const [result] = await connection.query(
            'INSERT INTO Solicitudes (RUT_ciudadano, id_tipo, fecha_hora_envio, estado, ruta_carpeta, correo_notificacion) VALUES (?, ?, NOW(), ?, ?, ?)',
            [rut_ciudadano, id_tipo, estado_inicial, '', correo_notificacion || null] // ruta_carpeta se actualiza después
        );
        const id_solicitud_num = result.insertId;
        const id_solicitud_str = id_solicitud_num.toString().padStart(10, '0');

        // Obtener nombre y apellido del ciudadano (el correo ya no se busca aquí)
        let nombreCompleto = rut_ciudadano;
        const [rowsUsuario] = await connection.query( 'SELECT nombre, apellido FROM usuarios WHERE RUT = ?', [rut_ciudadano] );
        if (rowsUsuario.length > 0) {
            nombreCompleto = `${rowsUsuario[0].nombre.trim()} ${rowsUsuario[0].apellido.trim()}`;
        } else { console.warn(`No se encontró el usuario con RUT ${rut_ciudadano} para obtener datos completos.`); }

        // Crear estructura de carpetas
        const anio = fecha.getFullYear();
        let mes = format(fecha, 'MMMM', { locale: es });
        mes = mes.charAt(0).toUpperCase() + mes.slice(1);
        const rutaAnio = `./solicitudes/${anio}`;
        const rutaMes = `${rutaAnio}/${mes}`;
        crearCarpeta(rutaAnio);
        crearCarpeta(rutaMes);
        const fechaDiaMesAnio = format(fecha, 'dd-MM-yyyy', { locale: es });
        rutaSolicitud = `${rutaMes}/${nombre_tipo} - ${nombreCompleto}, ${fechaDiaMesAnio}, ${id_solicitud_str}`; // Asignar a variable externa
        crearCarpeta(rutaSolicitud);

        // Guardar archivos adjuntos
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                const filePath = path.join(rutaSolicitud, file.originalname);
                try { fs.writeFileSync(filePath, file.buffer); }
                catch(writeErr) { console.error(`Error al escribir archivo ${file.originalname}:`, writeErr); throw new Error(`Error al guardar adjunto: ${writeErr.message}`);}
            });
        }

        // Crear el PDF
        const pdfDoc = new PDFDocument({ size: 'LETTER', margins: { top: 50, bottom: 50, left: 72, right: 72 } });
        pdfPath = path.join(rutaSolicitud, 'solicitud.pdf'); // Asignar a variable externa
        const writeStream = fs.createWriteStream(pdfPath);
        pdfDoc.pipe(writeStream);

        // --- Contenido del PDF Solicitud (Restaurado y con correo_notificacion) ---
        const logoPath = path.join(__dirname, '../img/LOGO PITRUFQUEN.png');
        if (fs.existsSync(logoPath)) { pdfDoc.image(logoPath, pdfDoc.page.margins.left, pdfDoc.y, { width: 80 }); pdfDoc.moveDown(0.5); }
        pdfDoc.y = pdfDoc.page.margins.top + (fs.existsSync(logoPath) ? 20 : 0);

        pdfDoc.font('Helvetica-Bold').fontSize(16).text('COMPROBANTE DE SOLICITUD', { align: 'center' }).moveDown(1.5);
        pdfDoc.strokeColor('#cccccc').lineWidth(1).moveTo(pdfDoc.page.margins.left, pdfDoc.y).lineTo(pdfDoc.page.width - pdfDoc.page.margins.right, pdfDoc.y).stroke().moveDown(1.5);

        // Obtener fecha/hora de envío real desde la BD (ya tenemos id_solicitud_num)
        const [solicitudRow] = await connection.query( 'SELECT fecha_hora_envio FROM Solicitudes WHERE id_solicitud = ?', [id_solicitud_num] );
        const fecha_hora_envio_real = format( new Date(solicitudRow[0].fecha_hora_envio), 'dd/MM/yyyy hh:mm:ss a', { locale: es } );

        // Sección Datos Generales
        pdfDoc.font('Helvetica-Bold').fontSize(12).text('Datos de la Solicitud:').moveDown(0.5);
        pdfDoc.font('Helvetica').fontSize(11);
        pdfDoc.text(`ID Solicitud: ${id_solicitud_str}`);
        pdfDoc.text(`Tipo Solicitud: ${nombre_tipo}`);
        pdfDoc.text(`Fecha y Hora de Envío: ${fecha_hora_envio_real}`).moveDown(1);

        // Sección Datos del Solicitante
        pdfDoc.font('Helvetica-Bold').fontSize(12).text('Datos del Solicitante:').moveDown(0.5);
        pdfDoc.font('Helvetica').fontSize(11);
        pdfDoc.text(`RUT: ${rut_ciudadano}`);
        pdfDoc.text(`Nombre: ${nombreCompleto}`);
        // Mostrar solo correo_notificacion
        pdfDoc.text(`Correo Notificación: ${correo_notificacion || 'No especificado'}`).moveDown(2);

        pdfDoc.strokeColor('#cccccc').lineWidth(1).moveTo(pdfDoc.page.margins.left, pdfDoc.y).lineTo(pdfDoc.page.width - pdfDoc.page.margins.right, pdfDoc.y).stroke().moveDown(2);

        // Sección Datos Adicionales (Restaurada)
        if (Object.keys(otrosDatos).length > 0) {
            pdfDoc.font('Helvetica-Bold').fontSize(12).text('Datos Adicionales Ingresados:', { underline: true }).moveDown(1);
            pdfDoc.font('Helvetica').fontSize(11);
            for (const key in otrosDatos) {
                 const keyFormateada = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                 pdfDoc.text(`${keyFormateada}: ${otrosDatos[key]}`, { align: 'justify' }).moveDown(0.5);
            }
            pdfDoc.moveDown(2);
            pdfDoc.strokeColor('#cccccc').lineWidth(1).moveTo(pdfDoc.page.margins.left, pdfDoc.y).lineTo(pdfDoc.page.width - pdfDoc.page.margins.right, pdfDoc.y).stroke().moveDown(2);
        }

        // Sección Archivos Adjuntos (Restaurada)
        if (req.files && req.files.length > 0) {
            pdfDoc.font('Helvetica-Bold').fontSize(12).text('Archivos Adjuntos (Referencia):', { underline: true }).moveDown(1).font('Helvetica').fontSize(10);
            req.files.forEach(file => { pdfDoc.text(`- ${file.originalname}`).moveDown(0.5); });
            pdfDoc.moveDown(1); // Espacio después de la lista

            // Mostrar imágenes adjuntas en páginas separadas (Restaurado)
            req.files.forEach(file => {
                 const fileExtension = path.extname(file.originalname).toLowerCase();
                 if (['.jpg', '.jpeg', '.png'].includes(fileExtension)) {
                     const imagePath = path.join(rutaSolicitud, file.originalname);
                     try {
                          pdfDoc.addPage().font('Helvetica-Bold').fontSize(12).text(`Adjunto: ${file.originalname}`, {align: 'center'}).moveDown(1);
                          const img = pdfDoc.openImage(imagePath);
                          const pageHeight = pdfDoc.page.height - pdfDoc.page.margins.top - pdfDoc.page.margins.bottom - 50;
                          const pageWidth = pdfDoc.page.width - pdfDoc.page.margins.left - pdfDoc.page.margins.right;
                          pdfDoc.image(imagePath, { fit: [pageWidth, pageHeight], align: 'center', valign: 'center' });
                     } catch (imageError) { console.error(`Error al agregar imagen ${file.originalname} al PDF:`, imageError); }
                 }
             });
        }
        // --- Fin Contenido PDF ---

        pdfDoc.end();
        await new Promise((resolve, reject) => {
             writeStream.on('finish', resolve);
             writeStream.on('error', (err) => reject(new Error(`Fallo al escribir PDF de solicitud: ${err.message}`)));
        });
        console.log(`PDF de solicitud creado: ${pdfPath}`);

        // Actualizar la ruta_carpeta en la BD (después de crear carpeta y PDF)
        await connection.query( 'UPDATE Solicitudes SET ruta_carpeta = ? WHERE id_solicitud = ?', [rutaSolicitud, id_solicitud_num] );
        console.log(`Ruta carpeta actualizada para solicitud ${id_solicitud_num}`);

        // Confirmar transacción
        await connection.commit();
        console.log(`Transacción completada para solicitud ${id_solicitud_num}`);

        res.status(201).json({
            message: 'Solicitud creada exitosamente',
            id: id_solicitud_str, // Devolver el ID formateado
            ruta: rutaSolicitud
        });
    } catch (error) {
        console.error('Error detallado al crear solicitud:', error);
        if (connection) { try { await connection.rollback(); console.log("Rollback completado (solicitudes)."); } catch (rbError) { console.error("Error durante rollback (solicitudes):", rbError); } }
        // Limpiar PDF y carpeta si se crearon antes del error (mejor esfuerzo)
        if (pdfPath && fs.existsSync(pdfPath)) { try { fs.unlinkSync(pdfPath); console.log("PDF de solicitud erróneo eliminado."); } catch(e) {console.error("Error al eliminar PDF erróneo:", e)} }
        if (rutaSolicitud && fs.existsSync(rutaSolicitud)) { try { fs.rmdirSync(rutaSolicitud, { recursive: true }); console.log("Carpeta de solicitud errónea eliminada."); } catch(e) {console.error("Error al eliminar carpeta errónea:", e)} } // recursive: true es más seguro si hay archivos dentro

        if (error.message === 'Tipo de archivo no permitido para la solicitud') { return res.status(400).json({ message: error.message }); }
        if (error.message.startsWith('Error al guardar adjunto') || error.message.startsWith('Fallo al escribir PDF') || error.message.startsWith('No se pudo crear')) { return res.status(500).json({ message: `Error interno del servidor: ${error.message}` }); }
        res.status(500).json({ message: 'Error interno del servidor al crear la solicitud' });
    } finally {
        if (connection) { connection.release(); console.log("Conexión liberada (solicitudes)."); }
    }
});

module.exports = router;