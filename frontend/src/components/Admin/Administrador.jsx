// frontend/src/components/Admin/Administrador.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import api from '../../services/api.js';
import Swal from 'sweetalert2';
import {
    Box, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Button, CircularProgress, Fade,
    Card, CardContent, CssBaseline, ThemeProvider, Drawer, useMediaQuery,
    TextField, InputAdornment, Tooltip, Alert, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel,
    Checkbox, FormControlLabel, Stack,
    TablePagination
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

// Importa componentes y utilidades
import Navbar from "../Navbar";
import SidebarAdmin from "./SidebarAdmin";
import { lightTheme, darkTheme } from "../../theme";
import { mostrarAlertaExito, mostrarAlertaError } from "../../utils/alertUtils";
import { formatRut } from "../../utils/rutUtils";

// --- Constantes ---
const APP_BAR_HEIGHT = 64;
const DRAWER_WIDTH = 240;
const ENTITY_TYPES = {
    SOLICITUD: 'solicitud',
    AREA: 'area',
    TIPO_SOLICITUD: 'tipo_solicitud',
    USUARIO: 'usuario',
    RESPUESTA: 'respuesta',
    PREGUNTA_FRECUENTE: 'pregunta_frecuente'
};
const ROLES_PERMITIDOS = ['Administrador', 'Funcionario', 'Vecino'];
const ESTADOS_SOLICITUD = ['Pendiente', 'Aprobada', 'Rechazada'];
const DEFAULT_ROWS_PER_PAGE = 10;

// --- Componente Principal ---
function Administrador({ toggleTheme }) {
    // --- Estados ---
    const [mode, setMode] = useState("light");
    const [mobileOpen, setMobileOpen] = useState(false);
    const [currentSectionKey, setCurrentSectionKey] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    // Data states
    const [solicitudes, setSolicitudes] = useState([]);
    const [areas, setAreas] = useState([]);
    const [tiposSolicitudesAdmin, setTiposSolicitudesAdmin] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [respuestas, setRespuestas] = useState([]);
    const [preguntasFrecuentes, setPreguntasFrecuentes] = useState([]);
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    // Pagination states
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

    // --- Tema y Media Queries ---
    const currentTheme = useMemo(() => (mode === "light" ? lightTheme : darkTheme), [mode]);
    const isLargeScreen = useMediaQuery(currentTheme.breakpoints.up('md'));
    const isSmallScreen = useMediaQuery(currentTheme.breakpoints.down('sm'));

    // --- Handlers Layout ---
    const handleToggleTheme = useCallback(() => {
        const toggleFunc = typeof toggleTheme === 'function' ? toggleTheme : () => {};
        toggleFunc();
        setMode((prev) => (prev === "light" ? "dark" : "light"));
    }, [toggleTheme]);

    const handleDrawerToggle = useCallback(() => setMobileOpen(prev => !prev), []);
    const handleDrawerClose = useCallback(() => setMobileOpen(false), []);
    const handleSearchChange = useCallback((event) => { setSearchTerm(event.target.value); setPage(0); }, []);

    // --- Mapas para datos relacionados ---
    const areaMap = useMemo(() => new Map(areas.map(a => [a.id_area, a.nombre_area])), [areas]);
    const tipoSolicitudMap = useMemo(() => new Map(tiposSolicitudesAdmin.map(t => [t.id_tipo, t.nombre_tipo])), [tiposSolicitudesAdmin]);
    const contextForRender = useMemo(() => ({ areaMap, tipoSolicitudMap }), [areaMap, tipoSolicitudMap]);

    // --- Fetch Genérico ---
    const fetchGenericData = useCallback(async (endpoint, dataKey) => {
        console.log(`[fetchGenericData] Fetching ${dataKey}...`);
        try {
            const response = await api.get(endpoint);
            let data = response.data;

            // Handle potential wrapping object & specific keys
            if (data && typeof data === 'object' && !Array.isArray(data) && data[dataKey]) {
                 data = data[dataKey];
            } else if (endpoint === '/preguntas_frecuentes' && data && Array.isArray(data.preguntas_frecuentes)) {
                 data = data.preguntas_frecuentes;
            } else if (endpoint === '/tipos_solicitudes' && data && Array.isArray(data.tipos_solicitudes)) {
                 data = data.tipos_solicitudes;
            } else if (endpoint === '/areas' && data && Array.isArray(data.areas)) {
                data = data.areas;
            } else if (endpoint === '/usuarios' && data && Array.isArray(data.usuarios)) {
                data = data.usuarios;
            } else if (endpoint === '/solicitudes' && data && Array.isArray(data.solicitudes)) {
                 data = data.solicitudes;
            } else if (endpoint === '/respuestas' && data && Array.isArray(data.respuestas)) {
                 data = data.respuestas;
            }
            // Final check if data is now an array
            if (!Array.isArray(data)) {
                 console.warn(`[fetchGenericData] Unexpected final data format for ${dataKey}. Expected array, got:`, data);
                 // Attempt to use the raw response if it's an array
                 if (Array.isArray(response.data)) {
                     data = response.data;
                 } else {
                    throw new Error(`Respuesta inesperada del servidor para ${dataKey}.`);
                 }
            }

            console.log(`[fetchGenericData] Success: ${data.length} for ${dataKey}`);
            if (dataKey === 'usuarios') {
                 return data.map(u => { const { hash_password: _, ...rest } = u; return rest; });
            }
            return data;
        } catch (err) {
            console.error(`[fetchGenericData] Error fetching ${dataKey}:`, err.response?.data?.message || err.message);
            throw err;
        }
    }, []); // api is stable, no dependencies needed

    // --- Configuración Centralizada de Secciones ---
    const sectionConfig = useMemo(() => ({
        // --- Solicitudes Config ---
        'solicitudes': {
            title: 'Solicitudes',
            entityType: ENTITY_TYPES.SOLICITUD,
            apiPath: '/solicitudes',
            idKey: 'id_solicitud',
            fetchFn: () => fetchGenericData('/solicitudes', 'solicitudes'),
            setDataFn: setSolicitudes,
            relatedDataKeys: [],
            canAdd: false, canEdit: true, canDelete: false,
            columns: [
                { id: 'id_solicitud', label: 'ID', render: item => String(item.id_solicitud || '-').padStart(5, '0') },
                { id: 'RUT_ciudadano', label: 'RUT Vecino', render: item => formatRut(item.RUT_ciudadano)},
                { id: 'nombre_tipo', label: 'Tipo' },
                { id: 'fecha_hora_envio', label: 'Fecha', render: item => item.fecha_hora_envio ? new Date(item.fecha_hora_envio).toLocaleString('es-CL') : '-' },
                { id: 'estado', label: 'Estado' },
                { id: 'ruta_carpeta', label: 'Ruta Carpeta', cellStyle: { maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, render: item => <Tooltip title={item.ruta_carpeta || ''}><span>{item.ruta_carpeta || '-'}</span></Tooltip> },
                { id: 'correo_notificacion', label: 'Correo Notif.' },
            ],
            formFields: [
                { name: 'estado', label: 'Estado', type: 'select', required: true, options: ESTADOS_SOLICITUD, getOptionValue: opt => opt, getOptionLabel: opt => opt },
                { name: 'correo_notificacion', label: 'Correo Notificación', type: 'email', required: false, helperText: 'Dejar vacío si no se requiere.' },
            ],
        },
        // --- Areas Config ---
        'areas': {
            title: 'Áreas',
            entityType: ENTITY_TYPES.AREA,
            apiPath: '/areas',
            idKey: 'id_area',
            fetchFn: () => fetchGenericData('/areas', 'areas'),
            setDataFn: setAreas,
            relatedDataKeys: [],
            canAdd: true, canEdit: true, canDelete: true,
            columns: [
                { id: 'id_area', label: 'ID' }, { id: 'nombre_area', label: 'Nombre Área' },
            ],
            formFields: [
                { name: 'nombre_area', label: 'Nombre Área', type: 'text', required: true, autoFocus: true },
            ],
        },
        // --- Tipos Solicitudes Config ---
        'tipos-solicitudes': {
            title: 'Tipos de Solicitudes',
            entityType: ENTITY_TYPES.TIPO_SOLICITUD,
            apiPath: '/tipos_solicitudes',
            idKey: 'id_tipo',
            fetchFn: () => fetchGenericData('/tipos_solicitudes', 'tipos-solicitudes'),
            setDataFn: setTiposSolicitudesAdmin,
            relatedDataKeys: ['areas'],
            canAdd: true, canEdit: true, canDelete: true,
            columns: [
                { id: 'id_tipo', label: 'ID' },
                { id: 'nombre_tipo', label: 'Nombre Tipo' },
                { id: 'descripcion', label: 'Descripción', cellStyle: { maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, render: item => <Tooltip title={item.descripcion || ''}><span>{item.descripcion || '-'}</span></Tooltip> },
                { id: 'area_id', label: 'Área', render: (item, context) => context.areaMap.get(item.area_id) || '-' },
            ],
            formFields: [
                { name: 'nombre_tipo', label: 'Nombre Tipo Solicitud', type: 'text', required: true, autoFocus: true },
                { name: 'descripcion', label: 'Descripción', type: 'textarea', multiline: true, rows: 3, required: false },
                { name: 'area_id', label: 'Área', type: 'select', required: true, options: (ctx) => ctx.areas || [], getOptionValue: opt => opt.id_area, getOptionLabel: opt => opt.nombre_area, placeholder: 'Seleccione un Área' },
            ],
        },
        // --- Usuarios Config ---
        'usuarios': {
            title: 'Usuarios',
            entityType: ENTITY_TYPES.USUARIO,
            apiPath: '/usuarios',
            idKey: 'RUT',
            fetchFn: () => fetchGenericData('/usuarios', 'usuarios'),
            setDataFn: setUsuarios,
            relatedDataKeys: ['areas'],
            canAdd: true, canEdit: true, canDelete: true,
            columns: [
                { id: 'RUT', label: 'RUT', render: item => formatRut(item.RUT) },
                { id: 'nombre', label: 'Nombre' }, { id: 'apellido', label: 'Apellido' },
                { id: 'correo_electronico', label: 'Email', cellStyle: { wordBreak: 'break-all' } },
                { id: 'rol', label: 'Rol' },
                { id: 'area_id', label: 'Área', render: (item, context) => context.areaMap.get(item.area_id) || '-' },
            ],
            formFields: [
                { name: 'rut', label: 'RUT (sin puntos, con guión)', type: 'text', required: true, disabledOnEdit: true, autoFocus: true, addOnly: true },
                { name: 'nombre', label: 'Nombre', type: 'text', required: true, disabledOnEdit: true, addOnly: true },
                { name: 'apellido', label: 'Apellido', type: 'text', required: true, disabledOnEdit: true, addOnly: true },
                { name: 'correo_electronico', label: 'Correo Electrónico', type: 'email', required: false },
                { name: 'rol', label: 'Rol', type: 'select', required: false, options: ROLES_PERMITIDOS, getOptionValue: opt => opt, getOptionLabel: opt => opt, placeholder: 'Seleccione Rol (def: Vecino)' },
                { name: 'area_id', label: 'Área', type: 'select', required: false, options: (ctx) => ctx.areas || [], getOptionValue: opt => opt.id_area, getOptionLabel: opt => opt.nombre_area, placeholder: 'Ninguna' },
                { name: 'password', label: 'Contraseña', type: 'password', required: false, helperTextEdit: "Dejar vacío para no cambiar.", helperTextAdd: "Opcional al crear." },
                { name: 'deletePassword', label: 'Eliminar contraseña actual', type: 'checkbox', editOnly: true },
            ],
        },
         // --- Respuestas Config ---
        'respuestas': {
            title: 'Respuestas',
            entityType: ENTITY_TYPES.RESPUESTA,
            apiPath: '/respuestas',
            idKey: 'id_respuesta',
            fetchFn: () => fetchGenericData('/respuestas', 'respuestas'),
            setDataFn: setRespuestas,
            relatedDataKeys: [],
            canAdd: false, canEdit: false, canDelete: false,
            columns: [
                { id: 'id_respuesta', label: 'ID Resp.', render: item => String(item.id_respuesta || '-').padStart(5, '0') },
                { id: 'id_solicitud', label: 'ID Sol.', render: item => String(item.id_solicitud || '-').padStart(5, '0') },
                { id: 'nombre_tipo_solicitud', label: 'Tipo Solicitud' },
                { id: 'RUT_trabajador', label: 'Respondido por', render: item => `${item.nombre_trabajador || ''} ${item.apellido_trabajador || ''} (${formatRut(item.RUT_trabajador) || 'N/A'})`.trim() },
                { id: 'fecha_hora_respuesta', label: 'Fecha Respuesta', render: item => item.fecha_hora_respuesta ? new Date(item.fecha_hora_respuesta).toLocaleString('es-CL') : '-' },
                { id: 'ruta_carpeta_solicitud', label: 'Ruta Solicitud', cellStyle: { maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, render: item => <Tooltip title={item.ruta_carpeta_solicitud || ''}><span>{item.ruta_carpeta_solicitud || '-'}</span></Tooltip> },
            ],
            formFields: [],
        },
        // --- Preguntas Frecuentes Config ---
        'preguntas-frecuentes': {
            title: 'Preguntas Frecuentes',
            entityType: ENTITY_TYPES.PREGUNTA_FRECUENTE,
            apiPath: '/preguntas_frecuentes',
            idKey: 'id_pregunta',
            fetchFn: () => fetchGenericData('/preguntas_frecuentes', 'preguntas-frecuentes'),
            setDataFn: setPreguntasFrecuentes,
            relatedDataKeys: ['tipos-solicitudes'],
            canAdd: true, canEdit: true, canDelete: true,
            columns: [
                { id: 'id_pregunta', label: 'ID' },
                { id: 'pregunta', label: 'Pregunta', cellStyle: { width: '30%'} },
                { id: 'respuesta', label: 'Respuesta', cellStyle: { width: '40%', maxWidth: 300, whiteSpace: 'normal', wordBreak: 'break-word' } },
                { id: 'id_tipo', label: 'Tipo Solicitud', render: (item, context) => context.tipoSolicitudMap.get(item.id_tipo) || '-' },
            ],
            formFields: [
                { name: 'pregunta', label: 'Pregunta', type: 'textarea', multiline: true, rows: 2, required: true, autoFocus: true },
                { name: 'respuesta', label: 'Respuesta', type: 'textarea', multiline: true, rows: 4, required: true },
                { name: 'id_tipo', label: 'Tipo Solicitud Asociado', type: 'select', required: true, options: (ctx) => ctx.tiposSolicitudesAdmin || [], getOptionValue: opt => opt.id_tipo, getOptionLabel: opt => opt.nombre_tipo, placeholder: 'Seleccione un Tipo' },
            ],
        },
        // Add other sections (e.g., respuestas) here following the same pattern
    }), [fetchGenericData]); // CORRECTED: Removed data states (solicitudes, areas, etc.) and contextForRender

    // --- Get Current Config ---
    const currentConfig = useMemo(() => currentSectionKey ? sectionConfig[currentSectionKey] : null, [currentSectionKey, sectionConfig]);

    // --- Handler Selección Sidebar ---
    const handleSelectSection = useCallback((sectionKey) => {
        if (sectionKey !== currentSectionKey) {
            setCurrentSectionKey(sectionKey);
            setSearchTerm("");
            setIsModalOpen(false);
            setPage(0);
            setRowsPerPage(DEFAULT_ROWS_PER_PAGE);
            setError(null);
            setLoading(true);
        }
        handleDrawerClose();
    }, [currentSectionKey, handleDrawerClose]);

    // --- Efecto Principal para Cargar Datos ---
    useEffect(() => {
        if (!currentSectionKey || !currentConfig) {
            setLoading(false);
            setError(null);
            return;
        }

        let isMounted = true;
        const config = currentConfig; // Capture config for this run

        const loadData = async () => {
            // Ensure loading is true before starting fetches, only if mounted
            if (isMounted) setLoading(true);
            setError(null);
            setPage(0); // Reset page on section change/reload

            try {
                // 1. Fetch Primary Data
                const primaryDataPromise = config.fetchFn();

                // 2. Fetch Related Data Concurrently
                const relatedDataPromises = (config.relatedDataKeys || []).map(key => {
                    const relatedConfig = sectionConfig[key]; // Use stable sectionConfig here
                    if (relatedConfig?.fetchFn) {
                        return relatedConfig.fetchFn().catch(err => {
                            console.error(`Failed to fetch related data ${key}:`, err);
                            return []; // Return empty array on error for specific related data
                        });
                    }
                    return Promise.resolve([]); // Should not happen if config is correct
                });

                // 3. Wait for all fetches
                const [primaryDataResult, ...relatedDataResults] = await Promise.all([
                    primaryDataPromise,
                    ...relatedDataPromises
                ]);

                if (!isMounted) return; // Check mount status after await

                // 4. Set Primary Data State
                config.setDataFn(primaryDataResult || []);

                // 5. Set Related Data State
                (config.relatedDataKeys || []).forEach((key, index) => {
                    const relatedConfig = sectionConfig[key]; // Use stable sectionConfig
                    if (relatedConfig?.setDataFn) {
                        relatedConfig.setDataFn(relatedDataResults[index] || []);
                    }
                });

            } catch (err) {
                console.error(`Error loading data for ${currentSectionKey}:`, err);
                if (isMounted) {
                    setError(err.message || `Error al cargar ${config.title}.`);
                    config.setDataFn([]); // Clear primary data on error
                    // Clear related data as well
                    (config.relatedDataKeys || []).forEach(key => {
                         sectionConfig[key]?.setDataFn?.([]); // Use stable sectionConfig
                    });
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => {
            isMounted = false;
            console.log(`Unmounting effect for ${currentSectionKey || 'none'}`);
        };
    // Re-run ONLY when the selected section changes OR the config definition itself changes (rare)
    }, [currentConfig, currentSectionKey, sectionConfig]);

    // --- Cerrar drawer en pantalla grande ---
    useEffect(() => { if (isLargeScreen) setMobileOpen(false); }, [isLargeScreen]);

      
// --- Filtrado ---
    const filteredData = useMemo(() => {
        let dataToFilter = [];
        // Directly use the state variable corresponding to the current section
        switch (currentSectionKey) {
            case 'solicitudes': dataToFilter = solicitudes; break;
            case 'areas': dataToFilter = areas; break;
            case 'tipos-solicitudes': dataToFilter = tiposSolicitudesAdmin; break;
            case 'usuarios': dataToFilter = usuarios; break;
            case 'respuestas': dataToFilter = respuestas; break;
            case 'preguntas-frecuentes': dataToFilter = preguntasFrecuentes; break;
            default: dataToFilter = [];
        }

        if (!currentConfig || !dataToFilter) return [];
        if (!Array.isArray(dataToFilter)) {
            console.warn(`Data for section ${currentSectionKey} is not an array:`, dataToFilter);
            return [];
        }

        // --- Filtering Logic ---
        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        let results = dataToFilter; // Start with the full data for the section

        if (lowerSearchTerm) {
            results = dataToFilter.filter(item =>
                currentConfig.columns.some(col => {
                    let value = '';
                    if (col.render) {
                        const rendered = col.render(item, contextForRender);
                        if (typeof rendered === 'string' || typeof rendered === 'number') value = String(rendered);
                        else if (React.isValidElement(rendered) && rendered.props.children) value = React.Children.toArray(rendered.props.children).join('');
                        else value = String(item[col.id] ?? '');
                    } else { value = String(item[col.id] ?? ''); }
                    return value.toLowerCase().includes(lowerSearchTerm);
                })
            );
        }

        // --- Sorting Logic (Added Here) ---
        const idKey = currentConfig.idKey; // Get the ID key for the current section
        if (idKey && results.length > 0) {
            // Create a mutable copy before sorting
            results = [...results].sort((a, b) => {
                const aValue = a[idKey];
                const bValue = b[idKey];

                // Handle potential null/undefined values (treat nulls as smaller)
                if (aValue == null && bValue == null) return 0;
                if (aValue == null) return -1; // a is smaller
                if (bValue == null) return 1;  // b is smaller

                // Try numeric comparison first (handles numbers and numeric strings)
                const numericA = Number(aValue);
                const numericB = Number(bValue);

                if (!isNaN(numericA) && !isNaN(numericB)) {
                    return numericA - numericB; // Ascending numeric sort
                }

                // Fallback to locale-aware string comparison for non-numeric IDs (like RUT)
                return String(aValue).localeCompare(String(bValue));
            });
        }

        return results; // Return the filtered and sorted data

    }, [currentSectionKey, currentConfig, searchTerm, solicitudes, areas, tiposSolicitudesAdmin, usuarios, respuestas, preguntasFrecuentes, contextForRender]); // Keep dependencies

    
    // --- Handlers Modales (Combinados Add/Edit) ---
    const handleOpenModal = useCallback((mode, item = null) => {
        if (!currentConfig) return;
        setModalMode(mode);
        let initialFormData = {};

        if (mode === 'edit' && item) {
            setEditingItem(item);
            currentConfig.formFields.forEach(field => {
                if (field.type === 'password') initialFormData[field.name] = '';
                else if (field.name === 'deletePassword') initialFormData[field.name] = false;
                else initialFormData[field.name] = item[field.name] ?? '';
            });
        } else { // 'add' mode
            setEditingItem(null);
            currentConfig.formFields.forEach(field => {
                 if (field.name !== 'deletePassword') initialFormData[field.name] = field.defaultValue ?? '';
            });
        }
        setFormData(initialFormData);
        setShowPassword(false);
        setIsModalOpen(true);
    }, [currentConfig]);

    const handleCloseModal = useCallback(() => {
        if (isSubmitting) return;
        setIsModalOpen(false);
        setTimeout(() => {
            setModalMode(null); setEditingItem(null); setFormData({}); setShowPassword(false);
        }, 300);
    }, [isSubmitting]);

    const handleFormChange = useCallback((event) => {
        const { name, value, type, checked } = event.target;
        setFormData(prev => {
             const newState = { ...prev, [name]: type === 'checkbox' ? checked : value };
              if (currentSectionKey === 'usuarios' && name === 'deletePassword' && checked) {
                 newState.password = ''; setShowPassword(false);
             }
              if (currentSectionKey === 'usuarios' && name === 'password' && value.trim() !== '') {
                 newState.deletePassword = false;
             }
             return newState;
        });
    }, [currentSectionKey]); // Depends on current section for user logic

    const handleToggleShowPassword = useCallback(() => setShowPassword(show => !show), []);
    const handleMouseDownPassword = useCallback((event) => event.preventDefault(), []);

    // --- Refrescar Datos Helper ---
    const refreshData = useCallback(async (config) => {
        if (!config || !config.fetchFn || !config.setDataFn) return;
        console.log(`Refreshing data for section: ${config.title}`);
        try {
            const updatedData = await config.fetchFn();
            // Check if still the current section *before* setting state
            if (currentConfig && config.apiPath === currentConfig.apiPath) {
                config.setDataFn(updatedData || []);
                setPage(0); // Reset pagination of the current view
            }
             // Always try to refresh potentially related data shown in other sections' dropdowns
             // Use the stable sectionConfig reference here
             if (config.entityType === ENTITY_TYPES.AREA && sectionConfig['areas']) {
                 sectionConfig['areas'].fetchFn()
                    .then(data => sectionConfig['areas'].setDataFn(data || [])) // Use setter from config
                    .catch(e => console.error("Error refetching areas", e));
             }
             if (config.entityType === ENTITY_TYPES.TIPO_SOLICITUD && sectionConfig['tipos-solicitudes']) {
                 sectionConfig['tipos-solicitudes'].fetchFn()
                     .then(data => sectionConfig['tipos-solicitudes'].setDataFn(data || [])) // Use setter from config
                     .catch(e => console.error("Error refetching tipos", e));
             }

        } catch (refreshErr) {
            console.error(`Error refreshing ${config.title}:`, refreshErr);
            mostrarAlertaError('Error al Recargar', `No se pudo actualizar la tabla de ${config.title}.`);
        }
    }, [currentConfig, sectionConfig]); // Depends on stable sectionConfig and currentConfig

    // --- Submit GENÉRICO (Add/Edit) ---
    const handleSubmit = useCallback(async () => {
        if (!currentConfig || !modalMode || (modalMode === 'edit' && !editingItem)) return;

        setIsSubmitting(true);
        const { apiPath, idKey, formFields, title } = currentConfig;
        const itemId = modalMode === 'edit' ? editingItem?.[idKey] : null;
        const httpMethod = modalMode === 'add' ? 'post' : 'put';
        const apiUrl = modalMode === 'add' ? apiPath : `${apiPath}/${encodeURIComponent(itemId)}`;
        const actionText = modalMode === 'add' ? 'agregar' : 'actualizar';
        const successActionText = modalMode === 'add' ? 'agregado' : 'actualizado';

        try {
            let payload = {};
            formFields.forEach(field => {
                if ((modalMode === 'edit' && field.addOnly) || (modalMode === 'add' && field.editOnly)) return;
                 if (Object.prototype.hasOwnProperty.call(formData, field.name)) {
                    let value = formData[field.name];
                     if (value === '' && (field.type === 'select' || ['area_id', 'id_tipo', 'correo_electronico'].includes(field.name))) payload[field.name] = null;
                     else if (field.type === 'password') {
                         if (field.name === 'password' && typeof value === 'string' && value.trim()) payload.password = value.trim();
                         else if (field.name === 'deletePassword' && value === true) {
                             payload.deletePassword = true;
                             delete payload.password; // Ensure password field itself is not sent if deleting
                         }
                     } else if (field.type === 'checkbox' && field.name !== 'deletePassword') payload[field.name] = !!value;
                     else if (typeof value === 'string') payload[field.name] = value.trim();
                     else payload[field.name] = value;
                 }
             });

            if (modalMode === 'edit') {
                 let hasChanged = false;
                 for (const key in payload) {
                      if (key === 'password' && payload.password) { hasChanged = true; break; }
                      if (key === 'deletePassword' && payload.deletePassword === true) { hasChanged = true; break; }
                      const originalValue = editingItem[key] ?? '';
                      const newValue = payload[key] ?? '';
                      if (String(originalValue) !== String(newValue)) { hasChanged = true; break; }
                 }
                 if (!hasChanged) {
                    mostrarAlertaExito("Sin cambios", "No se detectaron cambios."); handleCloseModal(); setIsSubmitting(false); return;
                 }
            }

             const logPayload = { ...payload };
             if (logPayload.password) logPayload.password = '***';
            console.log(`[handleSubmit] ${httpMethod.toUpperCase()} ${apiUrl} Payload:`, logPayload);

            await api[httpMethod](apiUrl, payload);

            await mostrarAlertaExito('Éxito', `${title} ${successActionText} correctamente.`);
            handleCloseModal();
            await refreshData(currentConfig);

        } catch (err) {
            console.error(`[handleSubmit] Error al ${actionText} ${title}:`, err);
            const errorMsg = err.response?.data?.message || err.message || `No se pudo ${actionText}.`;
            await mostrarAlertaError(`Error al ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`, errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    }, [currentConfig, modalMode, editingItem, formData, handleCloseModal, refreshData]);

    // --- Función DELETE GENÉRICA ---
    const handleDeleteItem = useCallback(async (itemId) => {
        if (!currentConfig || !itemId || !currentConfig.canDelete) return;
        setIsDeleting(true);
        const { apiPath, title } = currentConfig;
        const apiUrl = `${apiPath}/${encodeURIComponent(itemId)}`;
        try {
            console.log(`[handleDeleteItem] DELETE ${apiUrl}`);
            await api.delete(apiUrl);
            await mostrarAlertaExito('Eliminado', `${title} eliminado correctamente.`);
            await refreshData(currentConfig);
        } catch (err) {
            console.error(`[handleDeleteItem] Error:`, err);
            const errorMsg = err.response?.data?.message || err.message || `No se pudo eliminar.`;
            if (err.response?.status === 409) {
                await mostrarAlertaError('Error de Dependencia', errorMsg || `No se puede eliminar ${title} porque está en uso.`);
            } else {
                await mostrarAlertaError('Error al Eliminar', errorMsg);
            }
        } finally {
            setIsDeleting(false);
        }
    }, [currentConfig, refreshData]);

    // --- Handler Confirmar Eliminación ---
    const handleOpenDeleteConfirmation = useCallback((item) => {
        if (!currentConfig || !item || isDeleting || !currentConfig.canDelete) return;
        const { idKey, title, columns } = currentConfig;
        const itemId = item[idKey];
        const nameField = columns.find(c => ['nombre_area', 'nombre_tipo', 'pregunta', 'nombre'].includes(c.id));
        const itemDescription = nameField ? `${title.slice(0,-1)} "${item[nameField.id]}" (${idKey}: ${itemId})` : `${title.slice(0,-1)} (ID: ${itemId})`;
        if (!itemId) { console.error("No se pudo obtener el ID para eliminar"); return; }

        Swal.fire({
            title: '¿Estás seguro?',
            html: `Se eliminará ${itemDescription}.<br/><strong>Esta acción no se puede deshacer.</strong>`,
            icon: 'warning', showCancelButton: true,
            confirmButtonColor: currentTheme.palette.error.main, cancelButtonColor: currentTheme.palette.grey[600],
            confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
            customClass: { popup: `swal2-${mode}`, title: `swal2-title-${mode}`, htmlContainer: `swal2-html-container-${mode}` }
        }).then((result) => {
            if (result.isConfirmed) {
                handleDeleteItem(itemId);
            }
        });
    }, [currentConfig, isDeleting, currentTheme, mode, handleDeleteItem]); // Added handleDeleteItem dependency

    // --- Contenido Sidebar ---
    const drawerContent = useMemo(() => ( <SidebarAdmin currentSection={currentSectionKey} onSelectSection={handleSelectSection} onCloseDrawer={handleDrawerClose} /> ), [currentSectionKey, handleSelectSection, handleDrawerClose]);

    // --- Estilos Celdas ---
    const headerCellStyle = useMemo(() => ({
        fontWeight: 'bold',
        backgroundColor: currentTheme.palette.mode === 'light' ? currentTheme.palette.grey[200] : currentTheme.palette.grey[800],
        color: currentTheme.palette.text.primary, whiteSpace: 'nowrap', fontSize: '0.875rem', padding: '8px 10px',
    }), [currentTheme]);
    const bodyCellStyle = useMemo(() => ({
        fontSize: '0.875rem', color: currentTheme.palette.text.secondary, verticalAlign: 'top', padding: '8px 10px',
    }), [currentTheme]);

    // --- ColSpan Dinámico ---
    const getCurrentColSpan = useMemo(() => {
        if (!currentConfig) return 1;
        return currentConfig.columns.length + (currentConfig.canEdit || currentConfig.canDelete ? 1 : 0);
    }, [currentConfig]);

     // --- Handlers Paginación ---
    const handleChangePage = useCallback((event, newPage) => { setPage(newPage); }, []);
    const handleChangeRowsPerPage = useCallback((event) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0); }, []);

    // Calculate data for the current page
    const paginatedData = useMemo(() => {
        if (!filteredData) return [];
        return rowsPerPage > 0
            ? filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            : filteredData;
    }, [filteredData, page, rowsPerPage]);


    // --- Renderizado ---
    return (
        <ThemeProvider theme={currentTheme}>
            <CssBaseline />
            <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
                {/* Navbar */}
                <Navbar toggleTheme={handleToggleTheme} toggleSidebar={handleDrawerToggle} title="Portal Administración"/>
                {/* Sidebar */}
                <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
                     <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, bgcolor: 'background.paper' } }}> {drawerContent} </Drawer>
                     <Drawer variant="permanent" open sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, top: `${APP_BAR_HEIGHT}px`, height: `calc(100vh - ${APP_BAR_HEIGHT}px)`, borderRight: `1px solid ${currentTheme.palette.divider}`, bgcolor: 'background.paper' } }}> {drawerContent} </Drawer>
                </Box>
                {/* Contenido Principal */}
                <Box component="main" sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2, md: 3 }, width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` }, display: 'flex', flexDirection: 'column', mt: `${APP_BAR_HEIGHT}px`, height: `calc(100vh - ${APP_BAR_HEIGHT}px)`, overflow: 'hidden' }}>
                    <Card sx={{ width: '100%', flexGrow: 1, borderRadius: 2, boxShadow: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'background.paper' }}>
                        <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 }, display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
                            {/* Cabecera */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2, flexShrink: 0 }}>
                                <Typography variant={isSmallScreen ? 'h6' : (isLargeScreen ? 'h4' : 'h5')} component="h1" sx={{ fontWeight: "bold", order: 1, mr: 'auto' }}>
                                    {currentConfig?.title || 'Administración'}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'nowrap', order: 2, ml: { xs: 0, sm: 2 } }}>
                                    {/* Search Bar */}
                                    {!loading && !error && currentConfig && (
                                        <TextField
                                            size="small" variant="outlined" placeholder="Buscar..." value={searchTerm} onChange={handleSearchChange}
                                            sx={{ width: { xs: '150px', sm: 200, md: 250 } }}
                                            InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>), sx: { borderRadius: 2 } }}
                                        />
                                    )}
                                     {/* Add Button */}
                                    {currentConfig?.canAdd && (
                                        <Tooltip title={`Agregar Nuevo/a ${currentConfig.title.slice(0, -1)}`}>
                                            <span> {/* Span for tooltip when disabled */}
                                                <Button
                                                    variant="contained" color="primary" size="medium" startIcon={<AddIcon />}
                                                    onClick={() => handleOpenModal('add')}
                                                    disabled={loading || isSubmitting || isDeleting || !currentConfig?.canAdd}
                                                    sx={{ whiteSpace: 'nowrap', height: '40px' }}
                                                >
                                                    Agregar
                                                </Button>
                                            </span>
                                        </Tooltip>
                                    )}
                                </Box>
                            </Box>
                            {/* Indicadores */}
                            {loading && ( <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 5, flexGrow: 1 }}> <CircularProgress /> <Typography sx={{ ml: 2 }} color="text.secondary">Cargando {currentConfig?.title.toLowerCase()}...</Typography> </Box> )}
                            {!loading && error && ( <Alert severity="error" sx={{ mb: 2, flexShrink: 0 }}> {`Error al cargar datos: ${error}`} </Alert> )}
                            {!loading && !error && !currentConfig && ( <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, textAlign: 'center', color: 'text.secondary', p: 3 }}> <Typography variant="h6" component="p"> Selecciona una sección del menú lateral.</Typography> </Box> )}

                             {/* Contenedor Tabla y Paginación */}
                            {!loading && !error && currentConfig && (
                                <Fade in={true} timeout={300} style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    <Paper sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: `1px solid ${currentTheme.palette.divider}`, borderRadius: 1.5, width: '100%', bgcolor: 'background.paper' }}>
                                        <TableContainer sx={{ flexGrow: 1, overflow: 'auto', boxShadow: 0, border: 0 }}>
                                            <Table stickyHeader size="small" sx={{ minWidth: 650 }}>
                                                {/* Cabeceras Dinámicas */}
                                                <TableHead>
                                                     <TableRow>
                                                        {currentConfig.columns.map(col => (
                                                            <TableCell key={col.id} sx={{...headerCellStyle, ...(col.headerStyle || {})}}>
                                                                {col.label}
                                                            </TableCell>
                                                        ))}
                                                         {(currentConfig.canEdit || currentConfig.canDelete) && (
                                                             <TableCell sx={{ ...headerCellStyle, textAlign: 'right', width: '100px' }}>Acciones</TableCell>
                                                         )}
                                                     </TableRow>
                                                 </TableHead>
                                                {/* Cuerpo de Tabla Dinámico */}
                                                <TableBody>
                                                     {paginatedData.map((item, index) => {
                                                         const rowKey = `${currentSectionKey}-${item[currentConfig.idKey] || index}`;
                                                         const actionsCellStyle = { ...bodyCellStyle, padding: '6px 8px', textAlign: 'right', whiteSpace: 'nowrap' };
                                                         const canEditItem = currentConfig.canEdit;
                                                         const canDeleteItem = currentConfig.canDelete;

                                                         return (
                                                            <TableRow hover key={rowKey} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                                {currentConfig.columns.map(col => (
                                                                     <TableCell key={`${rowKey}-${col.id}`} sx={{...bodyCellStyle, ...(col.cellStyle || {})}}>
                                                                        {col.render ? col.render(item, contextForRender) : (item[col.id] ?? '-')}
                                                                     </TableCell>
                                                                ))}
                                                                {/* Actions Cell */}
                                                                {(canEditItem || canDeleteItem) && (
                                                                    <TableCell sx={actionsCellStyle}>
                                                                        {canEditItem && (
                                                                            <Tooltip title={`Editar ${currentConfig.title.slice(0,-1)}`}>
                                                                                <span>
                                                                                    <IconButton size="small" onClick={() => handleOpenModal('edit', item)} color="primary" disabled={isSubmitting || isDeleting}>
                                                                                        <EditIcon fontSize="inherit"/>
                                                                                    </IconButton>
                                                                                </span>
                                                                            </Tooltip>
                                                                        )}
                                                                        {canDeleteItem && (
                                                                            <Tooltip title={`Eliminar ${currentConfig.title.slice(0,-1)}`}>
                                                                                <span>
                                                                                    <IconButton size="small" onClick={() => handleOpenDeleteConfirmation(item)} color="error" disabled={isSubmitting || isDeleting}>
                                                                                        <DeleteIcon fontSize="inherit"/>
                                                                                    </IconButton>
                                                                                </span>
                                                                            </Tooltip>
                                                                        )}
                                                                    </TableCell>
                                                                )}
                                                            </TableRow>
                                                         );
                                                     })}
                                                     {/* Mensaje "No hay datos" / "No se encontraron resultados" */}
                                                    {!loading && filteredData.length === 0 && ( <TableRow> <TableCell colSpan={getCurrentColSpan} align="center" sx={{ py: 4, fontStyle: 'italic', color: 'text.secondary' }}> {searchTerm ? 'No se encontraron resultados.' : `No hay ${currentConfig.title.toLowerCase()} para mostrar.`} </TableCell> </TableRow> )}
                                                    {/* Filas vacías para llenar espacio */}
                                                    {!loading && paginatedData.length > 0 && rowsPerPage > 0 && (
                                                      (() => {
                                                         const emptyRows = rowsPerPage - paginatedData.length;
                                                         return emptyRows > 0 ? ( <TableRow style={{ height: 49 * emptyRows }}><TableCell colSpan={getCurrentColSpan} style={{ padding: 0, borderBottom: 'none' }} /></TableRow> ) : null;
                                                      })()
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                        {/* Paginación */}
                                        {filteredData.length > 0 && ( <TablePagination rowsPerPageOptions={[5, 10, 25, { label: 'Todo', value: -1 }]} component="div" count={filteredData.length} rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} labelRowsPerPage="Filas por página:" labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`} sx={{ borderTop: `1px solid ${currentTheme.palette.divider}`, flexShrink: 0 }} /> )}
                                    </Paper>
                                </Fade>
                            )}
                        </CardContent>
                    </Card>
                </Box> {/* Fin Main */}

                {/* --- Modal Genérico (Add/Edit) --- */}
                {currentConfig && (
                    <Dialog open={isModalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                        <DialogTitle>
                            {modalMode === 'add' ? 'Agregar' : 'Editar'} {currentConfig.title.slice(0,-1)}
                            {modalMode === 'edit' && editingItem && ` (${currentConfig.idKey}: ${editingItem[currentConfig.idKey]})`}
                        </DialogTitle>
                        <DialogContent dividers>
                            <Stack spacing={2.5} sx={{ mt: 1 }}>
                                {currentConfig.formFields
                                    .filter(field => !((modalMode === 'edit' && field.addOnly) || (modalMode === 'add' && field.editOnly)))
                                    .map(field => {
                                    const commonProps = {
                                        key: field.name, name: field.name, label: field.label,
                                        value: formData[field.name] ?? '', onChange: handleFormChange, fullWidth: true,
                                        required: modalMode === 'add' && field.required,
                                        disabled: isSubmitting || (modalMode === 'edit' && field.disabledOnEdit) || (field.name === 'password' && !!formData.deletePassword), // Ensure deletePassword check is boolean
                                        autoFocus: field.autoFocus && modalMode === 'add',
                                    };
                                    const helperText = modalMode === 'edit' ? (field.helperTextEdit ?? field.helperText) : (field.helperTextAdd ?? field.helperText);

                                    if (field.type === 'select') {
                                        // Pass current state context to options function
                                        const options = typeof field.options === 'function' ? field.options({ areas, tiposSolicitudesAdmin }) : field.options;
                                        return (
                                            <FormControl fullWidth key={field.name} required={commonProps.required} disabled={commonProps.disabled}>
                                                <InputLabel id={`${modalMode}-${field.name}-label`}>{field.label}</InputLabel>
                                                <Select
                                                    labelId={`${modalMode}-${field.name}-label`} label={field.label} {...commonProps}
                                                     value={formData[field.name] ?? ''}
                                                >
                                                    {field.placeholder && <MenuItem value=""><em>{field.placeholder}</em></MenuItem>}
                                                    {(options || []).map((opt, idx) => {
                                                        const value = field.getOptionValue(opt);
                                                        const label = field.getOptionLabel(opt);
                                                        return <MenuItem key={value ?? idx} value={value}>{label}</MenuItem>;
                                                    })}
                                                </Select>
                                                {helperText && <Typography variant="caption" sx={{ pl: 1.5, pt: 0.5, color: 'text.secondary' }}>{helperText}</Typography>}
                                            </FormControl>
                                        );
                                    } else if (field.type === 'textarea') {
                                        return <TextField {...commonProps} multiline rows={field.rows || 3} helperText={helperText} />;
                                    } else if (field.type === 'checkbox') {
                                        return (
                                             <FormControlLabel
                                                control={ <Checkbox name={field.name} checked={!!formData[field.name]} onChange={handleFormChange} disabled={commonProps.disabled} color={field.name === 'deletePassword' ? 'warning' : 'primary'} /> }
                                                label={field.label} key={field.name}
                                             />
                                        );
                                    } else if (field.type === 'password') {
                                        return (
                                             <TextField
                                                {...commonProps} type={showPassword ? 'text' : 'password'} helperText={helperText}
                                                InputProps={{
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <IconButton aria-label="toggle password visibility" onClick={handleToggleShowPassword} onMouseDown={handleMouseDownPassword} edge="end" disabled={commonProps.disabled}>
                                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                                            </IconButton>
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        );
                                    } else { // 'text', 'email', 'number', etc.
                                        return <TextField {...commonProps} type={field.type || 'text'} helperText={helperText} />;
                                    }
                                })}
                            </Stack>
                        </DialogContent>
                        <DialogActions sx={{p: '16px 24px'}}>
                             <Button onClick={handleCloseModal} color="secondary" disabled={isSubmitting}>Cancelar</Button>
                             <Button onClick={handleSubmit} variant="contained" color="primary" disabled={isSubmitting}>
                                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : (modalMode === 'add' ? 'Agregar' : 'Guardar Cambios')}
                             </Button>
                        </DialogActions>
                    </Dialog>
                )}

            </Box> {/* Fin Flex Principal */}
        </ThemeProvider>
    );
}
export default Administrador;