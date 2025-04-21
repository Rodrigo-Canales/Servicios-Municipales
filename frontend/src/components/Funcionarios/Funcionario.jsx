// frontend/src/components/Funcionarios/Funcionario.jsx

// --- React and MUI Imports ---
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
    Box, Typography, CircularProgress, Fade, Alert,
    Card, CardContent, Drawer,
    keyframes,
    // MUI Table Components
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, IconButton, Tooltip, Chip,
    // MUI Pagination
    TablePagination,
    // MUI Form Components (para Search)
    TextField, InputAdornment,
    // ThemeProvider y CssBaseline usualmente están en App.jsx
    ThemeProvider, CssBaseline
} from '@mui/material';
// --- Icon Imports ---
import { Visibility as VisibilityIcon, Reply as ReplyIcon, Search as SearchIcon, AccountBox, InfoOutlined as InfoOutlinedIcon } from '@mui/icons-material';

// --- Local Components, Context, Services, Utils ---
import Navbar from '../Navbar';
import Sidebar from '../common/Sidebar';
import RespuestaModalForm from './RespuestasModalForm'; // ¡VERIFICA ESTE NOMBRE DE ARCHIVO Y RUTA!
import VerRespuestaModal from './VerRespuestaModal';
import api from '../../services/api';
import { useAuth } from '../../contexts/useAuth';
import { formatRut } from '../../utils/rutUtils'; // Usado en solicitudColumns
import { mostrarAlertaExito, mostrarAlertaError } from '../../utils/alertUtils'; // Usado en handleEnviarRespuesta
import { lightTheme, darkTheme } from '../../theme';
import TableCard from '../common/TableCard';

// --- Constantes ---
const APP_BAR_HEIGHT = 64;
const DRAWER_WIDTH = 240;
const fadeInUp = keyframes`from { opacity: 0; transform: translate3d(0, 20px, 0); } to { opacity: 1; transform: translate3d(0, 0, 0); }`;
const DEFAULT_SECTION_FUNCIONARIO = 'dashboard';
const DEFAULT_ROWS_PER_PAGE = 10;

// ========================================================================
// --- Componente ListaSolicitudes (Reutilizable) ---
// ========================================================================
// Update table styles and modal to match Vecino aesthetics
const ListaSolicitudes = React.memo(({
    solicitudes, // Recibe datos YA filtrados y paginados
    loading,
    error,
    onVerDetalles,
    estadoFiltro,
    headerCellStyle,
    bodyCellStyle,
    columns,
    colSpan,
    theme // Pass theme as a prop
}) => {
    // useEffect(() => { console.log('[ListaSolicitudes] Props Check:', { loading, error, count: solicitudes?.length }); }, [loading, error, solicitudes]);

    return (
        <Paper sx={{ 
            width: '100%', 
            overflow: 'hidden', 
            border: `1px solid ${theme.palette.divider}`, 
            borderRadius: 1.5, 
            boxShadow: 'none',
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column'
        }}>
            <TableContainer
                sx={{
                    flexGrow: 1,
                    overflow: 'auto',
                    '&::-webkit-scrollbar': {
                        width: '8px',
                        height: '8px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[400],
                        borderRadius: '4px',
                    },
                }}
            >
                <Table stickyHeader size="small" aria-label="Tabla de Solicitudes">
                    <TableHead>
                        <TableRow>
                            {columns.map((col) => ( <TableCell key={col.id} sx={{ ...headerCellStyle, ...(col.headerStyle || {}) }}>{col.label}</TableCell> ))}
                            <TableCell sx={{ ...headerCellStyle, textAlign: 'center', width: { xs: 80, sm: 100 } }}>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {/* Mensajes de Carga, Error o Vacío */}
                        {loading && ( <TableRow><TableCell colSpan={colSpan} align="center" sx={{ py: 4 }}><CircularProgress size={24} /><Typography variant="caption" sx={{ ml: 1 }}>Cargando...</Typography></TableCell></TableRow> )}
                        {error && !loading && ( <TableRow><TableCell colSpan={colSpan} align="center"><Alert severity="error" sx={{ my: 2 }}>{error}</Alert></TableCell></TableRow> )}
                        {!loading && !error && (!solicitudes || solicitudes.length === 0) && ( <TableRow><TableCell colSpan={colSpan} align="center" sx={{ py: 4 }}><Typography sx={{ fontStyle: 'italic', color: 'text.secondary' }}>No hay solicitudes que mostrar.</Typography></TableCell></TableRow> )}
                        {/* Mapeo de Datos */}
                        {!loading && !error && Array.isArray(solicitudes) && solicitudes.map((item, index) => (
                            <TableRow hover key={item.id_solicitud} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: theme.palette.action.hover }, transition: theme.transitions.create('background-color', { duration: theme.transitions.duration.shortest }), animation: `${fadeInUp} 0.3s ease-out forwards`, animationDelay: `${index * 0.03}s`, opacity: 0 }}>
                                {columns.map((col) => ( <TableCell key={`${item.id_solicitud}-${col.id}`} sx={{...bodyCellStyle, ...(col.cellStyle || {})}}>{col.render ? col.render(item) : (item[col.id] ?? '-')}</TableCell> ))}
                                <TableCell sx={{ ...bodyCellStyle, textAlign: 'center', p: '4px' }}>
                                    <Tooltip title={estadoFiltro === 'pendientes' ? "Responder" : "Ver Detalles"} placement="top"><span>
                                        <IconButton size="small" onClick={() => onVerDetalles(item)} color={estadoFiltro === 'pendientes' ? "primary" : "default"} disabled={estadoFiltro === 'pendientes' && item.estado !== 'Pendiente'}>
                                            {estadoFiltro === 'pendientes' ? <ReplyIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                        </IconButton>
                                    </span></Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            {/* La paginación se añade en Funcionario */}
        </Paper>
    );
});
ListaSolicitudes.displayName = 'ListaSolicitudes';
ListaSolicitudes.propTypes = {
    solicitudes: PropTypes.array, loading: PropTypes.bool, error: PropTypes.string,
    onVerDetalles: PropTypes.func.isRequired, estadoFiltro: PropTypes.oneOf(['pendientes', 'resueltas']),
    headerCellStyle: PropTypes.object, bodyCellStyle: PropTypes.object,
    columns: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired, label: PropTypes.string.isRequired })).isRequired,
    colSpan: PropTypes.number.isRequired,
};
// --- Fin ListaSolicitudes ---

// --- Componente Dashboard ---
const DashboardFuncionario = () => ( <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary', animation: `${fadeInUp} 0.5s ease-out`}}><Typography variant="h5" sx={{ fontStyle: 'italic', mb: 2 }}>Bienvenido</Typography><Typography>Selecciona un tipo de solicitud del menú lateral.</Typography></Box> );
// --- Fin Dashboard ---


// ==========================================
// --- Componente Principal Funcionario ---
// ==========================================
function Funcionario({ toggleTheme: toggleThemeProp }) {
    // --- Estados ---
    const [mode, setMode] = useState('light');
    const [mobileOpen, setMobileOpen] = useState(false);
    const [currentSection, setCurrentSection] = useState(DEFAULT_SECTION_FUNCIONARIO);
    const [allSolicitudes, setAllSolicitudes] = useState([]);   // Guarda TODAS las solicitudes raw
    const [tiposDelAreaActual, setTiposDelAreaActual] = useState([]); // <--- REINSTATED
    // Estados Modal
    const [modalRespuestaOpen, setModalRespuestaOpen] = useState(false);
    const [solicitudParaResponder, setSolicitudParaResponder] = useState(null);
    const [isSubmittingRespuesta, setIsSubmittingRespuesta] = useState(false);
    const [submitRespuestaError, setSubmitRespuestaError] = useState(null);
    // Estados Paginación y Búsqueda
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
    // Estados Modal de solo lectura para solicitudes resueltas
    const [modalVerRespuestaOpen, setModalVerRespuestaOpen] = useState(false);
    const [solicitudVerDetalle, setSolicitudVerDetalle] = useState(null);
    const [respuestaDetalle, setRespuestaDetalle] = useState(null);

    // --- Hooks ---
    const theme = useMemo(() => (mode === 'light' ? lightTheme : darkTheme), [mode]);
    const { user, logout } = useAuth();
    const loadingTipos = false; // Si no tienes loading real, ponlo en false

    // --- Estilos Tabla ---
    const headerCellStyle = useMemo(() => ({
        fontWeight: 'bold',
        fontSize: '0.9rem',
        padding: '10px 12px',
        whiteSpace: 'nowrap',
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        borderBottom: `2px solid ${theme.palette.divider}`,
        position: 'sticky',
        top: 0,
        zIndex: 1,
        transition: theme.transitions.create(['background-color', 'color'], {
            duration: theme.transitions.duration.short,
        }),
    }), [theme]);

    const bodyCellStyle = useMemo(() => ({
        fontSize: '0.875rem',
        color: theme.palette.text.secondary,
        verticalAlign: 'middle',
        padding: '10px 12px',
        borderBottom: `1px solid ${theme.palette.divider}`,
        transition: theme.transitions.create(['background-color', 'color'], {
            duration: theme.transitions.duration.shortest,
        }),
        overflowWrap: 'break-word', // Ensure text wraps properly
        wordWrap: 'break-word',
    }), [theme]);

    // --- Handlers ---
    const handleToggleTheme = useCallback(() => {
        if (typeof toggleThemeProp === 'function') toggleThemeProp();
        setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
    }, [toggleThemeProp]);
    const handleDrawerToggle = useCallback(() => setMobileOpen(p => !p), []);
    const handleDrawerClose = useCallback(() => setMobileOpen(false), []);
    const handleSelectSection = useCallback((sectionId) => { if (sectionId !== currentSection) { setCurrentSection(sectionId); setSearchTerm(""); setPage(0); setRowsPerPage(DEFAULT_ROWS_PER_PAGE); } handleDrawerClose(); }, [currentSection, handleDrawerClose]);
    const handleSearchChange = useCallback((event) => { setSearchTerm(event.target.value); setPage(0); }, []);
    const handleChangePage = useCallback((event, newPage) => { setPage(newPage); }, []);
    const handleChangeRowsPerPage = useCallback((event) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0); }, []);
    // Cambiar: handleOpenRespuestaModal ahora hace fetch de la solicitud completa
    const handleOpenRespuestaModal = useCallback(async (solicitud) => {
        setSubmitRespuestaError(null);
        setModalRespuestaOpen(true);
        try {
            // Fetch detalles completos de la solicitud (incluye archivos y PDF)
            const response = await api.get(`/solicitudes/${solicitud.id_solicitud}`);
            if (response && response.data && response.data.solicitud) {
                setSolicitudParaResponder(response.data.solicitud);
            } else {
                setSolicitudParaResponder(solicitud); // fallback mínimo
            }
        } catch {
            setSolicitudParaResponder(solicitud); // fallback mínimo
        }
    }, []);
    const handleCloseRespuestaModal = useCallback(() => { setModalRespuestaOpen(false); setTimeout(() => setSolicitudParaResponder(null), 300); }, []);
    // Handler para abrir modal de solo lectura (resueltas)
    const handleVerDetalleResuelta = useCallback(async (solicitud) => {
        setSolicitudVerDetalle(solicitud);
        setModalVerRespuestaOpen(true);
        setRespuestaDetalle(null);
        try {
            // Fetch detalles completos de la solicitud (incluye archivos y PDF)
            const responseSolicitud = await api.get(`/solicitudes/${solicitud.id_solicitud}`);
            const solicitudCompleta = responseSolicitud?.data?.solicitud || solicitud;
            setSolicitudVerDetalle(solicitudCompleta);
            // Fetch respuesta asociada
            const response = await api.get(`/respuestas/by-solicitud/${solicitud.id_solicitud}`);
            // LOG para depuración
            console.log('Respuesta del backend para /respuestas/by-solicitud:', response.data);
            let respuesta = null;
            if (response.data?.respuesta) {
                respuesta = response.data.respuesta;
            } else if (Array.isArray(response.data)) {
                respuesta = response.data[0];
            } else if (Array.isArray(response.data?.respuestas)) {
                respuesta = response.data.respuestas[0];
            } else if (typeof response.data === 'object' && Object.keys(response.data).length > 0) {
                respuesta = response.data;
            }
            if (!respuesta) {
                setRespuestaDetalle({ error: 'No hay respuesta registrada para esta solicitud.' });
            } else {
                setRespuestaDetalle(respuesta);
            }
        } catch (e) {
            console.error('Error al obtener la respuesta:', e);
            setRespuestaDetalle({ error: 'No se pudo cargar la respuesta del funcionario.' });
        }
    }, []);

    // --- Definición de Columnas ---
    const solicitudColumns = useMemo(() => [
        { id: 'id_solicitud', label: 'ID', render: item => item.id_formateado || item.id_solicitud },
        { id: 'nombre_tipo', label: 'Tipo Solicitud' },
        { id: 'nombre_ciudadano', label: 'Solicitante', render: item => `${item.nombre_ciudadano || ''} ${item.apellido_ciudadano || ''}`.trim() || 'N/A' },
        { id: 'RUT_ciudadano', label: 'RUT', render: item => formatRut(item.RUT_ciudadano) || 'N/A' }, // <-- formatRut USADO
        { id: 'fecha_hora_envio', label: 'Fecha Envío', render: item => item.fecha_hora_envio ? new Date(item.fecha_hora_envio).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'}) : 'N/A' },
        { id: 'estado', label: 'Estado', render: item => <Chip label={item.estado || 'Desconocido'} size="small" color={ item.estado === 'Pendiente' ? 'warning' : item.estado === 'Aprobada' ? 'success' : item.estado === 'Rechazada' ? 'error' : 'default' } sx={{ fontWeight: 500, fontSize: '0.78rem' }} /> },
    ], []); // Sin dependencias externas

    // --- Data Fetching ---
    // Cargar tipos (para título y sidebar)
    useEffect(() => {
        let isMounted = true;
        if (user?.area_id) {
            api.get(`/tipos_solicitudes/area/${user.area_id}`)
                .then(r => {
                    if (!isMounted) return;
                    if (r && r.data && Array.isArray(r.data)) {
                        setTiposDelAreaActual(r.data);
                    } else {
                        setTiposDelAreaActual([]);
                    }
                })
                .catch(() => {
                    if (isMounted) setTiposDelAreaActual([]);
                });
        } else {
            if (isMounted) setTiposDelAreaActual([]);
        }
        return () => { isMounted = false; };
    }, [user?.area_id]);

    // Cargar TODAS las solicitudes (al montar o al forzar refresco)
    const fetchAllSolicitudes = useCallback(async (showLoading = true) => {
        let isMounted = true;
        console.log(`%c[FETCH_ALL] Iniciando... (showLoading: ${showLoading})`, 'color: brown;');
        if (showLoading && isMounted) {
            setAllSolicitudes([]); // Limpiar el estado antes de cargar
        }
        try {
            const response = await api.get('/solicitudes');
            console.log('%c[FETCH_ALL] Respuesta del servidor:', 'color: green;', response.data);
            if (!isMounted) return;
            const data = response.data?.solicitudes;
            if (!Array.isArray(data)) throw new Error("Formato de API inválido.");
            console.log(`%c[FETCH_ALL] ${data.length} solicitudes recibidas.`, 'color: green;');
            if (isMounted) {
                setAllSolicitudes(data); // Actualizar el estado con los datos recibidos
            }
        } catch (err) {
            console.error(`%c[FETCH_ALL] ERROR:`, 'color: red;', err);
            if (isMounted) {
                setAllSolicitudes([]); // Asegurarse de que el estado no quede indefinido
            }
        } finally {
            if (showLoading && isMounted) {
                console.log('%c[FETCH_ALL] Finalizado.', 'color: brown;');
            }
        }
        return () => { isMounted = false; };
    }, []); // Sin dependencias

    // --- Effect para cargar inicial ---
    useEffect(() => { fetchAllSolicitudes(true); }, [fetchAllSolicitudes]); // Llamar con showLoading=true al montar

    useEffect(() => {
        console.log('Datos de solicitudes:', allSolicitudes);
    }, [allSolicitudes]);

    // --- Filtrado y Paginación ---
    const filteredAndSortedData = useMemo(() => {
        console.log('%c[FILTER] Iniciando filtrado y ordenamiento...', 'color: blue;');
        console.log('%c[FILTER] currentSection:', 'color: blue;', currentSection);

        let results = allSolicitudes || [];
        console.log('%c[FILTER] Datos iniciales:', 'color: blue;', results);

        if (currentSection?.startsWith('tipo-')) {
            const [, tipoId, estadoFilter] = currentSection.split('-');
            console.log('%c[FILTER] tipoId:', 'color: blue;', tipoId);
            console.log('%c[FILTER] estadoFilter:', 'color: blue;', estadoFilter);

            results = results.filter(sol => {
                const tipoCoincide = sol.id_tipo?.toString() === tipoId.toString();
                const estadoCoincide = (estadoFilter === 'pendientes' && sol.estado === 'Pendiente') ||
                                      (estadoFilter === 'resueltas' && (sol.estado === 'Aprobada' || sol.estado === 'Rechazada'));
                console.log('%c[FILTER] Evaluando solicitud:', 'color: blue;', sol);
                console.log('%c[FILTER] tipoCoincide:', 'color: blue;', tipoCoincide);
                console.log('%c[FILTER] estadoCoincide:', 'color: blue;', estadoCoincide);
                return tipoCoincide && estadoCoincide;
            });
            console.log('%c[FILTER] Datos después de filtrar por sección:', 'color: blue;', results);
        } else if (currentSection !== 'dashboard') {
            results = []; // Clear results for unsupported sections
        }

        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        if (lowerSearchTerm && results.length > 0) {
            results = results.filter(sol =>
                solicitudColumns.some(col => {
                    const value = col.render ? col.render(sol) : sol[col.id];
                    return value?.toString().toLowerCase().includes(lowerSearchTerm);
                })
            );
            console.log('%c[FILTER] Datos después de filtrar por búsqueda:', 'color: blue;', results);
        }

        if (results.length > 0) {
            results = [...results].sort((a, b) => new Date(b.fecha_hora_envio) - new Date(a.fecha_hora_envio));
            console.log('%c[FILTER] Datos después de ordenar:', 'color: blue;', results);
        }

        return results;
    }, [currentSection, searchTerm, allSolicitudes, solicitudColumns]);

    // paginatedData SÍ se usa en renderMainContent
    const paginatedData = useMemo(() => {
        console.log('%c[PAGINATION] Iniciando paginación...', 'color: purple;');
        if (!Array.isArray(filteredAndSortedData)) return [];
        const paginated = rowsPerPage > 0 ? filteredAndSortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : filteredAndSortedData;
        console.log('%c[PAGINATION] Datos paginados:', 'color: purple;', paginated);
        return paginated;
    }, [filteredAndSortedData, page, rowsPerPage]);

    // --- Handler Envío Modal ---
     const handleEnviarRespuesta = useCallback(async (formData) => {
         setIsSubmittingRespuesta(true); setSubmitRespuestaError(null); let isMounted = true;
         try {
             await api.post('/respuestas', formData);
             if (isMounted) {
                 mostrarAlertaExito('Respuesta Enviada', 'La respuesta se registró.'); // <-- USADA
                 handleCloseRespuestaModal();
                 fetchAllSolicitudes(false); // Refrescar datos SIN mostrar loader general
             }
         } catch (err) { /* ... manejo error ... */ if (isMounted) { /* ... */ mostrarAlertaError('Error', err.response?.data?.message || 'Error.'); } // <-- USADA
         } finally { if (isMounted) setIsSubmittingRespuesta(false); } return () => { isMounted = false; };
      
     }, [fetchAllSolicitudes, handleCloseRespuestaModal]); // Dependencias ok

    // --- Valores Memoizados ---
    // --- Obtener el nombre del tipo de solicitud activo ---
    const getTipoNombre = useMemo(() => {
        if (currentSection.startsWith('tipo-')) {
            const [, tipoId] = currentSection.split('-');
            const tipo = tiposDelAreaActual.find(t => String(t.id_tipo) === String(tipoId));
            return tipo ? tipo.nombre_tipo : '';
        }
        return '';
    }, [currentSection, tiposDelAreaActual]);

    // --- Renderizado del Contenido Principal ---
    const renderMainContent = () => {
        if (currentSection === 'dashboard' || !currentSection) {
            return (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', py: 6 }}>
                    <InfoOutlinedIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: 'text.secondary', fontStyle: 'italic', textAlign: 'center' }}>
                        Selecciona una opción en el menú lateral
                    </Typography>
                </Box>
            );
        }
        if (currentSection.startsWith('tipo-')) {
            return (
                <TableCard
                    title={getTipoNombre}
                    columns={solicitudColumns}
                    rows={paginatedData}
                    loading={false}
                    error={null}
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                    renderActions={(item) => (
                        <Tooltip title="Ver Detalles" placement="top">
                            <Button
                                variant="contained"
                                size="small"
                                onClick={() => {
                                    if (item.estado === 'Pendiente') {
                                        handleOpenRespuestaModal(item);
                                    } else {
                                        handleVerDetalleResuelta(item);
                                    }
                                }}
                            >
                                Ver
                            </Button>
                        </Tooltip>
                    )}
                    headerCellStyle={headerCellStyle}
                    bodyCellStyle={bodyCellStyle}
                    minWidth={650}
                    noResultsMsg={searchTerm ? "No se encontraron solicitudes con la búsqueda." : "No hay solicitudes que mostrar."}
                    totalCount={filteredAndSortedData.length}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    context={{}}
                />
            );
        }
        return ( <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary', mt: 4 }}><Typography>Contenido no disponible.</Typography></Box> );
    };

    // --- Render Principal del Layout ---
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
                {/* Navbar y Sidebar */}
                <Navbar toggleTheme={handleToggleTheme} toggleSidebar={handleDrawerToggle} title="Panel de Funcionarios" appBarHeight={APP_BAR_HEIGHT} logoLink="/funcionarios" />
                <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
                    {/* Drawer móvil */}
                    <Drawer
                        variant="temporary"
                        open={mobileOpen}
                        onClose={handleDrawerClose}
                        ModalProps={{ keepMounted: true }}
                        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, bgcolor: 'background.paper', borderRight: `1px solid ${theme.palette.divider}`, top: { xs: `${APP_BAR_HEIGHT}px`, md: `${APP_BAR_HEIGHT}px` }, height: { xs: `calc(100vh - ${APP_BAR_HEIGHT}px)`, md: `calc(100vh - ${APP_BAR_HEIGHT}px)` }, transition: theme.transitions.create('transform', { easing: theme.transitions.easing.sharp, duration: theme.transitions.duration.enteringScreen }), overflowX: 'hidden' } }}
                    >
                        <Sidebar
                            panelType="funcionario"
                            currentSection={currentSection}
                            onSelectSection={handleSelectSection}
                            onCloseDrawer={handleDrawerClose}
                            tiposDelArea={tiposDelAreaActual}
                            loadingTipos={loadingTipos}
                            user={user}
                            onLogout={logout}
                        />
                    </Drawer>
                    {/* Drawer desktop fijo igual que Vecino.jsx */}
                    <Drawer
                        variant="permanent"
                        open
                        sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, top: `${APP_BAR_HEIGHT}px`, height: `calc(100vh - ${APP_BAR_HEIGHT}px)`, borderRight: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper', overflowY: 'auto', transition: theme.transitions.create('width', { easing: theme.transitions.easing.sharp, duration: theme.transitions.duration.enteringScreen }), overflowX: 'hidden' } }}
                    >
                        <Sidebar
                            panelType="funcionario"
                            currentSection={currentSection}
                            onSelectSection={handleSelectSection}
                            onCloseDrawer={handleDrawerClose}
                            tiposDelArea={tiposDelAreaActual}
                            loadingTipos={loadingTipos}
                            user={user}
                            onLogout={logout}
                        />
                    </Drawer>
                </Box>
                {/* Contenido Principal */}
                <Box component="main" sx={{
                    flexGrow: 1,
                    p: { xs: 1.5, sm: 2, md: 3 },
                    width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
                    display: 'flex',
                    flexDirection: 'column',
                    mt: `${APP_BAR_HEIGHT}px`,
                    height: `calc(100vh - ${APP_BAR_HEIGHT}px)` ,
                    overflow: 'hidden',
                    bgcolor: 'background.default',
                    transition: theme.transitions.create('padding', { duration: theme.transitions.duration.short })
                }}>
                    {renderMainContent()}
                </Box>
                {/* --- Modal --- */}
                {modalRespuestaOpen && user?.rut && solicitudParaResponder && ( <RespuestaModalForm open={modalRespuestaOpen} onClose={handleCloseRespuestaModal} solicitudOriginal={solicitudParaResponder} onSubmit={handleEnviarRespuesta} isSubmitting={isSubmittingRespuesta} submitError={submitRespuestaError} currentUserRut={user.rut} /> )}
                {/* --- Modal de solo lectura para solicitudes resueltas --- */}
                {modalVerRespuestaOpen && solicitudVerDetalle && (
                    <VerRespuestaModal
                        open={modalVerRespuestaOpen}
                        onClose={() => setModalVerRespuestaOpen(false)}
                        solicitudOriginal={solicitudVerDetalle}
                        respuesta={respuestaDetalle}
                    />
                )}
            </Box>
            <React.Fragment>
                {console.log('%c[DEBUG] Estado actual de allSolicitudes:', 'color: orange;', allSolicitudes)}
                {console.log('%c[DEBUG] currentSection:', 'color: orange;', currentSection)}
                {console.log('%c[DEBUG] filteredAndSortedData:', 'color: orange;', filteredAndSortedData)}
                {console.log('%c[DEBUG] paginatedData:', 'color: orange;', paginatedData)}
            </React.Fragment>
        </ThemeProvider>
    );
}

Funcionario.propTypes = {
    mode: PropTypes.oneOf(['light', 'dark']),
    toggleTheme: PropTypes.func,
};


export default Funcionario;