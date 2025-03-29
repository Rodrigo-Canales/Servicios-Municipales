// frontend/src/components/Admin/Administrador.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import api from '../../services/api.js'; // Ajusta la ruta si es necesario
import Swal from 'sweetalert2';
import {
    Box, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Button, CircularProgress, Fade,
    Card, CardContent, CssBaseline, ThemeProvider, Drawer, useMediaQuery,
    TextField, InputAdornment, Tooltip, Alert, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel,
    Checkbox, FormControlLabel, Stack, // Added Stack for form layout
    TablePagination
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

// Importa componentes y utilidades
import Navbar from "../Navbar"; // Ajusta ruta
import SidebarAdmin from "./SidebarAdmin"; // Ajusta ruta
import { lightTheme, darkTheme } from "../../theme"; // Ajusta ruta
import { mostrarAlertaExito, mostrarAlertaError } from "../../utils/alertUtils"; // Ajusta ruta

// --- Constantes ---
const APP_BAR_HEIGHT = 64;
const DRAWER_WIDTH = 240;
const ENTITY_TYPES = {
    SOLICITUD: 'solicitud',
    AREA: 'area',
    TIPO_SOLICITUD: 'tipo_solicitud',
    USUARIO: 'usuario',
    RESPUESTA: 'respuesta',
    PREGUNTA_FRECUENTE: 'pregunta-frecuente'
};
const ROLES_PERMITIDOS = ['Administrador', 'Funcionario', 'Vecino'];
const ESTADOS_SOLICITUD = ['Pendiente', 'Aprobada', 'Rechazada']; // Added for consistency
const DEFAULT_ROWS_PER_PAGE = 10;

// --- Componente Principal ---
function Administrador({ toggleTheme }) {
    // --- Estados ---
    const [mode, setMode] = useState("light");
    const [mobileOpen, setMobileOpen] = useState(false);
    const [currentSection, setCurrentSection] = useState(null);
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
    const [editingItemType, setEditingItemType] = useState(null);
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
    const handleToggleTheme = useCallback(() => {
        if (typeof toggleTheme === 'function') {
            toggleTheme();
            setMode((prev) => (prev === "light" ? "dark" : "light"));
        } else {
            setMode((prev) => (prev === "light" ? "dark" : "light"));
        }
    }, [toggleTheme]);
    const handleDrawerToggle = useCallback(() => setMobileOpen(prev => !prev), []);
    const handleDrawerClose = useCallback(() => setMobileOpen(false), []);
    const handleSearchChange = useCallback((event) => { setSearchTerm(event.target.value); setPage(0); }, []);

    // --- Handler Selección Sidebar ---
    const handleSelectSection = useCallback((sectionName) => {
        if (sectionName !== currentSection) {
            setCurrentSection(sectionName); setSearchTerm(""); setIsEditModalOpen(false); setIsAddModalOpen(false); setPage(0); setRowsPerPage(DEFAULT_ROWS_PER_PAGE); setError(null);
        }
        handleDrawerClose();
    }, [currentSection, handleDrawerClose]);

    // --- Fetch Genérico (Usa 'api') ---
    const fetchGenericData = useCallback(async (endpoint, sectionIdentifier) => {
        console.log(`[fetchGenericData] Fetching ${sectionIdentifier}...`);
        try {
            const response = await api.get(endpoint); // Usa instancia 'api'
            const data = response.data;
            let potentialData = null;

            // Improved data extraction logic
            if (Array.isArray(data)) {
                potentialData = data;
            } else if (data && Array.isArray(data[sectionIdentifier])) {
                 potentialData = data[sectionIdentifier];
            } else if (sectionIdentifier === 'solicitudes' && data && Array.isArray(data.solicitudes)) {
                 potentialData = data.solicitudes;
             } else if (sectionIdentifier === 'respuestas' && data && Array.isArray(data.respuestas)) {
                 potentialData = data.respuestas;
             } else if (sectionIdentifier === 'preguntas-frecuentes' && data && Array.isArray(data.preguntas_frecuentes)) {
                 potentialData = data.preguntas_frecuentes;
             } else if (sectionIdentifier === 'tipos-solicitudes' && data && Array.isArray(data.tipos_solicitudes)) {
                 potentialData = data.tipos_solicitudes; // Check if backend uses this key
             } else if (sectionIdentifier === 'areas' && data && Array.isArray(data.areas)) {
                 potentialData = data.areas; // Check if backend uses this key
             } else if (sectionIdentifier === 'usuarios' && data && Array.isArray(data.usuarios)) {
                 potentialData = data.usuarios;
             }

            if (Array.isArray(potentialData)) {
                console.log(`[fetchGenericData] Success: ${potentialData.length} for ${sectionIdentifier}`);
                // Remove password hash for users before storing in state
                if (sectionIdentifier === 'usuarios') {
                    return potentialData.map(u => { const { hash_password: _, ...rest } = u; return rest; });
                }
                return potentialData;
            } else {
                console.warn(`[fetchGenericData] Unexpected data format for ${sectionIdentifier}:`, data);
                return []; // Return empty array if data is not as expected
            }
        } catch (err) {
            console.error(`[fetchGenericData] Error fetching ${sectionIdentifier}:`, err.response?.data?.message || err.message);
            throw err; // Re-throw to be caught in useEffect
        }
    }, []);

    // --- Wrappers de Fetch (Rutas relativas) ---
    const fetchSolicitudes = useCallback(() => fetchGenericData('/solicitudes', 'solicitudes'), [fetchGenericData]);
    const fetchAreas = useCallback(() => fetchGenericData('/areas', 'areas'), [fetchGenericData]);
    // Ensure the backend route /tipos_solicitudes returns the data directly or under a specific key
    const fetchTiposSolicitudesAdmin = useCallback(() => fetchGenericData('/tipos_solicitudes', 'tipos-solicitudes'), [fetchGenericData]);
    const fetchUsuarios = useCallback(() => fetchGenericData('/usuarios', 'usuarios'), [fetchGenericData]);
    const fetchRespuestas = useCallback(() => fetchGenericData('/respuestas', 'respuestas'), [fetchGenericData]);
    const fetchPreguntasFrecuentes = useCallback(() => fetchGenericData('/preguntas_frecuentes', 'preguntas-frecuentes'), [fetchGenericData]);

    // --- Efecto Principal para Cargar Datos ---
     useEffect(() => {
        if (!currentSection) {
            setLoading(false); setError(null); setSolicitudes([]); setAreas([]);
            setTiposSolicitudesAdmin([]); setUsuarios([]); setRespuestas([]); setPreguntasFrecuentes([]);
            return;
         }

        let isMounted = true;
        const section = currentSection;

        const loadData = async () => {
            if (!isMounted) return;
            setLoading(true);
            setError(null);
            setPage(0);

            // Reset data not relevant to the current section
            if (section !== 'solicitudes') setSolicitudes([]);
            if (section !== 'areas' && section !== 'tipos-solicitudes' && section !== 'usuarios') setAreas([]);
            if (section !== 'tipos-solicitudes' && section !== 'preguntas-frecuentes') setTiposSolicitudesAdmin([]);
            if (section !== 'usuarios') setUsuarios([]);
            if (section !== 'respuestas') setRespuestas([]);
            if (section !== 'preguntas-frecuentes') setPreguntasFrecuentes([]);


            // Determine primary data fetch function
            let fetchFn;
            let setDataFn;
             switch (section) {
                 case 'solicitudes': fetchFn = fetchSolicitudes; setDataFn = setSolicitudes; break;
                 case 'areas': fetchFn = fetchAreas; setDataFn = setAreas; break;
                 case 'tipos-solicitudes': fetchFn = fetchTiposSolicitudesAdmin; setDataFn = setTiposSolicitudesAdmin; break;
                 case 'usuarios': fetchFn = fetchUsuarios; setDataFn = setUsuarios; break;
                 case 'respuestas': fetchFn = fetchRespuestas; setDataFn = setRespuestas; break;
                 case 'preguntas-frecuentes': fetchFn = fetchPreguntasFrecuentes; setDataFn = setPreguntasFrecuentes; break;
                 default:
                     console.warn(`Sección no reconocida en useEffect: ${section}`);
                     setLoading(false);
                     return;
             }

             // Determine necessary related data
             const needsAreas = ['tipos-solicitudes', 'usuarios'].includes(section);
             const needsTiposSolicitudes = ['preguntas-frecuentes'].includes(section);


            try {
                // Fetch primary data and related data concurrently
                const promises = [fetchFn()];
                if (needsAreas) promises.push(fetchAreas());
                if (needsTiposSolicitudes) promises.push(fetchTiposSolicitudesAdmin());

                const results = await Promise.all(promises);

                if (!isMounted || currentSection !== section) return; // Check again after await

                // Set primary data
                setDataFn(results[0]);

                // Set related data
                let promiseIndex = 1;
                if (needsAreas) {
                    setAreas(results[promiseIndex] || []); // Set areas if needed
                    promiseIndex++;
                }
                 if (needsTiposSolicitudes) {
                    setTiposSolicitudesAdmin(results[promiseIndex] || []); // Set tipos if needed
                 }

            } catch (err) {
                console.error(`Error al cargar datos para la sección ${section}:`, err);
                if (isMounted && currentSection === section) {
                    const apiError = err.response?.data?.message;
                    setError(apiError || err.message || `Error al cargar ${section}.`);
                    if(setDataFn) setDataFn([]); // Clear data on error
                     // Clear related data as well on primary error
                     if(needsAreas) setAreas([]);
                     if(needsTiposSolicitudes) setTiposSolicitudesAdmin([]);
                }
            } finally {
                if (isMounted && currentSection === section) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => {
            isMounted = false;
        };
    // Removed 'error' from dependencies to prevent potential loops
    }, [currentSection, fetchSolicitudes, fetchAreas, fetchTiposSolicitudesAdmin, fetchUsuarios, fetchRespuestas, fetchPreguntasFrecuentes]);


    // --- Cerrar drawer ---
    useEffect(() => { if (isLargeScreen) setMobileOpen(false); }, [isLargeScreen]);

    // --- Mapas ---
    const areaMap = useMemo(() => { const map = new Map(); if (Array.isArray(areas)) areas.forEach(a => map.set(a.id_area, a.nombre_area)); return map; }, [areas]);
    const tipoSolicitudMap = useMemo(() => { const map = new Map(); if (Array.isArray(tiposSolicitudesAdmin)) tiposSolicitudesAdmin.forEach(t => map.set(t.id_tipo, t.nombre_tipo)); return map; }, [tiposSolicitudesAdmin]);

    // --- Filtrado ---
    const filteredData = useMemo(() => {
        let dataToFilter = [];
        switch (currentSection) {
            case 'solicitudes': dataToFilter = solicitudes; break;
            case 'areas': dataToFilter = areas; break;
            case 'tipos-solicitudes': dataToFilter = tiposSolicitudesAdmin; break;
            case 'usuarios': dataToFilter = usuarios; break;
            case 'respuestas': dataToFilter = respuestas; break;
            case 'preguntas-frecuentes': dataToFilter = preguntasFrecuentes; break;
            default: return [];
        }
        if (!Array.isArray(dataToFilter)) return [];

        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        if (!lowerSearchTerm) return dataToFilter;

        return dataToFilter.filter(item => {
            // Simplified search logic - check if any value includes the term
             return Object.values(item).some(value =>
                 String(value).toLowerCase().includes(lowerSearchTerm)
             ) || ( // Include mapped values in search
                 (currentSection === 'tipos-solicitudes' && areaMap.get(item.area_id)?.toLowerCase().includes(lowerSearchTerm)) ||
                 (currentSection === 'usuarios' && areaMap.get(item.area_id)?.toLowerCase().includes(lowerSearchTerm)) ||
                 (currentSection === 'preguntas-frecuentes' && tipoSolicitudMap.get(item.id_tipo)?.toLowerCase().includes(lowerSearchTerm))
             );
         });
     }, [currentSection, searchTerm, solicitudes, areas, tiposSolicitudesAdmin, usuarios, respuestas, preguntasFrecuentes, areaMap, tipoSolicitudMap]);


    // --- Helper Identificador ---
    const sectionIdentifierFromType = useCallback((typeOrSection) => {
        switch (typeOrSection) {
            case ENTITY_TYPES.SOLICITUD: case 'solicitudes': return 'solicitudes';
            case ENTITY_TYPES.AREA: case 'areas': return 'areas';
            case ENTITY_TYPES.TIPO_SOLICITUD: case 'tipos-solicitudes': return 'tipos-solicitudes';
            case ENTITY_TYPES.USUARIO: case 'usuarios': return 'usuarios';
            case ENTITY_TYPES.RESPUESTA: case 'respuestas': return 'respuestas';
            case ENTITY_TYPES.PREGUNTA_FRECUENTE: case 'preguntas-frecuentes': return 'preguntas-frecuentes';
            default: return null;
        }
    }, []);


    // --- Handlers Modal Edición ---
    const handleOpenEditModal = useCallback((item, type) => {
        console.log("Opening edit modal for:", type, item);
        setEditingItem(item);
        setEditingItemType(type);
        let initialFormData = {};
        // Initialize form data based on the item being edited
        switch (type) {
             case ENTITY_TYPES.SOLICITUD: initialFormData = { estado: item.estado || '', correo_notificacion: item.correo_notificacion || '' }; break;
             case ENTITY_TYPES.AREA: initialFormData = { nombre_area: item.nombre_area || '' }; break;
             case ENTITY_TYPES.TIPO_SOLICITUD: initialFormData = { nombre_tipo: item.nombre_tipo || '', area_id: item.area_id || '', descripcion: item.descripcion || '' }; break;
             case ENTITY_TYPES.USUARIO: initialFormData = { correo_electronico: item.correo_electronico || '', rol: item.rol || '', area_id: item.area_id || '', password: '', deletePassword: false }; break; // Use empty string for area_id if null/undefined
             case ENTITY_TYPES.PREGUNTA_FRECUENTE: initialFormData = { pregunta: item.pregunta || '', respuesta: item.respuesta || '', id_tipo: item.id_tipo || '' }; break;
            default: console.warn("Tipo de entidad desconocido para edición:", type); break;
        }
        setFormData(initialFormData);
        setShowModalPassword(false); // Reset password visibility
        setIsEditModalOpen(true);
    }, []);

    const handleCloseEditModal = useCallback(() => {
        if (isSubmitting) return;
        setIsEditModalOpen(false);
        setTimeout(() => {
            setEditingItem(null);
            setEditingItemType(null);
            setFormData({});
            setShowModalPassword(false);
        }, 200);
    }, [isSubmitting]);

    const handleFormChange = useCallback((event) => {
        const { name, value, type, checked } = event.target;
        // Special handling for deletePassword checkbox when checked
         if (name === 'deletePassword' && checked) {
             setFormData((prev) => ({
                 ...prev,
                 password: '', // Clear password field if delete is checked
                 deletePassword: true,
             }));
             setShowModalPassword(false); // Hide password field if deleting
         } else {
             setFormData((prev) => ({
                 ...prev,
                 [name]: type === 'checkbox' ? checked : value,
             }));
         }
     }, []);

    const handleClickShowPasswordModal = useCallback(() => { setShowModalPassword((show) => !show); }, []);
    const handleMouseDownPasswordModal = useCallback((event) => { event.preventDefault(); }, []);


    // --- Submit Edición GENÉRICO ---
    const handleSubmitEdit = useCallback(async () => {
        if (!editingItem || !editingItemType) return;

        // Basic comparison to avoid submitting if nothing changed
         let initialDataForComparison = {};
         switch (editingItemType) {
             case ENTITY_TYPES.SOLICITUD: initialDataForComparison = { estado: editingItem.estado || '', correo_notificacion: editingItem.correo_notificacion || '' }; break;
             case ENTITY_TYPES.AREA: initialDataForComparison = { nombre_area: editingItem.nombre_area || '' }; break;
             case ENTITY_TYPES.TIPO_SOLICITUD: initialDataForComparison = { nombre_tipo: editingItem.nombre_tipo || '', area_id: editingItem.area_id || '', descripcion: editingItem.descripcion || '' }; break;
             case ENTITY_TYPES.USUARIO: initialDataForComparison = { correo_electronico: editingItem.correo_electronico || '', rol: editingItem.rol || '', area_id: editingItem.area_id || '', password: '', deletePassword: false }; break; // Use '' for comparison
             case ENTITY_TYPES.PREGUNTA_FRECUENTE: initialDataForComparison = { pregunta: editingItem.pregunta || '', respuesta: editingItem.respuesta || '', id_tipo: editingItem.id_tipo || '' }; break;
             default: return;
         }

         let hasChanged = false;
         for (const key in formData) {
             // Skip password check here, handle separately
             if (key === 'password' || key === 'deletePassword') continue;
             if (!Object.prototype.hasOwnProperty.call(initialDataForComparison, key)) continue;

             const initialValue = initialDataForComparison[key];
             const currentValue = formData[key];

             // Normalize empty/null/undefined to empty strings for comparison, except for specific fields if needed
             const compInitial = String(initialValue ?? '');
             const compCurrent = String(currentValue ?? '');

             if (compCurrent !== compInitial) {
                 console.log(`Change detected in key "${key}": "${compInitial}" -> "${compCurrent}"`);
                 hasChanged = true;
                 break;
             }
         }

         // Explicitly check password changes
         const passwordChanged = editingItemType === ENTITY_TYPES.USUARIO && (
             (formData.deletePassword && !initialDataForComparison.deletePassword) || // deletePassword was checked
             (formData.password && formData.password.trim() !== '')                 // new password entered
         );

         if (!hasChanged && !passwordChanged) {
            mostrarAlertaExito("Sin cambios", "No se detectaron cambios para guardar.");
            handleCloseEditModal();
            return;
         }

        setIsSubmitting(true);
        let apiUrl = ''; let itemId = null; let payload = {};
        let fetchFnAfterUpdate = null; let setDataFnAfterUpdate = null;
        let successMessage = ''; let idField = ''; const httpMethod = 'put';

        try {
            switch (editingItemType) {
                case ENTITY_TYPES.SOLICITUD: {
                    idField='id_solicitud'; itemId=editingItem[idField];
                    apiUrl=`/solicitudes/${itemId}`;
                    // Send only changed fields if backend supports partial updates, otherwise send all editable fields
                    payload={ estado: formData.estado, correo_notificacion: formData.correo_notificacion || null };
                    fetchFnAfterUpdate=fetchSolicitudes; setDataFnAfterUpdate=setSolicitudes; successMessage='Solicitud actualizada.';
                    break;
                }
                case ENTITY_TYPES.AREA: {
                     idField='id_area'; itemId=editingItem[idField];
                     apiUrl=`/areas/${itemId}`;
                     payload={nombre_area: formData.nombre_area};
                     fetchFnAfterUpdate=fetchAreas; setDataFnAfterUpdate=setAreas; successMessage='Área actualizada.';
                     break;
                 }
                case ENTITY_TYPES.TIPO_SOLICITUD: {
                     idField='id_tipo'; itemId=editingItem[idField];
                     apiUrl=`/tipos_solicitudes/${itemId}`;
                     payload={ nombre_tipo: formData.nombre_tipo, area_id: formData.area_id || null, descripcion: formData.descripcion || '' };
                     fetchFnAfterUpdate=fetchTiposSolicitudesAdmin; setDataFnAfterUpdate=setTiposSolicitudesAdmin; successMessage='Tipo de solicitud actualizado.';
                     break;
                 }
                case ENTITY_TYPES.USUARIO: {
                     idField = 'RUT'; itemId = editingItem[idField];
                     if (!itemId) throw new Error("RUT no encontrado para actualizar usuario.");
                     apiUrl = `/usuarios/${encodeURIComponent(itemId)}`;
                     // Build payload carefully
                     payload = {
                         // Only include fields if they are part of the form/intended to be updated
                         // Check backend PUT route to see which fields it accepts
                         ...(formData.correo_electronico !== undefined && { correo_electronico: formData.correo_electronico || null }),
                         ...(formData.rol !== undefined && { rol: formData.rol }),
                         ...(formData.area_id !== undefined && { area_id: formData.area_id || null }),
                     };
                     // Add password logic
                     if (formData.deletePassword === true) {
                         payload.deletePassword = true;
                     } else if (formData.password?.trim()) {
                         payload.password = formData.password.trim();
                     }
                     // Ensure at least one field is being sent if password isn't changing
                     if (Object.keys(payload).length === 0) {
                        throw new Error("No hay cambios detectados para el usuario."); // Or handle as "no changes" earlier
                     }

                     fetchFnAfterUpdate = fetchUsuarios; setDataFnAfterUpdate = setUsuarios; successMessage = 'Usuario actualizado.';
                     break;
                 }
                case ENTITY_TYPES.PREGUNTA_FRECUENTE: {
                     idField='id_pregunta'; itemId=editingItem[idField];
                     apiUrl=`/preguntas_frecuentes/${itemId}`;
                     payload={ pregunta: formData.pregunta, respuesta: formData.respuesta, id_tipo: formData.id_tipo || null };
                     fetchFnAfterUpdate=fetchPreguntasFrecuentes; setDataFnAfterUpdate=setPreguntasFrecuentes; successMessage='Pregunta frecuente actualizada.';
                     break;
                 }
                default: throw new Error(`Tipo desconocido o no editable: ${editingItemType}`);
            }

            const loggedPayload = editingItemType === ENTITY_TYPES.USUARIO ? { ...payload, password: payload.password ? '***' : undefined, deletePassword: payload.deletePassword } : payload;
            console.log(`[handleSubmitEdit] ${httpMethod.toUpperCase()} ${apiUrl} Payload:`, loggedPayload);

            // Use api.put
            await api.put(apiUrl, payload);

            // Refresh Logic
            const targetSection = sectionIdentifierFromType(editingItemType);
            if (targetSection === currentSection && fetchFnAfterUpdate && setDataFnAfterUpdate) {
                 try {
                     console.log(`Refreshing data for section: ${targetSection}`);
                     const updatedData = await fetchFnAfterUpdate();
                     // Ensure we are still in the same section before updating state
                     if (sectionIdentifierFromType(editingItemType) === currentSection) {
                         setDataFnAfterUpdate(updatedData);
                         setPage(0); // Reset pagination after refresh
                         await mostrarAlertaExito('Actualizado', `${successMessage} La tabla se ha recargado.`);
                     } else {
                         await mostrarAlertaExito('Actualizado', successMessage);
                     }
                 } catch (refetchErr) {
                     console.error("Error al recargar tabla tras edición:", refetchErr);
                     await mostrarAlertaError('Actualización Parcial', `${successMessage} pero la tabla no pudo recargarse.`);
                 }
             } else {
                 await mostrarAlertaExito('Actualizado', successMessage);
                  // If the updated item's section is not the current one, still try to refetch relevant related data if applicable
                  if (editingItemType === ENTITY_TYPES.AREA && (currentSection === 'tipos-solicitudes' || currentSection === 'usuarios')) {
                     fetchAreas().then(setAreas).catch(e => console.error("Error refetching areas for dropdowns", e));
                  }
                  if (editingItemType === ENTITY_TYPES.TIPO_SOLICITUD && currentSection === 'preguntas-frecuentes') {
                    fetchTiposSolicitudesAdmin().then(setTiposSolicitudesAdmin).catch(e => console.error("Error refetching tipos for dropdowns", e));
                  }
             }
             handleCloseEditModal();
        } catch (err) {
             console.error(`[handleSubmitEdit] Error:`, err);
             const errorMsg = err.response?.data?.message || err.message || `No se pudo actualizar.`;
             await mostrarAlertaError('Error al Actualizar', errorMsg);
        } finally { setIsSubmitting(false); }
    }, [ editingItem, editingItemType, formData, currentSection, handleCloseEditModal, setPage, fetchSolicitudes, setSolicitudes, fetchAreas, setAreas, fetchTiposSolicitudesAdmin, setTiposSolicitudesAdmin, fetchUsuarios, setUsuarios, fetchPreguntasFrecuentes, setPreguntasFrecuentes, sectionIdentifierFromType ]);


    // --- Handlers Modal Agregar ---
    const handleOpenAddModal = useCallback(() => {
        console.log("Opening add modal for section:", currentSection);
        let initialAddFormData = {};
        // Initialize form based on current section
        switch(currentSection) {
            case 'areas': initialAddFormData = { nombre_area: '' }; break;
            case 'tipos-solicitudes': initialAddFormData = { nombre_tipo: '', area_id: '', descripcion: '' }; break;
            case 'usuarios': initialAddFormData = { RUT: '', nombre: '', apellido: '', correo_electronico: '', rol: '', area_id: '', password: '' }; break; // Use '' for area_id
            case 'preguntas-frecuentes': initialAddFormData = { pregunta: '', respuesta: '', id_tipo: '' }; break;
            // Solicitudes and Respuestas cannot be added from here
            case 'solicitudes':
            case 'respuestas':
                console.warn("Add modal not applicable for section:", currentSection);
                return;
            default: console.warn("Sección no válida para agregar:", currentSection); return;
        }
        setAddFormData(initialAddFormData);
        setShowAddModalPassword(false); // Reset password visibility
        setIsAddModalOpen(true);
    }, [currentSection]);

    const handleCloseAddModal = useCallback(() => {
        if (isAdding) return;
        setIsAddModalOpen(false);
        setTimeout(() => {
            setAddFormData({});
            setShowAddModalPassword(false);
        }, 200);
    }, [isAdding]);

    const handleAddFormChange = useCallback((event) => {
         const { name, value, type, checked } = event.target;
         setAddFormData((prev) => ({
             ...prev,
             [name]: type === 'checkbox' ? checked : value,
         }));
     }, []);

    const handleClickShowPasswordAddModal = useCallback(() => { setShowAddModalPassword((show) => !show); }, []);
    const handleMouseDownPasswordAddModal = useCallback((event) => { event.preventDefault(); }, []);


    // --- Submit Agregar GENÉRICO ---
    const handleSubmitAdd = useCallback(async () => {
        if (!currentSection) return;

        setIsAdding(true);
        let apiUrl = '';
        let payload = {};
        let fetchFnAfterAdd = null;
        let setDataFnAfterAdd = null;
        let successMessage = '';
        const httpMethod = 'post';

        try {
            // Define payload based on current section
            switch (currentSection) {
                 case 'areas': {
                     if (!addFormData.nombre_area?.trim()) throw new Error("El nombre del área es requerido.");
                     apiUrl = '/areas'; payload = { nombre_area: addFormData.nombre_area.trim() };
                     fetchFnAfterAdd = fetchAreas; setDataFnAfterAdd = setAreas; successMessage = 'Área agregada.';
                     break;
                 }
                 case 'tipos-solicitudes': {
                     if (!addFormData.nombre_tipo?.trim()) throw new Error("El nombre del tipo de solicitud es requerido.");
                     // Area ID is required for a new Tipo Solicitud according to schema usually
                     if (!addFormData.area_id) throw new Error("El área es requerida.");
                     apiUrl = '/tipos_solicitudes'; payload = { nombre_tipo: addFormData.nombre_tipo.trim(), area_id: addFormData.area_id, descripcion: addFormData.descripcion?.trim() || '' };
                     fetchFnAfterAdd = fetchTiposSolicitudesAdmin; setDataFnAfterAdd = setTiposSolicitudesAdmin; successMessage = 'Tipo de solicitud agregado.';
                     break;
                 }
                 case 'usuarios': {
                     // Validate all required fields for adding a user
                     if (!addFormData.RUT?.trim() || !addFormData.nombre?.trim() || !addFormData.apellido?.trim() || !addFormData.correo_electronico?.trim() || !addFormData.rol || !addFormData.password?.trim()) {
                         throw new Error("RUT, nombre, apellido, email, rol y contraseña son requeridos.");
                     }
                     apiUrl = '/usuarios'; payload = {
                         RUT: addFormData.RUT.trim(),
                         nombre: addFormData.nombre.trim(),
                         apellido: addFormData.apellido.trim(),
                         correo_electronico: addFormData.correo_electronico.trim(),
                         rol: addFormData.rol,
                         area_id: addFormData.area_id || null, // Send null if empty string
                         password: addFormData.password.trim()
                     };
                     fetchFnAfterAdd = fetchUsuarios; setDataFnAfterAdd = setUsuarios; successMessage = 'Usuario agregado.';
                     break;
                 }
                 case 'preguntas-frecuentes': {
                     if (!addFormData.pregunta?.trim() || !addFormData.respuesta?.trim()) throw new Error("La pregunta y la respuesta son requeridas.");
                     if (!addFormData.id_tipo) throw new Error("El tipo de solicitud es requerido.");
                     apiUrl = '/preguntas_frecuentes'; payload = { pregunta: addFormData.pregunta.trim(), respuesta: addFormData.respuesta.trim(), id_tipo: addFormData.id_tipo };
                     fetchFnAfterAdd = fetchPreguntasFrecuentes; setDataFnAfterAdd = setPreguntasFrecuentes; successMessage = 'Pregunta frecuente agregada.';
                     break;
                 }
                 default: throw new Error(`La sección '${currentSection}' no permite agregar elementos desde esta interfaz.`);
            }

            const loggedPayload = currentSection === 'usuarios' ? { ...payload, password: '***' } : payload;
            console.log(`[handleSubmitAdd] ${httpMethod.toUpperCase()} ${apiUrl} Payload:`, loggedPayload);

            // Use api.post
            await api.post(apiUrl, payload);

            // Refresh Logic
            const targetSection = sectionIdentifierFromType(currentSection);
            if (fetchFnAfterAdd && setDataFnAfterAdd) {
                 try {
                     console.log(`Refreshing data for section: ${targetSection}`);
                     const updatedData = await fetchFnAfterAdd();
                     // Ensure we are still in the same section
                     if (targetSection === currentSection) {
                         setDataFnAfterAdd(updatedData);
                         setPage(0); // Reset pagination
                         await mostrarAlertaExito('Agregado', `${successMessage} La tabla se ha recargado.`);
                     } else {
                        await mostrarAlertaExito('Agregado', successMessage);
                     }
                 } catch (refetchErr) {
                     console.error("Error al recargar tabla tras agregar:", refetchErr);
                     await mostrarAlertaError('Adición Parcial', `${successMessage} pero la tabla no pudo recargarse.`);
                 }
             } else {
                 await mostrarAlertaExito('Agregado', successMessage);
                 // If the added item's section is not the current one, still try to refetch relevant related data if applicable
                 if (currentSection === 'areas' && (targetSection === 'tipos-solicitudes' || targetSection === 'usuarios')) {
                     fetchAreas().then(setAreas).catch(e => console.error("Error refetching areas for dropdowns", e));
                  }
                 if (currentSection === 'tipos-solicitudes' && targetSection === 'preguntas-frecuentes') {
                    fetchTiposSolicitudesAdmin().then(setTiposSolicitudesAdmin).catch(e => console.error("Error refetching tipos for dropdowns", e));
                  }
             }
            handleCloseAddModal();

        } catch (err) {
            console.error(`[handleSubmitAdd] Error:`, err);
            const errorMsg = err.response?.data?.message || err.message || `No se pudo agregar el elemento.`;
            await mostrarAlertaError('Error al Agregar', errorMsg);
        } finally {
            setIsAdding(false);
        }
    }, [ currentSection, addFormData, handleCloseAddModal, setPage, fetchAreas, setAreas, fetchTiposSolicitudesAdmin, setTiposSolicitudesAdmin, fetchUsuarios, setUsuarios, fetchPreguntasFrecuentes, setPreguntasFrecuentes, sectionIdentifierFromType ]);


    // --- Función DELETE ---
    const handleDeleteItem = useCallback(async (itemId, itemType) => {
        if (!itemId || !itemType) { console.error("ID o tipo inválido para eliminar."); return; }
        if (isDeleting) return;

        setIsDeleting(true);
        let apiUrl = '';
        let fetchFnAfterDelete = null;
        let setDataFnAfterDelete = null;
        let successMessage = '';
        const httpMethod = 'delete';

        try {
            switch (itemType) {
                case ENTITY_TYPES.AREA: {
                     apiUrl = `/areas/${itemId}`; fetchFnAfterDelete = fetchAreas; setDataFnAfterDelete = setAreas; successMessage = 'Área eliminada.'; break;
                 }
                case ENTITY_TYPES.TIPO_SOLICITUD: {
                     apiUrl = `/tipos_solicitudes/${itemId}`; fetchFnAfterDelete = fetchTiposSolicitudesAdmin; setDataFnAfterDelete = setTiposSolicitudesAdmin; successMessage = 'Tipo de solicitud eliminado.'; break;
                 }
                case ENTITY_TYPES.USUARIO: {
                     apiUrl = `/usuarios/${encodeURIComponent(itemId)}`; fetchFnAfterDelete = fetchUsuarios; setDataFnAfterDelete = setUsuarios; successMessage = 'Usuario eliminado.'; break;
                 }
                case ENTITY_TYPES.PREGUNTA_FRECUENTE: {
                     apiUrl = `/preguntas_frecuentes/${itemId}`; fetchFnAfterDelete = fetchPreguntasFrecuentes; setDataFnAfterDelete = setPreguntasFrecuentes; successMessage = 'Pregunta frecuente eliminada.'; break;
                 }
                // Solicitudes and Respuestas cannot be deleted from here
                 case ENTITY_TYPES.SOLICITUD:
                 case ENTITY_TYPES.RESPUESTA:
                     throw new Error(`El tipo ${itemType} no se puede eliminar desde esta interfaz.`);
                default: throw new Error(`Tipo desconocido o no eliminable: ${itemType}`);
            }

            console.log(`[handleDeleteItem] ${httpMethod.toUpperCase()} ${apiUrl}`);

            // Use api.delete
            await api.delete(apiUrl);

            // Refresh Logic
            const targetSection = sectionIdentifierFromType(itemType);
            if (targetSection === currentSection && fetchFnAfterDelete && setDataFnAfterDelete) {
                 try {
                     console.log(`Refreshing data for section: ${targetSection}`);
                     const updatedData = await fetchFnAfterDelete();
                     if (sectionIdentifierFromType(itemType) === currentSection) {
                         setDataFnAfterDelete(updatedData);
                         setPage(0); // Reset pagination
                         await mostrarAlertaExito('Eliminado', `${successMessage} La tabla se ha recargado.`);
                     } else {
                         await mostrarAlertaExito('Eliminado', successMessage);
                     }
                 } catch (refetchErr) {
                     console.error("Error al recargar tabla tras eliminar:", refetchErr);
                     await mostrarAlertaError('Eliminación Parcial', `${successMessage} pero la tabla no pudo recargarse.`);
                 }
             } else {
                 await mostrarAlertaExito('Eliminado', successMessage);
                  // If the deleted item's section is not the current one, still try to refetch relevant related data if applicable
                  if (itemType === ENTITY_TYPES.AREA && (currentSection === 'tipos-solicitudes' || currentSection === 'usuarios')) {
                     fetchAreas().then(setAreas).catch(e => console.error("Error refetching areas for dropdowns", e));
                  }
                  if (itemType === ENTITY_TYPES.TIPO_SOLICITUD && currentSection === 'preguntas-frecuentes') {
                    fetchTiposSolicitudesAdmin().then(setTiposSolicitudesAdmin).catch(e => console.error("Error refetching tipos for dropdowns", e));
                  }
             }

        } catch (err) {
            console.error(`[handleDeleteItem] Error:`, err);
            const errorMsg = err.response?.data?.message || err.message || `No se pudo eliminar.`;
             if (err.response?.status === 409) { // Conflict error (likely foreign key constraint)
                 await mostrarAlertaError('Error de Dependencia', errorMsg || 'No se puede eliminar porque está en uso.');
             } else {
                 await mostrarAlertaError('Error al Eliminar', errorMsg);
             }
        } finally {
            setIsDeleting(false);
        }
    }, [currentSection, isDeleting, setPage, fetchAreas, setAreas, fetchTiposSolicitudesAdmin, setTiposSolicitudesAdmin, fetchUsuarios, setUsuarios, fetchPreguntasFrecuentes, setPreguntasFrecuentes, sectionIdentifierFromType]);

    // --- Handler Confirmar Eliminación ---
    const handleOpenDeleteConfirmation = useCallback((item, type) => {
        if (!item || !type || isDeleting) return; // Prevent opening if already deleting

        let itemId = null;
        let itemDescription = 'este elemento';
        let idField = '';

        switch (type) {
            case ENTITY_TYPES.AREA: {
                 idField = 'id_area'; itemId = item[idField]; itemDescription = `el área "${item.nombre_area || 'ID: ' + itemId}"`; break;
             }
            case ENTITY_TYPES.TIPO_SOLICITUD: {
                 idField = 'id_tipo'; itemId = item[idField]; itemDescription = `el tipo "${item.nombre_tipo || 'ID: ' + itemId}"`; break;
             }
            case ENTITY_TYPES.USUARIO: {
                 idField = 'RUT'; itemId = item[idField]; itemDescription = `el usuario "${item.nombre || ''} ${item.apellido || ''} (${itemId})"`; break;
             }
            case ENTITY_TYPES.PREGUNTA_FRECUENTE: {
                 idField = 'id_pregunta'; itemId = item[idField]; itemDescription = `la pregunta frecuente "${item.pregunta?.substring(0, 30) || 'ID: ' + itemId}..."`; break;
             }
            default: console.warn("Tipo no válido para confirmación de borrado:", type); return;
        }

        if (!itemId) { console.error("No se pudo obtener el ID para eliminar"); return; }

        Swal.fire({
            title: '¿Estás seguro?',
            html: `Se eliminará ${itemDescription}.<br/><strong>Esta acción no se puede deshacer.</strong>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: currentTheme.palette.error.main,
            cancelButtonColor: currentTheme.palette.grey[600],
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            customClass: {
                popup: `swal2-${mode}`,
                title: `swal2-title-${mode}`,
                htmlContainer: `swal2-html-container-${mode}`
            }
        }).then((result) => {
            if (result.isConfirmed) {
                handleDeleteItem(itemId, type);
            }
        });
    }, [handleDeleteItem, currentTheme, mode, isDeleting]); // Added isDeleting dependency


    // --- Contenido Sidebar ---
    const drawerContent = useMemo(() => ( <SidebarAdmin currentSection={currentSection} onSelectSection={handleSelectSection} onCloseDrawer={handleDrawerClose} /> ), [currentSection, handleSelectSection, handleDrawerClose]);

    // --- Estilos Celdas ---
    const headerCellStyle = useMemo(() => ({
        fontWeight: 'bold',
        backgroundColor: currentTheme.palette.mode === 'light' ? currentTheme.palette.grey[200] : currentTheme.palette.grey[800],
        color: currentTheme.palette.text.primary,
        whiteSpace: 'nowrap',
        fontSize: '0.875rem'
    }), [currentTheme]);

    const bodyCellStyle = useMemo(() => ({
        fontSize: '0.875rem',
        color: currentTheme.palette.text.secondary,
        verticalAlign: 'top'
    }), [currentTheme]);

    // --- Título Dinámico ---
    const getSectionTitle = useCallback(() => {
        switch (currentSection) {
            case 'solicitudes': return 'Solicitudes';
            case 'areas': return 'Áreas';
            case 'tipos-solicitudes': return 'Tipos de Solicitudes';
            case 'usuarios': return 'Usuarios';
            case 'respuestas': return 'Respuestas';
            case 'preguntas-frecuentes': return 'Preguntas Frecuentes';
            default: return 'Administración';
        }
    }, [currentSection]);

    // --- ColSpan Dinámico ---
    const getCurrentColSpan = useCallback(() => {
        switch (currentSection) {
            case 'solicitudes': return 8;
            case 'areas': return 3;
            case 'tipos-solicitudes': return 5;
            case 'usuarios': return 7;
            case 'respuestas': return 6;
            case 'preguntas-frecuentes': return 5;
            default: return 1;
        }
    }, [currentSection]);

    // --- Handlers Paginación ---
    const handleChangePage = useCallback((event, newPage) => { setPage(newPage); }, []);
    const handleChangeRowsPerPage = useCallback((event) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0); }, []);

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
                                <Typography variant={isSmallScreen ? 'h6' : (isLargeScreen ? 'h4' : 'h5')} component="h1" sx={{ fontWeight: "bold", order: 1, mr: 'auto' }}> {getSectionTitle()} </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'nowrap', order: 2, ml: { xs: 0, sm: 2 } }}>
                                    {/* Search Bar */}
                                    {!loading && !error && currentSection && (
                                        <TextField
                                            size="small"
                                            variant="outlined"
                                            placeholder="Buscar..."
                                            value={searchTerm}
                                            onChange={handleSearchChange}
                                            sx={{ width: { xs: '150px', sm: (['solicitudes', 'respuestas'].includes(currentSection) ? 250 : 180), md: (['solicitudes', 'respuestas'].includes(currentSection) ? 300 : 230) } }}
                                            InputProps={{
                                                startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>),
                                                sx: { borderRadius: 2 }
                                            }}
                                        />
                                    )}
                                     {/* Add Button (Conditionally Rendered) */}
                                    {!loading && !error && currentSection && !['solicitudes', 'respuestas'].includes(currentSection) && (
                                        <Tooltip title={`Agregar Nuevo/a ${currentSection === 'areas' ? 'Área' : currentSection === 'tipos-solicitudes' ? 'Tipo de Solicitud' : currentSection === 'usuarios' ? 'Usuario' : 'Pregunta Frecuente'}`}>
                                            <span> {/* Span needed for Tooltip when button is disabled */}
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    size="medium"
                                                    startIcon={<AddIcon />}
                                                    onClick={handleOpenAddModal}
                                                    disabled={isAdding || isSubmitting || isDeleting || loading || !currentSection || ['solicitudes', 'respuestas'].includes(currentSection)} // Disable if loading or irrelevant section
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
                            {loading && ( <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 5, flexGrow: 1 }}> <CircularProgress /> <Typography sx={{ ml: 2 }} color="text.secondary">Cargando datos...</Typography> </Box> )}
                            {!loading && error && ( <Alert severity="error" sx={{ mb: 2, flexShrink: 0 }}> {`Error al cargar datos: ${error}`} </Alert> )}
                            {!loading && !error && !currentSection && ( <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, textAlign: 'center', color: 'text.secondary', p: 3 }}> <Typography variant="h6" component="p"> Selecciona una sección del menú lateral.</Typography> </Box> )}

                             {/* Contenedor Tabla y Paginación */}
                            {!loading && !error && currentSection && (
                                <Fade in={true} timeout={300} style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    <Paper sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: `1px solid ${currentTheme.palette.divider}`, borderRadius: 1.5, width: '100%', bgcolor: 'background.paper' }}>
                                        <TableContainer sx={{ flexGrow: 1, overflow: 'auto', boxShadow: 0, border: 0 }}>
                                            <Table stickyHeader size="small" sx={{ minWidth: 650 }}>
                                                {/* Cabeceras Dinámicas */}
                                                <TableHead>
                                                     <TableRow>
                                                        {currentSection === 'solicitudes' && <> <TableCell sx={headerCellStyle}>ID</TableCell> <TableCell sx={headerCellStyle}>RUT Vecino</TableCell> <TableCell sx={headerCellStyle}>Tipo</TableCell> <TableCell sx={headerCellStyle}>Fecha</TableCell> <TableCell sx={headerCellStyle}>Estado</TableCell> <TableCell sx={headerCellStyle}>Ruta Carpeta</TableCell> <TableCell sx={headerCellStyle}>Correo Notif.</TableCell> <TableCell sx={{ ...headerCellStyle, textAlign: 'right' }}>Acciones</TableCell> </>}
                                                        {currentSection === 'areas' && <> <TableCell sx={headerCellStyle}>ID</TableCell> <TableCell sx={headerCellStyle}>Nombre Área</TableCell> <TableCell sx={{ ...headerCellStyle, textAlign: 'right' }}>Acciones</TableCell> </>}
                                                        {currentSection === 'tipos-solicitudes' && <> <TableCell sx={headerCellStyle}>ID</TableCell> <TableCell sx={headerCellStyle}>Nombre Tipo</TableCell> <TableCell sx={headerCellStyle}>Descripción</TableCell> <TableCell sx={headerCellStyle}>Área</TableCell> <TableCell sx={{ ...headerCellStyle, textAlign: 'right' }}>Acciones</TableCell> </>}
                                                        {currentSection === 'usuarios' && <> <TableCell sx={headerCellStyle}>RUT</TableCell> <TableCell sx={headerCellStyle}>Nombre</TableCell> <TableCell sx={headerCellStyle}>Apellido</TableCell> <TableCell sx={headerCellStyle}>Email</TableCell> <TableCell sx={headerCellStyle}>Rol</TableCell> <TableCell sx={headerCellStyle}>Área</TableCell> <TableCell sx={{ ...headerCellStyle, textAlign: 'right' }}>Acciones</TableCell> </>}
                                                        {currentSection === 'respuestas' && <> <TableCell sx={headerCellStyle}>ID Resp.</TableCell> <TableCell sx={headerCellStyle}>ID Solicitud</TableCell> <TableCell sx={headerCellStyle}>Tipo Solicitud</TableCell> <TableCell sx={headerCellStyle}>Respondido por</TableCell> <TableCell sx={headerCellStyle}>Fecha Respuesta</TableCell> <TableCell sx={headerCellStyle}>Ruta Solicitud</TableCell> </>}
                                                        {currentSection === 'preguntas-frecuentes' && <> <TableCell sx={headerCellStyle}>ID</TableCell> <TableCell sx={{...headerCellStyle, width: '30%'}}>Pregunta</TableCell> <TableCell sx={{...headerCellStyle, width: '40%'}}>Respuesta</TableCell> <TableCell sx={headerCellStyle}>Tipo Solicitud</TableCell> <TableCell sx={{ ...headerCellStyle, textAlign: 'right' }}>Acciones</TableCell> </>}
                                                     </TableRow>
                                                 </TableHead>

                                                {/* Cuerpo de Tabla Dinámico */}
                                                <TableBody>
                                                     {(rowsPerPage > 0 ? filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : filteredData ).map((item, index) => {
                                                        const commonProps = { sx: bodyCellStyle };
                                                        const actionsCellStyle = { ...bodyCellStyle, padding: '6px 8px', textAlign: 'right', whiteSpace: 'nowrap' };
                                                        let entityTypeForActions = null;
                                                        // Determine entity type for actions based on current section
                                                        switch(currentSection) {
                                                            case 'areas': entityTypeForActions = ENTITY_TYPES.AREA; break;
                                                            case 'tipos-solicitudes': entityTypeForActions = ENTITY_TYPES.TIPO_SOLICITUD; break;
                                                            case 'usuarios': entityTypeForActions = ENTITY_TYPES.USUARIO; break;
                                                            case 'solicitudes': entityTypeForActions = ENTITY_TYPES.SOLICITUD; break;
                                                            case 'preguntas-frecuentes': entityTypeForActions = ENTITY_TYPES.PREGUNTA_FRECUENTE; break;
                                                            case 'respuestas': entityTypeForActions = ENTITY_TYPES.RESPUESTA; break; // Mark responses
                                                            default: entityTypeForActions = null;
                                                        }

                                                        // Determine if item is editable or deletable based on type
                                                        const canEdit = entityTypeForActions && [ENTITY_TYPES.SOLICITUD, ENTITY_TYPES.AREA, ENTITY_TYPES.TIPO_SOLICITUD, ENTITY_TYPES.USUARIO, ENTITY_TYPES.PREGUNTA_FRECUENTE].includes(entityTypeForActions);
                                                        const canDelete = entityTypeForActions && [ENTITY_TYPES.AREA, ENTITY_TYPES.TIPO_SOLICITUD, ENTITY_TYPES.USUARIO, ENTITY_TYPES.PREGUNTA_FRECUENTE].includes(entityTypeForActions);

                                                        const editButton = canEdit ? (
                                                            <Tooltip title={`Editar ${sectionIdentifierFromType(currentSection)?.replace(/-/g, ' ')?.replace(/s$/, '') || 'elemento'}`}>
                                                                <span>
                                                                    <IconButton size="small" onClick={() => handleOpenEditModal(item, entityTypeForActions)} color="primary" disabled={isSubmitting || isAdding || isDeleting}>
                                                                        <EditIcon fontSize="small"/>
                                                                    </IconButton>
                                                                </span>
                                                            </Tooltip>
                                                            ) : null;

                                                        const deleteButton = canDelete ? (
                                                            <Tooltip title={`Eliminar ${sectionIdentifierFromType(currentSection)?.replace(/-/g, ' ')?.replace(/s$/, '') || 'elemento'}`}>
                                                                <span>
                                                                    <IconButton size="small" onClick={() => handleOpenDeleteConfirmation(item, entityTypeForActions)} color="error" disabled={isSubmitting || isAdding || isDeleting}>
                                                                        <DeleteIcon fontSize="small"/>
                                                                    </IconButton>
                                                                </span>
                                                            </Tooltip>
                                                            ) : null;

                                                        const rowKey = `${currentSection}-${item?.id_solicitud || item?.id_area || item?.id_tipo || item?.RUT || item?.id_respuesta || item?.id_pregunta || index}`;

                                                        // Render Row based on Section
                                                         if (currentSection === 'solicitudes') {
                                                              const formattedId = item.id_solicitud ? String(item.id_solicitud).padStart(5, '0') : '-';
                                                              return ( <TableRow hover key={rowKey} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}> <TableCell {...commonProps}>{formattedId}</TableCell> <TableCell {...commonProps}>{item.RUT_ciudadano}</TableCell> <TableCell {...commonProps}>{item.nombre_tipo}</TableCell> <TableCell {...commonProps}>{item.fecha_hora_envio ? new Date(item.fecha_hora_envio).toLocaleString('es-CL') : '-'}</TableCell> <TableCell {...commonProps}>{item.estado}</TableCell> <TableCell {...commonProps} sx={{...commonProps.sx, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}><Tooltip title={item.ruta_carpeta || ''}><span>{item.ruta_carpeta || '-'}</span></Tooltip></TableCell> <TableCell {...commonProps}>{item.correo_notificacion || '-'}</TableCell> <TableCell sx={actionsCellStyle}> {editButton} {/* No delete button for solicitudes */} </TableCell> </TableRow> );
                                                         } else if (currentSection === 'areas') { return ( <TableRow hover key={rowKey} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}> <TableCell {...commonProps}>{item.id_area}</TableCell> <TableCell {...commonProps}>{item.nombre_area}</TableCell> <TableCell sx={actionsCellStyle}> {editButton} {deleteButton} </TableCell> </TableRow> );
                                                         } else if (currentSection === 'tipos-solicitudes') { return ( <TableRow hover key={rowKey} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}> <TableCell {...commonProps}>{item.id_tipo}</TableCell> <TableCell {...commonProps}>{item.nombre_tipo}</TableCell> <TableCell {...commonProps} sx={{...commonProps.sx, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}><Tooltip title={item.descripcion || ''}><span>{item.descripcion || '-'}</span></Tooltip></TableCell> <TableCell {...commonProps}>{areaMap.get(item.area_id) || '-'}</TableCell> <TableCell sx={actionsCellStyle}> {editButton} {deleteButton} </TableCell> </TableRow> );
                                                         } else if (currentSection === 'usuarios') { return ( <TableRow hover key={rowKey} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}> <TableCell {...commonProps}>{item.RUT || '-'}</TableCell> <TableCell {...commonProps}>{item.nombre || '-'}</TableCell> <TableCell {...commonProps}>{item.apellido || '-'}</TableCell> <TableCell sx={{ ...commonProps.sx, wordBreak: 'break-all' }}>{item.correo_electronico || '-'}</TableCell> <TableCell {...commonProps}>{item.rol || '-'}</TableCell> <TableCell {...commonProps}>{areaMap.get(item.area_id) || '-'}</TableCell> <TableCell sx={actionsCellStyle}> {editButton} {deleteButton} </TableCell> </TableRow> );
                                                         } else if (currentSection === 'respuestas') {
                                                              const formattedRespId = item.id_respuesta ? String(item.id_respuesta).padStart(5, '0') : '-';
                                                              const formattedSolId = item.id_solicitud ? String(item.id_solicitud).padStart(5, '0') : '-';
                                                              const trabajadorFullName = `${item.nombre_trabajador || ''} ${item.apellido_trabajador || ''}`.trim();
                                                              return ( <TableRow hover key={rowKey} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}> <TableCell {...commonProps}>{formattedRespId}</TableCell> <TableCell {...commonProps}>{formattedSolId}</TableCell> <TableCell {...commonProps}>{item.nombre_tipo_solicitud}</TableCell> <TableCell {...commonProps}>{trabajadorFullName ? `${trabajadorFullName} (${item.RUT_trabajador || 'N/A'})` : (item.RUT_trabajador || '-') }</TableCell> <TableCell {...commonProps}>{item.fecha_hora_respuesta ? new Date(item.fecha_hora_respuesta).toLocaleString('es-CL') : '-'}</TableCell><TableCell {...commonProps} sx={{...commonProps.sx, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}><Tooltip title={item.ruta_carpeta_solicitud || ''}><span>{item.ruta_carpeta_solicitud || '-'}</span></Tooltip></TableCell></TableRow> ); // No actions for respuestas
                                                         } else if (currentSection === 'preguntas-frecuentes') { return ( <TableRow hover key={rowKey} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}> <TableCell {...commonProps}>{item.id_pregunta}</TableCell> <TableCell {...commonProps}>{item.pregunta}</TableCell> <TableCell {...commonProps} sx={{...commonProps.sx, maxWidth: 300, whiteSpace: 'normal', wordBreak: 'break-word'}}>{item.respuesta}</TableCell> <TableCell {...commonProps}>{tipoSolicitudMap.get(item.id_tipo) || '-'}</TableCell> <TableCell sx={actionsCellStyle}> {editButton} {deleteButton} </TableCell> </TableRow> );
                                                         }

                                                        return null; // Should not happen if currentSection is valid
                                                    })}
                                                    {/* Mensaje "No hay datos" o "No se encontraron resultados" */}
                                                    {!loading && filteredData.length === 0 && ( <TableRow> <TableCell colSpan={getCurrentColSpan()} align="center" sx={{ py: 4, fontStyle: 'italic', color: 'text.secondary' }}> {searchTerm ? 'No se encontraron resultados para su búsqueda.' : `No hay ${getSectionTitle().toLowerCase()} para mostrar.`} </TableCell> </TableRow> )}
                                                    {/* Filas vacías para llenar espacio en paginación */}
                                                    {!loading && filteredData.length > 0 && rowsPerPage > 0 && page >= 0 && (
                                                      (() => {
                                                         const emptyRows = rowsPerPage - Math.min(rowsPerPage, filteredData.length - page * rowsPerPage);
                                                         return emptyRows > 0 ? (
                                                            <TableRow style={{ height: (bodyCellStyle.fontSize === '0.875rem' ? 49 : 53) * emptyRows }}>
                                                                <TableCell colSpan={getCurrentColSpan()} style={{ padding: 0, borderBottom: 'none' }} />
                                                            </TableRow>
                                                         ) : null;
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

                {/* --- Modal de Edición GENÉRICO --- */}
                {editingItem && (
                    <Dialog open={isEditModalOpen} onClose={handleCloseEditModal} maxWidth="sm" fullWidth>
                        <DialogTitle>
                            Editar {editingItemType === ENTITY_TYPES.SOLICITUD ? 'Solicitud' :
                                    editingItemType === ENTITY_TYPES.AREA ? 'Área' :
                                    editingItemType === ENTITY_TYPES.TIPO_SOLICITUD ? 'Tipo de Solicitud' :
                                    editingItemType === ENTITY_TYPES.USUARIO ? 'Usuario' :
                                    editingItemType === ENTITY_TYPES.PREGUNTA_FRECUENTE ? 'Pregunta Frecuente' :
                                    'Elemento'}
                             {/* Display ID or key identifier */}
                             {editingItemType === ENTITY_TYPES.SOLICITUD && ` #${String(editingItem?.id_solicitud).padStart(5, '0') || ''}`}
                             {editingItemType === ENTITY_TYPES.AREA && ` #${editingItem?.id_area || ''}`}
                             {editingItemType === ENTITY_TYPES.TIPO_SOLICITUD && ` #${editingItem?.id_tipo || ''}`}
                             {editingItemType === ENTITY_TYPES.USUARIO && ` (${editingItem?.RUT || ''})`}
                             {editingItemType === ENTITY_TYPES.PREGUNTA_FRECUENTE && ` #${editingItem?.id_pregunta || ''}`}
                        </DialogTitle>
                        <DialogContent dividers>
                            {/* --- Campos Específicos por Tipo --- */}
                            <Stack spacing={2.5} sx={{ mt: 1 }}> {/* Added Stack for spacing */}
                                {editingItemType === ENTITY_TYPES.SOLICITUD && (
                                    <>
                                        <FormControl fullWidth required>
                                            <InputLabel id="edit-solicitud-estado-label">Estado</InputLabel>
                                            <Select
                                                labelId="edit-solicitud-estado-label"
                                                id="edit-solicitud-estado"
                                                name="estado"
                                                value={formData.estado || ''}
                                                label="Estado"
                                                onChange={handleFormChange}
                                            >
                                                {ESTADOS_SOLICITUD.map((estado) => (
                                                    <MenuItem key={estado} value={estado}>{estado}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <TextField
                                            label="Correo Notificación (opcional)"
                                            name="correo_notificacion"
                                            value={formData.correo_notificacion || ''}
                                            onChange={handleFormChange}
                                            fullWidth
                                            type="email"
                                            helperText="Dejar vacío si no se requiere notificación por correo."
                                        />
                                    </>
                                )}
                                {editingItemType === ENTITY_TYPES.AREA && (
                                    <TextField
                                        label="Nombre Área"
                                        name="nombre_area"
                                        value={formData.nombre_area || ''}
                                        onChange={handleFormChange}
                                        required
                                        fullWidth
                                    />
                                )}
                                {editingItemType === ENTITY_TYPES.TIPO_SOLICITUD && (
                                    <>
                                        <TextField
                                            label="Nombre Tipo Solicitud"
                                            name="nombre_tipo"
                                            value={formData.nombre_tipo || ''}
                                            onChange={handleFormChange}
                                            required
                                            fullWidth
                                        />
                                         <TextField
                                            label="Descripción (opcional)"
                                            name="descripcion"
                                            value={formData.descripcion || ''}
                                            onChange={handleFormChange}
                                            multiline
                                            rows={3}
                                            fullWidth
                                        />
                                        <FormControl fullWidth required>
                                            <InputLabel id="edit-tipo-area-label">Área</InputLabel>
                                            <Select
                                                labelId="edit-tipo-area-label"
                                                id="edit-tipo-area"
                                                name="area_id"
                                                value={formData.area_id || ''}
                                                label="Área"
                                                onChange={handleFormChange}
                                            >
                                                <MenuItem value=""><em>Seleccione un Área</em></MenuItem>
                                                {areas.map((area) => (
                                                    <MenuItem key={area.id_area} value={area.id_area}>{area.nombre_area}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </>
                                )}
                                {editingItemType === ENTITY_TYPES.USUARIO && (
                                    <>
                                        <TextField label="RUT" value={editingItem?.RUT || ''} disabled fullWidth />
                                        <TextField label="Nombre" value={editingItem?.nombre || ''} disabled fullWidth />
                                        <TextField label="Apellido" value={editingItem?.apellido || ''} disabled fullWidth />
                                        <TextField
                                            label="Correo Electrónico"
                                            name="correo_electronico"
                                            type="email"
                                            value={formData.correo_electronico || ''}
                                            onChange={handleFormChange}
                                            required
                                            fullWidth
                                        />
                                        <FormControl fullWidth required>
                                            <InputLabel id="edit-usuario-rol-label">Rol</InputLabel>
                                            <Select
                                                labelId="edit-usuario-rol-label"
                                                id="edit-usuario-rol"
                                                name="rol"
                                                value={formData.rol || ''}
                                                label="Rol"
                                                onChange={handleFormChange}
                                            >
                                                {ROLES_PERMITIDOS.map((rol) => (
                                                    <MenuItem key={rol} value={rol}>{rol}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <FormControl fullWidth>
                                            <InputLabel id="edit-usuario-area-label">Área (Opcional)</InputLabel>
                                            <Select
                                                labelId="edit-usuario-area-label"
                                                id="edit-usuario-area"
                                                name="area_id"
                                                value={formData.area_id || ''} // Use empty string for 'None'
                                                label="Área (Opcional)"
                                                onChange={handleFormChange}
                                            >
                                                <MenuItem value=""><em>Ninguna</em></MenuItem>
                                                {areas.map((area) => (
                                                    <MenuItem key={area.id_area} value={area.id_area}>{area.nombre_area}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <TextField
                                            label="Nueva Contraseña (opcional)"
                                            name="password"
                                            type={showModalPassword ? 'text' : 'password'}
                                            value={formData.password || ''}
                                            onChange={handleFormChange}
                                            disabled={formData.deletePassword} // Disable if delete is checked
                                            fullWidth
                                            InputProps={{
                                                endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        aria-label="toggle password visibility"
                                                        onClick={handleClickShowPasswordModal}
                                                        onMouseDown={handleMouseDownPasswordModal}
                                                        edge="end"
                                                        disabled={formData.deletePassword}
                                                    >
                                                    {showModalPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                                ),
                                            }}
                                            helperText="Dejar vacío para no cambiar la contraseña actual."
                                        />
                                         <FormControlLabel
                                            control={
                                                <Checkbox
                                                    name="deletePassword"
                                                    checked={formData.deletePassword || false}
                                                    onChange={handleFormChange}
                                                    color="warning"
                                                />
                                            }
                                            label="Eliminar contraseña actual (usuario no podrá iniciar sesión)"
                                        />
                                    </>
                                )}
                                {editingItemType === ENTITY_TYPES.PREGUNTA_FRECUENTE && (
                                     <>
                                        <TextField
                                            label="Pregunta"
                                            name="pregunta"
                                            value={formData.pregunta || ''}
                                            onChange={handleFormChange}
                                            required
                                            fullWidth
                                            multiline
                                            rows={2}
                                        />
                                        <TextField
                                            label="Respuesta"
                                            name="respuesta"
                                            value={formData.respuesta || ''}
                                            onChange={handleFormChange}
                                            required
                                            fullWidth
                                            multiline
                                            rows={4}
                                        />
                                        <FormControl fullWidth required>
                                            <InputLabel id="edit-faq-tipo-label">Tipo de Solicitud Asociado</InputLabel>
                                            <Select
                                                labelId="edit-faq-tipo-label"
                                                id="edit-faq-tipo"
                                                name="id_tipo"
                                                value={formData.id_tipo || ''}
                                                label="Tipo de Solicitud Asociado"
                                                onChange={handleFormChange}
                                            >
                                                 <MenuItem value=""><em>Seleccione un Tipo</em></MenuItem>
                                                {tiposSolicitudesAdmin.map((tipo) => (
                                                    <MenuItem key={tipo.id_tipo} value={tipo.id_tipo}>{tipo.nombre_tipo}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </>
                                )}
                            </Stack>
                        </DialogContent>
                        <DialogActions sx={{p: '16px 24px'}}>
                             <Button onClick={handleCloseEditModal} color="secondary" disabled={isSubmitting}>Cancelar</Button>
                             <Button onClick={handleSubmitEdit} variant="contained" color="primary" disabled={isSubmitting}>
                                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Guardar Cambios'}
                             </Button>
                        </DialogActions>
                    </Dialog>
                )}

                {/* --- Modal de Agregar GENÉRICO --- */}
                <Dialog open={isAddModalOpen} onClose={handleCloseAddModal} maxWidth="sm" fullWidth>
                     <DialogTitle>
                        Agregar Nuevo/a {currentSection === 'areas' ? 'Área' :
                                        currentSection === 'tipos-solicitudes' ? 'Tipo de Solicitud' :
                                        currentSection === 'usuarios' ? 'Usuario' :
                                        currentSection === 'preguntas-frecuentes' ? 'Pregunta Frecuente' :
                                        'Elemento'}
                     </DialogTitle>
                     <DialogContent dividers>
                        <Stack spacing={2.5} sx={{ mt: 1 }}> {/* Added Stack for spacing */}
                             {/* --- Campos Específicos por Sección --- */}
                             {currentSection === 'areas' && (
                                 <TextField
                                     label="Nombre Área"
                                     name="nombre_area"
                                     value={addFormData.nombre_area || ''}
                                     onChange={handleAddFormChange}
                                     required
                                     fullWidth
                                     autoFocus // Focus on the first field
                                 />
                             )}
                             {currentSection === 'tipos-solicitudes' && (
                                 <>
                                     <TextField
                                         label="Nombre Tipo Solicitud"
                                         name="nombre_tipo"
                                         value={addFormData.nombre_tipo || ''}
                                         onChange={handleAddFormChange}
                                         required
                                         fullWidth
                                         autoFocus
                                     />
                                     <TextField
                                         label="Descripción (opcional)"
                                         name="descripcion"
                                         value={addFormData.descripcion || ''}
                                         onChange={handleAddFormChange}
                                         multiline
                                         rows={3}
                                         fullWidth
                                     />
                                     <FormControl fullWidth required>
                                         <InputLabel id="add-tipo-area-label">Área</InputLabel>
                                         <Select
                                             labelId="add-tipo-area-label"
                                             id="add-tipo-area"
                                             name="area_id"
                                             value={addFormData.area_id || ''}
                                             label="Área"
                                             onChange={handleAddFormChange}
                                         >
                                             <MenuItem value=""><em>Seleccione un Área</em></MenuItem>
                                             {areas.map((area) => (
                                                 <MenuItem key={area.id_area} value={area.id_area}>{area.nombre_area}</MenuItem>
                                             ))}
                                         </Select>
                                     </FormControl>
                                 </>
                             )}
                              {currentSection === 'usuarios' && (
                                 <>
                                     <TextField
                                         label="RUT (sin puntos, con guión)"
                                         name="RUT"
                                         value={addFormData.RUT || ''}
                                         onChange={handleAddFormChange}
                                         required
                                         fullWidth
                                         autoFocus
                                     />
                                     <TextField
                                         label="Nombre"
                                         name="nombre"
                                         value={addFormData.nombre || ''}
                                         onChange={handleAddFormChange}
                                         required
                                         fullWidth
                                     />
                                     <TextField
                                         label="Apellido"
                                         name="apellido"
                                         value={addFormData.apellido || ''}
                                         onChange={handleAddFormChange}
                                         required
                                         fullWidth
                                     />
                                      <TextField
                                         label="Correo Electrónico"
                                         name="correo_electronico"
                                         type="email"
                                         value={addFormData.correo_electronico || ''}
                                         onChange={handleAddFormChange}
                                         required
                                         fullWidth
                                     />
                                     <TextField
                                            label="Contraseña"
                                            name="password"
                                            type={showAddModalPassword ? 'text' : 'password'}
                                            value={addFormData.password || ''}
                                            onChange={handleAddFormChange}
                                            required
                                            fullWidth
                                            InputProps={{
                                                endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        aria-label="toggle password visibility"
                                                        onClick={handleClickShowPasswordAddModal}
                                                        onMouseDown={handleMouseDownPasswordAddModal}
                                                        edge="end"
                                                    >
                                                    {showAddModalPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                                ),
                                            }}
                                        />
                                     <FormControl fullWidth required>
                                         <InputLabel id="add-usuario-rol-label">Rol</InputLabel>
                                         <Select
                                             labelId="add-usuario-rol-label"
                                             id="add-usuario-rol"
                                             name="rol"
                                             value={addFormData.rol || ''}
                                             label="Rol"
                                             onChange={handleAddFormChange}
                                         >
                                               <MenuItem value="" disabled><em>Seleccione un Rol</em></MenuItem>
                                             {ROLES_PERMITIDOS.map((rol) => (
                                                 <MenuItem key={rol} value={rol}>{rol}</MenuItem>
                                             ))}
                                         </Select>
                                     </FormControl>
                                     <FormControl fullWidth>
                                         <InputLabel id="add-usuario-area-label">Área (Opcional)</InputLabel>
                                         <Select
                                             labelId="add-usuario-area-label"
                                             id="add-usuario-area"
                                             name="area_id"
                                             value={addFormData.area_id || ''} // Use empty string for 'None'
                                             label="Área (Opcional)"
                                             onChange={handleAddFormChange}
                                         >
                                             <MenuItem value=""><em>Ninguna</em></MenuItem>
                                             {areas.map((area) => (
                                                 <MenuItem key={area.id_area} value={area.id_area}>{area.nombre_area}</MenuItem>
                                             ))}
                                         </Select>
                                     </FormControl>
                                 </>
                             )}
                             {currentSection === 'preguntas-frecuentes' && (
                                  <>
                                     <TextField
                                         label="Pregunta"
                                         name="pregunta"
                                         value={addFormData.pregunta || ''}
                                         onChange={handleAddFormChange}
                                         required
                                         fullWidth
                                         multiline
                                         rows={2}
                                         autoFocus
                                     />
                                     <TextField
                                         label="Respuesta"
                                         name="respuesta"
                                         value={addFormData.respuesta || ''}
                                         onChange={handleAddFormChange}
                                         required
                                         fullWidth
                                         multiline
                                         rows={4}
                                     />
                                     <FormControl fullWidth required>
                                         <InputLabel id="add-faq-tipo-label">Tipo de Solicitud Asociado</InputLabel>
                                         <Select
                                             labelId="add-faq-tipo-label"
                                             id="add-faq-tipo"
                                             name="id_tipo"
                                             value={addFormData.id_tipo || ''}
                                             label="Tipo de Solicitud Asociado"
                                             onChange={handleAddFormChange}
                                         >
                                              <MenuItem value=""><em>Seleccione un Tipo</em></MenuItem>
                                             {tiposSolicitudesAdmin.map((tipo) => (
                                                 <MenuItem key={tipo.id_tipo} value={tipo.id_tipo}>{tipo.nombre_tipo}</MenuItem>
                                             ))}
                                         </Select>
                                     </FormControl>
                                 </>
                             )}
                        </Stack>
                     </DialogContent>
                     <DialogActions sx={{p: '16px 24px'}}>
                          <Button onClick={handleCloseAddModal} color="secondary" disabled={isAdding}>Cancelar</Button>
                          <Button onClick={handleSubmitAdd} variant="contained" color="primary" disabled={isAdding}>
                            {isAdding ? <CircularProgress size={24} color="inherit" /> : 'Agregar'}
                          </Button>
                     </DialogActions>
                </Dialog>

            </Box> {/* Fin Flex Principal */}
        </ThemeProvider>
    );
}
export default Administrador;