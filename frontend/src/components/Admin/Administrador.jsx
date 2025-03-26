import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import {
    Box, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Button, CircularProgress, Fade,
    Card, CardContent, CssBaseline, ThemeProvider, Drawer, useMediaQuery,
    TextField, InputAdornment, Tooltip, Alert, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
// Importa componentes y utilidades (asegúrate que las rutas sean correctas)
import Navbar from "../Navbar"; // Ajusta la ruta si es necesario
import SidebarAdmin from "./SidebarAdmin"; // Ajusta la ruta si es necesario
import { lightTheme, darkTheme } from "../../theme"; // Ajusta la ruta si es necesario
import { mostrarAlertaExito, mostrarAlertaError } from "../../utils/alertUtils"; // Ajusta la ruta si es necesario

// --- Constantes de Layout ---
const APP_BAR_HEIGHT = 64;
const DRAWER_WIDTH = 240;

// --- Componente Principal ---
function Administrador() {
    // --- Estados ---
    const [mode, setMode] = useState("light");
    const [mobileOpen, setMobileOpen] = useState(false);
    const [currentSection, setCurrentSection] = useState(null); // Sección activa (null al inicio)
    const [loading, setLoading] = useState(false); // Estado de carga principal
    const [error, setError] = useState(null); // Mensaje de error general
    const [searchTerm, setSearchTerm] = useState(""); // Término de búsqueda/filtro
    // Estados para los datos de cada sección
    const [solicitudes, setSolicitudes] = useState([]);
    const [areas, setAreas] = useState([]);
    const [tiposSolicitudesAdmin, setTiposSolicitudesAdmin] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    // Estados para el modal de edición de estado
    const [isEstadoFormOpen, setIsEstadoFormOpen] = useState(false);
    const [solicitudParaEditar, setSolicitudParaEditar] = useState(null);
    const [nuevoEstado, setNuevoEstado] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false); // Estado de carga para el envío del formulario

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
            setCurrentSection(sectionName); // Dispara useEffect para cargar datos
            setSearchTerm(""); // Limpia búsqueda al cambiar sección
        }
        handleDrawerClose(); // Cierra drawer (especialmente en móvil)
    }, [currentSection, handleDrawerClose]);

    // --- Fetch Genérico ---
    // useCallback para asegurar que la función no cambie en cada render a menos que sus deps cambien
    const fetchGenericData = useCallback(async (endpoint, sectionIdentifier) => {
        console.log(`[fetchGenericData] Fetching for ${sectionIdentifier} from ${endpoint}`);
        try {
            const response = await axios.get(endpoint);
            let potentialData = null;

            // Intentar extraer datos de estructuras comunes
            if (response.data && Array.isArray(response.data)) {
                potentialData = response.data; // Caso: respuesta es un array directo
            } else if (sectionIdentifier === 'solicitudes' && response.data?.solicitudes && Array.isArray(response.data.solicitudes)) {
                potentialData = response.data.solicitudes; // Caso específico: { solicitudes: [...] }
            }
            // Añadir más 'else if' si hay otras estructuras específicas por sección

            // Validar que tenemos un array
            if (Array.isArray(potentialData)) {
                console.log(`[fetchGenericData] Success. Received ${potentialData.length} items for ${sectionIdentifier}`);
                return potentialData; // Devolver el array de datos
            } else {
                console.warn(`[fetchGenericData] Unexpected data format or empty response for ${sectionIdentifier}. Response:`, response.data);
                return []; // Devolver array vacío si el formato es incorrecto
            }

        } catch (err) {
            console.error(`[fetchGenericData] Network/Request Error fetching ${sectionIdentifier}:`, err);
            // Relanzar el error para que sea manejado por el llamador (useEffect)
            throw err;
        }
    }, []); // Sin dependencias, ya que usa argumentos y axios importado

    // --- Wrappers de Fetch por Sección (estables gracias a useCallback) ---
    const fetchSolicitudes = useCallback(() => fetchGenericData('/api/solicitudes', 'solicitudes'), [fetchGenericData]);
    const fetchAreas = useCallback(() => fetchGenericData('/api/areas', 'areas'), [fetchGenericData]);
    const fetchTiposSolicitudesAdmin = useCallback(() => fetchGenericData('/api/tipos_solicitudes', 'tipos-solicitudes'), [fetchGenericData]);
    const fetchUsuarios = useCallback(() => fetchGenericData('/api/usuarios', 'usuarios'), [fetchGenericData]);

    // --- Efecto Principal para Cargar Datos al Cambiar Sección ---
    useEffect(() => {
        // Si no hay sección seleccionada, resetear todo y salir.
        if (!currentSection) {
            setLoading(false); setError(null);
            setSolicitudes([]); setAreas([]); setTiposSolicitudesAdmin([]); setUsuarios([]);
            return;
        }

        let isMounted = true; // Flag para evitar updates si el componente se desmonta rápido
        const section = currentSection; // Capturar valor actual de la sección

        const loadData = async () => {
            console.log(`[useEffect] Loading data for section: ${section}`);
            if (isMounted) {
                setLoading(true); // Activar loader principal
                setError(null); // Limpiar errores previos
                // Limpiar datos específicos de la sección *antes* de la nueva carga
                 switch (section) {
                    case 'solicitudes': setSolicitudes([]); break;
                    case 'areas': setAreas([]); break;
                    case 'tipos-solicitudes': setTiposSolicitudesAdmin([]); break;
                    case 'usuarios': setUsuarios([]); break;
                }
            }

            let fetchFn;
            let setDataFn;

            // Seleccionar la función de fetch y el setter de estado correctos
            switch (section) {
                case 'solicitudes': fetchFn = fetchSolicitudes; setDataFn = setSolicitudes; break;
                case 'areas': fetchFn = fetchAreas; setDataFn = setAreas; break;
                case 'tipos-solicitudes': fetchFn = fetchTiposSolicitudesAdmin; setDataFn = setTiposSolicitudesAdmin; break;
                case 'usuarios': fetchFn = fetchUsuarios; setDataFn = setUsuarios; break;
                default:
                    console.warn("[useEffect] Unknown section:", section);
                    if (isMounted) {
                        setError(`Sección desconocida: ${section}`);
                        setLoading(false);
                    }
                    return; // Salir si la sección no es válida
            }

            try {
                // Ejecutar la función de fetch
                const data = await fetchFn();

                // Si el componente sigue montado Y la sección no ha cambiado durante el fetch...
                if (isMounted && currentSection === section) {
                    console.log(`[useEffect] Fetch successful for ${section}. Setting data.`);
                    setDataFn(data); // Actualizar el estado con los nuevos datos
                } else {
                     console.log(`[useEffect] Fetch done, but component unmounted or section changed (${currentSection}). Discarding data for ${section}.`);
                }
            } catch (err) {
                 // Si el componente sigue montado Y la sección no ha cambiado...
                if (isMounted && currentSection === section) {
                    console.error(`[useEffect] Error loading ${section}:`, err);
                    const apiError = err.response?.data?.message;
                    setError(apiError || err.message || `Error al cargar ${section}.`); // Mostrar error
                } else {
                     console.log(`[useEffect] Error occurred, but component unmounted or section changed (${currentSection}). Ignoring error for ${section}.`);
                }
            } finally {
                 // Si el componente sigue montado Y la sección no ha cambiado...
                if (isMounted && currentSection === section) {
                    console.log(`[useEffect] Setting loading=false for ${section}.`);
                    setLoading(false); // Desactivar loader principal
                }
            }
        };

        loadData(); // Ejecutar la carga

        // Función de limpieza: se ejecuta si el componente se desmonta o si `currentSection` cambia ANTES de que termine el fetch
        return () => {
            console.log(`[useEffect] Cleanup for section: ${section}`);
            isMounted = false; // Marcar como desmontado para evitar updates de estado post-desmonte
        };
    // La dependencia es solo `currentSection`. Los fetch wrappers son estables por useCallback.
    }, [currentSection, fetchSolicitudes, fetchAreas, fetchTiposSolicitudesAdmin, fetchUsuarios]);


    // Cerrar drawer en pantallas grandes (si se abrió temporalmente)
    useEffect(() => { if (isLargeScreen) setMobileOpen(false); }, [isLargeScreen]);

    // --- Filtrado de Datos (Memoizado) ---
    const filteredData = useMemo(() => {
        // Si está cargando, hay error o no hay sección, devolver array vacío
        if (loading || error || !currentSection) return [];

        let dataToFilter = [];
        // Seleccionar el array de datos correcto según la sección
        switch (currentSection) {
            case 'solicitudes': dataToFilter = solicitudes; break;
            case 'areas': dataToFilter = areas; break;
            case 'tipos-solicitudes': dataToFilter = tiposSolicitudesAdmin; break;
            case 'usuarios': dataToFilter = usuarios; break;
            default: return [];
        }

        // Asegurar que siempre sea un array (aunque fetchGenericData ya debería garantizarlo)
        if (!Array.isArray(dataToFilter)) return [];

        // Si no hay término de búsqueda, devolver todos los datos
        if (!searchTerm.trim()) return dataToFilter;

        const lowerSearch = searchTerm.toLowerCase();
        // Lógica de filtrado específica por sección
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
                        (t.nombre_area && t.nombre_area.toLowerCase().includes(lowerSearch))
                    );
                case 'usuarios':
                    return dataToFilter.filter(u =>
                        (u.RUT && u.RUT.toLowerCase().includes(lowerSearch)) ||
                        (u.nombre && u.nombre.toLowerCase().includes(lowerSearch)) ||
                        (u.apellido && u.apellido.toLowerCase().includes(lowerSearch)) ||
                        (u.correo_electronico && u.correo_electronico.toLowerCase().includes(lowerSearch)) ||
                        (u.rol && u.rol.toLowerCase().includes(lowerSearch))
                    );
                default: return [];
            }
        } catch (filterError) {
            console.error("[filteredData] Error during filtering:", filterError);
            return []; // Devolver vacío en caso de error de filtrado
        }
    // Dependencias: se recalcula si cambia la sección, el término de búsqueda, los datos fuente, o el estado de carga/error.
    }, [currentSection, searchTerm, solicitudes, areas, tiposSolicitudesAdmin, usuarios, loading, error]);

    // --- Handlers Modal Editar Estado ---
    const handleOpenEditEstado = useCallback((solicitud) => {
        setSolicitudParaEditar(solicitud);
        setNuevoEstado(solicitud.estado || ''); // Inicializar con estado actual o vacío
        setIsEstadoFormOpen(true);
    }, []); // Sin dependencias, solo usa setters

    const handleCloseEditEstado = useCallback(() => {
        if (!isSubmitting) { // Evitar cerrar si está en medio de un envío
            setIsEstadoFormOpen(false);
            // Opcional: resetear state aquí o al abrir
            // setSolicitudParaEditar(null);
            // setNuevoEstado('');
        }
    }, [isSubmitting]);

    const handleEstadoChange = useCallback((event) => {
        setNuevoEstado(event.target.value);
    }, []); // Sin dependencias, solo usa setter

    // --- Submit Editar Estado ---
    const handleSubmitEditEstado = async () => {
        if (!solicitudParaEditar || !nuevoEstado || nuevoEstado === solicitudParaEditar.estado) {
             console.warn("[handleSubmit] Submit prevented: No change or invalid state.");
             return;
        }

        setIsSubmitting(true); // Activar loader del botón
        const apiUrl = `/api/solicitudes/estado/${solicitudParaEditar.id_solicitud}`;
        const originalSolicitudId = solicitudParaEditar.id_solicitud; // Guardar ID por si cambia el state mientras tanto

        try {
            // 1. Enviar petición PUT para actualizar estado
            await axios.put(apiUrl, { estado: nuevoEstado });
            console.log(`[handleSubmit] PUT successful for solicitud ${originalSolicitudId}`);

            // 2. Refrescar los datos de solicitudes SI estamos en esa sección
            if (currentSection === 'solicitudes') {
                console.log(`[handleSubmit] Refetching solicitudes after update...`);
                try {
                    const updatedData = await fetchSolicitudes(); // Obtener datos frescos
                     // Verificar si seguimos en la sección de solicitudes después del await
                    if (currentSection === 'solicitudes') {
                        setSolicitudes(updatedData); // Actualizar estado con datos frescos
                        console.log(`[handleSubmit] Refetch successful, state updated.`);
                        await mostrarAlertaExito('Estado Actualizado', 'El estado se actualizó y la tabla se ha recargado.');
                        handleCloseEditEstado(); // Cerrar modal SÓLO si todo fue bien
                    } else {
                         console.log(`[handleSubmit] Refetch done, but section changed. State not updated.`);
                         await mostrarAlertaExito('Estado Actualizado', 'El estado se guardó.'); // Notificar éxito aunque no se vea la tabla
                         handleCloseEditEstado();
                    }
                } catch (refetchErr) {
                    console.error("[handleSubmit] Error during refetch:", refetchErr);
                     // PUT ok, GET falló. Informar al usuario.
                     await mostrarAlertaError('Actualización Parcial', 'El estado se guardó, pero la tabla no pudo recargarse automáticamente.');
                     handleCloseEditEstado(); // Cerrar modal, el dato está guardado en el backend
                }
            } else {
                 // Si no estábamos en la sección 'solicitudes', solo mostrar éxito y cerrar
                 console.log(`[handleSubmit] Update successful, but not viewing 'solicitudes'. No refetch needed.`);
                 await mostrarAlertaExito('Estado Actualizado', 'El estado se guardó.');
                 handleCloseEditEstado();
            }

        } catch (err) {
            // Error en la petición PUT
            console.error("[handleSubmit] Error during PUT:", err);
            const errorMsg = err.response?.data?.message || err.message || 'No se pudo actualizar el estado.';
            await mostrarAlertaError('Error al Actualizar', errorMsg);
            // NO cerrar el modal en caso de error de PUT, para que el usuario pueda intentar de nuevo o cancelar.
        } finally {
            setIsSubmitting(false); // Desactivar loader del botón en cualquier caso
        }
    };


    // --- Contenido Sidebar ---
    const drawerContent = useMemo(() => (
        <SidebarAdmin
            currentSection={currentSection}
            onSelectSection={handleSelectSection}
            onCloseDrawer={handleDrawerClose}
        />
     // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [currentSection, handleSelectSection /* handleDrawerClose no cambia */]);

    // --- Estilos Celdas ---
    const headerCellStyle = useMemo(() => ({
        fontWeight: 'bold',
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        py: { xs: 0.8, sm: 1 },
        px: { xs: 1, sm: 1.5 },
        whiteSpace: 'nowrap',
        fontSize: { xs: '0.75rem', sm: '0.875rem' }
    }), []); // Estilo constante

    const bodyCellStyle = useMemo(() => ({
        py: { xs: 0.75, sm: 1 },
        px: { xs: 1, sm: 1.5 },
        fontSize: { xs: '0.75rem', sm: '0.875rem' },
        verticalAlign: 'middle'
    }), []); // Estilo constante

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

     // --- ColSpan Dinámico para Mensajes Vacíos/Error ---
     const getCurrentColSpan = useCallback(() => {
        switch (currentSection) {
            case 'solicitudes': return 6;
            case 'areas': return 3;
            case 'tipos-solicitudes': return 4;
            case 'usuarios': return 6;
            default: return 1; // Fallback
        }
    }, [currentSection]);


    // --- Renderizado ---
    return (
        <ThemeProvider theme={currentTheme}>
            <CssBaseline />
            <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
                {/* --- Navbar --- */}
                <Navbar
                    toggleTheme={toggleTheme}
                    toggleSidebar={handleDrawerToggle}
                    title="Portal Administración"
                    logoLink="/administrador" // O la ruta adecuada
                />

                {/* --- Sidebar --- */}
                <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
                    {/* Drawer Móvil */}
                    <Drawer
                        variant="temporary"
                        open={mobileOpen}
                        onClose={handleDrawerToggle}
                        ModalProps={{ keepMounted: true }} // Mejor rendimiento en móviles
                        sx={{
                            display: { xs: 'block', md: 'none' },
                            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, bgcolor: 'background.paper' }
                        }}
                    >
                        {drawerContent}
                    </Drawer>
                    {/* Drawer Desktop */}
                    <Drawer
                        variant="permanent"
                        open // Siempre abierto en desktop
                        sx={{
                            display: { xs: 'none', md: 'block' },
                            '& .MuiDrawer-paper': {
                                boxSizing: 'border-box',
                                width: DRAWER_WIDTH,
                                top: `${APP_BAR_HEIGHT}px`, // Debajo del Navbar
                                height: `calc(100vh - ${APP_BAR_HEIGHT}px)`,
                                borderRight: `1px solid ${currentTheme.palette.divider}`,
                                bgcolor: 'background.paper'
                            }
                        }}
                    >
                        {drawerContent}
                    </Drawer>
                </Box>

                {/* --- Contenido Principal --- */}
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: { xs: 1.5, sm: 2, md: 3 }, // Padding responsivo
                        width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
                        display: 'flex',
                        flexDirection: 'column',
                        mt: `${APP_BAR_HEIGHT}px`, // Espacio para Navbar
                        height: `calc(100vh - ${APP_BAR_HEIGHT}px)`, // Altura completa menos Navbar
                        overflow: 'hidden' // Evitar scroll principal, el scroll estará en la tabla
                    }}
                >
                    {/* Card Contenedora */}
                    <Card sx={{
                        width: '100%', flexGrow: 1, borderRadius: 2,
                        boxShadow: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column',
                        overflow: 'hidden', bgcolor: 'background.paper'
                    }}>
                        <CardContent sx={{
                            p: { xs: 1.5, sm: 2, md: 3 }, display: 'flex', flexDirection: 'column',
                            flexGrow: 1, overflow: 'hidden' // Permitir que la tabla crezca y scrollee
                        }}>

                            {/* Cabecera: Título y Búsqueda */}
                            <Box sx={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                mb: 2.5, flexWrap: 'wrap', gap: 2, flexShrink: 0 // No encoger esta parte
                            }}>
                                <Typography variant={isSmallScreen ? 'h6' : (isLargeScreen ? 'h4' : 'h5')} component="h1" sx={{ fontWeight: "bold" }}>
                                    {getSectionTitle()}
                                </Typography>
                                {/* Mostrar buscador solo si hay sección y no está cargando ni hay error */}
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

                            {/* Indicador de Carga / Mensaje de Error / Mensaje Inicial */}
                            {loading && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 5, flexGrow: 1 }}>
                                    <CircularProgress />
                                    <Typography sx={{ ml: 2 }} color="text.secondary">Cargando datos...</Typography>
                                </Box>
                            )}
                            {!loading && error && (
                                <Alert severity="error" sx={{ mb: 2, flexShrink: 0 }}>{error}</Alert>
                            )}
                            {!loading && !error && !currentSection && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, textAlign: 'center', color: 'text.secondary', p: 3 }}>
                                    <Typography variant="h6" component="p">
                                        Selecciona una sección del menú lateral para comenzar.
                                    </Typography>
                                </Box>
                            )}

                            {/* Contenedor de la Tabla (SOLO si no carga, no hay error y hay sección) */}
                            {!loading && !error && currentSection && (
                                <Fade in={true} timeout={300} style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    <TableContainer component={Paper} sx={{
                                        flexGrow: 1, // Ocupar espacio disponible
                                        overflow: 'auto', // Scroll si es necesario
                                        boxShadow: 0, border: `1px solid ${currentTheme.palette.divider}`,
                                        borderRadius: 1.5, width: '100%', bgcolor: 'background.paper'
                                    }}>
                                        <Table stickyHeader size="small" sx={{ minWidth: 650 }}>
                                            {/* --- Cabeceras de Tabla Dinámicas --- */}
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
                                                         <TableCell sx={{ ...headerCellStyle, textAlign: 'right' }}>Acciones</TableCell>
                                                     </TableRow>
                                                 </TableHead>
                                            )}

                                            {/* --- Cuerpo de Tabla Dinámico --- */}
                                            <TableBody>
                                                {filteredData.length > 0 ? (
                                                    <>
                                                        {/* Mapeo según la sección */}
                                                        {currentSection === 'solicitudes' && filteredData.map((sol) => (
                                                            <TableRow hover key={sol.id_solicitud} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                                <TableCell sx={bodyCellStyle}>{sol.id_formateado}</TableCell>
                                                                <TableCell sx={bodyCellStyle}>{sol.RUT_ciudadano}</TableCell>
                                                                <TableCell sx={bodyCellStyle}>{sol.nombre_tipo}</TableCell>
                                                                <TableCell sx={bodyCellStyle}>
                                                                    {sol.fecha_hora_envio ? new Date(sol.fecha_hora_envio).toLocaleString('es-CL') : '-'}
                                                                </TableCell>
                                                                <TableCell sx={bodyCellStyle}>{sol.estado}</TableCell>
                                                                <TableCell sx={{ ...bodyCellStyle, textAlign: 'right' }}>
                                                                    <Tooltip title="Ver Detalles / Cambiar Estado">
                                                                        {/* Deshabilitar si se está enviando el formulario */}
                                                                        <IconButton size="small" onClick={() => handleOpenEditEstado(sol)} color="primary" disabled={isSubmitting}>
                                                                            <EditIcon fontSize="small"/>
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                        {currentSection === 'areas' && filteredData.map((area) => (
                                                            <TableRow hover key={area.id_area} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                                <TableCell sx={bodyCellStyle}>{area.id_area}</TableCell>
                                                                <TableCell sx={bodyCellStyle}>{area.nombre_area}</TableCell>
                                                                <TableCell sx={{ ...bodyCellStyle, textAlign: 'right' }}>
                                                                    <Tooltip title="Editar Área (Pendiente)">
                                                                        <IconButton size="small" color="primary"><EditIcon fontSize="small"/></IconButton>
                                                                    </Tooltip>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                        {currentSection === 'tipos-solicitudes' && filteredData.map((tipo) => (
                                                             <TableRow hover key={tipo.id_tipo} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                                 <TableCell sx={bodyCellStyle}>{tipo.id_tipo}</TableCell>
                                                                 <TableCell sx={bodyCellStyle}>{tipo.nombre_tipo}</TableCell>
                                                                 <TableCell sx={bodyCellStyle}>{tipo.nombre_area || tipo.area_id || '-'}</TableCell>
                                                                 <TableCell sx={{ ...bodyCellStyle, textAlign: 'right' }}>
                                                                     <Tooltip title="Editar Tipo (Pendiente)">
                                                                         <IconButton size="small" color="primary"><EditIcon fontSize="small"/></IconButton>
                                                                     </Tooltip>
                                                                 </TableCell>
                                                             </TableRow>
                                                        ))}
                                                         {currentSection === 'usuarios' && filteredData.map((user) => (
                                                             <TableRow hover key={user.RUT || `user-${user.id_usuario}`} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                                 <TableCell sx={bodyCellStyle}>{user.RUT || '-'}</TableCell>
                                                                 <TableCell sx={bodyCellStyle}>{user.nombre || '-'}</TableCell>
                                                                 <TableCell sx={bodyCellStyle}>{user.apellido || '-'}</TableCell>
                                                                 <TableCell sx={bodyCellStyle}>{user.correo_electronico || '-'}</TableCell>
                                                                 <TableCell sx={bodyCellStyle}>{user.rol || '-'}</TableCell>
                                                                 <TableCell sx={{ ...bodyCellStyle, textAlign: 'right' }}>
                                                                     <Tooltip title="Editar Usuario (Pendiente)">
                                                                         <IconButton size="small" color="primary"><EditIcon fontSize="small"/></IconButton>
                                                                     </Tooltip>
                                                                 </TableCell>
                                                             </TableRow>
                                                        ))}
                                                    </>
                                                ) : (
                                                    // Mensaje si no hay datos (después de cargar y filtrar)
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

                {/* --- Modal Editar Estado --- */}
                {/* Renderizar el Dialog solo cuando isEstadoFormOpen es true para asegurar estado limpio al abrir */}
                {isEstadoFormOpen && solicitudParaEditar && (
                    <Dialog open={isEstadoFormOpen} onClose={handleCloseEditEstado} maxWidth="xs" fullWidth>
                        <DialogTitle>Cambiar Estado Solicitud #{solicitudParaEditar.id_formateado}</DialogTitle>
                        <DialogContent>
                            <Typography variant="body2" gutterBottom>
                                Vecino: {solicitudParaEditar.RUT_ciudadano}<br/>
                                Tipo: {solicitudParaEditar.nombre_tipo}
                            </Typography>
                            <FormControl fullWidth margin="normal" disabled={isSubmitting}>
                                <InputLabel id="estado-select-label">Nuevo Estado</InputLabel>
                                <Select
                                    labelId="estado-select-label"
                                    id="estado-select"
                                    value={nuevoEstado}
                                    label="Nuevo Estado"
                                    onChange={handleEstadoChange}
                                >
                                    <MenuItem value="Pendiente">Pendiente</MenuItem>
                                    <MenuItem value="Aprobada">Aprobada</MenuItem>
                                    <MenuItem value="Rechazada">Rechazada</MenuItem>
                                    {/* Añadir otros estados si existen */}
                                </Select>
                            </FormControl>
                        </DialogContent>
                        <DialogActions sx={{p: '16px 24px'}}>
                            {/* Botón Cancelar */}
                            <Button onClick={handleCloseEditEstado} disabled={isSubmitting} color="inherit">
                                Cancelar
                            </Button>
                            {/* Botón Actualizar con Loader */}
                            <Box sx={{ position: 'relative' }}>
                                <Button
                                    onClick={handleSubmitEditEstado}
                                    variant="contained"
                                    disabled={isSubmitting || !nuevoEstado || nuevoEstado === solicitudParaEditar.estado} // Deshabilitar si no hay cambio o está enviando
                                >
                                    Actualizar Estado
                                </Button>
                                {isSubmitting && (
                                    <CircularProgress
                                        size={24}
                                        sx={{
                                            color: 'primary.main',
                                            position: 'absolute', top: '50%', left: '50%',
                                            marginTop: '-12px', marginLeft: '-12px'
                                        }}
                                    />
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