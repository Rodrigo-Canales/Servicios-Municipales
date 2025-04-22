// frontend/src/components/Vecinos/SolicitudModalForm.jsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, TextField,
    CircularProgress, Alert, Box, Select, MenuItem, InputLabel, FormControl,
    Checkbox, FormControlLabel, Typography, useTheme, Input, FormHelperText, 
    RadioGroup, Radio, Link, FormGroup, FormLabel 
} from '@mui/material';
import { normalizeToCamelCase } from '../../utils/stringUtils';
import { mostrarAlertaAdvertencia } from '../../utils/alertUtils';
import LocationInput from '../LocationInput'; 

// --- Helper: Validation Function ---
const validateField = (name, value, fieldDefinition, formData) => {
    const {
        required,
        type,
        minLength,
        maxLength,
        min,
        max,
        pattern,
        validate,
    } = fieldDefinition;

    // 1. Required Check (handles various types)
    if (required) {
        let isEmpty = false;
        switch (type) {
            case 'checkbox':
                isEmpty = !value;
                break;
            case 'multiselect':
                isEmpty = !Array.isArray(value) || value.length === 0;
                break;
            case 'file':
                break;
            case 'location':
                isEmpty = !value || typeof value.lat !== 'number' || typeof value.lng !== 'number';
                break;
            case 'number':
                isEmpty = value === null || value === undefined || value === '';
                break;
            default: 
                isEmpty = value === null || value === undefined || value === '';
                break;
        }
        if (isEmpty && type !== 'file') {
            return fieldDefinition.requiredMessage || 'Este campo es obligatorio.';
        }
    }

    if (value !== null && value !== undefined && value !== '' || required) {
        
        if (value !== null && value !== undefined && value !== '') {
            switch (type) {
                case 'email':
                    { const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) {
                        return fieldDefinition.emailMessage || 'Ingrese un correo electrónico válido.';
                    }
                    break; }
                case 'url':
                    try {
                        
                        if (!pattern && !value.startsWith('http://') && !value.startsWith('https://')) {
                            throw new Error('Missing protocol');
                        }
                        new URL(value); 
                    } catch {
                        
                        if (!pattern) {
                            return fieldDefinition.urlMessage || 'Ingrese una URL válida (ej. https://www.ejemplo.com).';
                        }
                    }
                    break;
                case 'number':
                    { const numValue = parseFloat(value);
                    
                    if (isNaN(numValue) || value === '') { 
                        if (required) return fieldDefinition.numberMessage || 'Ingrese un número válido.';
                    } else {
                        if (min !== undefined && numValue < min) {
                            return fieldDefinition.minMessage || `El valor debe ser mayor o igual a ${min}.`;
                        }
                        if (max !== undefined && numValue > max) {
                            return fieldDefinition.maxMessage || `El valor debe ser menor o igual a ${max}.`;
                        }
                    }
                    break; }
                case 'text':
                case 'textarea':
                    { const stringValue = String(value);
                    if (minLength !== undefined && stringValue.length < minLength) {
                        return fieldDefinition.minLengthMessage || `Debe tener al menos ${minLength} caracteres.`;
                    }
                    if (maxLength !== undefined && stringValue.length > maxLength) {
                        return fieldDefinition.maxLengthMessage || `No debe exceder los ${maxLength} caracteres.`;
                    }
                    break; }
            }
        } else if (required && type !== 'checkbox' && type !== 'file' && type !== 'location' && type !== 'multiselect') {
            return fieldDefinition.requiredMessage || 'Este campo es obligatorio.';
        }



        if (pattern) {
            try {
                const regex = new RegExp(pattern);
                if (!regex.test(String(value ?? ''))) { 
                    return fieldDefinition.patternMessage || 'El formato no es válido.';
                }
            } catch (e) {
                console.error(`Invalid regex pattern for field ${name}: ${pattern}`, e);
                return 'Error interno: patrón de validación inválido.'
            }
        }
    }


    if (typeof validate === 'function') {
        const customError = validate(value, formData);
        if (typeof customError === 'string' && customError.length > 0) {
            return customError;
        }
    }



    return null;
};


const isFieldVisible = (field, currentFormData) => {
    if (!field.visibleWhen) {
        return true;
    }

    const { field: triggerFieldName, is: expectedValue } = field.visibleWhen;

    // Check if the trigger field exists in the form data
    if (currentFormData === undefined || !(triggerFieldName in currentFormData)) {
        console.warn(`[isFieldVisible] Trigger field "${triggerFieldName}" not found in formData for field "${field.name}". Assuming not visible.`);
        return false; // Or handle as needed, maybe return true if default should be visible?
    }

    const actualValue = currentFormData[triggerFieldName];

    // --- Condition Logic ---

    // 1. Simple Equality (most common case: field === 'value')
    if (typeof expectedValue === 'string' || typeof expectedValue === 'number' || typeof expectedValue === 'boolean') {
        // Use String() comparison for flexibility between types like 'true'/'false' vs boolean true/false
        return String(actualValue) === String(expectedValue);
    }

    // 2. Check against multiple values (e.g., field === 'value1' OR field === 'value2')
    // Example in definition: visibleWhen: { field: 'status', is: ['pending', 'processing'] }
    if (Array.isArray(expectedValue)) {
        return expectedValue.map(String).includes(String(actualValue));
    }

    // 3. Check for non-empty / truthy value
    // Example in definition: visibleWhen: { field: 'detailsRequired', is: 'truthy' }
    if (expectedValue === 'truthy') {
        return !!actualValue; // Checks if value is not '', 0, false, null, undefined, NaN
    }

    // 4. Check for empty / falsy value
    // Example in definition: visibleWhen: { field: 'showAdvanced', is: 'falsy' }
    if (expectedValue === 'falsy') {
        return !actualValue; // Checks if value IS '', 0, false, null, undefined, NaN
    }

    // 5. Check if value is NOT a specific value
    // Example in definition: visibleWhen: { field: 'role', isNot: 'guest' }
    if (typeof expectedValue === 'object' && expectedValue !== null && 'isNot' in expectedValue) {
        if (Array.isArray(expectedValue.isNot)) {
            return !expectedValue.isNot.map(String).includes(String(actualValue));
        }
        return String(actualValue) !== String(expectedValue.isNot);
    }

    // 6. Check based on pattern (regex)
    // Example in definition: visibleWhen: { field: 'zipCode', pattern: '^\\d{5}$' }
    if (typeof expectedValue === 'object' && expectedValue !== null && 'pattern' in expectedValue) {
        try {
            const regex = new RegExp(expectedValue.pattern);
            return regex.test(String(actualValue ?? ''));
        } catch (e) {
            console.error(`[isFieldVisible] Invalid regex pattern for field "${field.name}":`, expectedValue.pattern, e);
            return false; // Treat as not visible on error
        }
    }

    // --- Add more complex conditions as needed ---
    // Example: Check if a value in an array/multiselect includes a specific item
    // Example: Custom function check: visibleWhen: { field: '...', check: (val, data) => boolean }

    console.warn(`[isFieldVisible] Unhandled condition type for field "${field.name}":`, expectedValue);
    return true; // Default to visible if condition is complex/unhandled? Or false? Choose behavior.
};




const SolicitudModalForm = ({
    open,
    onClose,
    tipoSeleccionado,
    onSubmit,
    isSubmitting,
}) => {
    const theme = useTheme(); // <-- Make sure theme is available
    const [formTitle, setFormTitle] = useState('Nueva Solicitud');
    const [formFields, setFormFields] = useState([]);
    const [formData, setFormData] = useState({});
    const [loadingDefinition, setLoadingDefinition] = useState(false);
    const [definitionError, setDefinitionError] = useState(null);
    const [fileInputs, setFileInputs] = useState({});
    const [currentStep, setCurrentStep] = useState(0);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // --- Other hooks and functions (useMemo, getFieldsForStep, useEffect, etc.) ---
    // (Keep these as they were in your provided code)
    const totalSteps = useMemo(() => {
        if (!formFields || formFields.length === 0) return 0;
        const steps = formFields.map(field => field.step || 1);
        return Math.max(0, ...steps);
    }, [formFields]);

    const getFieldsForStep = useCallback((stepIndex) => {
        return formFields.filter(field => (field.step || 1) === stepIndex + 1);
    }, [formFields]);

    const currentStepFields = useMemo(() => {
        // Get all fields defined for the step
        const allStepFields = getFieldsForStep(currentStep);
        // Filter them based on the visibility condition and current formData
        // We need formData here to check conditions
        return allStepFields.filter(field => isFieldVisible(field, formData));
    }, [currentStep, getFieldsForStep, formData]); // <-- Add formData dependency


    // --- Form Definition Loading (useEffect) ---
    // --- Form Definition Loading (useEffect - COMPLETO Y CORREGIDO) ---
    useEffect(() => {
        if (open) {
            const loadFormDefinition = async () => {
                setLoadingDefinition(true);
                setDefinitionError(null); // Limpia error previo al iniciar carga
                setFormFields([]);
                setFormData({});
                setFileInputs({});
                setErrors({});
                setTouched({});
                setCurrentStep(0);

                let loadedFields = [];
                let loadedTitle = 'Nueva Solicitud';
                // Determina el nombre del formulario a cargar
                const formName = tipoSeleccionado?.nombre_tipo
                    ? normalizeToCamelCase(tipoSeleccionado.nombre_tipo)
                    : 'default';

                try { // <--- INICIO DEL TRY PRINCIPAL
                    // Intenta importar dinámicamente el archivo específico
                    const module = await import(
                        /* @vite-ignore */ // Añade esto si usas Vite y tienes problemas con rutas dinámicas
                        `../formDefinitions/${formName}.js`
                    );
                    loadedFields = module?.fields || [];
                    loadedTitle = module?.title || (tipoSeleccionado?.nombre_tipo ? `Solicitud: ${tipoSeleccionado.nombre_tipo}` : 'Nueva Solicitud General');

                    // Valida que los campos sean un array
                    if (!Array.isArray(loadedFields)) {
                        throw new Error(`Definition file "${formName}.js" does not export a valid 'fields' array.`);
                    }

                // --- FIN DEL TRY PRINCIPAL ---
                } catch (error) { // <--- INICIO DEL BLOQUE CATCH (CORRECTAMENTE COLOCADO)
                    // Loguea el error completo para mejor depuración
                    console.error(`[Modal] Error loading definition "${formName}.js":`, error);

                    // Si el archivo que falló NO era 'default.js', SIEMPRE intenta el fallback
                    if (formName !== 'default') {
                        console.warn(`[Modal] Import failed for "${formName}.js". Attempting fallback to default.js...`);
                        try { // <-- Inicio del try interno para el fallback
                            // Intenta cargar el módulo por defecto
                            const defaultModule = await import('../formDefinitions/default.js');
                            loadedFields = defaultModule?.fields || [];
                            loadedTitle = defaultModule?.title || "Nueva Solicitud General (Default)";

                            // Verifica que el fallback cargó correctamente los campos
                            if (!Array.isArray(loadedFields)) {
                                throw new Error('Default definition file "default.js" does not export a valid \'fields\' array.');
                            }
                             // IMPORTANTE: Limpia el error si el fallback funcionó para que no se muestre en UI
                            setDefinitionError(null);

                        } catch (defaultError) { // <-- Inicio del catch interno para el fallback
                            // Si incluso el fallback falla
                            console.error(`[Modal] Fallback to default.js also failed. Error:`, defaultError);
                            // Muestra un error que indica que ni el específico ni el default funcionaron
                            setDefinitionError(`Error: No se pudo cargar definición (${formName}.js ni default.js). ${defaultError.message}`);
                            loadedFields = []; // Asegura que los campos queden vacíos
                        } // <-- Fin del catch interno para el fallback
                    } else {
                        // Si el error ocurrió intentando cargar 'default.js' directamente (el fallback en sí mismo falló)
                        console.error(`[Modal] Error loading the default definition "default.js".`);
                        setDefinitionError(`Error fatal: No se pudo cargar la definición por defecto. ${error.message}`);
                        loadedFields = []; // Asegura que los campos queden vacíos
                    }
                // --- FIN DEL BLOQUE CATCH PRINCIPAL ---
                } finally { // <--- INICIO DEL BLOQUE FINALLY (siempre se ejecuta)
                    setFormFields(loadedFields);
                    setFormTitle(loadedTitle);

                    // Initialize formData, errors, touched
                    const initialData = {};
                    const initialErrors = {};
                    const initialTouched = {}; // Initialize touched state
                    loadedFields.forEach(field => {
                         // Determine default value based on type
                        let defaultValue;
                        switch (field.type) {
                            case 'checkbox': defaultValue = field.defaultValue ?? false; break;
                            case 'multiselect': defaultValue = field.defaultValue ?? []; break;
                            case 'number': defaultValue = field.defaultValue ?? ''; break; // Use '' for number to avoid issues with controlled TextField
                            case 'location': defaultValue = field.defaultValue ?? null; break;
                            // Add defaults for other types if needed (e.g., date?)
                            default: defaultValue = field.defaultValue ?? ''; break; // Default to empty string for text-based inputs
                        }
                        initialData[field.name] = defaultValue;
                        initialErrors[field.name] = null; // Start with no errors
                        initialTouched[field.name] = false; // Start as not touched
                    });
                    setFormData(initialData);
                    setErrors(initialErrors);
                    setTouched(initialTouched); // Set initial touched state

                    setLoadingDefinition(false);
                // --- FIN DEL BLOQUE FINALLY ---
                }
            }; // Fin de loadFormDefinition

            loadFormDefinition(); // Llama a la función async
        }
         // No explicit cleanup needed on close if reset on open is robust
    }, [open, tipoSeleccionado]); // Dependencias del useEffect

    // --- Input Change Handler ---
    const handleInputChange = useCallback((eventOrValue, fieldName, fieldType) => {
        let name, value, type, checked;
        const target = eventOrValue?.target;

        if (target) { // Standard HTML event
            name = target.name;
            value = target.value;
            type = target.type || fieldType; // Use fieldType as fallback
            checked = target.checked;
            // --- Validación y normalización especial para campos RUT ---
            if (name.startsWith('rut_')) {
                // Bloquear puntos al escribir
                if (target && target.value && target.value.includes('.')) {
                    target.value = target.value.replace(/\./g, '');
                    value = target.value;
                    target.setCustomValidity('El RUT no debe contener puntos.');
                } else {
                    target.setCustomValidity('');
                }
                // Bloquear el ingreso directo de punto
                if (target && target.nativeEvent && target.nativeEvent.inputType === 'insertText' && target.nativeEvent.data === '.') {
                    target.preventDefault && target.preventDefault();
                    return;
                }
                // Convertir k a mayúscula automáticamente
                if (value.match(/k$/)) {
                    value = value.replace(/k$/, 'K');
                    target.value = value;
                }
            }
        } else { // Direct value
            if (!fieldName || !fieldType) {
                console.error("[Modal] handleInputChange: Missing fieldName or fieldType for direct value.", { value: eventOrValue });
                return;
            }
            name = fieldName;
            value = eventOrValue;
            type = fieldType;
            checked = null; // Not applicable
        }

        const newValue = type === 'checkbox' ? checked : value;
        let processedValue = newValue;

         // Special handling for number type to store as number if valid, or keep string otherwise
        if (type === 'number') {
            const num = parseFloat(value);
             // Store the raw string if it's empty, '-', '+', or ends in '.', otherwise store the number
            if (value === '' || value === '-' || value === '+') {
                 processedValue = value; // Keep the intermediate string state
            } else if (!isNaN(num)) {
                 processedValue = num; // Store the actual number
            } else {
                 processedValue = value; // Keep invalid string (validation will catch it)
            }
        }


        // Update form data
        const newFormData = { ...formData, [name]: processedValue };
        setFormData(newFormData); // Update state first

        // Validate the field using the *new* data state
        const fieldDefinition = formFields.find(f => f.name === name);
        if (fieldDefinition) {
            if (isFieldVisible(fieldDefinition, newFormData)) {
                // Field is visible, validate it
                const errorMessage = validateField(name, processedValue, fieldDefinition, newFormData);
                setErrors(prevErrors => ({ ...prevErrors, [name]: errorMessage }));
            } else {
                // Field is NOT visible (or just became hidden), clear its error
                setErrors(prevErrors => ({ ...prevErrors, [name]: null }));
                // Optional: You might also want to clear the data for hidden fields
                // setFormData(prevData => ({ ...prevData, [name]: /* default value or null */ }));
                // Be careful with clearing data, it might be needed if the field becomes visible again.
            }
        }

        // Mark field as touched (can happen before or after validation)
         if (!touched[name]) { // Only set touched once on the first change/interaction
            setTouched(prevTouched => ({
                ...prevTouched,
                [name]: true,
            }));
        }

    }, [formFields, formData, touched]); // Added formData and touched


    // --- Blur Handler (to trigger touch and validation) ---
    const handleBlur = useCallback((fieldName) => {
         // Mark as touched
        setTouched(prevTouched => ({
            ...prevTouched,
            [fieldName]: true,
        }));

        // Re-validate on blur to catch cases where initial state was valid but becomes invalid
        // (e.g., required field left empty after interaction)
        const fieldDefinition = formFields.find(f => f.name === fieldName);
        if (fieldDefinition) {
            const currentValue = formData[fieldName];
            const errorMessage = validateField(fieldName, currentValue, fieldDefinition, formData);
            // Update errors only if the validation result changes
            if (errors[fieldName] !== errorMessage) {
                setErrors(prevErrors => ({
                    ...prevErrors,
                    [fieldName]: errorMessage,
                }));
            }
        }
    }, [formFields, formData, errors]); // Dependencies


    // --- Location Change Handler ---
    const handleLocationChange = useCallback((fieldName, locationValue) => {
        const fieldDefinition = formFields.find(f => f.name === fieldName);
        const newFormData = { ...formData, [fieldName]: locationValue };
        setFormData(newFormData);

        if (fieldDefinition) {
            if (isFieldVisible(fieldDefinition, newFormData)) {
                const errorMessage = validateField(fieldName, locationValue, fieldDefinition, newFormData);
                setErrors(prevErrors => ({ ...prevErrors, [fieldName]: errorMessage }));
            } else {
                 // Clear error if it becomes hidden (unlikely for location but consistent)
                setErrors(prevErrors => ({ ...prevErrors, [fieldName]: null }));
            }
        }
        setTouched(prevTouched => ({ ...prevTouched, [fieldName]: true }));
    }, [formFields, formData]);


    // --- File Change Handler ---
    const handleFileChange = useCallback((event, field) => {
        const { name, files } = event.target;
        const inputElement = event.target; // Keep reference to reset if needed

        const maxSizeMB = field?.maxSizeMB || 10; // Default 10MB
        const maxSizeInBytes = maxSizeMB * 1024 * 1024;
        const acceptedTypesString = field?.accept || '';
        const acceptedTypesArray = acceptedTypesString
            .split(',')
            .map(type => type.trim().toLowerCase())
            .filter(Boolean);

        let fileError = null;

        // --- Reset state for this field first ---
         // Remove the file from fileInputs
        setFileInputs(prevFiles => {
            const updatedFiles = { ...prevFiles };
            delete updatedFiles[name];
            return updatedFiles;
        });
         // Clear any existing validation error for this file field
        setErrors(prevErrors => ({
            ...prevErrors,
            [name]: null
        }));
         // Mark as touched when the input is interacted with
        setTouched(prevTouched => ({ ...prevTouched, [name]: true }));
         // ---------------------------------------


        if (files && files.length > 0) {
            const file = files[0];
            // Basic file info
            const fileExtension = `.${file.name.split('.').pop()?.toLowerCase() || ''}`;
            const fileMimeType = file.type?.toLowerCase() || '';


            // 1. Type Validation
            if (acceptedTypesArray.length > 0) {
                const isTypeAccepted = acceptedTypesArray.some(acceptedType => {
                     // Check exact MIME type (e.g., 'image/jpeg')
                    if (acceptedType.includes('/')) return fileMimeType === acceptedType;
                     // Check base MIME type (e.g., 'image/*')
                    if (acceptedType.endsWith('/*')) return fileMimeType.startsWith(acceptedType.slice(0, -1));
                     // Check extension (e.g., '.pdf')
                    if (acceptedType.startsWith('.')) return fileExtension === acceptedType;
                    return false; // Should not happen with well-formed 'accept' string
                });
                if (!isTypeAccepted) {
                    let expectedTypes = acceptedTypesArray.map(t => t.startsWith('.') ? t.toUpperCase().substring(1) : t).join(', ');
                    fileError = `Tipo inválido (${fileMimeType || fileExtension}). Permitidos: ${expectedTypes}.`;
                    console.warn(`[Modal] File type validation failed for ${name}. Expected: ${acceptedTypesString}, Got: ${fileMimeType}`);
                }
            }

            // 2. Size Validation (only if type is okay)
            if (!fileError && file.size > maxSizeInBytes) {
                fileError = `Archivo muy grande (${(file.size / 1024 / 1024).toFixed(2)} MB). Máximo permitido: ${maxSizeMB} MB.`;
                console.warn(`[Modal] File size validation failed for ${name}. Max: ${maxSizeInBytes}, Got: ${file.size}`);
            }

            // 3. Update state based on validation result
            if (fileError) {
                console.warn(`[Modal] File validation failed for ${name}: ${fileError}`);
                setErrors(prevErrors => ({ ...prevErrors, [name]: fileError }));
                // Clear the file input visually for the user
                if (inputElement) {
                    inputElement.value = null; // Reset file input element
                }
            } else {
                setFileInputs(prevFiles => ({ ...prevFiles, [name]: file }));
                // Ensure error is cleared if previously set
                setErrors(prevErrors => ({ ...prevErrors, [name]: null }));
            }
        } else {
            // Re-validate if the field is required, now that it's empty
            const fieldDefinition = formFields.find(f => f.name === name);
            if (fieldDefinition?.required && isFieldVisible(fieldDefinition, formData)) {
                // Use requiredMessage directly for simplicity or call validateField
                const reqError = fieldDefinition.requiredMessage || 'Este campo es obligatorio.';
                setErrors(prevErrors => ({ ...prevErrors, [name]: reqError }));
            } else {
                // Clear error if not required OR not visible
                setErrors(prevErrors => ({ ...prevErrors, [name]: null }));
            }
        }

    }, [formFields, formData]); // Added formFields, formData


    // --- Step Validation Logic ---
    const validateStep = useCallback((stepIndex) => {
        const fieldsToValidate = getFieldsForStep(stepIndex);
        let isStepValid = true;
        const stepErrors = {}; // Collect errors for this step validation pass
        const touchedUpdates = {}; // Collect touched updates

        fieldsToValidate.forEach(field => {
            // 1. Check visibility FIRST
            if (!isFieldVisible(field, formData)) {
                // If field is NOT visible:
                stepErrors[field.name] = null; // Ensure it has no validation error blocking the step
                // Optional: Decide if you want to mark hidden fields as untouched
                // delete touchedUpdates[field.name]; // Or set to false if needed
                return; // <-- Skip validation for this hidden field
            }
    
            // 2. If VISIBLE, proceed with marking touched and validating
            touchedUpdates[field.name] = true; // Mark visible fields as touched when validating step
    
            let fieldError = null;
            if (field.type === 'file') {
                // Check existing file errors (size/type)
                fieldError = errors[field.name] || null;
                // Check required (only if visible and no other error)
                if (!fieldError && field.required && !fileInputs[field.name]) {
                    fieldError = field.requiredMessage || 'Este campo es obligatorio.';
                }
            } else {
                // Validate non-file fields using the standard validator
                const currentValue = formData[field.name];
                fieldError = validateField(field.name, currentValue, field, formData);
            }
    
            // 3. Handle validation result for the visible field
            if (fieldError) {
                console.warn(`[Validation] Step ${stepIndex + 1} invalid. VISIBLE Field: ${field.name}, Error: ${fieldError}`);
                stepErrors[field.name] = fieldError;
                isStepValid = false;
            } else {
                // Clear any stale error if the visible field is now valid
                stepErrors[field.name] = null;
            }
        });

        // Batch update touched state
        setTouched(prevTouched => ({ ...prevTouched, ...touchedUpdates }));

        // Batch update errors state based on this step's validation
         // This avoids potential race conditions or partial updates
        setErrors(prevErrors => ({ ...prevErrors, ...stepErrors }));

        return isStepValid;
    }, [getFieldsForStep, formData, fileInputs, errors]); // Added errors dependency


    // --- Navigation Handlers (handleNext, handleBack) ---
    // (Keep these as they were)
    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => prev + 1);
             window.scrollTo(0, 0); // Scroll to top on step change
        } else {
            mostrarAlertaAdvertencia(
                'Campos Incompletos o Inválidos',
                'Por favor, revise los campos marcados en rojo en este paso.'
            );
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => prev - 1);
         window.scrollTo(0, 0); // Scroll to top on step change
    };

    // --- Submit Handler ---
    // (Keep your existing handleSubmit logic, ensuring it uses the final validateStep check)
    const handleSubmit = useCallback(async (event) => { // Consider adding useCallback
        event.preventDefault();

        // Validate the FINAL step before submitting
        // validateStep now correctly handles hidden fields
        if (!validateStep(currentStep)) {
            mostrarAlertaAdvertencia(
                'Campos Incompletos o Inválidos',
                'No se puede enviar. Por favor, revise los campos marcados en rojo.'
            );
            return;
        }

        if (isSubmitting || loadingDefinition || definitionError) {
            console.warn("[Modal] Submission blocked (already submitting, loading, or definition error).");
            return;
        }

        const submissionData = new FormData();

        // --- MODIFIED SECTION START ---
        // Iterate through all defined fields to check visibility before appending

        // 1. Append standard (non-file) form data ONLY IF VISIBLE
        formFields.forEach(field => {
            // Check if the field should be visible based on current form data
            if (isFieldVisible(field, formData)) {
                const key = field.name;
                const value = formData[key];

                // Skip file type fields here, handle them next
                if (field.type === 'file') return;

                // Append the value using the appropriate logic based on type
                if (Array.isArray(value)) {
                    // Send arrays as a JSON string (backend needs to parse)
                    submissionData.append(key, JSON.stringify(value));
                } else if (typeof value === 'object' && value !== null && value.lat !== undefined && value.lng !== undefined) {
                    // Send location objects as a JSON string
                    submissionData.append(key, JSON.stringify(value));
                } else if (value !== null && value !== undefined && value !== '') {
                    // Append regular values (string, number if stored as number, boolean)
                    // Avoid sending empty strings unless specifically intended (or handled differently)
                    submissionData.append(key, value);
                } else if (value === 0) {
                    // Explicitly allow sending the number 0
                    submissionData.append(key, value);
                }
                // Add 'else if' conditions here if you have other specific data types to handle
            }
            // If the field is not visible, its data (formData[key]) is simply ignored
        });

        // 2. Append file data ONLY IF VISIBLE
        formFields.forEach(field => {
            // Check if it's a file field AND it should be visible
            if (field.type === 'file' && isFieldVisible(field, formData)) {
                const key = field.name;
                const file = fileInputs[key]; // Get the file from the file state

                // Check if a file actually exists in the state for this key
                if (file instanceof File) {
                    submissionData.append(key, file, file.name);
                }
                // If the file field is visible but no file is selected (and it's not required), nothing is appended.
                // If it was required, validateStep should have already caught it.
            }
            // If the file field is not visible, its corresponding file (if any) is ignored
        });
        // Normalizar RUT antes de enviar
        if (formData.rut_ciudadano) {
            submissionData.set('rut_ciudadano', formData.rut_ciudadano);
        }
        // --- MODIFIED SECTION END ---


        // Append solicitud type ID (This logic remains the same)
        if (tipoSeleccionado?.id_tipo) {
            submissionData.append('id_tipo', tipoSeleccionado.id_tipo);
        } else {
            console.warn("[Modal] No 'id_tipo' available to send.");
        }

        // Use await if onSubmit is async, otherwise remove async/await
        // await onSubmit(submissionData); // Example if onSubmit returns a promise
        onSubmit(submissionData); // Pass the FormData object

    // Add dependencies needed by the function defined inside useCallback
    }, [
        currentStep, // Used in validateStep check
        validateStep, // Function dependency
        isSubmitting, // State dependency
        loadingDefinition, // State dependency
        definitionError, // State dependency
        formFields, // State dependency (used for iteration)
        formData, // State dependency (used for visibility check & values)
        fileInputs, // State dependency (used for file values)
        tipoSeleccionado, // Prop dependency
        onSubmit, // Prop dependency
        // isFieldVisible is defined outside, stable, doesn't strictly need to be dependency
        // mostrarAlertaAdvertencia is likely stable too
    ]);

    // --- Dialog Close Handler ---
    // (Keep as is)
    const handleDialogClose = (event, reason) => {
        if (reason && reason === 'backdropClick' && (isSubmitting || loadingDefinition)) {
             // Prevent closing on backdrop click ONLY while submitting/loading
            return;
        }
         // Reset step, clear errors/touched, call onClose provided by parent
        setCurrentStep(0);
        setErrors({});
        setTouched({});
         onClose(); // Call the parent's close handler
    };


// Aplica color blanco a todos los textos y labels en modo oscuro
const darkModalTextSx = theme => theme.palette.mode === 'dark' ? {
  color: '#fff',
  '& .MuiInputBase-root, & .MuiInputBase-input, & .MuiInputLabel-root, & .MuiFormLabel-root, & .MuiTypography-root, & .MuiSelect-root, & .MuiOutlinedInput-notchedOutline, & .MuiFormHelperText-root': {
    color: '#fff',
    borderColor: '#fff',
  },
  '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': {
    borderColor: '#fff',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#fff',
  },
  '& .MuiSelect-icon': {
    color: '#fff',
  },
  '& .MuiCheckbox-root, & .MuiRadio-root': {
    color: '#fff',
  },
} : {};

    // --- Field Rendering Logic (MAJOR CHANGES HERE) ---
    const renderField = (field) => {
        if (!field || !field.name || !field.type) {
            console.error("[Modal] Invalid field definition:", field);
            return <Alert severity="error" sx={{ my: 1 }}>Error de configuración: Campo mal definido.</Alert>;
        }

        const fieldName = field.name;
        const currentValue = formData[fieldName];
        const fieldError = errors[fieldName]; // Error message string or null
        const isTouchedField = touched[fieldName]; // Boolean: true if interacted with

        // Determine visual states
        const showError = isTouchedField && !!fieldError; // Show red if touched and has error
        // Show green if touched, no error, and optionally has a value (or is a checkbox/file input)
        // Adjust the condition for isSuccess if you only want green on non-empty valid fields
        const hasValue = !(currentValue === '' || currentValue === null || currentValue === undefined || (Array.isArray(currentValue) && currentValue.length === 0));
        const isFileSelected = field.type === 'file' && !!fileInputs[fieldName];
        const isCheckbox = field.type === 'checkbox'; // Checkboxes can be "valid" even if false (if not required)

        // Show success if touched, no error, and either it has a value, is a selected file, or is a checkbox
        // (We show success for touched valid fields even if empty, unless they are required and empty which would be an error state)
        const isSuccess = isTouchedField && !fieldError && (hasValue || isFileSelected || isCheckbox);
        
        // Common props for FormControl wrapper
        const formControlProps = {
            key: fieldName,
            fullWidth: true,
            margin: "dense",
            disabled: isSubmitting || loadingDefinition,
            error: showError, // MUI handles error state based on this
            required: field.required,
        };

        // Common props for the actual input element
        const inputProps = {
            name: fieldName,
            label: field.label || fieldName, // Label text
            value: currentValue ?? '', // Ensure value is controlled (not undefined/null)
            onChange: (e) => handleInputChange(e, fieldName, field.type),
            onBlur: () => handleBlur(fieldName), // Use centralized blur handler
            // 'required' and 'disabled' are usually handled by FormControl/wrapper
        };

        // --- Success Styling ---
        // Define common success styles to apply via sx prop
        const successSx = {
             // Target the outlined input border
            '& .MuiOutlinedInput-root': {
                '& fieldset': {
                     borderColor: theme.palette.success.main, // Green border
                },
                '&:hover fieldset': {
                      borderColor: theme.palette.success.dark, // Optional: Darker green on hover
                },
                '&.Mui-focused fieldset': {
                      borderColor: theme.palette.success.main, // Keep green when focused
                },
            },
             // Target the input label
            '& .MuiInputLabel-root': {
                  // Apply green color only when label is floated (not placeholder) or focused
                  '&:not(.Mui-focused)': { // When not focused
                    color: showError ? theme.palette.error.main : isSuccess ? theme.palette.success.main : undefined, // Green label if success, Red if error
                },
                 '&.Mui-focused': { // Keep green when focused
                    color: theme.palette.success.main,
                },
            },
              // Specific override for Select label color when success
            '& .MuiInputLabel-root.Mui-focused': {
                color: isSuccess ? theme.palette.success.main : undefined, // Explicitly keep label green on focus if success
            },
            '& .MuiFormLabel-root.Mui-focused': { // Handles RadioGroup/CheckboxGroup label
                color: isSuccess ? theme.palette.success.main : undefined,
            },
        };

        // --- Render based on type ---
        switch (field.type) {
            case 'text':
            case 'email':
            case 'password':
            case 'url':
            case 'tel':
                return (
                    <FormControl {...formControlProps} sx={isSuccess ? successSx : {}} > {/* Apply success styles conditionally */}
                        <TextField
                            {...inputProps} // Spread common input props
                            id={fieldName}
                            type={field.type}
                            placeholder={field.placeholder || ''}
                            variant="outlined"
                            size="small"
                            helperText={showError ? fieldError : (field.helperText || '')}
                            // 'error' prop is implicitly handled by FormControl based on formControlProps.error
                            // 'required' visually indicated by FormControl, but good to have on input too for semantics
                            required={field.required}
                            // Success styling applied via sx on FormControl
                        />
                    </FormControl>
                );

            case 'number':
                return (
                    <FormControl {...formControlProps} sx={isSuccess ? successSx : {}}>
                        <TextField
                            {...inputProps}
                            id={fieldName}
                            type="number"
                             // Use formData directly for number, handleInputChange stores number or intermediate string
                            value={formData[fieldName] ?? ''} // Display value from state
                            placeholder={field.placeholder || ''}
                            variant="outlined"
                            size="small"
                            InputProps={field.InputProps || {}} // For adornments etc.
                            inputProps={{ // HTML attributes for the <input> element
                                min: field.min,
                                max: field.max,
                                step: field.stepAttribute || 'any',
                            }}
                            helperText={showError ? fieldError : (field.helperText || '')}
                            required={field.required}
                        />
                    </FormControl>
                );

            case 'textarea':
                return (
                    <FormControl {...formControlProps} sx={isSuccess ? successSx : {}}>
                        <TextField
                            {...inputProps}
                            id={fieldName}
                            multiline
                            rows={field.rows || 3}
                            placeholder={field.placeholder || ''}
                            variant="outlined"
                            size="small"
                            helperText={showError ? fieldError : (field.helperText || '')}
                            required={field.required}
                        />
                    </FormControl>
                );

            case 'checkbox':
                 // Checkbox doesn't have an outline, success/error shown via helper text and label color maybe
                 // Error state is handled by FormControlLabel if needed, helper text shows error message.
                 // Success state could color the label green.
                return (
                    // Use component="fieldset" for accessibility with groups, variant="standard" is fine here
                    <FormControl component="fieldset" variant="standard" {...formControlProps} sx={{ alignItems: 'flex-start' }}>
                         {/* Optional Group Label */}
                         {/* <FormLabel component="legend">Group Label</FormLabel> */}
                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name={fieldName}
                                        id={fieldName}
                                        checked={!!currentValue} // Ensure boolean value
                                        onChange={(e) => handleInputChange(e, fieldName, field.type)}
                                         // No standard onBlur for single checkbox needed for validation trigger
                                        size="small"
                                        required={field.required} // HTML required attribute
                                        disabled={formControlProps.disabled} // Pass disabled state
                                        sx={isSuccess ? { color: 'success.main' } : {}} // Color the checkbox itself green
                                    />
                                }
                                label={inputProps.label} // Display label text
                                // Apply success/error color to the label text itself
                                sx={{
                                    color: showError ? 'error.main' : isSuccess ? 'success.main' : undefined,
                                    // Prevent label color change interfering with disabled state
                                    ...(formControlProps.disabled && { color: 'text.disabled' })
                                }}
                            />
                        </FormGroup>
                        {/* Helper text for showing errors or additional info */}
                        <FormHelperText error={showError} sx={{ ml: 0 }}>
                            {showError ? fieldError : (field.helperText || '')}
                        </FormHelperText>
                    </FormControl>
                );


            case 'select':
                return (
                    <FormControl {...formControlProps} variant="outlined" size="small" sx={isSuccess ? successSx : {}}>
                        <InputLabel id={`${fieldName}-label`}>{inputProps.label}</InputLabel>
                        <Select
                            name={fieldName} // Ensure name is on Select for events
                            labelId={`${fieldName}-label`}
                            id={fieldName}
                            value={currentValue ?? ''} // Controlled value
                            label={inputProps.label} // Needed for outlined variant label positioning
                            onChange={(e) => handleInputChange(e, fieldName, field.type)}
                            onBlur={() => handleBlur(fieldName)} // Trigger touch/validation
                            // disabled automatically handled by FormControl
                        >
                            {/* Placeholder option */}
                            <MenuItem value="" disabled={field.required}>
                                <em>{field.placeholder || (field.required ? 'Seleccione...' : 'Opcional')}</em>
                            </MenuItem>
                             {/* Dynamic options */}
                            {field.options?.map(option => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                        <FormHelperText>{showError ? fieldError : (field.helperText || '')}</FormHelperText>
                    </FormControl>
                );

            case 'multiselect':
                { const multiSelectValue = Array.isArray(currentValue) ? currentValue : [];
                return (
                    <FormControl {...formControlProps} variant="outlined" size="small" sx={isSuccess ? successSx : {}}>
                        <InputLabel id={`${fieldName}-label`}>{inputProps.label}</InputLabel>
                        <Select
                            name={fieldName}
                            labelId={`${fieldName}-label`}
                            id={fieldName}
                            multiple
                            value={multiSelectValue}
                            label={inputProps.label}
                            onChange={(e) => handleInputChange(e, fieldName, field.type)}
                            onBlur={() => handleBlur(fieldName)}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((val) => {
                                        const option = field.options?.find(opt => opt.value === val);
                                        return (
                                            <Typography key={val} variant="caption" sx={{
                                                border: `1px solid ${theme.palette.divider}`,
                                                borderRadius: '4px', p: '2px 6px',
                                                bgcolor: 'action.selected',
                                            }}>
                                                {option ? option.label : val}
                                            </Typography>
                                        );
                                    })}
                                </Box>
                            )}
                            MenuProps={{ PaperProps: { style: { maxHeight: 250 } } }}
                        >
                            {multiSelectValue.length === 0 && !field.required && (
                                <MenuItem value="" disabled style={{ display: 'none' }}>
                                    <em>{field.placeholder || 'Seleccione uno o más...'}</em>
                                </MenuItem>
                            )}
                            {field.options?.map(option => (
                                <MenuItem key={option.value} value={option.value}>
                                    <Checkbox checked={multiSelectValue.includes(option.value)} size="small" />
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                        <FormHelperText>{showError ? fieldError : (field.helperText || '')}</FormHelperText>
                    </FormControl>
                );}

            case 'radio-group':
                 // RadioGroup success/error state managed by FormControl error prop and HelperText.
                 // Success state can color the FormLabel.
                return (
                    <FormControl component="fieldset" {...formControlProps} sx={isSuccess ? successSx : {}}>
                         {/* Group label (legend) */}
                        <FormLabel
                            component="legend"
                            sx={{
                                mb: 0.5,
                                 fontSize: '0.875rem', // Match TextField label size
                                 color: showError ? 'error.main' : isSuccess ? 'success.main' : 'text.secondary' // Apply colors
                            }}
                             // focused={/* Can check focus state if needed */}
                        >
                             {inputProps.label}{field.required ? ' *' : ''}
                        </FormLabel>
                        <RadioGroup
                            row={field.row || false} // Allow horizontal layout
                            aria-label={inputProps.label}
                            name={fieldName}
                            value={currentValue ?? ''}
                            onChange={(e) => handleInputChange(e, fieldName, field.type)}
                            onBlur={() => handleBlur(fieldName)} // Blur on group might work depending on focus target
                        >
                            {field.options?.map(option => (
                                <FormControlLabel
                                    key={option.value}
                                    value={option.value}
                                    control={<Radio size="small" sx={isSuccess ? { color: 'success.main'} : {}} />} // Color radio button if success
                                    label={option.label}
                                    disabled={formControlProps.disabled} // Disable individual options
                                />
                            ))}
                        </RadioGroup>
                        <FormHelperText>{showError ? fieldError : (field.helperText || '')}</FormHelperText>
                    </FormControl>
                );

            case 'date':
            case 'datetime-local':
            case 'time':
                return (
                    <FormControl {...formControlProps} sx={isSuccess ? successSx : {}}>
                        <TextField
                            {...inputProps}
                            id={fieldName}
                            type={field.type}
                            value={currentValue ?? ''} // Handles date/time string formats
                            InputLabelProps={{ shrink: true }} // Ensure label is always floated
                            variant="outlined"
                            size="small"
                            helperText={showError ? fieldError : (field.helperText || '')}
                            required={field.required}
                        />
                    </FormControl>
                );

            case 'file': {
                // File input needs custom styling for success/error states on its wrapper/label
                const fileFieldError = errors[fieldName]; // Specific file errors (size, type, required)
                const showFileError = touched[fieldName] && !!fileFieldError;
                const isFileSuccess = touched[fieldName] && !fileFieldError && !!fileInputs[fieldName]; // Success only if a file is selected and valid
                const currentFile = fileInputs[fieldName];

                return (
                    // Use FormControl for layout, state, and text
                    <FormControl fullWidth margin="dense" required={field.required} disabled={isSubmitting || loadingDefinition} error={showFileError}>
                         {/* Label for the file input */}
                        <FormLabel
                            sx={{
                                mb: 0.5,
                                fontSize: '0.875rem',
                                color: showFileError ? 'error.main' : isFileSuccess ? 'success.main' : 'text.secondary' // Conditional label color
                            }}
                        >
                            {field.label || fieldName}{field.required ? ' *' : ''}
                        </FormLabel>
                        {/* Basic Input type="file" with custom border */}
                        <Input
                            key={`${fieldName}-input`} // Add key suffix to ensure reset on error
                            name={fieldName}
                            id={fieldName}
                            type="file"
                            onChange={(e) => handleFileChange(e, field)}
                            onBlur={() => handleBlur(fieldName)} // Mark touched on blur
                            inputProps={{ // Attributes for the hidden <input type="file">
                                accept: field.accept || undefined, // Allowed file types
                                // multiple: field.multiple || false, // Handle multiple if needed
                            }}
                             // Style the visible wrapper of the Input component
                            sx={{
                                border: `1px solid ${showFileError ? theme.palette.error.main : isFileSuccess ? theme.palette.success.main : theme.palette.divider}`,
                                borderRadius: theme.shape.borderRadius,
                                p: 1,
                                '&::before, &::after': { display: 'none' }, // Hide default underline
                                color: 'text.primary', // Ensure text inside is readable
                                 // Add hover styles if desired
                                    '&:hover': {
                                        borderColor: showFileError ? theme.palette.error.dark : isFileSuccess ? theme.palette.success.dark : theme.palette.action.hover,
                                    },
                            }}
                            aria-describedby={`${fieldName}-helper-text`}
                             // Value is uncontrolled for native file input
                        />
                         {/* Helper text: Show error, selected file name, or default helper */}
                        <FormHelperText id={`${fieldName}-helper-text`} error={showFileError}>
                            {showFileError
                                 ? fileFieldError // Display specific validation error
                                : currentFile
                                     ? `Archivo seleccionado: ${currentFile.name}` // Show file name on success
                                     : (field.helperText || '') // Show field's helper text
                            }
                        </FormHelperText>
                    </FormControl>
                );
            }

            case 'location':
                 // LocationInput is custom. Pass success/error state down as props.
                 // LocationInput component needs to be modified internally to use these.
                return (
                    <LocationInput
                        key={fieldName}
                        name={fieldName}
                        label={field.label || fieldName}
                        value={currentValue}
                        onChange={(locationValue) => handleLocationChange(fieldName, locationValue)}
                        onBlur={() => handleBlur(fieldName)} // Allow blur handling if LocationInput doesn't handle it internally
                        disabled={isSubmitting || loadingDefinition}
                        required={field.required}
                        error={showError} // Pass error status
                        success={isSuccess} // Pass success status <--- NEW PROP
                        helperText={showError ? fieldError : (field.helperText || '')}
                        initialCenter={field.initialCenter}
                        initialZoom={field.initialZoom}
                        theme={theme} // Pass theme down if needed for styling
                    />
                    // TODO: Modify LocationInput.jsx to use the 'success' prop for styling (e.g., green border)
                );

            case 'static-text':
                 // No validation styling needed
                return (
                    <Box sx={{
                        my: 1.5, p: 1.5, // Adjusted spacing/padding
                        bgcolor: 'action.hover', // Use theme color for subtle background
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: theme.shape.borderRadius,
                    }}>
                        {field.label &&
                            <Typography variant="overline" display="block" sx={{ mb: 0.5, color: 'text.secondary', lineHeight: 1.2 }}>
                                {field.label}
                            </Typography>
                        }
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{field.text || ''}</Typography>
                        {field.helperText && <FormHelperText sx={{ mt: 0.5 }}>{field.helperText}</FormHelperText>}
                    </Box>
                );

            case 'download-link':
                 // No validation styling needed
                if (!field.href || !field.linkText) {
                    return <Alert severity="warning" sx={{ my: 1 }}>Campo 'download-link' requiere 'href' y 'linkText'.</Alert>;
                }
                return (
                    <Box sx={{ my: 1.5, p: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                        {field.label &&
                            <Typography variant="overline" display="block" sx={{ mb: 0.5, color: 'text.secondary', lineHeight: 1.2 }}>
                                {field.label}
                            </Typography>
                        }
                        <Link
                            href={field.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            color='info.main'
                            download={field.downloadName || true} // Add download attribute
                            variant="body1"
                            sx={{ fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                        >
                            {field.linkText}
                             {/* Optional: <DownloadIcon fontSize="small" /> */}
                        </Link>
                        {field.helperText && <FormHelperText sx={{ mt: 0.5 }}>{field.helperText}</FormHelperText>}
                    </Box>
                );
            default:
                console.warn(`[Modal] Unsupported field type: ${field.type}`);
                return <Alert severity="warning" sx={{ my: 1 }}>Tipo de campo no soportado: {field.type}</Alert>;
        }
    };


    // --- Render Component ---
    return (
        <Dialog
            open={open}
            onClose={handleDialogClose}
            maxWidth="md"
            fullWidth
            scroll="paper"
            disableEscapeKeyDown={isSubmitting || loadingDefinition}
            PaperProps={{
                component: 'form',
                onSubmit: handleSubmit,
                noValidate: true,
                sx: {
                    borderRadius: 4,
                    boxShadow: 8,
                    bgcolor: 'background.paper',
                    border: `2.5px solid ${theme.palette.primary.main}`,
                    position: 'relative',
                    overflow: 'hidden',
                    // Borde superior colorido como Card
                    '&:before': {
                        content: '""',
                        display: 'block',
                        width: '100%',
                        height: 8,
                        bgcolor: 'primary.main',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        zIndex: 2,
                    },
                }
            }}
        >
            <DialogTitle sx={{
                m: 0,
                p: '18px 32px 10px 32px',
                bgcolor: theme.palette.primary.main, // Fondo azul del theme
                color: theme => theme.palette.mode === 'dark' ? '#fff' : theme.palette.primary.contrastText, // Letras blancas en dark
                fontWeight: 700,
                fontSize: '1.08rem', // Más pequeño
                letterSpacing: 0.5,
                borderBottom: `1.5px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textTransform: 'uppercase',
                boxShadow: 'none',
            }}>
                {formTitle || 'Nueva Solicitud'}
                {loadingDefinition && <CircularProgress size={24} color="primary" sx={{ ml: 2 }} />}
            </DialogTitle>

            <DialogContent dividers sx={{
                p: { xs: 2.5, sm: 3, md: 4 },
                bgcolor: 'background.default',
                border: 'none',
                minHeight: 180,
                color: theme => theme.palette.mode === 'dark' ? '#fff' : theme.palette.text.primary,
                ...darkModalTextSx(theme),
            }}>
                {/* Loading / Error States */}
                {loadingDefinition && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                        <CircularProgress />
                        <Typography sx={{ ml: 2 }}>Cargando formulario...</Typography>
                    </Box>
                )}
                {definitionError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {definitionError} {/* Show specific error */}
                    </Alert>
                )}

                {/* No Fields Message */}
                {!loadingDefinition && !definitionError && formFields.length === 0 && (
                    <Alert severity="info">No hay campos definidos para este tipo de solicitud.</Alert>
                )}

                {/* Render Fields */}
                {!loadingDefinition && !definitionError && formFields.length > 0 && (
                <Grid container spacing={2.5}>
                    {/* ENSURE THIS USES currentStepFields */}
                    {currentStepFields.map(field => (
                        <Grid item {...(field.gridProps || { xs: 12 })} key={field.name}>
                            {renderField(field)}
                        </Grid>
                    ))}
                     {/* Optional: Add message if step becomes empty */}
                    {currentStepFields.length === 0 && getFieldsForStep(currentStep).length > 0 && (
                        <Grid item xs={12}>
                            <Alert severity="info" variant="outlined" sx={{mt: 2}}>No hay campos adicionales que mostrar en este paso según sus selecciones anteriores.</Alert>
                        </Grid>
                    )}
                </Grid>
                )}
            </DialogContent>

            {/* Actions Area */}
            {!loadingDefinition && !definitionError && formFields.length > 0 && (
                <DialogActions sx={{
                    px: { xs: 2.5, sm: 3, md: 4 },
                    py: 2,
                    bgcolor: 'background.paper',
                    borderTop: `1.5px solid ${theme.palette.divider}`,
                    boxShadow: 'none',
                    justifyContent: 'space-between',
                    color: theme => theme.palette.mode === 'dark' ? '#fff' : theme.palette.text.primary,
                    ...darkModalTextSx(theme),
                }}>
                    <Box>
                        <Button
                            onClick={handleDialogClose}
                            variant="outlined"
                            color="secondary"
                            sx={{
                                borderRadius: 3,
                                fontWeight: 600,
                                px: 3,
                                py: 1,
                                boxShadow: 1,
                                textTransform: 'none',
                                fontSize: '1rem',
                                transition: 'all 0.2s',
                            }}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {currentStep > 0 && (
                            <Button
                                onClick={handleBack}
                                variant="contained"
                                color="primary"
                                sx={{
                                    borderRadius: 3,
                                    fontWeight: 600,
                                    px: 3,
                                    py: 1,
                                    boxShadow: 2,
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                    transition: 'all 0.2s',
                                }}
                                disabled={isSubmitting}
                            >
                                Anterior
                            </Button>
                        )}
                        {currentStep < totalSteps - 1 && totalSteps > 1 && (
                            <Button
                                onClick={handleNext}
                                variant="contained"
                                color="primary"
                                sx={{
                                    borderRadius: 3,
                                    fontWeight: 600,
                                    px: 3,
                                    py: 1,
                                    boxShadow: 2,
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                    transition: 'all 0.2s',
                                }}
                                disabled={isSubmitting}
                            >
                                Siguiente
                            </Button>
                        )}
                        {currentStep === totalSteps - 1 && totalSteps > 0 && (
                            <Button
                                type="submit"
                                variant="contained"
                                color="success"
                                sx={{
                                    borderRadius: 3,
                                    fontWeight: 700,
                                    px: 3,
                                    py: 1,
                                    minWidth: '150px',
                                    boxShadow: 3,
                                    textTransform: 'none',
                                    fontSize: '1.08rem',
                                    transition: 'all 0.2s',
                                }}
                                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                                disabled={isSubmitting || !formFields.length}
                            >
                                {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
                            </Button>
                        )}
                    </Box>
                </DialogActions>
            )}
        </Dialog>
    );
};

// --- PropTypes and DefaultProps ---
// (Keep these as they were)
SolicitudModalForm.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    tipoSeleccionado: PropTypes.shape({
        id_tipo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        nombre_tipo: PropTypes.string,
    }),
    onSubmit: PropTypes.func.isRequired,
    isSubmitting: PropTypes.bool,
};

SolicitudModalForm.defaultProps = {
    isSubmitting: false,
    tipoSeleccionado: null,
};

export default SolicitudModalForm;