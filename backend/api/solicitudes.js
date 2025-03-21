const express = require('express');
const router = express.Router();
const db = require('../config/db');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const multer = require('multer');
const path = require('path');
const { format } = require('date-fns');
const { es } = require('date-fns/locale');

// ===========================
// Función para crear carpetas si no existen
// ===========================
function crearCarpeta(ruta) {
    if (!fs.existsSync(ruta)) {
        fs.mkdirSync(ruta, { recursive: true });
    }
}

// ===========================
// Configuración de Multer
// Se utiliza memoryStorage para retener los archivos en memoria,
// de modo que podamos escribirlos en la carpeta definitiva (ya con el nombre correcto)
// ===========================
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
const upload = multer({ storage: storage, fileFilter: fileFilter });

// ===========================
// Rutas GET
// ===========================

// Obtener todas las solicitudes
router.get('/', async (req, res) => {
    try {
        const [solicitudes] = await db.promise().query(`
            SELECT s.id_solicitud, 
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
        const [solicitud] = await db.promise().query(`
            SELECT s.id_solicitud, 
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

// ===========================
// Ruta POST para crear una nueva solicitud
// Se usan archivos en memoria y se crea la carpeta definitiva con el nombre: 
// "NombreTipo - Nombre Apellido, dd-MM-yyyy, ID_solicitud" dentro de solicitudes/año/mes/
// ===========================
router.post('/', upload.array('archivos'), async (req, res) => {
    try {
        // Extraer datos del body
        const { rut_ciudadano, id_tipo, estado, ...otrosDatos } = req.body;
        const fecha = new Date();
        const fechaFormateada = format(fecha, 'yyyyMMddHHmmss');

        // Obtener el nombre del tipo de solicitud desde la BD
        const [tipoResult] = await db.promise().query(
            'SELECT nombre_tipo FROM tipos_solicitudes WHERE id_tipo = ?',
            [id_tipo]
        );
        const nombre_tipo = (tipoResult[0] && tipoResult[0].nombre_tipo) || 'Desconocido';

        // Insertar la solicitud en la BD con un placeholder en ruta_carpeta
        const [result] = await db.promise().query(
            'INSERT INTO Solicitudes (RUT_ciudadano, id_tipo, fecha_hora_envio, estado, ruta_carpeta) VALUES (?, ?, NOW(), ?, ?)',
            [rut_ciudadano, id_tipo, estado, '']
        );
        // Formatear el ID con ceros a la izquierda
        let id_solicitud = result.insertId.toString().padStart(10, '0');

        // Consultar nombre y apellido del ciudadano desde la tabla "usuarios"
        let nombreCompleto = rut_ciudadano; // Valor por defecto
        try {
            const [rowsUsuario] = await db.promise().query(
                'SELECT nombres, apellidos FROM usuarios WHERE RUT = ?',
                [rut_ciudadano]
            );
            if (rowsUsuario.length > 0) {
                nombreCompleto = `${rowsUsuario[0].nombres.trim()} ${rowsUsuario[0].apellidos.trim()}`;
            }
        } catch (errUser) {
            console.error('Error al obtener nombre y apellido del ciudadano:', errUser);
        }

        // ==========================================
        // Crear la estructura de carpetas base (año y mes)
        // ==========================================
        const anio = fecha.getFullYear();
        let mes = format(fecha, 'MMMM', { locale: es });
        mes = mes.charAt(0).toUpperCase() + mes.slice(1);
        const rutaAnio = `./solicitudes/${anio}`;
        const rutaMes = `${rutaAnio}/${mes}`;
        crearCarpeta(rutaAnio);
        crearCarpeta(rutaMes);

        // ==========================================
        // Construir el nombre final de la carpeta
        // Se usa el formato "dd-MM-yyyy" para evitar que se creen subdirectorios
        // Ejemplo: "Informe - Juan Perez, 24-03-2025, 0000000012"
        // donde "Informe" es el nombre del tipo de solicitud.
        // ==========================================
        const fechaDiaMesAnio = format(fecha, 'dd-MM-yyyy');
        const rutaSolicitud = `${rutaMes}/${nombre_tipo} - ${nombreCompleto}, ${fechaDiaMesAnio}, ${id_solicitud}`;

        // Crear la carpeta definitiva
        crearCarpeta(rutaSolicitud);

        // Guardar cada archivo (del memoryStorage) en la carpeta definitiva
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                const filePath = path.join(rutaSolicitud, file.originalname);
                fs.writeFileSync(filePath, file.buffer);
            });
        }

        // ==========================================
        // Crear el PDF de la solicitud
        // ==========================================
        const pdfDoc = new PDFDocument({ margin: 50 });
        const pdfPath = path.join(rutaSolicitud, 'solicitud.pdf');
        pdfDoc.pipe(fs.createWriteStream(pdfPath));

        // Agregar logo si existe
        const logoPath = path.join(__dirname, '../img/LOGO PITRUFQUEN.png');
        if (fs.existsSync(logoPath)) {
            pdfDoc.image(logoPath, 50, 50, { width: 100 });
        }

        // Obtener fecha/hora de envío desde la BD
        const [solicitudRow] = await db.promise().query(
            'SELECT fecha_hora_envio FROM Solicitudes WHERE id_solicitud = ?',
            [parseInt(id_solicitud)]
        );
        const fecha_hora_envio = format(new Date(solicitudRow[0].fecha_hora_envio), 'dd/MM/yyyy hh:mm:ss a', { locale: es });

        // Agregar información al PDF
        pdfDoc.moveDown(5);
        pdfDoc.font('Helvetica-Bold').fontSize(18).text(nombre_tipo, { align: 'center' }).moveDown(2);
        pdfDoc.fontSize(14).text(`Solicitud ID: ${id_solicitud}`).moveDown(1);
        pdfDoc.font('Helvetica').fontSize(12).text(`RUT Ciudadano: ${rut_ciudadano}`).moveDown(1);
        pdfDoc.text(`Nombre y Apellido: ${nombreCompleto}`).moveDown(1);
        pdfDoc.text(`Fecha y Hora de Envío: ${fecha_hora_envio}`).moveDown(2);

        // Datos adicionales
        pdfDoc.font('Helvetica-Bold').text('Datos Adicionales:', { underline: true }).moveDown();
        pdfDoc.font('Helvetica');
        for (const key in otrosDatos) {
            pdfDoc.text(`${key}: ${otrosDatos[key]}`).moveDown(0.5);
        }

        // Agregar imágenes al PDF (sólo las de tipo jpg, jpeg o png)
        if (req.files && req.files.length > 0) {
            pdfDoc.moveDown(2);
            pdfDoc.font('Helvetica-Bold').text('Imagenes Adjuntas:', { underline: true }).moveDown();
            pdfDoc.font('Helvetica');
            req.files.forEach(file => {
                const fileExtension = path.extname(file.originalname).toLowerCase();
                if (['.jpg', '.jpeg', '.png'].includes(fileExtension)) {
                    const imagePath = path.join(rutaSolicitud, file.originalname);
                    try {
                        pdfDoc.image(imagePath, { width: 200, y: pdfDoc.y });
                        pdfDoc.moveDown(1);
                    } catch (imageError) {
                        console.error(`Error al agregar imagen ${file.originalname}:`, imageError);
                        pdfDoc.text(`Error al mostrar imagen: ${file.originalname}`);
                        pdfDoc.moveDown(0.5);
                    }
                }
            });
        }
        pdfDoc.end();

        // ==========================================
        // Actualizar la solicitud en la BD con la ruta definitiva
        // ==========================================
        await db.promise().query(
            'UPDATE Solicitudes SET ruta_carpeta = ? WHERE id_solicitud = ?',
            [rutaSolicitud, parseInt(id_solicitud)]
        );

        res.status(201).json({ message: 'Solicitud creada exitosamente', id: id_solicitud, ruta: rutaSolicitud });
    } catch (error) {
        console.error('Error al crear solicitud:', error);
        res.status(500).json({ message: 'Error al crear solicitud' });
    }
});

module.exports = router;