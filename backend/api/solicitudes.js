// backend/api/solicitudes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const multer = require('multer');
const path = require('path');
const { format } = require('date-fns');
const { es } = require('date-fns/locale');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { formatRut } = require('../utils/rutUtils');
const iconv = require('iconv-lite');
// const { utcToZonedTime, format: formatTz } = require('date-fns-tz'); // <-- zona horaria
// Utilidad para obtener la hora de Chile sin date-fns-tz
function getChileDateString(date) {
    return date.toLocaleString('es-CL', { timeZone: 'America/Santiago' });
}

// Función para crear carpetas si no existen (Sin Cambios)
function crearCarpeta(ruta) {
    if (!fs.existsSync(ruta)) {
        try {
            fs.mkdirSync(ruta, { recursive: true });
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
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(fileExtension)) {
        cb(null, true);
    } else {
        console.warn(`Archivo rechazado (tipo no permitido): ${file.originalname}`);
        cb(new Error('Tipo de archivo no permitido para la solicitud'), false);
    }
};
const upload = multer({ storage, fileFilter });


// Obtener las solicitudes de un usuario en específico (Sin Cambios)
router.get('/vecino/:rut', protect, async (req, res) => {
    try {
        const { rut } = req.params;
        if (!rut) {
            return res.status(400).json({ message: 'Falta el parámetro RUT del vecino.' });
        }

        const query = `
            SELECT
                s.id_solicitud, LPAD(s.id_solicitud, 10, '0') AS id_formateado,
                s.RUT_ciudadano, t.nombre_tipo, s.fecha_hora_envio, s.estado,
                s.correo_notificacion
            FROM Solicitudes s
            JOIN Tipos_Solicitudes t ON s.id_tipo = t.id_tipo
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
router.get('/', protect, restrictTo('Administrador', 'Funcionario'), async (req, res) => {
    try {
        const [solicitudes] = await db.query(`
            SELECT
                s.id_solicitud, LPAD(s.id_solicitud, 10, '0') AS id_formateado,
                s.RUT_ciudadano, u.nombre AS nombre_ciudadano, u.apellido AS apellido_ciudadano,
                t.id_tipo, t.nombre_tipo, s.fecha_hora_envio, s.estado,
                s.ruta_carpeta, s.correo_notificacion
            FROM Solicitudes s
            JOIN Tipos_Solicitudes t ON s.id_tipo = t.id_tipo
            JOIN Usuarios u ON s.RUT_ciudadano = u.RUT
            ORDER BY s.id_solicitud DESC
        `);
        res.status(200).json({ solicitudes });
    } catch (error) {
        console.error('Error al obtener solicitudes:', error);
        res.status(500).json({ message: 'Error al obtener solicitudes' });
    }
});

// Obtener una solicitud por su ID (modificado para adjuntos y PDF)
router.get('/:id', protect, restrictTo('Administrador', 'Funcionario'), async (req, res) => {
    try {
        const id = req.params.id;
        const [solicitudArr] = await db.query(`
            SELECT
                s.id_solicitud, LPAD(s.id_solicitud, 10, '0') AS id_formateado,
                s.RUT_ciudadano, t.nombre_tipo, s.fecha_hora_envio, s.estado,
                s.ruta_carpeta, s.correo_notificacion, u.nombre AS nombre_ciudadano, u.apellido AS apellido_ciudadano
            FROM Solicitudes s
            JOIN Tipos_Solicitudes t ON s.id_tipo = t.id_tipo
            JOIN Usuarios u ON s.RUT_ciudadano = u.RUT
            WHERE s.id_solicitud = ?
        `, [id]);
        if (solicitudArr.length === 0) {
            return res.status(404).json({ message: 'Solicitud no encontrada' });
        }
        const solicitud = solicitudArr[0];

        // --- NUEVO: Buscar archivos adjuntos y PDF ---
        let archivos_adjuntos = [];
        let pdf_url = null;
        if (solicitud.ruta_carpeta) {
            const baseDir = path.join(__dirname, '../solicitudes');
            const carpeta = path.join(baseDir, solicitud.ruta_carpeta);
            const baseUrl = `/solicitudes/${solicitud.ruta_carpeta}`.replace(/\\/g, '/');
            if (fs.existsSync(carpeta)) {
                const allFiles = getAllFilesRecursive(carpeta, baseUrl);
                // El PDF principal es el que comienza con 'solicitud_' y termina en .pdf
                const pdfFile = allFiles.find(f => /^solicitud_.*\.pdf$/i.test(f.nombre));
                pdf_url = pdfFile ? pdfFile.url : null;
                // Todos los demás archivos, incluyendo otros PDFs, son adjuntos
                archivos_adjuntos = allFiles.filter(f => !/^solicitud_.*\.pdf$/i.test(f.nombre));
            }
        }

        res.status(200).json({
            solicitud: {
                ...solicitud,
                archivos_adjuntos,
                pdf_url
            }
        });
    } catch (error) {
        console.error('Error al obtener la solicitud:', error);
        res.status(500).json({ message: 'Error al obtener la solicitud' });
    }
});

function getAllFilesRecursive(dir, baseUrl) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getAllFilesRecursive(filePath, baseUrl + '/' + file));
        } else {
            results.push({
                nombre: file,
                url: baseUrl + '/' + file
            });
        }
    });
    return results;
}

// Actualizar ESTADO de una solicitud (Sin Cambios)
router.put('/estado/:id', protect, restrictTo('Administrador', 'Funcionario'), async (req, res) => {
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

//  Actualizar estado y correo de la solicitud (Sin Cambios)
router.put('/:id', protect, restrictTo('Administrador'), async (req, res) => {
    const { id } = req.params;
    const { estado, correo_notificacion } = req.body;

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

    if (fieldsToUpdate.length === 0) {
        return res.status(400).json({ message: 'No se proporcionaron campos válidos para actualizar.' });
    }

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


const FOOTER_HEIGHT = 65; // Puntos (pts). Ajusta si cambias el footer.

// --- Función para dibujar el footer en cada página (actualizada con posicionamiento absoluto) ---
const drawFooter = (doc, pageNum, totalPages) => {
  const page = doc.page; // Página actual
  const contentWidth = page.width - page.margins.left - page.margins.right;

  // Textos del footer
  const footerText = "Documento emitido por la Plataforma de Solicitudes Municipales y usuario autenticado mediante Clave Única.";
  const footerExtraText = "Municipalidad de Pitrufquén - Solicitudes Ciudadanas - https://www.mpitrufquen.cl/ (Reemplazar URL)";

  // Calcular posiciones absolutas basadas en la altura total de la página.
  const bottomPadding = 10; // Espacio desde el borde físico inferior
  const pageNumY = page.height - bottomPadding - 10; // Y para el número de página
  const footerY = pageNumY - 12;                     // Y para el texto principal
  const footerExtraY = footerY - 14;                 // Y para el texto extra
  const lineY = footerExtraY - 6;                    // Y para la línea
  const startX = page.margins.left;

  doc.save(); // Guardar estado general

  // Dibujar línea separadora (sin alterar el puntero de texto)
  doc.strokeColor('#CCCCCC')
     .lineWidth(0.5)
     .moveTo(startX, lineY)
     .lineTo(page.width - page.margins.right, lineY)
     .stroke();

  // Dibujar el texto extra usando translate para posicionar de forma local.
  doc.save();
  doc.translate(startX, footerExtraY);
  doc.font('Helvetica-Bold')
     .fontSize(9)
     .fillColor('#555555')
     .text(footerExtraText, 0, 0, {
       width: contentWidth,
       align: 'center',
       lineBreak: false // No forzamos salto de línea
     });
  doc.restore();

  // Dibujar el texto principal del footer
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


// --- En el endpoint POST, se mantiene la estructura general, con modificaciones en la sección de PDF ---
router.post('/', upload.any(), async (req, res) => {
  // Validaciones iniciales (sin cambios)
  const { estado, correo_notificacion, ...otrosDatos } = req.body;
  const fecha = new Date();
  if (!req.body.rut_ciudadano || !req.body.id_tipo) {
    return res.status(400).json({ message: 'Faltan campos obligatorios: rut_ciudadano, id_tipo' });
  }
  const rut_ciudadano = req.body.rut_ciudadano;
  const id_tipo = req.body.id_tipo;
  if (correo_notificacion && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo_notificacion)) {
    return res.status(400).json({ message: 'El formato del correo de notificación es inválido.' });
  }

  // Validación específica y amigable para cada campo obligatorio
  if (!rut_ciudadano) {
      return res.status(400).json({ message: "El campo 'rut_ciudadano' es obligatorio." });
  }
  if (!id_tipo) {
      return res.status(400).json({ message: "El campo 'id_tipo' es obligatorio." });
  }

  let connection;
  let pdfPath = '';
  let rutaSolicitud = ''; // Ruta relativa para guardar en BD
  let rutaAbsolutaSolicitud = ''; // Ruta absoluta para trabajar localmente

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1) Obtener nombre del tipo de solicitud
    const [tipoResult] = await connection.query(
      'SELECT nombre_tipo FROM Tipos_Solicitudes WHERE id_tipo = ?',
      [id_tipo]
    );
    if (tipoResult.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ message: 'El tipo de solicitud especificado no existe.' });
    }
    const nombre_tipo = tipoResult[0].nombre_tipo;
    const estado_inicial = estado || 'Pendiente';
    const correo_para_insert = correo_notificacion || null;

    // 2) Insertar registro en la BD
    const [result] = await connection.query(
      'INSERT INTO Solicitudes (RUT_ciudadano, id_tipo, fecha_hora_envio, estado, ruta_carpeta, correo_notificacion) VALUES (?, ?, NOW(), ?, ?, ?)',
      [rut_ciudadano, id_tipo, estado_inicial, '', correo_para_insert]
    );
    const id_solicitud_num = result.insertId;
    const id_solicitud_str = id_solicitud_num.toString().padStart(10, '0');

    // 3) Obtener nombre completo del usuario
    let nombreCompleto = rut_ciudadano;
    try {
      const [rowsUsuario] = await connection.query(
        'SELECT nombre, apellido FROM Usuarios WHERE RUT = ?',
        [rut_ciudadano]
      );
      if (rowsUsuario.length > 0) {
        const nombre = rowsUsuario[0].nombre || '';
        const apellido = rowsUsuario[0].apellido || '';
        nombreCompleto = `${nombre.trim()} ${apellido.trim()}`.trim() || rut_ciudadano;
      }
    } catch (userErr) {
      console.warn(`Advertencia: No se pudo obtener nombre para RUT ${rut_ciudadano}:`, userErr.message);
    }

    // 4) Crear carpetas para el PDF y archivos adjuntos
    const anio = fecha.getFullYear();
    let mes = format(fecha, 'MMMM', { locale: es });
    mes = mes.charAt(0).toUpperCase() + mes.slice(1);
    const baseSolicitudesDir = path.resolve(__dirname, '../solicitudes');
    const rutaAnio = path.join(baseSolicitudesDir, anio.toString());
    const rutaMes = path.join(rutaAnio, mes);
    crearCarpeta(rutaAnio);
    crearCarpeta(rutaMes);

    const fechaDiaMesAnio = format(fecha, 'dd-MM-yyyy', { locale: es });
    const nombreCarpetaSeguro = nombreCompleto
      .replace(/[^a-zA-Z0-9ñÑáéíóúüÁÉÍÓÚÜ\s\-]/g, '')
      .replace(/\s+/g, '_');
    const nombreTipoSeguro = nombre_tipo
      .replace(/[^a-zA-Z0-9ñÑáéíóúüÁÉÍÓÚÜ\s\-]/g, '')
      .replace(/\s+/g, '_');

    const nombreDirectorioSolicitud = `${nombreTipoSeguro}-${nombreCarpetaSeguro}_${fechaDiaMesAnio}_ID-${id_solicitud_str}`;
    rutaAbsolutaSolicitud = path.join(rutaMes, nombreDirectorioSolicitud);
    rutaSolicitud = path.relative(baseSolicitudesDir, rutaAbsolutaSolicitud);
    crearCarpeta(rutaAbsolutaSolicitud);

    // 5) Guardar archivos adjuntos en disco
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        let safeName = file.originalname;
        // Normaliza el nombre eliminando tildes y caracteres especiales
        safeName = normalizeFileName(safeName);
        const filePath = path.join(rutaAbsolutaSolicitud, safeName);
        fs.writeFileSync(filePath, file.buffer);
      }
    }

    // --- 6) Crear el PDF con margen inferior reservado para el footer ---
    const pdfDoc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 50, bottom: FOOTER_HEIGHT, left: 60, right: 60 },
      bufferPages: true // Necesario para actualizar el footer en todas las páginas
    });

    const fontPath = path.join(__dirname, '../fonts/NotoSans-Regular.ttf');
    pdfDoc.registerFont('NotoSans', fontPath);

    pdfPath = path.join(rutaAbsolutaSolicitud, `solicitud_${id_solicitud_str}.pdf`);
    const writeStream = fs.createWriteStream(pdfPath);
    pdfDoc.pipe(writeStream);

    // --- 7) Agregar contenido al PDF ---
    // 7.1 Cabecera
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
      pdfDoc.fontSize(16).text('COMPROBANTE DE INGRESO DE SOLICITUD', { align: 'center' });
      pdfDoc.moveDown(1.5);
      const yLine = pdfDoc.y;
      pdfDoc.strokeColor('#cccccc').lineWidth(0.5)
            .moveTo(pdfDoc.page.margins.left, yLine)
            .lineTo(pdfDoc.page.width - pdfDoc.page.margins.right, yLine)
            .stroke();
      pdfDoc.moveDown(1.5);
    }

    // 7.2 Detalles de la Solicitud
    {
      let fechaEnvio = 'Fecha no disponible';
      try {
        const [solRow] = await connection.query(
          'SELECT fecha_hora_envio FROM Solicitudes WHERE id_solicitud = ?',
          [id_solicitud_num]
        );
        if (solRow.length > 0 && solRow[0].fecha_hora_envio) {
          // Convertir a zona horaria de Chile sin date-fns-tz
          fechaEnvio = getChileDateString(new Date(solRow[0].fecha_hora_envio));
        }
      } catch (fechaErr) {
        console.error("Error obteniendo fecha_hora_envio:", fechaErr);
      }
      pdfDoc.font('Helvetica-Bold').fontSize(12).text('Detalles de la Solicitud:', { underline: true }).moveDown(0.75);
      pdfDoc.font('Helvetica-Bold').fontSize(11).text('ID de solicitud:', { continued: true });
      pdfDoc.font('Helvetica').text(` ${id_solicitud_str}`);
      pdfDoc.moveDown(0.2);
      pdfDoc.font('Helvetica-Bold').text('Tipo de Solicitud:', { continued: true });
      pdfDoc.font('Helvetica').text(` ${nombre_tipo}`);
      pdfDoc.moveDown(0.2);
      pdfDoc.font('Helvetica-Bold').text('Fecha y Hora de envío:', { continued: true });
      pdfDoc.font('Helvetica').text(` ${fechaEnvio}`);
      pdfDoc.moveDown(1.5);
      pdfDoc.moveDown(0.2);
      pdfDoc.strokeColor('#e0e0e0').lineWidth(0.5).moveTo(pdfDoc.page.margins.left, pdfDoc.y).lineTo(pdfDoc.page.width - pdfDoc.page.margins.right, pdfDoc.y).stroke();
      pdfDoc.moveDown(0.8);
    }

    // 7.3 Información del Solicitante
    {
        // --- Variables de diseño ---
        const startX = pdfDoc.page.margins.left;
        const initialY = pdfDoc.y; // Y donde empieza esta sección

        if (isNaN(initialY)) {
            console.error("ERROR CRÍTICO v8: pdfDoc.y es NaN antes de empezar.");
            // Considera manejar este error de forma más robusta si ocurre
            return res.status(500).json({ message: 'Error interno generando PDF (posición Y inválida).' });
        }

        const boxTopY = initialY; // Y superior del recuadro
        const contentWidth = pdfDoc.page.width - pdfDoc.page.margins.left - pdfDoc.page.margins.right;
        const recuadroHeight = 85;  // AUMENTAR altura para el título
        const recuadroPadding = 12; // Padding interno
        const cornerRadius = 8;     // Radio para bordes redondos
        const logoWidth = 35;
        const logoPaddingRight = 12;
        const lineSpacingFactor = 0.3; // Espacio entre líneas de texto principal

        // --- Título ---
        const tituloTexto = "Información del Solicitante";
        const tituloFontSize = 10; // Tamaño más pequeño para el título
        const tituloSpacingBottom = 8; // Espacio debajo del título

        // --- Dibujar el recuadro azul con bordes redondos ---
        pdfDoc.save();
        pdfDoc.fillColor('#0D47A1');
        // Usar roundedRect en lugar de rect
        pdfDoc.roundedRect(startX, boxTopY, contentWidth, recuadroHeight, cornerRadius).fill();
        pdfDoc.restore();

        // --- Preparar contenido de texto ---
        const logoPath = path.join(__dirname, '../img/claveunica.png');
        const rutTexto = `RUT: ${formatRut(rut_ciudadano) || 'No disponible'}`;
        const nombreTexto = `Nombre y Apellido: ${nombreCompleto || 'No disponible'}`;
        const correoTexto = `Correo Electrónico de Notificación: ${correo_para_insert || 'No especificado'}`;

        // --- Calcular posiciones (considerando el título) ---
        const logoActualX = startX + recuadroPadding;
        const textBlockStartX = logoActualX + logoWidth + logoPaddingRight;

        // Posición Y del Título
        const tituloY = boxTopY + recuadroPadding;

        // Calcular dónde empezará el contenido principal (logo y texto RUT/Nombre/...)
        // Se necesita saber la altura del título para posicionar debajo
        let mainContentStartY = tituloY; // Inicializar con la Y del título
        pdfDoc.save(); // Usar save/restore para medir sin afectar
        pdfDoc.font('Helvetica-Bold').fontSize(tituloFontSize); // Usar fuente del título
        mainContentStartY += pdfDoc.heightOfString(tituloTexto, { width: contentWidth - (recuadroPadding * 2) }); // Añadir altura del título
        mainContentStartY += tituloSpacingBottom; // Añadir espacio debajo del título
        pdfDoc.restore(); // Restaurar fuente/tamaño

        // Posición Y del logo (alineado con el inicio del contenido principal)
        const logoAbsoluteY = mainContentStartY;
        // Posición Y del primer texto (RUT) (alineado con el inicio del contenido principal)
        const textAbsoluteStartY = mainContentStartY;


        // --- Dibujar logo (izquierda) ---
        if (fs.existsSync(logoPath)) {
            try {
                 // Dibujar logo en su nueva posición Y
                 pdfDoc.image(logoPath, logoActualX, logoAbsoluteY, { width: logoWidth });
            } catch (imgErr) { console.warn(`Warn logo load: ${imgErr.message}`); }
        } else { console.warn(`Warn logo path: ${logoPath}`); }

        // --- Dibujar Título y Texto Principal (derecha) ---
        pdfDoc.save(); // Guardar estado (color/fuente por defecto)
        pdfDoc.fillColor('#FFFFFF'); // Todo el texto dentro será blanco

        // 1. Dibujar Título
        pdfDoc.font('Helvetica-Bold').fontSize(tituloFontSize); // Fuente para el título
        pdfDoc.text(tituloTexto, startX + recuadroPadding, tituloY, { // Alinear título a la izquierda con padding
             width: contentWidth - (recuadroPadding * 2), // Ancho completo menos paddings
             align: 'left' // O 'center' si lo prefieres centrado
        });
        // pdfDoc.y se actualiza después del texto del título

        // 2. Dibujar Texto Principal (RUT, Nombre, Correo)
        pdfDoc.font('Helvetica-Bold').fontSize(11); // Cambiar a la fuente del texto principal

        try {
            if (isNaN(textAbsoluteStartY) || isNaN(textBlockStartX)) {
                console.error("ERROR CRÍTICO v8: NaN detectado antes de dibujar texto principal.");
                // Manejar el error
            } else {
                 // --- Draw RUT (SIN OPCIONES) ---
                 // Usar la Y calculada 'textAbsoluteStartY' para la primera línea
                 pdfDoc.text(rutTexto, textBlockStartX, textAbsoluteStartY);
                 pdfDoc.moveDown(lineSpacingFactor);

                 // --- Draw Nombre (SIN OPCIONES) ---
                 pdfDoc.text(nombreTexto, textBlockStartX);
                 pdfDoc.moveDown(lineSpacingFactor);

                 // --- Draw Correo (SIN OPCIONES) ---
                 pdfDoc.text(correoTexto, textBlockStartX);
            }
        } catch (textError) {
             console.error("ERROR caught during pdfDoc.text (v8):", textError);
             throw textError;
        } finally {
             pdfDoc.restore(); // Restaurar estado (color/fuente a negro/default)
        }

        // --- Ajustar la posición Y global para el siguiente bloque ---
        pdfDoc.y = boxTopY + recuadroHeight + 20; // Usar la nueva altura del recuadro

    } // Fin del bloque 7.3

    // !! IMPORTANTE: Asegurarse que el color de texto vuelva a ser negro !!
    // (Aunque el pdfDoc.restore() ya debería hacerlo, una doble seguridad no hace daño)
    pdfDoc.fillColor('black');
    // Opcional: Resetear X por si acaso
    pdfDoc.x = pdfDoc.page.margins.left;
    
    // --- MEJORAS DE FORMATO PARA DATOS ADICIONALES EN PDF (v4, visual extra) ---
      function formatDatoAdicionalPDF_v4(valor) {
        if (valor === null || valor === undefined || valor === '') return 'No proporcionado';
        // Intentar parsear string que parezca array o booleano
        if (typeof valor === 'string') {
          // Booleano string
          if (valor === 'true') return 'Sí';
          if (valor === 'false') return 'No';
          // Array string
          if (/^\[.*\]$/.test(valor)) {
            try {
              const arr = JSON.parse(valor);
              if (Array.isArray(arr)) {
                if (arr.length === 0) return 'No proporcionado';
                return arr.map(v => `• ${formatDatoAdicionalPDF_v4(v)}`).join('\n');
              }
            } catch {}
          }
          // Intentar parsear objeto ubicación
          try {
            const obj = JSON.parse(valor);
            if (obj && typeof obj === 'object' && obj.lat !== undefined && obj.lng !== undefined) {
              const url = `https://www.google.com/maps/search/?api=1&query=${obj.lat},${obj.lng}`;
              return `Ver en Google Maps: ${url}`;
            }
          } catch {}
        }
        // Booleanos reales
        if (valor === true) return 'Sí';
        if (valor === false) return 'No';
        // Fechas ISO o tipo fecha
        if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}/.test(valor)) {
          try {
            const fechaObj = new Date(valor);
            if (!isNaN(fechaObj.getTime())) {
              // Convertir a zona horaria de Chile sin date-fns-tz
              return getChileDateString(fechaObj);
            }
          } catch {}
        }
        // Arrays reales
        if (Array.isArray(valor)) {
          if (valor.length === 0) return 'No proporcionado';
          return valor.map(v => `• ${formatDatoAdicionalPDF_v4(v)}`).join('\n');
        }
        // Objetos tipo ubicación {lat, lng}
        if (typeof valor === 'object' && valor !== null && valor.lat !== undefined && valor.lng !== undefined) {
          const url = `https://www.google.com/maps/search/?api=1&query=${valor.lat},${valor.lng}`;
          return `Ver en Google Maps: ${url}`;
        }
        // Otros objetos (mostrar como JSON legible)
        if (typeof valor === 'object' && valor !== null) {
          return JSON.stringify(valor);
        }
        // Por defecto, mostrar como string
        return String(valor);
      }
      // 7.4 Datos Adicionales Proporcionados
      {
        const datosAdicionales = { ...otrosDatos };
        ['rut_ciudadano','id_tipo','estado','correo_notificacion'].forEach(k => delete datosAdicionales[k]);
        if (Object.keys(datosAdicionales).length > 0) {
          pdfDoc.font('Helvetica-Bold').fontSize(12).text('Datos Adicionales Proporcionados:', { underline: true }).moveDown(0.75);
          pdfDoc.font('Helvetica').fontSize(10);
          for (const key in datosAdicionales) {
            if (Object.hasOwnProperty.call(datosAdicionales, key)) {
              // Separar palabras en el label (ej: "fechaEstimadaEvento" -> "Fecha Estimada Evento")
              const label = key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, l => l.toUpperCase()).replace(/\s+/g, ' ').trim();
              pdfDoc.font('Helvetica-Bold').text(`${label}:`, { continued: false });
              const value = formatDatoAdicionalPDF_v4(datosAdicionales[key]);
              // Si es link de Google Maps, mostrar como link clickeable
              if (typeof value === 'string' && value.startsWith('Ver en Google Maps:')) {
                const url = value.replace('Ver en Google Maps: ', '').trim();
                pdfDoc.fillColor('blue').text('Ver en Google Maps', { link: url, underline: true, continued: false });
                pdfDoc.fillColor('black');
                pdfDoc.moveDown(0.8);
                pdfDoc.strokeColor('#e0e0e0').lineWidth(0.5).moveTo(pdfDoc.page.margins.left, pdfDoc.y).lineTo(pdfDoc.page.width - pdfDoc.page.margins.right, pdfDoc.y).stroke();
                pdfDoc.moveDown(0.8);
                continue;
              }
              // Si es lista con viñetas
              if (typeof value === 'string' && value.startsWith('• ')) {
                value.split('\n').forEach(linea => {
                  pdfDoc.font('Helvetica').text(linea, { indent: 15 });
                });
                pdfDoc.moveDown(0.8);
                pdfDoc.strokeColor('#e0e0e0').lineWidth(0.5).moveTo(pdfDoc.page.margins.left, pdfDoc.y).lineTo(pdfDoc.page.width - pdfDoc.page.margins.right, pdfDoc.y).stroke();
                pdfDoc.moveDown(0.8);
                continue;
              }
              pdfDoc.font('Helvetica').text(value);
              pdfDoc.moveDown(0.8);
              pdfDoc.strokeColor('#e0e0e0').lineWidth(0.5).moveTo(pdfDoc.page.margins.left, pdfDoc.y).lineTo(pdfDoc.page.width - pdfDoc.page.margins.right, pdfDoc.y).stroke();
              pdfDoc.moveDown(0.8);
            }
          }
          pdfDoc.moveDown(1);
        }
      }

    // 7.5 Archivos Adjuntos
    {
      if (req.files && req.files.length > 0) {
        pdfDoc.font('Helvetica-Bold').fontSize(12).text('Archivos Adjuntos Registrados:', { underline: true }).moveDown(0.75);
        pdfDoc.font('NotoSans'); // Usar NotoSans para los nombres de archivos
        pdfDoc.fontSize(10);
        req.files.forEach(f => {
          let nombreArchivo = f.originalname ? f.originalname : 'archivo_sin_nombre';
          nombreArchivo = normalizeFileName(nombreArchivo);
          pdfDoc.text(`- ${nombreArchivo}`);
          pdfDoc.moveDown(0.4);
        });
        pdfDoc.moveDown(1);
      }
    }

    // --- 8) Actualizar el footer en cada página sin provocar saltos extra ---
    const range = pdfDoc.bufferedPageRange();
    const totalPages = range.count;
    for (let i = 0; i < totalPages; i++) {
      pdfDoc.switchToPage(i);
      // Llamamos a drawFooter para dibujar el footer de forma absoluta
      drawFooter(pdfDoc, i + 1, totalPages);
    }

    // --- 9) Finalizar y escribir el PDF ---
    pdfDoc.end();
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', (err) => {
        console.error("Error escribiendo stream PDF:", err);
        reject(new Error('Fallo al escribir PDF'));
      });
    });

    // 10) Actualizar la ruta en BD y hacer commit
    await connection.query(
      'UPDATE Solicitudes SET ruta_carpeta = ? WHERE id_solicitud = ?',
      [rutaSolicitud, id_solicitud_num]
    );
    await connection.commit();
    connection.release();

    // --- ENVÍO DE CORREO AL VECINO CON PDF Y ADJUNTOS ---
    if (correo_para_insert) {
      try {
        // Buscar archivos adjuntos en la carpeta de la solicitud
        const archivosAdjuntos = fs.readdirSync(rutaAbsolutaSolicitud)
          .filter(f => !/^solicitud_.*\.pdf$/i.test(f))
          .map(f => ({ filename: f, path: path.join(rutaAbsolutaSolicitud, f) }));
        // PDF generado
        const pdfFilename = `solicitud_${id_solicitud_str}.pdf`;
        const pdfPathAbs = path.join(rutaAbsolutaSolicitud, pdfFilename);
        const attachments = [
          { filename: pdfFilename, path: pdfPathAbs },
          ...archivosAdjuntos
        ];
        // Configurar nodemailer (igual que en respuestas.js)
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT || "587", 10),
          secure: process.env.EMAIL_SECURE === 'true',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
        const mailOptions = {
          from: `"Municipalidad de Pitrufquén" <${process.env.EMAIL_USER}>`,
          to: correo_para_insert,
          subject: `Copia de su Solicitud #${id_solicitud_str}`,
          text: `Estimado(a):\n\nSu solicitud ha sido recibida exitosamente por la Municipalidad de Pitrufquén.\n\nAdjuntamos una copia en PDF de su solicitud y los archivos que usted proporcionó como respaldo.\n\nEste correo es una confirmación automática, no requiere respuesta.\n\nLe recordamos que será notificado(a) por este mismo medio cuando su solicitud sea respondida.\n\nAtentamente,\nMunicipalidad de Pitrufquén`,
          html: `<p>Estimado(a):</p>
                 <p>Su solicitud ha sido <b>recibida exitosamente</b> por la Municipalidad de Pitrufquén.</p>
                 <p>Adjuntamos una copia en PDF de su solicitud y los archivos que usted proporcionó como respaldo.</p>
                 <p><i>Este correo es una confirmación automática, no requiere respuesta.</i></p>
                 <p>Le recordamos que será notificado(a) por este mismo medio cuando su solicitud sea respondida.</p>
                 <p>Atentamente,<br/>Municipalidad de Pitrufquén</p>`,
          attachments
        };
        await transporter.sendMail(mailOptions);
      } catch (mailErr) {
        console.error('Error al enviar correo de confirmación de solicitud:', mailErr);
        // No interrumpe el flujo principal
      }
    }

    res.status(201).json({
      message: 'Solicitud creada con éxito',
      id_solicitud: id_solicitud_str,
      ruta_carpeta: rutaSolicitud,
      pdf_path: path.join(rutaSolicitud, `solicitud_${id_solicitud_str}.pdf`)
    });

  } catch (error) {
    console.error('Error detallado en POST /solicitudes:', error);
    if (connection) {
      try { await connection.rollback(); } catch (rbErr) { console.error('Error en rollback:', rbErr); }
      connection.release();
    }
    if (pdfPath && fs.existsSync(pdfPath)) {
      try { fs.unlinkSync(pdfPath); } catch (ulErr) { console.error("Error borrando PDF:", ulErr); }
    }
    let statusCode = 500;
    let message = 'Error interno del servidor al crear la solicitud.';
    if (error instanceof multer.MulterError) {
      statusCode = 400;
      message = `Error carga archivo: ${error.message}`;
    } else if (error.message === 'El tipo de solicitud especificado no existe.') {
      statusCode = 400;
      message = error.message;
    } else if (error.message === 'Fallo al escribir PDF') {
      message = 'Error interno al guardar el documento PDF.';
    }
    res.status(statusCode).json({ message });
  }
});

// --- Normalizador de nombre de archivo: elimina tildes y caracteres especiales problemáticos ---
function normalizeFileName(name) {
  // Reemplaza tildes y diacríticos por su versión simple
  return name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Elimina diacríticos
    .replace(/[^a-zA-Z0-9._-]/g, '_'); // Solo permite letras, números, punto, guion y guion bajo
}

module.exports = router;

