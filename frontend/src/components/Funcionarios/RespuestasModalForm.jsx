// frontend/src/components/Funcionarios/RespuestaModalForm.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, TextField,
    CircularProgress, Alert, Box, Select, MenuItem, InputLabel, FormControl,
    Typography, Input, FormHelperText, List, ListItem, ListItemText, IconButton,
    FormLabel // Asegúrate que FormLabel esté importado
} from '@mui/material';
import { FileUpload as FileUploadIcon, Clear as ClearIcon } from '@mui/icons-material';
import { formatRut } from '../../utils/rutUtils'; // Asegúrate que la ruta sea correcta

// --- Importar la definición Específica del formulario de respuesta ---
import { title as formDefinitionTitle, fields as formDefinitionFields } from '../formDefinitions/respuestaSolicitud.js';

// --- Constantes ---
const MAX_FILE_SIZE_MB = 10; // Definir aquí o importar desde la definición si se mueve allí
const MAX_FILE_SIZE_BYTES = (formDefinitionFields.find(f => f.name === 'archivosRespuesta')?.maxSizeMB || MAX_FILE_SIZE_MB) * 1024 * 1024;

// --- Función de Validación (Esencial que esté aquí o importada) ---
const validateField = (name, value, fieldDefinition, formData, fileInputs) => { // Añadir fileInputs
    const { required, type, minLength, maxLength, min, max, pattern, validate } = fieldDefinition;
    const checkFileState = (fieldName) => fileInputs?.[fieldName]?.length > 0; // Helper para file

    if (required) {
        let isEmpty = false;
        switch (type) {
            case 'checkbox': isEmpty = !value; break; // Asumiendo que tienes checkbox en otros forms
            case 'multiselect': isEmpty = !Array.isArray(value) || value.length === 0; break; // Asumiendo multiselect
            case 'file': isEmpty = !checkFileState(name); break; // Usa el helper
            case 'location': isEmpty = !value || typeof value.lat !== 'number' || typeof value.lng !== 'number'; break; // Asumiendo location
            case 'number': isEmpty = value === null || value === undefined || value === ''; break;
            default: isEmpty = value === null || value === undefined || value === ''; break; // Para text, textarea, select, etc.
        }
        if (isEmpty) return fieldDefinition.requiredMessage || 'Este campo es obligatorio.';
    }

    // Si no es requerido y está vacío (o es null/undefined), no hay más validaciones estándar
    if (value === null || value === undefined || value === '') return null;

    // Validaciones específicas de tipo (solo si hay valor)
    switch (type) {
        case 'number':
            { const numValue = parseFloat(value); if (isNaN(numValue)) return fieldDefinition.numberMessage || 'Ingrese un número.'; if (min !== undefined && numValue < min) return fieldDefinition.minMessage || `Mínimo ${min}.`; if (max !== undefined && numValue > max) return fieldDefinition.maxMessage || `Máximo ${max}.`; break; }
        case 'textarea':
        case 'text': // Añadir text si se usa
            { const stringValue = String(value); if (minLength !== undefined && stringValue.length < minLength) return fieldDefinition.minLengthMessage || `Mínimo ${minLength} chars.`; if (maxLength !== undefined && stringValue.length > maxLength) return fieldDefinition.maxLengthMessage || `Máximo ${maxLength} chars.`; break; }
        // Validaciones para email, url, etc., si se usan en otros formularios cargados aquí
    }

    // Validación de Patrón (Regex)
    if (pattern) {
        try { const regex = new RegExp(pattern); if (!regex.test(String(value))) return fieldDefinition.patternMessage || 'Formato inválido.'; } catch (e) { console.error(`Invalid regex for ${name}: ${pattern}`, e); return 'Patrón inválido.'; }
    }

    // Validación Personalizada
    if (typeof validate === 'function') {
        // Pasar formData completo y fileInputs a la función de validación personalizada
        const customError = validate(value, { ...formData, fileInputs });
        if (typeof customError === 'string' && customError.length > 0) return customError;
    }

    // Validación específica para archivos (tamaño, tipo) - ya se hace en handleFileChange, pero se puede duplicar aquí por si acaso
     if (type === 'file' && Array.isArray(value)) { // 'value' aquí sería el array de File objects desde fileInputs
        for (const file of value) {
            if (file.size > MAX_FILE_SIZE_BYTES) {
                return `Archivo "${file.name}" excede ${MAX_FILE_SIZE_MB}MB.`;
            }
            // Podría añadirse validación de 'accept' aquí también
        }
    }


    return null; // Sin error
};
// --- Fin Función de Validación ---


// --- Componente Principal ---
const RespuestaModalForm = ({
    open, onClose, solicitudOriginal, onSubmit, isSubmitting, submitError, currentUserRut,
}) => {
    // Estados para los campos definidos en respuestaSolicitud.js
    const [formData, setFormData] = useState({});
    const [fileInputs, setFileInputs] = useState({}); // { campoNombre: [File, File, ...] }
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // Usar título y campos importados
    const formTitle = useMemo(() => formDefinitionTitle || 'Responder Solicitud', []);
    const formFields = useMemo(() => formDefinitionFields || [], []); // Campos interactivos

    // --- Inicializar/Resetear Estado al Abrir/Cambiar Solicitud ---
    useEffect(() => {
        if (open && solicitudOriginal) { // Asegurar que tengamos solicitudOriginal
            const initialData = {};
            const initialErrors = {};
            const initialTouched = {};
            const initialFiles = {};

            formFields.forEach(field => {
                if (field.type === 'static-text') return; // Ignorar estáticos en inicialización

                let defaultValue = field.defaultValue ?? ''; // Default a string vacío
                if (field.type === 'checkbox') defaultValue = field.defaultValue ?? false;
                if (field.type === 'multiselect') defaultValue = field.defaultValue ?? [];
                if (field.type === 'number') defaultValue = field.defaultValue ?? '';
                if (field.type === 'location') defaultValue = field.defaultValue ?? null;
                if (field.type === 'file') {
                    defaultValue = null; // File input no es controlado por value
                    initialFiles[field.name] = []; // Inicializar array vacío para archivos
                }
                initialData[field.name] = defaultValue;
                initialErrors[field.name] = null;
                initialTouched[field.name] = false;
            });

            setFormData(initialData);
            setErrors(initialErrors);
            setTouched(initialTouched);
            setFileInputs(initialFiles); // Establecer estado inicial de archivos

            // Resetear inputs de archivo visualmente
            formFields.filter(f => f.type === 'file').forEach(f => {
                const fileInput = document.getElementById(`${f.name}-input`);
                if (fileInput) fileInput.value = null;
            });
        }
    }, [open, solicitudOriginal, formFields]); // Dependencias

    // --- Handlers (Input, Blur, File, RemoveFile) ---
    const handleInputChange = useCallback((eventOrValue, fieldName, fieldType) => {
        let name, value, type, checked;
        const target = eventOrValue?.target;
        if (target) { name = target.name; value = target.value; type = target.type || fieldType; checked = target.checked; }
        else { name = fieldName; value = eventOrValue; type = fieldType; checked = null; }

        const newValue = type === 'checkbox' ? checked : value;
        let processedValue = newValue;
        if (type === 'number') { const num = parseFloat(value); if (value === '' || value === '-' || value === '+') processedValue = value; else if (!isNaN(num)) processedValue = num; else processedValue = value; }

        // Actualizar formData
        setFormData(prev => ({ ...prev, [name]: processedValue }));

        // Validar si el campo ya fue tocado
        const fieldDefinition = formFields.find(f => f.name === name);
        if (fieldDefinition && touched[name]) {
            const errorMessage = validateField(name, processedValue, fieldDefinition, formData, fileInputs);
            setErrors(prevErrors => ({ ...prevErrors, [name]: errorMessage }));
        }
    }, [formFields, touched, formData, fileInputs]); // Añadir fileInputs a dependencias

    const handleBlur = useCallback((fieldName) => {
        setTouched(prev => ({ ...prev, [fieldName]: true }));
        const fieldDefinition = formFields.find(f => f.name === fieldName);
        if (fieldDefinition) {
            const currentValue = fieldDefinition.type === 'file' ? fileInputs[fieldName] : formData[fieldName];
            const errorMessage = validateField(fieldName, currentValue, fieldDefinition, formData, fileInputs);
            // Actualizar error solo si cambia respecto al estado actual
            if (errors[fieldName] !== errorMessage) {
                setErrors(prev => ({ ...prev, [fieldName]: errorMessage }));
            }
        }
    }, [formFields, formData, fileInputs, errors]); // Añadir errors a dependencias

    const handleFileChange = useCallback((event) => {
        const { name } = event.target;
        const files = event.target.files ? Array.from(event.target.files) : [];
        const inputElement = event.target;
        const fieldDefinition = formFields.find(f => f.name === name);
        if (!fieldDefinition) return;

        // Si es archivosRespuesta, acumula archivos previos y nuevos (sin duplicados por nombre y tamaño)
        let newFiles = files;
        if (name === 'archivosRespuesta') {
            const prevFiles = fileInputs[name] || [];
            // Evita duplicados por nombre y tamaño
            const allFiles = [...prevFiles, ...files];
            const uniqueFiles = [];
            const seen = new Set();
            for (const file of allFiles) {
                const key = file.name + '_' + file.size;
                if (!seen.has(key)) {
                    uniqueFiles.push(file);
                    seen.add(key);
                }
            }
            newFiles = uniqueFiles;
        }

        // Validar archivos
        const fileError = validateField(name, newFiles, fieldDefinition, formData, { [name]: newFiles });
        setTouched(prev => ({ ...prev, [name]: true }));

        if (fileError) {
            setErrors(prev => ({ ...prev, [name]: fileError }));
            setFileInputs(prev => ({ ...prev, [name]: [] }));
            if (inputElement) inputElement.value = null;
        } else {
            setFileInputs(prev => ({ ...prev, [name]: newFiles }));
            setErrors(prev => ({ ...prev, [name]: null }));
            if (inputElement) inputElement.value = null; // Permite volver a seleccionar el mismo archivo
        }
    }, [formFields, formData, fileInputs]);

    const handleRemoveFile = useCallback((fieldName, indexToRemove) => {
        const fieldDefinition = formFields.find(f => f.name === fieldName);
        if (!fieldDefinition) return;

        // Actualizar estado fileInputs
        const updatedFiles = (fileInputs[fieldName] || []).filter((_, index) => index !== indexToRemove);
        setFileInputs(prev => ({ ...prev, [fieldName]: updatedFiles }));

        // Resetear input visualmente
        const fileInput = document.getElementById(`${fieldName}-input`);
        if (fileInput) fileInput.value = null;

        // Re-validar el campo de archivo con la lista actualizada
        const error = validateField(fieldName, updatedFiles, fieldDefinition, formData, { ...fileInputs, [fieldName]: updatedFiles });
        setErrors(prev => ({ ...prev, [fieldName]: error }));

    }, [formFields, formData, fileInputs]); // Depende de fileInputs

    // --- Validación y Submit ---
    const validateForm = useCallback(() => {
        let isFormValid = true;
        const newErrors = {};
        const fieldsToTouch = {};

        formFields.forEach(field => {
            // Skip static-text fields
            if (field.type === 'static-text') return;

            fieldsToTouch[field.name] = true; // Mark as touched
            const value = field.type === 'file' ? fileInputs[field.name] : formData[field.name];

            // Validate only if the field is visible or explicitly required
            if ((field.isVisible ? field.isVisible(formData) : true) || field.required) {
                const error = validateField(field.name, value, field, formData, fileInputs);
                if (error) {
                    newErrors[field.name] = error;
                    isFormValid = false;
                }
            }
        });

        setErrors(newErrors);
        setTouched(prev => ({ ...prev, ...fieldsToTouch }));
        return isFormValid;
    }, [formFields, formData, fileInputs]);

    const handleSubmit = useCallback(async (event) => {
        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (isSubmitting || !currentUserRut || !solicitudOriginal?.id_solicitud) {
            return;
        }

        const formDataToSend = new FormData();
        formDataToSend.append('id_solicitud', solicitudOriginal.id_solicitud);
        formDataToSend.append('RUT_trabajador', currentUserRut);

        formFields.forEach(field => {
            if (field.type === 'static-text') return;
            const key = field.name;
            if (field.type === 'file') {
                // Si el campo es 'archivosRespuesta', permite múltiples archivos
                const files = fileInputs[key] || [];
                if (key === 'archivosRespuesta') {
                    files.forEach(file => formDataToSend.append('archivosRespuesta', file));
                } else {
                    // Para otros campos file, mantener el comportamiento actual
                    files.forEach(file => formDataToSend.append(key, file));
                }
            } else {
                const value = formData[key];
                if (value !== null && value !== undefined && value !== '') {
                    formDataToSend.append(key, value);
                }
            }
        });

        // Asegurar que los campos `respuesta_texto` y `estado_solicitud` estén presentes con snake_case
        if (!formDataToSend.has('respuesta_texto')) {
            formDataToSend.append('respuesta_texto', formData['respuestaTexto'] || '');
        }
        if (!formDataToSend.has('estado_solicitud')) {
            formDataToSend.append('estado_solicitud', formData['estadoSolicitud'] || 'Pendiente');
        }

        onSubmit(formDataToSend);
    }, [validateForm, isSubmitting, currentUserRut, solicitudOriginal, formFields, fileInputs, formData, onSubmit]);

    // --- Dialog Close Handler ---
    const handleDialogClose = (event, reason) => {
        if (reason === 'backdropClick' && isSubmitting) return;
        // No resetear estado aquí, se hace en el useEffect al abrir
        onClose();
    };

    // --- Render Field Logic (Adaptada para tipos textarea, select, file) ---
    const renderField = useCallback((field) => {
        if (!field || !field.name || !field.type) return <Alert severity="error" sx={{ my: 1 }}>Campo mal definido.</Alert>;
        const fieldName = field.name;
        const isFileType = field.type === 'file';
        const currentValue = isFileType ? undefined : formData[fieldName];
        const fieldError = errors[fieldName];
        const isTouchedField = touched[fieldName];
        const showError = isTouchedField && !!fieldError;
        const currentFiles = isFileType ? (fileInputs[fieldName] || []) : [];
        const isFileSelected = isFileType && currentFiles.length > 0;
        const hasValue = !isFileType && !(currentValue === '' || currentValue === null || currentValue === undefined || (Array.isArray(currentValue) && currentValue.length === 0));
        const isSuccess = isTouchedField && !fieldError && (hasValue || isFileSelected); // Éxito si tocado, sin error y con valor/archivo

        const formControlProps = { key: fieldName, fullWidth: true, margin: "dense", disabled: isSubmitting, error: showError, required: field.required };
        const inputProps = { name: fieldName, label: field.label || fieldName, value: currentValue ?? '', onChange: (e) => handleInputChange(e, fieldName, field.type), onBlur: () => handleBlur(fieldName) };
        const successSx = { '& .MuiOutlinedInput-root fieldset': { borderColor: 'success.main' }, '& .MuiInputLabel-root.Mui-focused': { color: 'success.main' }, '& .MuiFormLabel-root.Mui-focused': { color: 'success.main' }, '& .MuiInputLabel-root:not(.Mui-focused)': { color: showError ? 'error.main' : isSuccess ? 'success.main' : undefined }, '& .MuiOutlinedInput-root:hover fieldset': { borderColor: isSuccess ? 'success.dark' : undefined } };


        switch (field.type) {
            case 'textarea':
                return (<FormControl {...formControlProps} sx={isSuccess ? successSx : {}}>
                            <TextField {...inputProps} multiline rows={field.rows || 6} placeholder={field.placeholder || ''} variant="outlined" size="small" helperText={showError ? fieldError : (field.helperText || ' ')} required={field.required} disabled={isSubmitting} />
                        </FormControl>);
            case 'select':
                return (<FormControl {...formControlProps} variant="outlined" size="small" sx={isSuccess ? successSx : {}}>
                            <InputLabel id={`${fieldName}-label`}>{inputProps.label}</InputLabel>
                            <Select name={fieldName} labelId={`${fieldName}-label`} id={fieldName} value={currentValue ?? ''} label={inputProps.label} onChange={(e) => handleInputChange(e, fieldName, field.type)} onBlur={() => handleBlur(fieldName)} disabled={isSubmitting}>
                                {field.options?.map(option => (<MenuItem key={option.value} value={option.value} disabled={option.value === '' && field.required}>{option.label || <em>{field.placeholder}</em>}</MenuItem>))}
                            </Select>
                            <FormHelperText>{showError ? fieldError : (field.helperText || ' ')}</FormHelperText>
                        </FormControl>);
            case 'file':
                 return (
                    <FormControl fullWidth margin="dense" required={field.required} disabled={isSubmitting} error={showError}>
                        <FormLabel sx={{ mb: 0.5, fontSize: '0.8rem', color: showError ? 'error.main' : isSuccess ? 'success.main' : 'text.secondary' }}>{field.label}{field.required ? ' *' : ''}</FormLabel>
                        <Button component="label" variant="outlined" startIcon={<FileUploadIcon />} size="small" sx={{ justifyContent: 'flex-start', textTransform: 'none', borderColor: showError ? 'error.main' : isSuccess ? 'success.main' : undefined }} disabled={isSubmitting}>
                            Seleccionar Archivos
                            <input
                                id={`${fieldName}-input`}
                                name={fieldName} // <-- nombre correcto para el handler
                                type="file"
                                hidden
                                multiple={fieldName === 'archivosRespuesta' ? true : (field.multiple || false)}
                                onChange={handleFileChange} // <-- handler directo, no pasar field
                                accept={field.accept}
                            />
                        </Button>
                        <FormHelperText id={`${fieldName}-helper-text`} error={showError}>{showError ? fieldError : field.helperText || ' '}</FormHelperText>
                        {Array.isArray(fileInputs[fieldName]) && fileInputs[fieldName].length > 0 && (
                            <List dense sx={{ mt: 1, maxHeight: 120, overflowY: 'auto', bgcolor: 'action.hover', borderRadius: 1, p: 0.5 }}>
                                {fileInputs[fieldName].map((file, index) => (
                                    <ListItem key={`${file.name}-${file.size}-${index}`} disableGutters sx={{ pl: 1, pr: 0.5, py: 0.2 }} secondaryAction={<IconButton edge="end" size="small" onClick={() => handleRemoveFile(fieldName, index)} disabled={isSubmitting}><ClearIcon fontSize="inherit" sx={{ fontSize: '1rem' }} /></IconButton>}>
                                        <ListItemText primary={file.name} secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`} primaryTypographyProps={{ variant: 'caption', noWrap: true, display: 'block' }} secondaryTypographyProps={{ variant: 'caption', fontSize: '0.65rem' }} />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </FormControl>
                );
            // Añadir casos para otros tipos si se usan en respuestaSolicitud.js
            default:
                return <Alert severity="warning" sx={{ my: 1 }}>Tipo de campo '{field.type}' no renderizado.</Alert>;
        }
    // Dependencias del useCallback de renderizado
    }, [formData, errors, touched, isSubmitting, handleInputChange, handleBlur, handleFileChange, fileInputs, handleRemoveFile]); // Añadir formFields


    // --- Renderizado del Componente Dialog ---
    if (!open || !solicitudOriginal) return null;

    // Obtén la URL base del backend desde la variable de entorno
    const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
    const sectionBoxStyle = {
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 1,
        p: { xs: 1.5, sm: 2 },
        mb: 2,
        border: theme => `1px solid ${theme.palette.divider}`,
    };
    const sectionTitleStyle = {
        fontWeight: 'bold',
        color: 'primary.main',
        mb: 1,
        fontSize: '1.1rem',
        letterSpacing: 0.2,
    };
    const fileListStyle = {
        mt: 1,
        mb: 1,
        bgcolor: 'action.hover',
        borderRadius: 1,
        p: 1,
        boxShadow: 0,
    };
    const pdfLinkStyle = {
        display: 'inline-block',
        mt: 1,
        fontWeight: 500,
        color: 'secondary.main',
        textDecoration: 'underline',
        fontSize: '0.98rem',
    };

    return (
        <Dialog open={open} onClose={handleDialogClose} maxWidth="md" fullWidth scroll="paper" PaperProps={{ component: 'form', onSubmit: handleSubmit, noValidate: true }} disableEscapeKeyDown={isSubmitting} aria-labelledby="responder-dialog-title">
            <DialogTitle id="responder-dialog-title" sx={{ m: 0, p: '12px 24px', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                {formTitle} #{solicitudOriginal.id_formateado || solicitudOriginal.id_solicitud}
            </DialogTitle>

            <DialogContent dividers sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
                {/* Mostrar Error General del Envío API */}
                {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}
                {/* Mostrar Error Interno (Falta RUT/ID) */}
                {errors._form && <Alert severity="warning" sx={{ mb: 2 }}>{errors._form}</Alert>}

                <Grid container spacing={3} alignItems="flex-start">
                    {/* Columna Izquierda: Info Solicitud Original */}
                    <Grid item xs={12} md={6}>
                        <Box sx={sectionBoxStyle}>
                            <Typography sx={sectionTitleStyle}>Detalles de la Solicitud</Typography>
                            <TextField InputProps={{ readOnly: true, sx:{bgcolor: 'action.disabledBackground'} }} variant="outlined" size="small" margin="dense" fullWidth label="Tipo Solicitud" value={solicitudOriginal.nombre_tipo || 'N/A'} sx={{ mb: 1 }} />
                            <TextField InputProps={{ readOnly: true, sx:{bgcolor: 'action.disabledBackground'} }} variant="outlined" size="small" margin="dense" fullWidth label="RUT Solicitante" value={formatRut(solicitudOriginal.RUT_ciudadano) || 'N/A'} sx={{ mb: 1 }} />
                            <TextField InputProps={{ readOnly: true, sx:{bgcolor: 'action.disabledBackground'} }} variant="outlined" size="small" margin="dense" fullWidth label="Nombre Solicitante" value={`${solicitudOriginal.nombre_ciudadano || ''} ${solicitudOriginal.apellido_ciudadano || ''}`.trim() || 'N/A'} sx={{ mb: 1 }} />
                            <TextField InputProps={{ readOnly: true, sx:{bgcolor: 'action.disabledBackground'} }} variant="outlined" size="small" margin="dense" fullWidth label="Fecha Envío" value={solicitudOriginal.fecha_hora_envio ? new Date(solicitudOriginal.fecha_hora_envio).toLocaleString('es-CL') : 'N/A'} sx={{ mb: 1 }} />
                            {solicitudOriginal.correo_notificacion && <TextField InputProps={{ readOnly: true, sx:{bgcolor: 'action.disabledBackground'} }} variant="outlined" size="small" margin="dense" fullWidth label="Correo Notif." value={solicitudOriginal.correo_notificacion} sx={{ mb: 1 }} />}
                            {Array.isArray(solicitudOriginal.archivos_adjuntos) && solicitudOriginal.archivos_adjuntos.length > 0 && (
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5, mt: 1 }}>Archivos Adjuntos:</Typography>
                                    <List dense sx={fileListStyle}>
                                        {solicitudOriginal.archivos_adjuntos.filter(archivo => /\.[a-zA-Z0-9]+$/.test(archivo.nombre)).map((archivo, idx) => (
                                            <ListItem key={archivo.url || archivo.nombre || idx} disableGutters>
                                                <ListItemText
                                                    primary={<a href={backendUrl + archivo.url} target="_blank" rel="noopener noreferrer" download>{archivo.nombre}</a>}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Box>
                            )}
                            {solicitudOriginal.pdf_url && (
                                <Box>
                                    <a href={backendUrl + solicitudOriginal.pdf_url} target="_blank" rel="noopener noreferrer" download style={{ ...pdfLinkStyle }}>
                                        Descargar PDF de la Solicitud
                                    </a>
                                </Box>
                            )}
                        </Box>
                    </Grid>
                    {/* Columna Derecha: Respuesta del Funcionario y archivos de la respuesta */}
                    <Grid item xs={12} md={6}>
                        <Box sx={sectionBoxStyle}>
                            <Typography sx={sectionTitleStyle}>Respuesta del Funcionario</Typography>
                            {/* Renderizar los campos definidos en respuestaSolicitud.js */}
                            {formFields.map(field => renderField(field))}
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ px: { xs: 1.5, sm: 2, md: 3 }, py: 1.5, borderTop: (theme) => `1px solid ${theme.palette.divider}` }}>
                <Button onClick={handleDialogClose} color="secondary" variant="outlined" disabled={isSubmitting}>Cancelar</Button>
                <Button type="submit" variant="contained" color="primary" disabled={isSubmitting} sx={{ minWidth: '180px' }} startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}>
                    {isSubmitting ? 'Enviando...' : 'Enviar Respuesta'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// --- PropTypes ---
RespuestaModalForm.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    solicitudOriginal: PropTypes.shape({
        id_solicitud: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        id_formateado: PropTypes.string,
        nombre_tipo: PropTypes.string,
        RUT_ciudadano: PropTypes.string,
        nombre_ciudadano: PropTypes.string,
        apellido_ciudadano: PropTypes.string,
        fecha_hora_envio: PropTypes.string,
        correo_notificacion: PropTypes.string,
        archivos_adjuntos: PropTypes.arrayOf(PropTypes.shape({
            url: PropTypes.string,
            nombre: PropTypes.string,
        })),
        pdf_url: PropTypes.string,
    }),
    onSubmit: PropTypes.func.isRequired,
    isSubmitting: PropTypes.bool,
    submitError: PropTypes.string,
    currentUserRut: PropTypes.string.isRequired,
};

// --- DefaultProps ---
RespuestaModalForm.defaultProps = {
    isSubmitting: false,
    submitError: null,
    solicitudOriginal: null,
};

export default RespuestaModalForm;