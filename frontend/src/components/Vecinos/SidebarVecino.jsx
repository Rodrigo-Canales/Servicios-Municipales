// frontend/src/components/Vecinos/SidebarVecino.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
    List, ListItemButton, ListItemIcon, ListItemText, Collapse, Box,
    Typography, useTheme, styled // Asegúrate que styled esté importado
} from "@mui/material";
import {
    ExpandLess, ExpandMore, // Para el collapse principal
    Business as AreasIcon, // Icono para header y sub-items de área
    ListAlt as MisSolicitudesIcon,
    HelpOutline as ConsultasIcon,
    QuestionAnswer as FaqIcon,
    // No se necesita TipoSolicitudIcon aquí
} from "@mui/icons-material";

// --- Función Helper para Opacidad (Idéntica a SidebarAdmin) ---
function alphaHelper(color, opacity) {
    if (!color || typeof color !== 'string') return 'rgba(0,0,0,0)';
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (match) { return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${opacity})`; }
    const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (hexMatch) { const r = parseInt(hexMatch[1], 16); const g = parseInt(hexMatch[2], 16); const b = parseInt(hexMatch[3], 16); return `rgba(${r}, ${g}, ${b}, ${opacity})`; }
    const hexAlphaMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (hexAlphaMatch) { const r = parseInt(hexAlphaMatch[1], 16); const g = parseInt(hexAlphaMatch[2], 16); const b = parseInt(hexAlphaMatch[3], 16); return `rgba(${r}, ${g}, ${b}, ${opacity})`; }
    // console.warn("alphaHelper function received unexpected color format:", color); // Opcional
    return color; // Devolver color original si no se reconoce formato
}

// --- Componente Estilizado para Sub-Items (Áreas dentro del Collapse) ---
// Renombrado y mantenido idéntico a AdminSubItemButton
const StyledSubItemButton = styled(ListItemButton)(({ theme, selected }) => ({
    paddingLeft: theme.spacing(4), // Indentación de sub-item
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    marginBottom: theme.spacing(0.5),
    borderRadius: theme.shape.borderRadius,
    marginInline: theme.spacing(1.5),
    transition: theme.transitions.create(['background-color', 'color', 'transform'], { duration: theme.transitions.duration.short }),
    color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
    backgroundColor: selected ? alphaHelper(theme.palette.primary.main, 0.12) : 'transparent',
    '& .MuiListItemText-primary': {
        fontWeight: selected ? 600 : 500,
        fontSize: '0.92rem',
    },
    '& .MuiListItemIcon-root': {
        color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
        minWidth: '38px', // Alineación ícono sub-item
        transition: theme.transitions.create(['color'], { duration: theme.transitions.duration.short }),
    },
    '&:hover': {
        // Usar theme.palette.action.hover como en AdminSubItemButton
        backgroundColor: selected ? alphaHelper(theme.palette.primary.main, 0.16) : theme.palette.action.hover,
        color: theme.palette.text.primary,
        '& .MuiListItemIcon-root': {
            color: theme.palette.text.primary,
        },
    },
}));
// --- Fin Componente Estilizado ---


// --- Componente SidebarVecino ---
const SidebarVecino = ({
    currentSection,
    onSelectSection,
    onCloseDrawer,
    areas = [],
}) => {
    const theme = useTheme();
    const [openAreasHeader, setOpenAreasHeader] = useState(true); // Estado para el Collapse principal

    // Click handler para el header "ÁREAS"
    const handleAreasHeaderClick = () => { setOpenAreasHeader(!openAreasHeader); };

    // Helper para verificar si una sección (área o top-level) está activa
    const isActive = (sectionName) => currentSection === sectionName;
    const isAreaActive = (areaId) => currentSection === `area-${areaId}`;

    // Click handler unificado para todos los items seleccionables
    const handleItemClick = (sectionName) => {
        if (typeof onSelectSection === 'function') {
            onSelectSection(sectionName);
        }
        if (typeof onCloseDrawer === 'function') {
            onCloseDrawer();
        }
    };

    // Fallback si el tema no está listo
    if (!theme) return <Box sx={{ p: 2 }}>Cargando...</Box>;

    // Función para generar los estilos SX de los items de Nivel Superior
    // Replicando el estilo visual de StyledSubItemButton pero sin indentación
    const getTopLevelItemSx = (selected) => ({
        paddingLeft: theme.spacing(1.5), // Sin indentación extra
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
        marginBottom: theme.spacing(0.5),
        borderRadius: theme.shape.borderRadius,
        marginInline: theme.spacing(1.5),
        transition: theme.transitions.create(['background-color', 'color', 'transform'], { duration: theme.transitions.duration.short }),
        // Colores basados en selección (replicando StyledSubItemButton)
        // *Usar text.primary para no seleccionados como en Admin* <- CORRECCIÓN: Admin usa text.secondary, mantenemos eso.
        color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
        backgroundColor: selected ? alphaHelper(theme.palette.primary.main, 0.12) : 'transparent',
        '& .MuiListItemText-primary': {
            fontWeight: selected ? 600 : 500,
            fontSize: '0.92rem',
        },
        '& .MuiListItemIcon-root': {
            // Ícono con color secundario si no está seleccionado
            color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
            minWidth: '40px', // Alinear con ícono del header
            transition: theme.transitions.create(['color'], { duration: theme.transitions.duration.short }),
        },
        '&:hover': {
             // Replicar hover de StyledSubItemButton
            backgroundColor: selected ? alphaHelper(theme.palette.primary.main, 0.16) : theme.palette.action.hover,
            color: theme.palette.text.primary,
            '& .MuiListItemIcon-root': {
                color: theme.palette.text.primary,
            },
        },
    });


    return (
        <Box sx={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden', bgcolor: 'background.paper' }}>
            {/* Lista principal */}
            <List sx={{ pt: 2, pb: 2, px: 0 }}>

                {/* === Cabecera "ÁREAS" Desplegable (Estilo idéntico a Admin "Gestionar") === */}
                <ListItemButton
                    onClick={handleAreasHeaderClick}
                    sx={{
                        mx: 1.5,
                        mb: 1.5, // Igual que en Admin
                        py: 0.5,
                        borderRadius: 1,
                        color: 'text.primary', // Igual que en Admin
                        '&:hover': { bgcolor: 'action.hover' }, // Igual que en Admin
                    }}
                >
                    <ListItemIcon sx={{ minWidth: '40px', color: 'inherit' }}>
                        <AreasIcon fontSize="small"/> {/* Icono de Área */}
                    </ListItemIcon>
                    <ListItemText
                        primary="ÁREAS" // Texto cambiado
                        primaryTypographyProps={{
                            fontWeight: 700,
                            variant: 'overline',
                            letterSpacing: '0.5px',
                            fontSize: '0.8rem' // Igual que en Admin
                        }}
                    />
                    {/* Icono de despliegue (igual que en Admin) */}
                    <Box sx={{
                        ml: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        transition: theme.transitions.create('transform', { duration: theme.transitions.duration.short }),
                        transform: openAreasHeader ? 'rotate(0deg)' : 'rotate(-90deg)'
                    }}>
                        {openAreasHeader ? <ExpandLess /> : <ExpandMore />}
                    </Box>
                </ListItemButton>

                {/* === Contenedor Colapsable con los Sub-items de Área === */}
                <Collapse in={openAreasHeader} timeout={300} unmountOnExit>
                    {/* Lista interna SIN padding adicional */}
                    <List component="div" disablePadding>
                        {areas.length > 0 ? (
                            areas.map((area) => {
                                const areaSectionId = `area-${area.id_area}`;
                                return (
                                     // Usar el StyledSubItemButton (ex-AdminSubItemButton)
                                    <StyledSubItemButton
                                        key={area.id_area}
                                        selected={isAreaActive(area.id_area)}
                                        onClick={() => handleItemClick(areaSectionId)}
                                    >
                                        <ListItemIcon>
                                            {/* Icono de Área para los sub-items */}
                                            <AreasIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText primary={area.nombre_area} />
                                    </StyledSubItemButton>
                                );
                            })
                        ) : (
                             <Typography variant="caption" sx={{ pl: 4, color: 'text.secondary', fontStyle: 'italic' }}>
                                Cargando áreas...
                             </Typography>
                        )}
                    </List>
                </Collapse>

                {/* === Ítems de Nivel Superior (Fuera del Collapse) === */}

                <ListItemButton
                    selected={isActive('mis-solicitudes')}
                    onClick={() => handleItemClick('mis-solicitudes')}
                    sx={getTopLevelItemSx(isActive('mis-solicitudes'))} // Aplicar estilo calculado
                >
                    <ListItemIcon><MisSolicitudesIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Mis Solicitudes" />
                </ListItemButton>

                <ListItemButton
                    selected={isActive('consultas')}
                    onClick={() => handleItemClick('consultas')}
                    sx={getTopLevelItemSx(isActive('consultas'))} // Aplicar estilo calculado
                >
                    <ListItemIcon><ConsultasIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Consultas" />
                </ListItemButton>

                <ListItemButton
                    selected={isActive('preguntas-frecuentes')}
                    onClick={() => handleItemClick('preguntas-frecuentes')}
                    sx={getTopLevelItemSx(isActive('preguntas-frecuentes'))} // Aplicar estilo calculado
                >
                    <ListItemIcon><FaqIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Preguntas Frecuentes" />
                </ListItemButton>

            </List>
        </Box>
    );
};

SidebarVecino.propTypes = {
    currentSection: PropTypes.string,
    onSelectSection: PropTypes.func.isRequired,
    onCloseDrawer: PropTypes.func,
    areas: PropTypes.arrayOf(PropTypes.shape({
        id_area: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        nombre_area: PropTypes.string.isRequired,
    })).isRequired,
    // tiposSolicitudes prop ya no es necesaria aquí
};

export default SidebarVecino;