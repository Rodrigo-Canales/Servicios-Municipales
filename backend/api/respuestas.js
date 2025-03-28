const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Asegúrate que la ruta a tu config de DB sea correcta
const fs = require('fs');
const PDFDocument = require('pdfkit');
const multer = require('multer');
const path = require('path');
const { format } = require('date-fns');
const { es } = require('date-fns/locale');
const nodemailer = require('nodemailer'); // Importar nodemailer
require('dotenv').config(); // Cargar variables de entorno

// --- Configuración del Transporter de Nodemailer ---
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587", 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    // tls: { rejectUnauthorized: false } // Descomentar si es necesario
});

transporter.verify(function(error, success) {
    if (error) { console.error("Error al conectar con el servicio de correo:", error); }
    else { console.log("✅ Servidor de correo listo para enviar mensajes."); }
});

// --- Funciones Auxiliares ---
function crearCarpetaSiNoExiste(ruta) {
    if (!fs.existsSync(ruta)) {
        try { fs.mkdirSync(ruta, { recursive: true }); console.log(`Carpeta creada: ${ruta}`); }
        catch (mkdirError) { console.error(`Error al crear carpeta ${ruta}:`, mkdirError); throw new Error(`No se pudo crear la estructura de carpetas necesaria: ${mkdirError.message}`); }
    }
}

const storageRespuesta = multer.memoryStorage();
const fileFilterRespuesta = (req, file, cb) => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(fileExtension)) { cb(null, true); }
    else { console.warn(`Archivo rechazado (tipo no permitido): ${file.originalname}`); cb(new Error('Tipo de archivo no permitido para la respuesta'), false); }
};
const uploadRespuesta = multer({ storage: storageRespuesta, fileFilter: fileFilterRespuesta });

// --- Rutas CRUD para Respuestas ---

/**
 * @route   POST /api/respuestas
 * @desc    Crear una nueva respuesta, PDF, guardar adjuntos y enviar notificación por correo.
 * @access  Private
 */
router.post('/', uploadRespuesta.array('archivosRespuesta'), async (req, res) => {
    const { id_solicitud, RUT_trabajador, respuesta_texto, estado_solicitud } = req.body;
    const estadosValidos = ['Aprobada', 'Rechazada'];

    if (!id_solicitud || !RUT_trabajador || !respuesta_texto || !estado_solicitud) { return res.status(400).json({ message: 'Faltan campos obligatorios: id_solicitud, RUT_trabajador, respuesta_texto, estado_solicitud' }); }
    if (!estadosValidos.includes(estado_solicitud)) { return res.status(400).json({ message: `Estado de solicitud inválido. Debe ser '${estadosValidos.join("' o '")}'.` }); }

    let connection;
    let pdfPath = '';
    let rutaCarpetaRespuesta = '';

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Obtener datos de solicitud y ciudadano (incluyendo correo_notificacion)
        const [solicitudes] = await connection.query(
            `SELECT s.id_solicitud, s.ruta_carpeta, s.fecha_hora_envio, s.RUT_ciudadano, s.correo_notificacion, t.nombre_tipo, u_ciud.nombre AS nombre_ciudadano, u_ciud.apellido AS apellido_ciudadano FROM Solicitudes s JOIN Tipos_Solicitudes t ON s.id_tipo = t.id_tipo JOIN Usuarios u_ciud ON s.RUT_ciudadano = u_ciud.RUT WHERE s.id_solicitud = ?`, [id_solicitud] );
        if (solicitudes.length === 0) { await connection.rollback(); return res.status(404).json({ message: 'Solicitud no encontrada' }); }
        const solicitud = solicitudes[0];
        const rutaCarpetaSolicitud = solicitud.ruta_carpeta;
        const correoDestino = solicitud.correo_notificacion;

        if (!rutaCarpetaSolicitud || !fs.existsSync(rutaCarpetaSolicitud)) { await connection.rollback(); console.error(`Ruta carpeta solicitud ${id_solicitud} inválida: ${rutaCarpetaSolicitud}`); return res.status(500).json({ message: 'Error: No se encontró la carpeta de la solicitud original.' }); }
        if (!correoDestino) { console.warn(`Solicitud ${id_solicitud} no tiene correo de notificación especificado. No se enviará email.`); }

        // 2. Verificar trabajador
        const [trabajadores] = await connection.query( 'SELECT nombre, apellido FROM Usuarios WHERE RUT = ? AND rol IN (?, ?)', [RUT_trabajador, 'Funcionario', 'Administrador'] );
        if (trabajadores.length === 0) { await connection.rollback(); return res.status(404).json({ message: 'Trabajador no encontrado o sin permisos para responder' }); }
        const trabajador = trabajadores[0];
        const nombreCompletoTrabajador = `${trabajador.nombre} ${trabajador.apellido}`;
        const nombreCompletoCiudadano = `${solicitud.nombre_ciudadano} ${solicitud.apellido_ciudadano}`;

        // 3. Insertar respuesta en BD
        const fechaRespuesta = new Date();
        const [resultInsert] = await connection.query( 'INSERT INTO Respuestas (id_solicitud, RUT_trabajador, fecha_hora_respuesta) VALUES (?, ?, ?)', [id_solicitud, RUT_trabajador, fechaRespuesta] );
        const id_respuesta = resultInsert.insertId;
        const id_respuesta_formateado = id_respuesta.toString().padStart(10, '0');

        // 4. Crear subcarpeta "Respuesta"
        rutaCarpetaRespuesta = path.join(rutaCarpetaSolicitud, 'Respuesta');
        crearCarpetaSiNoExiste(rutaCarpetaRespuesta);

        // 5. Guardar adjuntos de respuesta y preparar para correo
        const nombresArchivosAdjuntos = [];
        const attachmentObjects = [];
        if (req.files && req.files.length > 0) {
            console.log(`Guardando ${req.files.length} archivos adjuntos para respuesta ${id_respuesta}...`);
            req.files.forEach(file => {
                const filePath = path.join(rutaCarpetaRespuesta, file.originalname);
                try { fs.writeFileSync(filePath, file.buffer); nombresArchivosAdjuntos.push(file.originalname); attachmentObjects.push({ filename: file.originalname, content: file.buffer }); console.log(`Archivo guardado: ${filePath}`); }
                catch (writeError) { console.error(`Error al guardar el archivo ${file.originalname}:`, writeError); throw new Error(`Fallo al escribir archivo adjunto: ${writeError.message}`); }
            });
        }

        // 6. Crear PDF de respuesta - LÓGICA COMPLETA RESTAURADA
        const pdfDoc = new PDFDocument({ size: 'LETTER', margins: { top: 50, bottom: 50, left: 72, right: 72 } });
        pdfPath = path.join(rutaCarpetaRespuesta, 'respuesta.pdf');
        const writeStream = fs.createWriteStream(pdfPath);
        pdfDoc.pipe(writeStream);

        // --- Inicio Contenido del PDF ---
        const logoPath = path.join(__dirname, '../img/LOGO PITRUFQUEN.png'); // Ajusta la ruta si es diferente
        if (fs.existsSync(logoPath)) {
            pdfDoc.image(logoPath, pdfDoc.page.margins.left, pdfDoc.y, { width: 80 });
            pdfDoc.moveDown(0.5); // Espacio después del logo
        } else {
            console.warn("Logo no encontrado en", logoPath);
            // Si no hay logo, asegurar que el título no empiece demasiado arriba
             pdfDoc.y = pdfDoc.page.margins.top; // Empezar desde el margen superior
        }
         // Ajustar Y si se añadió logo para que el título quede bien
        pdfDoc.y = pdfDoc.page.margins.top + (fs.existsSync(logoPath) ? 20 : 0);

        // Título Principal
        pdfDoc.font('Helvetica-Bold').fontSize(16).text('RESPUESTA A SOLICITUD', { align: 'center' }).moveDown(1.5);

        // Línea separadora
        pdfDoc.strokeColor('#cccccc').lineWidth(1).moveTo(pdfDoc.page.margins.left, pdfDoc.y).lineTo(pdfDoc.page.width - pdfDoc.page.margins.right, pdfDoc.y).stroke().moveDown(1.5);

        // Datos de la Respuesta
        pdfDoc.font('Helvetica').fontSize(11);
        pdfDoc.text(`ID Respuesta: ${id_respuesta_formateado}`);
        pdfDoc.text(`Fecha Respuesta: ${format(fechaRespuesta, 'dd/MM/yyyy HH:mm:ss', { locale: es })}`);
        pdfDoc.text(`Respondido por: ${nombreCompletoTrabajador} (RUT: ${RUT_trabajador})`).moveDown(1);

        // Datos de la Solicitud Original
        pdfDoc.font('Helvetica-Bold').text('Referente a Solicitud:'); // Título para sección
        pdfDoc.font('Helvetica').fontSize(11);
        pdfDoc.text(`ID Solicitud: ${solicitud.id_solicitud.toString().padStart(10, '0')}`);
        pdfDoc.text(`Tipo Solicitud: ${solicitud.nombre_tipo}`);
        pdfDoc.text(`Fecha Solicitud: ${format(new Date(solicitud.fecha_hora_envio), 'dd/MM/yyyy HH:mm:ss', { locale: es })}`);
        pdfDoc.text(`Solicitante: ${nombreCompletoCiudadano} (RUT: ${solicitud.RUT_ciudadano})`);
        pdfDoc.text(`Correo Notificación: ${correoDestino || 'No proporcionado'}`).moveDown(1.5); // Mostrar correo destino

        // Línea separadora
        pdfDoc.strokeColor('#cccccc').lineWidth(1).moveTo(pdfDoc.page.margins.left, pdfDoc.y).lineTo(pdfDoc.page.width - pdfDoc.page.margins.right, pdfDoc.y).stroke().moveDown(1.5);

        // Detalle de la Respuesta
        pdfDoc.font('Helvetica-Bold').fontSize(12).text('Detalle de la Respuesta:', { underline: true }).moveDown(1);
        pdfDoc.font('Helvetica').fontSize(11).text(respuesta_texto || 'Sin texto de respuesta proporcionado.', { align: 'justify' }).moveDown(1.5);

        // Lista de Archivos Adjuntos (si existen)
        if (nombresArchivosAdjuntos.length > 0) {
            pdfDoc.font('Helvetica-Bold').fontSize(12).text('Archivos Adjuntos (Referencia):', { underline: true }).moveDown(1);
            pdfDoc.font('Helvetica').fontSize(10);
            nombresArchivosAdjuntos.forEach(nombre => pdfDoc.text(`- ${nombre}`).moveDown(0.2)); // Menos espacio entre items
            pdfDoc.moveDown(1);
        }
        // --- Fin Contenido del PDF ---
        pdfDoc.end(); // Finalizar la escritura del PDF

        // Esperar a que el stream de escritura finalice
        await new Promise((resolve, reject) => {
             writeStream.on('finish', resolve);
             writeStream.on('error', (err) => { console.error("Error al escribir el PDF:", err); reject(new Error(`Fallo al escribir el PDF: ${err.message}`)); });
        });
        console.log(`PDF de respuesta creado: ${pdfPath}`);


        // 7. Actualizar estado de solicitud original
        const [updateResult] = await connection.query( 'UPDATE Solicitudes SET estado = ? WHERE id_solicitud = ?', [estado_solicitud, id_solicitud] );
        if (updateResult.affectedRows > 0) console.log(`Estado de solicitud ${id_solicitud} actualizado a ${estado_solicitud}.`);
        else console.warn(`No se pudo actualizar el estado de la solicitud ${id_solicitud} a '${estado_solicitud}'`);

        // 8. Confirmar transacción ANTES de enviar correo
        await connection.commit();
        console.log(`Transacción completada para respuesta ${id_respuesta}`);

        // 9. --- ENVÍO DE CORREO REAL ---
        if (correoDestino) {
            console.log(`Intentando enviar notificación a ${correoDestino}...`);
            try {
                const finalAttachments = [ { filename: 'respuesta.pdf', path: pdfPath }, ...attachmentObjects ];
                const mailOptions = {
                    from: `"Municipalidad de Pitrufquén" <${process.env.EMAIL_USER}>`,
                    to: correoDestino,
                    subject: `Respuesta a su Solicitud #${solicitud.id_solicitud.toString().padStart(10, '0')} - ${solicitud.nombre_tipo}`,
                    text: `Estimado(a) ${nombreCompletoCiudadano},\n\nSu solicitud de '${solicitud.nombre_tipo}' ha sido respondida (${estado_solicitud}).\n\nRespuesta:\n${respuesta_texto}\n\nSe adjuntan los detalles y archivos correspondientes.\n\nAtentamente,\nMunicipalidad de Pitrufquén`,
                    html: `<p>Estimado(a) ${nombreCompletoCiudadano},</p><p>Su solicitud de '${solicitud.nombre_tipo}' ha sido respondida y marcada como '<b>${estado_solicitud}</b>'.</p><p><b>Respuesta:</b></p><p>${respuesta_texto.replace(/\n/g, '<br/>')}</p><p>Se adjuntan los detalles y archivos correspondientes.</p><p>Atentamente,<br/>Municipalidad de Pitrufquén</p>`,
                    attachments: finalAttachments
                };
                let info = await transporter.sendMail(mailOptions);
                console.log(`Notificación enviada exitosamente a ${correoDestino}. Message ID: ${info.messageId}`);
                 res.status(201).json({ message: 'Respuesta creada, solicitud actualizada y notificación enviada exitosamente.', id_respuesta: id_respuesta, ruta_respuesta: rutaCarpetaRespuesta });
            } catch (mailError) {
                console.error(`Error al enviar correo de notificación a ${correoDestino}:`, mailError);
                 res.status(201).json({ message: 'Respuesta creada y solicitud actualizada, pero falló el envío de la notificación por correo.', id_respuesta: id_respuesta, ruta_respuesta: rutaCarpetaRespuesta, error_correo: mailError.message });
            }
        } else {
            res.status(201).json({ message: 'Respuesta creada y solicitud actualizada exitosamente (Sin correo de notificación especificado).', id_respuesta: id_respuesta, ruta_respuesta: rutaCarpetaRespuesta });
        }
        // --- FIN ENVÍO DE CORREO ---

    } catch (error) {
        console.error('Error detallado al crear respuesta (catch principal):', error);
        if (connection) { try { await connection.rollback(); console.log("Rollback completado."); } catch (rbError) { console.error("Error durante rollback:", rbError); } }
        if (pdfPath && fs.existsSync(pdfPath)) { try { fs.unlinkSync(pdfPath); console.log("PDF de respuesta erróneo eliminado."); } catch(e) {console.error("Error al eliminar PDF erróneo:", e)} }
        if (rutaCarpetaRespuesta && fs.existsSync(rutaCarpetaRespuesta)) { try { fs.rmdirSync(rutaCarpetaRespuesta, { recursive: true }); console.log("Carpeta de respuesta errónea eliminada."); } catch(e) {console.error("Error al eliminar carpeta errónea:", e)} }
        if (error.message.includes('Fallo al escribir') || error.message.includes('No se pudo crear')) { return res.status(500).json({ message: `Error interno del servidor: ${error.message}` }); }
        if (error.message === 'Tipo de archivo no permitido para la respuesta') { return res.status(400).json({ message: error.message }); }
        res.status(500).json({ message: 'Error interno del servidor al crear la respuesta' });
    } finally {
        if (connection) { connection.release(); console.log("Conexión liberada."); }
    }
});


// --- Rutas GET (sin cambios) ---
router.get('/', async (req, res) => {
    try {
        const query = ` SELECT r.id_respuesta, LPAD(r.id_respuesta, 10, '0') AS id_respuesta_formateado, r.fecha_hora_respuesta, r.RUT_trabajador, ut.nombre AS nombre_trabajador, ut.apellido AS apellido_trabajador, s.id_solicitud, LPAD(s.id_solicitud, 10, '0') AS id_solicitud_formateado, ts.nombre_tipo AS nombre_tipo_solicitud, s.RUT_ciudadano, uc.nombre AS nombre_ciudadano, uc.apellido AS apellido_ciudadano, s.ruta_carpeta AS ruta_carpeta_solicitud FROM Respuestas r JOIN Solicitudes s ON r.id_solicitud = s.id_solicitud JOIN Usuarios ut ON r.RUT_trabajador = ut.RUT JOIN Usuarios uc ON s.RUT_ciudadano = uc.RUT JOIN Tipos_Solicitudes ts ON s.id_tipo = ts.id_tipo ORDER BY r.fecha_hora_respuesta DESC `;
        const [respuestas] = await db.query(query);
        res.status(200).json({ respuestas });
    } catch (error) { console.error('Error al obtener todas las respuestas:', error); res.status(500).json({ message: 'Error interno al obtener respuestas' }); }
});
router.get('/:id', async (req, res) => {
    const { id } = req.params; if (!id || isNaN(parseInt(id)) || parseInt(id) <= 0) { return res.status(400).json({ message: 'ID de respuesta inválido.' }); }
    try {
        const query = ` SELECT r.id_respuesta, LPAD(r.id_respuesta, 10, '0') AS id_respuesta_formateado, r.fecha_hora_respuesta, r.RUT_trabajador, ut.nombre AS nombre_trabajador, ut.apellido AS apellido_trabajador, s.id_solicitud, LPAD(s.id_solicitud, 10, '0') AS id_solicitud_formateado, ts.nombre_tipo AS nombre_tipo_solicitud, s.RUT_ciudadano, uc.nombre AS nombre_ciudadano, uc.apellido AS apellido_ciudadano, s.ruta_carpeta AS ruta_carpeta_solicitud FROM Respuestas r JOIN Solicitudes s ON r.id_solicitud = s.id_solicitud JOIN Usuarios ut ON r.RUT_trabajador = ut.RUT JOIN Usuarios uc ON s.RUT_ciudadano = uc.RUT JOIN Tipos_Solicitudes ts ON s.id_tipo = ts.id_tipo WHERE r.id_respuesta = ? `;
        const [respuesta] = await db.query(query, [id]);
        if (respuesta.length === 0) { return res.status(404).json({ message: 'Respuesta no encontrada' }); }
        res.status(200).json({ respuesta: respuesta[0] });
    } catch (error) { console.error(`Error al obtener la respuesta ${id}:`, error); res.status(500).json({ message: 'Error interno al obtener la respuesta' }); }
});
router.get('/solicitudes/pendientes', async (req, res) => {
    try {
        const query = ` SELECT s.id_solicitud, LPAD(s.id_solicitud, 10, '0') AS id_formateado, s.RUT_ciudadano, u.nombre AS nombre_ciudadano, u.apellido AS apellido_ciudadano, ts.nombre_tipo, s.fecha_hora_envio, s.estado, s.ruta_carpeta, s.correo_notificacion FROM Solicitudes s JOIN Usuarios u ON s.RUT_ciudadano = u.RUT JOIN Tipos_Solicitudes ts ON s.id_tipo = ts.id_tipo WHERE s.estado = 'Pendiente' ORDER BY s.fecha_hora_envio ASC `;
        const [solicitudesPendientes] = await db.query(query);
        res.status(200).json({ solicitudes: solicitudesPendientes });
    } catch (error) { console.error('Error al obtener solicitudes pendientes:', error); res.status(500).json({ message: 'Error interno al obtener solicitudes pendientes' }); }
});

module.exports = router; // Línea final