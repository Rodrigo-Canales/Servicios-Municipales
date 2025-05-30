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
// import { useTheme } from '@mui/material/styles'; // <--- Eliminado: No es necesario aquí
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import AccountBox from '@mui/icons-material/AccountBox';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Importa componentes y utilidades
import Navbar from "../Navbar";
import Sidebar from '../common/Sidebar';
import { lightTheme, darkTheme } from "../../theme";
import { mostrarAlertaExito, mostrarAlertaError, mostrarConfirmacion } from "../../utils/alertUtils";
import { formatRut } from "../../utils/rutUtils";
import TableCard from '../common/TableCard';

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
function Administrador({ toggleTheme, mode }) {
    // --- Estados ---
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
    // const themeHook = useTheme(); // <--- ELIMINADO: Redundante y no usado
    const currentTheme = useMemo(() => (mode === "light" ? lightTheme : darkTheme), [mode]);
    const isLargeScreen = useMediaQuery(currentTheme.breakpoints.up('md'));

    // --- Handlers Layout ---
    const handleToggleTheme = useCallback(() => {
        if (typeof toggleTheme === 'function') toggleTheme();
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
        try {
            const response = await api.get(endpoint);
            let data = response.data;

            // Handle potential wrapping object & specific keys (Logic unchanged)
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
            // --- FORZAR ARRAY PARA EVITAR ERRORES EN LAS TABLAS ---
            if (!Array.isArray(data)) {
                if (data && typeof data === 'object') {
                    data = Object.values(data);
                } else {
                    data = [];
                }
            }

            if (dataKey === 'usuarios') {
                return data.map(u => { const { hash_password: _, ...rest } = u; return rest; });
            }
            return data;
        } catch (err) {
            console.error(`[fetchGenericData] Error fetching ${dataKey}:`, err.response?.data?.message || err.message);
            throw err;
        }
    }, []);

    // --- Configuración Centralizada de Secciones ---
    // (Funcionalidad sin cambios, solo ajustes de estilo en render si es necesario)
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
                { id: 'ruta_carpeta', label: 'Ruta Carpeta', cellStyle: { maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, render: item => <Tooltip title={item.ruta_carpeta || ''} placement="top"><Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.ruta_carpeta || '-'}</Box></Tooltip> },
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
                { id: 'descripcion', label: 'Descripción', cellStyle: { maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, render: item => <Tooltip title={item.descripcion || ''} placement="top"><Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.descripcion || '-'}</Box></Tooltip> },
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
                { id: 'correo_electronico', label: 'Email', cellStyle: { wordBreak: 'break-all', maxWidth: 200 } },
                { id: 'rol', label: 'Rol' },
                { id: 'area_id', label: 'Área', render: (item, context) => context.areaMap.get(item.area_id) || '-' },
            ],
            formFields: [
                {
                    name: 'rut',
                    label: 'RUT (sin puntos, con guión)',
                    type: 'text',
                    required: true,
                    disabledOnEdit: true,
                    autoFocus: true,
                    addOnly: true,
                    onInput: (e) => {
                        // No permitir puntos
                        if (e.nativeEvent && e.nativeEvent.inputType === 'insertText' && e.nativeEvent.data === '.') {
                            e.preventDefault();
                            return;
                        }
                        if (e.target.value.includes('.')) {
                            e.target.value = e.target.value.replace(/\./g, '');
                            e.target.setCustomValidity('El RUT no debe contener puntos.');
                        } else {
                            e.target.setCustomValidity('');
                        }
                        // Convertir k a mayúscula automáticamente
                        const val = e.target.value;
                        if (val.match(/k$/)) {
                            e.target.value = val.replace(/k$/, 'K');
                        }
                    },
                },
                { name: 'nombre', label: 'Nombre', type: 'text', required: true },
                { name: 'apellido', label: 'Apellido', type: 'text', required: true },
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
                { id: 'ruta_carpeta_solicitud', label: 'Ruta Solicitud', cellStyle: { maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, render: item => <Tooltip title={item.ruta_carpeta_solicitud || ''} placement="top"><Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.ruta_carpeta_solicitud || '-'}</Box></Tooltip> },
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
    }), [fetchGenericData]); // Dependencies correctas

    // --- Get Current Config ---
    const currentConfig = useMemo(() => currentSectionKey ? sectionConfig[currentSectionKey] : null, [currentSectionKey, sectionConfig]);

    // --- Handler Selección Sidebar ---
    const handleSelectSection = useCallback((sectionKey) => {
        if (sectionKey !== currentSectionKey) {
            setCurrentSectionKey(sectionKey);
            setSearchTerm("");
            setIsModalOpen(false); // Asegurarse que el modal esté cerrado al cambiar sección
            setModalMode(null); // Limpiar estado del modal
            setEditingItem(null);
            setFormData({});
            setPage(0);
            setRowsPerPage(DEFAULT_ROWS_PER_PAGE);
            setError(null);
            setLoading(true);
        }
        handleDrawerClose();
    }, [currentSectionKey, handleDrawerClose]); // Dependencias correctas

    // --- Efecto Principal para Cargar Datos ---
    useEffect(() => {
        if (!currentSectionKey || !currentConfig) {
            setLoading(false);
            setError(null);
            return;
        }

        let isMounted = true;
        const config = currentConfig;

        const loadData = async () => {
            if (isMounted) setLoading(true);
            setError(null);
            setPage(0);

            try {
                const primaryDataPromise = config.fetchFn();
                const relatedDataPromises = (config.relatedDataKeys || []).map(key => {
                    const relatedConfig = sectionConfig[key];
                    if (relatedConfig?.fetchFn) {
                        return relatedConfig.fetchFn().catch(err => {
                            console.error(`Failed to fetch related data ${key}:`, err);
                            return [];
                        });
                    }
                    return Promise.resolve([]);
                });

                const [primaryDataResult, ...relatedDataResults] = await Promise.all([
                    primaryDataPromise,
                    ...relatedDataPromises
                ]);

                if (!isMounted) return;

                config.setDataFn(primaryDataResult || []);

                (config.relatedDataKeys || []).forEach((key, index) => {
                    const relatedConfig = sectionConfig[key];
                    if (relatedConfig?.setDataFn) {
                        relatedConfig.setDataFn(relatedDataResults[index] || []);
                    }
                });

            } catch (err) {
                console.error(`Error loading data for ${currentSectionKey}:`, err);
                if (isMounted) {
                    setError(err.message || `Error al cargar ${config.title}.`);
                    config.setDataFn([]);
                    (config.relatedDataKeys || []).forEach(key => {
                        sectionConfig[key]?.setDataFn?.([]);
                    });
                }
            } finally {
                if (isMounted) {
                    setTimeout(() => setLoading(false), 200); // Pequeño delay para suavidad
                }
            }
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, [currentConfig, currentSectionKey, sectionConfig]); // Dependencias correctas

    // --- Cerrar drawer en pantalla grande ---
    useEffect(() => { if (isLargeScreen) setMobileOpen(false); }, [isLargeScreen]);


    // --- Filtrado ---
    const filteredData = useMemo(() => {
        let dataToFilter = [];
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

        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        let results = dataToFilter;

        if (lowerSearchTerm) {
            results = dataToFilter.filter(item =>
                currentConfig.columns.some(col => {
                    let value = '';
                    if (col.render) {
                        try {
                            const rendered = col.render(item, contextForRender);
                            if (typeof rendered === 'string' || typeof rendered === 'number') value = String(rendered);
                            else if (React.isValidElement(rendered) && (rendered.type === Tooltip || rendered.type === Box) && rendered.props.children) {
                                const children = React.Children.toArray(rendered.props.children);
                                const innerChild = children[0];
                                if (React.isValidElement(innerChild) && innerChild.props.children) {
                                    value = React.Children.toArray(innerChild.props.children).join('');
                                } else if (typeof innerChild === 'string' || typeof innerChild === 'number') {
                                    value = String(innerChild);
                                } else { value = String(item[col.id] ?? ''); }
                            }
                            else if (React.isValidElement(rendered) && rendered.props.children) value = React.Children.toArray(rendered.props.children).join('');
                            else value = String(item[col.id] ?? '');
                        } catch (e) {
                            console.warn("Error processing rendered value for search:", e);
                            value = String(item[col.id] ?? '');
                        }
                    } else { value = String(item[col.id] ?? ''); }
                    return value.toLowerCase().includes(lowerSearchTerm);
                })
            );
        }

        // --- Sorting Logic (Remains the same functionally) ---
        const idKey = currentConfig.idKey;
        if (idKey && results.length > 0) {
            // Solo aplicar orden descendente a solicitudes y respuestas
            if (['solicitudes', 'respuestas'].includes(currentSectionKey)) {
                results = [...results].sort((a, b) => {
                    const aValue = a[idKey]; const bValue = b[idKey];
                    if (aValue == null && bValue == null) return 0;
                    if (aValue == null) return -1;
                    if (bValue == null) return 1;
                    const numericA = Number(aValue); const numericB = Number(bValue);
                    if (!isNaN(numericA) && !isNaN(numericB)) return numericB - numericA;
                    return String(bValue).localeCompare(String(aValue));
                });
            } else {
                results = [...results].sort((a, b) => {
                    const aValue = a[idKey]; const bValue = b[idKey];
                    if (aValue == null && bValue == null) return 0;
                    if (aValue == null) return -1;
                    if (bValue == null) return 1;
                    const numericA = Number(aValue); const numericB = Number(bValue);
                    if (!isNaN(numericA) && !isNaN(numericB)) return numericA - numericB;
                    return String(aValue).localeCompare(String(bValue));
                });
            }
        }
        return results;
    }, [currentSectionKey, currentConfig, searchTerm, solicitudes, areas, tiposSolicitudesAdmin, usuarios, respuestas, preguntasFrecuentes, contextForRender]); // Dependencias correctas


    // --- Handlers Modales (Combinados Add/Edit) ---
    const handleOpenModal = useCallback((mode, item = null) => {
        // Verifica si hay una configuración válida antes de continuar
        if (!currentConfig || !currentConfig.formFields) {
            console.error("Intentando abrir modal sin configuración válida.");
            return; // No hacer nada si no hay config
        }

        setModalMode(mode); // Establece el modo ('add' o 'edit')
        let initialFormData = {};

        // Siempre calcula el estado inicial del formulario CADA VEZ que se abre el modal
        if (mode === 'edit' && item) {
            setEditingItem(item); // Guarda la referencia al item que se edita
            currentConfig.formFields.forEach(field => {
                // No pre-rellenar contraseña en edición
                if (field.type === 'password') initialFormData[field.name] = '';
                // Asegurar que el checkbox de eliminar contraseña esté desmarcado por defecto
                else if (field.name === 'deletePassword') initialFormData[field.name] = false;
                // Usar el valor existente del item, o '' si no existe
                else initialFormData[field.name] = item[field.name] ?? '';
            });
        } else { // Modo 'add', o si 'item' es null inesperadamente en modo 'edit'
            setEditingItem(null); // No hay item en edición
            currentConfig.formFields.forEach(field => {
                 // Solo establecer valor por defecto si el campo NO es solo para editar
                if (!field.editOnly) {
                    // Usar valor por defecto definido en config, o ''
                    initialFormData[field.name] = field.defaultValue ?? '';
                }
                 // Asegurar que deletePassword no esté presente en modo 'add'
                if (field.name === 'deletePassword') delete initialFormData[field.name];
            });
        }

        setFormData(initialFormData); // Establece el estado limpio del formulario
        setShowPassword(false);      // Siempre oculta la contraseña al abrir
        setIsModalOpen(true);       // Ahora sí, abre el modal visualmente

    }, [currentConfig]); // Depende de currentConfig para leer formFields

    // --- MODIFICADO: handleCloseModal (Versión más segura) ---
    const handleCloseModal = useCallback(() => {
        // No permitir cerrar si se está enviando una petición
        if (isSubmitting) return;

        // Simplemente cierra el modal. La limpieza del estado se hará
        // la próxima vez que se llame a handleOpenModal.
        setIsModalOpen(false);

    }, [isSubmitting]); // Solo depende de isSubmitting para prevenir el cierre

    const handleFormChange = useCallback((event) => {
        const { name, value, type, checked } = event.target;
        let newValue = type === 'checkbox' ? checked : value;

        // --- BLOQUEO DE PUNTOS EN RUT ---
        if (name === 'rut' && typeof newValue === 'string') {
            // Elimina todos los puntos automáticamente
            newValue = newValue.replace(/\./g, '');
            // Si el usuario intenta escribir un punto, simplemente no lo agrega
            if (value.includes('.')) {
                event.target.value = newValue;
            }
        }
        // --- FIN BLOQUEO DE PUNTOS EN RUT ---

        setFormData(prev => {
            const newState = { ...prev, [name]: newValue };
            if (currentSectionKey === 'usuarios' && name === 'deletePassword' && checked) {
                newState.password = '';
                setShowPassword(false);
            }
            if (currentSectionKey === 'usuarios' && name === 'password' && value.trim() !== '') {
                newState.deletePassword = false;
            }
            return newState;
        });
    }, [currentSectionKey]);

    const handleToggleShowPassword = useCallback(() => setShowPassword(show => !show), []);
    const handleMouseDownPassword = useCallback((event) => event.preventDefault(), []);

    // --- Refrescar Datos Helper ---
    const refreshData = useCallback(async (config) => {
        if (!config || !config.fetchFn || !config.setDataFn) return;
        try {
            const updatedData = await config.fetchFn();
            // Solo actualiza el estado si la sección actual sigue siendo la misma
            if (currentConfig && config.apiPath === currentConfig.apiPath) {
                config.setDataFn(updatedData || []);
                setPage(0); // Reset pagination
            }
             // Siempre refresca datos relacionados que podrían usarse en dropdowns
            if (config.entityType === ENTITY_TYPES.AREA && sectionConfig['areas']) {
                sectionConfig['areas'].fetchFn()
                    .then(data => sectionConfig['areas'].setDataFn(data || []))
                    .catch(e => console.error("Error refetching areas", e));
            }
            if (config.entityType === ENTITY_TYPES.TIPO_SOLICITUD && sectionConfig['tipos-solicitudes']) {
                sectionConfig['tipos-solicitudes'].fetchFn()
                    .then(data => sectionConfig['tipos-solicitudes'].setDataFn(data || []))
                    .catch(e => console.error("Error refetching tipos", e));
            }
        } catch (refreshErr) {
            console.error(`Error refreshing ${config.title}:`, refreshErr);
            mostrarAlertaError('Error al Recargar', `No se pudo actualizar la tabla de ${config.title}.`);
        }
    }, [currentConfig, sectionConfig]); // Dependencias correctas

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
                            delete payload.password;
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
                      // Comparación más robusta para null/undefined vs string vacío
                    if (String(originalValue ?? '') !== String(newValue ?? '')) {
                        hasChanged = true;
                        break;
                    }
                }
                if (!hasChanged) {
                    mostrarAlertaExito("Sin cambios", "No se detectaron cambios.");
                    handleCloseModal(); // Cierra el modal
                    //setIsSubmitting(false); // Se hace en el finally
                    return;
                }
            }

            const logPayload = { ...payload };
            if (logPayload.password) logPayload.password = '***';

            await api[httpMethod](apiUrl, payload);

            await mostrarAlertaExito('Éxito', `${title} ${successActionText} correctamente.`);
            handleCloseModal(); // Cierra el modal después del éxito
            await refreshData(currentConfig); // Refresca los datos

        } catch (err) {
            console.error(`[handleSubmit] Error al ${actionText} ${title}:`, err);
            const errorMsg = err.response?.data?.message || err.message || `No se pudo ${actionText}.`;
            // No cerramos el modal en caso de error para que el usuario pueda corregir
            await mostrarAlertaError(`Error al ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`, errorMsg);
        } finally {
            // Asegurarse de que isSubmitting se ponga en false SIEMPRE.
            setIsSubmitting(false);
        }
    }, [currentConfig, modalMode, editingItem, formData, handleCloseModal, refreshData]); // Dependencias correctas

    // --- Función DELETE GENÉRICA ---
    const handleDeleteItem = useCallback(async (itemId) => {
        if (!currentConfig || !itemId || !currentConfig.canDelete) return;
        setIsDeleting(true);
        const { apiPath, title } = currentConfig;
        const apiUrl = `${apiPath}/${encodeURIComponent(itemId)}`;
        try {
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
    }, [currentConfig, refreshData]); // Dependencias correctas

    // --- Handler Confirmar Eliminación ---
    const handleOpenDeleteConfirmation = useCallback((item) => {
        if (!currentConfig || !item || isDeleting || !currentConfig.canDelete) return;
        const { idKey, title, columns } = currentConfig;
        const itemId = item[idKey];
        const nameField = columns.find(c => ['nombre_area', 'nombre_tipo', 'pregunta', 'nombre', 'RUT'].includes(c.id)) || columns[0];
        const itemDescription = nameField ? `${title.slice(0,-1)} "${item[nameField.id]}" (ID: ${itemId})` : `${title.slice(0,-1)} (ID: ${itemId})`;

        if (!itemId) { console.error("No se pudo obtener el ID para eliminar"); return; }

        mostrarConfirmacion(
            '¿Estás seguro?',
            `Se eliminará ${itemDescription}.\n\nEsta acción no se puede deshacer.`,
            'Sí, eliminar',
            'Cancelar',
            'error', // icono rojo
            '#d33',  // botón confirmar rojo
            (currentTheme.palette.mode === 'dark' ? '#424242' : '#bdbdbd') // botón cancelar mejorado
        ).then((isConfirmed) => {
            if (isConfirmed) {
                handleDeleteItem(itemId);
            }
        });
    }, [currentConfig, isDeleting, currentTheme.palette.mode, handleDeleteItem]); // Dependencias correctas

    // --- Estilos Celdas ---
    const headerCellStyle = useMemo(() => ({
        fontWeight: 'bold', fontSize: '0.9rem', padding: '10px 12px', whiteSpace: 'nowrap',
        backgroundColor: currentTheme.palette.primary.main, color: currentTheme.palette.primary.contrastText,
        borderBottom: `2px solid ${currentTheme.palette.divider}`, position: 'sticky', top: 0, zIndex: 10,
        transition: currentTheme.transitions.create(['background-color', 'color'], { duration: currentTheme.transitions.duration.short }),
    }), [currentTheme]);

    const bodyCellStyle = useMemo(() => ({
        fontSize: '0.875rem', color: currentTheme.palette.text.secondary, verticalAlign: 'top', padding: '10px 12px',
        transition: currentTheme.transitions.create(['background-color', 'color'], { duration: currentTheme.transitions.duration.shortest }),
        borderBottom: `1px solid ${currentTheme.palette.divider}`,
    }), [currentTheme]);

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

    // --- Renderizado del Contenido Principal ---
    const renderMainContent = () => {
        if (!currentSectionKey) {
            return (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', py: 6 }}>
                    <InfoOutlinedIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: 'text.secondary', fontStyle: 'italic', textAlign: 'center' }}>
                        Selecciona una opción en el menú lateral
                    </Typography>
                </Box>
            );
        }
        return (
            <TableCard
                title={currentConfig?.title || 'Administración'}
                columns={currentConfig?.columns || []}
                rows={paginatedData}
                loading={loading}
                error={error && `Error al cargar datos: ${error}`}
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                actionsHeader={currentConfig?.canAdd && (
                    <Fade in={currentConfig?.canAdd} timeout={400}>
                        <Tooltip title={`Agregar Nuevo/a ${currentConfig.title.slice(0, -1)}`}>
                            <span>
                                <Button
                                    variant="contained" color="primary" size="medium" startIcon={<AddIcon />} onClick={() => handleOpenModal('add')} disabled={loading || isSubmitting || isDeleting || !currentConfig?.canAdd}
                                    sx={{ whiteSpace: 'nowrap', height: '40px', borderRadius: '50px', boxShadow: currentTheme.shadows[2], transition: currentTheme.transitions.create(['background-color', 'transform', 'box-shadow'], { duration: currentTheme.transitions.duration.short }), '&:hover': { transform: 'translateY(-2px)', boxShadow: currentTheme.shadows[4], backgroundColor: currentTheme.palette.primary.dark }, '&:active': { transform: 'translateY(0)', boxShadow: currentTheme.shadows[2] } }}
                                > Agregar </Button>
                            </span>
                        </Tooltip>
                    </Fade>
                )}
                renderActions={currentSectionKey === 'respuestas' ? undefined : (item) => {
                    const canEditItem = currentConfig?.canEdit;
                    const canDeleteItem = currentConfig?.canDelete;
                    const actionsCellStyle = { padding: '6px 8px', textAlign: 'right', whiteSpace: 'nowrap' };
                    return (
                        <Box sx={actionsCellStyle}>
                            {canEditItem && (
                                <Tooltip title={`Editar ${currentConfig.title.slice(0,-1)}`}><span><IconButton size="small" onClick={() => handleOpenModal('edit', item)} color="primary" disabled={isSubmitting || isDeleting} sx={{ transition: currentTheme.transitions.create(['transform', 'background-color']), '&:hover': { transform: 'scale(1.15)', bgcolor: 'action.hover' } }}><EditIcon fontSize="inherit"/></IconButton></span></Tooltip>
                            )}
                            {canDeleteItem && (
                                <Tooltip title={`Eliminar ${currentConfig.title.slice(0,-1)}`}><span><IconButton size="small" onClick={() => handleOpenDeleteConfirmation(item)} color="error" disabled={isSubmitting || isDeleting} sx={{ transition: currentTheme.transitions.create(['transform', 'background-color']), '&:hover': { transform: 'scale(1.15)', bgcolor: 'action.hover' } }}><DeleteIcon fontSize="inherit"/></IconButton></span></Tooltip>
                            )}
                        </Box>
                    );
                }}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                totalCount={filteredData.length}
                headerCellStyle={headerCellStyle}
                bodyCellStyle={bodyCellStyle}
                minWidth={650}
                noResultsMsg={searchTerm ? 'No se encontraron resultados que coincidan con la búsqueda.' : `No hay ${(currentConfig?.title || '').toLowerCase()} para mostrar.`}
                context={contextForRender}
            />
        );
    };

    // --- Renderizado ---
    // (El JSX de renderizado no necesita cambios funcionales, solo los ajustes ya hechos
    // en los handlers y la eliminación de themeHook)
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

    return (
        <ThemeProvider theme={currentTheme}>
            <CssBaseline />
            <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
                {/* Navbar */}
                <Navbar toggleTheme={handleToggleTheme} toggleSidebar={handleDrawerToggle} title="Portal Administración"/>

                {/* Sidebar */}
                <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
                     {/* Mobile Drawer */}
                    <Drawer
                        variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }}
                        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, bgcolor: 'background.paper', borderRight: `1px solid ${currentTheme.palette.divider}`, top: { xs: `${APP_BAR_HEIGHT}px`, md: `${APP_BAR_HEIGHT}px` }, height: { xs: `calc(100vh - ${APP_BAR_HEIGHT}px)`, md: `calc(100vh - ${APP_BAR_HEIGHT}px)` }, transition: currentTheme.transitions.create('transform', { easing: currentTheme.transitions.easing.sharp, duration: currentTheme.transitions.duration.enteringScreen }), overflowX: 'hidden' } }}
                    >
                        <Sidebar
                            panelType="admin"
                            currentSection={currentSectionKey}
                            onSelectSection={handleSelectSection}
                            onCloseDrawer={handleDrawerToggle}
                        />
                    </Drawer>
                     {/* Desktop Drawer */}
                    <Drawer
                        variant="permanent" open sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, top: `${APP_BAR_HEIGHT}px`, height: `calc(100vh - ${APP_BAR_HEIGHT}px)`, borderRight: `1px solid ${currentTheme.palette.divider}`, bgcolor: 'background.paper', overflowY: 'auto', transition: currentTheme.transitions.create('width', { easing: currentTheme.transitions.easing.sharp, duration: currentTheme.transitions.duration.enteringScreen }), overflowX: 'hidden' } }}
                    >
                        <Sidebar
                            panelType="admin"
                            currentSection={currentSectionKey}
                            onSelectSection={handleSelectSection}
                            onCloseDrawer={handleDrawerToggle}
                        />
                    </Drawer>
                </Box>

                {/* Contenido Principal */}
                <Box
                    component="main"
                    sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2, md: 3 }, width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` }, display: 'flex', flexDirection: 'column', mt: `${APP_BAR_HEIGHT}px`, height: `calc(100vh - ${APP_BAR_HEIGHT}px)`, overflow: 'hidden', bgcolor: 'background.default', transition: currentTheme.transitions.create('padding', { duration: currentTheme.transitions.duration.short }) }}
                >
                    {/* Main Content Card (reemplazado por TableCard) */}
                    {renderMainContent()}

                </Box> {/* Fin Main */}

                {/* --- Modal Genérico (Add/Edit) --- */}
                {currentConfig && (
                    <Dialog
                        open={isModalOpen}
                        onClose={handleCloseModal}
                        maxWidth="sm"
                        fullWidth
                        TransitionComponent={Fade}
                        transitionDuration={300}
                        disableEscapeKeyDown={isSubmitting}
                        PaperProps={{
                            sx: {
                                borderRadius: 4,
                                boxShadow: currentTheme.shadows[8],
                                bgcolor: 'background.paper',
                                border: `2.5px solid ${currentTheme.palette.primary.main}`,
                                position: 'relative',
                                overflow: 'hidden',
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
                            bgcolor: currentTheme.palette.primary.main,
                            color: theme => theme.palette.mode === 'dark' ? '#fff' : currentTheme.palette.primary.contrastText,
                            fontWeight: 700,
                            fontSize: '1.08rem', // Más pequeño
                            letterSpacing: 0.5,
                            borderBottom: `1.5px solid ${currentTheme.palette.divider}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            textTransform: 'uppercase',
                            boxShadow: 'none',
                        }}>
                            {modalMode === 'add' ? 'Agregar' : 'Editar'} {currentConfig.title.slice(0,-1)}
                            {modalMode === 'edit' && editingItem && ` (ID: ${editingItem[currentConfig.idKey]})`}
                            {isSubmitting && <CircularProgress size={24} color="inherit" sx={{ ml: 2 }} />}
                        </DialogTitle>
                        {currentConfig.formFields && (
                            <DialogContent dividers sx={{
                                p: { xs: 2.5, sm: 3, md: 4 },
                                bgcolor: 'background.default',
                                border: 'none',
                                minHeight: 180,
                                color: theme => theme.palette.mode === 'dark' ? '#fff' : currentTheme.palette.text.primary,
                                ...darkModalTextSx(currentTheme),
                            }}>
                                <Stack spacing={2.5}>
                                    {currentConfig.formFields
                                        .filter(field => !((modalMode === 'edit' && field.addOnly) || (modalMode === 'add' && field.editOnly)))
                                        .map(field => {
                                            const commonProps = {
                                                key: field.name, name: field.name, label: field.label,
                                                value: formData[field.name] ?? '', onChange: handleFormChange, fullWidth: true,
                                                required: field.required && (modalMode === 'add' || (modalMode === 'edit' && !field.optionalOnEdit)),
                                                disabled: isSubmitting || (modalMode === 'edit' && field.disabledOnEdit) || (field.name === 'password' && !!formData.deletePassword),
                                                autoFocus: field.autoFocus && modalMode === 'add',
                                                variant: 'outlined', size: 'medium'
                                            };
                                            const helperText = modalMode === 'edit' ? (field.helperTextEdit ?? field.helperText) : (field.helperTextAdd ?? field.helperText);

                                            if (field.type === 'select') {
                                                const options = typeof field.options === 'function' ? field.options({ areas, tiposSolicitudesAdmin }) : field.options;
                                                return (
                                                    <FormControl fullWidth key={field.name} required={commonProps.required} disabled={commonProps.disabled} variant="outlined" size={commonProps.size}>
                                                        <InputLabel id={`${modalMode}-${field.name}-label`}>{field.label}</InputLabel>
                                                        <Select labelId={`${modalMode}-${field.name}-label`} label={field.label} {...commonProps} value={formData[field.name] ?? ''}>
                                                            {field.placeholder && <MenuItem value=""><em>{field.placeholder}</em></MenuItem>}
                                                            {(options || []).map((opt, idx) => { const value = field.getOptionValue(opt); const label = field.getOptionLabel(opt); return <MenuItem key={value ?? idx} value={value}>{label}</MenuItem>; })}
                                                        </Select>
                                                        {helperText && <Typography variant="caption" sx={{ pl: 1.5, pt: 0.5, color: 'text.secondary' }}>{helperText}</Typography>}
                                                    </FormControl>
                                                );
                                            } else if (field.type === 'textarea') {
                                                return <TextField {...commonProps} multiline rows={field.rows || 3} helperText={helperText} />;
                                            } else if (field.type === 'checkbox') {
                                                return ( <FormControlLabel control={ <Checkbox name={field.name} checked={!!formData[field.name]} onChange={handleFormChange} disabled={commonProps.disabled} color={field.name === 'deletePassword' ? 'warning' : 'primary'} sx={{ '& .MuiSvgIcon-root': { fontSize: 24 } }} /> } label={field.label} key={field.name} /> );
                                            } else if (field.type === 'password') {
                                                return ( <TextField {...commonProps} type={showPassword ? 'text' : 'password'} helperText={helperText} InputProps={{ endAdornment: ( <InputAdornment position="end"> <IconButton aria-label="toggle password visibility" onClick={handleToggleShowPassword} onMouseDown={handleMouseDownPassword} edge="end" disabled={commonProps.disabled} sx={{ transition: currentTheme.transitions.create('background-color'), '&:hover': { bgcolor: 'action.hover' } }}> {showPassword ? <VisibilityOff /> : <Visibility />} </IconButton> </InputAdornment> ), }} /> );
                                            } else { return <TextField {...commonProps} type={field.type || 'text'} helperText={helperText} />; }
                                        })}
                                </Stack>
                            </DialogContent>
                        )}
                        <DialogActions sx={{
                            px: { xs: 2.5, sm: 3, md: 4 },
                            py: 2,
                            bgcolor: 'background.paper',
                            borderTop: `1.5px solid ${currentTheme.palette.divider}`,
                            boxShadow: 'none',
                            justifyContent: 'space-between',
                            color: theme => theme.palette.mode === 'dark' ? '#fff' : currentTheme.palette.text.primary,
                            ...darkModalTextSx(currentTheme),
                        }}>
                            <Button onClick={handleCloseModal} variant="outlined" color="secondary" sx={{
                                borderRadius: 3,
                                fontWeight: 600,
                                px: 3,
                                py: 1,
                                boxShadow: 1,
                                textTransform: 'none',
                                fontSize: '1rem',
                                transition: 'all 0.2s',
                            }} disabled={isSubmitting}>Cancelar</Button>
                            <Button onClick={handleSubmit} variant="contained" color="primary" sx={{
                                borderRadius: 3,
                                fontWeight: 700,
                                px: 3,
                                py: 1,
                                minWidth: '150px',
                                boxShadow: 3,
                                textTransform: 'none',
                                fontSize: '1.08rem',
                                transition: 'all 0.2s',
                            }} disabled={isSubmitting} startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}>
                                {isSubmitting ? 'Guardando...' : (modalMode === 'add' ? 'Agregar' : 'Guardar Cambios')}
                            </Button>
                        </DialogActions>
                    </Dialog>
                )}

            </Box> {/* Fin Flex Principal */}
        </ThemeProvider>
    );
}
export default Administrador;