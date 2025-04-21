// frontend/src/components/Vecinos/Vecino.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react"; // Solo una vez
import {
    Box, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Button, CircularProgress, Fade,
    Card, CardContent, CssBaseline, ThemeProvider, Drawer, useMediaQuery,
    TextField, InputAdornment, Tooltip, Alert,
    Accordion, AccordionSummary, AccordionDetails, keyframes,
    FormControl, InputLabel, Select, MenuItem, alpha, Stack
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DescriptionIcon from '@mui/icons-material/Description';
import LabelIcon from '@mui/icons-material/Label';
import AccountBox from '@mui/icons-material/AccountBox';

// Componentes y utilidades locales
import Navbar from "../Navbar";
import { lightTheme, darkTheme } from "../../theme";
// import { mostrarAlertaError, mostrarAlertaExito } from "../../utils/alertUtils"; // Descomentar para alertas
import api from '../../services/api';
// *** 1. IMPORTAR EL MODAL ***
import SolicitudModalForm from './SolicitudModalForm'; // Asume que SolicitudModalForm.jsx está en la misma carpeta
import TableCard from '../common/TableCard';
import Sidebar from '../common/Sidebar';

// --- Constants (Solo una vez) ---
const APP_BAR_HEIGHT = 64;
const DRAWER_WIDTH = 240;
const SECTIONS = {
    MIS_SOLICITUDES: 'mis-solicitudes',
    CONSULTAS: 'consultas',
    PREGUNTAS_FRECUENTES: 'preguntas-frecuentes',
    AREA_PREFIX: 'area-',
};
const DEFAULT_SECTION = null;

// --- Animations (Solo una vez) ---
const fadeInUp = keyframes`
    from { opacity: 0; transform: translate3d(0, 20px, 0); }
    to { opacity: 1; transform: translate3d(0, 0, 0); }
`;

// --- Component (Solo una definición) ---
function Vecino({ toggleTheme: toggleThemeProp }) {
    // Estados (incluyendo los nuevos para el modal)
    const [mode, setMode] = useState("light");
    const [mobileOpen, setMobileOpen] = useState(false);
    const [currentSection, setCurrentSection] = useState(DEFAULT_SECTION);
    const [loading, setLoading] = useState({ initial: true, content: false, form: false }); // Estado de carga para form
    const [error, setError] = useState({ initial: null, content: null, form: null }); // Estado de error para form
    const [searchTerm, setSearchTerm] = useState("");
    const [areas, setAreas] = useState([]);
    const [tiposSolicitudesAll, setTiposSolicitudesAll] = useState([]);
    const [tiposSolicitudesForTable, setTiposSolicitudesForTable] = useState([]);
    const [faqs, setFaqs] = useState([]);
    const [selectedAreaInfo, setSelectedAreaInfo] = useState({ id: null, nombre: null });
    const [faqFilterTipoId, setFaqFilterTipoId] = useState('');
    // Estados para el modal
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTipoForModal, setSelectedTipoForModal] = useState(null);
    // Estados para la paginación
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    // Hooks de Tema y Media Query
    const theme = useMemo(() => (mode === "light" ? lightTheme : darkTheme), [mode]);
    const isLargeScreen = useMediaQuery(theme.breakpoints.up('md'));
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    // --- Handlers (Existentes + Nuevos) ---
    const handleToggleTheme = useCallback(() => { if (typeof toggleThemeProp === 'function') toggleThemeProp(); setMode((prev) => (prev === "light" ? "dark" : "light")); }, [toggleThemeProp]);
    const handleDrawerToggle = useCallback(() => setMobileOpen(prev => !prev), []);
    const handleDrawerClose = useCallback(() => setMobileOpen(false), []);
    const handleSearchChange = useCallback((event) => setSearchTerm(event.target.value), []);
    const handleFaqFilterChange = useCallback((event) => setFaqFilterTipoId(event.target.value), []);
    // Handlers para el Modal
    const handleOpenSolicitudModal = useCallback((tipo) => {
        setSelectedTipoForModal(tipo);
        setModalOpen(true);
        setError(prev => ({ ...prev, form: null }));
    }, []);
    const handleFormSubmit = useCallback(async (formData) => {
        setLoading(prev => ({ ...prev, form: true }));
        setError(prev => ({ ...prev, form: null }));
        try {
            const response = await api.post('/solicitudes', formData, { /* headers opcionales */ });
            console.log("API Response:", response.data);
            // mostrarAlertaExito('Solicitud Enviada', '...');
            setModalOpen(false);
            setSelectedTipoForModal(null);
            // if (currentSection === SECTIONS.MIS_SOLICITUDES) fetchContent(currentSection, areas); // Opcional: refrescar
        } catch (err) {
            console.error("Error submitting solicitud:", err);
            const message = err.response?.data?.message || "Error al enviar la solicitud.";
            // mostrarAlertaError('Error de Envío', message);
            setError(prev => ({...prev, form: message}));
        } finally {
            setLoading(prev => ({ ...prev, form: false }));
        }
    }, []); // Dependencias si refrescas
    // Handlers para la paginación
    const handleChangePage = useCallback((event, newPage) => {
        setPage(newPage);
    }, []);
    const handleChangeRowsPerPage = useCallback((event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    }, []);

    // --- Data Fetching (Sin Cambios) ---
    const fetchContent = useCallback(async (sectionId, currentAreas) => {
        if (!sectionId) { setTiposSolicitudesForTable([]); setFaqs([]); setSelectedAreaInfo({ id: null, nombre: null }); setError(prev => ({ ...prev, content: null })); setLoading(prev => ({ ...prev, content: false })); return; }
        setLoading(prev => ({ ...prev, content: true })); setError(prev => ({ ...prev, content: null })); setTiposSolicitudesForTable([]); setFaqs([]); setSelectedAreaInfo({ id: null, nombre: null });
        try {
            let areaIdForTitle = null; let areaNombreForTitle = null;
            if (sectionId.startsWith(SECTIONS.AREA_PREFIX)) { const areaId = sectionId.substring(SECTIONS.AREA_PREFIX.length); const response = await api.get(`/tipos_solicitudes/area/${areaId}`); const data = response.data ?? []; if (!Array.isArray(data)) throw new Error("Formato de respuesta inesperado (Tipos)."); setTiposSolicitudesForTable(data); const selectedArea = currentAreas.find(a => a.id_area.toString() === areaId.toString()); areaIdForTitle = areaId; areaNombreForTitle = selectedArea?.nombre_area || 'Desconocida'; }
            else if (sectionId === SECTIONS.PREGUNTAS_FRECUENTES) { const response = await api.get('/preguntas_frecuentes'); const data = response.data?.preguntas_frecuentes ?? []; if (!Array.isArray(data)) throw new Error("Formato de respuesta inesperado (FAQs)."); setFaqs(data); setFaqFilterTipoId(''); }
            else if (sectionId === SECTIONS.MIS_SOLICITUDES) { throw new Error("Inicia sesión para ver tus solicitudes."); }
            setSelectedAreaInfo({ id: areaIdForTitle, nombre: areaNombreForTitle });
        } catch (err) { let message = err.message || "Error al cargar contenido."; if (err.response?.data?.message) message = err.response.data.message; if (message !== "Inicia sesión para ver tus solicitudes." && err.response?.status !== 401) { console.error(`Error fetching content for ${sectionId}:`, err); } setError(prev => ({ ...prev, content: message })); }
        finally { setTimeout(() => setLoading(prev => ({ ...prev, content: false })), 200); }
    }, []);
    const fetchBaseData = useCallback(async () => {
        setLoading({ initial: true, content: false }); setError({ initial: null, content: null });
        try { const [areasRes, tiposRes] = await Promise.all([api.get('/areas'), api.get('/tipos_solicitudes')]); setAreas(areasRes.data ?? []); setTiposSolicitudesAll(tiposRes.data ?? []); }
        catch (err) { console.error("Error fetching base data:", err); const message = err.response?.data?.message || "Error al cargar datos iniciales."; setError(prev => ({ ...prev, initial: message })); }
        finally { setLoading(prev => ({ ...prev, initial: false })); }
    }, []);

    // --- Sidebar Selection (Sin Cambios) ---
    const handleSelectSection = useCallback((sectionId) => { if (sectionId !== currentSection) { setCurrentSection(sectionId); setSearchTerm(""); } handleDrawerClose(); }, [currentSection, handleDrawerClose]);

    // --- Effects (Sin Cambios) ---
    useEffect(() => { fetchBaseData(); }, [fetchBaseData]);
    useEffect(() => { if (!loading.initial && !error.initial) fetchContent(currentSection, areas); }, [currentSection, loading.initial, error.initial, areas, fetchContent]);
    useEffect(() => { if (isLargeScreen && mobileOpen) setMobileOpen(false); }, [isLargeScreen, mobileOpen]);

    // --- Filtering (Sin Cambios) ---
    const filteredTiposForTable = useMemo(() => { if (!currentSection?.startsWith(SECTIONS.AREA_PREFIX) || !Array.isArray(tiposSolicitudesForTable)) return []; if (!searchTerm.trim()) return tiposSolicitudesForTable; const lowerSearch = searchTerm.toLowerCase(); return tiposSolicitudesForTable.filter(t => t.nombre_tipo?.toLowerCase().includes(lowerSearch) || t.descripcion?.toLowerCase().includes(lowerSearch)); }, [tiposSolicitudesForTable, searchTerm, currentSection]);
    const filteredFaqs = useMemo(() => { if (currentSection !== SECTIONS.PREGUNTAS_FRECUENTES || !Array.isArray(faqs)) return []; let results = faqs; if (faqFilterTipoId) results = results.filter(f => f.id_tipo === faqFilterTipoId); if (searchTerm.trim()) { const lowerSearch = searchTerm.toLowerCase(); results = results.filter(f => f.pregunta?.toLowerCase().includes(lowerSearch) || f.respuesta?.toLowerCase().includes(lowerSearch) || f.nombre_tipo_solicitud?.toLowerCase().includes(lowerSearch)); } return results; }, [faqs, searchTerm, currentSection, faqFilterTipoId]);

    // --- Memoized Values & Styles (Sin Cambios) ---
    const headerCellStyle = useMemo(() => ({ fontWeight: 'bold', fontSize: '0.9rem', padding: '10px 12px', whiteSpace: 'nowrap', backgroundColor: theme.palette.primary.main, color: theme.palette.primary.contrastText, borderBottom: `2px solid ${theme.palette.divider}`, position: 'sticky', top: 0, zIndex: 1, transition: theme.transitions.create(['background-color', 'color'], { duration: theme.transitions.duration.short }), }), [theme]);
    const bodyCellStyle = useMemo(() => ({ fontSize: '0.875rem', color: theme.palette.text.secondary, verticalAlign: 'middle', padding: '10px 12px', borderBottom: `1px solid ${theme.palette.divider}`, transition: theme.transitions.create(['background-color', 'color'], { duration: theme.transitions.duration.shortest }), }), [theme]);
    const descriptionCellStyle = useMemo(() => ({ ...bodyCellStyle, whiteSpace: 'normal', wordWrap: 'break-word', verticalAlign: 'top', maxWidth: 400, }), [bodyCellStyle]);
    const solicitarButtonStyle = useMemo(() => ({ background: `linear-gradient(45deg, ${theme.palette.success.light || theme.palette.success.main} 30%, ${theme.palette.success.main} 90%)`, boxShadow: theme.shadows[2], borderRadius: '50px', color: theme.palette.success.contrastText, height: '36px', py: 0.8, px: 2.5, textTransform: 'none', fontWeight: 600, fontSize: '0.875rem', transition: theme.transitions.create(['background-color', 'transform', 'box-shadow'], { duration: theme.transitions.duration.short }), '&:hover': { transform: 'translateY(-2px)', boxShadow: theme.shadows[4], background: `linear-gradient(45deg, ${theme.palette.success.main} 30%, ${theme.palette.success.dark || theme.palette.success.main} 90%)`, }, '&:active': { transform: 'translateY(0)', boxShadow: theme.shadows[2] } }), [theme]);

    // --- Title (Sin Cambios) ---
    const getMainTitle = useMemo(() => { if (currentSection?.startsWith(SECTIONS.AREA_PREFIX)) return `Tipos de Solicitud - ${selectedAreaInfo.nombre || '...'}`; switch (currentSection) { case SECTIONS.MIS_SOLICITUDES: return "Mis Solicitudes"; case SECTIONS.CONSULTAS: return "Consultas"; case SECTIONS.PREGUNTAS_FRECUENTES: return "Preguntas Frecuentes"; default: return "Portal Vecino"; } }, [currentSection, selectedAreaInfo.nombre]);

    // --- Render Content Function (CORREGIDA Y CON onClick MODIFICADO) ---
    const renderMainContent = () => {
        // Estados de carga y error (ajustados para no solapar carga de form)
        if (loading.content && !loading.form) {
            return (<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', py: 5, flexGrow: 1, gap: 2 }}> <CircularProgress size={30} /> <Typography sx={{ color: 'text.secondary', fontStyle: 'italic', mt: 1 }}>Cargando contenido...</Typography> </Box>);
        }
        // Manejar error de login (Mis Solicitudes) primero
        if (error.content && currentSection === SECTIONS.MIS_SOLICITUDES) {
            const isLoginError = error.content === "Inicia sesión para ver tus solicitudes.";
            return (<Fade in={true} timeout={400}><Alert severity={isLoginError ? "info" : "error"} sx={{ m: 2, flexShrink: 0, boxShadow: theme.shadows[1], border: `1px solid ${theme.palette[isLoginError ? 'info' : 'error'].dark}`, animation: `${fadeInUp} 0.4s ease-out`, opacity: 0, animationFillMode: 'forwards', justifyContent: 'center' }}>{error.content}</Alert></Fade>);
        }
        // Manejar otros errores de contenido
        if (error.content) {
            return (<Fade in={true} timeout={400}><Alert severity="error" sx={{ m: 2, flexShrink: 0, boxShadow: theme.shadows[1], border: `1px solid ${theme.palette.error.dark}`, animation: `${fadeInUp} 0.4s ease-out`, opacity: 0, animationFillMode: 'forwards', justifyContent: 'center' }}>{error.content}</Alert></Fade>);
        }
        // Mensaje si no hay sección seleccionada
        if (!currentSection) {
            return (<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', textAlign: 'center', color: 'text.secondary', p: 3, animation: `${fadeInUp} 0.5s ease-out forwards`, opacity: 0 }}> <InfoOutlinedIcon sx={{ fontSize: 40, mb: 2, color: 'action.disabled' }}/> <Typography variant="h6" component="p" sx={{ fontStyle: 'italic' }}> Selecciona una sección del menú lateral. </Typography> </Box>);
        }

        // Renderizado específico por sección (asegurarse que solo uno renderice)
        return (
            <Fade in={true} timeout={400} style={{ width: '100%', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>

                    {/* --- CONSULTAS --- */}
                    {currentSection === SECTIONS.CONSULTAS && (
                        <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary', animation: `${fadeInUp} 0.5s ease-out forwards`, opacity: 0, mt: 4 }}>
                            <Typography variant="h6" sx={{ fontStyle: 'italic' }}>Funcionalidad de Consultas próximamente.</Typography>
                        </Box>
                    )}

                    {/* --- TIPOS DE SOLICITUD (por Área) --- */}
                    {currentSection.startsWith(SECTIONS.AREA_PREFIX) && !isSmallScreen && (
                        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <TableCard
                                title={getMainTitle}
                                columns={[
                                    { id: 'nombre_tipo', label: 'Nombre' },
                                    { id: 'descripcion', label: 'Descripción', cellStyle: descriptionCellStyle },
                                ]}
                                rows={filteredTiposForTable.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)}
                                loading={loading.content}
                                error={error.content}
                                searchTerm={searchTerm}
                                onSearchChange={handleSearchChange}
                                renderActions={(tipo) => (
                                    <Button variant="contained" size="small" endIcon={<SendIcon fontSize="inherit" />} sx={solicitarButtonStyle} onClick={() => handleOpenSolicitudModal(tipo)} >Solicitar</Button>
                                )}
                                headerCellStyle={headerCellStyle}
                                bodyCellStyle={bodyCellStyle}
                                minWidth={650}
                                noResultsMsg={searchTerm ? "No se encontraron tipos de solicitud con la búsqueda." : "No hay tipos de solicitud disponibles en esta área."}
                                totalCount={filteredTiposForTable.length}
                                page={page}
                                rowsPerPage={rowsPerPage}
                                onPageChange={handleChangePage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                                sx={{ flexGrow: 1, height: '100%' }}
                            />
                        </Box>
                    )}

                    {currentSection.startsWith(SECTIONS.AREA_PREFIX) && isSmallScreen && (
                        <Box sx={{ animation: `${fadeInUp} 0.5s ease-out forwards`, opacity: 0, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                            {Array.isArray(filteredTiposForTable) && filteredTiposForTable.length > 0 ? (
                                <Box sx={{ flexGrow: 1, overflowY: 'auto', px: { xs: 0, sm: 1 }, pt: 1 }}>
                                    {filteredTiposForTable.map((tipo, index) => (
                                        <Paper key={tipo.id_tipo} sx={{
                                            borderRadius: 2.5,
                                            border: theme => `1.5px solid ${theme.palette.primary.light}`,
                                            boxShadow: theme => theme.shadows[2],
                                            bgcolor: 'background.paper',
                                            p: 2.2,
                                            mb: 2.2,
                                            animation: `${fadeInUp} 0.3s ease-out forwards`,
                                            animationDelay: `${index * 0.04}s`,
                                            opacity: 0,
                                            fontFamily: 'Montserrat, Arial, sans-serif',
                                            '&:last-child': { mb: 0 },
                                        }}>
                                            <Stack spacing={1.5}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                    <LabelIcon fontSize="small" sx={{ color: 'primary.main', mt: '2px' }} />
                                                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main', fontSize: '1.01rem', letterSpacing: 0.1 }}>{tipo.nombre_tipo}</Typography>
                                                </Box>
                                                {tipo.descripcion && (
                                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                                                        <DescriptionIcon fontSize="small" sx={{ color: 'primary.main', mt: '2px' }} />
                                                        <Typography variant="body2" sx={{ whiteSpace: 'normal', color: 'text.secondary', fontSize: '0.97rem' }}>{tipo.descripcion}</Typography>
                                                    </Box>
                                                )}
                                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
                                                    <Button variant="contained" size="small" endIcon={<SendIcon fontSize="inherit" />} sx={solicitarButtonStyle} onClick={() => handleOpenSolicitudModal(tipo)} >Solicitar</Button>
                                                </Box>
                                            </Stack>
                                        </Paper>
                                    ))}
                                </Box>
                            ) : (
                                // Mensaje si no hay datos
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, p: 3 }}>
                                    <Typography sx={{ textAlign: 'center', fontStyle: 'italic', color: 'text.disabled' }}>
                                        {searchTerm ? "No se encontraron tipos de solicitud con la búsqueda." : "No hay tipos de solicitud disponibles en esta área."}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* --- PREGUNTAS FRECUENTES --- */}
                    {currentSection === SECTIONS.PREGUNTAS_FRECUENTES && (
                        <Box sx={{ width: '100%', animation: `${fadeInUp} 0.5s ease-out forwards`, opacity: 0, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                            {/* Filtro Dropdown */}
                            {faqs.length > 0 && (
                                <Fade in={true} timeout={400}>
                                    <FormControl size="small" sx={{ minWidth: 250, alignSelf: 'flex-start', mb: 2 }}>
                                        <InputLabel id="faq-filter-label" sx={{ color: 'text.secondary' }}>Filtrar por Tipo</InputLabel>
                                        <Select
                                            labelId="faq-filter-label" id="faq-filter-select" value={faqFilterTipoId} label="Filtrar por Tipo" onChange={handleFaqFilterChange}
                                            sx={{ borderRadius: 2.5, '.MuiOutlinedInput-notchedOutline': { borderColor: alpha(theme.palette.divider, 0.5) }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main } }}
                                            MenuProps={{ PaperProps: { sx: { bgcolor: 'background.paper', border: `1.5px solid ${theme.palette.primary.light}`, boxShadow: theme.shadows[2], borderRadius: 2.5 } } }} >
                                            <MenuItem value=""><em>Todos los Tipos</em></MenuItem>
                                            {Array.from(new Set(faqs.map(f => f.id_tipo))).map(tipoId => {
                                                const tipoInfo = tiposSolicitudesAll.find(t => t.id_tipo === tipoId);
                                                return tipoInfo ? ( <MenuItem key={tipoId} value={tipoId} sx={{ '&.Mui-selected': { backgroundColor: alpha(theme.palette.primary.main, 0.12), color: theme.palette.primary.main, fontWeight: 500, '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.18), }, }, '&:not(.Mui-selected):hover': { backgroundColor: theme.palette.action.hover, }, transition: theme.transitions.create(['background-color', 'color'], { duration: theme.transitions.duration.shortest }), }}>{tipoInfo.nombre_tipo}</MenuItem> ) : null; })}
                                        </Select>
                                    </FormControl>
                                </Fade>
                            )}
                            {/* Contenedor Scrollable para Acordeones */}
                            <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5 }}>
                                {filteredFaqs.length > 0 ? (
                                    filteredFaqs.map((faq, index) => (
                                        <Accordion key={faq.id_pregunta} sx={{
                                            mb: 1.5,
                                            border: theme => `1.5px solid ${theme.palette.primary.light}`,
                                            borderRadius: 2.5,
                                            boxShadow: theme => theme.shadows[2],
                                            bgcolor: 'background.paper',
                                            transition: theme.transitions.create(['margin', 'background-color', 'border-color']),
                                            '&.Mui-expanded': { mb: 1.5, borderColor: theme => theme.palette.primary.main },
                                            animation: `${fadeInUp} 0.3s ease-out forwards`,
                                            animationDelay: `${index * 0.04}s`,
                                            opacity: 0,
                                            fontFamily: 'Montserrat, Arial, sans-serif',
                                        }} >
                                            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />} aria-controls={`panel${faq.id_pregunta}-content`} id={`panel${faq.id_pregunta}-header`} sx={{ '&:hover': { bgcolor: theme.palette.action.hover }, '& .MuiAccordionSummary-content': { my: 1.2, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }, transition: theme.transitions.create(['background-color']), }} >
                                                <Typography sx={{ fontWeight: 600, color: 'primary.main', flexGrow: 1, flexBasis: { xs: '100%', sm: 'auto' }, mr: 1, mb: { xs: 0.5, sm: 0 }, fontSize: '1.01rem', letterSpacing: 0.1 }}>
                                                    {faq.pregunta}
                                                </Typography>
                                                {faq.nombre_tipo_solicitud && (
                                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic', pl: { xs: 0, sm: 1 }, flexBasis: { xs: '100%', sm: 'auto' }, textAlign: { xs: 'left', sm: 'right' } }} >
                                                        ({faq.nombre_tipo_solicitud})
                                                    </Typography>
                                                )}
                                            </AccordionSummary>
                                            <AccordionDetails sx={{ borderTop: `1px dashed ${theme.palette.divider}`, px: 2.5, py: 2 }}>
                                                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontSize: '0.97rem' }}>{faq.respuesta}</Typography>
                                            </AccordionDetails>
                                        </Accordion>
                                    ))
                                ) : (
                                    <Typography sx={{ textAlign: 'center', py: 5, fontStyle: 'italic', color: 'text.disabled' }}>
                                        {searchTerm || faqFilterTipoId ? "No se encontraron preguntas frecuentes con los filtros aplicados." : "No hay preguntas frecuentes disponibles."}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    )}

                     {/* --- Fallback --- */}
                     {/* Este bloque solo se renderiza si currentSection NO es ninguna de las anteriores */}
                    { currentSection !== SECTIONS.CONSULTAS &&
                        !currentSection?.startsWith(SECTIONS.AREA_PREFIX) &&
                        currentSection !== SECTIONS.PREGUNTAS_FRECUENTES &&
                        currentSection !== SECTIONS.MIS_SOLICITUDES && ( // Excluir MIS_SOLICITUDES ya que se maneja por error
                            <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary', mt: 4 }}>
                                <Typography>Contenido no disponible para esta sección.</Typography>
                            </Box>
                        )
                    }

                </Box>
            </Fade>
        );
    };

    // --- Render Principal (Añadir Modal) ---
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
                {/* Navbar y Drawers (Sin Cambios) */}
                <Navbar toggleTheme={handleToggleTheme} toggleSidebar={handleDrawerToggle} title="Portal Vecino" appBarHeight={APP_BAR_HEIGHT} logoLink="/vecinos" />
                <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
                    <Drawer
                        variant="temporary"
                        open={mobileOpen}
                        onClose={handleDrawerClose}
                        ModalProps={{ keepMounted: true }}
                        sx={{
                            display: { xs: 'block', md: 'none' },
                            '& .MuiDrawer-paper': {
                                boxSizing: 'border-box',
                                width: DRAWER_WIDTH,
                                bgcolor: 'background.paper',
                                borderRight: `1px solid ${theme.palette.divider}`,
                                top: { xs: `${APP_BAR_HEIGHT}px`, md: `${APP_BAR_HEIGHT}px` },
                                height: { xs: `calc(100vh - ${APP_BAR_HEIGHT}px)`, md: `calc(100vh - ${APP_BAR_HEIGHT}px)` },
                                transition: theme.transitions.create('transform', { easing: theme.transitions.easing.sharp, duration: theme.transitions.duration.enteringScreen }),
                                overflowX: 'hidden', // <-- Fix scroll horizontal
                            }
                        }}
                    >
                        <Sidebar
                            panelType="vecino"
                            currentSection={currentSection}
                            onSelectSection={handleSelectSection}
                            onCloseDrawer={handleDrawerClose}
                            areas={areas}
                        />
                    </Drawer>
                    <Drawer variant="permanent" open sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, top: `${APP_BAR_HEIGHT}px`, height: `calc(100vh - ${APP_BAR_HEIGHT}px)`, borderRight: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper', overflowY: 'auto', transition: theme.transitions.create('width', { easing: theme.transitions.easing.sharp, duration: theme.transitions.duration.enteringScreen }), overflowX: 'hidden' } }}>
                        <Sidebar
                            panelType="vecino"
                            currentSection={currentSection}
                            onSelectSection={handleSelectSection}
                            onCloseDrawer={handleDrawerClose}
                            areas={areas}
                        />
                    </Drawer>
                </Box>
                <Box component="main" sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2, md: 3 }, width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` }, display: 'flex', flexDirection: 'column', mt: `${APP_BAR_HEIGHT}px`, height: `calc(100vh - ${APP_BAR_HEIGHT}px)`, overflow: 'hidden', bgcolor: 'background.default', transition: theme.transitions.create('padding', { duration: theme.transitions.duration.short }) }} >
                    {/* Header removido: título, búsqueda y divider */}
                    {/* Indicadores Carga/Error Inicial (Sin Cambios) */}
                    {loading.initial && (<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', py: 5, flexGrow: 1, gap: 1 }}> <CircularProgress /> <Typography sx={{ color: 'text.secondary', fontStyle: 'italic', mt: 1 }}>Cargando datos iniciales...</Typography> </Box> )}
                    {error.initial && !loading.initial && ( <Fade in={true} timeout={500}> <Alert severity="error" sx={{ mb: 2, flexShrink: 0, boxShadow: theme.shadows[1], border: `1px solid ${theme.palette.error.dark}`, animation: `${fadeInUp} 0.4s ease-out`, opacity: 0, animationFillMode: 'forwards' }}>{error.initial}</Alert> </Fade> )}
                    {/* Área Principal Scrollable */}
                    <Box sx={{ flexGrow: 1, overflowY: 'auto', '&::-webkit-scrollbar': { width: '8px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[400], borderRadius: '4px' }, pr: 0.5 }}>
                        {/* Solo renderizar contenido si la carga inicial terminó sin errores */}
                        {!loading.initial && !error.initial && renderMainContent()}
                    </Box>
                </Box>
            </Box>

            {/* *** 4. RENDERIZAR EL MODAL *** */}
            <SolicitudModalForm
                open={modalOpen}
                onClose={() => { setModalOpen(false); setSelectedTipoForModal(null); setError(prev => ({ ...prev, form: null })); }} // Limpiar estado al cerrar
                tipoSeleccionado={selectedTipoForModal} // Pasar el objeto tipo completo
                onSubmit={handleFormSubmit}
                isSubmitting={loading.form} // Pasar estado de carga del form
                submitError={error.form}   // Pasar estado de error del form
            />
        </ThemeProvider>
    );
}

// Export default (Solo una vez)
export default Vecino;