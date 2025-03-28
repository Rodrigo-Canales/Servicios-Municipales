import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    List, ListItemButton, ListItemIcon, ListItemText, Collapse, Box, Typography,
    CircularProgress, useTheme, styled // Asegúrate que styled esté aquí
} from "@mui/material";
import {
    ExpandLess, ExpandMore,
    // Iconos actualizados para Sidebar Vecino
    ListAlt as HeaderIcon,         // Icono para la cabecera "ÁREAS" (alternativa)
    FolderOpen as AreaIcon         // Icono para cada ítem de Área (alternativa)
} from "@mui/icons-material";

// --- Función Helper para Opacidad (COPIADA EXACTAMENTE de SidebarAdmin) ---
function alphaHelper(color, opacity) {
    if (!color || typeof color !== 'string') return 'rgba(0,0,0,0)';
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (rgbMatch) { return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${opacity})`; }
    const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (hexMatch) { const r = parseInt(hexMatch[1], 16); const g = parseInt(hexMatch[2], 16); const b = parseInt(hexMatch[3], 16); return `rgba(${r}, ${g}, ${b}, ${opacity})`; }
    const hexAlphaMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
     if (hexAlphaMatch) { const r = parseInt(hexAlphaMatch[1], 16); const g = parseInt(hexAlphaMatch[2], 16); const b = parseInt(hexAlphaMatch[3], 16); return `rgba(${r}, ${g}, ${b}, ${opacity})`; }
    console.warn("alphaHelper function received unexpected color format:", color);
    return 'rgba(0,0,0,0)';
}

// --- Componente Estilizado para Sub-Items (COPIADO EXACTAMENTE de SidebarAdmin) ---
// Se usa el mismo componente para mantener el estilo idéntico.
const AdminSubItemButton = styled(ListItemButton)(({ theme, selected }) => ({
    paddingLeft: theme.spacing(4), // Indentación
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    marginBottom: theme.spacing(0.5),
    borderRadius: theme.shape.borderRadius,
    marginInline: theme.spacing(1.5),
    transition: theme.transitions.create(['background-color', 'color', 'transform'], {
        duration: theme.transitions.duration.short,
    }),
    color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
    backgroundColor: selected ? alphaHelper(theme.palette.primary.main, 0.12) : 'transparent',
    '& .MuiListItemText-primary': {
        fontWeight: selected ? 600 : 500,
        fontSize: '0.92rem',
    },
    '& .MuiListItemIcon-root': {
        color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
        minWidth: '38px', // Espacio antes del texto
        transition: theme.transitions.create(['color'], { duration: theme.transitions.duration.short }),
    },
    '&:hover': {
        backgroundColor: selected ? alphaHelper(theme.palette.primary.main, 0.16) : theme.palette.action.hover,
        color: theme.palette.text.primary,
        '& .MuiListItemIcon-root': {
            color: theme.palette.text.primary,
        },
    },
}));
// --- Fin Componente Estilizado ---


// --- Componente SidebarVecino MODIFICADO ---
const SidebarVecino = ({ onSelectArea, onCloseDrawer, headerTitle = "ÁREAS" }) => {
    const theme = useTheme();
    const [areas, setAreas] = useState([]);
    const [openAreas, setOpenAreas] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAreaId, setSelectedAreaId] = useState(null);

    // --- Fetch de Datos (Sin cambios) ---
    useEffect(() => {
        const fetchAreasData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get("/api/areas"); // Ajusta endpoint si es necesario
                // Validar que la respuesta contenga un array
                if (response?.data && Array.isArray(response.data)) {
                   setAreas(response.data);
                } else if (response?.data?.areas && Array.isArray(response.data.areas)) { // Otra posible estructura API
                   setAreas(response.data.areas);
                } else {
                   console.warn("Respuesta API inesperada para áreas:", response.data);
                   setError("Formato de datos de áreas incorrecto.");
                   setAreas([]);
                }
            } catch (err) {
                 console.error("Error fetching areas:", err);
                setError(err.response?.data?.message || err.message || "Error al cargar áreas.");
                setAreas([]);
            } finally {
                setLoading(false);
            }
        };
        fetchAreasData();
    }, []);

    // --- Handlers (Sin cambios) ---
    const handleAreaClick = (areaId, areaName) => {
        setSelectedAreaId(areaId);
        if (typeof onSelectArea === 'function') { onSelectArea(areaId, areaName); }
        if (typeof onCloseDrawer === 'function') { onCloseDrawer(); }
    };

    // --- Renderizado Condicional (Sin cambios) ---
    if (!theme) return <Box sx={{ p: 2 }}>Cargando...</Box>; // Fallback tema
    if (loading) return <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}><CircularProgress size={30} /></Box>; // Indicador carga
    if (error) return ( // Mensaje error estilizado
        <Box sx={{ p: 1.5, mx: 1.5, mt: 2, borderRadius: 1, border: 1, borderColor: 'error.light', bgcolor: alphaHelper(theme.palette.error.main, 0.1) }}>
            <Typography color="error.dark" variant="body2" sx={{ fontSize: '0.85rem' }}>Error al cargar áreas: {error}</Typography>
        </Box>
    );

    // --- Renderizado Principal (CON ESTILOS DE SidebarAdmin) ---
    return (
        <Box sx={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden', bgcolor: 'background.paper' }}>
            <List sx={{ pt: 2, pb: 2, px: 0 }}>

                {/* === Cabecera Desplegable (ESTILO IDÉNTICO a SidebarAdmin) === */}
                <ListItemButton
                    onClick={() => setOpenAreas(!openAreas)}
                    sx={{
                        mx: 1.5, // Margen horizontal
                        mb: 1.5, // Margen inferior
                        py: 0.5, // Padding vertical reducido
                        borderRadius: 1, // Bordes redondeados
                        color: 'text.primary', // Color texto por defecto
                        '&:hover': { bgcolor: 'action.hover' }, // Efecto hover
                    }}
                >
                    {/* Icono de la Cabecera */}
                    <ListItemIcon sx={{ minWidth: '40px', color: 'inherit' }}>
                        <HeaderIcon fontSize="small"/> {/* Icono Actualizado */}
                    </ListItemIcon>
                    {/* Texto de la Cabecera */}
                    <ListItemText
                        primary={headerTitle.toUpperCase()} // Texto en mayúsculas
                        primaryTypographyProps={{
                            fontWeight: 700, // Negrita
                            variant: 'overline', // Estilo overline
                            letterSpacing: '0.5px', // Espaciado letras
                            fontSize: '0.8rem' // Tamaño fuente
                        }}
                    />
                    {/* Icono de Flecha Animado (IDÉNTICO a SidebarAdmin) */}
                    <Box sx={{
                        ml: 'auto', display: 'flex', alignItems: 'center',
                        transition: theme.transitions.create('transform', { duration: theme.transitions.duration.short }),
                        transform: openAreas ? 'rotate(0deg)' : 'rotate(-90deg)' // Rotación
                    }}>
                        {openAreas ? <ExpandLess /> : <ExpandMore />}
                    </Box>
                </ListItemButton>

                {/* === Contenedor Colapsable con los Ítems de Área === */}
                <Collapse in={openAreas} timeout={300} unmountOnExit>
                    {/* Lista interna SIN padding adicional */}
                    <List component="div" disablePadding>
                        {areas.length > 0 ? (
                            areas.map((area) => {
                                // Validación simple por si algún área viene mal de la API
                                if (!area?.id_area || !area?.nombre_area) return null;
                                const isSelected = area.id_area === selectedAreaId;
                                return (
                                    // *** Usar el MISMO componente estilizado AdminSubItemButton ***
                                    <AdminSubItemButton
                                        key={area.id_area}
                                        selected={isSelected}
                                        onClick={() => handleAreaClick(area.id_area, area.nombre_area)}
                                    >
                                        {/* Icono del Ítem de Área */}
                                        <ListItemIcon>
                                            <AreaIcon fontSize="small" /> {/* Icono Actualizado */}
                                        </ListItemIcon>
                                        {/* Texto del Ítem de Área */}
                                        <ListItemText primary={area.nombre_area} />
                                    </AdminSubItemButton>
                                );
                            })
                        ) : (
                            // Mensaje si no hay áreas (estilo simple pero visible)
                             <Typography sx={{ pl: 4, py:1, color: 'text.disabled', fontStyle: 'italic', fontSize: '0.9rem' }}>
                                No hay áreas disponibles.
                             </Typography>
                        )}
                    </List>
                </Collapse>
                 {/* Puedes añadir otras cabeceras/secciones aquí si es necesario */}
            </List>
        </Box>
    );
};

// No necesitas defaultProps si siempre pasas las props requeridas desde el componente padre.
// Si quieres asegurarte, puedes mantenerlas:
/*
SidebarVecino.defaultProps = {
    onSelectArea: () => {},
    onCloseDrawer: () => {},
    headerTitle: "ÁREAS",
};
*/

export default SidebarVecino;