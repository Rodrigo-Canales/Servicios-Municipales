import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import {
    Box, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Button, CircularProgress, Fade,
    Card, CardContent, CssBaseline, ThemeProvider, Drawer, useMediaQuery,
    TextField, InputAdornment, Tooltip, Alert, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel,
    Checkbox, FormControlLabel // Importar Checkbox y FormControlLabel
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
// Importa componentes y utilidades (¡Asegúrate que las rutas sean correctas!)
import Navbar from "../Navbar";
import SidebarAdmin from "./SidebarAdmin";
import { lightTheme, darkTheme } from "../../theme";
import { mostrarAlertaExito, mostrarAlertaError } from "../../utils/alertUtils";

// --- Constantes ---
const APP_BAR_HEIGHT = 64;
const DRAWER_WIDTH = 240;
const ENTITY_TYPES = {
    SOLICITUD: 'solicitud',
    AREA: 'area',
    TIPO_SOLICITUD: 'tipo_solicitud',
    USUARIO: 'usuario',
};

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
    const [usuarios, setUsuarios] = useState([]); // Sin hash_password

    // --- Estados para el Modal de Edición Genérico ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editingItemType, setEditingItemType] = useState(null);
    const [formData, setFormData] = useState({}); // Incluirá deletePassword
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Estado para visibilidad de contraseña EN MODAL ---
    const [showModalPassword, setShowModalPassword] = useState(false);

    // --- Tema y Media Queries ---
    const currentTheme = useMemo(() => (mode === "light" ? lightTheme : darkTheme), [mode]);
    const isLargeScreen = useMediaQuery(currentTheme.breakpoints.up('md'));
    const isSmallScreen = useMediaQuery(currentTheme.breakpoints.down('sm'));

    // --- Handlers Layout ---
    const toggleTheme = useCallback(() => setMode((prev) => (prev === "light" ? "dark" : "light")), []);
    const handleDrawerToggle = useCallback(() => setMobileOpen(prev => !prev), []);
    const handleDrawerClose = useCallback(() => setMobileOpen(false), []);
    const handleSearchChange = useCallback((event) => setSearchTerm(event.target.value), []);

    // --- Handler Selección Sidebar ---
    const handleSelectSection = useCallback((sectionName) => {
        if (sectionName !== currentSection) {
            console.log(`[handleSelectSection] Changing section to ${sectionName}`);
            setCurrentSection(sectionName);
            setSearchTerm("");
            // Ya no hay estado de visibilidad de tabla que limpiar
        }
        handleDrawerClose();
    }, [currentSection, handleDrawerClose]);

    // --- Fetch Genérico (Limpia hash_password explícitamente) ---
    const fetchGenericData = useCallback(async (endpoint, sectionIdentifier) => {
        console.log(`[fetchGenericData] Fetching for ${sectionIdentifier} from ${endpoint}`);
        try {
            const response = await axios.get(endpoint);
            const data = response.data;
            let potentialData = null;

            // Extraer datos
            if (Array.isArray(data)) potentialData = data;
            else if (data && Array.isArray(data[sectionIdentifier])) potentialData = data[sectionIdentifier];
            else if (sectionIdentifier === 'solicitudes' && data?.solicitudes && Array.isArray(data.solicitudes)) potentialData = data.solicitudes;
            // Añadir más 'else if' si es necesario para otras estructuras de API

            if (Array.isArray(potentialData)) {
                console.log(`[fetchGenericData] Success. Received ${potentialData.length} items for ${sectionIdentifier}`);
                // Limpiar hash_password para usuarios ANTES de guardar en estado
                if (sectionIdentifier === 'usuarios') {
                    return potentialData.map(user => {
                        // Usar el prefijo _ para indicar variable no usada intencionalmente
                        const { hash_password: _discardedHash, ...userWithoutHash } = user;
                        return userWithoutHash;
                    });
                }
                return potentialData;
            } else {
                console.warn(`[fetchGenericData] Unexpected data format or empty array for ${sectionIdentifier}. Response:`, data);
                return []; // Devolver array vacío en caso de formato inesperado
            }
        } catch (err) {
            console.error(`[fetchGenericData] Network/Request Error fetching ${sectionIdentifier}:`, err);
            // Relanzar error para que useEffect lo maneje
            throw err;
        }
    }, []);

    // --- Wrappers de Fetch ---
    const fetchSolicitudes = useCallback(() => fetchGenericData('/api/solicitudes', 'solicitudes'), [fetchGenericData]);
    const fetchAreas = useCallback(() => fetchGenericData('/api/areas', 'areas'), [fetchGenericData]);
    const fetchTiposSolicitudesAdmin = useCallback(() => fetchGenericData('/api/tipos_solicitudes', 'tipos-solicitudes'), [fetchGenericData]);
    const fetchUsuarios = useCallback(() => fetchGenericData('/api/usuarios', 'usuarios'), [fetchGenericData]);

    // --- Efecto Principal para Cargar Datos (Corregido y Completo) ---
    useEffect(() => {
        // Si no hay sección seleccionada, resetear y salir.
        if (!currentSection) {
            setLoading(false); setError(null);
            setSolicitudes([]); setAreas([]); setTiposSolicitudesAdmin([]); setUsuarios([]);
            return;
        }

        let isMounted = true;
        const section = currentSection; // Captura la sección actual al inicio del efecto

        const loadData = async () => {
            console.log(`[useEffect] Loading data for section: ${section}`);
            if (isMounted) {
                setLoading(true);
                setError(null); // Limpiar errores previos
                 // Limpiar datos específicos SOLO de la sección actual antes de cargar
                switch (section) {
                    case 'solicitudes': setSolicitudes([]); break;
                    case 'areas': setAreas([]); break; // Limpiar areas si se selecciona areas
                    case 'tipos-solicitudes': setTiposSolicitudesAdmin([]); break;
                    case 'usuarios': setUsuarios([]); break;
                }
            }

            let fetchFn;
            let setDataFn;
            let needsAreas = false; // Flag para cargar áreas secundarias

            // Seleccionar la función de fetch principal y el setter
            switch (section) {
                case 'solicitudes': fetchFn = fetchSolicitudes; setDataFn = setSolicitudes; break;
                case 'areas': fetchFn = fetchAreas; setDataFn = setAreas; break; // Asignar correctamente para areas
                case 'tipos-solicitudes':
                    fetchFn = fetchTiposSolicitudesAdmin; setDataFn = setTiposSolicitudesAdmin; needsAreas = true; break;
                case 'usuarios':
                    fetchFn = fetchUsuarios; setDataFn = setUsuarios; needsAreas = true; break;
                default:
                    console.warn("[useEffect] Unknown section:", section);
                    if (isMounted) { setError(`Sección desconocida: ${section}`); setLoading(false); }
                    return;
            }

            try {
                // Ejecutar fetch principal
                const primaryData = await fetchFn();
                // Actualizar estado SOLO si el componente sigue montado Y la sección NO ha cambiado
                if (isMounted && currentSection === section) {
                    console.log(`[useEffect] Primary fetch successful for ${section}. Setting data.`);
                    setDataFn(primaryData);
                } else {
                    console.log(`[useEffect] Primary fetch done, but component unmounted or section changed (${currentSection}). Discarding data for ${section}.`);
                    if (isMounted) setLoading(false); // Asegurar quitar el loading si aún está montado pero cambió sección
                    return; // No continuar si cambió la sección o se desmontó
                }

                // Cargar áreas secundarias si es necesario y AÚN estamos en la sección correcta
                if (needsAreas && isMounted && currentSection === section) {
                    console.log(`[useEffect] Section ${section} needs areas. Fetching areas...`);
                    try {
                         // Usar directamente fetchAreas (ya memoizado)
                        const areasData = await fetchAreas();
                         // Re-verificar montaje y sección después del await
                        if (isMounted && currentSection === section) {
                            setAreas(areasData); // Actualizar estado de áreas
                            console.log(`[useEffect] Secondary areas fetch successful.`);
                        } else {
                            console.log(`[useEffect] Secondary areas fetch done, but component unmounted or section changed (${currentSection}). Discarding areas data.`);
                        }
                    } catch (areasErr) {
                        console.error(`[useEffect] Error fetching secondary areas for ${section}:`, areasErr);
                        if (isMounted && currentSection === section) {
                             // Considerar mostrar un error específico para las áreas si fallan,
                             // aunque el error principal ya debería estar visible.
                             // setError(prev => prev ? `${prev} / Error al cargar áreas.` : 'Error al cargar áreas asociadas.');
                        }
                    }
                }

            } catch (err) {
                // Manejar error del fetch principal (o secundario si relanza)
                if (isMounted && currentSection === section) {
                    console.error(`[useEffect] Error loading data for ${section}:`, err);
                    const apiError = err.response?.data?.message;
                    setError(apiError || err.message || `Error al cargar ${section}.`);
                } else {
                    console.log(`[useEffect] Error occurred, but component unmounted or section changed (${currentSection}). Ignoring error for ${section}.`);
                }
            } finally {
                // Quitar el loading SOLO si el componente sigue montado Y la sección NO ha cambiado
                if (isMounted && currentSection === section) {
                    console.log(`[useEffect] Setting loading=false for ${section}.`);
                    setLoading(false);
                } else {
                    console.log(`[useEffect] Loading finished, but component unmounted or section changed (${currentSection}). Loading state might be stale.`);
                }
            }
        }; // Fin de loadData

        loadData(); // Ejecutar la carga

        // Función de limpieza
        return () => {
            console.log(`[useEffect] Cleanup for section: ${section}`);
            isMounted = false; // Marcar como desmontado
        };
    // Dependencias: la sección actual y las funciones de fetch (que están memoizadas)
    }, [currentSection, fetchSolicitudes, fetchAreas, fetchTiposSolicitudesAdmin, fetchUsuarios]);


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
        if (!Array.isArray(dataToFilter)) {
            console.warn(`[filteredData] dataToFilter is not an array for section ${currentSection}`);
            return [];
        }
        if (!searchTerm.trim()) return dataToFilter;
        const lowerSearch = searchTerm.toLowerCase();
        try {
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


    // --- Handlers Modal Edición GENÉRICO ---
    const handleOpenEditModal = useCallback((item, type) => {
        console.log(`[handleOpenEditModal] Opening modal for type: ${type}, item:`, item);
        setEditingItem(item); setEditingItemType(type); setShowModalPassword(false);
        let initialFormData = {};
        switch (type) {
            case ENTITY_TYPES.SOLICITUD: initialFormData = { estado: item.estado || '' }; break;
            case ENTITY_TYPES.AREA: initialFormData = { nombre_area: item.nombre_area || '' }; break;
            case ENTITY_TYPES.TIPO_SOLICITUD: initialFormData = { nombre_tipo: item.nombre_tipo || '', area_id: item.area_id || '' }; break;
            case ENTITY_TYPES.USUARIO:
                initialFormData = {
                    correo_electronico: item.correo_electronico || '', rol: item.rol || '', area_id: item.area_id || '',
                    password: '', // Campo para nueva contraseña
                    deletePassword: false // Checkbox para eliminar
                }; break;
            default: console.error("Tipo desconocido en handleOpenEditModal:", type); return;
        }
        setFormData(initialFormData); setIsEditModalOpen(true);
    }, []); // Dependencias vacías

    const handleCloseEditModal = useCallback(() => {
        if (!isSubmitting) {
            setIsEditModalOpen(false);
            // Delay para permitir animación de cierre antes de resetear estado
            setTimeout(() => {
                setEditingItem(null);
                setEditingItemType(null);
                setFormData({});
                setShowModalPassword(false);
            }, 300);
        }
    }, [isSubmitting]); // Depende de isSubmitting

    // Ajustado para manejar Checkbox
    const handleFormChange = useCallback((event) => {
        const { name, value, type, checked } = event.target;
        const newValue = type === 'checkbox' ? checked : value;

        setFormData(prev => {
            const updatedData = { ...prev, [name]: newValue };
            // Si se marca "Eliminar contraseña", limpiar el campo de nueva contraseña
            if (name === 'deletePassword' && newValue === true) {
                updatedData.password = '';
            }
            return updatedData;
        });
    }, []); // Dependencias vacías

    const handleClickShowPasswordModal = useCallback(() => { setShowModalPassword((show) => !show); }, []); // Dependencias vacías
    const handleMouseDownPasswordModal = useCallback((event) => { event.preventDefault(); }, []); // Dependencias vacías

    // --- Submit Edición GENÉRICO (Con bloque de comparación corregido) ---
    const handleSubmitEdit = useCallback(async () => {
        if (!editingItem || !editingItemType) {
            console.warn("Submit attempt with invalid editing item/type");
            return;
        }

        // --- Determinar Datos Iniciales y Comparación de Cambios ---
        let initialDataForComparison = {};
        // Define el objeto base para comparar según el tipo de entidad
        switch (editingItemType) {
            case ENTITY_TYPES.SOLICITUD: initialDataForComparison = { estado: editingItem.estado || '' }; break;
            case ENTITY_TYPES.AREA: initialDataForComparison = { nombre_area: editingItem.nombre_area || '' }; break;
            case ENTITY_TYPES.TIPO_SOLICITUD: initialDataForComparison = { nombre_tipo: editingItem.nombre_tipo || '', area_id: editingItem.area_id || '' }; break;
            case ENTITY_TYPES.USUARIO:
                initialDataForComparison = {
                    correo_electronico: editingItem.correo_electronico || '', rol: editingItem.rol || '', area_id: editingItem.area_id || '',
                     password: '', // Siempre comparar nueva contraseña con vacío
                     deletePassword: false // Estado inicial del checkbox
                }; break;
            default:
                console.error("Tipo desconocido en comparación de cambios:", editingItemType);
                 return; // Salir si el tipo es inválido
        }

        let hasChanged = false;
        // Iterar sobre las claves del estado actual del formulario (formData)
        for (const key in formData) {
            // 1. Asegurarse de que la clave existe en el objeto de comparación inicial.
            //    Usar Object.prototype.hasOwnProperty.call para compatibilidad
            if (!Object.prototype.hasOwnProperty.call(initialDataForComparison, key)) {
                console.warn(`[Change Detection] Key "${key}" in formData not found in initial comparison object. Skipping.`);
                continue; // Saltar esta clave si no es relevante para la comparación
            }

            // 2. Lógica especial para la contraseña:
            //    Si se marcó "Eliminar contraseña", ignoramos cualquier cambio
            //    en el campo 'password' (porque lo vaciamos a propósito).
            if (key === 'password' && formData.deletePassword === true) {
                continue;
            }

            // 3. Comparar valores:
            const initialValue = initialDataForComparison[key];
            const currentValue = formData[key];

            // Convertir a string para una comparación más robusta
            const comparisonInitial = String(initialValue ?? '');
            const comparisonCurrent = String(currentValue ?? '');

            // 4. Detectar diferencia
            if (comparisonCurrent !== comparisonInitial) {
                console.log(`[Change Detection] Change detected in field '${key}': FROM`, initialValue, `(${comparisonInitial})`, 'TO', currentValue, `(${comparisonCurrent})`);
                hasChanged = true; // Marcar que hubo un cambio
                break; // Salir del bucle tan pronto como se detecta el primer cambio
            }
        }
        // --- Fin Comparación ---


        // Si no hubo cambios detectables, informar y salir
        if (!hasChanged) {
            console.log("[handleSubmit] No changes detected.");
            mostrarAlertaExito("Sin cambios", "No se detectaron cambios para guardar.");
            handleCloseEditModal(); // Cerrar el modal
            return;
        }

        // --- Preparación y Ejecución Petición ---
        console.log("[handleSubmit] Changes detected, proceeding with submission...");
        setIsSubmitting(true);
        let apiUrl = '';
        let itemId = null;
        let payload = {};
        let fetchFnAfterUpdate = null;
        let setDataFnAfterUpdate = null;
        let successMessage = '';
        let idField = '';
        const httpMethod = 'put'; // O 'patch' según tu API

        try {
            switch (editingItemType) {
                case ENTITY_TYPES.SOLICITUD:
                    idField='id_solicitud'; itemId=editingItem[idField]; apiUrl=`/api/solicitudes/estado/${itemId}`; payload={estado: formData.estado};
                    fetchFnAfterUpdate=fetchSolicitudes; setDataFnAfterUpdate=setSolicitudes; successMessage='Estado de solicitud actualizado.'; break;
                case ENTITY_TYPES.AREA:
                    idField='id_area'; itemId=editingItem[idField]; apiUrl=`/api/areas/${itemId}`; payload={nombre_area: formData.nombre_area};
                    fetchFnAfterUpdate=fetchAreas; setDataFnAfterUpdate=setAreas; successMessage='Área actualizada.'; break;
                case ENTITY_TYPES.TIPO_SOLICITUD:
                    idField='id_tipo'; itemId=editingItem[idField]; apiUrl=`/api/tipos_solicitudes/${itemId}`; payload={nombre_tipo: formData.nombre_tipo, area_id: formData.area_id || null};
                    fetchFnAfterUpdate=fetchTiposSolicitudesAdmin; setDataFnAfterUpdate=setTiposSolicitudesAdmin; successMessage='Tipo de solicitud actualizado.'; break;
                case ENTITY_TYPES.USUARIO:
                    idField = 'RUT'; itemId = editingItem[idField];
                    if (!itemId) throw new Error("RUT de usuario no encontrado para la actualización.");
                    apiUrl = `/api/usuarios/${encodeURIComponent(itemId)}`;
                    payload = { correo_electronico: formData.correo_electronico, rol: formData.rol, area_id: formData.area_id || null };
                    if (formData.deletePassword === true) {
                         payload.deletePassword = true; // ¡Backend debe manejar esto!
                    } else if (formData.password && formData.password.trim() !== '') {
                        payload.password = formData.password;
                    }
                    fetchFnAfterUpdate = fetchUsuarios; setDataFnAfterUpdate = setUsuarios; successMessage = 'Usuario actualizado.';
                    break;
                default: throw new Error(`Tipo de entidad desconocido para submit: ${editingItemType}`);
            }

            // Log seguro del payload
            const loggedPayload = editingItemType === ENTITY_TYPES.USUARIO ? { ...payload, password: payload.password ? '***' : undefined } : payload;
            console.log(`[handleSubmit] Sending ${httpMethod.toUpperCase()} to ${apiUrl} with payload:`, loggedPayload);

            await axios[httpMethod](apiUrl, payload);
            console.log(`[handleSubmit] ${httpMethod.toUpperCase()} successful for ${editingItemType} ${itemId}`);

            // --- Refresco de Datos ---
            const currentSectionMatchesEntityType =
                (editingItemType === ENTITY_TYPES.SOLICITUD && currentSection === 'solicitudes') || (editingItemType === ENTITY_TYPES.AREA && currentSection === 'areas') ||
                (editingItemType === ENTITY_TYPES.TIPO_SOLICITUD && currentSection === 'tipos-solicitudes') || (editingItemType === ENTITY_TYPES.USUARIO && currentSection === 'usuarios');

                if (currentSectionMatchesEntityType && fetchFnAfterUpdate && setDataFnAfterUpdate) {
                    console.log(`[handleSubmit] Refetching ${currentSection}...`);
                    try {
                        const updatedData = await fetchFnAfterUpdate();
                        if (currentSectionMatchesEntityType) {
                            setDataFnAfterUpdate(updatedData);
                            console.log(`[handleSubmit] Refetch successful, state updated.`);
                            await mostrarAlertaExito('Actualizado', `${successMessage} La tabla se ha recargado.`);
                        } else { await mostrarAlertaExito('Actualizado', successMessage); }
                    // --- LÍNEA CORREGIDA ---
                    } catch (_refetchErr) { // Renombrado a _refetchErr
                    // --- FIN LÍNEA CORREGIDA ---
                        // --- LÍNEA CORREGIDA ---
                        console.error("[handleSubmit] Error during refetch:", _refetchErr); // Usar el nuevo nombre
                        // --- FIN LÍNEA CORREGIDA ---
                        await mostrarAlertaError('Actualización Parcial', `${successMessage} pero la tabla no pudo recargarse automáticamente.`);
                    }
                } else { await mostrarAlertaExito('Actualizado', successMessage); }

                handleCloseEditModal();

        } catch (err) {
            console.error(`[handleSubmit] Error during ${httpMethod.toUpperCase()} for ${editingItemType} ${itemId || 'unknown'}:`, err);
            const errorMsg = err.response?.data?.message || err.message || `No se pudo actualizar ${editingItemType}.`;
            await mostrarAlertaError('Error al Actualizar', errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    // Dependencias de useCallback
    }, [
        editingItem, editingItemType, formData, currentSection, handleCloseEditModal,
        fetchSolicitudes, setSolicitudes, fetchAreas, setAreas, fetchTiposSolicitudesAdmin, setTiposSolicitudesAdmin, fetchUsuarios, setUsuarios
    ]); // Fin de handleSubmitEdit


    // --- Contenido Sidebar ---
    const drawerContent = useMemo(() => (
        <SidebarAdmin
            currentSection={currentSection}
            onSelectSection={handleSelectSection}
            onCloseDrawer={handleDrawerClose}
        />
    ), [currentSection, handleSelectSection, handleDrawerClose]);


    // --- Estilos Celdas ---
    const headerCellStyle = useMemo(() => ({ fontWeight: 'bold', bgcolor: 'primary.main', color: 'primary.contrastText', py: { xs: 0.8, sm: 1 }, px: { xs: 1, sm: 1.5 }, whiteSpace: 'nowrap', fontSize: { xs: '0.75rem', sm: '0.875rem' } }), []);
    const bodyCellStyle = useMemo(() => ({ py: { xs: 0.75, sm: 1 }, px: { xs: 1, sm: 1.5 }, fontSize: { xs: '0.75rem', sm: '0.875rem' }, verticalAlign: 'middle' }), []);

    // --- Título Dinámico ---
    const getSectionTitle = useCallback(() => {
        if (!currentSection) return 'Portal Administración';
        switch (currentSection) {
            case 'solicitudes': return 'Gestionar Solicitudes';
            case 'areas': return 'Gestionar Áreas';
            case 'tipos-solicitudes': return 'Gestionar Tipos de Solicitud';
            case 'usuarios': return 'Gestionar Usuarios';
            default: return 'Administración';
        }
    }, [currentSection]);

     // --- ColSpan Dinámico (Usuario vuelve a 7) ---
    const getCurrentColSpan = useCallback(() => {
        switch (currentSection) {
            case 'solicitudes': return 6;
            case 'areas': return 3;
            case 'tipos-solicitudes': return 4;
            case 'usuarios': return 7; // RUT, Nombre, Apellido, Email, Rol, Área, Acciones
            default: return 1;
        }
    }, [currentSection]);

    // --- Renderizado ---
    return (
        <ThemeProvider theme={currentTheme}>
            <CssBaseline />
            <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
                {/* --- Navbar --- */}
                <Navbar toggleTheme={toggleTheme} toggleSidebar={handleDrawerToggle} title="Portal Administración"/>

                {/* --- Sidebar --- */}
                <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
                    {/* Drawer Móvil */}
                    <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, bgcolor: 'background.paper' } }}>
                        {drawerContent}
                    </Drawer>
                    {/* Drawer Desktop */}
                    <Drawer variant="permanent" open sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, top: `${APP_BAR_HEIGHT}px`, height: `calc(100vh - ${APP_BAR_HEIGHT}px)`, borderRight: `1px solid ${currentTheme.palette.divider}`, bgcolor: 'background.paper' } }}>
                        {drawerContent}
                    </Drawer>
                </Box>

                {/* --- Contenido Principal --- */}
                <Box component="main" sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2, md: 3 }, width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` }, display: 'flex', flexDirection: 'column', mt: `${APP_BAR_HEIGHT}px`, height: `calc(100vh - ${APP_BAR_HEIGHT}px)`, overflow: 'hidden' }}>
                    <Card sx={{ width: '100%', flexGrow: 1, borderRadius: 2, boxShadow: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'background.paper' }}>
                        <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 }, display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>

                            {/* Cabecera: Título y Búsqueda */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2, flexShrink: 0 }}>
                                <Typography variant={isSmallScreen ? 'h6' : (isLargeScreen ? 'h4' : 'h5')} component="h1" sx={{ fontWeight: "bold" }}>
                                    {getSectionTitle()}
                                </Typography>
                                {!loading && !error && currentSection && (
                                    <TextField
                                        size="small"
                                        variant="outlined"
                                        placeholder="Buscar..."
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                        sx={{ width: { xs: '100%', sm: 250, md: 300 } }}
                                        InputProps={{
                                            startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>),
                                            sx: { borderRadius: 2 }
                                        }}
                                    />
                                )}
                            </Box>

                            {/* Indicador Carga / Error / Inicial */}
                            {loading && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 5, flexGrow: 1 }}>
                                    <CircularProgress />
                                    <Typography sx={{ ml: 2 }} color="text.secondary">Cargando datos...</Typography>
                                </Box>
                            )}
                            {!loading && error && (
                                <Alert severity="error" sx={{ mb: 2, flexShrink: 0 }}>
                                    {`Error al cargar datos: ${error}`}
                                </Alert>
                            )}
                            {!loading && !error && !currentSection && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, textAlign: 'center', color: 'text.secondary', p: 3 }}>
                                    <Typography variant="h6" component="p">
                                        Selecciona una sección del menú lateral para comenzar.
                                    </Typography>
                                </Box>
                            )}

                             {/* Contenedor Tabla */}
                            {!loading && !error && currentSection && (
                                <Fade in={true} timeout={300} style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    <TableContainer component={Paper} sx={{ flexGrow: 1, overflow: 'auto', boxShadow: 0, border: `1px solid ${currentTheme.palette.divider}`, borderRadius: 1.5, width: '100%', bgcolor: 'background.paper' }}>
                                        <Table stickyHeader size="small" sx={{ minWidth: 650 }}>
                                            {/* --- Cabeceras Dinámicas (Usuario sin Contraseña) --- */}
                                            {currentSection === 'solicitudes' && (
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell sx={headerCellStyle}>ID</TableCell>
                                                        <TableCell sx={headerCellStyle}>RUT Vecino</TableCell>
                                                        <TableCell sx={headerCellStyle}>Tipo</TableCell>
                                                        <TableCell sx={headerCellStyle}>Fecha</TableCell>
                                                        <TableCell sx={headerCellStyle}>Estado</TableCell>
                                                        <TableCell sx={{ ...headerCellStyle, textAlign: 'right' }}>Acciones</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                            )}
                                            {currentSection === 'areas' && (
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell sx={headerCellStyle}>ID</TableCell>
                                                        <TableCell sx={headerCellStyle}>Nombre Área</TableCell>
                                                        <TableCell sx={{ ...headerCellStyle, textAlign: 'right' }}>Acciones</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                            )}
                                            {currentSection === 'tipos-solicitudes' && (
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell sx={headerCellStyle}>ID</TableCell>
                                                        <TableCell sx={headerCellStyle}>Nombre Tipo</TableCell>
                                                        <TableCell sx={headerCellStyle}>Área</TableCell>
                                                        <TableCell sx={{ ...headerCellStyle, textAlign: 'right' }}>Acciones</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                            )}
                                            {currentSection === 'usuarios' && (
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell sx={headerCellStyle}>RUT</TableCell>
                                                        <TableCell sx={headerCellStyle}>Nombre</TableCell>
                                                        <TableCell sx={headerCellStyle}>Apellido</TableCell>
                                                        <TableCell sx={headerCellStyle}>Email</TableCell>
                                                        <TableCell sx={headerCellStyle}>Rol</TableCell>
                                                        <TableCell sx={headerCellStyle}>Área</TableCell>
                                                         {/* SIN CELDA CONTRASEÑA */}
                                                        <TableCell sx={{ ...headerCellStyle, textAlign: 'right' }}>Acciones</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                            )}

                                            {/* --- Cuerpo de Tabla Dinámico (Usuario sin Contraseña) --- */}
                                            <TableBody>
                                                {filteredData.length > 0 ? (
                                                    <>
                                                        {/* Mapeo Solicitudes */}
                                                        {currentSection === 'solicitudes' && filteredData.map((sol) => (
                                                            <TableRow hover key={sol.id_solicitud} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                                <TableCell sx={bodyCellStyle}>{sol.id_formateado}</TableCell>
                                                                <TableCell sx={bodyCellStyle}>{sol.RUT_ciudadano}</TableCell>
                                                                <TableCell sx={bodyCellStyle}>{sol.nombre_tipo}</TableCell>
                                                                <TableCell sx={bodyCellStyle}>{sol.fecha_hora_envio ? new Date(sol.fecha_hora_envio).toLocaleString('es-CL') : '-'}</TableCell>
                                                                <TableCell sx={bodyCellStyle}>{sol.estado}</TableCell>
                                                                <TableCell sx={{ ...bodyCellStyle, textAlign: 'right' }}>
                                                                    <Tooltip title="Editar Estado Solicitud">
                                                                        <IconButton size="small" onClick={() => handleOpenEditModal(sol, ENTITY_TYPES.SOLICITUD)} color="primary" disabled={isSubmitting}>
                                                                            <EditIcon fontSize="small"/>
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                        {/* Mapeo Areas */}
                                                        {currentSection === 'areas' && filteredData.map((area) => (
                                                            <TableRow hover key={area.id_area} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                                <TableCell sx={bodyCellStyle}>{area.id_area}</TableCell>
                                                                <TableCell sx={bodyCellStyle}>{area.nombre_area}</TableCell>
                                                                <TableCell sx={{ ...bodyCellStyle, textAlign: 'right' }}>
                                                                    <Tooltip title="Editar Área">
                                                                        <IconButton size="small" onClick={() => handleOpenEditModal(area, ENTITY_TYPES.AREA)} color="primary" disabled={isSubmitting}>
                                                                            <EditIcon fontSize="small"/>
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                        {/* Mapeo Tipos Solicitud */}
                                                        {currentSection === 'tipos-solicitudes' && filteredData.map((tipo) => (
                                                            <TableRow hover key={tipo.id_tipo} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                                <TableCell sx={bodyCellStyle}>{tipo.id_tipo}</TableCell>
                                                                <TableCell sx={bodyCellStyle}>{tipo.nombre_tipo}</TableCell>
                                                                <TableCell sx={bodyCellStyle}>{areaMap.get(tipo.area_id) || tipo.area_id || '-'}</TableCell> {/* Mostrar nombre de área */}
                                                                <TableCell sx={{ ...bodyCellStyle, textAlign: 'right' }}>
                                                                    <Tooltip title="Editar Tipo de Solicitud">
                                                                        <IconButton size="small" onClick={() => handleOpenEditModal(tipo, ENTITY_TYPES.TIPO_SOLICITUD)} color="primary" disabled={isSubmitting}>
                                                                            <EditIcon fontSize="small"/>
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                        {/* Mapeo Usuarios (Sin Contraseña) */}
                                                        {currentSection === 'usuarios' && filteredData.map((user) => {
                                                            const userKey = user.RUT || `user-${user.id_usuario}`; // Usar RUT como clave si existe
                                                            return (
                                                                <TableRow hover key={userKey} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                                    <TableCell sx={bodyCellStyle}>{user.RUT || '-'}</TableCell>
                                                                    <TableCell sx={bodyCellStyle}>{user.nombre || '-'}</TableCell>
                                                                    <TableCell sx={bodyCellStyle}>{user.apellido || '-'}</TableCell>
                                                                    <TableCell sx={{ ...bodyCellStyle, wordBreak: 'break-all' }}>{user.correo_electronico || '-'}</TableCell>
                                                                    <TableCell sx={bodyCellStyle}>{user.rol || '-'}</TableCell>
                                                                    {/* Celda Área */}
                                                                    <TableCell sx={bodyCellStyle}>{areaMap.get(user.area_id) || '-'}</TableCell>
                                                                    {/* SIN CELDA CONTRASEÑA */}
                                                                    <TableCell sx={{ ...bodyCellStyle, textAlign: 'right' }}>
                                                                        <Tooltip title="Editar Usuario">
                                                                            <IconButton size="small" onClick={() => handleOpenEditModal(user, ENTITY_TYPES.USUARIO)} color="primary" disabled={isSubmitting}>
                                                                                <EditIcon fontSize="small"/>
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </>
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={getCurrentColSpan()} align="center" sx={{ py: 4, fontStyle: 'italic', color: 'text.secondary' }}>
                                                            {searchTerm ? 'No se encontraron resultados para su búsqueda.' : 'No hay datos para mostrar en esta sección.'}
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Fade>
                            )}
                        </CardContent>
                    </Card>
                </Box> {/* Fin Main */}

                {/* --- Modal de Edición GENÉRICO (Usuario con Checkbox Eliminar) --- */}
                {editingItem && (
                    <Dialog open={isEditModalOpen} onClose={handleCloseEditModal} maxWidth="sm" fullWidth>
                        {/* Título Dinámico */}
                        <DialogTitle>
                            Editar {editingItemType === ENTITY_TYPES.SOLICITUD ? `Solicitud #${editingItem.id_formateado}` : editingItemType === ENTITY_TYPES.AREA ? `Área #${editingItem.id_area}` : editingItemType === ENTITY_TYPES.TIPO_SOLICITUD ? `Tipo Solicitud #${editingItem.id_tipo}` : editingItemType === ENTITY_TYPES.USUARIO ? `Usuario ${editingItem.RUT || editingItem.id_usuario}` : 'Elemento'}
                            {editingItemType === ENTITY_TYPES.USUARIO && (editingItem.nombre || editingItem.apellido) && ` (${editingItem.nombre || ''} ${editingItem.apellido || ''})`.trim()}
                        </DialogTitle>

                        {/* Contenido Dinámico del Formulario */}
                        <DialogContent dividers>
                            {/* Formulario Solicitud */}
                            {editingItemType === ENTITY_TYPES.SOLICITUD && (
                                <>
                                    <Typography variant="body2" gutterBottom> Vecino: {editingItem.RUT_ciudadano}<br/> Tipo: {editingItem.nombre_tipo} </Typography>
                                    <FormControl fullWidth margin="normal" disabled={isSubmitting}>
                                        <InputLabel id="estado-select-label">Estado</InputLabel>
                                        <Select labelId="estado-select-label" name="estado" value={formData.estado || ''} label="Estado" onChange={handleFormChange}>
                                            <MenuItem value="Pendiente">Pendiente</MenuItem><MenuItem value="Aprobada">Aprobada</MenuItem><MenuItem value="Rechazada">Rechazada</MenuItem>
                                        </Select>
                                    </FormControl>
                                </>
                            )}
                            {/* Formulario Área */}
                            {editingItemType === ENTITY_TYPES.AREA && (
                                <TextField autoFocus margin="dense" name="nombre_area" label="Nombre del Área" type="text" fullWidth variant="outlined" value={formData.nombre_area || ''} onChange={handleFormChange} disabled={isSubmitting}/>
                            )}
                            {/* Formulario Tipo Solicitud */}
                            {editingItemType === ENTITY_TYPES.TIPO_SOLICITUD && (
                                <>
                                    <TextField autoFocus margin="dense" name="nombre_tipo" label="Nombre del Tipo" type="text" fullWidth variant="outlined" value={formData.nombre_tipo || ''} onChange={handleFormChange} disabled={isSubmitting} sx={{ mb: 2 }}/>
                                    <FormControl fullWidth margin="normal" disabled={isSubmitting || loading} sx={{ mb: 2 }}>
                                        <InputLabel id="area-select-label">Área Asociada</InputLabel>
                                        <Select labelId="area-select-label" name="area_id" value={formData.area_id || ''} label="Área Asociada" onChange={handleFormChange}>
                                            <MenuItem value=""><em>Ninguna</em></MenuItem>
                                            {Array.isArray(areas) && areas.map((area) => ( <MenuItem key={area.id_area} value={area.id_area}>{area.nombre_area} (ID: {area.id_area})</MenuItem> ))}
                                        </Select>
                                        {!loading && !Array.isArray(areas) && <Typography variant="caption" color="error">Error al cargar áreas.</Typography>}
                                        {!loading && Array.isArray(areas) && areas.length === 0 && <Typography variant="caption" color="textSecondary">No hay áreas disponibles.</Typography>}
                                    </FormControl>
                                </>
                            )}
                             {/* --- Formulario Usuario (con Checkbox Eliminar) --- */}
                            {editingItemType === ENTITY_TYPES.USUARIO && (
                                <>
                                    <TextField autoFocus margin="dense" name="correo_electronico" label="Correo Electrónico" type="email" fullWidth variant="outlined" value={formData.correo_electronico || ''} onChange={handleFormChange} disabled={isSubmitting} sx={{ mb: 2 }}/>
                                    <FormControl fullWidth margin="normal" disabled={isSubmitting} sx={{ mb: 2 }}>
                                        <InputLabel id="rol-select-label">Rol</InputLabel>
                                        <Select labelId="rol-select-label" name="rol" value={formData.rol || ''} label="Rol" onChange={handleFormChange}>
                                            {/* Ajusta estos roles a los que realmente uses */}
                                            <MenuItem value="Administrador">Administrador</MenuItem>
                                            <MenuItem value="Funcionario">Funcionario</MenuItem>
                                            <MenuItem value="Vecino">Vecino</MenuItem>
                                        </Select>
                                    </FormControl>
                                     <FormControl fullWidth margin="normal" disabled={isSubmitting || loading} sx={{ mb: 2 }}> {/* Deshabilitar si carga áreas */}
                                        <InputLabel id="user-area-select-label">Área Asignada (Opcional)</InputLabel>
                                        <Select labelId="user-area-select-label" name="area_id" value={formData.area_id || ''} label="Área Asignada (Opcional)" onChange={handleFormChange}>
                                            <MenuItem value=""><em>Ninguna</em></MenuItem>
                                            {/* Asegurarse que 'areas' sea un array antes de mapear */}
                                            {Array.isArray(areas) && areas.map((area) => (
                                                <MenuItem key={area.id_area} value={area.id_area}>
                                                    {area.nombre_area} (ID: {area.id_area})
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {/* Mostrar feedback de carga de áreas */}
                                        {!loading && !Array.isArray(areas) && <Typography variant="caption" color="error">Error al cargar áreas.</Typography>}
                                        {!loading && Array.isArray(areas) && areas.length === 0 && <Typography variant="caption" color="textSecondary">No hay áreas disponibles.</Typography>}
                                    </FormControl>

                                    {/* Checkbox para Eliminar Contraseña */}
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={formData.deletePassword || false}
                                                onChange={handleFormChange}
                                                name="deletePassword"
                                                disabled={isSubmitting}
                                                color="warning" // Color distintivo
                                            />
                                        }
                                        label="Eliminar contraseña existente (dejar al usuario sin contraseña)"
                                        sx={{ mt: 1, display: 'block', mb: 1 }} // Márgenes y display
                                    />

                                    {/* Campo Nueva Contraseña (Deshabilitado si se marca eliminar) */}
                                    <TextField
                                        margin="dense"
                                        name="password"
                                        label="Nueva Contraseña"
                                        type={showModalPassword ? 'text' : 'password'}
                                        fullWidth
                                        variant="outlined"
                                        value={formData.password || ''}
                                        onChange={handleFormChange}
                                        disabled={isSubmitting || formData.deletePassword} // Deshabilitar si elimina
                                        InputProps={{
                                            endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    aria-label="toggle password visibility"
                                                    onClick={handleClickShowPasswordModal}
                                                    onMouseDown={handleMouseDownPasswordModal}
                                                    edge="end"
                                                    disabled={isSubmitting || formData.deletePassword} // Deshabilitar ojo también
                                                >
                                                {showModalPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                            ),
                                        }}
                                        sx={{ mt: 1 }}
                                        helperText={formData.deletePassword ? "La contraseña actual será eliminada." : "Dejar en blanco para no cambiar la contraseña actual."}
                                    />
                                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                                        Las nuevas contraseñas se guardan de forma segura.
                                    </Typography>
                                </>
                            )}
                        </DialogContent>

                        {/* Acciones Dinámicas */}
                        <DialogActions sx={{p: '16px 24px'}}>
                            <Button onClick={handleCloseEditModal} disabled={isSubmitting} color="inherit">
                                Cancelar
                            </Button>
                            <Box sx={{ position: 'relative' }}>
                                <Button
                                    onClick={handleSubmitEdit}
                                    variant="contained"
                                    disabled={isSubmitting} // La lógica de "sin cambios" está en el handler
                                >
                                    Guardar Cambios
                                </Button>
                                {isSubmitting && (
                                    <CircularProgress size={24} sx={{ color: 'primary.main', position: 'absolute', top: '50%', left: '50%', marginTop: '-12px', marginLeft: '-12px' }}/>
                                )}
                            </Box>
                        </DialogActions>
                    </Dialog>
                )}

            </Box> {/* Fin Flex Principal */}
        </ThemeProvider>
    );
}

export default Administrador;