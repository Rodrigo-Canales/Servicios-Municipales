import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import Swal from 'sweetalert2';
import {
    Box, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Button, CircularProgress, Fade,
    Card, CardContent, CssBaseline, ThemeProvider, Drawer, useMediaQuery,
    TextField, InputAdornment, Tooltip, Alert, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel,
    Checkbox, FormControlLabel,
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
import { mostrarAlertaExito, mostrarAlertaError, mostrarAlertaAdvertencia } from "../../utils/alertUtils";

// --- Constantes ---
const APP_BAR_HEIGHT = 64;
const DRAWER_WIDTH = 240;
const ENTITY_TYPES = {
    SOLICITUD: 'solicitud',
    AREA: 'area',
    TIPO_SOLICITUD: 'tipo_solicitud',
    USUARIO: 'usuario',
    RESPUESTA: 'respuesta',
    PREGUNTA_FRECUENTE: 'pregunta-frecuente' // Mantenido con guion
};
const ROLES_PERMITIDOS = ['Administrador', 'Funcionario', 'Vecino'];
const DEFAULT_ROWS_PER_PAGE = 10;

// --- Componente Principal ---
function Administrador() {
    // --- Estados ---
    const [mode, setMode] = useState("light");
    const [mobileOpen, setMobileOpen] = useState(false);
    const [currentSection, setCurrentSection] = useState(null); // e.g., 'preguntas-frecuentes'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [solicitudes, setSolicitudes] = useState([]);
    const [areas, setAreas] = useState([]);
    const [tiposSolicitudesAdmin, setTiposSolicitudesAdmin] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [respuestas, setRespuestas] = useState([]);
    const [preguntasFrecuentes, setPreguntasFrecuentes] = useState([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editingItemType, setEditingItemType] = useState(null); // e.g., 'pregunta-frecuente'
    const [formData, setFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showModalPassword, setShowModalPassword] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addFormData, setAddFormData] = useState({});
    const [isAdding, setIsAdding] = useState(false);
    const [showAddModalPassword, setShowAddModalPassword] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

    // --- Tema y Media Queries ---
    const currentTheme = useMemo(() => (mode === "light" ? lightTheme : darkTheme), [mode]);
    const isLargeScreen = useMediaQuery(currentTheme.breakpoints.up('md'));
    const isSmallScreen = useMediaQuery(currentTheme.breakpoints.down('sm'));

    // --- Handlers Layout ---
    const toggleTheme = useCallback(() => setMode((prev) => (prev === "light" ? "dark" : "light")), []);
    const handleDrawerToggle = useCallback(() => setMobileOpen(prev => !prev), []);
    const handleDrawerClose = useCallback(() => setMobileOpen(false), []);
    const handleSearchChange = useCallback((event) => { setSearchTerm(event.target.value); setPage(0); }, []);

    // --- Handler Selección Sidebar ---
    const handleSelectSection = useCallback((sectionName) => {
        if (sectionName !== currentSection) { setCurrentSection(sectionName); setSearchTerm(""); setIsEditModalOpen(false); setIsAddModalOpen(false); setPage(0); setRowsPerPage(DEFAULT_ROWS_PER_PAGE); }
        handleDrawerClose();
    }, [currentSection, handleDrawerClose]);

    // --- Fetch Genérico ---
    const fetchGenericData = useCallback(async (endpoint, sectionIdentifier) => {
        console.log(`[fetchGenericData] Fetching ${sectionIdentifier}...`); try { const response = await axios.get(endpoint); const data = response.data; let potentialData = null;
            // Adaptar según la estructura REAL de la respuesta API para cada endpoint
            if (Array.isArray(data)) potentialData = data;
            else if (data && Array.isArray(data[sectionIdentifier])) potentialData = data[sectionIdentifier]; // e.g., data['preguntas-frecuentes']
            else if (sectionIdentifier === 'solicitudes' && data?.solicitudes) potentialData = data.solicitudes;
            else if (sectionIdentifier === 'respuestas' && data?.respuestas) potentialData = data.respuestas;
            else if (sectionIdentifier === 'preguntas-frecuentes' && data?.preguntas_frecuentes) potentialData = data.preguntas_frecuentes; // Asumiendo que la API devuelve { preguntas_frecuentes: [...] }
             else if (sectionIdentifier === 'tipos-solicitudes' && data?.tipos_solicitudes) potentialData = data.tipos_solicitudes; // Añadir si es necesario
             else if (sectionIdentifier === 'areas' && data?.areas) potentialData = data.areas; // Añadir si es necesario
             else if (sectionIdentifier === 'usuarios' && data?.usuarios) potentialData = data.usuarios; // Añadir si es necesario

            if (Array.isArray(potentialData)) { console.log(`[fetchGenericData] Success: ${potentialData.length} for ${sectionIdentifier}`); if (sectionIdentifier === 'usuarios') return potentialData.map(u => { const { hash_password: _, ...rest } = u; return rest; }); return potentialData; }
            else { console.warn(`[fetchGenericData] Unexpected format or key for ${sectionIdentifier}:`, data); return []; } // Mejor log si falla
        } catch (err) { console.error(`[fetchGenericData] Error ${sectionIdentifier}:`, err); throw err; }
    }, []);


    // --- Wrappers de Fetch ---
    const fetchSolicitudes = useCallback(() => fetchGenericData('/api/solicitudes', 'solicitudes'), [fetchGenericData]);
    const fetchAreas = useCallback(() => fetchGenericData('/api/areas', 'areas'), [fetchGenericData]);
    const fetchTiposSolicitudesAdmin = useCallback(() => fetchGenericData('/api/tipos_solicitudes', 'tipos-solicitudes'), [fetchGenericData]);
    const fetchUsuarios = useCallback(() => fetchGenericData('/api/usuarios', 'usuarios'), [fetchGenericData]);
    const fetchRespuestas = useCallback(() => fetchGenericData('/api/respuestas', 'respuestas'), [fetchGenericData]);
    const fetchPreguntasFrecuentes = useCallback(() => fetchGenericData('/api/preguntas_frecuentes', 'preguntas-frecuentes'), [fetchGenericData]); // sectionIdentifier debe coincidir con la clave esperada en la API o el identificador usado en fetchGenericData

    // --- Efecto Principal para Cargar Datos ---
    useEffect(() => {
        if (!currentSection) { setLoading(false); setError(null); setSolicitudes([]); setAreas([]); setTiposSolicitudesAdmin([]); setUsuarios([]); setRespuestas([]); setPreguntasFrecuentes([]); return; }
        let isMounted = true; const section = currentSection;
        const loadData = async () => { if (isMounted) { setLoading(true); setError(null); setPage(0); }
            // Reset specific state based on section BEFORE fetching
            switch (section) { case 'solicitudes': setSolicitudes([]); break; case 'areas': setAreas([]); break; case 'tipos-solicitudes': setTiposSolicitudesAdmin([]); break; case 'usuarios': setUsuarios([]); break; case 'respuestas': setRespuestas([]); break; case 'preguntas-frecuentes': setPreguntasFrecuentes([]); break; default: break; }
            const needsAreas = ['tipos-solicitudes', 'usuarios', 'areas', 'preguntas-frecuentes'].includes(section);
            const needsTiposSolicitudes = ['tipos-solicitudes', 'preguntas-frecuentes'].includes(section);
            let fetchFn; let setDataFn;
            switch (section) { case 'solicitudes': fetchFn = fetchSolicitudes; setDataFn = setSolicitudes; break; case 'areas': fetchFn = fetchAreas; setDataFn = setAreas; break; case 'tipos-solicitudes': fetchFn = fetchTiposSolicitudesAdmin; setDataFn = setTiposSolicitudesAdmin; break; case 'usuarios': fetchFn = fetchUsuarios; setDataFn = setUsuarios; break; case 'respuestas': fetchFn = fetchRespuestas; setDataFn = setRespuestas; break; case 'preguntas-frecuentes': fetchFn = fetchPreguntasFrecuentes; setDataFn = setPreguntasFrecuentes; break; default: if (isMounted) { setError(`Sección desconocida: ${section}`); setLoading(false); } return; }
            try {
                // Fetch primary data first, only if not already fetched as dependency
                if (!(['areas', 'tipos-solicitudes'].includes(section) && (needsAreas || needsTiposSolicitudes))) {
                    const primaryData = await fetchFn();
                     if (isMounted && currentSection === section) { // Double check
                        setDataFn(primaryData);
                    } else {
                         // Section changed while fetching primary data, abort.
                        if (isMounted) setLoading(false); // Ensure loading stops if we bail early
                        return;
                    }
                }

                // Fetch dependencies IF needed for the CURRENT section
                if (needsAreas && isMounted && currentSection === section) {
                    try {
                        const areasData = await fetchAreas();
                        if (isMounted && currentSection === section) { // Double check
                            setAreas(areasData);
                            if (section === 'areas') { // If areas was the primary data
                                setDataFn(areasData); // Update primary state as well
                            }
                        } else { if (isMounted) setLoading(false); return; }
                    } catch (areasErr) {
                        console.error(`[useEffect] Error loading areas dependency:`, areasErr);
                        if (isMounted && !error && currentSection === section) setError('Error al cargar datos de áreas asociadas.');
                        if (section === 'areas' && isMounted && currentSection === section) setDataFn([]); // Clear primary if it failed
                    }
                }

                if (needsTiposSolicitudes && isMounted && currentSection === section) {
                    try {
                        const tiposData = await fetchTiposSolicitudesAdmin();
                        if (isMounted && currentSection === section) { // Double check
                            setTiposSolicitudesAdmin(tiposData);
                            if (section === 'tipos-solicitudes') { // If tipos was the primary data
                                setDataFn(tiposData); // Update primary state as well
                            }
                        } else { if (isMounted) setLoading(false); return; }
                    } catch (tiposErr) {
                        console.error(`[useEffect] Error loading tipos dependency:`, tiposErr);
                        if (isMounted && !error && currentSection === section) setError('Error al cargar datos de tipos de solicitud asociados.');
                        if (section === 'tipos-solicitudes' && isMounted && currentSection === section) setDataFn([]); // Clear primary if it failed
                    }
                }

            } catch (err) {
                if (isMounted && currentSection === section) { // Check section again
                    const apiError = err.response?.data?.message;
                    setError(apiError || err.message || `Error al cargar ${section}.`);
                }
            } finally {
                 if (isMounted && currentSection === section) { // Check section one last time
                    setLoading(false);
                }
            }
        };
        loadData();
        return () => { isMounted = false; };
    }, [currentSection, fetchSolicitudes, fetchAreas, fetchTiposSolicitudesAdmin, fetchUsuarios, fetchRespuestas, fetchPreguntasFrecuentes, error]); // Removed 'error' dependency to avoid potential loops

    // --- Cerrar drawer ---
    useEffect(() => { if (isLargeScreen) setMobileOpen(false); }, [isLargeScreen]);

    // --- Mapas ---
    const areaMap = useMemo(() => { const map = new Map(); if (Array.isArray(areas)) areas.forEach(a => map.set(a.id_area, a.nombre_area)); return map; }, [areas]);
    const tipoSolicitudMap = useMemo(() => { const map = new Map(); if (Array.isArray(tiposSolicitudesAdmin)) tiposSolicitudesAdmin.forEach(t => map.set(t.id_tipo, t.nombre_tipo)); return map; }, [tiposSolicitudesAdmin]);

    // --- Filtrado y Ordenado ---
    const filteredData = useMemo(() => {
        if (loading || error || !currentSection) return [];
        let baseData = [];
        switch (currentSection) {
            case 'solicitudes': baseData = solicitudes; break;
            case 'areas': baseData = areas; break;
            case 'tipos-solicitudes': baseData = tiposSolicitudesAdmin; break;
            case 'usuarios': baseData = usuarios; break;
            case 'respuestas': baseData = respuestas; break;
            case 'preguntas-frecuentes': baseData = preguntasFrecuentes; break;
            default: return [];
        }
        if (!Array.isArray(baseData)) return [];
        let dataToFilter = [...baseData]; // Copy
        if (currentSection === 'preguntas-frecuentes') {
            dataToFilter.sort((a, b) => (a.id_pregunta || 0) - (b.id_pregunta || 0)); // Sort by ID
        }
        if (!searchTerm.trim()) { return dataToFilter; }
        const lowerSearch = searchTerm.toLowerCase();
        try {
            let filteredResult;
            switch (currentSection) {
                case 'solicitudes': filteredResult = dataToFilter.filter(s => s.id_formateado?.toString().toLowerCase().includes(lowerSearch) || s.RUT_ciudadano?.toLowerCase().includes(lowerSearch) || s.nombre_tipo?.toLowerCase().includes(lowerSearch) || s.estado?.toLowerCase().includes(lowerSearch) || (s.correo_notificacion && s.correo_notificacion.toLowerCase().includes(lowerSearch)) || (s.ruta_carpeta && s.ruta_carpeta.toLowerCase().includes(lowerSearch)) ); break;
                case 'areas': filteredResult = dataToFilter.filter(a => a.id_area?.toString().toLowerCase().includes(lowerSearch) || a.nombre_area?.toLowerCase().includes(lowerSearch) ); break;
                case 'tipos-solicitudes': filteredResult = dataToFilter.filter(t => t.id_tipo?.toString().toLowerCase().includes(lowerSearch) || t.nombre_tipo?.toLowerCase().includes(lowerSearch) || (t.descripcion && t.descripcion.toLowerCase().includes(lowerSearch)) || (t.area_id && (areaMap.get(t.area_id) || '').toLowerCase().includes(lowerSearch)) ); break;
                case 'usuarios': filteredResult = dataToFilter.filter(u => (u.RUT && u.RUT.toLowerCase().includes(lowerSearch)) || (u.nombre && u.nombre.toLowerCase().includes(lowerSearch)) || (u.apellido && u.apellido.toLowerCase().includes(lowerSearch)) || (u.correo_electronico && u.correo_electronico.toLowerCase().includes(lowerSearch)) || (u.rol && u.rol.toLowerCase().includes(lowerSearch)) || (u.area_id && (areaMap.get(u.area_id) || '').toLowerCase().includes(lowerSearch)) ); break;
                case 'respuestas': filteredResult = dataToFilter.filter(r => r.id_respuesta_formateado?.toLowerCase().includes(lowerSearch) || r.RUT_trabajador?.toLowerCase().includes(lowerSearch) || r.nombre_trabajador?.toLowerCase().includes(lowerSearch) || r.apellido_trabajador?.toLowerCase().includes(lowerSearch) || r.id_solicitud_formateado?.toLowerCase().includes(lowerSearch) || r.nombre_tipo_solicitud?.toLowerCase().includes(lowerSearch) ); break;
                case 'preguntas-frecuentes': filteredResult = dataToFilter.filter(pf => pf.pregunta?.toLowerCase().includes(lowerSearch) || pf.respuesta?.toLowerCase().includes(lowerSearch) || (pf.id_tipo && (tipoSolicitudMap.get(pf.id_tipo) || '').toLowerCase().includes(lowerSearch)) ); break;
                default: filteredResult = []; break;
            }
            return filteredResult;
        } catch (filterError) { console.error("[filteredData] Error:", filterError); return []; }
    }, [currentSection, searchTerm, solicitudes, areas, tiposSolicitudesAdmin, usuarios, respuestas, preguntasFrecuentes, loading, error, areaMap, tipoSolicitudMap]);


    // --- Helper Identificador --- (CORREGIDO)
    const sectionIdentifierFromType = useCallback((typeOrSection) => {
        // No reemplaces guiones aquí, compara directamente
        switch (typeOrSection) {
            case ENTITY_TYPES.AREA:             // 'area'
            case 'areas':                       // 'areas'
                return 'areas';                 // Nombre de sección usado en currentSection

            case ENTITY_TYPES.TIPO_SOLICITUD:   // 'tipo_solicitud'
            case 'tipos-solicitudes':           // 'tipos-solicitudes'
                return 'tipos-solicitudes';     // Nombre de sección usado en currentSection

            case ENTITY_TYPES.USUARIO:          // 'usuario'
            case 'usuarios':                    // 'usuarios'
                return 'usuarios';              // Nombre de sección usado en currentSection

            case ENTITY_TYPES.SOLICITUD:        // 'solicitud'
            case 'solicitudes':                 // 'solicitudes'
                return 'solicitudes';           // Nombre de sección usado en currentSection

            case ENTITY_TYPES.RESPUESTA:        // 'respuesta'
            case 'respuestas':                  // 'respuestas'
                return 'respuestas';            // Nombre de sección usado en currentSection

            case ENTITY_TYPES.PREGUNTA_FRECUENTE: // 'pregunta-frecuente'
            case 'preguntas-frecuentes':        // 'preguntas-frecuentes'
                return 'preguntas-frecuentes';  // Nombre de sección usado en currentSection

            default:
                console.warn("Tipo/Sección desconocida en sectionIdentifierFromType:", typeOrSection);
                return null;
        }
    }, []); // No dependencies needed for this pure function


    // --- Handlers Modal Edición ---
    const handleOpenEditModal = useCallback((item, type) => { if (!item || !type || type === ENTITY_TYPES.RESPUESTA) return; setEditingItem(item); setEditingItemType(type); setShowModalPassword(false); let initialFormData = {}; switch (type) { case ENTITY_TYPES.SOLICITUD: initialFormData = { estado: item.estado || '', correo_notificacion: item.correo_notificacion || '' }; break; case ENTITY_TYPES.AREA: initialFormData = { nombre_area: item.nombre_area || '' }; break; case ENTITY_TYPES.TIPO_SOLICITUD: initialFormData = { nombre_tipo: item.nombre_tipo || '', area_id: item.area_id || '', descripcion: item.descripcion || '' }; break; case ENTITY_TYPES.USUARIO: initialFormData = { correo_electronico: item.correo_electronico || '', rol: item.rol || '', area_id: item.area_id || '', password: '', deletePassword: false }; break; case ENTITY_TYPES.PREGUNTA_FRECUENTE: initialFormData = { pregunta: item.pregunta || '', respuesta: item.respuesta || '', id_tipo: item.id_tipo || '' }; break; default: return; } setFormData(initialFormData); setIsEditModalOpen(true); }, []);
    const handleCloseEditModal = useCallback(() => { if (!isSubmitting) { setIsEditModalOpen(false); setTimeout(() => { setEditingItem(null); setEditingItemType(null); setFormData({}); setShowModalPassword(false); }, 300); } }, [isSubmitting]);
    const handleFormChange = useCallback((event) => { const { name, value, type, checked } = event.target; const newValue = type === 'checkbox' ? checked : value; setFormData(prev => { const updatedData = { ...prev, [name]: newValue }; if (name === 'deletePassword' && newValue === true) updatedData.password = ''; return updatedData; }); }, []);
    const handleClickShowPasswordModal = useCallback(() => { setShowModalPassword((show) => !show); }, []);
    const handleMouseDownPasswordModal = useCallback((event) => { event.preventDefault(); }, []);

    // --- Submit Edición GENÉRICO ---
    const handleSubmitEdit = useCallback(async () => {
        if (!editingItem || !editingItemType) return;
        let initialDataForComparison = {};
        // Define initial data for comparison based on editingItemType
        switch (editingItemType) { case ENTITY_TYPES.SOLICITUD: initialDataForComparison = { estado: editingItem.estado || '', correo_notificacion: editingItem.correo_notificacion || '' }; break; case ENTITY_TYPES.AREA: initialDataForComparison = { nombre_area: editingItem.nombre_area || '' }; break; case ENTITY_TYPES.TIPO_SOLICITUD: initialDataForComparison = { nombre_tipo: editingItem.nombre_tipo || '', area_id: editingItem.area_id || '', descripcion: editingItem.descripcion || '' }; break; case ENTITY_TYPES.USUARIO: initialDataForComparison = { correo_electronico: editingItem.correo_electronico || '', rol: editingItem.rol || '', area_id: editingItem.area_id || '', password: '', deletePassword: false }; break; case ENTITY_TYPES.PREGUNTA_FRECUENTE: initialDataForComparison = { pregunta: editingItem.pregunta || '', respuesta: editingItem.respuesta || '', id_tipo: editingItem.id_tipo || '' }; break; default: return; }
        let hasChanged = false;
        // Compare formData with initialDataForComparison
        for (const key in formData) { if (!Object.prototype.hasOwnProperty.call(initialDataForComparison, key)) continue; if (key === 'password' && formData.deletePassword === true) continue; const initialValue = initialDataForComparison[key]; const currentValue = formData[key]; const compInitial = ['area_id', 'id_tipo'].includes(key) ? (initialValue || '') : String(initialValue ?? ''); const compCurrent = ['area_id', 'id_tipo'].includes(key) ? (currentValue || '') : String(currentValue ?? ''); if (compCurrent !== compInitial) { hasChanged = true; break; } }
        if (!hasChanged && !(editingItemType === ENTITY_TYPES.USUARIO && formData.deletePassword === true && !initialDataForComparison.deletePassword)) { // Also check if deletePassword changed
            mostrarAlertaExito("Sin cambios", "No se detectaron cambios para guardar."); handleCloseEditModal(); return; }

        setIsSubmitting(true); let apiUrl = ''; let itemId = null; let payload = {}; let fetchFnAfterUpdate = null; let setDataFnAfterUpdate = null; let successMessage = ''; let idField = ''; const httpMethod = 'put';
        try {
            switch (editingItemType) {
                case ENTITY_TYPES.SOLICITUD: idField='id_solicitud'; itemId=editingItem[idField]; apiUrl=`/api/solicitudes/${itemId}`; payload={ estado: formData.estado, correo_notificacion: formData.correo_notificacion || null }; fetchFnAfterUpdate=fetchSolicitudes; setDataFnAfterUpdate=setSolicitudes; successMessage='Solicitud actualizada.'; break;
                case ENTITY_TYPES.AREA: idField='id_area'; itemId=editingItem[idField]; apiUrl=`/api/areas/${itemId}`; payload={nombre_area: formData.nombre_area}; fetchFnAfterUpdate=fetchAreas; setDataFnAfterUpdate=setAreas; successMessage='Área actualizada.'; break;
                case ENTITY_TYPES.TIPO_SOLICITUD: idField='id_tipo'; itemId=editingItem[idField]; apiUrl=`/api/tipos_solicitudes/${itemId}`; payload={nombre_tipo: formData.nombre_tipo, area_id: formData.area_id || null, descripcion: formData.descripcion || ''}; fetchFnAfterUpdate=fetchTiposSolicitudesAdmin; setDataFnAfterUpdate=setTiposSolicitudesAdmin; successMessage='Tipo de solicitud actualizado.'; break;
                case ENTITY_TYPES.USUARIO: idField = 'RUT'; itemId = editingItem[idField]; if (!itemId) throw new Error("RUT no encontrado."); apiUrl = `/api/usuarios/${encodeURIComponent(itemId)}`; payload = { correo_electronico: formData.correo_electronico, rol: formData.rol, area_id: formData.area_id || null }; if (formData.deletePassword === true) payload.deletePassword = true; else if (formData.password?.trim()) payload.password = formData.password; fetchFnAfterUpdate = fetchUsuarios; setDataFnAfterUpdate = setUsuarios; successMessage = 'Usuario actualizado.'; break;
                case ENTITY_TYPES.PREGUNTA_FRECUENTE: idField='id_pregunta'; itemId=editingItem[idField]; apiUrl=`/api/preguntas_frecuentes/${itemId}`; payload={ pregunta: formData.pregunta, respuesta: formData.respuesta, id_tipo: formData.id_tipo }; fetchFnAfterUpdate=fetchPreguntasFrecuentes; setDataFnAfterUpdate=setPreguntasFrecuentes; successMessage='Pregunta frecuente actualizada.'; break;
                default: throw new Error(`Tipo desconocido o no editable: ${editingItemType}`);
            }
            const loggedPayload = editingItemType === ENTITY_TYPES.USUARIO ? { ...payload, password: '***' } : payload; console.log(`[handleSubmitEdit] ${httpMethod.toUpperCase()} ${apiUrl}`, loggedPayload);
            await axios[httpMethod](apiUrl, payload);

            // --- Refresh Logic ---
            const targetSection = sectionIdentifierFromType(editingItemType); // Use the corrected function
            console.log(`[handleSubmitEdit] targetSection: ${targetSection}, currentSection: ${currentSection}`); // DEBUG LOG
            const currentSectionMatches = targetSection === currentSection;

            if (currentSectionMatches && fetchFnAfterUpdate && setDataFnAfterUpdate) {
                try {
                    console.log(`[handleSubmitEdit] Refetching ${currentSection}...`);
                    const updatedData = await fetchFnAfterUpdate();
                     // Double check section hasn't changed *during* the async fetch
                    if (sectionIdentifierFromType(editingItemType) === currentSection) {
                         console.log(`[handleSubmitEdit] Updating state for ${currentSection}`); // DEBUG LOG
                        setDataFnAfterUpdate(updatedData);
                        setPage(0);
                        await mostrarAlertaExito('Actualizado', `${successMessage} La tabla se ha recargado.`);
                    } else {
                          console.log(`[handleSubmitEdit] Section changed during refetch. No state update.`); // DEBUG LOG
                        await mostrarAlertaExito('Actualizado', successMessage);
                    }
                } catch (refetchErr) {
                    console.error("[handleSubmitEdit] Refetch Error:", refetchErr);
                    await mostrarAlertaError('Actualización Parcial', `${successMessage} pero la tabla no pudo recargarse.`);
                }
            } else {
                console.log(`[handleSubmitEdit] No refetch needed or possible. currentSectionMatches=${currentSectionMatches}`); // DEBUG LOG
                await mostrarAlertaExito('Actualizado', successMessage);
            }
            handleCloseEditModal();
        } catch (err) { console.error(`[handleSubmitEdit] Error:`, err); const errorMsg = err.response?.data?.message || err.message || `No se pudo actualizar.`; await mostrarAlertaError('Error al Actualizar', errorMsg); }
        finally { setIsSubmitting(false); }
    }, [ editingItem, editingItemType, formData, currentSection, handleCloseEditModal, setPage, fetchSolicitudes, setSolicitudes, fetchAreas, setAreas, fetchTiposSolicitudesAdmin, setTiposSolicitudesAdmin, fetchUsuarios, setUsuarios, fetchPreguntasFrecuentes, setPreguntasFrecuentes, sectionIdentifierFromType ]); // Added sectionIdentifierFromType

    // --- Handlers Modal Agregar ---
    const handleOpenAddModal = useCallback(() => { if (!currentSection || ['solicitudes', 'respuestas'].includes(currentSection)) return; let initialAddFormData = {}; switch (currentSection) { case 'areas': initialAddFormData = { nombre_area: '' }; break; case 'tipos-solicitudes': initialAddFormData = { nombre_tipo: '', descripcion: '', area_id: '' }; break; case 'usuarios': initialAddFormData = { rut: '', nombre: '', apellido: '', correo_electronico: '', password: '', rol: '', area_id: '' }; break; case 'preguntas-frecuentes': initialAddFormData = { pregunta: '', respuesta: '', id_tipo: '' }; break; default: console.error("Tipo desconocido en Add Modal:", currentSection); return; } setAddFormData(initialAddFormData); setShowAddModalPassword(false); setIsAddModalOpen(true); }, [currentSection]);
    const handleCloseAddModal = useCallback(() => { if (!isAdding) { setIsAddModalOpen(false); setTimeout(() => { setAddFormData({}); setShowAddModalPassword(false); }, 300); } }, [isAdding]);
    const handleAddFormChange = useCallback((event) => { const { name, value } = event.target; setAddFormData(prev => ({ ...prev, [name]: value })); }, []);
    const handleClickShowPasswordAddModal = useCallback(() => { setShowAddModalPassword((show) => !show); }, []);
    const handleMouseDownPasswordAddModal = useCallback((event) => { event.preventDefault(); }, []);

    // --- Submit Agregar GENÉRICO ---
    const handleSubmitAdd = useCallback(async () => {
        if (!currentSection || !addFormData) return; let isValid = true; let errorMessage = '';
        // Validations
        switch (currentSection) { case 'areas': if (!addFormData.nombre_area?.trim()) { isValid = false; errorMessage = 'Nombre del área obligatorio.'; } break; case 'tipos-solicitudes': if (!addFormData.nombre_tipo?.trim()) { isValid = false; errorMessage = 'Nombre del tipo obligatorio.'; } else if (!addFormData.descripcion?.trim()) { isValid = false; errorMessage = 'Descripción obligatoria.'; } else if (!addFormData.area_id) { isValid = false; errorMessage = 'Área asociada obligatoria.'; } break; case 'usuarios': if (!addFormData.rut?.trim()) { isValid = false; errorMessage = 'RUT obligatorio.'; } else if (!/^[0-9]+([.-][0-9kK])?$/.test(addFormData.rut.replace(/\./g, ''))) { isValid = false; errorMessage = 'Formato de RUT inválido.';} else if (!addFormData.nombre?.trim()) { isValid = false; errorMessage = 'Nombre obligatorio.'; } else if (!addFormData.apellido?.trim()) { isValid = false; errorMessage = 'Apellido obligatorio.'; } else if (addFormData.rol && !ROLES_PERMITIDOS.includes(addFormData.rol)) { isValid = false; errorMessage = `Rol inválido.`; } break; case 'preguntas-frecuentes': if (!addFormData.pregunta?.trim()) { isValid = false; errorMessage = 'Pregunta obligatoria.'; } else if (!addFormData.respuesta?.trim()) { isValid = false; errorMessage = 'Respuesta obligatoria.'; } else if (!addFormData.id_tipo) { isValid = false; errorMessage = 'Tipo de solicitud asociado obligatorio.'; } break; default: break; }
        if (!isValid) { await (mostrarAlertaAdvertencia || mostrarAlertaError)('Datos incompletos o inválidos', errorMessage); return; }

        setIsAdding(true); let apiUrl = ''; let payload = { ...addFormData }; let fetchFnAfterAdd = null; let setDataFnAfterAdd = null; let successMessageSingular = '';
        try {
            // Format RUT for users before sending
            if (currentSection === 'usuarios' && payload.rut) {
                payload.rut = payload.rut.toUpperCase().replace(/\./g, '').replace('-', '');
                if (payload.rut.length > 1) {
                    payload.rut = payload.rut.slice(0, -1) + '-' + payload.rut.slice(-1);
                }
            }

            switch (currentSection) {
                case 'areas': apiUrl = '/api/areas'; payload = { nombre_area: payload.nombre_area }; fetchFnAfterAdd = fetchAreas; setDataFnAfterAdd = setAreas; successMessageSingular = 'Área'; break;
                case 'tipos-solicitudes': apiUrl = '/api/tipos_solicitudes'; payload = { nombre_tipo: payload.nombre_tipo, descripcion: payload.descripcion, area_id: parseInt(payload.area_id, 10) }; fetchFnAfterAdd = fetchTiposSolicitudesAdmin; setDataFnAfterAdd = setTiposSolicitudesAdmin; successMessageSingular = 'Tipo de solicitud'; break;
                case 'usuarios': apiUrl = '/api/usuarios'; payload = { rut: payload.rut, nombre: payload.nombre, apellido: payload.apellido, correo_electronico: payload.correo_electronico || null, rol: payload.rol || 'Vecino', area_id: payload.area_id ? parseInt(payload.area_id, 10) : null, ...(payload.password?.trim() && { password: payload.password }) }; fetchFnAfterAdd = fetchUsuarios; setDataFnAfterAdd = setUsuarios; successMessageSingular = 'Usuario'; break;
                case 'preguntas-frecuentes': apiUrl = '/api/preguntas_frecuentes'; payload = { pregunta: payload.pregunta, respuesta: payload.respuesta, id_tipo: parseInt(payload.id_tipo, 10) }; fetchFnAfterAdd = fetchPreguntasFrecuentes; setDataFnAfterAdd = setPreguntasFrecuentes; successMessageSingular = 'Pregunta frecuente'; break;
                default: throw new Error(`Tipo desconocido para agregar: ${currentSection}`);
            }
            const loggedPayload = currentSection === 'usuarios' ? { ...payload, password: '***' } : payload; console.log(`[handleSubmitAdd] POST ${apiUrl}`, loggedPayload);
            await axios.post(apiUrl, payload);

            // --- Refresh Logic ---
            const targetSection = sectionIdentifierFromType(currentSection); // Should always match currentSection here
            console.log(`[handleSubmitAdd] targetSection: ${targetSection}, currentSection: ${currentSection}`); // DEBUG LOG

            if (targetSection === currentSection && fetchFnAfterAdd && setDataFnAfterAdd) { // Redundant check but safe
                try {
                    console.log(`[handleSubmitAdd] Refetching ${currentSection}...`); // DEBUG LOG
                    const updatedData = await fetchFnAfterAdd();
                    // Double check section hasn't changed during async fetch
                    if (sectionIdentifierFromType(currentSection) === currentSection) {
                        console.log(`[handleSubmitAdd] Updating state for ${currentSection}`); // DEBUG LOG
                        setDataFnAfterAdd(updatedData);
                        setPage(0);
                        await mostrarAlertaExito('Creado', `${successMessageSingular} agregado/a. Tabla recargada.`);
                    } else {
                         console.log(`[handleSubmitAdd] Section changed during refetch. No state update.`); // DEBUG LOG
                        await mostrarAlertaExito('Creado', `${successMessageSingular} agregado/a.`);
                    }
                } catch (refetchErr) {
                    console.error("[handleSubmitAdd] Refetch Error:", refetchErr);
                    await mostrarAlertaError('Creación Parcial', `${successMessageSingular} agregado/a, pero tabla no recargada.`);
                }
            } else {
                 console.log(`[handleSubmitAdd] No refetch needed or possible.`); // DEBUG LOG
                await mostrarAlertaExito('Creado', `${successMessageSingular} agregado/a.`);
            }
            handleCloseAddModal();
        } catch (err) { console.error(`[handleSubmitAdd] Error:`, err); const errorMsg = err.response?.data?.message || err.message || `No se pudo agregar.`; await mostrarAlertaError('Error al Agregar', errorMsg); }
        finally { setIsAdding(false); }
    }, [ currentSection, addFormData, handleCloseAddModal, setPage, fetchAreas, setAreas, fetchTiposSolicitudesAdmin, setTiposSolicitudesAdmin, fetchUsuarios, setUsuarios, fetchPreguntasFrecuentes, setPreguntasFrecuentes, sectionIdentifierFromType ]); // Added sectionIdentifierFromType

    // --- Función para ejecutar la petición DELETE ---
    const handleDeleteItem = useCallback(async (itemId, itemType) => { // itemType e.g., 'pregunta-frecuente'
        if (!itemId || !itemType || itemType === ENTITY_TYPES.SOLICITUD || itemType === ENTITY_TYPES.RESPUESTA) return;
        setIsDeleting(true); let apiUrl = ''; let fetchFnAfterDelete = null; let setDataFnAfterDelete = null; let successMessageSingular = '';
        try {
            switch (itemType) {
                case ENTITY_TYPES.AREA: apiUrl = `/api/areas/${itemId}`; fetchFnAfterDelete = fetchAreas; setDataFnAfterDelete = setAreas; successMessageSingular = 'Área'; break;
                case ENTITY_TYPES.TIPO_SOLICITUD: apiUrl = `/api/tipos_solicitudes/${itemId}`; fetchFnAfterDelete = fetchTiposSolicitudesAdmin; setDataFnAfterDelete = setTiposSolicitudesAdmin; successMessageSingular = 'Tipo de solicitud'; break;
                case ENTITY_TYPES.USUARIO: apiUrl = `/api/usuarios/${encodeURIComponent(itemId)}`; fetchFnAfterDelete = fetchUsuarios; setDataFnAfterDelete = setUsuarios; successMessageSingular = 'Usuario'; break;
                case ENTITY_TYPES.PREGUNTA_FRECUENTE: apiUrl = `/api/preguntas_frecuentes/${itemId}`; fetchFnAfterDelete = fetchPreguntasFrecuentes; setDataFnAfterDelete = setPreguntasFrecuentes; successMessageSingular = 'Pregunta frecuente'; break;
                default: throw new Error(`Tipo desconocido para eliminar: ${itemType}`);
            }
            console.log(`[handleDeleteItem] DELETE ${apiUrl}`);
            await axios.delete(apiUrl);
            console.log(`[handleDeleteItem] DELETE successful for ${itemType} ${itemId}`);

            // --- Refresh Logic ---
            const targetSection = sectionIdentifierFromType(itemType); // Use the corrected function
            console.log(`[handleDeleteItem] targetSection: ${targetSection}, currentSection: ${currentSection}`); // DEBUG LOG
            const currentSectionMatches = targetSection === currentSection;

            if (currentSectionMatches && fetchFnAfterDelete && setDataFnAfterDelete) {
                try {
                    console.log(`[handleDeleteItem] Refetching ${currentSection}...`); // DEBUG LOG
                    const updatedData = await fetchFnAfterDelete();
                     // Double check section hasn't changed during async fetch
                    if (sectionIdentifierFromType(itemType) === currentSection) {
                        console.log(`[handleDeleteItem] Updating state for ${currentSection}`); // DEBUG LOG
                        setDataFnAfterDelete(updatedData);
                        setPage(0);
                        await mostrarAlertaExito('Eliminado', `${successMessageSingular} eliminado/a correctamente. La tabla se ha recargado.`);
                    } else {
                         console.log(`[handleDeleteItem] Section changed during refetch. No state update.`); // DEBUG LOG
                        await mostrarAlertaExito('Eliminado', `${successMessageSingular} eliminado/a correctamente.`);
                    }
                } catch (refetchErr) {
                    console.error("[handleDeleteItem] Refetch Error:", refetchErr);
                    await mostrarAlertaError('Eliminación Parcial', `${successMessageSingular} eliminado/a, pero la tabla no pudo recargarse automáticamente.`);
                }
            } else {
                 console.log(`[handleDeleteItem] No refetch needed or possible. currentSectionMatches=${currentSectionMatches}`); // DEBUG LOG
                await mostrarAlertaExito('Eliminado', `${successMessageSingular} eliminado/a correctamente.`);
            }
        } catch (err) { console.error(`[handleDeleteItem] Error:`, err); let errorMsg = `No se pudo eliminar.`; if (err.response?.status === 409) { errorMsg = err.response.data?.message || `No se puede eliminar: tiene elementos asociados.`; } else { errorMsg = err.response?.data?.message || err.message || errorMsg; } await mostrarAlertaError('Error al Eliminar', errorMsg); }
        finally { setIsDeleting(false); }
    }, [currentSection, setPage, fetchAreas, setAreas, fetchTiposSolicitudesAdmin, setTiposSolicitudesAdmin, fetchUsuarios, setUsuarios, fetchPreguntasFrecuentes, setPreguntasFrecuentes, sectionIdentifierFromType]); // Added sectionIdentifierFromType

    // --- Handler para confirmar eliminación ---
    const handleOpenDeleteConfirmation = useCallback((item, type) => { if (!item || !type || type === ENTITY_TYPES.SOLICITUD || type === ENTITY_TYPES.RESPUESTA) return; let itemName = ''; let itemId = ''; switch(type) { case ENTITY_TYPES.AREA: itemName = item.nombre_area || `Área ID ${item.id_area}`; itemId = item.id_area; break; case ENTITY_TYPES.TIPO_SOLICITUD: itemName = item.nombre_tipo || `Tipo ID ${item.id_tipo}`; itemId = item.id_tipo; break; case ENTITY_TYPES.USUARIO: itemName = `${item.nombre || ''} ${item.apellido || ''} (RUT: ${item.RUT || 'N/A'})`.trim(); itemId = item.RUT; break; case ENTITY_TYPES.PREGUNTA_FRECUENTE: itemName = `Pregunta ID ${item.id_pregunta}: "${item.pregunta?.substring(0, 50)}..."`; itemId = item.id_pregunta; break; default: itemName = 'este elemento'; itemId = 'desconocido'; } Swal.fire({ title: '¿Estás seguro?', text: `Deseas eliminar "${itemName}"? ¡Esta acción no se puede deshacer!`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Sí, ¡eliminar!', cancelButtonText: 'Cancelar' }).then((result) => { if (result.isConfirmed) { handleDeleteItem(itemId, type); } }); }, [handleDeleteItem]);

    // --- Contenido Sidebar ---
    const drawerContent = useMemo(() => ( <SidebarAdmin currentSection={currentSection} onSelectSection={handleSelectSection} onCloseDrawer={handleDrawerClose} /> ), [currentSection, handleSelectSection, handleDrawerClose]);

    // --- Estilos Celdas ---
    const headerCellStyle = useMemo(() => ({ fontWeight: 'bold', bgcolor: 'primary.main', color: 'primary.contrastText', py: { xs: 0.8, sm: 1 }, px: { xs: 1, sm: 1.5 }, whiteSpace: 'nowrap', fontSize: { xs: '0.75rem', sm: '0.875rem' } }), []);
    const bodyCellStyle = useMemo(() => ({ py: { xs: 0.75, sm: 1 }, px: { xs: 1, sm: 1.5 }, fontSize: { xs: '0.75rem', sm: '0.875rem' }, verticalAlign: 'middle' }), []);

    // --- Título Dinámico ---
    const getSectionTitle = useCallback(() => { switch (currentSection) { case 'solicitudes': return 'Gestionar Solicitudes'; case 'areas': return 'Gestionar Áreas'; case 'tipos-solicitudes': return 'Gestionar Tipos de Solicitud'; case 'usuarios': return 'Gestionar Usuarios'; case 'respuestas': return 'Ver Respuestas Enviadas'; case 'preguntas-frecuentes': return 'Gestionar Preguntas Frecuentes'; default: return 'Portal Administración'; } }, [currentSection]);

    // --- ColSpan Dinámico ---
    const getCurrentColSpan = useCallback(() => { switch (currentSection) { case 'solicitudes': return 8; case 'areas': return 3; case 'tipos-solicitudes': return 5; case 'usuarios': return 7; case 'respuestas': return 6; case 'preguntas-frecuentes': return 5; default: return 1; } }, [currentSection]);

    // --- Handlers para Paginación ---
    const handleChangePage = useCallback((event, newPage) => { setPage(newPage); }, []);
    const handleChangeRowsPerPage = useCallback((event) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0); }, []);

    // --- Renderizado ---
    return (
        <ThemeProvider theme={currentTheme}>
            <CssBaseline />
            <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
                {/* Navbar */}
                <Navbar toggleTheme={toggleTheme} toggleSidebar={handleDrawerToggle} title="Portal Administración"/>
                {/* Sidebar */}
                <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}> <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, bgcolor: 'background.paper' } }}> {drawerContent} </Drawer> <Drawer variant="permanent" open sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, top: `${APP_BAR_HEIGHT}px`, height: `calc(100vh - ${APP_BAR_HEIGHT}px)`, borderRight: `1px solid ${currentTheme.palette.divider}`, bgcolor: 'background.paper' } }}> {drawerContent} </Drawer> </Box>
                {/* Contenido Principal */}
                <Box component="main" sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2, md: 3 }, width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` }, display: 'flex', flexDirection: 'column', mt: `${APP_BAR_HEIGHT}px`, height: `calc(100vh - ${APP_BAR_HEIGHT}px)`, overflow: 'hidden' }}>
                    <Card sx={{ width: '100%', flexGrow: 1, borderRadius: 2, boxShadow: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'background.paper' }}>
                        <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 }, display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
                            {/* Cabecera */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2, flexShrink: 0 }}> <Typography variant={isSmallScreen ? 'h6' : (isLargeScreen ? 'h4' : 'h5')} component="h1" sx={{ fontWeight: "bold", order: 1, mr: 'auto' }}> {getSectionTitle()} </Typography> <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'nowrap', order: 2, ml: 2 }}> {!loading && !error && currentSection && ( <TextField size="small" variant="outlined" placeholder="Buscar..." value={searchTerm} onChange={handleSearchChange} sx={{ width: { xs: '150px', sm: (['solicitudes', 'respuestas'].includes(currentSection) ? 250 : 180), md: (['solicitudes', 'respuestas'].includes(currentSection) ? 300 : 230) } }} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>), sx: { borderRadius: 2 } }} /> )} {!loading && !error && currentSection && !['solicitudes', 'respuestas'].includes(currentSection) && ( <Tooltip title={`Agregar Nuevo/a ${currentSection === 'areas' ? 'Área' : currentSection === 'tipos-solicitudes' ? 'Tipo de Solicitud' : currentSection === 'usuarios' ? 'Usuario' : 'Pregunta Frecuente'}`}> <span> <Button variant="contained" color="primary" size="medium" startIcon={<AddIcon />} onClick={handleOpenAddModal} disabled={isAdding || isSubmitting || isDeleting} sx={{ whiteSpace: 'nowrap', height: '40px' }} > Agregar </Button> </span> </Tooltip> )} </Box> </Box>
                            {/* Indicadores */}
                            {loading && ( <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 5, flexGrow: 1 }}> <CircularProgress /> <Typography sx={{ ml: 2 }} color="text.secondary">Cargando datos...</Typography> </Box> )} {!loading && error && ( <Alert severity="error" sx={{ mb: 2, flexShrink: 0 }}> {`Error al cargar datos: ${error}`} </Alert> )} {!loading && !error && !currentSection && ( <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, textAlign: 'center', color: 'text.secondary', p: 3 }}> <Typography variant="h6" component="p"> Selecciona una sección.</Typography> </Box> )}
                             {/* Contenedor Tabla y Paginación */}
                            {!loading && !error && currentSection && (
                                <Fade in={true} timeout={300} style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    <Paper sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: `1px solid ${currentTheme.palette.divider}`, borderRadius: 1.5, width: '100%', bgcolor: 'background.paper' }}>
                                        <TableContainer sx={{ flexGrow: 1, overflow: 'auto', boxShadow: 0, border: 0 }}>
                                            <Table stickyHeader size="small" sx={{ minWidth: 650 }}>
                                                {/* Cabeceras Dinámicas */}
                                                {currentSection === 'solicitudes' && ( <TableHead> <TableRow> <TableCell sx={headerCellStyle}>ID</TableCell> <TableCell sx={headerCellStyle}>RUT Vecino</TableCell> <TableCell sx={headerCellStyle}>Tipo</TableCell> <TableCell sx={headerCellStyle}>Fecha</TableCell> <TableCell sx={headerCellStyle}>Estado</TableCell> <TableCell sx={headerCellStyle}>Ruta Carpeta</TableCell> <TableCell sx={headerCellStyle}>Correo Notif.</TableCell> <TableCell sx={{ ...headerCellStyle, textAlign: 'right' }}>Acciones</TableCell> </TableRow> </TableHead> )}
                                                {currentSection === 'areas' && ( <TableHead> <TableRow> <TableCell sx={headerCellStyle}>ID</TableCell> <TableCell sx={headerCellStyle}>Nombre Área</TableCell> <TableCell sx={{ ...headerCellStyle, textAlign: 'right' }}>Acciones</TableCell> </TableRow> </TableHead> )}
                                                {currentSection === 'tipos-solicitudes' && ( <TableHead> <TableRow> <TableCell sx={headerCellStyle}>ID</TableCell> <TableCell sx={headerCellStyle}>Nombre Tipo</TableCell> <TableCell sx={headerCellStyle}>Descripción</TableCell> <TableCell sx={headerCellStyle}>Área</TableCell> <TableCell sx={{ ...headerCellStyle, textAlign: 'right' }}>Acciones</TableCell> </TableRow> </TableHead> )}
                                                {currentSection === 'usuarios' && ( <TableHead> <TableRow> <TableCell sx={headerCellStyle}>RUT</TableCell> <TableCell sx={headerCellStyle}>Nombre</TableCell> <TableCell sx={headerCellStyle}>Apellido</TableCell> <TableCell sx={headerCellStyle}>Email</TableCell> <TableCell sx={headerCellStyle}>Rol</TableCell> <TableCell sx={headerCellStyle}>Área</TableCell> <TableCell sx={{ ...headerCellStyle, textAlign: 'right' }}>Acciones</TableCell> </TableRow> </TableHead> )}
                                                {currentSection === 'respuestas' && ( <TableHead> <TableRow> <TableCell sx={headerCellStyle}>ID Resp.</TableCell> <TableCell sx={headerCellStyle}>ID Solicitud</TableCell> <TableCell sx={headerCellStyle}>Tipo Solicitud</TableCell> <TableCell sx={headerCellStyle}>Respondido por</TableCell> <TableCell sx={headerCellStyle}>Fecha Respuesta</TableCell> <TableCell sx={headerCellStyle}>Ruta Solicitud</TableCell> </TableRow> </TableHead> )}
                                                {currentSection === 'preguntas-frecuentes' && ( <TableHead> <TableRow> <TableCell sx={headerCellStyle}>ID</TableCell> <TableCell sx={{...headerCellStyle, width: '30%'}}>Pregunta</TableCell> <TableCell sx={{...headerCellStyle, width: '40%'}}>Respuesta</TableCell> <TableCell sx={headerCellStyle}>Tipo Solicitud</TableCell> <TableCell sx={{ ...headerCellStyle, textAlign: 'right' }}>Acciones</TableCell> </TableRow> </TableHead> )}

                                                {/* Cuerpo de Tabla Dinámico */}
                                                <TableBody>
                                                    {(rowsPerPage > 0 ? filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : filteredData ).map((item, index) => {
                                                        const commonProps = { sx: bodyCellStyle };
                                                        const actionsCellStyle = { ...bodyCellStyle, textAlign: 'right', whiteSpace: 'nowrap' };
                                                        let entityTypeForActions = null;
                                                        // Determina el tipo de entidad basado en la sección ACTUAL
                                                        switch(currentSection) {
                                                            case 'areas': entityTypeForActions = ENTITY_TYPES.AREA; break;
                                                            case 'tipos-solicitudes': entityTypeForActions = ENTITY_TYPES.TIPO_SOLICITUD; break;
                                                            case 'usuarios': entityTypeForActions = ENTITY_TYPES.USUARIO; break;
                                                            case 'solicitudes': entityTypeForActions = ENTITY_TYPES.SOLICITUD; break;
                                                            case 'preguntas-frecuentes': entityTypeForActions = ENTITY_TYPES.PREGUNTA_FRECUENTE; break;
                                                            // case 'respuestas': // No actions needed yet
                                                        }

                                                        // Define botones basados en entityTypeForActions
                                                        const editButton = entityTypeForActions && entityTypeForActions !== ENTITY_TYPES.RESPUESTA ? ( <Tooltip title={`Editar ${sectionIdentifierFromType(currentSection)?.replace(/-/g, ' ')?.slice(0,-1) || 'elemento'}`}> <span> <IconButton size="small" onClick={() => handleOpenEditModal(item, entityTypeForActions)} color="primary" disabled={isSubmitting || isAdding || isDeleting}> <EditIcon fontSize="small"/> </IconButton> </span> </Tooltip> ) : null;
                                                        const deleteButton = entityTypeForActions && ![ENTITY_TYPES.SOLICITUD, ENTITY_TYPES.RESPUESTA].includes(entityTypeForActions) ? ( <Tooltip title={`Eliminar ${sectionIdentifierFromType(currentSection)?.replace(/-/g, ' ')?.slice(0,-1) || 'elemento'}`}> <span> <IconButton size="small" onClick={() => handleOpenDeleteConfirmation(item, entityTypeForActions)} color="error" disabled={isSubmitting || isAdding || isDeleting}> <DeleteIcon fontSize="small"/> </IconButton> </span> </Tooltip> ) : null;

                                                        // Define la key única para la fila
                                                        const rowKey = `${currentSection}-${item.id_solicitud || item.id_area || item.id_tipo || item.RUT || item.id_respuesta || item.id_pregunta || index}`;

                                                        // Renderizado condicional de la fila según la sección
                                                        if (currentSection === 'solicitudes') { return ( <TableRow hover key={rowKey} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}> <TableCell {...commonProps}>{item.id_formateado}</TableCell> <TableCell {...commonProps}>{item.RUT_ciudadano}</TableCell> <TableCell {...commonProps}>{item.nombre_tipo}</TableCell> <TableCell {...commonProps}>{item.fecha_hora_envio ? new Date(item.fecha_hora_envio).toLocaleString('es-CL') : '-'}</TableCell> <TableCell {...commonProps}>{item.estado}</TableCell> <TableCell {...commonProps} sx={{...commonProps.sx, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}><Tooltip title={item.ruta_carpeta || ''}><span>{item.ruta_carpeta || '-'}</span></Tooltip></TableCell> <TableCell {...commonProps}>{item.correo_notificacion || '-'}</TableCell> <TableCell sx={actionsCellStyle}> {editButton} </TableCell> </TableRow> );
                                                        } else if (currentSection === 'areas') { return ( <TableRow hover key={rowKey} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}> <TableCell {...commonProps}>{item.id_area}</TableCell> <TableCell {...commonProps}>{item.nombre_area}</TableCell> <TableCell sx={actionsCellStyle}> {editButton} {deleteButton} </TableCell> </TableRow> );
                                                        } else if (currentSection === 'tipos-solicitudes') { return ( <TableRow hover key={rowKey} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}> <TableCell {...commonProps}>{item.id_tipo}</TableCell> <TableCell {...commonProps}>{item.nombre_tipo}</TableCell> <TableCell {...commonProps} sx={{...commonProps.sx, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}><Tooltip title={item.descripcion || ''}><span>{item.descripcion || '-'}</span></Tooltip></TableCell> <TableCell {...commonProps}>{areaMap.get(item.area_id) || item.area_id || '-'}</TableCell> <TableCell sx={actionsCellStyle}> {editButton} {deleteButton} </TableCell> </TableRow> );
                                                        } else if (currentSection === 'usuarios') { return ( <TableRow hover key={rowKey} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}> <TableCell {...commonProps}>{item.RUT || '-'}</TableCell> <TableCell {...commonProps}>{item.nombre || '-'}</TableCell> <TableCell {...commonProps}>{item.apellido || '-'}</TableCell> <TableCell sx={{ ...commonProps, wordBreak: 'break-all' }}>{item.correo_electronico || '-'}</TableCell> <TableCell {...commonProps}>{item.rol || '-'}</TableCell> <TableCell {...commonProps}>{areaMap.get(item.area_id) || '-'}</TableCell> <TableCell sx={actionsCellStyle}> {editButton} {deleteButton} </TableCell> </TableRow> );
                                                        } else if (currentSection === 'respuestas') { return ( <TableRow hover key={rowKey} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}> <TableCell {...commonProps}>{item.id_respuesta_formateado}</TableCell> <TableCell {...commonProps}>{item.id_solicitud_formateado}</TableCell> <TableCell {...commonProps}>{item.nombre_tipo_solicitud}</TableCell> <TableCell {...commonProps}>{`${item.nombre_trabajador || ''} ${item.apellido_trabajador || ''}`.trim()} ({item.RUT_trabajador})</TableCell> <TableCell {...commonProps}>{item.fecha_hora_respuesta ? new Date(item.fecha_hora_respuesta).toLocaleString('es-CL') : '-'}</TableCell><TableCell {...commonProps} sx={{...commonProps.sx, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}><Tooltip title={item.ruta_carpeta_solicitud || ''}><span>{item.ruta_carpeta_solicitud || '-'}</span></Tooltip></TableCell></TableRow> );
                                                        } else if (currentSection === 'preguntas-frecuentes') { return ( <TableRow hover key={item.id_pregunta} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}> <TableCell {...commonProps}>{item.id_pregunta}</TableCell> <TableCell {...commonProps}>{item.pregunta}</TableCell> <TableCell {...commonProps} sx={{...commonProps.sx, maxWidth: 300, whiteSpace: 'normal', wordBreak: 'break-word'}}>{item.respuesta}</TableCell> <TableCell {...commonProps}>{tipoSolicitudMap.get(item.id_tipo) || item.id_tipo || '-'}</TableCell> <TableCell sx={actionsCellStyle}> {editButton} {deleteButton} </TableCell> </TableRow> );
                                                        }
                                                        return null; // Should not happen if currentSection is valid
                                                    })}
                                                    {filteredData.length === 0 && ( <TableRow> <TableCell colSpan={getCurrentColSpan()} align="center" sx={{ py: 4, fontStyle: 'italic', color: 'text.secondary' }}> {searchTerm ? 'No se encontraron resultados.' : 'No hay datos.'} </TableCell> </TableRow> )}
                                                    {/* Empty rows calculation (slightly simplified for clarity) */}
                                                    {filteredData.length > 0 && rowsPerPage > 0 && page * rowsPerPage < filteredData.length && (
                                                         <TableRow style={{ height: (53) * Math.max(0, rowsPerPage - filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).length) }}>
                                                            <TableCell colSpan={getCurrentColSpan()} style={{ padding: 0, borderBottom: 'none' }} />
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                        {filteredData.length > 0 && ( <TablePagination rowsPerPageOptions={[5, 10, 25, { label: 'Todo', value: -1 }]} component="div" count={filteredData.length} rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} labelRowsPerPage="Filas por página:" labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`} sx={{ borderTop: `1px solid ${currentTheme.palette.divider}`, flexShrink: 0 }} /> )}
                                    </Paper>
                                </Fade>
                            )}
                        </CardContent>
                    </Card>
                </Box> {/* Fin Main */}

                {/* --- Modal de Edición GENÉRICO --- */}
                {editingItem && ( <Dialog open={isEditModalOpen} onClose={handleCloseEditModal} maxWidth="sm" fullWidth> <DialogTitle> Editar { editingItemType === ENTITY_TYPES.SOLICITUD ? `Solicitud #${editingItem.id_formateado}` : editingItemType === ENTITY_TYPES.AREA ? `Área #${editingItem.id_area}` : editingItemType === ENTITY_TYPES.TIPO_SOLICITUD ? `Tipo Solicitud #${editingItem.id_tipo}` : editingItemType === ENTITY_TYPES.USUARIO ? `Usuario ${editingItem.RUT || editingItem.id_usuario}` : editingItemType === ENTITY_TYPES.PREGUNTA_FRECUENTE ? `Pregunta Frecuente #${editingItem.id_pregunta}` : 'Elemento'} {editingItemType === ENTITY_TYPES.USUARIO && (editingItem.nombre || editingItem.apellido) && ` (${editingItem.nombre || ''} ${editingItem.apellido || ''})`.trim()} </DialogTitle> <DialogContent dividers> { editingItemType === ENTITY_TYPES.SOLICITUD && ( <> <Typography variant="body2" gutterBottom> Vecino: {editingItem.RUT_ciudadano}<br/> Tipo: {editingItem.nombre_tipo} </Typography> <FormControl fullWidth margin="normal" disabled={isSubmitting || isDeleting}> <InputLabel id="estado-select-label">Estado</InputLabel> <Select labelId="estado-select-label" name="estado" value={formData.estado || ''} label="Estado" onChange={handleFormChange}> <MenuItem value="Pendiente">Pendiente</MenuItem><MenuItem value="Aprobada">Aprobada</MenuItem><MenuItem value="Rechazada">Rechazada</MenuItem> </Select> </FormControl> <TextField margin="normal" name="correo_notificacion" label="Correo Notificación (Opcional)" type="email" fullWidth variant="outlined" value={formData.correo_notificacion || ''} onChange={handleFormChange} disabled={isSubmitting || isDeleting} helperText="Correo para notificar sobre esta solicitud específica."/> </> )} {editingItemType === ENTITY_TYPES.AREA && ( <TextField autoFocus margin="dense" name="nombre_area" label="Nombre del Área" type="text" fullWidth variant="outlined" value={formData.nombre_area || ''} onChange={handleFormChange} disabled={isSubmitting || isDeleting}/> )} {editingItemType === ENTITY_TYPES.TIPO_SOLICITUD && ( <> <TextField autoFocus margin="dense" name="nombre_tipo" label="Nombre del Tipo" type="text" fullWidth variant="outlined" value={formData.nombre_tipo || ''} onChange={handleFormChange} disabled={isSubmitting || isDeleting} sx={{ mb: 2 }}/> <TextField margin="dense" name="descripcion" label="Descripción" type="text" fullWidth multiline rows={3} variant="outlined" value={formData.descripcion || ''} onChange={handleFormChange} disabled={isSubmitting || isDeleting} sx={{ mb: 2 }}/> <FormControl fullWidth margin="normal" disabled={isSubmitting || loading || isDeleting || !Array.isArray(areas) || areas.length === 0} sx={{ mb: 2 }}> <InputLabel id="area-select-label">Área Asociada</InputLabel> <Select labelId="area-select-label" name="area_id" value={formData.area_id || ''} label="Área Asociada" onChange={handleFormChange}> <MenuItem value=""><em>Ninguna</em></MenuItem> {Array.isArray(areas) && areas.map((area) => ( <MenuItem key={area.id_area} value={area.id_area}>{area.nombre_area} (ID: {area.id_area})</MenuItem> ))} </Select> {loading && areas.length === 0 && <Typography variant="caption" color="textSecondary">Cargando áreas...</Typography>} </FormControl> </> )} {editingItemType === ENTITY_TYPES.USUARIO && ( <> <TextField autoFocus margin="dense" name="correo_electronico" label="Correo Electrónico" type="email" fullWidth variant="outlined" value={formData.correo_electronico || ''} onChange={handleFormChange} disabled={isSubmitting || isDeleting} sx={{ mb: 2 }}/> <FormControl fullWidth margin="normal" disabled={isSubmitting || isDeleting} sx={{ mb: 2 }}> <InputLabel id="rol-select-label">Rol</InputLabel> <Select labelId="rol-select-label" name="rol" value={formData.rol || ''} label="Rol" onChange={handleFormChange}> {ROLES_PERMITIDOS.map(rol => <MenuItem key={rol} value={rol}>{rol}</MenuItem>)} </Select> </FormControl> <FormControl fullWidth margin="normal" disabled={isSubmitting || loading || isDeleting || !Array.isArray(areas) || areas.length === 0} sx={{ mb: 2 }}> <InputLabel id="user-area-select-label">Área Asignada (Opcional)</InputLabel> <Select labelId="user-area-select-label" name="area_id" value={formData.area_id || ''} label="Área Asignada (Opcional)" onChange={handleFormChange}> <MenuItem value=""><em>Ninguna</em></MenuItem> {Array.isArray(areas) && areas.map((area) => ( <MenuItem key={area.id_area} value={area.id_area}>{area.nombre_area} (ID: {area.id_area})</MenuItem> ))} </Select> {loading && areas.length === 0 && <Typography variant="caption" color="textSecondary">Cargando áreas...</Typography>} </FormControl> <FormControlLabel control={ <Checkbox checked={formData.deletePassword || false} onChange={handleFormChange} name="deletePassword" disabled={isSubmitting || isDeleting} color="warning" /> } label="Eliminar contraseña existente" sx={{ mt: 1, display: 'block', mb: 1 }} /> <TextField margin="dense" name="password" label="Nueva Contraseña" type={showModalPassword ? 'text' : 'password'} fullWidth variant="outlined" value={formData.password || ''} onChange={handleFormChange} disabled={isSubmitting || formData.deletePassword || isDeleting} InputProps={{ endAdornment: ( <InputAdornment position="end"> <IconButton aria-label="toggle password visibility" onClick={handleClickShowPasswordModal} onMouseDown={handleMouseDownPasswordModal} edge="end" disabled={isSubmitting || formData.deletePassword || isDeleting} > {showModalPassword ? <VisibilityOff /> : <Visibility />} </IconButton> </InputAdornment> ), }} sx={{ mt: 1 }} helperText={formData.deletePassword ? "Contraseña será eliminada." : "Dejar en blanco para no cambiar."} /> <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>Contraseñas seguras.</Typography> </> )} {editingItemType === ENTITY_TYPES.PREGUNTA_FRECUENTE && ( <> <TextField autoFocus required margin="dense" name="pregunta" label="Pregunta" type="text" fullWidth multiline rows={3} variant="outlined" value={formData.pregunta || ''} onChange={handleFormChange} disabled={isSubmitting || isDeleting} sx={{ mb: 2 }}/> <TextField required margin="dense" name="respuesta" label="Respuesta" type="text" fullWidth multiline rows={5} variant="outlined" value={formData.respuesta || ''} onChange={handleFormChange} disabled={isSubmitting || isDeleting} sx={{ mb: 2 }}/> <FormControl fullWidth required margin="normal" disabled={isSubmitting || loading || isDeleting || !Array.isArray(tiposSolicitudesAdmin) || tiposSolicitudesAdmin.length === 0 } sx={{ mb: 2 }}> <InputLabel id="faq-tipo-select-label">Tipo de Solicitud Asociado</InputLabel> <Select labelId="faq-tipo-select-label" name="id_tipo" value={formData.id_tipo || ''} label="Tipo de Solicitud Asociado *" onChange={handleFormChange} > <MenuItem value="" disabled><em>Seleccione un tipo</em></MenuItem> {Array.isArray(tiposSolicitudesAdmin) && tiposSolicitudesAdmin.map((tipo) => ( <MenuItem key={tipo.id_tipo} value={tipo.id_tipo}>{tipo.nombre_tipo} (ID: {tipo.id_tipo})</MenuItem> ))} </Select> {loading && tiposSolicitudesAdmin.length === 0 && <Typography variant="caption" color="textSecondary">Cargando tipos...</Typography>} </FormControl> </> )} </DialogContent> <DialogActions sx={{p: '16px 24px'}}> <Button onClick={handleCloseEditModal} disabled={isSubmitting || isDeleting} color="inherit"> Cancelar </Button> <Box sx={{ position: 'relative' }}> <Button onClick={handleSubmitEdit} variant="contained" disabled={isSubmitting || isDeleting}> Guardar Cambios </Button> {isSubmitting && ( <CircularProgress size={24} sx={{ color: 'primary.main', position: 'absolute', top: '50%', left: '50%', marginTop: '-12px', marginLeft: '-12px' }}/> )} </Box> </DialogActions> </Dialog> )}

                {/* --- Modal de Agregar GENÉRICO --- */}
                <Dialog open={isAddModalOpen} onClose={handleCloseAddModal} maxWidth="sm" fullWidth> <DialogTitle> Agregar Nuevo/a { currentSection === 'areas' ? 'Área' : currentSection === 'tipos-solicitudes' ? 'Tipo de Solicitud' : currentSection === 'usuarios' ? 'Usuario' : currentSection === 'preguntas-frecuentes' ? 'Pregunta Frecuente' : ''} </DialogTitle> <DialogContent dividers> { currentSection === 'areas' && ( <TextField autoFocus required margin="dense" name="nombre_area" label="Nombre del Área" type="text" fullWidth variant="outlined" value={addFormData.nombre_area || ''} onChange={handleAddFormChange} disabled={isAdding || isDeleting} /> )} {currentSection === 'tipos-solicitudes' && ( <> <TextField autoFocus required margin="dense" name="nombre_tipo" label="Nombre del Tipo" type="text" fullWidth variant="outlined" value={addFormData.nombre_tipo || ''} onChange={handleAddFormChange} disabled={isAdding || isDeleting} sx={{ mb: 2 }} /> <TextField required margin="dense" name="descripcion" label="Descripción" type="text" fullWidth multiline rows={3} variant="outlined" value={addFormData.descripcion || ''} onChange={handleAddFormChange} disabled={isAdding || isDeleting} sx={{ mb: 2 }} /> <FormControl fullWidth required margin="normal" disabled={isAdding || loading || isDeleting || !Array.isArray(areas) || areas.length === 0} sx={{ mb: 2 }}> <InputLabel id="add-area-select-label">Área Asociada</InputLabel> <Select labelId="add-area-select-label" name="area_id" value={addFormData.area_id || ''} label="Área Asociada *" onChange={handleAddFormChange}> <MenuItem value="" disabled><em>Seleccione un área</em></MenuItem> {Array.isArray(areas) && areas.map((area) => ( <MenuItem key={area.id_area} value={area.id_area}>{area.nombre_area} (ID: {area.id_area})</MenuItem> ))} </Select> {loading && areas.length === 0 && <Typography variant="caption" color="textSecondary">Cargando áreas...</Typography>} </FormControl> </> )} {currentSection === 'usuarios' && ( <> <TextField autoFocus required margin="dense" name="rut" label="RUT (ej: 12345678-9)" type="text" fullWidth variant="outlined" value={addFormData.rut || ''} onChange={handleAddFormChange} disabled={isAdding || isDeleting} sx={{ mb: 2 }} error={!!addFormData.rut && !/^[0-9]+([.-][0-9kK])?$/.test(addFormData.rut.replace(/\./g, ''))} helperText={!!addFormData.rut && !/^[0-9]+([.-][0-9kK])?$/.test(addFormData.rut.replace(/\./g, '')) ? "Formato incorrecto" : ""}/> <TextField required margin="dense" name="nombre" label="Nombre" type="text" fullWidth variant="outlined" value={addFormData.nombre || ''} onChange={handleAddFormChange} disabled={isAdding || isDeleting} sx={{ mb: 2 }}/> <TextField required margin="dense" name="apellido" label="Apellido" type="text" fullWidth variant="outlined" value={addFormData.apellido || ''} onChange={handleAddFormChange} disabled={isAdding || isDeleting} sx={{ mb: 2 }}/> <TextField margin="dense" name="correo_electronico" label="Correo Electrónico (Opcional)" type="email" fullWidth variant="outlined" value={addFormData.correo_electronico || ''} onChange={handleAddFormChange} disabled={isAdding || isDeleting} sx={{ mb: 2 }}/> <FormControl fullWidth margin="normal" disabled={isAdding || isDeleting} sx={{ mb: 2 }}> <InputLabel id="add-rol-select-label">Rol (Defecto: Vecino)</InputLabel> <Select labelId="add-rol-select-label" name="rol" value={addFormData.rol || ''} label="Rol (Defecto: Vecino)" onChange={handleAddFormChange}> <MenuItem value=""><em>Vecino (Por defecto)</em></MenuItem> {ROLES_PERMITIDOS.map(rol => <MenuItem key={rol} value={rol}>{rol}</MenuItem>)} </Select> </FormControl> <FormControl fullWidth margin="normal" disabled={isAdding || loading || isDeleting || !Array.isArray(areas) || areas.length === 0} sx={{ mb: 2 }}> <InputLabel id="add-user-area-select-label">Área Asignada (Opcional)</InputLabel> <Select labelId="add-user-area-select-label" name="area_id" value={addFormData.area_id || ''} label="Área Asignada (Opcional)" onChange={handleAddFormChange}> <MenuItem value=""><em>Ninguna</em></MenuItem> {Array.isArray(areas) && areas.map((area) => ( <MenuItem key={area.id_area} value={area.id_area}>{area.nombre_area} (ID: {area.id_area})</MenuItem> ))} </Select> {loading && areas.length === 0 && <Typography variant="caption" color="textSecondary">Cargando áreas...</Typography>} </FormControl> <TextField margin="dense" name="password" label="Contraseña (Opcional)" type={showAddModalPassword ? 'text' : 'password'} fullWidth variant="outlined" value={addFormData.password || ''} onChange={handleAddFormChange} disabled={isAdding || isDeleting} InputProps={{ endAdornment: ( <InputAdornment position="end"> <IconButton aria-label="toggle password visibility" onClick={handleClickShowPasswordAddModal} onMouseDown={handleMouseDownPasswordAddModal} edge="end" disabled={isAdding || isDeleting} > {showAddModalPassword ? <VisibilityOff /> : <Visibility />} </IconButton> </InputAdornment> ), }} sx={{ mt: 1 }} helperText="Dejar en blanco para crear sin contraseña." /> <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>Contraseñas seguras.</Typography> </> )} {currentSection === 'preguntas-frecuentes' && ( <> <TextField autoFocus required margin="dense" name="pregunta" label="Pregunta" type="text" fullWidth multiline rows={3} variant="outlined" value={addFormData.pregunta || ''} onChange={handleAddFormChange} disabled={isAdding || isDeleting} sx={{ mb: 2 }}/> <TextField required margin="dense" name="respuesta" label="Respuesta" type="text" fullWidth multiline rows={5} variant="outlined" value={addFormData.respuesta || ''} onChange={handleAddFormChange} disabled={isAdding || isDeleting} sx={{ mb: 2 }}/> <FormControl fullWidth required margin="normal" disabled={isAdding || loading || isDeleting || !Array.isArray(tiposSolicitudesAdmin) || tiposSolicitudesAdmin.length === 0} sx={{ mb: 2 }}> <InputLabel id="add-faq-tipo-select-label">Tipo de Solicitud Asociado</InputLabel> <Select labelId="add-faq-tipo-select-label" name="id_tipo" value={addFormData.id_tipo || ''} label="Tipo de Solicitud Asociado *" onChange={handleAddFormChange} > <MenuItem value="" disabled><em>Seleccione un tipo</em></MenuItem> {Array.isArray(tiposSolicitudesAdmin) && tiposSolicitudesAdmin.map((tipo) => ( <MenuItem key={tipo.id_tipo} value={tipo.id_tipo}>{tipo.nombre_tipo} (ID: {tipo.id_tipo})</MenuItem> ))} </Select> {loading && tiposSolicitudesAdmin.length === 0 && <Typography variant="caption" color="textSecondary">Cargando tipos...</Typography>} </FormControl> </> )} </DialogContent> <DialogActions sx={{p: '16px 24px'}}> <Button onClick={handleCloseAddModal} disabled={isAdding || isDeleting} color="inherit"> Cancelar </Button> <Box sx={{ position: 'relative' }}> <Button onClick={handleSubmitAdd} variant="contained" disabled={isAdding || isDeleting} color="primary"> Agregar </Button> {isAdding && ( <CircularProgress size={24} sx={{ color: 'primary.main', position: 'absolute', top: '50%', left: '50%', marginTop: '-12px', marginLeft: '-12px' }} /> )} </Box> </DialogActions> </Dialog>

            </Box> {/* Fin Flex Principal */}
        </ThemeProvider>
    );
}
export default Administrador;