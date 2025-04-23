//backend/api/respuestas.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const multer = require('multer');
const path = require('path');
const { format } = require('date-fns');
const { es } = require('date-fns/locale');
// const { utcToZonedTime, format: formatTz } = require('date-fns-tz'); // <-- Agregado para zona horaria
const nodemailer = require('nodemailer'); 
require('dotenv').config(); // Carga variables de entorno
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { formatRut } = require('../utils/rutUtils');
const iconv = require('iconv-lite');

// Utilidad para obtener la hora de Chile sin date-fns-tz
function getChileDateString(date) {
    return date.toLocaleString('es-CL', { timeZone: 'America/Santiago' });
}

// --- Configuración del Transporter de Nodemailer ---
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587", 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

transporter.verify(function(error, success) {
    if (error) { console.error("Error al conectar con el servicio de correo:", error); }
    else { console.log("✅ Servidor de correo listo para enviar mensajes."); }
});

// Funciones Auxiliares
function crearCarpetaSiNoExiste(ruta) {
    if (!fs.existsSync(ruta)) {
        try { fs.mkdirSync(ruta, { recursive: true }); }
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


const FOOTER_HEIGHT = 65;

// --- Función para dibujar el footer en cada página ---
const drawFooter = (doc, pageNum, totalPages) => {
    const page = doc.page;
    const contentWidth = page.width - page.margins.left - page.margins.right;

    // Textos del footer con el nuevo formato
    const footerText = "Documento emitido por la Plataforma de Solicitudes Municipales y usuario autenticado mediante Clave Única";
    const footerExtraText = "Municipalidad de Pitrufquén - (Contactos) https://www.mpitrufquen.cl/portal/acontactos/fonomunicipal.html";

    // Calcular posiciones absolutas basadas en la altura total de la página
    const bottomPadding = 10; // Espacio desde el borde físico inferior
    const pageNumY = page.height - bottomPadding - 10; // Y para el número de página
    const footerY = pageNumY - 12;                     // Y para el texto principal
    const footerExtraY = footerY - 14;                 // Y para el texto extra
    const lineY = footerExtraY - 6;                    // Y para la línea
    const startX = page.margins.left;

    doc.save(); // Guardar estado general

    // Dibujar línea separadora
    doc.strokeColor('#CCCCCC')
        .lineWidth(0.5)
        .moveTo(startX, lineY)
        .lineTo(page.width - page.margins.right, lineY)
        .stroke();

    // Dibujar el texto extra usando translate para posicionar sin alterar el flujo
    doc.save();
    doc.translate(startX, footerExtraY);
    doc.font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#555555')
        .text(footerExtraText, 0, 0, {
            width: contentWidth,
            align: 'center',
            lineBreak: false
        });
    doc.restore();

    // Dibujar el texto principal
    doc.save();
    doc.translate(startX, footerY);
    doc.font('Helvetica')
       .fontSize(8)
       .fillColor('#666666')
       .text(footerText, 0, 0, {
           width: contentWidth,
           align: 'center',
           lineBreak: false
       });
    doc.restore();

    // Dibujar el número de página
    doc.save();
    doc.translate(startX, pageNumY);
    doc.font('Helvetica')
       .fontSize(8)
       .fillColor('#666666')
       .text(`Página ${pageNum} de ${totalPages}`, 0, 0, {
           width: contentWidth,
           align: 'center',
           lineBreak: false
       });
    doc.restore();

    doc.restore(); // Restaurar estado general
};

// --- Rutas CRUD para Respuestas ---

// Crear una nueva respuesta, PDF, guardar adjuntos y enviar notificación por correo.
router.post('/', uploadRespuesta.array('archivosRespuesta'), async (req, res) => {
    const { id_solicitud, RUT_trabajador, respuesta_texto, estado_solicitud } = req.body;
    const estadosValidos = ['Aprobada', 'Rechazada'];

    // Validación específica y amigable para cada campo
    if (!id_solicitud) {
        return res.status(400).json({ message: "El campo 'id_solicitud' es obligatorio." });
    }
    if (!RUT_trabajador) {
        return res.status(400).json({ message: "El campo 'RUT_trabajador' es obligatorio." });
    }
    if (!respuesta_texto) {
        return res.status(400).json({ message: "El campo 'respuesta_texto' es obligatorio." });
    }
    if (!estado_solicitud) {
        return res.status(400).json({ message: "El campo 'estado_solicitud' es obligatorio." });
    }
    if (!estadosValidos.includes(estado_solicitud)) {
        return res.status(400).json({ message: `El campo 'estado_solicitud' debe ser 'Aprobada' o 'Rechazada'.` });
    }

    let connection;
    let pdfPath = '';
    let rutaCarpetaRespuesta = '';

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

      // 1) Obtener datos de solicitud y ciudadano (incluyendo correo_notificacion)
      const [solicitudes] = await connection.query(
        `SELECT s.id_solicitud, s.ruta_carpeta, s.fecha_hora_envio, s.RUT_ciudadano, s.correo_notificacion, t.nombre_tipo, 
                u_ciud.nombre AS nombre_ciudadano, u_ciud.apellido AS apellido_ciudadano 
         FROM Solicitudes s 
         JOIN Tipos_Solicitudes t ON s.id_tipo = t.id_tipo 
         JOIN Usuarios u_ciud ON s.RUT_ciudadano = u_ciud.RUT 
         WHERE s.id_solicitud = ?`,
        [id_solicitud]
      );
      if (solicitudes.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: 'Solicitud no encontrada' });
      }
      const solicitud = solicitudes[0];
      const correoDestino = solicitud.correo_notificacion;
  
      // Definir la carpeta base de solicitudes (ajusta la ruta según tu estructura de proyecto)
      const baseSolicitudesDir = path.join(__dirname, '../solicitudes');
      // Construir la ruta absoluta a la carpeta de la solicitud
      const rutaCarpetaSolicitud = path.join(baseSolicitudesDir, solicitud.ruta_carpeta);
  
      if (!rutaCarpetaSolicitud || !fs.existsSync(rutaCarpetaSolicitud)) {
        await connection.rollback();
        console.error(`Ruta carpeta solicitud ${id_solicitud} inválida: ${rutaCarpetaSolicitud}`);
        return res.status(500).json({ message: 'Error: No se encontró la carpeta de la solicitud original.' });
      }
      if (!correoDestino) {
        console.warn(`Solicitud ${id_solicitud} no tiene correo de notificación especificado. No se enviará email.`);
      }
  
      // 2) Verificar que el trabajador exista y tenga permisos
      const [trabajadores] = await connection.query(
        'SELECT nombre, apellido FROM Usuarios WHERE RUT = ? AND rol IN (?, ?)',
        [RUT_trabajador, 'Funcionario', 'Administrador']
      );
      if (trabajadores.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: 'Trabajador no encontrado o sin permisos para responder' });
      }
      const trabajador = trabajadores[0];
      const nombreCompletoTrabajador = `${trabajador.nombre} ${trabajador.apellido}`;
      const nombreCompletoCiudadano = `${solicitud.nombre_ciudadano} ${solicitud.apellido_ciudadano}`;
  
      // 3) Insertar la respuesta en la BD
      const fechaRespuesta = new Date();
      const [resultInsert] = await connection.query(
        'INSERT INTO Respuestas (id_solicitud, RUT_trabajador, fecha_hora_respuesta) VALUES (?, ?, ?)',
        [id_solicitud, RUT_trabajador, fechaRespuesta]
      );
      const id_respuesta = resultInsert.insertId;
      const id_respuesta_formateado = id_respuesta.toString().padStart(10, '0');
  
      // 4) Crear subcarpeta "Respuesta" dentro de la carpeta de la solicitud
      rutaCarpetaRespuesta = path.join(rutaCarpetaSolicitud, 'Respuesta');
      crearCarpetaSiNoExiste(rutaCarpetaRespuesta);
  
      // 5) Guardar archivos adjuntos de la respuesta y armar lista para enviar en correo
      const nombresArchivosAdjuntos = [];
      const attachmentObjects = [];
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          let safeName = file.originalname;
          // Detectar y corregir nombres mal codificados (ej: tÃ­tulo)
          if (/Ã|Â|Ð|ð/.test(safeName)) {
            const buf = Buffer.from(safeName, 'binary');
            const decoded = iconv.decode(buf, 'latin1');
            if (/í|á|é|ó|ú|ñ|Ñ|Á|É|Ó|Ú|Í/.test(decoded)) {
              safeName = decoded;
            }
          }
          const filePath = path.join(rutaCarpetaRespuesta, safeName);
          try {
            fs.writeFileSync(filePath, file.buffer);
            nombresArchivosAdjuntos.push(safeName);
            attachmentObjects.push({ filename: safeName, content: file.buffer });
          } catch (writeError) {
            console.error(`Error al guardar el archivo ${safeName}:`, writeError);
            throw new Error(`Fallo al escribir archivo adjunto: ${writeError.message}`);
          }
        });
      }
  
      // --- 6) Crear el PDF con el mismo formato que las solicitudes ---
      // Configuramos los márgenes y reservamos espacio para el footer
      const pdfDoc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 50, bottom: FOOTER_HEIGHT, left: 60, right: 60 },
        bufferPages: true
      });
      // Puedes formar el nombre del PDF según prefieras; a modo de ejemplo usamos "respuesta.pdf"
      pdfPath = path.join(rutaCarpetaRespuesta, `respuesta_${id_respuesta_formateado}.pdf`);
      const writeStream = fs.createWriteStream(pdfPath);
      pdfDoc.pipe(writeStream);
  
      // --- 7) Cabecera con logo y títulos (similar al de solicitudes) ---
      {
        const logoPath = path.join(__dirname, '../img/LOGO PITRUFQUEN.png');
        let currentY = pdfDoc.page.margins.top;
        try {
          if (fs.existsSync(logoPath)) {
            pdfDoc.image(logoPath, pdfDoc.page.margins.left, currentY, { width: 70 });
            currentY += 75;
          } else {
            console.warn("Advertencia: Logo no encontrado en", logoPath);
            currentY += 15;
          }
        } catch (imgErr) {
          console.error("Error al cargar imagen del logo:", imgErr);
          currentY += 15;
        }
        pdfDoc.y = currentY;
        pdfDoc.font('Helvetica-Bold').fontSize(14).text('Municipalidad de Pitrufquén', { align: 'center' });
        pdfDoc.moveDown(0.5);
        pdfDoc.fontSize(16).text('RESPUESTA A SOLICITUD', { align: 'center' });
        pdfDoc.moveDown(1.5);
        const yLine = pdfDoc.y;
        pdfDoc.strokeColor('#cccccc').lineWidth(0.5)
              .moveTo(pdfDoc.page.margins.left, yLine)
              .lineTo(pdfDoc.page.width - pdfDoc.page.margins.right, yLine)
              .stroke();
        pdfDoc.moveDown(1.5);
      }
  
      // --- 8) Detalles de la Respuesta ---
      {
        pdfDoc.font('Helvetica-Bold').fontSize(12).text('Detalles de la Respuesta:', { underline: true }).moveDown(0.75);
        pdfDoc.font('Helvetica-Bold').fontSize(11).text('ID Respuesta:', { continued: true });
        pdfDoc.font('Helvetica').text(` ${id_respuesta_formateado}`);
        pdfDoc.moveDown(0.2);
        pdfDoc.font('Helvetica-Bold').text('Respondido por:', { continued: true });
        pdfDoc.font('Helvetica').text(` ${nombreCompletoTrabajador}`);
        pdfDoc.moveDown(0.2);
        pdfDoc.font('Helvetica-Bold').text('Fecha y hora de respuesta:', { continued: true });
        // Convertir a zona horaria de Chile
        const fechaChileRespuesta = getChileDateString(fechaRespuesta);
        pdfDoc.font('Helvetica').text(` ${fechaChileRespuesta}`);
        pdfDoc.moveDown(1.5);
      }
  
      // --- 9) Datos de la Solicitud Original ---
      {
        pdfDoc.font('Helvetica-Bold').fontSize(12).text('Detalles de la Solicitud:', { underline: true }).moveDown(0.75);
        pdfDoc.font('Helvetica-Bold').fontSize(11).text('ID Solicitud:', { continued: true });
        pdfDoc.font('Helvetica').text(` ${solicitud.id_solicitud.toString().padStart(10, '0')}`);
        pdfDoc.moveDown(0.2);
        pdfDoc.font('Helvetica-Bold').text('Solicitante:', { continued: true });
        pdfDoc.font('Helvetica').text(` ${nombreCompletoCiudadano} (RUT: ${formatRut(solicitud.RUT_ciudadano)})`);
        pdfDoc.moveDown(0.2);
        pdfDoc.font('Helvetica-Bold').text('Tipo de Solicitud:', { continued: true });
        pdfDoc.font('Helvetica').text(` ${solicitud.nombre_tipo}`);
        pdfDoc.moveDown(0.2);
        pdfDoc.font('Helvetica-Bold').text('Fecha y hora de solicitud:', { continued: true });
        // Convertir a zona horaria de Chile
        const fechaChileSolicitud = getChileDateString(new Date(solicitud.fecha_hora_envio));
        pdfDoc.font('Helvetica').text(` ${fechaChileSolicitud}`);
        pdfDoc.moveDown(0.2);
        pdfDoc.font('Helvetica-Bold').text('Correo de Notificación:', { continued: true });
        pdfDoc.font('Helvetica').text(` ${correoDestino || 'No proporcionado'}`);
        pdfDoc.moveDown(1.5);
      }
  
      // --- 10) Contenido de la Respuesta ---
      {
        pdfDoc.font('Helvetica-Bold').fontSize(12).text('Respuesta:', { underline: true }).moveDown(0.75);
        pdfDoc.font('Helvetica').fontSize(11)
              .text(respuesta_texto || 'Sin texto de respuesta proporcionado.', { align: 'justify' })
              .moveDown(1.5);
      }
  
      // --- 11) Archivos Adjuntos (si existen)
      {
        if (nombresArchivosAdjuntos.length > 0) {
          pdfDoc.font('Helvetica-Bold').fontSize(12).text('Archivos Adjuntos:', { underline: true }).moveDown(0.75);
          pdfDoc.font('NotoSans'); // Usar NotoSans para los nombres de archivos
          pdfDoc.fontSize(10);
          nombresArchivosAdjuntos.forEach(nombre => {
            let nombreArchivo = nombre ? nombre : 'archivo_sin_nombre';
            if (/Ã|Â|Ð|ð/.test(nombreArchivo)) {
              const buf = Buffer.from(nombreArchivo, 'binary');
              const decoded = iconv.decode(buf, 'latin1');
              if (/í|á|é|ó|ú|ñ|Ñ|Á|É|Ó|Ú|Í/.test(decoded)) {
                nombreArchivo = decoded;
              }
            }
            pdfDoc.text(`- ${nombreArchivo}`);
            pdfDoc.moveDown(0.4);
          });
          pdfDoc.moveDown(1);
        }
      }
  
      // --- 12) Actualizar el footer en cada página ---
      const range = pdfDoc.bufferedPageRange();
      const totalPages = range.count;
      for (let i = 0; i < totalPages; i++) {
        pdfDoc.switchToPage(i);
        drawFooter(pdfDoc, i + 1, totalPages);
      }
  
      // --- 13) Finalizar y guardar el PDF ---
      pdfDoc.end();
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', (err) => {
          console.error("Error al escribir el PDF:", err);
          reject(new Error(`Fallo al escribir el PDF: ${err.message}`));
        });
      });
  
      // 14) Actualizar estado de la solicitud original
      const [updateResult] = await connection.query(
        'UPDATE Solicitudes SET estado = ? WHERE id_solicitud = ?',
        [estado_solicitud, id_solicitud]
      );
      if (updateResult.affectedRows > 0)
        console.log(`Estado de solicitud ${id_solicitud} actualizado a ${estado_solicitud}.`);
      else
        console.warn(`No se pudo actualizar el estado de la solicitud ${id_solicitud} a '${estado_solicitud}'`);
  
      // 15) Confirmar transacción ANTES de enviar correo
      await connection.commit();
  
      // --- 16) ENVÍO DE CORREO ---
      if (correoDestino) {
        try {
          const finalAttachments = [{ filename: `respuesta_${id_respuesta_formateado}.pdf`, path: pdfPath }, ...attachmentObjects];
          const mailOptions = {
            from: `"Municipalidad de Pitrufquén" <${process.env.EMAIL_USER}>`,
            to: correoDestino,
            subject: `Respuesta a su Solicitud #${solicitud.id_solicitud.toString().padStart(10, '0')} - ${solicitud.nombre_tipo}`,
            text: `Estimado(a) ${nombreCompletoCiudadano},\n\nSu solicitud de '${solicitud.nombre_tipo}' ha sido respondida (${estado_solicitud}).\n\nRespuesta:\n${respuesta_texto}\n\nSe adjuntan los detalles y archivos correspondientes.\n\nAtentamente,\nMunicipalidad de Pitrufquén`,
            html: `<p>Estimado(a) ${nombreCompletoCiudadano},</p>
                   <p>Su solicitud de '${solicitud.nombre_tipo}' ha sido '<b>${estado_solicitud}</b>'.</p>
                   <p><b>Respuesta:</b></p>
                   <p>${respuesta_texto.replace(/\n/g, '<br/>')}</p>
                   <p>Atentamente,<br/>Municipalidad de Pitrufquén</p>`,
            attachments: finalAttachments
          };
          let info = await transporter.sendMail(mailOptions);
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
      if (connection) {
        try {
          await connection.rollback();
        } catch (rbError) {
          console.error("Error durante rollback:", rbError);
        }
      }
      if (pdfPath && fs.existsSync(pdfPath)) {
        try {
          fs.unlinkSync(pdfPath);
        } catch (e) {
          console.error("Error al eliminar PDF erróneo:", e);
        }
      }
      if (rutaCarpetaRespuesta && fs.existsSync(rutaCarpetaRespuesta)) {
        try {
          fs.rmdirSync(rutaCarpetaRespuesta, { recursive: true });
        } catch (e) {
          console.error("Error al eliminar carpeta errónea:", e);
        }
      }
      if (error.message.includes('Fallo al escribir') || error.message.includes('No se pudo crear')) {
        return res.status(500).json({ message: `Error interno del servidor: ${error.message}` });
      }
      if (error.message === 'Tipo de archivo no permitido para la respuesta') {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: 'Error interno del servidor al crear la respuesta' });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });

// Obtener todas las respuestas de solicitudes pendientes
router.get('/solicitudes/pendientes', protect, restrictTo('Administrador', 'Funcionario'), async (req, res) => {
    try {
        const query = `
            SELECT s.id_solicitud, LPAD(s.id_solicitud, 10, '0') AS id_formateado, s.RUT_ciudadano, 
                   u.nombre AS nombre_ciudadano, u.apellido AS apellido_ciudadano, ts.nombre_tipo, 
                   s.fecha_hora_envio, s.estado, s.ruta_carpeta, s.correo_notificacion 
            FROM Solicitudes s 
            JOIN Usuarios u ON s.RUT_ciudadano = u.RUT 
            JOIN Tipos_Solicitudes ts ON s.id_tipo = ts.id_tipo 
            WHERE s.estado = 'Pendiente' 
            ORDER BY s.fecha_hora_envio DESC
        `;
        const [solicitudesPendientes] = await db.query(query);
        res.status(200).json({ solicitudes: solicitudesPendientes });
    } catch (error) {
        console.error('Error al obtener solicitudes pendientes:', error);
        res.status(500).json({ message: 'Error interno al obtener solicitudes pendientes' });
    }
});


//Obtener todas las respuestas
router.get('/', protect, restrictTo('Administrador', 'Funcionario'), async (req, res) => {
    try {
        const query = ` SELECT r.id_respuesta, LPAD(r.id_respuesta, 10, '0') AS id_respuesta_formateado, r.fecha_hora_respuesta, r.RUT_trabajador, ut.nombre AS nombre_trabajador, ut.apellido AS apellido_trabajador, s.id_solicitud, LPAD(s.id_solicitud, 10, '0') AS id_solicitud_formateado, ts.nombre_tipo AS nombre_tipo_solicitud, s.RUT_ciudadano, uc.nombre AS nombre_ciudadano, uc.apellido AS apellido_ciudadano, s.ruta_carpeta AS ruta_carpeta_solicitud FROM Respuestas r JOIN Solicitudes s ON r.id_solicitud = s.id_solicitud JOIN Usuarios ut ON r.RUT_trabajador = ut.RUT JOIN Usuarios uc ON s.RUT_ciudadano = uc.RUT JOIN Tipos_Solicitudes ts ON s.id_tipo = ts.id_tipo ORDER BY r.fecha_hora_respuesta DESC `;
        const [respuestas] = await db.query(query);
        res.status(200).json({ respuestas });
    } catch (error) { console.error('Error al obtener todas las respuestas:', error); res.status(500).json({ message: 'Error interno al obtener respuestas' }); }
});


//Obtener una respuesta por id
router.get('/:id', protect, restrictTo('Administrador', 'Funcionario'), async (req, res) => {
    const { id } = req.params; if (!id || isNaN(parseInt(id)) || parseInt(id) <= 0) { return res.status(400).json({ message: 'ID de respuesta inválido.' }); }
    try {
        const query = ` SELECT r.id_respuesta, LPAD(r.id_respuesta, 10, '0') AS id_respuesta_formateado, r.fecha_hora_respuesta, r.RUT_trabajador, ut.nombre AS nombre_trabajador, ut.apellido AS apellido_trabajador, s.id_solicitud, LPAD(s.id_solicitud, 10, '0') AS id_solicitud_formateado, ts.nombre_tipo AS nombre_tipo_solicitud, s.RUT_ciudadano, uc.nombre AS nombre_ciudadano, uc.apellido AS apellido_ciudadano, s.ruta_carpeta AS ruta_carpeta_solicitud FROM Respuestas r JOIN Solicitudes s ON r.id_solicitud = s.id_solicitud JOIN Usuarios ut ON r.RUT_trabajador = ut.RUT JOIN Usuarios uc ON s.RUT_ciudadano = uc.RUT JOIN Tipos_Solicitudes ts ON s.id_tipo = ts.id_tipo WHERE r.id_respuesta = ? ORDER BY r.fecha_hora_respuesta DESC `;
        const [respuesta] = await db.query(query, [id]);
        if (respuesta.length === 0) { return res.status(404).json({ message: 'Respuesta no encontrada' }); }
        res.status(200).json({ respuesta: respuesta[0] });
    } catch (error) { console.error(`Error al obtener la respuesta ${id}:`, error); res.status(500).json({ message: 'Error interno al obtener la respuesta' }); }
});

// Obtener la respuesta de una solicitud específica
router.get('/by-solicitud/:id', async (req, res) => {
    const { id } = req.params;
    if (!id || isNaN(parseInt(id)) || parseInt(id) <= 0) {
        return res.status(400).json({ message: 'ID de solicitud inválido.' });
    }
    try {
        const query = `
            SELECT r.id_respuesta, LPAD(r.id_respuesta, 10, '0') AS id_respuesta_formateado, r.fecha_hora_respuesta, r.RUT_trabajador,
                   ut.nombre AS nombre_trabajador, ut.apellido AS apellido_trabajador,
                   s.id_solicitud, LPAD(s.id_solicitud, 10, '0') AS id_solicitud_formateado,
                   ts.nombre_tipo AS nombre_tipo_solicitud,
                   s.RUT_ciudadano, uc.nombre AS nombre_ciudadano, uc.apellido AS apellido_ciudadano,
                   s.ruta_carpeta AS ruta_carpeta_solicitud
            FROM Respuestas r
            JOIN Solicitudes s ON r.id_solicitud = s.id_solicitud
            JOIN Usuarios ut ON r.RUT_trabajador = ut.RUT
            JOIN Usuarios uc ON s.RUT_ciudadano = uc.RUT
            JOIN Tipos_Solicitudes ts ON s.id_tipo = ts.id_tipo
            WHERE r.id_solicitud = ?
            ORDER BY r.fecha_hora_respuesta DESC
            LIMIT 1
        `;
        const [respuestaArr] = await db.query(query, [id]);
        if (respuestaArr.length === 0) {
            return res.status(404).json({ message: 'No hay respuesta para esta solicitud.' });
        }
        const respuesta = respuestaArr[0];

        // --- Buscar archivos adjuntos y PDFs con manejo robusto de errores ---
        let archivosAdjuntosSolicitante = [];
        let archivosAdjuntosFuncionario = [];
        let pdfSolicitud = null;
        let pdfRespuesta = null;
        try {
            if (respuesta.ruta_carpeta_solicitud && typeof respuesta.ruta_carpeta_solicitud === 'string' && respuesta.ruta_carpeta_solicitud.trim() !== '') {
                const baseDir = path.join(__dirname, '../solicitudes');
                const carpetaSolicitud = path.join(baseDir, respuesta.ruta_carpeta_solicitud);
                const carpetaRespuesta = path.join(carpetaSolicitud, 'Respuesta');
                const baseUrlSolicitud = `/solicitudes/${respuesta.ruta_carpeta_solicitud.replace(/\\/g, '/')}`;
                const baseUrlRespuesta = `${baseUrlSolicitud}/Respuesta`;

                // Archivos del solicitante
                if (fs.existsSync(carpetaSolicitud)) {
                    try {
                        const files = fs.readdirSync(carpetaSolicitud);
                        pdfSolicitud = files.find(f => /^solicitud_.*\.pdf$/i.test(f)) ? `${baseUrlSolicitud}/${files.find(f => /^solicitud_.*\.pdf$/i.test(f))}` : null;
                        archivosAdjuntosSolicitante = files
                            .filter(f => !/^solicitud_.*\.pdf$/i.test(f))
                            .map(f => ({ nombre: f, url: `${baseUrlSolicitud}/${f}` }));
                    } catch (e) {
                        console.error('Error leyendo archivos del solicitante:', e);
                        archivosAdjuntosSolicitante = [];
                        pdfSolicitud = null;
                    }
                }

                // Archivos del funcionario
                if (fs.existsSync(carpetaRespuesta)) {
                    try {
                        const files = fs.readdirSync(carpetaRespuesta);
                        pdfRespuesta = files.find(f => /^respuesta.*\.pdf$/i.test(f)) ? `${baseUrlRespuesta}/${files.find(f => /^respuesta.*\.pdf$/i.test(f))}` : null;
                        archivosAdjuntosFuncionario = files
                            .filter(f => !/^respuesta.*\.pdf$/i.test(f))
                            .map(f => ({ nombre: f, url: `${baseUrlRespuesta}/${f}` }));
                    } catch (e) {
                        console.error('Error leyendo archivos del funcionario:', e);
                        archivosAdjuntosFuncionario = [];
                        pdfRespuesta = null;
                    }
                }
            }
        } catch (err) {
            console.error('Error general al buscar archivos adjuntos/PDFs:', err);
        }

        respuesta.archivos_adjuntos_solicitante = archivosAdjuntosSolicitante;
        respuesta.archivos_adjuntos_funcionario = archivosAdjuntosFuncionario;
        respuesta.pdf_solicitud = pdfSolicitud;
        respuesta.pdf_respuesta = pdfRespuesta;

        res.status(200).json({ respuesta });
    } catch (error) {
        console.error(`Error al obtener la respuesta por solicitud ${id}:`, error);
        res.status(500).json({ message: 'Error interno al obtener la respuesta por solicitud', detalle: error.message });
    }
});

// Obtener todas las respuestas de un ciudadano
router.get('/solicitudes/pendientes', protect, restrictTo('Administrador', 'Funcionario'), async (req, res) => {
    try {
        const query = ` SELECT s.id_solicitud, LPAD(s.id_solicitud, 10, '0') AS id_formateado, s.RUT_ciudadano, u.nombre AS nombre_ciudadano, u.apellido AS apellido_ciudadano, ts.nombre_tipo, s.fecha_hora_envio, s.estado, s.ruta_carpeta, s.correo_notificacion FROM Solicitudes s JOIN Usuarios u ON s.RUT_ciudadano = u.RUT JOIN Tipos_Solicitudes ts ON s.id_tipo = ts.id_tipo WHERE s.estado = 'Pendiente' ORDER BY s.fecha_hora_envio DESC `;
        const [solicitudesPendientes] = await db.query(query);
        res.status(200).json({ solicitudes: solicitudesPendientes });
    } catch (error) { console.error('Error al obtener solicitudes pendientes:', error); res.status(500).json({ message: 'Error interno al obtener solicitudes pendientes' }); }
});

module.exports = router;