import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    List, ListItemButton, ListItemText, Collapse, Box, Typography,
    CircularProgress, useTheme // Importa useTheme para acceder a transiciones
} from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { styled } from '@mui/material/styles'; // Para estilos más complejos o reutilizables

// Componente estilizado para el botón del área (opcional, pero bueno para organización)
const AreaListItemButton = styled(ListItemButton)(({ theme, selected }) => ({
    paddingLeft: theme.spacing(4), // Indentación consistente
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    marginBottom: theme.spacing(0.5), // Espacio entre ítems
    borderRadius: theme.shape.borderRadius, // Usa el borde redondeado del tema
    marginInline: theme.spacing(1.5), // Margen horizontal
    transition: theme.transitions.create(['background-color', 'color', 'transform'], { // Transiciones suaves
        duration: theme.transitions.duration.short,
    }),
    color: selected ? theme.palette.primary.main : theme.palette.text.secondary, // Color diferente si está seleccionado
    backgroundColor: selected ? alpha(theme.palette.primary.main, 0.12) : 'transparent', // Fondo diferente si está seleccionado
    fontWeight: selected ? 600 : 400, // Más peso si está seleccionado

    '& .MuiListItemText-primary': { // Estilo específico para el texto primario del item
        fontWeight: selected ? 600 : 500, // Peso del texto
        fontSize: '0.92rem', // Tamaño de fuente ligeramente ajustado
    },

    '&:hover': {
        backgroundColor: selected ? alpha(theme.palette.primary.main, 0.16) : theme.palette.action.hover, // Hover diferente si ya está seleccionado
        color: theme.palette.text.primary, // Texto primario al hacer hover
        // transform: 'translateX(3px)', // Opcional: ligero desplazamiento en hover
    },
}));


const SidebarVecino = ({ onSelectArea, theme: incomingTheme, onCloseDrawer }) => {
    // Usa el tema proporcionado o el del contexto si no se proporciona (fallback)
    const theme = useTheme() || incomingTheme;
    const [areas, setAreas] = useState([]);
    const [openSolicitudes, setOpenSolicitudes] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAreaId, setSelectedAreaId] = useState(null); // Estado para el área seleccionada

    // --- Verificación de Props Esenciales (solo si es estrictamente necesario) ---
    // En una app real, podrías confiar en que el padre pase las props correctas,
    // o usar PropTypes/TypeScript. Los console.error pueden ser ruidosos.
    /*
    useEffect(() => {
        if (!theme) { console.error("SidebarVecino Error: Prop 'theme' no proporcionada."); }
        if (typeof onSelectArea !== 'function') { console.error("SidebarVecino Error: Prop 'onSelectArea' debe ser una función."); }
    }, [theme, onSelectArea]);
    */

    // --- Fetch de Datos ---
    useEffect(() => {
        const fetchAreas = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get("http://localhost:3001/api/areas");
                if (Array.isArray(response.data)) {
                    setAreas(response.data);
                } else {
                    console.error("API no devolvió un array para áreas:", response.data);
                    setError("Formato de datos incorrecto.");
                    setAreas([]);
                }
            } catch (err) {
                console.error("Error al obtener áreas:", err);
                setError(err.message || "Error al cargar áreas.");
                setAreas([]);
            } finally {
                setLoading(false);
            }
        };
        fetchAreas();
    }, []);

    // --- Handlers ---
    const handleAreaClick = (areaId, areaName) => {
        setSelectedAreaId(areaId); // Actualiza el estado de selección
        if (typeof onSelectArea === 'function') {
            onSelectArea(areaId, areaName);
        }
        if (typeof onCloseDrawer === 'function') {
            onCloseDrawer(); // Cierra el drawer móvil si la función existe
        }
    };

    // --- Renderizado Condicional ---
    if (!theme) { // Fallback si el tema aún no está disponible
        return <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}><CircularProgress size={24} /></Box>;
    }
    if (loading) {
        return <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}><CircularProgress size={30} color="primary" /></Box>;
    }
    if (error) {
        return  <Box sx={{ p: 2, mx: 1, borderRadius: 1, bgcolor: 'error.lighter', border: 1, borderColor: 'error.light' }}>
                    <Typography color="error.dark" variant="body2">Error al cargar áreas: {error}</Typography>
                </Box>;
    }

    // --- Renderizado Principal ---
    return (
        // Box contenedor con scroll si es necesario
        <Box sx={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden', bgcolor: 'background.paper' }}>
            {/* Añadir un padding general a la lista */}
            <List sx={{ pt: 2, pb: 2, px: 0 }}>
                {/* Cabecera "AREAS" */}
                <ListItemButton
                    onClick={() => setOpenSolicitudes(!openSolicitudes)}
                    sx={{
                        // Estilo más prominente
                        // bgcolor: 'action.focus', // Fondo sutil si se desea
                        mx: 1.5, // Margen horizontal
                        mb: 1.5, // Margen inferior
                        py: 0.5, // Padding vertical reducido
                        borderRadius: 1,
                        color: 'text.primary',
                        '&:hover': { bgcolor: 'action.hover' },
                    }}
                >
                    <ListItemText
                        primary="ÁREAS"
                        primaryTypographyProps={{
                            fontWeight: 700, // Más peso
                            variant: 'overline', // Estilo overline o subtitle2
                            letterSpacing: '0.5px', // Espaciado letras
                            fontSize: '0.8rem' // Tamaño ajustado
                        }}
                    />
                    {/* Animación suave para el icono */}
                    <Box sx={{ transition: theme.transitions.create('transform', { duration: theme.transitions.duration.short }) , transform: openSolicitudes ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                        {openSolicitudes ? <ExpandLess /> : <ExpandMore />}
                    </Box>
                </ListItemButton>

                {/* Contenedor Colapsable con animación */}
                <Collapse in={openSolicitudes} timeout={300} unmountOnExit>
                    {/* Lista de Áreas */}
                    <List component="div" disablePadding>
                        {areas.length > 0 ? (
                            areas.map((area) => {
                                // Validación básica del objeto area
                                if (!area?.id_area || !area?.nombre_area) {
                                    console.warn("Item de área inválido:", area);
                                    return null;
                                }
                                const isSelected = area.id_area === selectedAreaId; // Verifica si es el seleccionado
                                return (
                                    // Usar el componente AreaListItemButton estilizado
                                    <AreaListItemButton
                                        key={area.id_area}
                                        selected={isSelected} // Pasar prop 'selected'
                                        onClick={() => handleAreaClick(area.id_area, area.nombre_area)}
                                    >
                                        {/* El estilo del texto se controla dentro de AreaListItemButton */}
                                        <ListItemText primary={area.nombre_area} />
                                        {/* Podrías añadir un icono aquí si quisieras */}
                                        {/* {isSelected && <FiberManualRecordIcon sx={{ fontSize: 8, color: 'primary.main', ml: 'auto' }} />} */}
                                    </AreaListItemButton>
                                );
                            })
                        ) : (
                            // Mensaje si no hay áreas
                            <ListItem sx={{ pl: 4, mt: 1 }}>
                                <ListItemText
                                    primary="No hay áreas disponibles."
                                    primaryTypographyProps={{ variant: 'body2', color: 'text.disabled', fontStyle: 'italic' }}
                                />
                            </ListItem>
                        )}
                    </List>
                </Collapse>
                 {/* Aquí podrías añadir más secciones/items al sidebar */}
            </List>
        </Box>
    );
};

// Ya no se necesitan defaultProps si confías en el padre o usas TypeScript/PropTypes
/*
SidebarVecino.defaultProps = {
    onSelectArea: () => console.warn("SidebarVecino: prop 'onSelectArea' no fue proporcionada."),
    onCloseDrawer: null,
    theme: null,
};
*/

// Función helper para crear colores con opacidad (si no la tienes ya)
function alpha(color, opacity) {
  // Simple implementación, asume color es rgb() o rgba()
    if (!color) return 'rgba(0,0,0,0)';
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (match) {
        return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${opacity})`;
    }
    // Fallback muy básico si no es rgb/rgba (no recomendado para producción)
    console.warn("alpha function received non-rgb color:", color);
    return color;
}


export default SidebarVecino;