// frontend/src/formDefinitions/respuestaSolicitud.js

// Título que aparecerá en el modal de respuesta
export const title = "Responder Solicitud";

// Límite de tamaño para adjuntos (puede estar aquí o en el componente)
const MAX_FILE_SIZE_MB = 10;

// Array con la definición de los campos INTERACTIVOS para la respuesta
export const fields = [
    // --- Campos de la Respuesta (Interactivos) ---
    {
        name: 'respuestaTexto',
        label: 'Texto de la Respuesta',
        type: 'textarea',
        required: true,
        requiredMessage: 'El texto de la respuesta no puede estar vacío.',
        rows: 8, // Aumentar filas para más espacio
        placeholder: 'Escriba aquí la respuesta detallada para el ciudadano...',
        gridProps: { xs: 12 }, // Ocupa todo el ancho de su columna
        step: 1, // Único paso
    },
    {
        name: 'estadoSolicitud',
        label: 'Estado Final de la Solicitud',
        type: 'select',
        required: true,
        requiredMessage: 'Debe seleccionar un estado final.',
        options: [
            { value: '', label: 'Seleccione estado...' }, // Opción por defecto/placeholder
            { value: 'Aprobada', label: 'Aprobada' },
            { value: 'Rechazada', label: 'Rechazada' },
        ],
        defaultValue: '', // Empezar vacío para forzar selección
        gridProps: { xs: 12 }, // Ocupa todo el ancho
        step: 1,
    },
    {
        name: 'archivosRespuesta',
        label: `Adjuntar Archivos (Opcional, Max ${MAX_FILE_SIZE_MB}MB c/u)`,
        type: 'file',
        required: false, // Adjuntos opcionales
        helperText: `Tipos permitidos: PDF, JPG, JPEG, PNG`,
        accept: '.pdf,.jpg,.jpeg,.png',
        maxSizeMB: MAX_FILE_SIZE_MB,
        multiple: true,
        gridProps: { xs: 12 }, // Ocupa todo el ancho
        step: 1,
    },
];
