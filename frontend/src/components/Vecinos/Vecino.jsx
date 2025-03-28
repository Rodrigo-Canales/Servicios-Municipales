import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import {
    Box, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Button, CircularProgress, Fade,
    Card, CardContent, CssBaseline, ThemeProvider, Drawer, useMediaQuery,
    TextField, InputAdornment, Tooltip, Alert
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
// *** Importa el icono que usaremos ***
import SendIcon from '@mui/icons-material/Send'; // O elige otro icono si prefieres
import Navbar from "../Navbar";
import SidebarVecino from "../Vecinos/SidebarVecino";
import { lightTheme, darkTheme } from "../../theme";

// Constantes de Layout
const appBarHeight = 64;
const drawerWidth = 240;

const Vecino = () => {
    // --- Estados ---
    const [mode, setMode] = useState("light");
    const [tiposSolicitudes, setTiposSolicitudes] = useState([]);
    const [areaSeleccionada, setAreaSeleccionada] = useState(null);
    const [nombreArea, setNombreArea] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // --- Tema y Media Queries ---
    const currentTheme = useMemo(() => (mode === "light" ? lightTheme : darkTheme), [mode]);
    const isLargeScreen = useMediaQuery(currentTheme.breakpoints.up('md'));
    const isSmallScreen = useMediaQuery(currentTheme.breakpoints.down('sm'));

    // --- Handlers ---
    const toggleTheme = () => setMode((prev) => (prev === "light" ? "dark" : "light"));
    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
    const handleDrawerClose = () => setMobileOpen(false);
    const handleSearchChange = (event) => setSearchTerm(event.target.value);

    const handleSelectArea = useCallback((areaId, nombre) => {
        if (areaId !== areaSeleccionada) {
            setAreaSeleccionada(areaId);
            setNombreArea(nombre);
            setSearchTerm("");
            setError(null);
        }
        if (!isLargeScreen) handleDrawerClose();
    }, [areaSeleccionada, isLargeScreen]);

    // --- Fetch Data ---
    const fetchTiposSolicitudes = useCallback(async (areaId) => {
        setLoading(true);
        setError(null);
        setTiposSolicitudes([]);
        const url = `/api/tipos_solicitudes/area/${areaId}`;
        console.log(`Fetching tipos solicitudes desde: ${url}`);
        try {
            const response = await axios.get(url);
            if (Array.isArray(response.data)) {
                setTiposSolicitudes(response.data);
            } else {
                console.warn("Respuesta inesperada de la API:", response.data);
                setTiposSolicitudes([]);
                setError("Formato de respuesta incorrecto.");
            }
        } catch (error) {
            console.error("Error fetching:", error);
            const apiError = error.response?.data?.message;
            setError(apiError || error.message || "Error al cargar datos.");
            setTiposSolicitudes([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- Effects ---
    useEffect(() => {
        if (areaSeleccionada) {
            fetchTiposSolicitudes(areaSeleccionada);
        } else {
            setTiposSolicitudes([]); setLoading(false); setError(null);
        }
    }, [areaSeleccionada, fetchTiposSolicitudes]);

    useEffect(() => { if (isLargeScreen) setMobileOpen(false); }, [isLargeScreen]);

    // --- Filtrado ---
    const filteredSolicitudes = useMemo(() => {
        if (!areaSeleccionada) return [];
        if (!searchTerm.trim()) return tiposSolicitudes;
        const lowerSearch = searchTerm.toLowerCase();
        return tiposSolicitudes.filter(t =>
            (t.nombre_tipo?.toLowerCase().includes(lowerSearch)) ||
            (t.descripcion?.toLowerCase().includes(lowerSearch))
        );
    }, [tiposSolicitudes, searchTerm, areaSeleccionada]);

    // --- Contenido Sidebar ---
    const drawerContent = ( <SidebarVecino onSelectArea={handleSelectArea} theme={currentTheme} onCloseDrawer={handleDrawerClose} /> );

    // --- Estilos Celdas Responsivos ---
    const headerCellStyle = {
        fontWeight: 'bold',
        backgroundColor: currentTheme.palette.primary.main,
        color: currentTheme.palette.primary.contrastText,
        py: { xs: 0.8, sm: 1, md: 1.5 }, px: { xs: 1, sm: 1.5, md: 2 },
        whiteSpace: 'nowrap', fontSize: { xs: '0.75rem', sm: '0.875rem' }
    };
    const bodyCellStyleBase = {
        py: { xs: 0.75, sm: 1 }, px: { xs: 1, sm: 1.5, md: 2 },
        fontSize: { xs: '0.75rem', sm: '0.875rem' }, verticalAlign: 'middle',
    };
    const descriptionCellStyleResponsive = {
        ...bodyCellStyleBase, whiteSpace: 'normal', wordWrap: 'break-word',
    };

    // --- Renderizado ---
    return (
        <ThemeProvider theme={currentTheme}>
            <CssBaseline />
            <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
                <Navbar toggleTheme={toggleTheme} toggleSidebar={handleDrawerToggle} appBarHeight={appBarHeight} title="Municipalidad" logoLink="/vecinos" />
                <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
                    <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, bgcolor: 'background.paper' } }}>{drawerContent}</Drawer>
                    <Drawer variant="permanent" open sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, top: `${appBarHeight}px`, height: `calc(100vh - ${appBarHeight}px)`, borderRight: `1px solid ${currentTheme.palette.divider}`, bgcolor: 'background.paper' } }}>{drawerContent}</Drawer>
                </Box>

                <Box component="main" sx={{ flexGrow: 1, p: { xs: 1, sm: 2, md: 3 }, width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` }, display: 'flex', flexDirection: 'column', mt: `${appBarHeight}px`, height: `calc(100vh - ${appBarHeight}px)`, overflow: 'hidden' }}>
                    <Card sx={{ width: '100%', flexGrow: 1, borderRadius: 2, boxShadow: { xs: 2, sm: 3, md: 5 }, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'background.paper' }}>
                        <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 }, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                            <Typography variant={isSmallScreen ? 'h6' : (isLargeScreen ? 'h4' : 'h5')} gutterBottom color="text.primary" sx={{ fontWeight: "bold", mb: 2, flexShrink: 0 }}>
                                {nombreArea ? `Tipos de Solicitudes - ${nombreArea}` : "Selecciona un área"}
                            </Typography>

                            {!loading && areaSeleccionada && (
                                <Box sx={{ mb: 2, width: { xs: '100%', sm: '350px', md: '400px' }, alignSelf: { xs: 'center', sm: 'flex-end' } }}>
                                    <TextField fullWidth size="small" variant="outlined" placeholder="Buscar solicitud..." value={searchTerm} onChange={handleSearchChange}
                                        InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>), sx: { borderRadius: 2 } }}
                                    />
                                </Box>
                            )}

                            {loading && ( <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}><CircularProgress /></Box> )}
                            {!loading && error && (<Alert severity="error" sx={{ mb: 2, flexShrink: 0 }}>{error}</Alert>)}
                             {!loading && !error && !areaSeleccionada && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, textAlign: 'center', color: 'text.secondary', p: 3 }}>
                                    <Typography variant="h6" component="p">
                                        Selecciona un área para ver las solicitudes.
                                    </Typography>
                                </Box>
                            )}

                            {!loading && !error && areaSeleccionada && (
                                <Fade in={!loading} timeout={500} style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                    <TableContainer component={Paper} sx={{ flexGrow: 1, overflow: 'auto', boxShadow: 0, border: `1px solid ${currentTheme.palette.divider}`, borderRadius: 1.5, width: '100%', bgcolor: 'background.paper' }}>
                                        <Table stickyHeader sx={{ minWidth: { xs: 450, sm: 600, md: 700 } }}>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={headerCellStyle}>Nombre</TableCell>
                                                    <TableCell sx={headerCellStyle}>Descripción</TableCell>
                                                    <TableCell sx={{ ...headerCellStyle, textAlign: 'center' }}>Acción</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {filteredSolicitudes.length > 0 ? (
                                                    filteredSolicitudes.map((tipo) => (
                                                        <TableRow hover key={tipo.id_tipo} sx={{ '&:last-child td, &:last-child th': { border: 0 }, transition: 'background-color 0.2s ease-in-out' }}>
                                                            <TableCell sx={bodyCellStyleBase}>{tipo.nombre_tipo}</TableCell>
                                                            <Tooltip title={tipo.descripcion || ''} placement="top-start" arrow>
                                                                <TableCell sx={descriptionCellStyleResponsive}>
                                                                    {tipo.descripcion || '-'}
                                                                </TableCell>
                                                            </Tooltip>
                                                            <TableCell sx={{ ...bodyCellStyleBase, textAlign: 'center' }}>
                                                                {/* === BOTÓN SOLICITAR CON NUEVO ESTILO === */}
                                                                <Button
                                                                    variant="contained" // Mantenemos contained como base
                                                                    // color="success" // Ya no usamos el color base directamente
                                                                    size="small"
                                                                    endIcon={<SendIcon fontSize="inherit" />} // Icono al inicio
                                                                    sx={{
                                                                        // Degradado: usa colores del tema actual
                                                                        background: `linear-gradient(45deg, ${currentTheme.palette.success.light} 30%, ${currentTheme.palette.success.main} 90%)`,
                                                                        // Sombra: más pronunciada y con color verde suave
                                                                        boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)', // Sombra verde (success main)
                                                                        // Bordes más redondeados
                                                                        borderRadius: '16px', // O '50px' para píldora
                                                                        // Color de texto (asegura contraste)
                                                                        color: currentTheme.palette.success.contrastText,
                                                                        // Padding responsivo (ajustado ligeramente si es necesario)
                                                                        py: { xs: 0.6, sm: 0.8 },
                                                                        px: { xs: 1.5, sm: 2 },
                                                                        // Texto: sin mayúsculas y un poco más grueso
                                                                        textTransform: 'none',
                                                                        fontWeight: 600,
                                                                        // Transiciones suaves para el hover
                                                                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out, background 0.3s ease',
                                                                        // Estilo Hover: levanta, oscurece un poco el degradado y aumenta sombra
                                                                        '&:hover': {
                                                                            transform: 'scale(1.05) translateY(-1px)',
                                                                            boxShadow: '0 5px 8px 3px rgba(76, 175, 80, .4)',
                                                                            background: `linear-gradient(45deg, ${currentTheme.palette.success.main} 30%, ${currentTheme.palette.success.dark} 90%)`, // Degradado más oscuro
                                                                        },
                                                                        // Quitar sombra por defecto de contained si interfiere
                                                                        // boxShadow: 'none', // Descomentar si la sombra base de contained molesta
                                                                    }}
                                                                    // onClick={() => handleSolicitar(tipo.id_tipo)}
                                                                    >
                                                                    Solicitar
                                                                </Button>
                                                                {/* === FIN BOTÓN SOLICITAR === */}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={3} align="center" sx={{ py: 4, fontStyle: 'italic', color: 'text.secondary' }}>
                                                            {searchTerm ? "No se encontraron tipos de solicitud." : "No hay tipos de solicitud disponibles en esta área."}
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
                </Box>
            </Box>
        </ThemeProvider>
    );
};

export default Vecino;