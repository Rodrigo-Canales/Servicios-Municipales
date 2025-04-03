// frontend/src/components/formDefinitions/default.js

// Título que aparecerá en el modal
export const title = "Formulario General";

// Array de definiciones de campos con validaciones detalladas y propiedad 'step'
export const fields = [
    // --- PASO 1: Información Básica y Referencias (Sin cambios aquí) ---
    {
        name: 'infoInicial',
        label: 'Información Importante:',
        type: 'static-text',
        text: 'Para concretar tu solicitud tienes que completar el formulario que aparece a continuación.\n\nRecuerda adjuntar todos los documentos necesarios para agilizar el proceso.',
        gridProps: { xs: 12 },
        step: 1
    },
    {
        name: 'nombreCompleto',
        label: 'Nombre Completo',
        type: 'text',
        required: true,
        requiredMessage: 'Por favor, ingrese su nombre completo.',
        minLength: 3,
        minLengthMessage: 'El nombre parece demasiado corto.',
        maxLength: 100,
        maxLengthMessage: 'El nombre es demasiado largo (máx. 100 caracteres).',
        placeholder: 'Ingrese su nombre y apellidos',
        gridProps: { xs: 12, sm: 6 },
        step: 1
    },
    {
        name: 'correoElectronico',
        label: 'Correo Electrónico',
        type: 'email',
        required: true,
        requiredMessage: 'El correo electrónico es obligatorio.',
        emailMessage: 'El formato del correo electrónico no es válido.',
        placeholder: 'usuario@ejemplo.com',
        helperText: 'Usaremos este correo para contactarte.',
        gridProps: { xs: 12, sm: 6 },
        step: 1
    },
    {
        name: 'ubicacionIncidente', // Este se mantiene siempre visible (según la definición original)
        label: 'Ubicación General del Incidente (Opcional)',
        type: 'location',
        required: false,
        initialCenter: [-38.9854, -72.6397],
        initialZoom: 14,
        helperText: 'Marca en el mapa la ubicación general si aplica.',
        gridProps: { xs: 12 },
        step: 1
    },
    {
        name: 'descargaFormularioBase',
        label: 'Formulario Base (Referencia)',
        type: 'download-link',
        href: '/JuzgadoDePoliciaLocal/Causas DESCARGOS con notificación electrónica PMG.pdf', // Asegúrate que esta ruta sea accesible
        linkText: 'Descargar Formulario PDF de Referencia',
        helperText: 'Descarga este formulario si necesitas una guía.',
        gridProps: { xs: 12 },
        step: 1
    },

    // --- PASO 2: Detalles de la Solicitud/Incidente (Sin cambios aquí) ---
    {
        name: 'descripcionSolicitud', // Se mantiene siempre visible y requerido
        label: 'Descripción Detallada',
        type: 'textarea',
        required: true,
        requiredMessage: 'La descripción es obligatoria.',
        minLength: 15,
        minLengthMessage: 'Por favor, detalla un poco más tu solicitud (mín. 15 caracteres).',
        maxLength: 1000,
        maxLengthMessage: 'La descripción es demasiado larga (máx. 1000 caracteres).',
        rows: 4,
        placeholder: 'Describe aquí el motivo de tu solicitud de la forma más clara posible...',
        gridProps: { xs: 12 },
        step: 2
    },
    {
        name: 'fechaIncidente', // Se mantiene siempre visible y requerido
        label: 'Fecha del Incidente',
        type: 'date',
        required: true,
        requiredMessage: 'Debes seleccionar la fecha del incidente.',
        helperText: 'Selecciona la fecha en que ocurrió.',
        defaultValue: new Date().toISOString().split('T')[0],
        gridProps: { xs: 12, sm: 4 },
        step: 2
    },
    {
        name: 'cantidadEstimada', // Se mantiene siempre visible (opcional)
        label: 'Cantidad Estimada (Opcional)',
        type: 'number',
        required: false,
        min: 0,
        minMessage: 'La cantidad no puede ser negativa.',
        placeholder: 'Ej: 5',
        gridProps: { xs: 12, sm: 4 },
        step: 2
    },
    {
        name: 'sitioWebReferencia', // Se mantiene siempre visible (opcional)
        label: 'Sitio Web de Referencia (Opcional)',
        type: 'url',
        required: false,
        urlMessage: 'La dirección web no parece válida (ej: https://www.ejemplo.com).',
        placeholder: 'https://www.ejemplo.com',
        gridProps: { xs: 12, sm: 4 },
        step: 2
    },

    // --- PASO 3: Clasificación y Opciones (CON CAMPOS CONDICIONALES) ---
    {
        name: 'prioridadSolicitud', // ** TRIGGER FIELD 1 **
        label: 'Prioridad',
        type: 'radio-group',
        required: true,
        requiredMessage: 'Debes seleccionar una prioridad.',
        row: true,
        options: [
            { value: 'baja', label: 'Baja' },
            { value: 'media', label: 'Media' },
            { value: 'alta', label: 'Alta' }
        ],
        defaultValue: 'media',
        gridProps: { xs: 12 },
        step: 3
    },
    {
        name: 'justificacionPrioridadAlta', // ** TARGET FIELD 1.1 ** (Depende de prioridadSolicitud)
        label: 'Justificación de Prioridad Alta',
        type: 'textarea',
        required: true, // Requerido solo cuando es visible
        requiredMessage: 'Debe justificar por qué la prioridad es alta.',
        minLength: 20,
        minLengthMessage: 'La justificación debe tener al menos 20 caracteres.',
        rows: 2,
        placeholder: 'Explique brevemente la urgencia...',
        // Condición: Solo visible si 'prioridadSolicitud' es 'alta'
        visibleWhen: { field: 'prioridadSolicitud', is: 'alta' },
        gridProps: { xs: 12 },
        step: 3
    },
    {
        name: 'categoria', // ** TRIGGER FIELD 2 **
        label: 'Categoría de la Solicitud',
        type: 'select',
        required: true,
        requiredMessage: 'Debes seleccionar una categoría.',
        options: [
            { value: 'alumbrado', label: 'Alumbrado Público' },
            { value: 'aseo', label: 'Aseo y Ornato' },
            { value: 'transito', label: 'Tránsito' },
            { value: 'seguridad', label: 'Seguridad Ciudadana' },
            { value: 'infraestructura', label: 'Infraestructura Vial' },
            { value: 'otro', label: 'Otro (especificar abajo)' } // Texto actualizado
        ],
        placeholder: 'Seleccione una categoría...',
        defaultValue: '',
        gridProps: { xs: 12, sm: 6 },
        step: 3
    },
    {
        name: 'detalleOtroCategoria', // ** TARGET FIELD 2.1 ** (Depende de categoria)
        label: 'Especifique la categoría "Otro"',
        type: 'text',
        required: true, // Requerido solo cuando es visible
        requiredMessage: 'Debe especificar qué tipo de solicitud es.',
        placeholder: 'Ej: Permiso de evento, consulta específica, etc.',
        // Condición: Solo visible si 'categoria' es 'otro'
        visibleWhen: { field: 'categoria', is: 'otro' },
        gridProps: { xs: 12, sm: 6 },
        step: 3
    },
     {
        name: 'ubicacionEspecificaCategoria', // ** TARGET FIELD 2.2 ** (Depende de categoria)
        label: 'Ubicación Específica (Requerido para Alumbrado/Tránsito/Infraestructura)',
        type: 'location',
        required: true, // Requerido solo cuando es visible
        requiredMessage: 'Debe indicar la ubicación para esta categoría.',
        initialCenter: [-38.9854, -72.6397],
        initialZoom: 15,
        helperText: 'Marque el punto exacto en el mapa.',
        // Condición: Visible si 'categoria' es 'alumbrado', 'transito' O 'infraestructura'
        visibleWhen: { field: 'categoria', is: ['alumbrado', 'transito', 'infraestructura'] },
        gridProps: { xs: 12 },
        step: 3
    },
    {
        name: 'areasInteres', // ** TRIGGER FIELD 3 **
        label: 'Áreas de Interés Relacionadas (Opcional)',
        type: 'multiselect',
        required: false,
        options: [
            { value: 'deportes', label: 'Deportes' },
            { value: 'cultura', label: 'Cultura' },
            { value: 'medioambiente', label: 'Medio Ambiente' },
            { value: 'social', label: 'Social' },
            { value: 'educacion', label: 'Educación' },
            { value: 'salud', label: 'Salud' }
        ],
        defaultValue: [],
        helperText: 'Puedes seleccionar varias opciones si aplica.',
        gridProps: { xs: 12, sm: 6 },
        step: 3
    },
    {
        name: 'detallesAreaCultura', // ** TARGET FIELD 3.1 ** (Depende de areasInteres - requiere isVisible mejorado)
        label: 'Detalles sobre Interés en Cultura',
        type: 'textarea',
        required: false, // Opcional incluso si es visible
        placeholder: '¿Algún aspecto cultural específico?',
        rows: 2,
        // Condición: Visible si 'areasInteres' INCLUYE 'cultura'
        // NOTA: La función isFieldVisible necesita ser extendida para soportar 'includes' en arrays
        // visibleWhen: { field: 'areasInteres', includes: 'cultura' },
        // *** SOLUCIÓN TEMPORAL MIENTRAS SE MEJORA isFieldVisible ***
        // Haremos que dependa de si *alguna* área fue seleccionada (check truthy)
        // Para esto, la función isFieldVisible debe soportar { is: 'truthy' } o { isNot: [] }
         visibleWhen: { field: 'areasInteres', check: (value) => Array.isArray(value) && value.includes('cultura') }, // Usando check personalizado
        gridProps: { xs: 12, sm: 6 },
        step: 3
    },
     {
        name: 'requierePermisoEvento', // ** TRIGGER FIELD 4 (Checkbox) **
        label: '¿La solicitud implica un evento que requiere permiso?',
        type: 'checkbox',
        required: false, // El checkbox en sí no es obligatorio marcarlo
        defaultValue: false,
        gridProps: { xs: 12 },
        step: 3
    },
    {
        name: 'fechaEstimadaEvento', // ** TARGET FIELD 4.1 ** (Depende de requierePermisoEvento)
        label: 'Fecha Estimada del Evento',
        type: 'date',
        required: true, // Requerido si se va a pedir permiso
        requiredMessage: 'Indique la fecha estimada del evento.',
        // Condición: Visible si 'requierePermisoEvento' está marcado (es true)
        visibleWhen: { field: 'requierePermisoEvento', is: true },
        gridProps: { xs: 12, sm: 6 },
        step: 3
    },
     {
        name: 'tipoEvento', // ** TARGET FIELD 4.2 ** (Depende de requierePermisoEvento)
        label: 'Tipo de Evento',
        type: 'select',
        required: true, // Requerido si se va a pedir permiso
        requiredMessage: 'Seleccione el tipo de evento.',
        options: [
            { value: 'deportivo', label: 'Deportivo' },
            { value: 'cultural', label: 'Cultural' },
            { value: 'social_comunitario', label: 'Social/Comunitario' },
            { value: 'comercial', label: 'Comercial/Feria' },
            { value: 'otro', label: 'Otro' }
        ],
        placeholder: 'Seleccione...',
        // Condición: Visible si 'requierePermisoEvento' está marcado (es true)
        visibleWhen: { field: 'requierePermisoEvento', is: true },
        gridProps: { xs: 12, sm: 6 },
        step: 3
    },


    // --- PASO 4: Adjuntos y Confirmación Final (CON CAMPOS CONDICIONALES) ---
    {
        name: 'documentoAdjunto', // Documento general opcional, siempre visible
        label: 'Adjuntar Documento General (Opcional)',
        type: 'file',
        required: false,
        accept: ".pdf,.jpg,.jpeg,.png,.doc,.docx",
        maxSizeMB: 10,
        helperText: 'Tipos permitidos: PDF, JPG, PNG, DOC, DOCX. Máx: 10MB.',
        gridProps: { xs: 12, sm: 6 },
        step: 4
    },
    {
        name: 'documentoTransitoObligatorio', // ** TARGET FIELD 2.3 ** (Depende de categoria - PASO 3)
        label: 'Adjuntar Documento de Tránsito (Obligatorio)',
        type: 'file',
        required: true, // Requerido si es visible
        requiredMessage: 'Debe adjuntar el documento relacionado con tránsito.',
        accept: ".pdf,.jpg,.png",
        maxSizeMB: 5,
        helperText: 'Ej: Parte, citación, foto. PDF, JPG, PNG. Máx: 5MB.',
        // Condición: Visible si 'categoria' (en paso 3) es 'transito'
        visibleWhen: { field: 'categoria', is: 'transito' },
        gridProps: { xs: 12, sm: 6 },
        step: 4
    },
     {
        name: 'planoUbicacionEvento', // ** TARGET FIELD 4.3 ** (Depende de requierePermisoEvento - PASO 3)
        label: 'Adjuntar Plano/Croquis del Evento (Recomendado)',
        type: 'file',
        required: false, // No estrictamente obligatorio, pero recomendado si es visible
        accept: ".pdf,.jpg,.png",
        maxSizeMB: 5,
        helperText: 'Plano de ubicación, distribución, etc. PDF, JPG, PNG. Máx: 5MB.',
         // Condición: Visible si 'requierePermisoEvento' (en paso 3) es true
        visibleWhen: { field: 'requierePermisoEvento', is: true },
        gridProps: { xs: 12, sm: 6 },
        step: 4
    },
    {
        name: 'infoFinal', // Se mantiene siempre visible
        label: 'Declaración de Veracidad',
        type: 'static-text',
        text: 'Declaro que la información proporcionada en este formulario es veraz y completa. Entiendo que la entrega de información falsa puede acarrear sanciones.',
        gridProps: { xs: 12 },
        step: 4
    },
    {
        name: 'aceptaTerminos', // Se mantiene siempre visible y requerido
        label: 'Acepto los términos y la declaración de veracidad',
        type: 'checkbox',
        required: true,
        requiredMessage: 'Debes aceptar los términos para poder enviar la solicitud.',
        defaultValue: false,
        gridProps: { xs: 12 },
        step: 4
    },
];