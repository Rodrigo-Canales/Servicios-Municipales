// frontend/src/components/formDefinitions/solicitudDePatente.js

export const title = "Solicitud por defecto";

export const fields = [
    // --- Datos del Negocio ---
    {
        name: 'correo_notificacion', // USA EL MISMO NOMBRE QUE ESPERA EL BACKEND
        label: 'Correo para Notificación de Respuesta',
        type: 'email',
        required: false, // Es opcional en el backend
        gridProps: { xs: 12 }
    },
    {
        name: 'direccionComercial', // Coincide con la key en otrosDatos
        label: 'Dirección Comercial donde operará',
        type: 'textarea',
        required: true,
        rows: 3,
        gridProps: { xs: 12 } // Ocupa ancho completo
    },
    {
        name: 'rolPropiedad', // Coincide con la key en otrosDatos
        label: 'Rol de la Propiedad (SII)',
        type: 'text',
        required: false, // Puede ser opcional inicialmente
        placeholder: 'Ej: 1234-56',
        gridProps: { xs: 12, sm: 6 }
    },
    {
        name: 'numeroLocal', // Coincide con la key en otrosDatos
        label: 'Nº Local u Oficina (si aplica)',
        type: 'text',
        required: false,
        gridProps: { xs: 12, sm: 6 }
    },
    {
        name: 'actividadPrincipal', // Coincide con la key en otrosDatos
        label: 'Actividad o Rubro Principal a desarrollar',
        type: 'text',
        required: true,
        gridProps: { xs: 12, md: 8 } // Ocupa más ancho
    },
    {
        name: 'capitalInicial', // Coincide con la key en otrosDatos
        label: 'Capital Inicial Declarado ($)',
        type: 'number', // Input numérico
        required: true, // Usualmente requerido para patentes
        gridProps: { xs: 12, md: 4 }
    },
    {
        name: 'adjuntoIniciacionActividades', // Nombre específico para este archivo
        label: 'Adjuntar Copia de Iniciación de Actividades (SII)',
        type: 'file',
        required: true, // Suele ser requerido
        // accept: ".pdf,.jpg,.jpeg,.png", // Limitar tipos de archivo si es necesario
        gridProps: { xs: 12 }
    },
    {
        name: 'adjuntoContratoArriendo', // Nombre específico
        label: 'Adjuntar Contrato de Arriendo o Título de Dominio',
        type: 'file',
        required: true,
        // accept: ".pdf",
        gridProps: { xs: 12 }
    },
    {
        name: 'adjuntoAdicional', // Nombre específico
        label: 'Adjuntar Otro Documento Relevante (Opcional)',
        type: 'file',
        required: false,
        gridProps: { xs: 12 }
    }];