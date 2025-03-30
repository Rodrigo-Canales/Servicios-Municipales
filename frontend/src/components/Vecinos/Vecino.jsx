// frontend/src/components/Vecinos/Vecino.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    Box, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Button, CircularProgress, Fade,
    Card, CardContent, CssBaseline, ThemeProvider, Drawer, useMediaQuery,
    TextField, InputAdornment, Tooltip, Alert,
    Accordion, AccordionSummary, AccordionDetails, keyframes,
    FormControl, InputLabel, Select, MenuItem, alpha // Import alpha from MUI
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
    // Usamos el tema interno para acceder a sus valores fácilmente
    const theme = useMemo(() => (mode === "light" ? lightTheme : darkTheme), [mode]);
    const isLargeScreen = useMediaQuery(theme.breakpoints.up('md'));
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

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
        // Si no hay sección, limpiamos y salimos (el useEffect ya previene la llamada si hay error inicial)
        if (!sectionId) {
            setTiposSolicitudesForTable([]);
            setFaqs([]);
            setSelectedAreaInfo({ id: null, nombre: null });
            setError(prev => ({ ...prev, content: null }));
            setLoading(prev => ({ ...prev, content: false }));
            return;
        }

        setLoading(prev => ({ ...prev, content: true }));
        setError(prev => ({ ...prev, content: null }));
        // Limpiamos estados específicos antes de la nueva carga
        setTiposSolicitudesForTable([]);
        setFaqs([]);
        setSelectedAreaInfo({ id: null, nombre: null });
        console.log(`[fetchContent] Attempting to fetch for: ${sectionId}`);

        try {
            let areaIdForTitle = null;
            let areaNombreForTitle = null;

            if (sectionId.startsWith(SECTIONS.AREA_PREFIX)) {
                const areaId = sectionId.substring(SECTIONS.AREA_PREFIX.length);
                const response = await api.get(`/tipos_solicitudes/area/${areaId}`);
                const data = response.data ?? []; // Usar ?? para fallback seguro
                if (!Array.isArray(data)) throw new Error("Formato de respuesta inesperado (Tipos).");
                setTiposSolicitudesForTable(data);
                const selectedArea = currentAreas.find(a => a.id_area.toString() === areaId.toString());
                areaIdForTitle = areaId;
                areaNombreForTitle = selectedArea?.nombre_area || 'Desconocida';

            } else if (sectionId === SECTIONS.PREGUNTAS_FRECUENTES) {
                const response = await api.get('/preguntas_frecuentes');
                const data = response.data?.preguntas_frecuentes ?? []; // Usar ??
                if (!Array.isArray(data)) throw new Error("Formato de respuesta inesperado (FAQs).");
                setFaqs(data);
                setFaqFilterTipoId(''); // Resetear filtro al cargar FAQs

            } else if (sectionId === SECTIONS.MIS_SOLICITUDES) {
                // Lanza un error controlado que será capturado abajo
                throw new Error("Inicia sesión para ver tus solicitudes.");
            }
            // No hay fetch explícito para CONSULTAS, se maneja en renderMainContent

            setSelectedAreaInfo({ id: areaIdForTitle, nombre: areaNombreForTitle });

        } catch (err) {
            let message = err.message || "Error al cargar contenido.";
            // Si la API devuelve un mensaje específico, usarlo
            if (err.response?.data?.message) {
                message = err.response.data.message;
            }
            // Diferenciar el mensaje de "inicia sesión"
            if (message !== "Inicia sesión para ver tus solicitudes." && err.response?.status !== 401) {
                console.error(`Error fetching content for ${sectionId}:`, err);
                // Opcional: mostrarAlertaError('Error de Carga', message);
            }
            setError(prev => ({ ...prev, content: message }));

        } finally {
            // Pequeño delay para suavizar la transición visual
            setTimeout(() => setLoading(prev => ({ ...prev, content: false })), 200);
        }
    }, []); // No necesita dependencias externas que cambien una vez montado (api, SECTIONS son constantes)

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
            // Usar Nullish Coalescing Operator (??) para asegurar arrays vacíos si no hay data
            setAreas(areasRes.data ?? []);
            setTiposSolicitudesAll(tiposRes.data ?? []);
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
            setSearchTerm(""); // Limpia búsqueda al cambiar de sección
            // fetchContent será llamado por el useEffect que observa currentSection
        }
        handleDrawerClose(); // Cierra drawer en móvil
    }, [currentSection, handleDrawerClose]);

    // --- Effects ---
    // 1. Fetch Base Data on Mount
    useEffect(() => {
        fetchBaseData();
    }, [fetchBaseData]);

    // 2. Fetch Specific Content when section changes (and base data is ready)
    useEffect(() => {
        // Solo proceder si la carga inicial terminó sin errores
        if (!loading.initial && !error.initial) {
            console.log(`useEffect[currentSection]: Section changed to ${currentSection || 'null'}. Fetching content...`);
            // Llamar a fetchContent, pasándole la sección actual y las áreas ya cargadas.
            // fetchContent manejará internamente el caso de sectionId nulo.
            fetchContent(currentSection, areas);
        }
    // Depender de cambios en la sección, estado de carga/error inicial, y las áreas base.
    // fetchContent es estable gracias a useCallback.
    }, [currentSection, loading.initial, error.initial, areas, fetchContent]);


    // 3. Close Drawer on Large Screen resize
    useEffect(() => {
        if (isLargeScreen && mobileOpen) {
            setMobileOpen(false);
        }
    }, [isLargeScreen, mobileOpen]);

    // --- Filtering ---
    const filteredTiposForTable = useMemo(() => {
        // Asegurar que siempre devolvemos un array
        if (!currentSection?.startsWith(SECTIONS.AREA_PREFIX) || !Array.isArray(tiposSolicitudesForTable)) {
            return [];
        }
        if (!searchTerm.trim()) return tiposSolicitudesForTable;
        const lowerSearch = searchTerm.toLowerCase();
        return tiposSolicitudesForTable.filter(t =>
            t.nombre_tipo?.toLowerCase().includes(lowerSearch) ||
            t.descripcion?.toLowerCase().includes(lowerSearch)
        );
    }, [tiposSolicitudesForTable, searchTerm, currentSection]);

    const filteredFaqs = useMemo(() => {
        // Asegurar que siempre devolvemos un array
        if (currentSection !== SECTIONS.PREGUNTAS_FRECUENTES || !Array.isArray(faqs)) {
             return [];
        }
        let results = faqs;
        // Filtrar por tipo si hay uno seleccionado
        if (faqFilterTipoId) {
            results = results.filter(f => f.id_tipo === faqFilterTipoId);
        }
        // Filtrar por término de búsqueda si existe
        if (searchTerm.trim()) {
            const lowerSearch = searchTerm.toLowerCase();
            results = results.filter(f =>
                f.pregunta?.toLowerCase().includes(lowerSearch) ||
                f.respuesta?.toLowerCase().includes(lowerSearch) ||
                f.nombre_tipo_solicitud?.toLowerCase().includes(lowerSearch) // Asumiendo que viene del backend
            );
        }
        return results;
    }, [faqs, searchTerm, currentSection, faqFilterTipoId]);

    // --- Memoized Values & Styles ---
    const drawerContent = useMemo(() => (
        <SidebarVecino
            areas={areas}
            currentSection={currentSection}
            onSelectSection={handleSelectSection}
            onCloseDrawer={handleDrawerClose} // Pasa la función para cerrar el drawer desde Sidebar
        />
    ), [areas, currentSection, handleSelectSection, handleDrawerClose]);

    const headerCellStyle = useMemo(() => ({
        fontWeight: 'bold', fontSize: '0.9rem', padding: '10px 12px', whiteSpace: 'nowrap',
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        borderBottom: `2px solid ${theme.palette.divider}`,
        position: 'sticky', top: 0, zIndex: 1, // Reducir zIndex si no solapa otros elementos sticky
        transition: theme.transitions.create(['background-color', 'color'], { duration: theme.transitions.duration.short }),
    }), [theme]);

    const bodyCellStyle = useMemo(() => ({
        fontSize: '0.875rem',
        color: theme.palette.text.secondary,
        verticalAlign: 'middle',
        padding: '10px 12px',
        borderBottom: `1px solid ${theme.palette.divider}`,
        transition: theme.transitions.create(['background-color', 'color'], { duration: theme.transitions.duration.shortest }),
    }), [theme]);

    const descriptionCellStyleResponsive = useMemo(() => ({
        ...bodyCellStyle, whiteSpace: 'normal', wordWrap: 'break-word', verticalAlign: 'top'
    }), [bodyCellStyle]);

    const solicitarButtonStyle = useMemo(() => ({
        // Usar colores directamente del tema
        background: `linear-gradient(45deg, ${theme.palette.success.light || theme.palette.success.main} 30%, ${theme.palette.success.main} 90%)`,
        boxShadow: theme.shadows[2],
        borderRadius: '50px',
        color: theme.palette.success.contrastText,
        height: '36px',
        py: 0.8, px: 2.5,
        textTransform: 'none', fontWeight: 600, fontSize: '0.875rem',
        transition: theme.transitions.create(['background-color', 'transform', 'box-shadow'], { duration: theme.transitions.duration.short }),
        '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[4],
            background: `linear-gradient(45deg, ${theme.palette.success.main} 30%, ${theme.palette.success.dark || theme.palette.success.main} 90%)`,
        },
        '&:active': { transform: 'translateY(0)', boxShadow: theme.shadows[2] }
     }), [theme]);

    // --- Title ---
    const getMainTitle = useMemo(() => {
        if (currentSection?.startsWith(SECTIONS.AREA_PREFIX)) {
            return `Tipos de Solicitud - ${selectedAreaInfo.nombre || '...'}`;
        }
        // Usar un switch para mayor claridad
        switch (currentSection) {
            case SECTIONS.MIS_SOLICITUDES: return "Mis Solicitudes";
            case SECTIONS.CONSULTAS: return "Consultas";
            case SECTIONS.PREGUNTAS_FRECUENTES: return "Preguntas Frecuentes";
            default: return "Portal Vecino"; // Título por defecto o inicial
        }
    }, [currentSection, selectedAreaInfo.nombre]);

    // --- Render Content Function ---
    const renderMainContent = () => {
        // 1. Carga de contenido específico
        if (loading.content) {
            return (
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', py: 5, flexGrow: 1, gap: 2 }}>
                    <CircularProgress size={30} />
                    <Typography sx={{ color: 'text.secondary', fontStyle: 'italic', mt: 1 }}>Cargando contenido...</Typography>
                </Box>
            );
        }
        // 2. Error de contenido específico
        if (error.content) {
            const isLoginError = error.content === "Inicia sesión para ver tus solicitudes.";
            return (
                <Fade in={true} timeout={400}>
                    <Alert
                        severity={isLoginError ? "info" : "error"}
                        sx={{
                            m: 2, flexShrink: 0, boxShadow: theme.shadows[1],
                            border: `1px solid ${theme.palette[isLoginError ? 'info' : 'error'].dark}`,
                            animation: `${fadeInUp} 0.4s ease-out`,
                            opacity: 0, animationFillMode: 'forwards',
                            justifyContent: 'center'
                        }}
                    >
                        {error.content}
                         {/* Podrías añadir un botón de Login aquí si es isLoginError */}
                    </Alert>
                </Fade>
            );
        }
        // 3. Estado inicial o sin sección seleccionada (después de carga inicial OK)
        if (!currentSection) {
            return (
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', textAlign: 'center', color: 'text.secondary', p: 3, animation: `${fadeInUp} 0.5s ease-out forwards`, opacity: 0 }}>
                    <InfoOutlinedIcon sx={{ fontSize: 40, mb: 2, color: 'action.disabled' }}/>
                    <Typography variant="h6" component="p" sx={{ fontStyle: 'italic' }}>
                        Selecciona una sección del menú lateral.
                    </Typography>
                </Box>
            );
        }

        // 4. Renderizado específico por sección
        // Envolver en Fade + Box para animación y layout consistente
        return (
            <Fade in={true} timeout={400} style={{ width: '100%', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* --- CONSULTAS --- */}
                    {currentSection === SECTIONS.CONSULTAS && (
                        <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary', animation: `${fadeInUp} 0.5s ease-out forwards`, opacity: 0, mt: 4 }}>
                            <Typography variant="h6" sx={{ fontStyle: 'italic' }}>Funcionalidad de Consultas próximamente.</Typography>
                            {/* Podrías añadir un icono o más información */}
                        </Box>
                    )}

                    {/* --- TIPOS DE SOLICITUD (por Área) --- */}
                    {currentSection.startsWith(SECTIONS.AREA_PREFIX) && (
                         <Paper sx={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', border: `1px solid ${theme.palette.divider}`, borderRadius: 1.5, width: '100%', bgcolor: 'background.paper', boxShadow: 'none', animation: `${fadeInUp} 0.5s ease-out forwards`, opacity: 0, flexGrow: 1 /* Ocupar espacio */ }}>
                             <TableContainer sx={{ flexGrow: 1, overflow: 'auto', '&::-webkit-scrollbar': { width: '8px', height: '8px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[400], borderRadius: '4px' } }}>
                                 <Table stickyHeader size="small">
                                     <TableHead><TableRow>
                                         <TableCell sx={headerCellStyle}>Nombre</TableCell>
                                         <TableCell sx={headerCellStyle}>Descripción</TableCell>
                                         <TableCell sx={{ ...headerCellStyle, textAlign: 'center', width: { xs: '100px', sm: '130px' } }}>Acción</TableCell>
                                     </TableRow></TableHead>
                                     <TableBody>
                                         {filteredTiposForTable.length > 0 ? (
                                             filteredTiposForTable.map((tipo, index) => (
                                                 <TableRow
                                                     hover
                                                     key={tipo.id_tipo}
                                                     sx={{
                                                         '&:last-child td, &:last-child th': { border: 0 },
                                                         '&:hover': { backgroundColor: theme.palette.action.hover },
                                                         transition: theme.transitions.create('background-color', { duration: theme.transitions.duration.shortest }),
                                                         animation: `${fadeInUp} 0.3s ease-out forwards`,
                                                         animationDelay: `${index * 0.03}s`, // Stagger animation
                                                         opacity: 0
                                                     }}
                                                 >
                                                     <TableCell sx={bodyCellStyle}>{tipo.nombre_tipo}</TableCell>
                                                     {/* Usar Tooltip solo si la descripción es larga? O siempre */}
                                                     <Tooltip title={tipo.descripcion || ''} placement="top-start">
                                                         <TableCell sx={descriptionCellStyleResponsive}>
                                                             {/* Truncar texto si es muy largo visualmente */}
                                                             <Typography variant="inherit" noWrap sx={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                 {tipo.descripcion || '-'}
                                                             </Typography>
                                                         </TableCell>
                                                     </Tooltip>
                                                     <TableCell sx={{ ...bodyCellStyle, textAlign: 'center' }}>
                                                         <Button variant="contained" size="small" endIcon={<SendIcon fontSize="inherit" />} sx={solicitarButtonStyle} >
                                                             Solicitar
                                                         </Button>
                                                     </TableCell>
                                                 </TableRow>
                                             ))
                                         ) : (
                                            <TableRow>
                                                <TableCell colSpan={3} align="center" sx={{ py: 5, fontStyle: 'italic', color: 'text.disabled', borderBottom: 'none' }}>
                                                    {searchTerm ? "No se encontraron tipos de solicitud." : "No hay tipos de solicitud para mostrar en esta área."}
                                                </TableCell>
                                            </TableRow>
                                         )}
                                     </TableBody>
                                 </Table>
                             </TableContainer>
                         </Paper>
                    )}

                    {/* --- PREGUNTAS FRECUENTES --- */}
                    {currentSection === SECTIONS.PREGUNTAS_FRECUENTES && (
                         <Box sx={{ width: '100%', animation: `${fadeInUp} 0.5s ease-out forwards`, opacity: 0, flexGrow: 1 }}>
                             {/* Filter Dropdown (si hay FAQs) */}
                             {faqs.length > 0 && (
                                 <Fade in={true} timeout={400}>
                                     <FormControl size="small" sx={{ minWidth: 250, alignSelf: 'flex-start', mb: 2 }}>
                                         <InputLabel id="faq-filter-label" sx={{ color: 'text.secondary' }}>Filtrar por Tipo</InputLabel>
                                         <Select
                                             labelId="faq-filter-label"
                                             id="faq-filter-select"
                                             value={faqFilterTipoId}
                                             label="Filtrar por Tipo"
                                             onChange={handleFaqFilterChange}
                                             sx={{
                                                 borderRadius: 1.5,
                                                 // *** CORRECCIÓN VISUAL Select: Quitar fondo explícito ***
                                                 // bgcolor: alpha(theme.palette.action.hover, 0.5), // <-- Eliminado/Comentado
                                                 '.MuiOutlinedInput-notchedOutline': { borderColor: alpha(theme.palette.divider, 0.5) },
                                                 '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
                                                 '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main } // Foco
                                             }}
                                             MenuProps={{ // Estilos para el menú desplegable
                                                PaperProps: {
                                                    sx: {
                                                        bgcolor: 'background.paper',
                                                        border: `1px solid ${theme.palette.divider}`,
                                                        boxShadow: theme.shadows[3],
                                                    }
                                                }
                                             }}
                                         >
                                             {/* Opción "Todos" */}
                                             <MenuItem value=""><em>Todos los Tipos</em></MenuItem>
                                             {/* Opciones de Tipos */}
                                             {Array.from(new Set(faqs.map(f => f.id_tipo))) // Obtener IDs únicos
                                                  .map(tipoId => {
                                                      // Encontrar la info del tipo (nombre)
                                                      const tipoInfo = tiposSolicitudesAll.find(t => t.id_tipo === tipoId);
                                                      return tipoInfo ? (
                                                          <MenuItem
                                                              key={tipoId}
                                                              value={tipoId}
                                                              sx={{
                                                                  // --- *** CORRECCIÓN VISUAL MenuItem *** ---
                                                                  '&.Mui-selected': {
                                                                    // Fondo azul primario semitransparente
                                                                    backgroundColor: alpha(theme.palette.primary.main, 0.12),
                                                                    // Color de texto primario
                                                                    color: theme.palette.primary.main,
                                                                    fontWeight: 500, // Un poco más de énfasis
                                                                    '&:hover': {
                                                                        // Hover azul un poco más oscuro
                                                                        backgroundColor: alpha(theme.palette.primary.main, 0.18),
                                                                    },
                                                                  },
                                                                  // Estilo hover normal para items no seleccionados
                                                                  '&:not(.Mui-selected):hover': {
                                                                     backgroundColor: theme.palette.action.hover,
                                                                  },
                                                                  // Transición suave
                                                                  transition: theme.transitions.create(['background-color', 'color'], { duration: theme.transitions.duration.shortest }),
                                                              }}
                                                          >
                                                              {tipoInfo.nombre_tipo}
                                                          </MenuItem>
                                                      ) : null; // No renderizar si no se encontró info del tipo (raro)
                                                  })}
                                         </Select>
                                     </FormControl>
                                 </Fade>
                             )}

                            {/* Lista de Acordeones */}
                            {filteredFaqs.length > 0 ? (
                                filteredFaqs.map((faq, index) => (
                                    <Accordion
                                        key={faq.id_pregunta}
                                        // defaultExpanded={index === 0} // Opcional: expandir el primero por defecto
                                        sx={{
                                            mb: 1.5, // Más espacio entre acordeones
                                            '&:before': { display: 'none' },
                                            border: `1px solid ${theme.palette.divider}`,
                                            borderRadius: 1.5,
                                            boxShadow: 'none',
                                            bgcolor: 'background.paper',
                                            transition: theme.transitions.create(['margin', 'background-color', 'border-color']),
                                            '&.Mui-expanded': {
                                                mb: 1.5, // Mantener margen al expandir
                                                borderColor: theme.palette.primary.light, // Borde sutil al expandir
                                                // No cambiar bgcolor al expandir para mantener limpieza
                                            },
                                            animation: `${fadeInUp} 0.3s ease-out forwards`,
                                            animationDelay: `${index * 0.04}s`, // Stagger animation
                                            opacity: 0
                                        }}
                                    >
                                        <AccordionSummary
                                            expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />}
                                            aria-controls={`panel${faq.id_pregunta}-content`}
                                            id={`panel${faq.id_pregunta}-header`}
                                            sx={{
                                                '&:hover': { bgcolor: theme.palette.action.hover },
                                                '& .MuiAccordionSummary-content': { my: 1.2 }, // Más padding vertical
                                                transition: theme.transitions.create(['background-color']),
                                            }}
                                        >
                                            <Typography sx={{ fontWeight: 500, color: 'text.primary', flexShrink: 1, mr: 1 }}>
                                                {faq.pregunta}
                                            </Typography>
                                            {/* Opcional: Mostrar el tipo de solicitud asociado */}
                                            {faq.nombre_tipo_solicitud && (
                                                <Typography variant="caption" sx={{ color: 'text.secondary', ml: 'auto', fontStyle: 'italic', whiteSpace: 'nowrap', pl: 1 }}>
                                                    ({faq.nombre_tipo_solicitud})
                                                </Typography>
                                            )}
                                        </AccordionSummary>
                                        <AccordionDetails sx={{
                                            // --- *** CORRECCIÓN VISUAL AccordionDetails *** ---
                                            // bgcolor: alpha(theme.palette.action.hover, 0.3), // <-- Eliminado/Comentado
                                            borderTop: `1px dashed ${theme.palette.divider}`,
                                            px: 2.5, py: 2
                                        }}>
                                            {/* Usar whiteSpace: 'pre-wrap' para respetar saltos de línea si los hubiera */}
                                            <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                                {faq.respuesta}
                                            </Typography>
                                        </AccordionDetails>
                                    </Accordion>
                                ))
                            ) : (
                                <Typography sx={{ textAlign: 'center', py: 5, fontStyle: 'italic', color: 'text.disabled' }}>
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
        // Usar el ThemeProvider local con el tema actual (light/dark)
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
                <Navbar
                    toggleTheme={handleToggleTheme}
                    toggleSidebar={handleDrawerToggle}
                    title="Portal Vecino"
                    appBarHeight={APP_BAR_HEIGHT}
                    logoLink="/vecinos"
                />
                <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
                    {/* Drawer Temporal (Móvil) */}
                    <Drawer
                        variant="temporary"
                        open={mobileOpen}
                        onClose={handleDrawerClose}
                        ModalProps={{ keepMounted: true }} // Mejor rendimiento en móvil
                        sx={{
                            display: { xs: 'block', md: 'none' },
                            '& .MuiDrawer-paper': {
                                boxSizing: 'border-box',
                                width: DRAWER_WIDTH,
                                bgcolor: 'background.paper',
                                borderRight: `1px solid ${theme.palette.divider}`,
                                // Usar transiciones del tema
                                transition: theme.transitions.create('transform', {
                                    easing: theme.transitions.easing.sharp,
                                    duration: theme.transitions.duration.enteringScreen
                                })
                            }
                        }}
                    >
                        {drawerContent}
                    </Drawer>
                    {/* Drawer Permanente (Desktop) */}
                    <Drawer
                        variant="permanent"
                        open // Siempre abierto en desktop
                        sx={{
                            display: { xs: 'none', md: 'block' },
                            '& .MuiDrawer-paper': {
                                boxSizing: 'border-box',
                                width: DRAWER_WIDTH,
                                top: `${APP_BAR_HEIGHT}px`, // Debajo del Navbar
                                height: `calc(100vh - ${APP_BAR_HEIGHT}px)`, // Altura restante
                                borderRight: `1px solid ${theme.palette.divider}`,
                                bgcolor: 'background.paper',
                                overflowY: 'auto', // Permitir scroll si el contenido es largo
                                // Usar transiciones del tema
                                transition: theme.transitions.create('width', {
                                    easing: theme.transitions.easing.sharp,
                                    duration: theme.transitions.duration.enteringScreen
                                })
                            }
                        }}
                    >
                        {drawerContent}
                    </Drawer>
                </Box>

                {/* Contenido Principal */}
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: { xs: 1.5, sm: 2, md: 3 }, // Padding adaptable
                        width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
                        display: 'flex',
                        flexDirection: 'column',
                        mt: `${APP_BAR_HEIGHT}px`, // Espacio para el Navbar
                        height: `calc(100vh - ${APP_BAR_HEIGHT}px)`, // Altura restante
                        overflow: 'hidden', // Evitar doble scrollbar
                        bgcolor: 'background.default',
                        transition: theme.transitions.create('padding', { duration: theme.transitions.duration.short })
                    }}
                >
                    {/* Card Contenedora */}
                    <Card sx={{
                        width: '100%',
                        flexGrow: 1, // Ocupar todo el espacio vertical disponible
                        borderRadius: 2,
                        boxShadow: theme.shadows[2], // Sombra más sutil
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden', // Contener hijos
                        bgcolor: 'background.paper',
                        transition: theme.transitions.create(['box-shadow', 'background-color'], { duration: theme.transitions.duration.short })
                    }}>
                        <CardContent sx={{
                            p: { xs: 1.5, sm: 2, md: 3 }, // Padding interno adaptable
                            display: 'flex',
                            flexDirection: 'column',
                            flexGrow: 1,
                            overflow: 'hidden', // Ocultar overflow interno antes del scroll
                            gap: 2 // Espacio entre elementos hijos directos
                        }}>
                            {/* Header Interno (Título y Búsqueda) */}
                             <Box sx={{
                                 display: 'flex',
                                 justifyContent: 'space-between',
                                 alignItems: 'center',
                                 flexWrap: 'wrap', // Permitir que la búsqueda pase abajo en pantallas pequeñas
                                 gap: 1.5,
                                 flexShrink: 0, // No encoger el header
                                 borderBottom: `1px solid ${theme.palette.divider}`,
                                 pb: 2, mb: 1 // Espacio debajo del borde
                             }}>
                                <Typography
                                    variant={isSmallScreen ? 'h6' : (isLargeScreen ? 'h4' : 'h5')}
                                    component="h1"
                                    sx={{
                                        fontWeight: "bold",
                                        color: 'text.primary',
                                        order: 1, // Título primero
                                        mr: 'auto', // Empujar búsqueda a la derecha
                                        animation: `${fadeInUp} 0.5s ease-out`, // Animación de entrada
                                        animationDelay: '0.1s',
                                        opacity: 0,
                                        animationFillMode: 'forwards'
                                    }}
                                >
                                    {getMainTitle}
                                </Typography>
                                {/* Search Bar */}
                                <Box sx={{ order: 2, display: 'flex', alignItems: 'center' }}>
                                    {/* Mostrar búsqueda solo si hay contenido filtrable y no está cargando */}
                                    {currentSection && (currentSection.startsWith(SECTIONS.AREA_PREFIX) || currentSection === SECTIONS.PREGUNTAS_FRECUENTES) && !loading.initial && !loading.content && !error.content && (
                                        <Fade in={true} timeout={400}>
                                            <TextField
                                                size="small" variant="outlined" placeholder="Buscar..." value={searchTerm} onChange={handleSearchChange}
                                                sx={{
                                                    width: { xs: '170px', sm: 200, md: 250 }, // Ancho adaptable
                                                    transition: theme.transitions.create(['width', 'box-shadow', 'border-color']),
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: '50px', // Input redondeado
                                                        // --- *** CORRECCIÓN VISUAL TextField *** ---
                                                        // backgroundColor: alpha(theme.palette.action.hover, 0.5), // <-- Eliminado/Comentado
                                                        '& fieldset': { borderColor: alpha(theme.palette.divider, 0.5) }, // Borde inicial sutil
                                                        '&:hover fieldset': { borderColor: theme.palette.divider }, // Borde hover normal
                                                        '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: '1px' } // Borde focus azul
                                                     },
                                                     '& .MuiInputAdornment-root': { color: theme.palette.text.secondary }
                                                 }}
                                                InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>) }}
                                            />
                                        </Fade>
                                    )}
                                </Box>
                             </Box>

                             {/* Indicadores de Carga/Error Inicial */}
                             {loading.initial && (
                                 <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', py: 5, flexGrow: 1, gap: 1 }}>
                                     <CircularProgress />
                                     <Typography sx={{ color: 'text.secondary', fontStyle: 'italic', mt: 1 }}>Cargando datos iniciales...</Typography>
                                </Box>
                             )}
                             {error.initial && !loading.initial && (
                                <Fade in={true} timeout={500}>
                                    <Alert severity="error" sx={{ mb: 2, flexShrink: 0, boxShadow: theme.shadows[1], border: `1px solid ${theme.palette.error.dark}`, animation: `${fadeInUp} 0.4s ease-out`, opacity: 0, animationFillMode: 'forwards' }}>
                                        {error.initial}
                                    </Alert>
                                </Fade>
                             )}

                            {/* Área Principal Desplazable */}
                            <Box sx={{
                                flexGrow: 1, // Ocupar espacio restante
                                overflowY: 'auto', // Scroll si el contenido excede
                                '&::-webkit-scrollbar': { width: '8px' },
                                '&::-webkit-scrollbar-thumb': { backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[400], borderRadius: '4px' },
                                pr: 0.5 // Pequeño padding a la derecha para evitar que el scroll toque el borde
                            }}>
                                {/* Renderizar contenido principal solo si no hay carga/error inicial */}
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