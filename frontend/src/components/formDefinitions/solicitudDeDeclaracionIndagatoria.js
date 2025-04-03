export const title = "Solicitud de declaración indagatoria";

export const fields = [
    {
        name: 'infoAdicional',
        label: 'Pasos a realizar:',
        type: 'static-text',
        text: '- Descargue el formulario PDF.\n- Rellenelo con la información correspondiente.\n- Escanee y suba el formulario en el campo respectivo a continuación.\n- Verifique que el archivo se haya subido correctamente.\n- Envíe el formulario.',
        helperText: '(Se tiene que descargar el formulario ya que requiere firma).',
        gridProps: { xs: 12 },
        step: 1 
    },
    {
        name: 'descargaFormularioBase',
        label: 'Formulario de declaración indagatoria',
        type: 'download-link',
        href: '/JuzgadoDePoliciaLocal/Causas INDAGATORIA con notificación electrónica.pdf',
        linkText: 'Descargar Formulario PDF',
        helperText: 'Descarga este formulario para completar tu solicitud',
        gridProps: { xs: 12 },
        step: 1
    },
    {
        name: 'correoElectronico',
        label: 'Correo electrónico para notificación de respuesta',
        type: 'email',
        required: true,
        placeholder: 'usuario@ejemplo.com',
        helperText: 'Usaremos este correo para notificarte.',
        gridProps: { xs: 12, sm: 6 },
        step: 1 
    },
    {
        name: 'documentoAdjunto',
        label: 'Adjuntar Formulario (PDF)',
        type: 'file',
        required: true,
        accept: ".pdf",
        maxSizeMB: 10, 
        helperText: 'Tamaño máximo 10MB.',
        gridProps: { xs: 12 },
        step: 1
    },
]