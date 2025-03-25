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
        fs.mkdirSync(ruta, { recursive: true });
    }
}

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pptx', '.docx', '.pdf'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(fileExtension)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido'), false);
    }
};
const upload = multer({ storage, fileFilter });

// Obtener todas las solicitudes
router.get('/', async (req, res) => {
    try {
        const [solicitudes] = await db.query(`
        SELECT 
            s.id_solicitud, 
            LPAD(s.id_solicitud, 10, '0') AS id_formateado,
            s.RUT_ciudadano, 
            t.nombre_tipo, 
            s.fecha_hora_envio, 
            s.estado, 
            s.ruta_carpeta 
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
        const [solicitud] = await db.query(`
        SELECT 
            s.id_solicitud, 
            LPAD(s.id_solicitud, 10, '0') AS id_formateado,
            s.RUT_ciudadano, 
            t.nombre_tipo, 
            s.fecha_hora_envio, 
            s.estado, 
            s.ruta_carpeta 
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

// Actualizar una solicitud
router.put('/estado/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        // Validar que el estado es válido
        const estadosValidos = ['Pendiente', 'Aprobada', 'Rechazada'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ message: 'Estado no válido' });
        }

        // Actualizar el estado en la base de datos
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


// Crear una nueva solicitud
router.post('/', upload.array('archivos'), async (req, res) => {
    try {
        const { rut_ciudadano, id_tipo, estado, ...otrosDatos } = req.body;
        const fecha = new Date();

        // Obtener el nombre del tipo de solicitud
        const [tipoResult] = await db.query(  // Cambio aquí
        'SELECT nombre_tipo FROM tipos_solicitudes WHERE id_tipo = ?',
        [id_tipo]
        );
        const nombre_tipo = (tipoResult[0] && tipoResult[0].nombre_tipo) || 'Desconocido';

        // Insertar la solicitud en la BD
        const [result] = await db.query(  // Cambio aquí
        'INSERT INTO Solicitudes (RUT_ciudadano, id_tipo, fecha_hora_envio, estado, ruta_carpeta) VALUES (?, ?, NOW(), ?, ?)',
        [rut_ciudadano, id_tipo, estado, '']
        );
        let id_solicitud = result.insertId.toString().padStart(10, '0');

        // Obtener nombre y apellido del ciudadano
        let nombreCompleto = rut_ciudadano;
        try {
        const [rowsUsuario] = await db.query(  // Cambio aquí
            'SELECT nombres, apellidos FROM usuarios WHERE RUT = ?',
            [rut_ciudadano]
        );
        if (rowsUsuario.length > 0) {
            nombreCompleto = `${rowsUsuario[0].nombres.trim()} ${rowsUsuario[0].apellidos.trim()}`;
        }
        } catch (errUser) {
        console.error('Error al obtener nombre y apellido del ciudadano:', errUser);
    }

    // Crear estructura de carpetas base (año y mes)
    const anio = fecha.getFullYear();
    let mes = format(fecha, 'MMMM', { locale: es });
    mes = mes.charAt(0).toUpperCase() + mes.slice(1);
    const rutaAnio = `./solicitudes/${anio}`;
    const rutaMes = `${rutaAnio}/${mes}`;
    crearCarpeta(rutaAnio);
    crearCarpeta(rutaMes);

    // Construir el nombre final de la carpeta
    const fechaDiaMesAnio = format(fecha, 'dd-MM-yyyy', { locale: es });
    const rutaSolicitud = `${rutaMes}/${nombre_tipo} - ${nombreCompleto}, ${fechaDiaMesAnio}, ${id_solicitud}`;
    crearCarpeta(rutaSolicitud);

    // Guardar archivos
    if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
            const filePath = path.join(rutaSolicitud, file.originalname);
            fs.writeFileSync(filePath, file.buffer);
        });
    }

    // Crear el PDF
    const pdfDoc = new PDFDocument({
        size: 'LETTER',
        margins: {
        top: 10,    // Ajusta si quieres más/menos margen superior
        bottom: 10,
        left: 72,
        right: 72
        }
    });
    const pdfPath = path.join(rutaSolicitud, 'solicitud.pdf');
    pdfDoc.pipe(fs.createWriteStream(pdfPath));

    // Agregar logo sin coordenadas fijas (respeta margen)
    const logoPath = path.join(__dirname, '../img/LOGO PITRUFQUEN.png');
    if (fs.existsSync(logoPath)) {
      pdfDoc.image(logoPath, 72, pdfDoc.y, { width: 80 }); // 20px de margen izquierdo
      pdfDoc.moveDown(1); // Espacio debajo del logo
    }

    // Título principal (Municipalidad), centrado
    pdfDoc.y += 40; // Agrega 40 píxeles de margen superior

    
    pdfDoc
        .font('Helvetica-Bold')
        .fontSize(14)
        .fillColor('#000000')
        .text('Municipalidad de Pitrufquén', { align: 'center' })
        .moveDown(1);

    // Línea separadora
    let currentY = pdfDoc.y;
    pdfDoc
        .moveTo(pdfDoc.page.margins.left, currentY)
        .lineTo(pdfDoc.page.width - pdfDoc.page.margins.right, currentY)
        .strokeColor('#aaaaaa')
        .lineWidth(1)
        .stroke()
        .moveDown(2);

    // Obtener fecha/hora de envío real desde la BD
    const [solicitudRow] = await db.query(  // Cambio aquí
        'SELECT fecha_hora_envio FROM Solicitudes WHERE id_solicitud = ?',
        [parseInt(id_solicitud)]
    );
    const fecha_hora_envio = format(
        new Date(solicitudRow[0].fecha_hora_envio),
        'dd/MM/yyyy hh:mm:ss a',
        { locale: es }
    );

    // Tipo de solicitud, centrado
    pdfDoc
        .font('Helvetica-Bold')
        .fontSize(18)
        .text(nombre_tipo, { align: 'center' })
        .moveDown(2);

    // Datos generales, justificados
    pdfDoc
        .font('Helvetica')
        .fontSize(12)
        .text(`ID Solicitud: ${id_solicitud}`, { align: 'justify' })
        .moveDown(0.5)
        .text(`RUT Ciudadano: ${rut_ciudadano}`, { align: 'justify' })
        .moveDown(0.5)
        .text(`Nombre y Apellido: ${nombreCompleto}`, { align: 'justify' })
        .moveDown(0.5)
        .text(`Fecha y Hora de Envío: ${fecha_hora_envio}`, { align: 'justify' })
        .moveDown(2);

    // Línea separadora
    currentY = pdfDoc.y;
    pdfDoc
        .moveTo(pdfDoc.page.margins.left, currentY)
        .lineTo(pdfDoc.page.width - pdfDoc.page.margins.right, currentY)
        .strokeColor('#aaaaaa')
        .lineWidth(1)
        .stroke()
        .moveDown(2);

    // Datos Adicionales, centrado
    pdfDoc
        .font('Helvetica-Bold')
        .fontSize(14)
        .text('Datos Adicionales:', { align: 'center', underline: true })
        .moveDown(1);

    pdfDoc.font('Helvetica').fontSize(12);
    for (const key in otrosDatos) {
        pdfDoc
            .text(`${key}: ${otrosDatos[key]}`, { align: 'justify' })
            .moveDown(0.5);
    }

    pdfDoc.moveDown(2);

        // Línea separadora
        currentY = pdfDoc.y;
        pdfDoc
            .moveTo(pdfDoc.page.margins.left, currentY)
            .lineTo(pdfDoc.page.width - pdfDoc.page.margins.right, currentY)
            .strokeColor('#aaaaaa')
            .lineWidth(1)
            .stroke()
            .moveDown(2);


    // Imágenes Adjuntas, centrado
    if (req.files && req.files.length > 0) {
        pdfDoc
            .font('Helvetica-Bold')
            .fontSize(14)
            .text('Imágenes Adjuntas:', { align: 'center', underline: true })
            .moveDown(1)
            .font('Helvetica')
            .fontSize(12);

        req.files.forEach(file => {
            const fileExtension = path.extname(file.originalname).toLowerCase();
            if (['.jpg', '.jpeg', '.png'].includes(fileExtension)) {
            const imagePath = path.join(rutaSolicitud, file.originalname);
            try {
                // Insertar la imagen con un ancho de 200 y un moveDown
                pdfDoc.image(imagePath, { width: 200 });
                pdfDoc.moveDown(1);
            } catch (imageError) {
                console.error(`Error al agregar imagen ${file.originalname}:`, imageError);
                pdfDoc
                .text(`Error al mostrar imagen: ${file.originalname}`, { align: 'justify' })
                .moveDown(0.5);
            }
            }
        });
    }

    // Finalizar PDF
    pdfDoc.end();

    // Actualizar la ruta en la BD
    await db.query(  // Cambio aquí
        'UPDATE Solicitudes SET ruta_carpeta = ? WHERE id_solicitud = ?',
        [rutaSolicitud, parseInt(id_solicitud)]
    );

    res.status(201).json({
        message: 'Solicitud creada exitosamente',
        id: id_solicitud,
        ruta: rutaSolicitud
    });
    } catch (error) {
    console.error('Error al crear solicitud:', error);
    res.status(500).json({ message: 'Error al crear solicitud' });
    }
});

module.exports = router;