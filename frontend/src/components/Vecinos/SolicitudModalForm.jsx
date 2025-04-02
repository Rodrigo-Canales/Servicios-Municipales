// frontend/src/components/Vecinos/SolicitudModalForm.jsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, TextField,
    CircularProgress, Alert, Box, Select, MenuItem, InputLabel, FormControl,
    Checkbox, FormControlLabel, Typography, useTheme, Input, FormHelperText,
    RadioGroup, Radio, Link, FormGroup
} from '@mui/material';
import { normalizeToCamelCase } from '../../utils/stringUtils';
import { mostrarAlertaAdvertencia } from '../../utils/alertUtils'; 

const SolicitudModalForm = ({
    open,
    onClose,
    tipoSeleccionado, // Puede ser null o un objeto con { id_tipo, nombre_tipo }
    onSubmit,
    isSubmitting,
}) => {
    const theme = useTheme();
    const [formTitle, setFormTitle] = useState('Nueva Solicitud');
    const [formFields, setFormFields] = useState([]);
    const [formData, setFormData] = useState({});
    const [loadingDefinition, setLoadingDefinition] = useState(false);
    const [definitionError, setDefinitionError] = useState(null);
    const [fileInputs, setFileInputs] = useState({});
    const [fileErrors, setFileErrors] = useState({});
    const [currentStep, setCurrentStep] = useState(0);


          
    // *** CÁLCULO DEL TOTAL DE PASOS ***
    const totalSteps = useMemo(() => {
        if (!formFields || formFields.length === 0) return 0; // Si no hay campos, no hay pasos
        const steps = formFields.map(field => field.step || 1); // Obtiene todos los números de 'step' (o 1 por defecto)
        return Math.max(0, ...steps); // Devuelve el número de paso más alto encontrado
    }, [formFields]); // Se recalcula solo si formFields cambia

        

    // --- Carga Dinámica de la Definición del Formulario ---
    useEffect(() => {
        // Cargar solo si el modal está abierto
        if (open) {
            const loadFormDefinition = async () => {
                setLoadingDefinition(true);
                setDefinitionError(null);
                setFormFields([]);
                setFormData({});
                setFileInputs({});
                let loadedFields = [];
                let loadedTitle = 'Nueva Solicitud'; // Título por defecto inicial

                // Determinar el nombre del archivo a cargar
                const formName = tipoSeleccionado?.nombre_tipo
                    ? normalizeToCamelCase(tipoSeleccionado.nombre_tipo)
                    : 'default'; // Si no hay tipo, carga 'default'

                console.log(`[Modal] Intentando cargar definición: ${formName}.js`);

                try {
                    const module = await import(`../formDefinitions/${formName}.js`);
                    loadedFields = module?.fields || [];
                    // Usar título del módulo si existe, si no, construir uno si hay tipo, si no, usar el default
                    loadedTitle = module?.title || (tipoSeleccionado?.nombre_tipo ? `Solicitud: ${tipoSeleccionado.nombre_tipo}` : 'Nueva Solicitud General');

                    if (!Array.isArray(loadedFields)) {
                         throw new Error(`El archivo de definición "${formName}.js" no exporta un array 'fields' válido.`);
                    }
                    console.log(`[Modal] Definición cargada: ${formName}.js`);

                } catch (error) {
                     console.error(`[Modal] Error al cargar definición "${formName}.js": ${error.message}`);
                     // Si falla la carga específica Y NO era 'default', intenta cargar 'default'
                     if (formName !== 'default') {
                        console.warn(`[Modal] Intentando cargar definición por defecto (default.js)...`);
                        try {
                            const defaultModule = await import('../formDefinitions/default.js');
                            loadedFields = defaultModule?.fields || [];
                            loadedTitle = defaultModule?.title || "Nueva Solicitud General (Default)";
                            if (!Array.isArray(loadedFields)) {
                                throw new Error('El archivo de definición por defecto "default.js" no exporta un array \'fields\' válido.');
                            }
                            console.log("[Modal] Definición por defecto cargada.");
                        } catch (defaultError) {
                            console.error(`[Modal] Falló al cargar definición por defecto. Error: ${defaultError.message}`);
                            setDefinitionError('Error fatal: No se pudo cargar ninguna definición de formulario.');
                            loadedFields = []; // Asegura que no intente renderizar nada
                        }
                     } else {
                         // Si ya falló cargando 'default', mostrar error fatal
                         setDefinitionError('Error fatal: No se pudo cargar la definición del formulario por defecto.');
                         loadedFields = [];
                     }
                } finally {
                    setFormFields(loadedFields);
                    setFormTitle(loadedTitle);
                    // Inicializar formData con valores por defecto correctamente
                    const initialData = loadedFields.reduce((acc, field) => {
                        let defaultValue = field.defaultValue;
                        if (defaultValue === undefined) {
                            switch (field.type) {
                                case 'checkbox': defaultValue = false; break;
                                case 'multiselect': defaultValue = []; break; // Para multiselect
                                case 'number': defaultValue = ''; break; // Evitar NaN
                                // Añadir otros tipos si necesitan default específico
                                default: defaultValue = ''; break;
                            }
                        }
                        acc[field.name] = defaultValue;
                        return acc;
                    }, {});
                    setFormData(initialData);
                    setLoadingDefinition(false);
                }
            };
            loadFormDefinition();
        } else { // Limpiar cuando se cierra el modal
            setFormFields([]);
            setFormData({});
            setFileInputs({});
            setDefinitionError(null);
            setFormTitle('Nueva Solicitud');
            setLoadingDefinition(false); // Asegurarse de resetear el estado de carga
        }
    }, [open, tipoSeleccionado]); // Dependencias clave: abrir/cerrar y cambio de tipo

    // --- Manejadores de Cambios en Inputs ---
    const handleInputChange = useCallback((eventOrValue, fieldName, fieldType) => {
        let name, value, type, checked;

        // Manejo unificado para eventos estándar y valores directos
        if (typeof eventOrValue === 'object' && eventOrValue !== null && eventOrValue.target) {
             // Evento estándar (TextField, Checkbox, Select, RadioGroup, etc.)
            const event = eventOrValue;
            name = event.target.name;
            value = event.target.value;
            type = event.target.type || fieldType; // Usa fieldType como fallback
            checked = event.target.checked;
        } else {
             // Valor directo (ej. DatePicker de MUI-X, o llamada manual)
            if (!fieldName || !fieldType) {
                console.error("[Modal] handleInputChange: Falta fieldName o fieldType para valor directo.", { value: eventOrValue });
                return;
            }
            name = fieldName;
            value = eventOrValue;
            type = fieldType;
            checked = null; // No aplica directamente aquí
        }

        // console.log("[Modal] Input Change:", { name, value, type, checked });

        setFormData(prevData => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value,
        }));
    }, []);

    const handleFileChange = useCallback((event, field) => { // <--- AÑADIDO 'field' como argumento
        const { name, files } = event.target;
        const inputElement = event.target; // Guardar referencia al input

        // Obtener el límite del field definition (o usar 10MB por defecto)
        const maxSizeMB = field?.maxSizeMB || 10;
        const maxSizeInBytes = maxSizeMB * 1024 * 1024;

        // Limpiar error anterior para este campo
        setFileErrors(prevErrors => ({ ...prevErrors, [name]: null }));

        if (files && files.length > 0) {
            const file = files[0]; // Asumimos carga de un solo archivo por ahora

            // *** VALIDACIÓN DE TAMAÑO ***
            if (file.size > maxSizeInBytes) {
                const errorMsg = `El archivo supera el límite de ${maxSizeMB} MB (tamaño: ${(file.size / (1024 * 1024)).toFixed(2)} MB).`;
                console.warn(`[Modal] Validación fallida para ${name}: ${errorMsg}`);
                setFileErrors(prevErrors => ({ ...prevErrors, [name]: errorMsg }));

                // **Importante: No guardar el archivo inválido en el estado**
                setFileInputs(prevFiles => {
                    const updated = { ...prevFiles };
                    delete updated[name]; // Elimina cualquier archivo válido previo para este input
                    return updated;
                });
                // setFormData(prevData => ({ ...prevData, [name]: '' })); // Limpiar nombre si se guarda en formData

                // Resetear el valor del input para que el usuario pueda intentar de nuevo
                if (inputElement) {
                    inputElement.value = null;
                }
                return; // Detener el procesamiento aquí
            }

            // *** El archivo es válido ***
            console.log(`[Modal] Archivo válido seleccionado para ${name}: ${file.name}`);
            setFileInputs(prevFiles => ({
                ...prevFiles,
                [name]: file // Guardar el objeto File
            }));
            // setFormData(prevData => ({ ...prevData, [name]: file.name })); // Opcional: guardar nombre

        } else {
            // No se seleccionó archivo o se canceló
            console.log(`[Modal] No se seleccionó archivo para ${name} o se canceló.`);
            setFileInputs(prevFiles => {
                const updated = { ...prevFiles };
                delete updated[name];
                return updated;
            });
            // setFormData(prevData => ({ ...prevData, [name]: '' }));
        }

        // Permitir reseleccionar el mismo archivo (si no se hizo ya)
        // Aunque el return en el caso de error ya lo evita,
        // y el else maneja la cancelación, dejarlo aquí es seguro
        // y útil si la lógica cambia.
        // if (inputElement) {
        //     inputElement.value = null;
        // }

    }, []);

    // --- Manejador de Envío ---
    const handleSubmit = (event) => {
        event.preventDefault(); // Prevenir recarga de página

        // *** 1. Validar el paso actual ***
        const isLastStepValid = validateCurrentStep();

        // *** 2. USAR el resultado de la validación *** <--- ¡AQUÍ ESTÁ LA CORRECCIÓN!
        if (!isLastStepValid) {
            // Si la validación falla (isLastStepValid es false), muestra la alerta y detiene el proceso
            mostrarAlertaAdvertencia(
                'Campos Requeridos',
                'Por favor, complete todos los campos obligatorios (*) en este último paso antes de enviar.'
            );
            return; // Detiene la ejecución de handleSubmit
        }

        // --- Si la validación PASÓ (isLastStepValid es true), continúa: ---

        // *** 3. Comprobaciones existentes ***
        if (typeof onSubmit !== 'function') {
            console.error("[Modal] onSubmit no es una función!");
            return;
        }
        if (isSubmitting || loadingDefinition || definitionError) {
            console.warn("[Modal] Intento de envío bloqueado (enviando, cargando o error).");
            return;
        }

        // *** 4. Preparar los datos (sin cambios en esta lógica) ***
        console.log("[Modal] Preparando datos para enviar...");
        const submissionData = new FormData();
        // ... (Tu bucle for para formData) ...
        for (const key in formData) {
            if (key in fileInputs) continue;
            const value = formData[key];
            if (Array.isArray(value)) {
                submissionData.append(key, JSON.stringify(value));
            } else if (value !== null && value !== undefined) {
                submissionData.append(key, value);
            }
        }
        // ... (Tu bucle for para fileInputs) ...
        for (const key in fileInputs) {
            if (fileInputs[key] instanceof File) {
                submissionData.append(key, fileInputs[key], fileInputs[key].name);
            }
        }
        // ... (Añadir id_tipo_solicitud) ...
        if (tipoSeleccionado?.id_tipo) {
            submissionData.append('id_tipo_solicitud', tipoSeleccionado.id_tipo);
        }

        // Depuración opcional
        console.log("[Modal] Enviando datos para tipo:", tipoSeleccionado?.nombre_tipo || 'Default');

        // *** 5. Llamar a onSubmit ***
        onSubmit(submissionData);
    };

    // --- Renderizado de Inputs (Completo) ---
    const renderField = (field) => {
        // Comprobación básica del campo
        if (!field || !field.name || !field.type) {
            console.error("[Modal] Campo inválido detectado en form definition:", field);
            return <Alert severity="warning" sx={{ my: 1 }}>Campo mal definido</Alert>;
        }

        const commonProps = {
            key: field.name,
            name: field.name,
            label: field.label || field.name, // Usar name como fallback para label
            required: field.required || false,
            fullWidth: true,
            variant: "outlined",
            size: "small",
            margin: "dense",
            disabled: isSubmitting || loadingDefinition, // Deshabilitar mientras carga o envía
            helperText: field.helperText || '',
        };

        const value = formData[field.name]; // Obtener valor actual del estado

        // --- Switch principal para tipos de campo ---
        switch (field.type) {
            case 'text':
            case 'email':
            case 'password':
            case 'url':
            case 'tel': // Añadido tipo teléfono
                return (
                    <TextField
                        {...commonProps}
                        type={field.type} // Usa el tipo especificado
                        value={value ?? ''} // Asegura que sea string
                        onChange={(e) => handleInputChange(e, field.name, field.type)}
                        placeholder={field.placeholder || ''}
                    />
                );
            case 'number':
                return (
                    <TextField
                        {...commonProps}
                        type="number"
                        value={value ?? ''} // Puede ser string vacío o número
                        onChange={(e) => handleInputChange(e, field.name, field.type)}
                        placeholder={field.placeholder || ''}
                        InputProps={field.InputProps || {}} // Para adornos (ej. $), min/max en inputProps
                        inputProps={{ // Para atributos HTML directos
                           min: field.min,
                           max: field.max,
                           step: field.step || 'any', // Permite decimales por defecto
                        }}
                    />
                );
            case 'textarea':
                return (
                    <TextField
                        {...commonProps}
                        multiline
                        rows={field.rows || 3}
                        value={value ?? ''}
                        onChange={(e) => handleInputChange(e, field.name, field.type)}
                        placeholder={field.placeholder || ''}
                    />
                );
            case 'checkbox':
                return (
                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    name={field.name}
                                    checked={!!value} // Convertir a booleano
                                    onChange={(e) => handleInputChange(e, field.name, field.type)}
                                    required={commonProps.required}
                                    size="small"
                                    disabled={commonProps.disabled}
                                />
                            }
                            label={commonProps.label}
                            // Label asociado al control para accesibilidad
                            // aria-labelledby={field.name + '-label'} // Opcional si el label es claro
                        />
                        {commonProps.helperText && <FormHelperText sx={{ ml: 0, mt: -0.5 }}>{commonProps.helperText}</FormHelperText>}
                    </FormGroup>
                );
            case 'select':
                return (
                    <FormControl fullWidth required={commonProps.required} size="small" margin="dense" disabled={commonProps.disabled}>
                        <InputLabel id={`${field.name}-label`}>{commonProps.label}</InputLabel>
                        <Select
                            labelId={`${field.name}-label`}
                            id={field.name}
                            name={field.name}
                            value={value ?? ''}
                            label={commonProps.label}
                            onChange={(e) => handleInputChange(e, field.name, field.type)}
                        >
                            <MenuItem value=""><em>{field.placeholder || 'Seleccione...'}</em></MenuItem>
                            {field.options?.map(option => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                         {commonProps.helperText && <FormHelperText>{commonProps.helperText}</FormHelperText>}
                    </FormControl>
                );
            case 'multiselect':
                // Asegurarse de que el valor siempre sea un array para el Select multiple
                { const multiSelectValue = Array.isArray(value) ? value : [];
                return (
                     <FormControl fullWidth required={commonProps.required} size="small" margin="dense" disabled={commonProps.disabled}>
                        <InputLabel id={`${field.name}-label`}>{commonProps.label}</InputLabel>
                        <Select
                            labelId={`${field.name}-label`}
                            id={field.name}
                            name={field.name}
                            multiple
                            value={multiSelectValue}
                            label={commonProps.label}
                            onChange={(e) => handleInputChange(e, field.name, field.type)}
                            // Renderizar valores seleccionados (ej. como chips o texto)
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((selectedValue) => {
                                        const option = field.options?.find(opt => opt.value === selectedValue);
                                        return <Typography key={selectedValue} variant="caption" sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '4px', p: 0.5 }}>{option ? option.label : selectedValue}</Typography>;
                                    })}
                                </Box>
                            )}
                            MenuProps={{ PaperProps: { style: { maxHeight: 250 } } }} // Limitar altura del dropdown
                        >
                            {field.options?.map(option => (
                                <MenuItem key={option.value} value={option.value}>
                                    <Checkbox checked={multiSelectValue.includes(option.value)} size="small" />
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                        {commonProps.helperText && <FormHelperText>{commonProps.helperText}</FormHelperText>}
                    </FormControl>
                ); }
            case 'radio-group':
                return (
                    <FormControl component="fieldset" margin="dense" required={commonProps.required} disabled={commonProps.disabled}>
                        {/* Usar Typography como leyenda para accesibilidad */}
                        <Typography component="legend" variant="body2" sx={{ mb: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
                             {commonProps.label}{commonProps.required ? ' *' : ''}
                        </Typography>
                        <RadioGroup
                            row={field.row || false} // Mostrar en fila si se especifica
                            aria-label={commonProps.label} // Para accesibilidad
                            name={field.name}
                            value={value ?? ''}
                            onChange={(e) => handleInputChange(e, field.name, field.type)}
                        >
                            {field.options?.map(option => (
                                <FormControlLabel
                                    key={option.value}
                                    value={option.value}
                                    control={<Radio size="small" />}
                                    label={option.label}
                                />
                            ))}
                        </RadioGroup>
                        {commonProps.helperText && <FormHelperText sx={{ mt: -0.5 }}>{commonProps.helperText}</FormHelperText>}
                    </FormControl>
                );
            case 'date':
                // Usando input nativo por simplicidad
                return (
                    <TextField
                        {...commonProps}
                        type="date"
                        value={value ?? ''} // Formato YYYY-MM-DD
                        onChange={(e) => handleInputChange(e, field.name, field.type)}
                        InputLabelProps={{ shrink: true }} // Etiqueta siempre arriba para date/time
                    />
                );
            case 'datetime-local': // Añadido para fecha y hora
                return (
                    <TextField
                        {...commonProps}
                        type="datetime-local"
                        value={value ?? ''} // Formato YYYY-MM-DDTHH:mm
                        onChange={(e) => handleInputChange(e, field.name, field.type)}
                        InputLabelProps={{ shrink: true }}
                    />
                );
            case 'file':
                    // Determinar si hay error para este campo específico desde el estado 'fileErrors'
                { const hasError = !!fileErrors[field.name]; // true si hay un mensaje de error, false si no
    
                return (
                        // Aplicar 'error' al FormControl para que MUI aplique estilos de error globales
                    <FormControl fullWidth margin="dense" required={commonProps.required} disabled={commonProps.disabled} error={hasError}>
    
                        {/* Etiqueta: Cambia color si hay error */}
                        <Typography variant="body2" display="block" sx={{ mb: 0.5, color: hasError ? 'error.main' : 'text.secondary', fontSize: '0.75rem' }}>
                            {commonProps.label}{commonProps.required ? ' *' : ''}
                        </Typography>
    
                        {/* Input: Cambia borde si hay error y pasa 'field' al handler */}
                        <Input
                            key={field.name}
                            name={field.name}
                            type="file"
                            // Al seleccionar archivo, llama a handleFileChange PASANDO el objeto 'field'
                            // Esto permite a handleFileChange leer field.maxSizeMB
                            onChange={(e) => handleFileChange(e, field)}
                            disabled={commonProps.disabled}
                            accept={field.accept || undefined}
                            inputProps={field.multiple ? { multiple: true } : {}} // Para carga múltiple
                            sx={{
                                // Borde rojo si hay error, normal si no
                                border: `1px solid ${hasError ? theme.palette.error.main : theme.palette.divider}`,
                                borderRadius: theme.shape.borderRadius,
                                p: 1,
                                '&::before, &::after': { display: 'none' },
                                '& input[type="file"]::file-selector-button': { // Estilos del botón (opcional)
                                    mr: 1, border: 'none', background: theme.palette.action.selected,
                                        padding: '4px 8px', borderRadius: '4px', cursor: 'pointer',
                                        fontSize: '0.8rem', '&:hover': { background: theme.palette.action.hover }
                                }
                            }}
                            // Enlaza el input con el texto de ayuda/error para accesibilidad
                            aria-describedby={field.name + '-helper-text'}
                        />
    
                        {/* Helper Text: Muestra dinámicamente el error, el nombre del archivo o el texto de ayuda */}
                        <FormHelperText id={field.name + '-helper-text'} error={hasError}>
                            {hasError // Si hay error...
                                ? fileErrors[field.name] // ...muestra el mensaje de error específico.
                                : fileInputs[field.name] // Si NO hay error, ¿hay archivo seleccionado?...
                                    ? `Seleccionado: ${fileInputs[field.name].name}` // ...muestra el nombre del archivo.
                                    : commonProps.helperText // Si NO hay error NI archivo, muestra el texto de ayuda normal.
                                }
                        </FormHelperText>
                    </FormControl>
                ); }

            case 'download-link':
                 // No es un input, solo muestra información
                if (!field.href || !field.linkText) {
                    return <Alert severity="warning" sx={{ my: 1 }}>Campo 'download-link' requiere 'href' y 'linkText'.</Alert>;
                }
                return (
                    <Box sx={{ mt: 1, mb: 1, p: 1, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                        {/* Label: Usa color secundario del texto del tema */}
                        {commonProps.label && <Typography variant="body2" display="block" sx={{ mb: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
                            {commonProps.label}
                        </Typography>}
                        {/* Link: Usará color primario del tema por defecto, añadimos subrayado */}
                        <Link
                            href={field.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={field.downloadName || true}
                            variant="body1"
                            // *** SX ACTUALIZADO ***
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5,
                                textDecoration: 'underline',
                                // Usar un color que contraste mejor (info.main suele ser una buena opción)
                                color: 'info.main',
                                // Efecto hover opcional para mejorar la interacción
                                '&:hover': {
                                   color: 'info.dark', // O ajusta el color hover como prefieras
                                   // Podrías quitar el subrayado en hover si quieres:
                                   // textDecoration: 'none',
                                }
                            }}
                        >
                            {field.linkText}
                        </Link>
                        {/* Helper Text: Usa color secundario del texto del tema */}
                        {commonProps.helperText && <FormHelperText sx={{ mt: 0.5, color: 'text.secondary' }}>{commonProps.helperText}</FormHelperText>}
                    </Box>
                );
                case 'static-text':
                    // No es un input, solo muestra información
                    return (
                        <Box sx={{
                            mt: 1, mb: 1, p: 1.5,
                            // Establece el fondo azul sólido directamente
                            bgcolor: 'primary.light',
                            color: 'primary.contrastText',
                            borderRadius: 1
                        }}>
                            {/* Título opcional: Texto blanco sólido */}
                            {commonProps.label && <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{commonProps.label}</Typography>}
                            {/* Texto principal: Texto blanco sólido */}
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{field.text || ''}</Typography>
                            {/* Helper text: Texto blanco sólido */}
                            {/* Nota: FormHelperText necesita el estilo de color explícito aquí */}
                            {commonProps.helperText && <FormHelperText sx={{ mt: 0.5,  color: 'inherit' }}>{commonProps.helperText}</FormHelperText>}
                        </Box>
                    );
            // --- Default (Campo desconocido) ---
            default:
                console.warn(`[Modal] Tipo de campo desconocido encontrado: ${field.type}`);
                return <Alert severity="warning" sx={{ my: 1 }}>Tipo de campo no soportado: {field.type}</Alert>;
        }
    };


    const validateCurrentStep = () => {
        // Obtener los campos solo para el paso actual
        const fieldsForStep = formFields.filter(field => (field.step || 1) === currentStep + 1);
    
        // Iterar sobre los campos del paso actual
        for (const field of fieldsForStep) {
            // Verificar solo los campos marcados como requeridos
            if (field.required) {
                const value = formData[field.name];
                let isEmpty = false;
    
                // Comprobar si el valor está "vacío" según el tipo de campo
                switch (field.type) {
                    case 'checkbox':
                        isEmpty = value === false; // Un checkbox requerido debe ser true
                        break;
                    case 'multiselect':
                        isEmpty = !value || value.length === 0; // Un multiselect requerido debe tener al menos una opción
                        break;
                    case 'file':
                        // Para archivos, verificamos si existe en el estado fileInputs
                        isEmpty = !fileInputs[field.name];
                        // Opcional: podrías añadir lógica si guardas el nombre en formData también
                        break;
                    case 'number':
                         // Considera 0 como válido, pero '', null, undefined no.
                         isEmpty = value === null || value === undefined || value === '';
                         break;
                    default:
                        // Para la mayoría de los otros tipos (text, email, select, date, etc.)
                        isEmpty = !value; // Equivalente a value === null, undefined, '', 0, false (cuidado con 0 si es válido)
                        // Si 0 es un valor válido y esperado para algún campo que no sea numérico, ajusta esta lógica.
                        // Una comprobación más segura para strings/selects/radios podría ser:
                        // isEmpty = value === null || value === undefined || value === '';
                        break;
                }
    
                // Si encontramos un campo requerido vacío, la validación falla
                if (isEmpty) {
                    console.warn(`[Validation] Campo requerido vacío: ${field.name} (Tipo: ${field.type}, Valor: ${value})`);
                    return false; // Indica que la validación falló
                }
            }
            // Opcional: Aquí podrías añadir validaciones más específicas (formato email, longitud, etc.)
        }
    
        // Si llegamos aquí, todos los campos requeridos del paso actual están llenos
        return true; // Indica que la validación pasó
    };


    const handleDialogClose = (event, reason) => {
        console.log('[Modal] handleDialogClose reason:', reason); // Puedes dejar esto para depuración

        if (reason && reason === 'backdropClick') {
            // Si el cierre fue causado por un clic en el 'backdrop' (fuera del modal),
            // NO hacemos nada para evitar que se cierre.
            return;
        }

        // Para cualquier otra razón (tecla 'Escape', clic en el botón "Cancelar", o
        // si onClose es llamado directamente desde otro lugar en el código),
        // entonces SÍ cerramos el modal y además...

        // *** RESETEAMOS EL PASO ACTUAL A 0 ***
        setCurrentStep(0); 
        onClose();
    };


    // --- Render Principal del Modal ---
    return (
        // Controlar maxWidth según necesidad ('xs', 'sm', 'md', 'lg', 'xl')
        <Dialog open={open} onClose={handleDialogClose} maxWidth="md" fullWidth scroll="paper">
            <DialogTitle sx={{
                m: 0,
                p: 2,
                bgcolor: theme.palette.primary.main, // Fondo azul del tema
                color: theme.palette.primary.contrastText, // Texto blanco del tema
            }}>
                {loadingDefinition ? 'Cargando formulario...' : (formTitle || 'Nueva Solicitud')}
            </DialogTitle>
            {/* Usar componente 'form' para habilitar el submit del botón */}
            <Box component="form" onSubmit={handleSubmit} noValidate>
                <DialogContent /* Sin cambios internos aquí */ >
                    {/* ... Indicadores de carga y errores ... */}
                    {!loadingDefinition && !definitionError && (
                        <Grid container spacing={2}>
                            {formFields
                                // *** FILTRO POR PASO ***
                                .filter(field => (field.step || 1) === currentStep + 1)
                                .map(field => (
                                    <Grid item {...(field.gridProps || { xs: 12 })} key={field.name}>
                                        {renderField(field)}
                                    </Grid>
                                ))
                            }
                            {/* ... Mensajes si no hay campos ... */}
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions sx={{ borderTop: `1px solid ${theme.palette.divider}`, px: 3, py: 1.5, justifyContent: 'space-between' }}>
                    {/* Botón Cancelar (sin cambios) */}
                    <Box>
                        <Button onClick={onClose} variant="contained" color="secondary" disabled={isSubmitting || loadingDefinition} sx={{ color: '#fff' }}>
                            Cancelar
                        </Button>
                    </Box>

                    {/* Contenedor de Botones de Navegación/Envío - *** ACTUALIZADO *** */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {/* Botón Anterior (visible si no es el primer paso) */}
                        {currentStep > 0 && (
                            <Button
                                onClick={() => setCurrentStep(prev => prev - 1)}
                                variant="contained"
                                color="primary"
                                disabled={isSubmitting || loadingDefinition}
                                sx={{ color: '#fff' }}
                            >
                                Anterior
                            </Button>
                        )}
                        {/* Botón Siguiente (visible si no es el último paso) */}
                        {currentStep < totalSteps - 1 && totalSteps > 0 && (
                        <Button
                            onClick={() => {
                                // *** VALIDACIÓN ANTES DE AVANZAR ***
                                const isStepValid = validateCurrentStep();
                                if (!isStepValid) {
                                    mostrarAlertaAdvertencia(
                                        'Campos Requeridos',
                                        'Por favor, complete todos los campos obligatorios (*) en este paso antes de continuar.'
                                    );
                                    return; // Detiene la ejecución si no es válido
                                }
                                // Si es válido, avanza al siguiente paso
                                setCurrentStep(prev => prev + 1);
                            }}
                            variant="contained"
                            color="success" // O 'primary' si prefieres
                            disabled={isSubmitting || loadingDefinition}
                            sx={{ color: '#fff' }}
                        >
                            Siguiente
                        </Button>
                    )}

                        {/* Botón Enviar (visible solo en el último paso) */}
                        {currentStep === totalSteps - 1 && totalSteps > 0 && (
                            <Button
                                type="submit" // Importante para que funcione el <form>
                                variant="contained" color="success"
                                disabled={loadingDefinition || !!definitionError || isSubmitting || formFields.length === 0}
                                sx={{ color: '#fff' }}
                            >
                                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Enviar Solicitud'}
                            </Button>
                        )}
                    </Box>
                </DialogActions>
            </Box>
        </Dialog>
    );
};

// --- PropTypes ---
SolicitudModalForm.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    // tipoSeleccionado puede ser null o un objeto, y sus props son opcionales si es null
    tipoSeleccionado: PropTypes.shape({
        id_tipo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        nombre_tipo: PropTypes.string,
    }),
    onSubmit: PropTypes.func.isRequired,
    isSubmitting: PropTypes.bool, // Estado de carga del envío
    submitError: PropTypes.string, // Mensaje de error del envío
};

// Valor por defecto para isSubmitting si no se pasa
SolicitudModalForm.defaultProps = {
    isSubmitting: false,
    submitError: null,
    tipoSeleccionado: null, // Default explícito
};


export default SolicitudModalForm;