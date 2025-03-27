import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import {
    Box, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Button, CircularProgress, Fade,
    Card, CardContent, CssBaseline, ThemeProvider, Drawer, useMediaQuery,
    TextField, InputAdornment, Tooltip, Alert, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel,
    Checkbox, FormControlLabel,
    TablePagination // NUEVO: Importar TablePagination
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
// Importa componentes y utilidades (¡Asegúrate que las rutas sean correctas!)
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
};
const ROLES_PERMITIDOS = ['Administrador', 'Funcionario', 'Vecino'];
const DEFAULT_ROWS_PER_PAGE = 10; // NUEVO: Filas por defecto

// --- Componente Principal ---
function Administrador() {
    // --- Estados Generales ---
    const [mode, setMode] = useState("light");
    const [mobileOpen, setMobileOpen] = useState(false);
    const [currentSection, setCurrentSection] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    // --- Estados de Datos por Sección ---
    const [solicitudes, setSolicitudes] = useState([]);
    const [areas, setAreas] = useState([]);
    const [tiposSolicitudesAdmin, setTiposSolicitudesAdmin] = useState([]);
    const [usuarios, setUsuarios] = useState([]);

    // --- Estados para el Modal de Edición Genérico ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editingItemType, setEditingItemType] = useState(null);
    const [formData, setFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showModalPassword, setShowModalPassword] = useState(false);

    // --- Estados para el Modal de Agregar Genérico ---
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addFormData, setAddFormData] = useState({});
    const [isAdding, setIsAdding] = useState(false);
    const [showAddModalPassword, setShowAddModalPassword] = useState(false);

    // --- NUEVO: Estados para Paginación ---
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
    // MODIFICADO: Resetear página al buscar
    const handleSearchChange = useCallback((event) => {
        setSearchTerm(event.target.value);
        setPage(0); // Resetear a la primera página al cambiar el término de búsqueda
    }, []);

    // --- Handler Selección Sidebar ---
    // MODIFICADO: Resetear página al cambiar sección
    const handleSelectSection = useCallback((sectionName) => {
        if (sectionName !== currentSection) {
            console.log(`[handleSelectSection] Changing section to ${sectionName}`);
            setCurrentSection(sectionName);
            setSearchTerm("");
            setIsEditModalOpen(false);
            setIsAddModalOpen(false);
            setPage(0); // Resetear a la primera página
            setRowsPerPage(DEFAULT_ROWS_PER_PAGE); // Opcional: resetear filas por página también
        }
        handleDrawerClose();
    }, [currentSection, handleDrawerClose]);

    // --- Fetch Genérico ---
    const fetchGenericData = useCallback(async (endpoint, sectionIdentifier) => {
        console.log(`[fetchGenericData] Fetching for ${sectionIdentifier} from ${endpoint}`);
        try {
            const response = await axios.get(endpoint);
            const data = response.data;
            let potentialData = null;

            if (Array.isArray(data)) potentialData = data;
            else if (data && Array.isArray(data[sectionIdentifier])) potentialData = data[sectionIdentifier];
            else if (sectionIdentifier === 'solicitudes' && data?.solicitudes && Array.isArray(data.solicitudes)) potentialData = data.solicitudes;

            if (Array.isArray(potentialData)) {
                console.log(`[fetchGenericData] Success. Received ${potentialData.length} items for ${sectionIdentifier}`);
                if (sectionIdentifier === 'usuarios') {
                    return potentialData.map(user => {
                        const { hash_password: _discardedHash, ...userWithoutHash } = user;
                        return userWithoutHash;
                    });
                }
                return potentialData;
            } else {
                console.warn(`[fetchGenericData] Unexpected data format or empty array for ${sectionIdentifier}. Response:`, data);
                return [];
            }
        } catch (err) {
            console.error(`[fetchGenericData] Network/Request Error fetching ${sectionIdentifier}:`, err);
            throw err;
        }
    }, []);

    // --- Wrappers de Fetch ---
    const fetchSolicitudes = useCallback(() => fetchGenericData('/api/solicitudes', 'solicitudes'), [fetchGenericData]);
    const fetchAreas = useCallback(() => fetchGenericData('/api/areas', 'areas'), [fetchGenericData]);
    const fetchTiposSolicitudesAdmin = useCallback(() => fetchGenericData('/api/tipos_solicitudes', 'tipos-solicitudes'), [fetchGenericData]);
    const fetchUsuarios = useCallback(() => fetchGenericData('/api/usuarios', 'usuarios'), [fetchGenericData]);

    // --- Efecto Principal para Cargar Datos ---
    useEffect(() => {
        if (!currentSection) {
            setLoading(false); setError(null);
            setSolicitudes([]); setAreas([]); setTiposSolicitudesAdmin([]); setUsuarios([]);
            return;
        }

        let isMounted = true;
        const section = currentSection;

        const loadData = async () => {
            console.log(`[useEffect] Loading data for section: ${section}`);
            if (isMounted) { setLoading(true); setError(null); setPage(0); } // Reset page on new section load

            switch (section) {
                case 'solicitudes': setSolicitudes([]); break;
                case 'areas': setAreas([]); break;
                case 'tipos-solicitudes': setTiposSolicitudesAdmin([]); break;
                case 'usuarios': setUsuarios([]); break;
            }
            const needsAreas = section === 'tipos-solicitudes' || section === 'usuarios' || section === 'areas';

            let fetchFn; let setDataFn;
            switch (section) {
                case 'solicitudes': fetchFn = fetchSolicitudes; setDataFn = setSolicitudes; break;
                case 'areas': fetchFn = fetchAreas; setDataFn = setAreas; break;
                case 'tipos-solicitudes': fetchFn = fetchTiposSolicitudesAdmin; setDataFn = setTiposSolicitudesAdmin; break;
                case 'usuarios': fetchFn = fetchUsuarios; setDataFn = setUsuarios; break;
                default:
                    if (isMounted) { setError(`Sección desconocida: ${section}`); setLoading(false); }
                    return;
            }

            try {
                // Si la sección NO es 'areas', ejecutar fetch principal primero
                 if (section !== 'areas') {
                     const primaryData = await fetchFn();
                     if (isMounted && currentSection === section) { setDataFn(primaryData); }
                     else { return; }
                 }

                // Cargar/Recargar áreas si es necesario
                if (needsAreas && isMounted && currentSection === section) {
                    console.log(`[useEffect] Section ${section} needs areas. Fetching areas...`);
                    try {
                        const areasData = await fetchAreas();
                        if (isMounted && currentSection === section) {
                             setAreas(areasData);
                             // Si la sección actual ES 'areas', la data principal es esta
                             if (section === 'areas') { setDataFn(areasData); }
                        }
                    } catch (areasErr) {
                        console.error(`[useEffect] Error fetching areas for section ${section}:`, areasErr);
                        if (isMounted && currentSection === section && !error) { setError('Error al cargar áreas.'); }
                         if (section === 'areas' && isMounted && currentSection === section) { setDataFn([]); }
                    }
                }

            } catch (err) { // Error del fetch principal (si no es 'areas')
                if (isMounted && currentSection === section) {
                    const apiError = err.response?.data?.message;
                    setError(apiError || err.message || `Error al cargar ${section}.`);
                }
            } finally {
                if (isMounted && currentSection === section) { setLoading(false); }
            }
        };

        loadData();

        return () => { isMounted = false; };
    }, [currentSection, fetchSolicitudes, fetchAreas, fetchTiposSolicitudesAdmin, fetchUsuarios, error]); // No incluir page/rowsPerPage aquí

    // --- Cerrar drawer en pantallas grandes ---
    useEffect(() => { if (isLargeScreen) setMobileOpen(false); }, [isLargeScreen]);

    // --- Mapa de Areas para Búsqueda Rápida ---
    const areaMap = useMemo(() => {
        const map = new Map();
        if (Array.isArray(areas)) {
            areas.forEach(area => map.set(area.id_area, area.nombre_area));
        }
        return map;
    }, [areas]);

    // --- Filtrado de Datos ---
    // (La lógica de filtrado no cambia, pagination actúa sobre `filteredData`)
    const filteredData = useMemo(() => {
        if (loading || error || !currentSection) return [];
        let dataToFilter = [];
        switch (currentSection) {
            case 'solicitudes': dataToFilter = solicitudes; break;
            case 'areas': dataToFilter = areas; break;
            case 'tipos-solicitudes': dataToFilter = tiposSolicitudesAdmin; break;
            case 'usuarios': dataToFilter = usuarios; break;
            default: return [];
        }
        if (!Array.isArray(dataToFilter)) return [];
        if (!searchTerm.trim()) return dataToFilter;
        const lowerSearch = searchTerm.toLowerCase();
        try {
            // La lógica de filtrado específica por sección permanece igual
             switch (currentSection) {
                 case 'solicitudes':
                     return dataToFilter.filter(s =>
                         s.id_formateado?.toString().toLowerCase().includes(lowerSearch) ||
                         s.RUT_ciudadano?.toLowerCase().includes(lowerSearch) ||
                         s.nombre_tipo?.toLowerCase().includes(lowerSearch) ||
                         s.estado?.toLowerCase().includes(lowerSearch)
                     );
                 case 'areas':
                     return dataToFilter.filter(a =>
                         a.id_area?.toString().toLowerCase().includes(lowerSearch) ||
                         a.nombre_area?.toLowerCase().includes(lowerSearch)
                     );
                 case 'tipos-solicitudes':
                     return dataToFilter.filter(t =>
                         t.id_tipo?.toString().toLowerCase().includes(lowerSearch) ||
                         t.nombre_tipo?.toLowerCase().includes(lowerSearch) ||
                         (t.area_id && (areaMap.get(t.area_id) || '').toLowerCase().includes(lowerSearch))
                     );
                 case 'usuarios':
                     return dataToFilter.filter(u =>
                         (u.RUT && u.RUT.toLowerCase().includes(lowerSearch)) ||
                         (u.nombre && u.nombre.toLowerCase().includes(lowerSearch)) ||
                         (u.apellido && u.apellido.toLowerCase().includes(lowerSearch)) ||
                         (u.correo_electronico && u.correo_electronico.toLowerCase().includes(lowerSearch)) ||
                         (u.rol && u.rol.toLowerCase().includes(lowerSearch)) ||
                         (u.area_id && (areaMap.get(u.area_id) || '').toLowerCase().includes(lowerSearch))
                     );
                 default: return [];
             }
        } catch (filterError) {
            console.error("[filteredData] Error during filtering:", filterError);
            return [];
        }
    }, [currentSection, searchTerm, solicitudes, areas, tiposSolicitudesAdmin, usuarios, loading, error, areaMap]);

    // --- Handlers Modal Edición ---
    const handleOpenEditModal = useCallback((item, type) => {
        console.log(`[handleOpenEditModal] Opening modal for type: ${type}, item:`, item);
        setEditingItem(item); setEditingItemType(type); setShowModalPassword(false);
        let initialFormData = {};
        switch (type) {
            case ENTITY_TYPES.SOLICITUD: initialFormData = { estado: item.estado || '' }; break;
            case ENTITY_TYPES.AREA: initialFormData = { nombre_area: item.nombre_area || '' }; break;
            case ENTITY_TYPES.TIPO_SOLICITUD: initialFormData = { nombre_tipo: item.nombre_tipo || '', area_id: item.area_id || '', descripcion: item.descripcion || '' }; break;
            case ENTITY_TYPES.USUARIO: initialFormData = { correo_electronico: item.correo_electronico || '', rol: item.rol || '', area_id: item.area_id || '', password: '', deletePassword: false }; break;
            default: console.error("Tipo desconocido en handleOpenEditModal:", type); return;
        }
        setFormData(initialFormData); setIsEditModalOpen(true);
    }, []);

    const handleCloseEditModal = useCallback(() => {
        if (!isSubmitting) {
            setIsEditModalOpen(false);
            setTimeout(() => { setEditingItem(null); setEditingItemType(null); setFormData({}); setShowModalPassword(false); }, 300);
        }
    }, [isSubmitting]);

    const handleFormChange = useCallback((event) => {
        const { name, value, type, checked } = event.target;
        const newValue = type === 'checkbox' ? checked : value;
        setFormData(prev => {
            const updatedData = { ...prev, [name]: newValue };
            if (name === 'deletePassword' && newValue === true) { updatedData.password = ''; }
            return updatedData;
        });
    }, []);

    const handleClickShowPasswordModal = useCallback(() => { setShowModalPassword((show) => !show); }, []);
    const handleMouseDownPasswordModal = useCallback((event) => { event.preventDefault(); }, []);

    // --- Submit Edición GENÉRICO ---
    // MODIFICADO: Resetear página después de actualizar
    const handleSubmitEdit = useCallback(async () => {
        if (!editingItem || !editingItemType) return;

        let initialDataForComparison = {};
        switch (editingItemType) {
            case ENTITY_TYPES.SOLICITUD: initialDataForComparison = { estado: editingItem.estado || '' }; break;
            case ENTITY_TYPES.AREA: initialDataForComparison = { nombre_area: editingItem.nombre_area || '' }; break;
            case ENTITY_TYPES.TIPO_SOLICITUD: initialDataForComparison = { nombre_tipo: editingItem.nombre_tipo || '', area_id: editingItem.area_id || '', descripcion: editingItem.descripcion || '' }; break;
            case ENTITY_TYPES.USUARIO: initialDataForComparison = { correo_electronico: editingItem.correo_electronico || '', rol: editingItem.rol || '', area_id: editingItem.area_id || '', password: '', deletePassword: false }; break;
            default: return;
        }

        let hasChanged = false;
        for (const key in formData) {
            if (!Object.prototype.hasOwnProperty.call(initialDataForComparison, key)) continue;
            if (key === 'password' && formData.deletePassword === true) continue;
            const initialValue = initialDataForComparison[key];
            const currentValue = formData[key];
            const comparisonInitial = key === 'area_id' ? (initialValue || '') : String(initialValue ?? '');
            const comparisonCurrent = key === 'area_id' ? (currentValue || '') : String(currentValue ?? '');
            if (comparisonCurrent !== comparisonInitial) { hasChanged = true; break; }
        }

        if (!hasChanged) {
            mostrarAlertaExito("Sin cambios", "No se detectaron cambios para guardar.");
            handleCloseEditModal(); return;
        }

        setIsSubmitting(true);
        let apiUrl = ''; let itemId = null; let payload = {};
        let fetchFnAfterUpdate = null; let setDataFnAfterUpdate = null;
        let successMessage = ''; let idField = ''; const httpMethod = 'put';

        try {
            switch (editingItemType) {
                case ENTITY_TYPES.SOLICITUD:
                    idField='id_solicitud'; itemId=editingItem[idField]; apiUrl=`/api/solicitudes/estado/${itemId}`; payload={estado: formData.estado};
                    fetchFnAfterUpdate=fetchSolicitudes; setDataFnAfterUpdate=setSolicitudes; successMessage='Estado de solicitud actualizado.'; break;
                case ENTITY_TYPES.AREA:
                    idField='id_area'; itemId=editingItem[idField]; apiUrl=`/api/areas/${itemId}`; payload={nombre_area: formData.nombre_area};
                    fetchFnAfterUpdate=fetchAreas; setDataFnAfterUpdate=setAreas; successMessage='Área actualizada.'; break;
                case ENTITY_TYPES.TIPO_SOLICITUD:
                    idField='id_tipo'; itemId=editingItem[idField]; apiUrl=`/api/tipos_solicitudes/${itemId}`; payload={nombre_tipo: formData.nombre_tipo, area_id: formData.area_id || null, descripcion: formData.descripcion || ''};
                    fetchFnAfterUpdate=fetchTiposSolicitudesAdmin; setDataFnAfterUpdate=setTiposSolicitudesAdmin; successMessage='Tipo de solicitud actualizado.'; break;
                case ENTITY_TYPES.USUARIO:
                    idField = 'RUT'; itemId = editingItem[idField]; if (!itemId) throw new Error("RUT de usuario no encontrado.");
                    apiUrl = `/api/usuarios/${encodeURIComponent(itemId)}`;
                    payload = { correo_electronico: formData.correo_electronico, rol: formData.rol, area_id: formData.area_id || null };
                    if (formData.deletePassword === true) { payload.deletePassword = true; }
                    else if (formData.password?.trim()) { payload.password = formData.password; }
                    fetchFnAfterUpdate = fetchUsuarios; setDataFnAfterUpdate = setUsuarios; successMessage = 'Usuario actualizado.';
                    break;
                default: throw new Error(`Tipo desconocido: ${editingItemType}`);
            }

            const loggedPayload = editingItemType === ENTITY_TYPES.USUARIO ? { ...payload, password: payload.password ? '***' : undefined } : payload;
            console.log(`[handleSubmitEdit] Sending ${httpMethod.toUpperCase()} to ${apiUrl} with payload:`, loggedPayload);

            await axios[httpMethod](apiUrl, payload);

            const currentSectionMatches = sectionIdentifierFromType(editingItemType) === currentSection;

            if (currentSectionMatches && fetchFnAfterUpdate && setDataFnAfterUpdate) {
                try {
                    const updatedData = await fetchFnAfterUpdate();
                    if (currentSection === sectionIdentifierFromType(editingItemType)) { // Re-check
                         setDataFnAfterUpdate(updatedData);
                         setPage(0); // NUEVO: Resetear página después de actualizar datos
                         await mostrarAlertaExito('Actualizado', `${successMessage} La tabla se ha recargado.`);
                    } else { await mostrarAlertaExito('Actualizado', successMessage); }
                } catch (refetchErr) {
                    console.error("[handleSubmitEdit] Error during refetch:", refetchErr);
                    await mostrarAlertaError('Actualización Parcial', `${successMessage} pero la tabla no pudo recargarse.`);
                }
            } else { await mostrarAlertaExito('Actualizado', successMessage); }

            handleCloseEditModal();

        } catch (err) {
            console.error(`[handleSubmitEdit] Error for ${editingItemType} ${itemId || 'unknown'}:`, err);
            const errorMsg = err.response?.data?.message || err.message || `No se pudo actualizar.`;
            await mostrarAlertaError('Error al Actualizar', errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    // MODIFICADO: Añadir setPage a las dependencias si se usa directamente dentro
    }, [
        editingItem, editingItemType, formData, currentSection, handleCloseEditModal,
        fetchSolicitudes, setSolicitudes, fetchAreas, setAreas, fetchTiposSolicitudesAdmin, setTiposSolicitudesAdmin, fetchUsuarios, setUsuarios, setPage // Añadir setPage
    ]);

    // --- NUEVO: Handlers Modal Agregar ---
    const handleOpenAddModal = useCallback(() => {
        if (!currentSection || currentSection === 'solicitudes') return;
        let initialAddFormData = {};
        switch (currentSection) {
            case 'areas': initialAddFormData = { nombre_area: '' }; break;
            case 'tipos-solicitudes': initialAddFormData = { nombre_tipo: '', descripcion: '', area_id: '' }; break;
            case 'usuarios': initialAddFormData = { rut: '', nombre: '', apellido: '', correo_electronico: '', password: '', rol: '', area_id: '' }; break;
            default: return;
        }
        setAddFormData(initialAddFormData);
        setShowAddModalPassword(false);
        setIsAddModalOpen(true);
    }, [currentSection]);

    const handleCloseAddModal = useCallback(() => {
        if (!isAdding) {
            setIsAddModalOpen(false);
            setTimeout(() => { setAddFormData({}); setShowAddModalPassword(false); }, 300);
        }
    }, [isAdding]);

    const handleAddFormChange = useCallback((event) => {
        const { name, value } = event.target;
        setAddFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleClickShowPasswordAddModal = useCallback(() => { setShowAddModalPassword((show) => !show); }, []);
    const handleMouseDownPasswordAddModal = useCallback((event) => { event.preventDefault(); }, []);

    // --- Submit Agregar GENÉRICO ---
    // MODIFICADO: Resetear página después de agregar
    const handleSubmitAdd = useCallback(async () => {
        if (!currentSection || !addFormData) return;

        let isValid = true; let errorMessage = '';
        if (currentSection === 'areas') {
            if (!addFormData.nombre_area?.trim()) { isValid = false; errorMessage = 'El nombre del área es obligatorio.'; }
        } else if (currentSection === 'tipos-solicitudes') {
            if (!addFormData.nombre_tipo?.trim()) { isValid = false; errorMessage = 'El nombre del tipo es obligatorio.'; }
            else if (!addFormData.descripcion?.trim()) { isValid = false; errorMessage = 'La descripción es obligatoria.'; }
            else if (!addFormData.area_id) { isValid = false; errorMessage = 'Debe seleccionar un área asociada.'; }
        } else if (currentSection === 'usuarios') {
            if (!addFormData.rut?.trim()) { isValid = false; errorMessage = 'El RUT es obligatorio.'; }
            else if (!/^[0-9]+-[0-9kK]$/.test(addFormData.rut)) { isValid = false; errorMessage = 'Formato de RUT inválido. Use: 12345678-9';}
            else if (!addFormData.nombre?.trim()) { isValid = false; errorMessage = 'El Nombre es obligatorio.'; }
            else if (!addFormData.apellido?.trim()) { isValid = false; errorMessage = 'El Apellido es obligatorio.'; }
            else if (addFormData.rol && !ROLES_PERMITIDOS.includes(addFormData.rol)) { isValid = false; errorMessage = `Rol inválido. Roles permitidos: ${ROLES_PERMITIDOS.join(', ')}.`; }
        }

        if (!isValid) {
            await (mostrarAlertaAdvertencia || mostrarAlertaError)('Datos incompletos o inválidos', errorMessage);
            return;
        }

        setIsAdding(true);
        let apiUrl = ''; let payload = { ...addFormData };
        let fetchFnAfterAdd = null; let setDataFnAfterAdd = null;
        let successMessageSingular = '';

        try {
            switch (currentSection) {
                case 'areas':
                    apiUrl = '/api/areas'; payload = { nombre_area: payload.nombre_area };
                    fetchFnAfterAdd = fetchAreas; setDataFnAfterAdd = setAreas; successMessageSingular = 'Área'; break;
                case 'tipos-solicitudes':
                    apiUrl = '/api/tipos_solicitudes'; payload = { nombre_tipo: payload.nombre_tipo, descripcion: payload.descripcion, area_id: parseInt(payload.area_id, 10) };
                    fetchFnAfterAdd = fetchTiposSolicitudesAdmin; setDataFnAfterAdd = setTiposSolicitudesAdmin; successMessageSingular = 'Tipo de solicitud'; break;
                case 'usuarios':
                    apiUrl = '/api/usuarios'; payload = { rut: payload.rut, nombre: payload.nombre, apellido: payload.apellido, correo_electronico: payload.correo_electronico || null, rol: payload.rol || 'Vecino', area_id: payload.area_id ? parseInt(payload.area_id, 10) : null, ...(payload.password?.trim() && { password: payload.password }) };
                    fetchFnAfterAdd = fetchUsuarios; setDataFnAfterAdd = setUsuarios; successMessageSingular = 'Usuario'; break;
                default: throw new Error(`Tipo desconocido: ${currentSection}`);
            }

            const loggedPayload = currentSection === 'usuarios' ? { ...payload, password: payload.password ? '***' : undefined } : payload;
            console.log(`[handleSubmitAdd] Sending POST to ${apiUrl} with payload:`, loggedPayload);

            await axios.post(apiUrl, payload);

            if (fetchFnAfterAdd && setDataFnAfterAdd) {
                try {
                    const updatedData = await fetchFnAfterAdd();
                    if (currentSection === sectionIdentifierFromType(currentSection)) { // Re-check
                         setDataFnAfterAdd(updatedData);
                         setPage(0); // NUEVO: Resetear página después de agregar
                         await mostrarAlertaExito('Creado Exitosamente', `${successMessageSingular} agregado/a. La tabla se ha recargado.`);
                    } else { await mostrarAlertaExito('Creado Exitosamente', `${successMessageSingular} agregado/a.`); }
                } catch (refetchErr) {
                    console.error("[handleSubmitAdd] Error during refetch:", refetchErr);
                    await mostrarAlertaError('Creación Parcial', `${successMessageSingular} agregado/a, pero la tabla no pudo recargarse.`);
                }
            } else { await mostrarAlertaExito('Creado Exitosamente', `${successMessageSingular} agregado/a.`); }

            handleCloseAddModal();

        } catch (err) {
            console.error(`[handleSubmitAdd] Error for ${currentSection}:`, err);
            const errorMsg = err.response?.data?.message || err.message || `No se pudo agregar ${successMessageSingular}.`;
            await mostrarAlertaError('Error al Agregar', errorMsg);
        } finally {
            setIsAdding(false);
        }
    // MODIFICADO: Añadir setPage a las dependencias
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        currentSection, addFormData, handleCloseAddModal, areas,
        fetchAreas, setAreas, fetchTiposSolicitudesAdmin, setTiposSolicitudesAdmin, fetchUsuarios, setUsuarios, setPage // Añadir setPage
    ]);

    const sectionIdentifierFromType = (typeOrSection) => {
        const cleanType = typeOrSection?.replace(/-/g, '_');
        switch (cleanType) {
            case ENTITY_TYPES.AREA: case 'areas': return 'areas';
            case ENTITY_TYPES.TIPO_SOLICITUD: case 'tipos_solicitudes': return 'tipos-solicitudes';
            case ENTITY_TYPES.USUARIO: case 'usuarios': return 'usuarios';
            case ENTITY_TYPES.SOLICITUD: case 'solicitudes': return 'solicitudes';
            default: return null;
        }
    };

    // --- Contenido Sidebar ---
    const drawerContent = useMemo(() => (
        <SidebarAdmin currentSection={currentSection} onSelectSection={handleSelectSection} onCloseDrawer={handleDrawerClose} />
    ), [currentSection, handleSelectSection, handleDrawerClose]);

    // --- Estilos Celdas ---
    const headerCellStyle = useMemo(() => ({ fontWeight: 'bold', bgcolor: 'primary.main', color: 'primary.contrastText', py: { xs: 0.8, sm: 1 }, px: { xs: 1, sm: 1.5 }, whiteSpace: 'nowrap', fontSize: { xs: '0.75rem', sm: '0.875rem' } }), []);
    const bodyCellStyle = useMemo(() => ({ py: { xs: 0.75, sm: 1 }, px: { xs: 1, sm: 1.5 }, fontSize: { xs: '0.75rem', sm: '0.875rem' }, verticalAlign: 'middle' }), []);

    // --- Título Dinámico ---
    const getSectionTitle = useCallback(() => { /* ... sin cambios ... */
        if (!currentSection) return 'Portal Administración';
        switch (currentSection) {
            case 'solicitudes': return 'Gestionar Solicitudes';
            case 'areas': return 'Gestionar Áreas';
            case 'tipos-solicitudes': return 'Gestionar Tipos de Solicitud';
            case 'usuarios': return 'Gestionar Usuarios';
            default: return 'Administración';
        }
    }, [currentSection]);

    // --- ColSpan Dinámico ---
    const getCurrentColSpan = useCallback(() => { /* ... sin cambios ... */
        switch (currentSection) {
            case 'solicitudes': return 6;
            case 'areas': return 3;
            case 'tipos-solicitudes': return 4;
            case 'usuarios': return 7;
            default: return 1;
        }
    }, [currentSection]);

    // --- NUEVO: Handlers para Paginación ---
    const handleChangePage = useCallback((event, newPage) => {
        setPage(newPage);
    }, []);

    const handleChangeRowsPerPage = useCallback((event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0); // Resetear a la primera página cuando cambian las filas por página
    }, []);

    // --- Renderizado ---
    return (
        <ThemeProvider theme={currentTheme}>
            <CssBaseline />
            <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
                {/* --- Navbar --- */}
                <Navbar toggleTheme={toggleTheme} toggleSidebar={handleDrawerToggle} title="Portal Administración"/>

                {/* --- Sidebar --- */}
                <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
                    <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, bgcolor: 'background.paper' } }}> {drawerContent} </Drawer>
                    <Drawer variant="permanent" open sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, top: `${APP_BAR_HEIGHT}px`, height: `calc(100vh - ${APP_BAR_HEIGHT}px)`, borderRight: `1px solid ${currentTheme.palette.divider}`, bgcolor: 'background.paper' } }}> {drawerContent} </Drawer>
                </Box>

                {/* --- Contenido Principal --- */}
                <Box component="main" sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2, md: 3 }, width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` }, display: 'flex', flexDirection: 'column', mt: `${APP_BAR_HEIGHT}px`, height: `calc(100vh - ${APP_BAR_HEIGHT}px)`, overflow: 'hidden' }}>
                    <Card sx={{ width: '100%', flexGrow: 1, borderRadius: 2, boxShadow: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'background.paper' }}>
                        <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 }, display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>

                            {/* Cabecera: Título, Búsqueda y Botón Agregar */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2, flexShrink: 0 }}>
                                <Typography variant={isSmallScreen ? 'h6' : (isLargeScreen ? 'h4' : 'h5')} component="h1" sx={{ fontWeight: "bold", order: 1, mr: 'auto' }}> {getSectionTitle()} </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'nowrap', order: 2, ml: 2 }}>
                                    {!loading && !error && currentSection && (
                                        <TextField size="small" variant="outlined" placeholder="Buscar..." value={searchTerm} onChange={handleSearchChange} sx={{ width: { xs: '150px', sm: (currentSection !== 'solicitudes' ? 180: 250), md: (currentSection !== 'solicitudes' ? 230: 300) } }} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>), sx: { borderRadius: 2 } }} />
                                    )}
                                    {!loading && !error && currentSection && currentSection !== 'solicitudes' && (
                                        <Tooltip title={`Agregar Nuevo/a ${currentSection === 'areas' ? 'Área' : currentSection === 'tipos-solicitudes' ? 'Tipo de Solicitud' : 'Usuario'}`}>
                                            <span> <Button variant="contained" color="primary" size="medium" startIcon={<AddIcon />} onClick={handleOpenAddModal} disabled={isAdding || isSubmitting} sx={{ whiteSpace: 'nowrap', height: '40px' }} > Agregar </Button> </span>
                                        </Tooltip>
                                    )}
                                </Box>
                            </Box>

                            {/* Indicador Carga / Error / Inicial */}
                            {loading && ( <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 5, flexGrow: 1 }}> <CircularProgress /> <Typography sx={{ ml: 2 }} color="text.secondary">Cargando datos...</Typography> </Box> )}
                            {!loading && error && ( <Alert severity="error" sx={{ mb: 2, flexShrink: 0 }}> {`Error al cargar datos: ${error}`} </Alert> )}
                            {!loading && !error && !currentSection && ( <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, textAlign: 'center', color: 'text.secondary', p: 3 }}> <Typography variant="h6" component="p"> Selecciona una sección del menú lateral para comenzar. </Typography> </Box> )}

                             {/* Contenedor Tabla y Paginación */}
                            {!loading && !error && currentSection && (
                                <Fade in={true} timeout={300} style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    {/* Envolver TableContainer y TablePagination juntos si se desea un borde común */}
                                    <Paper sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: `1px solid ${currentTheme.palette.divider}`, borderRadius: 1.5, width: '100%', bgcolor: 'background.paper' }}>
                                        <TableContainer sx={{ flexGrow: 1, overflow: 'auto', /* Quitar borde y sombra si Paper los maneja */ boxShadow: 0, border: 0 }}>
                                            <Table stickyHeader size="small" sx={{ minWidth: 650 }}>
                                                {/* Cabeceras Dinámicas */}
                                                {currentSection === 'solicitudes' && ( <TableHead> <TableRow> <TableCell sx={headerCellStyle}>ID</TableCell> <TableCell sx={headerCellStyle}>RUT Vecino</TableCell> <TableCell sx={headerCellStyle}>Tipo</TableCell> <TableCell sx={headerCellStyle}>Fecha</TableCell> <TableCell sx={headerCellStyle}>Estado</TableCell> <TableCell sx={{ ...headerCellStyle, textAlign: 'right' }}>Acciones</TableCell> </TableRow> </TableHead> )}
                                                {currentSection === 'areas' && ( <TableHead> <TableRow> <TableCell sx={headerCellStyle}>ID</TableCell> <TableCell sx={headerCellStyle}>Nombre Área</TableCell> <TableCell sx={{ ...headerCellStyle, textAlign: 'right' }}>Acciones</TableCell> </TableRow> </TableHead> )}
                                                {currentSection === 'tipos-solicitudes' && ( <TableHead> <TableRow> <TableCell sx={headerCellStyle}>ID</TableCell> <TableCell sx={headerCellStyle}>Nombre Tipo</TableCell> <TableCell sx={headerCellStyle}>Área</TableCell> <TableCell sx={{ ...headerCellStyle, textAlign: 'right' }}>Acciones</TableCell> </TableRow> </TableHead> )}
                                                {currentSection === 'usuarios' && ( <TableHead> <TableRow> <TableCell sx={headerCellStyle}>RUT</TableCell> <TableCell sx={headerCellStyle}>Nombre</TableCell> <TableCell sx={headerCellStyle}>Apellido</TableCell> <TableCell sx={headerCellStyle}>Email</TableCell> <TableCell sx={headerCellStyle}>Rol</TableCell> <TableCell sx={headerCellStyle}>Área</TableCell> <TableCell sx={{ ...headerCellStyle, textAlign: 'right' }}>Acciones</TableCell> </TableRow> </TableHead> )}

                                                {/* Cuerpo de Tabla Dinámico CON PAGINACIÓN */}
                                                <TableBody>
                                                    {/* // MODIFICADO: Aplicar slice para paginación */}
                                                    {(rowsPerPage > 0
                                                        ? filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                                        : filteredData // Si rowsPerPage es -1 (All), no cortar
                                                    ).map((item) => {
                                                        // Usar 'item' en lugar de 'sol', 'area', 'tipo', 'user' para generalizar
                                                        // Renderizar fila según currentSection
                                                        if (currentSection === 'solicitudes') {
                                                            return ( <TableRow hover key={item.id_solicitud} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}> <TableCell sx={bodyCellStyle}>{item.id_formateado}</TableCell> <TableCell sx={bodyCellStyle}>{item.RUT_ciudadano}</TableCell> <TableCell sx={bodyCellStyle}>{item.nombre_tipo}</TableCell> <TableCell sx={bodyCellStyle}>{item.fecha_hora_envio ? new Date(item.fecha_hora_envio).toLocaleString('es-CL') : '-'}</TableCell> <TableCell sx={bodyCellStyle}>{item.estado}</TableCell> <TableCell sx={{ ...bodyCellStyle, textAlign: 'right' }}> <Tooltip title="Editar Estado Solicitud"> <IconButton size="small" onClick={() => handleOpenEditModal(item, ENTITY_TYPES.SOLICITUD)} color="primary" disabled={isSubmitting || isAdding}> <EditIcon fontSize="small"/> </IconButton> </Tooltip> </TableCell> </TableRow> );
                                                        } else if (currentSection === 'areas') {
                                                            return ( <TableRow hover key={item.id_area} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}> <TableCell sx={bodyCellStyle}>{item.id_area}</TableCell> <TableCell sx={bodyCellStyle}>{item.nombre_area}</TableCell> <TableCell sx={{ ...bodyCellStyle, textAlign: 'right' }}> <Tooltip title="Editar Área"> <IconButton size="small" onClick={() => handleOpenEditModal(item, ENTITY_TYPES.AREA)} color="primary" disabled={isSubmitting || isAdding}> <EditIcon fontSize="small"/> </IconButton> </Tooltip> </TableCell> </TableRow> );
                                                        } else if (currentSection === 'tipos-solicitudes') {
                                                            return ( <TableRow hover key={item.id_tipo} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}> <TableCell sx={bodyCellStyle}>{item.id_tipo}</TableCell> <TableCell sx={bodyCellStyle}>{item.nombre_tipo}</TableCell> <TableCell sx={bodyCellStyle}>{areaMap.get(item.area_id) || item.area_id || '-'}</TableCell> <TableCell sx={{ ...bodyCellStyle, textAlign: 'right' }}> <Tooltip title="Editar Tipo de Solicitud"> <IconButton size="small" onClick={() => handleOpenEditModal(item, ENTITY_TYPES.TIPO_SOLICITUD)} color="primary" disabled={isSubmitting || isAdding}> <EditIcon fontSize="small"/> </IconButton> </Tooltip> </TableCell> </TableRow> );
                                                        } else if (currentSection === 'usuarios') {
                                                            const userKey = item.RUT || `user-${item.id_usuario}`;
                                                            return ( <TableRow hover key={userKey} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}> <TableCell sx={bodyCellStyle}>{item.RUT || '-'}</TableCell> <TableCell sx={bodyCellStyle}>{item.nombre || '-'}</TableCell> <TableCell sx={bodyCellStyle}>{item.apellido || '-'}</TableCell> <TableCell sx={{ ...bodyCellStyle, wordBreak: 'break-all' }}>{item.correo_electronico || '-'}</TableCell> <TableCell sx={bodyCellStyle}>{item.rol || '-'}</TableCell> <TableCell sx={bodyCellStyle}>{areaMap.get(item.area_id) || '-'}</TableCell> <TableCell sx={{ ...bodyCellStyle, textAlign: 'right' }}> <Tooltip title="Editar Usuario"> <IconButton size="small" onClick={() => handleOpenEditModal(item, ENTITY_TYPES.USUARIO)} color="primary" disabled={isSubmitting || isAdding}> <EditIcon fontSize="small"/> </IconButton> </Tooltip> </TableCell> </TableRow> );
                                                        }
                                                        return null; // Caso improbable
                                                    })}
                                                    {/* Mostrar mensaje si no hay datos EN LA PÁGINA ACTUAL */}
                                                    {filteredData.length === 0 && (
                                                        <TableRow>
                                                            <TableCell colSpan={getCurrentColSpan()} align="center" sx={{ py: 4, fontStyle: 'italic', color: 'text.secondary' }}>
                                                                {searchTerm ? 'No se encontraron resultados para su búsqueda.' : 'No hay datos para mostrar en esta sección.'}
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                     {/* // NUEVO: Placeholder para filas vacías si la última página no está llena */}
                                                    {filteredData.length > 0 && rowsPerPage > 0 && (
                                                        <TableRow style={{ height: (53) * Math.max(0, rowsPerPage - filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).length) }}>
                                                            <TableCell colSpan={getCurrentColSpan()} />
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                        {/* --- NUEVO: Componente de Paginación --- */}
                                        {/* Renderizar solo si hay datos para paginar */}
                                        {filteredData.length > 0 && (
                                            <TablePagination
                                                rowsPerPageOptions={[5, 10, 25, { label: 'Todo', value: -1 }]} // Opciones de filas por página
                                                component="div" // Es importante para el layout
                                                count={filteredData.length} // Total de items FILTRADOS
                                                rowsPerPage={rowsPerPage}
                                                page={page} // 0-based
                                                onPageChange={handleChangePage}
                                                onRowsPerPageChange={handleChangeRowsPerPage}
                                                // Traducciones opcionales
                                                labelRowsPerPage="Filas por página:"
                                                labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`}
                                                sx={{ borderTop: `1px solid ${currentTheme.palette.divider}`, flexShrink: 0 }} // Estilo y evitar que se encoja
                                            />
                                        )}
                                    </Paper>
                                </Fade>
                            )}
                        </CardContent>
                    </Card>
                </Box> {/* Fin Main */}

                {/* --- Modal de Edición GENÉRICO --- */}
                {/* (Sin cambios dentro del modal de edición) */}
                {editingItem && ( <Dialog open={isEditModalOpen} onClose={handleCloseEditModal} maxWidth="sm" fullWidth> <DialogTitle> Editar {editingItemType === ENTITY_TYPES.SOLICITUD ? `Solicitud #${editingItem.id_formateado}` : editingItemType === ENTITY_TYPES.AREA ? `Área #${editingItem.id_area}` : editingItemType === ENTITY_TYPES.TIPO_SOLICITUD ? `Tipo Solicitud #${editingItem.id_tipo}` : editingItemType === ENTITY_TYPES.USUARIO ? `Usuario ${editingItem.RUT || editingItem.id_usuario}` : 'Elemento'} {editingItemType === ENTITY_TYPES.USUARIO && (editingItem.nombre || editingItem.apellido) && ` (${editingItem.nombre || ''} ${editingItem.apellido || ''})`.trim()} </DialogTitle> <DialogContent dividers> {/* ... (contenido igual que antes) ... */}{editingItemType === ENTITY_TYPES.SOLICITUD && ( <> <Typography variant="body2" gutterBottom> Vecino: {editingItem.RUT_ciudadano}<br/> Tipo: {editingItem.nombre_tipo} </Typography> <FormControl fullWidth margin="normal" disabled={isSubmitting}> <InputLabel id="estado-select-label">Estado</InputLabel> <Select labelId="estado-select-label" name="estado" value={formData.estado || ''} label="Estado" onChange={handleFormChange}> <MenuItem value="Pendiente">Pendiente</MenuItem><MenuItem value="Aprobada">Aprobada</MenuItem><MenuItem value="Rechazada">Rechazada</MenuItem> </Select> </FormControl> </> )} {editingItemType === ENTITY_TYPES.AREA && ( <TextField autoFocus margin="dense" name="nombre_area" label="Nombre del Área" type="text" fullWidth variant="outlined" value={formData.nombre_area || ''} onChange={handleFormChange} disabled={isSubmitting}/> )} {editingItemType === ENTITY_TYPES.TIPO_SOLICITUD && ( <> <TextField autoFocus margin="dense" name="nombre_tipo" label="Nombre del Tipo" type="text" fullWidth variant="outlined" value={formData.nombre_tipo || ''} onChange={handleFormChange} disabled={isSubmitting} sx={{ mb: 2 }}/> <TextField margin="dense" name="descripcion" label="Descripción" type="text" fullWidth multiline rows={3} variant="outlined" value={formData.descripcion || ''} onChange={handleFormChange} disabled={isSubmitting} sx={{ mb: 2 }}/> <FormControl fullWidth margin="normal" disabled={isSubmitting || loading} sx={{ mb: 2 }}> <InputLabel id="area-select-label">Área Asociada</InputLabel> <Select labelId="area-select-label" name="area_id" value={formData.area_id || ''} label="Área Asociada" onChange={handleFormChange}> <MenuItem value=""><em>Ninguna</em></MenuItem> {Array.isArray(areas) && areas.map((area) => ( <MenuItem key={area.id_area} value={area.id_area}>{area.nombre_area} (ID: {area.id_area})</MenuItem> ))} </Select> {!loading && !Array.isArray(areas) && <Typography variant="caption" color="error">Error al cargar áreas.</Typography>} {!loading && Array.isArray(areas) && areas.length === 0 && <Typography variant="caption" color="textSecondary">No hay áreas disponibles.</Typography>} </FormControl> </> )} {editingItemType === ENTITY_TYPES.USUARIO && ( <> <TextField autoFocus margin="dense" name="correo_electronico" label="Correo Electrónico" type="email" fullWidth variant="outlined" value={formData.correo_electronico || ''} onChange={handleFormChange} disabled={isSubmitting} sx={{ mb: 2 }}/> <FormControl fullWidth margin="normal" disabled={isSubmitting} sx={{ mb: 2 }}> <InputLabel id="rol-select-label">Rol</InputLabel> <Select labelId="rol-select-label" name="rol" value={formData.rol || ''} label="Rol" onChange={handleFormChange}> {ROLES_PERMITIDOS.map(rol => <MenuItem key={rol} value={rol}>{rol}</MenuItem>)} </Select> </FormControl> <FormControl fullWidth margin="normal" disabled={isSubmitting || loading} sx={{ mb: 2 }}> <InputLabel id="user-area-select-label">Área Asignada (Opcional)</InputLabel> <Select labelId="user-area-select-label" name="area_id" value={formData.area_id || ''} label="Área Asignada (Opcional)" onChange={handleFormChange}> <MenuItem value=""><em>Ninguna</em></MenuItem> {Array.isArray(areas) && areas.map((area) => ( <MenuItem key={area.id_area} value={area.id_area}>{area.nombre_area} (ID: {area.id_area})</MenuItem> ))} </Select> {!loading && !Array.isArray(areas) && <Typography variant="caption" color="error">Error al cargar áreas.</Typography>} {!loading && Array.isArray(areas) && areas.length === 0 && <Typography variant="caption" color="textSecondary">No hay áreas disponibles.</Typography>} </FormControl> <FormControlLabel control={ <Checkbox checked={formData.deletePassword || false} onChange={handleFormChange} name="deletePassword" disabled={isSubmitting} color="warning" /> } label="Eliminar contraseña existente" sx={{ mt: 1, display: 'block', mb: 1 }} /> <TextField margin="dense" name="password" label="Nueva Contraseña" type={showModalPassword ? 'text' : 'password'} fullWidth variant="outlined" value={formData.password || ''} onChange={handleFormChange} disabled={isSubmitting || formData.deletePassword} InputProps={{ endAdornment: ( <InputAdornment position="end"> <IconButton aria-label="toggle password visibility" onClick={handleClickShowPasswordModal} onMouseDown={handleMouseDownPasswordModal} edge="end" disabled={isSubmitting || formData.deletePassword} > {showModalPassword ? <VisibilityOff /> : <Visibility />} </IconButton> </InputAdornment> ), }} sx={{ mt: 1 }} helperText={formData.deletePassword ? "La contraseña actual será eliminada." : "Dejar en blanco para no cambiar la contraseña actual."} /> <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}> Las nuevas contraseñas se guardan de forma segura. </Typography> </> )}</DialogContent> <DialogActions sx={{p: '16px 24px'}}> <Button onClick={handleCloseEditModal} disabled={isSubmitting} color="inherit"> Cancelar </Button> <Box sx={{ position: 'relative' }}> <Button onClick={handleSubmitEdit} variant="contained" disabled={isSubmitting}> Guardar Cambios </Button> {isSubmitting && ( <CircularProgress size={24} sx={{ color: 'primary.main', position: 'absolute', top: '50%', left: '50%', marginTop: '-12px', marginLeft: '-12px' }}/> )} </Box> </DialogActions> </Dialog> )}

                {/* --- Modal de Agregar GENÉRICO --- */}
                {/* (Sin cambios dentro del modal de agregar) */}
                <Dialog open={isAddModalOpen} onClose={handleCloseAddModal} maxWidth="sm" fullWidth> <DialogTitle> Agregar Nuevo/a {currentSection === 'areas' ? 'Área' : currentSection === 'tipos-solicitudes' ? 'Tipo de Solicitud' : currentSection === 'usuarios' ? 'Usuario' : ''} </DialogTitle> <DialogContent dividers> {/* ... (contenido igual que antes) ... */} {currentSection === 'areas' && ( <TextField autoFocus required margin="dense" name="nombre_area" label="Nombre del Área" type="text" fullWidth variant="outlined" value={addFormData.nombre_area || ''} onChange={handleAddFormChange} disabled={isAdding} /> )} {currentSection === 'tipos-solicitudes' && ( <> <TextField autoFocus required margin="dense" name="nombre_tipo" label="Nombre del Tipo" type="text" fullWidth variant="outlined" value={addFormData.nombre_tipo || ''} onChange={handleAddFormChange} disabled={isAdding} sx={{ mb: 2 }} /> <TextField required margin="dense" name="descripcion" label="Descripción" type="text" fullWidth multiline rows={3} variant="outlined" value={addFormData.descripcion || ''} onChange={handleAddFormChange} disabled={isAdding} sx={{ mb: 2 }} /> <FormControl fullWidth required margin="normal" disabled={isAdding || loading} sx={{ mb: 2 }}> <InputLabel id="add-area-select-label">Área Asociada</InputLabel> <Select labelId="add-area-select-label" name="area_id" value={addFormData.area_id || ''} label="Área Asociada *" onChange={handleAddFormChange}> <MenuItem value="" disabled><em>Seleccione un área</em></MenuItem> {Array.isArray(areas) && areas.map((area) => ( <MenuItem key={area.id_area} value={area.id_area}>{area.nombre_area} (ID: {area.id_area})</MenuItem> ))} </Select> {!loading && !Array.isArray(areas) && <Typography variant="caption" color="error" sx={{mt:1}}>Error al cargar áreas.</Typography>} {!loading && Array.isArray(areas) && areas.length === 0 && <Typography variant="caption" color="textSecondary" sx={{mt:1}}>No hay áreas disponibles.</Typography>} </FormControl> </> )} {currentSection === 'usuarios' && ( <> <TextField autoFocus required margin="dense" name="rut" label="RUT (ej: 12345678-9)" type="text" fullWidth variant="outlined" value={addFormData.rut || ''} onChange={handleAddFormChange} disabled={isAdding} sx={{ mb: 2 }} error={!!addFormData.rut && !/^[0-9]+-[0-9kK]$/.test(addFormData.rut)} helperText={!!addFormData.rut && !/^[0-9]+-[0-9kK]$/.test(addFormData.rut) ? "Formato incorrecto" : ""}/> <TextField required margin="dense" name="nombre" label="Nombre" type="text" fullWidth variant="outlined" value={addFormData.nombre || ''} onChange={handleAddFormChange} disabled={isAdding} sx={{ mb: 2 }}/> <TextField required margin="dense" name="apellido" label="Apellido" type="text" fullWidth variant="outlined" value={addFormData.apellido || ''} onChange={handleAddFormChange} disabled={isAdding} sx={{ mb: 2 }}/> <TextField margin="dense" name="correo_electronico" label="Correo Electrónico (Opcional)" type="email" fullWidth variant="outlined" value={addFormData.correo_electronico || ''} onChange={handleAddFormChange} disabled={isAdding} sx={{ mb: 2 }}/> <FormControl fullWidth margin="normal" disabled={isAdding} sx={{ mb: 2 }}> <InputLabel id="add-rol-select-label">Rol (Defecto: Vecino)</InputLabel> <Select labelId="add-rol-select-label" name="rol" value={addFormData.rol || ''} label="Rol (Defecto: Vecino)" onChange={handleAddFormChange}> <MenuItem value=""><em>Vecino (Por defecto)</em></MenuItem> {ROLES_PERMITIDOS.map(rol => <MenuItem key={rol} value={rol}>{rol}</MenuItem>)} </Select> </FormControl> <FormControl fullWidth margin="normal" disabled={isAdding || loading} sx={{ mb: 2 }}> <InputLabel id="add-user-area-select-label">Área Asignada (Opcional)</InputLabel> <Select labelId="add-user-area-select-label" name="area_id" value={addFormData.area_id || ''} label="Área Asignada (Opcional)" onChange={handleAddFormChange}> <MenuItem value=""><em>Ninguna</em></MenuItem> {Array.isArray(areas) && areas.map((area) => ( <MenuItem key={area.id_area} value={area.id_area}>{area.nombre_area} (ID: {area.id_area})</MenuItem> ))} </Select> {!loading && !Array.isArray(areas) && <Typography variant="caption" color="error" sx={{mt:1}}>Error al cargar áreas.</Typography>} {!loading && Array.isArray(areas) && areas.length === 0 && <Typography variant="caption" color="textSecondary" sx={{mt:1}}>No hay áreas disponibles.</Typography>} </FormControl> <TextField margin="dense" name="password" label="Contraseña (Opcional)" type={showAddModalPassword ? 'text' : 'password'} fullWidth variant="outlined" value={addFormData.password || ''} onChange={handleAddFormChange} disabled={isAdding} InputProps={{ endAdornment: ( <InputAdornment position="end"> <IconButton aria-label="toggle password visibility" onClick={handleClickShowPasswordAddModal} onMouseDown={handleMouseDownPasswordAddModal} edge="end" disabled={isAdding} > {showAddModalPassword ? <VisibilityOff /> : <Visibility />} </IconButton> </InputAdornment> ), }} sx={{ mt: 1 }} helperText="Dejar en blanco para crear usuario sin contraseña." /> <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}> Las contraseñas se guardan de forma segura (si se proporciona). </Typography> </> )} </DialogContent> <DialogActions sx={{p: '16px 24px'}}> <Button onClick={handleCloseAddModal} disabled={isAdding} color="inherit"> Cancelar </Button> <Box sx={{ position: 'relative' }}> <Button onClick={handleSubmitAdd} variant="contained" disabled={isAdding} color="primary"> Agregar </Button> {isAdding && ( <CircularProgress size={24} sx={{ color: 'primary.main', position: 'absolute', top: '50%', left: '50%', marginTop: '-12px', marginLeft: '-12px' }} /> )} </Box> </DialogActions> </Dialog>

            </Box> {/* Fin Flex Principal */}
        </ThemeProvider>
    );
}

export default Administrador;