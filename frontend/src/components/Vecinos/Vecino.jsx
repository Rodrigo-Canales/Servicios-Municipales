import React, { useState, useEffect, useMemo, useCallback } from "react"; // useCallback añadido por si acaso, aunque no se use explícitamente aquí
import axios from "axios";
import {
    Box, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Button, CircularProgress, Fade,
    Card, CardContent, CssBaseline, ThemeProvider, Drawer, useMediaQuery,
    TextField, InputAdornment, Tooltip, Alert // Alert añadido por si quieres mostrar errores
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import Navbar from "../Navbar";
import SidebarVecino from "../Vecinos/SidebarVecino"; // Asegúrate que la ruta es correcta
import { lightTheme, darkTheme } from "../../theme"; // Asegúrate que la ruta es correcta

// Constantes de Layout
const appBarHeight = 64;
const drawerWidth = 240;

const Vecino = () => {
    // --- Estados ---
    const [mode, setMode] = useState("light");
    const [tiposSolicitudes, setTiposSolicitudes] = useState([]);
    const [areaSeleccionada, setAreaSeleccionada] = useState(null); // Inicia sin área seleccionada
    const [nombreArea, setNombreArea] = useState("");
    const [loading, setLoading] = useState(false); // Inicia SIN loading
    const [error, setError] = useState(null);     // Añadido estado de error
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
        if (areaId !== areaSeleccionada) { // Solo actualiza si el área es diferente
            setAreaSeleccionada(areaId);
            setNombreArea(nombre);
            setSearchTerm("");
            setError(null); // Limpia errores al cambiar de área
            // El useEffect [areaSeleccionada] se encargará de poner loading y buscar
        }
        if (!isLargeScreen) handleDrawerClose();
    }, [areaSeleccionada, isLargeScreen]); // Dependencias correctas

    // --- Fetch Data ---
    // Usando useCallback para consistencia, aunque las dependencias sean vacías aquí
    const fetchTiposSolicitudes = useCallback(async (areaId) => {
        // Solo activa loading si realmente vamos a buscar datos (areaId tiene valor)
        setLoading(true);
        setError(null); // Limpia error anterior antes de buscar
        setTiposSolicitudes([]); // Limpia datos previos

        // ***** MODIFICACIÓN: Usar URL relativa (depende del proxy Vite) *****
        const url = `/api/tipos_solicitudes/area/${areaId}`;
        console.log(`Fetching tipos solicitudes desde: ${url}`); // Log para depuración

        try {
            const response = await axios.get(url);
            // Asumiendo que esta ruta devuelve directamente el array
            if (Array.isArray(response.data)) {
                setTiposSolicitudes(response.data);
            } else {
                console.warn("Respuesta inesperada de la API (no es un array):", response.data);
                setTiposSolicitudes([]); // Asegurar array vacío
                setError("No se pudieron obtener los tipos de solicitud (formato incorrecto).");
            }
        } catch (error) {
            console.error("Error fetching tipos solicitudes por area:", error);
            const apiError = error.response?.data?.message;
            setError(apiError || error.message || "Error al cargar los tipos de solicitud.");
            setTiposSolicitudes([]); // Asegurar array vacío en caso de error
        } finally {
            setLoading(false); // Desactivar loading al finalizar
        }
    }, []); // fetchTiposSolicitudes no necesita dependencias si no usa estado/props externos directamente

    // --- Effects ---
    // Efecto para cargar datos CUANDO areaSeleccionada CAMBIA y TIENE VALOR
    useEffect(() => {
        if (areaSeleccionada) {
            fetchTiposSolicitudes(areaSeleccionada);
        } else {
            // Si no hay area seleccionada (inicial o si se deselecciona)
            setTiposSolicitudes([]); // Limpia los datos
            setLoading(false);      // Asegura que no esté cargando
            setError(null);         // Limpia errores
        }
        // fetchTiposSolicitudes está en useCallback, seguro incluirla
    }, [areaSeleccionada, fetchTiposSolicitudes]);

    // Efecto para cerrar drawer en pantallas grandes
    useEffect(() => { if (isLargeScreen) setMobileOpen(false); }, [isLargeScreen]);

    // --- Filtrado ---
    const filteredSolicitudes = useMemo(() => {
        if (!areaSeleccionada) return []; // No filtrar si no hay área
        if (!searchTerm.trim()) return tiposSolicitudes;
        const lowerSearch = searchTerm.toLowerCase();
        // Filtrar sobre los tiposSolicitudes actuales
        return tiposSolicitudes.filter(t =>
            (t.nombre_tipo?.toLowerCase().includes(lowerSearch)) ||
            (t.descripcion?.toLowerCase().includes(lowerSearch))
            // Podrías añadir filtro por nombre_area si quisieras, aunque ya están filtrados por área
            // || (t.nombre_area?.toLowerCase().includes(lowerSearch))
        );
    }, [tiposSolicitudes, searchTerm, areaSeleccionada]); // Incluir areaSeleccionada por completitud

    // --- Contenido Sidebar ---
    // Pasamos el tema actual por si SidebarVecino lo necesita internamente
    const drawerContent = ( <SidebarVecino onSelectArea={handleSelectArea} theme={currentTheme} onCloseDrawer={handleDrawerClose} /> );

    // --- Estilos Celdas Responsivos (sin cambios) ---
    const headerCellStyle = {
        fontWeight: 'bold',
        backgroundColor: currentTheme.palette.primary.main,
        color: currentTheme.palette.primary.contrastText,
        py: { xs: 0.8, sm: 1, md: 1.5 },
        px: { xs: 1, sm: 1.5, md: 2 },
        whiteSpace: 'nowrap',
        fontSize: { xs: '0.75rem', sm: '0.875rem' }
    };
    const bodyCellStyleBase = {
        py: { xs: 0.75, sm: 1 },
        px: { xs: 1, sm: 1.5, md: 2 },
        fontSize: { xs: '0.75rem', sm: '0.875rem' },
        verticalAlign: 'middle',
    };
    const descriptionCellStyle = {
        ...bodyCellStyleBase,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: { xs: 120, sm: 200, md: 300 },
    };

    // --- Renderizado ---
    return (
        <ThemeProvider theme={currentTheme}>
            <CssBaseline />
            {/* Contenedor Flex Principal */}
            <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
                {/* Navbar */}
                <Navbar toggleTheme={toggleTheme} toggleSidebar={handleDrawerToggle} appBarHeight={appBarHeight} title="Municipalidad" logoLink="/vecinos" /> {/* Ajusta título/link si es necesario */}
                {/* Contenedor Nav Sidebar */}
                <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
                    {/* Drawers */}
                    <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, bgcolor: 'background.paper' } }}>{drawerContent}</Drawer>
                    <Drawer variant="permanent" open sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, top: `${appBarHeight}px`, height: `calc(100vh - ${appBarHeight}px)`, borderRight: `1px solid ${currentTheme.palette.divider}`, bgcolor: 'background.paper' } }}>{drawerContent}</Drawer>
                </Box>

                {/* Contenedor Main */}
                <Box component="main" sx={{ flexGrow: 1, p: { xs: 1, sm: 2, md: 3 }, width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` }, display: 'flex', flexDirection: 'column', mt: `${appBarHeight}px`, height: `calc(100vh - ${appBarHeight}px)`, overflow: 'hidden' }}>
                    {/* Card Contenedora Principal */}
                    <Card sx={{ width: '100%', flexGrow: 1, borderRadius: 2, boxShadow: { xs: 2, sm: 3, md: 5 }, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'background.paper' }}>
                        {/* CardContent (sin overflow:hidden) */}
                        <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 }, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>

                            {/* Título */}
                            <Typography variant={isSmallScreen ? 'h6' : (isLargeScreen ? 'h4' : 'h5')} gutterBottom color="text.primary" sx={{ fontWeight: "bold", mb: 2, flexShrink: 0 }}>
                                {nombreArea ? `Tipos de Solicitudes - ${nombreArea}` : "Selecciona un área"}
                            </Typography>

                            {/* Filtro (Solo se muestra si hay área seleccionada y no está cargando) */}
                            {!loading && areaSeleccionada && (
                                <Box sx={{ mb: 2, width: { xs: '100%', sm: '350px', md: '400px' }, alignSelf: { xs: 'center', sm: 'flex-end' } }}>
                                    <TextField fullWidth size="small" variant="outlined" placeholder="Buscar solicitud..." value={searchTerm} onChange={handleSearchChange}
                                        InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>), sx: { borderRadius: 2 } }}
                                    />
                                </Box>
                            )}

                            {/* Loader */}
                            {loading && ( <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}><CircularProgress /></Box> )}
                            {/* Error */}
                            {!loading && error && (<Alert severity="error" sx={{ mb: 2, flexShrink: 0 }}>{error}</Alert>)}
                             {/* Mensaje Inicial (renderizado si no hay área, no hay loading, no hay error) */}
                             {!loading && !error && !areaSeleccionada && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, textAlign: 'center', color: 'text.secondary', p: 3 }}>
                                    <Typography variant="h6" component="p">
                                        Selecciona un área del menú lateral para ver los tipos de solicitudes disponibles.
                                    </Typography>
                                </Box>
                            )}


                            {/* Fade + Tabla (Solo si hay área, no loading, no error) */}
                            {!loading && !error && areaSeleccionada && (
                                <Fade in={!loading} timeout={500} style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                    {/* TableContainer (con overflow:auto) */}
                                    <TableContainer component={Paper} sx={{ flexGrow: 1, overflow: 'auto', boxShadow: 0, border: `1px solid ${currentTheme.palette.divider}`, borderRadius: 1.5, width: '100%', bgcolor: 'background.paper' }}>
                                        <Table stickyHeader sx={{ minWidth: { xs: 600, sm: 700, md: 800 } }}>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={headerCellStyle}>Nombre</TableCell>
                                                    {/* Añadido control maxWidth como en el original */}
                                                    <TableCell sx={{...headerCellStyle, maxWidth: { xs: 120, sm: 200, md: 300 }}}>Descripción</TableCell>
                                                    <TableCell sx={headerCellStyle}>Área</TableCell>
                                                    <TableCell sx={{ ...headerCellStyle, textAlign: 'center' }}>Acción</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {/* Renderizar filas solo si hay datos filtrados */}
                                                {filteredSolicitudes.length > 0 ? (
                                                    filteredSolicitudes.map((tipo) => (
                                                        <TableRow hover key={tipo.id_tipo} sx={{ '&:last-child td, &:last-child th': { border: 0 }, transition: 'background-color 0.2s ease-in-out' }}>
                                                            <TableCell sx={bodyCellStyleBase}>{tipo.nombre_tipo}</TableCell>
                                                            <Tooltip title={tipo.descripcion || ''} placement="top-start" arrow>
                                                                {/* Usar descriptionCellStyle que incluye el truncado */}
                                                                <TableCell sx={descriptionCellStyle}>{tipo.descripcion || '-'}</TableCell>
                                                            </Tooltip>
                                                            <TableCell sx={bodyCellStyleBase}>{tipo.nombre_area}</TableCell>
                                                            <TableCell sx={{ ...bodyCellStyleBase, textAlign: 'center' }}>
                                                                {/* El botón solicitar es placeholder, necesitará su propia lógica */}
                                                                <Button variant="contained" color="success" size="small"
                                                                    sx={{ transition: "transform 0.2s ease", "&:hover": { transform: "scale(1.05)" }, borderRadius: 2, py: { xs: 0.5, sm: 0.8 }, px: { xs: 1, sm: 1.5 } }}
                                                                    // onClick={() => handleSolicitar(tipo.id_tipo)} // Ejemplo
                                                                    >
                                                                    Solicitar
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    // Mensaje si no hay datos (ya sea por filtro o porque no existen)
                                                    <TableRow>
                                                        <TableCell colSpan={4} align="center" sx={{ py: 4, fontStyle: 'italic', color: 'text.secondary' }}>
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
                </Box> {/* Fin Main */}
            </Box> {/* Fin Flex Principal */}
        </ThemeProvider>
    );
};

export default Vecino;