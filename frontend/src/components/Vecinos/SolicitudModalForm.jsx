// frontend/src/components/Vecinos/SolicitudModalForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, TextField,
    CircularProgress, Alert, Box, Select, MenuItem, InputLabel, FormControl,
    Checkbox, FormControlLabel, Typography, useTheme, Input // Input para file
    // Si usas TextareaAutosize directo, impórtalo: import TextareaAutosize from '@mui/material/TextareaAutosize';
} from '@mui/material';
// Asume que tienes esta utilidad en la ruta correcta
import { normalizeToCamelCase } from '../../utils/stringUtils';

const SolicitudModalForm = ({
    open,
    onClose,
    tipoSeleccionado,
    onSubmit,
    isSubmitting, // Prop para indicar si el envío está en curso
    submitError    // Prop para mostrar errores específicos del envío
}) => {
    const theme = useTheme();
    const [formTitle, setFormTitle] = useState('Nueva Solicitud');
    const [formFields, setFormFields] = useState([]);
    const [formData, setFormData] = useState({});
    const [loadingDefinition, setLoadingDefinition] = useState(false); // Carga de definición
    const [definitionError, setDefinitionError] = useState(null); // Error al cargar definición
    const [fileInputs, setFileInputs] = useState({}); // Estado separado para archivos

    // --- Carga Dinámica de la Definición del Formulario ---
    useEffect(() => {
        // Solo cargar si el modal está abierto y hay un tipo seleccionado
        if (open && tipoSeleccionado?.nombre_tipo) {
            const loadFormDefinition = async () => {
                setLoadingDefinition(true);
                setDefinitionError(null);
                setFormFields([]); // Limpiar campos anteriores
                setFormData({});   // Limpiar datos anteriores
                setFileInputs({}); // Limpiar archivos anteriores
                let loadedFields = [];
                let loadedTitle = `Solicitud: ${tipoSeleccionado.nombre_tipo}`;

                const camelCaseName = normalizeToCamelCase(tipoSeleccionado.nombre_tipo);
                console.log(`[Modal] Attempting to load form definition: ${camelCaseName}.js`);

                try {
                    // Import dinámico
                    const module = await import(`../formDefinitions/${camelCaseName}.js`);
                    if (module && Array.isArray(module.fields)) {
                        loadedFields = module.fields;
                        loadedTitle = module.title || loadedTitle;
                        console.log(`[Modal] Successfully loaded specific definition: ${camelCaseName}`);
                    } else {
                        throw new Error(`Definition file "${camelCaseName}.js" does not have a valid "fields" array export.`);
                    }
                } catch (specificError) {
                    console.warn(`[Modal] Could not load specific form definition "${camelCaseName}.js". Falling back to default. Error: ${specificError.message}`);
                    try {
                        const defaultModule = await import('../formDefinitions/default.js');
                        if (defaultModule && Array.isArray(defaultModule.fields)) {
                            loadedFields = defaultModule.fields;
                            loadedTitle = defaultModule.title || "Nueva Solicitud General";
                            console.log("[Modal] Loaded default form definition.");
                        } else {
                             throw new Error('Default definition file "default.js" is invalid.');
                        }
                    } catch (defaultError) {
                        console.error(`[Modal] Failed to load default form definition. Error: ${defaultError.message}`);
                        setDefinitionError('Error fatal: No se pudo cargar ninguna definición de formulario.');
                        loadedFields = [];
                    }
                } finally {
                    setFormFields(loadedFields);
                    setFormTitle(loadedTitle);
                    // Inicializar formData con valores por defecto
                    const initialData = loadedFields.reduce((acc, field) => {
                        acc[field.name] = field.defaultValue ?? (field.type === 'checkbox' ? false : '');
                        return acc;
                    }, {});
                    setFormData(initialData);
                    setLoadingDefinition(false);
                }
            };
            loadFormDefinition();
        } else if (!open) {
            // Limpiar al cerrar
            setFormFields([]);
            setFormData({});
            setFileInputs({});
            setDefinitionError(null);
            setFormTitle('Nueva Solicitud');
        }
    }, [open, tipoSeleccionado]); // Dependencias clave

    // --- Manejadores de Cambios en Inputs ---
    const handleInputChange = useCallback((event) => {
        const { name, value, type, checked } = event.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value,
        }));
    }, []);

    const handleFileChange = useCallback((event) => {
        const { name, files } = event.target;
        if (files && files.length > 0) {
            setFileInputs(prevFiles => ({
                ...prevFiles,
                [name]: files[0] // Guardar el objeto File
            }));
             // Actualizar formData con el nombre del archivo (opcional, para visualización)
             setFormData(prevData => ({
                ...prevData,
                [name]: files[0].name
             }));
        } else {
            // Limpiar si se quita el archivo
             setFileInputs(prevFiles => {
                 const updatedFiles = { ...prevFiles };
                 delete updatedFiles[name];
                 return updatedFiles;
             });
             setFormData(prevData => ({
                ...prevData,
                [name]: '' // Limpiar el nombre en formData
             }));
        }
         // Permitir reseleccionar el mismo archivo
         if (event.target) {
             event.target.value = null;
         }
    }, []);

    // --- Manejador de Envío ---
    const handleSubmit = (event) => {
        event.preventDefault();
        if (typeof onSubmit === 'function' && !isSubmitting) { // Evitar doble envío
            const submissionData = new FormData();
            // Añadir datos del formulario
            for (const key in formData) {
                // Solo añadir si no es un campo de archivo gestionado por fileInputs
                 if (!(key in fileInputs)) {
                      submissionData.append(key, formData[key]);
                 }
            }
             // Añadir archivos reales
            for (const key in fileInputs) {
                submissionData.append(key, fileInputs[key], fileInputs[key].name);
            }
             // Añadir ID del tipo de solicitud si está disponible
            if (tipoSeleccionado?.id_tipo) {
                submissionData.append('id_tipo', tipoSeleccionado.id_tipo);
            }

            // Depuración: Ver qué se envía (no mostrará archivos directamente)
            console.log("[Modal] Submitting data for type:", tipoSeleccionado?.nombre_tipo);
            // for (let pair of submissionData.entries()) { console.log(pair[0]+ ', ' + pair[1]); }

            onSubmit(submissionData); // Llamar a la función pasada desde Vecino.jsx
        }
    };

    // --- Renderizado de Inputs ---
    const renderField = (field) => {
        const commonProps = {
            key: field.name,
            name: field.name,
            label: field.label,
            value: formData[field.name] ?? '',
            required: field.required,
            onChange: handleInputChange,
            fullWidth: true,
            variant: "outlined",
            size: "small",
            margin: "dense",
            disabled: isSubmitting, // Deshabilitar durante el envío
        };

        switch (field.type) {
            case 'textarea':
                return (
                     <TextField
                        {...commonProps}
                        multiline
                        rows={field.rows || 3}
                        placeholder={field.placeholder || ''}
                    />
                );
            case 'select':
                return (
                    <FormControl fullWidth required={field.required} size="small" margin="dense" disabled={isSubmitting}>
                        <InputLabel id={`${field.name}-label`}>{field.label}</InputLabel>
                        <Select
                            labelId={`${field.name}-label`}
                            id={field.name}
                            name={field.name}
                            value={formData[field.name] ?? ''}
                            label={field.label}
                            onChange={handleInputChange}
                        >
                            <MenuItem value=""><em>Seleccione...</em></MenuItem>
                            {field.options?.map(option => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                );
            case 'checkbox':
                return (
                     <FormControlLabel
                        control={
                            <Checkbox
                                key={field.name} // key en el control interno
                                name={field.name}
                                checked={formData[field.name] ?? false}
                                onChange={handleInputChange}
                                required={field.required}
                                size="small"
                                disabled={isSubmitting}
                            />
                        }
                        label={field.label}
                        sx={{ display: 'block', mt: 1, mb: 0 }} // Ajustar layout
                    />
                );
            case 'file':
                 // Necesita su propio handler (handleFileChange)
                return (
                    <FormControl fullWidth margin="dense" required={field.required}>
                         <Typography variant="body2" display="block" sx={{ mb: 0.5, color: 'text.secondary' }}>
                            {field.label}{field.required ? ' *' : ''}
                         </Typography>
                        <Input
                            key={field.name}
                            name={field.name}
                            type="file"
                            required={field.required} // Required aquí puede no funcionar igual en todos los navegadores para file
                            onChange={handleFileChange}
                            disabled={isSubmitting}
                            // accept={field.accept || undefined} // Ejemplo: accept="image/*,.pdf"
                            sx={{
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: theme.shape.borderRadius,
                                p: 1,
                                '&::before, &::after': { display: 'none' },
                             }}
                        />
                         {/* Mostrar nombre del archivo seleccionado */}
                         {fileInputs[field.name] && (
                            <Typography variant="caption" sx={{ mt: 0.5, fontStyle: 'italic', color: 'text.secondary' }}>
                                Archivo: {fileInputs[field.name].name}
                            </Typography>
                         )}
                    </FormControl>
                );

             case 'number':
                 return <TextField {...commonProps} type="number" />;

            case 'text':
            default:
                return <TextField {...commonProps} type="text" />;
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                {formTitle || 'Nueva Solicitud'}
            </DialogTitle>
            {/* Usar etiqueta form para que el submit funcione correctamente */}
            <Box component="form" onSubmit={handleSubmit} noValidate>
                <DialogContent>
                    {/* Mostrar carga de definición */}
                    {loadingDefinition && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>}
                    {/* Mostrar error de definición */}
                    {definitionError && <Alert severity="error" sx={{ mb: 2 }}>{definitionError}</Alert>}
                    {/* Mostrar error de envío */}
                    {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}

                    {/* Renderizar campos solo si no hay carga ni error de definición */}
                    {!loadingDefinition && !definitionError && (
                        <Grid container spacing={1}> {/* Reducir spacing si es necesario */}
                            {formFields.map(field => (
                                <Grid item {...(field.gridProps || { xs: 12 })} key={field.name}>
                                    {renderField(field)}
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions sx={{ borderTop: `1px solid ${theme.palette.divider}`, px: 3, py: 2 }}>
                    <Button onClick={onClose} color="secondary" disabled={isSubmitting}>Cancelar</Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        // Deshabilitar si carga definición, carga envío, o no hay campos (por error de definición)
                        disabled={loadingDefinition || isSubmitting || !formFields.length}
                    >
                        {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Enviar Solicitud'}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};

SolicitudModalForm.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    tipoSeleccionado: PropTypes.shape({
        id_tipo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        nombre_tipo: PropTypes.string.isRequired,
    }),
    onSubmit: PropTypes.func.isRequired,
    isSubmitting: PropTypes.bool, // Estado de carga del envío
    submitError: PropTypes.string, // Mensaje de error del envío
};

export default SolicitudModalForm;