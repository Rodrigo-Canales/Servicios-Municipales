// frontend/src/components/Vecinos/Vecino.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    Box, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Button, CircularProgress, Fade,
    Card, CardContent, CssBaseline, ThemeProvider, Drawer, useMediaQuery,
    TextField, InputAdornment, Tooltip, Alert,
    Accordion, AccordionSummary, AccordionDetails, keyframes,
    FormControl, InputLabel, Select, MenuItem
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Componentes y utilidades locales
import Navbar from "../Navbar"; // Asegúrate que la ruta sea correcta
import SidebarVecino from "./SidebarVecino"; // Asegúrate que la ruta sea correcta
import { lightTheme, darkTheme } from "../../theme"; // Asegúrate que la ruta sea correcta
// Descomenta si implementas manejo de errores con alertas visuales
// import { mostrarAlertaError } from "../../utils/alertUtils";
import api from '../../services/api'; // Asegúrate que la ruta sea correcta

// --- Alpha Helper ---
// Función para aplicar transparencia a colores del tema
function alphaHelper(color, opacity) {
    if (!color || typeof color !== 'string') return 'rgba(0,0,0,0)';
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (match) { return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${opacity})`; }
    const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (hexMatch) { const r = parseInt(hexMatch[1], 16); const g = parseInt(hexMatch[2], 16); const b = parseInt(hexMatch[3], 16); return `rgba(${r}, ${g}, ${b}, ${opacity})`; }
    const hexAlphaMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (hexAlphaMatch) { const r = parseInt(hexAlphaMatch[1], 16); const g = parseInt(hexAlphaMatch[2], 16); const b = parseInt(hexAlphaMatch[3], 16); return `rgba(${r}, ${g}, ${b}, ${opacity})`; }
    return color;
}

// --- Constants ---
const APP_BAR_HEIGHT = 64;
const DRAWER_WIDTH = 240;
const SECTIONS = {
    MIS_SOLICITUDES: 'mis-solicitudes',
    CONSULTAS: 'consultas',
    PREGUNTAS_FRECUENTES: 'preguntas-frecuentes',
    AREA_PREFIX: 'area-',
};
const DEFAULT_SECTION = null; // Iniciar sin sección seleccionada

// --- Animations ---
const fadeInUp = keyframes`
  from { opacity: 0; transform: translate3d(0, 20px, 0); }
  to { opacity: 1; transform: translate3d(0, 0, 0); }
`;

// --- Component ---
function Vecino({ toggleTheme: toggleThemeProp }) {
    // Estado del componente
    const [mode, setMode] = useState("light");
    const [mobileOpen, setMobileOpen] = useState(false);
    const [currentSection, setCurrentSection] = useState(DEFAULT_SECTION);
    const [loading, setLoading] = useState({ initial: true, content: false });
    const [error, setError] = useState({ initial: null, content: null });
    const [searchTerm, setSearchTerm] = useState("");
    const [areas, setAreas] = useState([]);
    const [tiposSolicitudesAll, setTiposSolicitudesAll] = useState([]); // Para filtro FAQ
    const [tiposSolicitudesForTable, setTiposSolicitudesForTable] = useState([]); // Para tabla principal
    const [faqs, setFaqs] = useState([]);
    const [selectedAreaInfo, setSelectedAreaInfo] = useState({ id: null, nombre: null });
    const [faqFilterTipoId, setFaqFilterTipoId] = useState('');

    // --- Theme & Media Queries ---
    const currentTheme = useMemo(() => (mode === "light" ? lightTheme : darkTheme), [mode]);
    const isLargeScreen = useMediaQuery(currentTheme.breakpoints.up('md'));
    const isSmallScreen = useMediaQuery(currentTheme.breakpoints.down('sm'));

    // --- Handlers ---
    const handleToggleTheme = useCallback(() => {
        if (typeof toggleThemeProp === 'function') {
            toggleThemeProp();
        }
        setMode((prev) => (prev === "light" ? "dark" : "light"));
    }, [toggleThemeProp]);

    const handleDrawerToggle = useCallback(() => setMobileOpen(prev => !prev), []);
    const handleDrawerClose = useCallback(() => setMobileOpen(false), []);
    const handleSearchChange = useCallback((event) => setSearchTerm(event.target.value), []);
    const handleFaqFilterChange = useCallback((event) => setFaqFilterTipoId(event.target.value), []);

    // --- Data Fetching ---
    // Función para obtener contenido específico de la sección seleccionada
    const fetchContent = useCallback(async (sectionId, currentAreas) => {
        if (!sectionId || error.initial) {
            console.log(`Skipping content fetch: sectionId is ${sectionId}, initialError is ${!!error.initial}`);
            if (!sectionId) { // Limpiar si no hay sección
                 setTiposSolicitudesForTable([]); setFaqs([]);
                 setSelectedAreaInfo({ id: null, nombre: null });
                 setError(prev => ({ ...prev, content: null }));
            }
            setLoading(prev => ({ ...prev, content: false }));
            return;
        }

       setLoading(prev => ({ ...prev, content: true }));
       setError(prev => ({ ...prev, content: null }));
       setTiposSolicitudesForTable([]); setFaqs([]);
       setSelectedAreaInfo({ id: null, nombre: null });
       console.log(`[fetchContent] Attempting to fetch for: ${sectionId}`);

       try {
           let areaIdForTitle = null;
           let areaNombreForTitle = null;

           if (sectionId.startsWith(SECTIONS.AREA_PREFIX)) {
               const areaId = sectionId.substring(SECTIONS.AREA_PREFIX.length);
               if (areaId) {
                   const response = await api.get(`/tipos_solicitudes/area/${areaId}`);
                   const data = response.data || [];
                   if (!Array.isArray(data)) throw new Error("Formato de respuesta inesperado (Tipos).");
                   setTiposSolicitudesForTable(data);
                   const selectedArea = currentAreas.find(a => a.id_area.toString() === areaId.toString());
                   areaIdForTitle = areaId;
                   areaNombreForTitle = selectedArea?.nombre_area || 'Desconocida';
               }
           } else if (sectionId === SECTIONS.PREGUNTAS_FRECUENTES) {
               const response = await api.get('/preguntas_frecuentes');
                const data = response.data?.preguntas_frecuentes || [];
                if (!Array.isArray(data)) throw new Error("Formato de respuesta inesperado (FAQs).");
               setFaqs(data);
               setFaqFilterTipoId('');
           } else if (sectionId === SECTIONS.MIS_SOLICITUDES) {
                setError(prev => ({ ...prev, content: "Inicia sesión para ver tus solicitudes." }));
           }
           // No fetch for CONSULTAS

           setSelectedAreaInfo({ id: areaIdForTitle, nombre: areaNombreForTitle });

       } catch (err) {
            let message = err.message || "Error al cargar contenido.";
            if (err.response?.status !== 401) {
               message = err.response?.data?.message || `Error cargando ${sectionId} (${err.message})`;
               // Solo establecer error de contenido si no es el mensaje esperado de "inicia sesión"
               if (!(sectionId === SECTIONS.MIS_SOLICITUDES && message === "Inicia sesión para ver tus solicitudes.")){
                   setError(prev => ({ ...prev, content: message }));
                   // Opcional: mostrarAlertaError('Error', message);
               }
            }
            console.error(`Error fetching content for ${sectionId}:`, err); // Log completo del error
       } finally {
           setTimeout(() => setLoading(prev => ({ ...prev, content: false })), 200);
       }

    }, [error.initial]); // Solo depende del error inicial


    // Función para obtener datos base (Areas y TODOS los Tipos para el filtro)
    const fetchBaseData = useCallback(async () => {
        console.log("Fetching base data...");
        setLoading({ initial: true, content: false });
        setError({ initial: null, content: null });
        try {
            const [areasRes, tiposRes] = await Promise.all([
                api.get('/areas'),
                api.get('/tipos_solicitudes') // Fetch all types for FAQ filter
            ]);
            setAreas(areasRes.data || []);
            setTiposSolicitudesAll(tiposRes.data || []);
            console.log("Base data fetched successfully.");
        } catch (err) {
            console.error("Error fetching base data:", err);
            const message = err.response?.data?.message || "Error al cargar datos iniciales.";
            setError(prev => ({ ...prev, initial: message }));
            // Opcional: mostrarAlertaError('Error de Carga Inicial', message);
        } finally {
             setLoading(prev => ({ ...prev, initial: false }));
             console.log("Initial loading finished.");
        }
    }, []); // Sin dependencias, solo se crea una vez


    // --- Sidebar Selection ---
    const handleSelectSection = useCallback((sectionId) => {
        if (sectionId !== currentSection) {
            console.log("Section selected:", sectionId);
            setCurrentSection(sectionId); // Actualiza la sección
            setSearchTerm(""); // Limpia búsqueda
            // fetchContent será llamado por el useEffect que observa currentSection
        }
        handleDrawerClose(); // Cierra drawer en móvil independientemente
    }, [currentSection, handleDrawerClose]); // Dependencias estables

    // --- Effects ---
    // 1. Fetch Base Data on Mount
    useEffect(() => {
        fetchBaseData();
    }, [fetchBaseData]); // fetchBaseData es estable

     // 2. Fetch Specific Content when section changes (and base data is ready)
     useEffect(() => {
         // Solo proceder si la carga inicial terminó sin errores Y hay una sección seleccionada
         if (!loading.initial && !error.initial && currentSection) {
              console.log(`useEffect[currentSection]: Section changed to ${currentSection}. Fetching content...`);
              // Pasar los datos base actuales a fetchContent
              fetchContent(currentSection, areas); // tiposSolicitudesAll ya no es necesario aquí
         } else if (!loading.initial && !error.initial && !currentSection) {
             // Si carga inicial OK pero no hay sección, limpiar estados de contenido
             setTiposSolicitudesForTable([]);
             setFaqs([]);
             setSelectedAreaInfo({ id: null, nombre: null });
             setError(prev => ({ ...prev, content: null }));
             setLoading(prev => ({ ...prev, content: false })); // Asegurar estado de carga
             console.log(`useEffect[currentSection]: No section selected, clearing content states.`);
         }
     // Depender de cambios en la sección Y de que los datos base necesarios estén listos
     // y del estado de carga/error inicial.
     }, [currentSection, loading.initial, error.initial, areas, fetchContent]); // fetchContent es estable


    // 3. Close Drawer on Large Screen
    useEffect(() => { if (isLargeScreen) setMobileOpen(false); }, [isLargeScreen]);

    // --- Filtering ---
    const filteredTiposForTable = useMemo(() => {
         if (!currentSection || !currentSection.startsWith(SECTIONS.AREA_PREFIX)) return [];
         if (!Array.isArray(tiposSolicitudesForTable)) return [];
         if (!searchTerm.trim()) return tiposSolicitudesForTable;
         const lowerSearch = searchTerm.toLowerCase();
         return tiposSolicitudesForTable.filter(t =>
             (t.nombre_tipo?.toLowerCase().includes(lowerSearch)) ||
             (t.descripcion?.toLowerCase().includes(lowerSearch))
         );
    }, [tiposSolicitudesForTable, searchTerm, currentSection]);

    const filteredFaqs = useMemo(() => {
        if (!currentSection || currentSection !== SECTIONS.PREGUNTAS_FRECUENTES || !Array.isArray(faqs)) return [];
        let results = faqs;
        if (faqFilterTipoId) results = results.filter(f => f.id_tipo === faqFilterTipoId);
        if (searchTerm.trim()) {
            const lowerSearch = searchTerm.toLowerCase();
            results = results.filter(f =>
                (f.pregunta?.toLowerCase().includes(lowerSearch)) ||
                (f.respuesta?.toLowerCase().includes(lowerSearch)) ||
                (f.nombre_tipo_solicitud?.toLowerCase().includes(lowerSearch))
            );
        }
        return results;
     }, [faqs, searchTerm, currentSection, faqFilterTipoId]);

    // --- Memoized Values & Styles ---
    // *** CORREGIDO: JSX real dentro de useMemo ***
    const drawerContent = useMemo(() => (
        <SidebarVecino
            areas={areas}
            currentSection={currentSection}
            onSelectSection={handleSelectSection}
            onCloseDrawer={handleDrawerClose}
        />
    ), [areas, currentSection, handleSelectSection, handleDrawerClose]); // Dependencias correctas

    // Estilos de Tabla (Idénticos a Admin)
    const headerCellStyle = useMemo(() => ({
        fontWeight: 'bold', fontSize: '0.9rem', padding: '10px 12px', whiteSpace: 'nowrap',
        backgroundColor: currentTheme.palette.primary.main,
        color: currentTheme.palette.primary.contrastText,
        borderBottom: `2px solid ${currentTheme.palette.divider}`,
        position: 'sticky', top: 0, zIndex: 10,
        transition: currentTheme.transitions.create(['background-color', 'color'], { duration: currentTheme.transitions.duration.short }),
    }), [currentTheme]);

    const bodyCellStyle = useMemo(() => ({
        fontSize: '0.875rem',
        color: currentTheme.palette.text.secondary,
        verticalAlign: 'middle',
        padding: '10px 12px',
        borderBottom: `1px solid ${currentTheme.palette.divider}`,
        transition: currentTheme.transitions.create(['background-color', 'color'], { duration: currentTheme.transitions.duration.shortest }),
    }), [currentTheme]);

    const descriptionCellStyleResponsive = useMemo(() => ({
        ...bodyCellStyle, whiteSpace: 'normal', wordWrap: 'break-word', verticalAlign: 'top'
    }), [bodyCellStyle]);

    // Estilo Botón Solicitar (Basado en Admin 'Agregar', colores success)
    const solicitarButtonStyle = useMemo(() => ({
        background: `linear-gradient(45deg, ${currentTheme.palette.success.light || currentTheme.palette.success.main} 30%, ${currentTheme.palette.success.main} 90%)`,
        boxShadow: currentTheme.shadows[2],
        borderRadius: '50px',
        color: currentTheme.palette.success.contrastText,
        height: '36px', // Similar a tamaño 'medium' implícito
        py: 0.8, px: 2.5,
        textTransform: 'none', fontWeight: 600, fontSize: '0.875rem',
        transition: currentTheme.transitions.create(['background-color', 'transform', 'box-shadow'], { duration: currentTheme.transitions.duration.short }),
        '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: currentTheme.shadows[4],
            background: `linear-gradient(45deg, ${currentTheme.palette.success.main} 30%, ${currentTheme.palette.success.dark || currentTheme.palette.success.main} 90%)`,
        },
        '&:active': { transform: 'translateY(0)', boxShadow: currentTheme.shadows[2] }
     }), [currentTheme]);

    // --- Title ---
    const getMainTitle = useMemo(() => {
        if (currentSection && currentSection.startsWith(SECTIONS.AREA_PREFIX)) {
            return `Tipos de Solicitud - ${selectedAreaInfo.nombre || '...'}`;
        }
        if (currentSection === SECTIONS.MIS_SOLICITUDES) return "Mis Solicitudes";
        if (currentSection === SECTIONS.CONSULTAS) return "Consultas";
        if (currentSection === SECTIONS.PREGUNTAS_FRECUENTES) return "Preguntas Frecuentes";
        return "Portal Vecino";
    }, [currentSection, selectedAreaInfo.nombre]);

    // --- Render Content Function ---
    // Función helper para decidir qué renderizar en el área principal
    const renderMainContent = () => {
        // 1. Si está cargando contenido (después de carga inicial)
        if (loading.content) {
            return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, pt: 5 }}><CircularProgress /></Box>;
        }
        // 2. Si hubo error cargando el contenido específico
        if (error.content) {
            return (
                 <Fade in={true} timeout={500}>
                     <Alert
                         severity={error.content === "Inicia sesión con Clave Única para ver tus solicitudes." ? "info" : "error"}
                         sx={{
                             m: 2, flexShrink: 0,
                             boxShadow: currentTheme.shadows[1],
                             border: `1px solid ${error.content === "Inicia sesión con Clave Única para ver tus solicitudes." ? currentTheme.palette.info.dark : currentTheme.palette.error.dark}`,
                             animation: `${fadeInUp} 0.4s ease-out`, opacity: 0, animationFillMode: 'forwards',
                             justifyContent: 'center'
                          }}
                     >
                         {error.content}
                     </Alert>
                  </Fade>
            );
        }
        // 3. Si no hay sección seleccionada (estado inicial post-carga sin errores)
        if (!currentSection) {
            return (
                 <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', textAlign: 'center', color: 'text.secondary', p: 3, animation: `${fadeInUp} 0.5s ease-out forwards`, opacity: 0 }}>
                     <InfoOutlinedIcon sx={{ fontSize: 40, mb: 2 }}/>
                     <Typography variant="h6" component="p" sx={{ fontStyle: 'italic' }}>
                         Selecciona una sección del menú lateral.
                     </Typography>
                 </Box>
            );
        }

        // 4. Renderizar contenido específico de la sección
        // Envolver el contenido específico en Fade + Box para animación uniforme
        return (
            <Fade in={true} timeout={500} style={{ width: '100%' }}>
                <Box>
                    {currentSection === SECTIONS.CONSULTAS && (
                        <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary', animation: `${fadeInUp} 0.5s ease-out forwards`, opacity: 0 }}>
                            <Typography variant="h6" sx={{ fontStyle: 'italic' }}>Funcionalidad de Consultas próximamente.</Typography>
                        </Box>
                    )}

                    {/* Mis Solicitudes ya se maneja por error.content */}

                    {currentSection.startsWith(SECTIONS.AREA_PREFIX) && (
                         <Paper sx={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', border: `1px solid ${currentTheme.palette.divider}`, borderRadius: 1.5, width: '100%', bgcolor: 'background.paper', boxShadow: 'none', animation: `${fadeInUp} 0.5s ease-out forwards`, opacity: 0 }}>
                             <TableContainer sx={{ flexGrow: 1, overflow: 'auto', '&::-webkit-scrollbar': { width: '8px', height: '8px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: currentTheme.palette.mode === 'dark' ? currentTheme.palette.grey[700] : currentTheme.palette.grey[400], borderRadius: '4px' } }}>
                                 <Table stickyHeader size="small">
                                     <TableHead><TableRow>
                                         <TableCell sx={headerCellStyle}>Nombre</TableCell>
                                         <TableCell sx={headerCellStyle}>Descripción</TableCell>
                                         <TableCell sx={{ ...headerCellStyle, textAlign: 'center', width: '130px' }}>Acción</TableCell>
                                     </TableRow></TableHead>
                                     <TableBody>
                                         {Array.isArray(filteredTiposForTable) && filteredTiposForTable.length > 0 ? (
                                             filteredTiposForTable.map((tipo, index) => (
                                                 <TableRow hover key={tipo.id_tipo} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: currentTheme.palette.action.hover }, transition: currentTheme.transitions.create('background-color', { duration: currentTheme.transitions.duration.shortest }), animation: `${fadeInUp} 0.3s ease-out forwards`, animationDelay: `${index * 0.03}s`, opacity: 0 }}>
                                                     <TableCell sx={bodyCellStyle}>{tipo.nombre_tipo}</TableCell>
                                                     <Tooltip title={tipo.descripcion || ''}><TableCell sx={descriptionCellStyleResponsive}>{tipo.descripcion || '-'}</TableCell></Tooltip>
                                                     <TableCell sx={{ ...bodyCellStyle, textAlign: 'center' }}><Button variant="contained" size="small" endIcon={<SendIcon fontSize="inherit" />} sx={solicitarButtonStyle} >Solicitar</Button></TableCell>
                                                 </TableRow>
                                             ))
                                         ) : ( <TableRow><TableCell colSpan={3} align="center" sx={{ py: 5, fontStyle: 'italic', color: 'text.disabled', borderBottom: 'none' }}>
                                             {searchTerm ? "No se encontraron tipos de solicitud." : "No hay tipos de solicitud para mostrar en esta área."}
                                             </TableCell></TableRow>
                                         )}
                                     </TableBody>
                                 </Table>
                             </TableContainer>
                         </Paper>
                    )}

                    {currentSection === SECTIONS.PREGUNTAS_FRECUENTES && (
                         <Box sx={{ width: '100%', animation: `${fadeInUp} 0.5s ease-out forwards`, opacity: 0 }}>
                            {filteredFaqs.length > 0 ? (
                                filteredFaqs.map((faq, index) => (
                                    <Accordion key={faq.id_pregunta} sx={{ mb: 1, '&:before': { display: 'none' }, border: `1px solid ${currentTheme.palette.divider}`, borderRadius: 1.5, boxShadow: 'none', '&.Mui-expanded': { mb: 1, bgcolor: alphaHelper(currentTheme.palette.action.selected, 0.3) }, bgcolor: 'background.paper', animation: `${fadeInUp} 0.3s ease-out forwards`, animationDelay: `${index * 0.04}s`, opacity: 0 }}>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />} aria-controls={`panel${faq.id_pregunta}-content`} id={`panel${faq.id_pregunta}-header`} sx={{ '&:hover': { bgcolor: alphaHelper(currentTheme.palette.action.hover, 0.6) }, '& .MuiAccordionSummary-content': { my: 1 } }} >
                                            <Typography sx={{ fontWeight: 500, color: 'text.primary' }}>{faq.pregunta}</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ bgcolor: 'transparent', borderTop: `1px dashed ${currentTheme.palette.divider}`, px: 2.5, py: 2 }}>
                                            <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}> {faq.respuesta} </Typography>
                                        </AccordionDetails>
                                    </Accordion>
                                ))
                            ) : ( <Typography sx={{ textAlign: 'center', py: 5, fontStyle: 'italic', color: 'text.disabled' }}>
                                {searchTerm || faqFilterTipoId ? "No se encontraron preguntas frecuentes con los filtros aplicados." : "No hay preguntas frecuentes disponibles."}
                                </Typography>
                            )}
                        </Box>
                    )}
                </Box>
            </Fade>
        );
    };

    // --- Render Principal ---
    return (
        <ThemeProvider theme={currentTheme}>
            <CssBaseline />
            <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
                <Navbar toggleTheme={handleToggleTheme} toggleSidebar={handleDrawerToggle} title="Portal Vecino" appBarHeight={APP_BAR_HEIGHT} logoLink="/vecinos" />
                <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
                    {/* Drawers con estilos Admin */}
                    <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerClose} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, bgcolor: 'background.paper', borderRight: `1px solid ${currentTheme.palette.divider}`, transition: currentTheme.transitions.create('transform', { easing: currentTheme.transitions.easing.sharp, duration: currentTheme.transitions.duration.enteringScreen }) } }}>{drawerContent}</Drawer>
                    <Drawer variant="permanent" open sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, top: `${APP_BAR_HEIGHT}px`, height: `calc(100vh - ${APP_BAR_HEIGHT}px)`, borderRight: `1px solid ${currentTheme.palette.divider}`, bgcolor: 'background.paper', overflowY: 'auto', transition: currentTheme.transitions.create('width', { easing: currentTheme.transitions.easing.sharp, duration: currentTheme.transitions.duration.enteringScreen }) } }}>{drawerContent}</Drawer>
                </Box>

                <Box component="main" sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2, md: 3 }, width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` }, display: 'flex', flexDirection: 'column', mt: `${APP_BAR_HEIGHT}px`, height: `calc(100vh - ${APP_BAR_HEIGHT}px)`, overflow: 'hidden', bgcolor: 'background.default', transition: currentTheme.transitions.create('padding', { duration: currentTheme.transitions.duration.short }) }} >
                    {/* Card principal con sombra y transición Admin */}
                    <Card sx={{ width: '100%', flexGrow: 1, borderRadius: 2, boxShadow: currentTheme.shadows[4], display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'background.paper', transition: currentTheme.transitions.create(['box-shadow', 'background-color'], { duration: currentTheme.transitions.duration.short }) }}>
                        <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 }, display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden', gap: 2 }}>
                             {/* Header con estilo Admin */}
                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, flexShrink: 0, borderBottom: `1px solid ${currentTheme.palette.divider}`, pb: 2 }}>
                                <Typography variant={isSmallScreen ? 'h6' : (isLargeScreen ? 'h4' : 'h5')} component="h1" sx={{ fontWeight: "bold", color: 'text.primary', order: 1, mr: 'auto', animation: `${fadeInUp} 0.5s ease-out`, animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}>
                                    {getMainTitle}
                                </Typography>
                                {/* Search Bar con estilo Admin */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'nowrap', order: 2, ml: { xs: 0, sm: 2 } }}>
                                    {currentSection && (currentSection.startsWith(SECTIONS.AREA_PREFIX) || currentSection === SECTIONS.PREGUNTAS_FRECUENTES) && !(loading.initial || loading.content) && (
                                        <Fade in={true} timeout={400}>
                                            <TextField
                                                size="small" variant="outlined" placeholder="Buscar..." value={searchTerm} onChange={handleSearchChange}
                                                sx={{ width: { xs: '150px', sm: 200, md: 250 }, transition: currentTheme.transitions.create(['width', 'box-shadow', 'border-color']), '& .MuiOutlinedInput-root': { borderRadius: '50px', backgroundColor: alphaHelper(currentTheme.palette.action.hover, 0.8), '& fieldset': { borderColor: 'transparent' }, '&:hover fieldset': { borderColor: currentTheme.palette.divider }, '&.Mui-focused fieldset': { borderColor: currentTheme.palette.primary.main, borderWidth: '1px' } }, '& .MuiInputAdornment-root': { color: currentTheme.palette.text.secondary } }}
                                                InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>) }}
                                            />
                                        </Fade>
                                    )}
                                </Box>
                             </Box>

                            {/* FAQ Filter */}
                             {currentSection === SECTIONS.PREGUNTAS_FRECUENTES && !(loading.initial || loading.content) && !error.content && faqs.length > 0 && (
                                 <Fade in={true} timeout={400}>
                                       <FormControl size="small" sx={{ minWidth: 250, alignSelf: 'flex-start', mb: 1 }}>
                                         <InputLabel id="faq-filter-label" sx={{ color: 'text.secondary' }}>Filtrar por Tipo</InputLabel>
                                         <Select
                                             labelId="faq-filter-label" id="faq-filter-select" value={faqFilterTipoId} label="Filtrar por Tipo" onChange={handleFaqFilterChange}
                                             sx={{ borderRadius: 1.5, bgcolor: 'action.hover', '.MuiOutlinedInput-notchedOutline': { borderColor: alphaHelper(currentTheme.palette.divider, 0.5) }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: currentTheme.palette.divider } }}
                                         >
                                             <MenuItem value=""><em>Todos los Tipos</em></MenuItem>
                                             {Array.from(new Set(faqs.map(f => f.id_tipo)))
                                                  .map(tipoId => { const tipoInfo = tiposSolicitudesAll.find(t => t.id_tipo === tipoId); return tipoInfo ? ( <MenuItem key={tipoId} value={tipoId}>{tipoInfo.nombre_tipo}</MenuItem> ) : null; })}
                                         </Select>
                                     </FormControl>
                                 </Fade>
                             )}

                             {/* Loading / Initial Error Indicators con estilo Admin */}
                             {(loading.initial) && <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', my: 5, flexGrow: 1, gap: 2 }}> <CircularProgress /> <Typography sx={{ color: 'text.secondary', fontStyle: 'italic' }}>Cargando datos iniciales...</Typography> </Box> }
                             {error.initial && !loading.initial &&
                                <Fade in={true} timeout={500}>
                                     <Alert severity="error" sx={{ mb: 2, flexShrink: 0, boxShadow: currentTheme.shadows[1], border: `1px solid ${currentTheme.palette.error.dark}`, animation: `${fadeInUp} 0.4s ease-out`, opacity: 0, animationFillMode: 'forwards' }}>{error.initial}</Alert>
                                </Fade>
                             }

                            {/* Área Principal Desplazable con estilos Admin */}
                            <Box sx={{ flexGrow: 1, overflowY: 'auto', '&::-webkit-scrollbar': { width: '8px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: currentTheme.palette.mode === 'dark' ? currentTheme.palette.grey[700] : currentTheme.palette.grey[400], borderRadius: '4px' }, pr: 0.5 }}>
                                {/* Usar la función helper para decidir qué renderizar */}
                                {!loading.initial && !error.initial && renderMainContent()}
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            </Box>
        </ThemeProvider>
    );
}

export default Vecino;