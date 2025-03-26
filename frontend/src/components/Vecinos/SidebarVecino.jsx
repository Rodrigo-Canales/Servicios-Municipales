import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    List, ListItemButton, ListItemIcon, ListItemText, Collapse, Box, Typography,
    CircularProgress, useTheme, styled // Asegúrate que styled esté aquí
} from "@mui/material";
import {
    ExpandLess, ExpandMore,
    // Iconos para Sidebar Vecino (Elige los que prefieras)
    Workspaces as HeaderIcon,       // Icono para la cabecera "ÁREAS"
    Folder as AreaIcon              // Icono para cada ítem de Área
} from "@mui/icons-material";

// --- Función Helper para Opacidad (COPIADA de SidebarAdmin) ---
// (Debe estar aquí si no la tienes importada globalmente)
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

// --- Componente Estilizado para Sub-Items (COPIADO de SidebarAdmin) ---
// Usaremos este mismo componente para los ítems de Área
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
        minWidth: '38px', // Ajusta el espacio antes del texto
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
// Se añade una prop 'headerTitle' para poder cambiar el título "ÁREAS" desde fuera
const SidebarVecino = ({ onSelectArea, onCloseDrawer, headerTitle = "ÁREAS" }) => {
    const theme = useTheme(); // Obtiene el tema del contexto (provisto por ThemeProvider)
    const [areas, setAreas] = useState([]);
    const [openAreas, setOpenAreas] = useState(true); // Estado para el collapse, renombrado para claridad
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAreaId, setSelectedAreaId] = useState(null);

    // --- Fetch de Datos (Sin cambios en la lógica) ---
    useEffect(() => {
        const fetchAreasData = async () => { // Renombrado para evitar conflicto
            setLoading(true);
            setError(null);
            try {
                // Asegúrate que la URL sea correcta (ajusta si es necesario)
                const response = await axios.get("/api/areas");
                if (Array.isArray(response.data)) {
                    setAreas(response.data);
                } else {
                    setError("Formato de datos incorrecto."); setAreas([]);
                }
            } catch (err) {
                setError(err.message || "Error al cargar áreas."); setAreas([]);
            } finally {
                setLoading(false);
            }
        };
        fetchAreasData();
    }, []); // Se ejecuta solo al montar

    // --- Handlers (Sin cambios en la lógica) ---
    const handleAreaClick = (areaId, areaName) => {
        setSelectedAreaId(areaId);
        if (typeof onSelectArea === 'function') { onSelectArea(areaId, areaName); }
        if (typeof onCloseDrawer === 'function') { onCloseDrawer(); }
    };

    // --- Renderizado Condicional (Sin cambios en la lógica) ---
    // Fallback si el tema no está listo (poco probable con ThemeProvider)
    if (!theme) return <Box sx={{ p: 2 }}>Cargando...</Box>;
    if (loading) return <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}><CircularProgress size={30} /></Box>;
    if (error) return <Box sx={{ p: 2, mx: 1.5, borderRadius: 1, border: 1, borderColor: 'error.light', bgcolor: alphaHelper(theme.palette.error.main, 0.1) }}><Typography color="error.dark" variant="body2">Error: {error}</Typography></Box>;

    // --- Renderizado Principal (Con Estilos de SidebarAdmin) ---
    return (
        <Box sx={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden', bgcolor: 'background.paper' }}>
            <List sx={{ pt: 2, pb: 2, px: 0 }}>

                {/* === Cabecera "ÁREAS" Desplegable (ESTILO DE SidebarAdmin) === */}
                <ListItemButton
                    onClick={() => setOpenAreas(!openAreas)} // Controla el estado 'openAreas'
                    sx={{
                        mx: 1.5, mb: 1.5, py: 0.5, borderRadius: 1, color: 'text.primary',
                        '&:hover': { bgcolor: 'action.hover' },
                    }}
                >
                    <ListItemIcon sx={{ minWidth: '40px', color: 'inherit' }}>
                        <HeaderIcon fontSize="small"/> {/* Icono para la cabecera */}
                    </ListItemIcon>
                    <ListItemText
                        // Usar la prop 'headerTitle' para el texto
                        primary={headerTitle.toUpperCase()} // Convertir a mayúsculas como en Admin
                        primaryTypographyProps={{
                            fontWeight: 700, variant: 'overline', letterSpacing: '0.5px', fontSize: '0.8rem'
                        }}
                    />
                    {/* Icono de flecha animado (igual que SidebarAdmin) */}
                    <Box sx={{
                        ml: 'auto', display: 'flex', alignItems: 'center',
                        transition: theme.transitions.create('transform', { duration: theme.transitions.duration.short }),
                        transform: openAreas ? 'rotate(0deg)' : 'rotate(-90deg)' // Rotación igual que Admin
                    }}>
                        {/* Lógica de icono invertida para flecha abajo/arriba */}
                        {openAreas ? <ExpandLess /> : <ExpandMore />}
                    </Box>
                </ListItemButton>

                {/* === Contenedor Colapsable con los Ítems de Área === */}
                <Collapse in={openAreas} timeout={300} unmountOnExit>
                    <List component="div" disablePadding>
                        {areas.length > 0 ? (
                            areas.map((area) => {
                                if (!area?.id_area || !area?.nombre_area) return null; // Validación
                                const isSelected = area.id_area === selectedAreaId;
                                return (
                                    // Usar el MISMO componente estilizado que SidebarAdmin
                                    <AdminSubItemButton
                                        key={area.id_area}
                                        selected={isSelected}
                                        onClick={() => handleAreaClick(area.id_area, area.nombre_area)}
                                    >
                                        <ListItemIcon>
                                            <AreaIcon fontSize="small" /> {/* Icono para cada área */}
                                        </ListItemIcon>
                                        {/* El texto del área viene de la API */}
                                        <ListItemText primary={area.nombre_area} />
                                    </AdminSubItemButton>
                                );
                            })
                        ) : (
                            // Mensaje si no hay áreas (estilo simple)
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

// Opcional: Puedes quitar defaultProps si usas TypeScript o confías en el padre
/*
SidebarVecino.defaultProps = {
    onSelectArea: () => {},
    onCloseDrawer: () => {},
    headerTitle: "ÁREAS", // Título por defecto
};
*/

export default SidebarVecino;