// frontend/src/components/formDefinitions/default.js

// Título que aparecerá en el modal
export const title = "Formulario General (Ejemplo Completo)";

// Array de definiciones de campos con propiedad 'step' añadida
export const fields = [
    // --- PASO 1: Información Básica y Referencias ---
    {
        name: 'infoAdicional',
        label: 'Información Importante:',
        type: 'static-text',
        text: 'Para concretar tu solicitud tienes que completar el formulario que aparece a continuación.\n\nRecuerda adjuntar todos los documentos necesarios para agilizar el proceso.', // <-- Añade \n\n y el nuevo texto
        gridProps: { xs: 12 },
        step: 1 
    },
    {
        name: 'nombreCompleto',
        label: 'Nombre Completo',
        type: 'text',
        required: true,
        placeholder: 'Ingrese su nombre y apellidos',
        gridProps: { xs: 12, sm: 6 },
        step: 1 // <--- Añadido
    },
        // --- NUEVO CAMPO DE UBICACIÓN ---
    {
        name: 'ubicacionIncidente', // Este es el nombre que el backend recibirá en req.body
        label: 'Ubicación del Incidente (Opcional)',
        type: 'location', // Tipo personalizado para que SolicitudModalForm lo reconozca
        required: false,
        initialCenter: [-38.9854, -72.6397],
        initialZoom: 14,   
        helperText: 'Haz clic en el mapa o usa el botón para indicar la ubicación.',
        gridProps: { xs: 12 }, // Ocupa todo el ancho
        step: 1 // Añadido al paso 2
    },
    {
        name: 'correoElectronico',
        label: 'Correo Electrónico',
        type: 'email',
        required: true,
        placeholder: 'usuario@ejemplo.com',
        helperText: 'Usaremos este correo para contactarte.',
        gridProps: { xs: 12, sm: 6 },
        step: 1 // <--- Añadido
    },
    {
        name: 'descargaFormularioBase',
        label: 'Formulario Base (Referencia)',
        type: 'download-link',
        href: '/JuzgadoDePoliciaLocal/Causas DESCARGOS con notificación electrónica PMG.pdf', // Asegúrate que esta ruta sea accesible
        linkText: 'Descargar Formulario PDF',
        helperText: 'Descarga este formulario si necesitas completarlo offline.',
        gridProps: { xs: 12 },
        step: 1 // <--- Añadido (Ejemplo: Puesto en el primer paso)
    },

    // --- PASO 2: Detalles de la Solicitud/Incidente ---
    {
        name: 'descripcionSolicitud',
        label: 'Descripción Detallada',
        type: 'textarea',
        required: true,
        rows: 4,
        placeholder: 'Describe aquí el motivo de tu solicitud...',
        gridProps: { xs: 12 },
        step: 2 // <--- Añadido
    },
    {
        name: 'fechaIncidente',
        label: 'Fecha del Incidente',
        type: 'date',
        required: true,
        helperText: 'Selecciona la fecha en que ocurrió.',
        defaultValue: new Date().toISOString().split('T')[0],
        gridProps: { xs: 12, sm: 4 }, // Ajustado grid para mejor layout en este paso
        step: 2 // <--- Añadido
    },
    {
        name: 'cantidadEstimada',
        label: 'Cantidad Estimada',
        type: 'number',
        required: false,
        placeholder: 'Ej: 5',
        gridProps: { xs: 12, sm: 4 }, // Ajustado grid
        step: 2 // <--- Añadido
    },
    {
        name: 'sitioWebReferencia',
        label: 'Sitio Web de Referencia',
        type: 'url',
        required: false,
        placeholder: 'https://www.ejemplo.com',
        gridProps: { xs: 12, sm: 4 }, // Ajustado grid
        step: 2 // <--- Añadido
    },
    // Considera si este campo 'claveTemporal' realmente es necesario o dónde encaja mejor
    {
        name: 'claveTemporal',
        label: 'Contraseña Temporal (Ejemplo)',
        type: 'password',
        required: false,
        helperText: 'No guardes información sensible real aquí.',
        gridProps: { xs: 12, sm: 6 }, // Ajustado grid
        step: 2 // <--- Añadido (Ejemplo: Puesto en paso 2)
    },


    // --- PASO 3: Clasificación y Opciones ---
    {
        name: 'prioridadSolicitud',
        label: 'Prioridad',
        type: 'radio-group',
        required: true,
        row: true,
        options: [
            { value: 'baja', label: 'Baja' },
            { value: 'media', label: 'Media' },
            { value: 'alta', label: 'Alta' }
        ],
        defaultValue: 'media',
        gridProps: { xs: 12 },
        step: 3 // <--- Añadido
    },
    {
        name: 'categoria',
        label: 'Categoría de la Solicitud',
        type: 'select',
        required: true,
        options: [
            { value: 'alumbrado', label: 'Alumbrado Público' },
            { value: 'aseo', label: 'Aseo y Ornato' },
            { value: 'transito', label: 'Tránsito' },
            { value: 'otro', label: 'Otro (especificar)' }
        ],
        placeholder: 'Seleccione una categoría...',
        defaultValue: '',
        gridProps: { xs: 12, sm: 6 },
        step: 3 // <--- Añadido
    },
    {
        name: 'areasInteres',
        label: 'Áreas de Interés (Selección Múltiple)',
        type: 'multiselect',
        required: false,
        options: [
            { value: 'deportes', label: 'Deportes' },
            { value: 'cultura', label: 'Cultura' },
            { value: 'medioambiente', label: 'Medio Ambiente' },
            { value: 'social', label: 'Social' }
        ],
        defaultValue: [],
        helperText: 'Puedes seleccionar varias opciones.',
        gridProps: { xs: 12, sm: 6 },
        step: 3 // <--- Añadido
    },

    // --- PASO 4: Adjuntos y Confirmación Final ---
    {
        name: 'documentoAdjunto',
        label: 'Adjuntar Documento (PDF o Imagen)',
        type: 'file',
        required: false,
        accept: ".pdf,.jpg,.jpeg,.png",
        maxSizeMB: 10, // Asegúrate que la lógica de validación en el modal use esto
        helperText: 'Tamaño máximo 10MB.',
        gridProps: { xs: 12 },
        step: 4 // <--- Añadido
    },
    {
        name: 'infoAdicional',
        label: 'Información Importante',
        type: 'static-text',
        text: 'Recuerda que las solicitudes falsas pueden ser sancionadas. Proporciona información veraz y completa.',
        helperText: 'Revisado el 01/01/2024',
        gridProps: { xs: 12 },
        step: 4 // <--- Añadido (Ejemplo: Puesto al final)
    },
    {
        name: 'aceptaTerminos',
        label: 'Acepto los términos y condiciones',
        type: 'checkbox',
        required: true, // IMPORTANTE: El campo requerido final debe estar en el último paso visible
        defaultValue: false,
        helperText: 'Debes aceptar para continuar.',
        gridProps: { xs: 12 },
        step: 4 // <--- Añadido (Último paso)
    },
];