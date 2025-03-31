import React, { useState } from 'react';
import {
    List, ListItemButton, ListItemIcon, ListItemText, Collapse, Box,
    Typography, useTheme, styled // Asegúrate que styled esté importado
} from "@mui/material";
import {
    ExpandLess, ExpandMore, Settings as SettingsIcon,
    People as PeopleIcon,
    Business as AreasIcon,
    Category as TiposIcon,
    Description as SolicitudesIcon,
    QuestionAnswer as FaqIcon,
    RateReview as RespuestasIcon 
} from "@mui/icons-material";

// --- Función Helper para Opacidad (Restaurada) ---
// (Copiada de la versión anterior, asegura que funcione con colores del tema)
function alphaHelper(color, opacity) {
    if (!color || typeof color !== 'string') return 'rgba(0,0,0,0)';
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (match) { return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${opacity})`; }
    const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (hexMatch) { const r = parseInt(hexMatch[1], 16); const g = parseInt(hexMatch[2], 16); const b = parseInt(hexMatch[3], 16); return `rgba(${r}, ${g}, ${b}, ${opacity})`; }
    const hexAlphaMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (hexAlphaMatch) { const r = parseInt(hexAlphaMatch[1], 16); const g = parseInt(hexAlphaMatch[2], 16); const b = parseInt(hexAlphaMatch[3], 16); return `rgba(${r}, ${g}, ${b}, ${opacity})`; }
    console.warn("alphaHelper function received unexpected color format:", color);
    return 'rgba(0,0,0,0)';
}


// --- Componente Estilizado para Sub-Items (Restaurado) ---
const AdminSubItemButton = styled(ListItemButton)(({ theme, selected }) => ({
    paddingLeft: theme.spacing(4),
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
        minWidth: '38px',
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


// --- Componente SidebarAdmin ---
const SidebarAdmin = ({ currentSection, onSelectSection, onCloseDrawer }) => {
    const theme = useTheme();
    const [openGestionar, setOpenGestionar] = useState(true); // Estado para el Collapse

    const handleGestionarClick = () => { setOpenGestionar(!openGestionar); };
    const isActive = (sectionName) => currentSection === sectionName;

    const handleItemClick = (sectionName) => {
        if (typeof onSelectSection === 'function') {
            onSelectSection(sectionName);
        }
        // Cerrar drawer en móvil después de la selección
        if (typeof onCloseDrawer === 'function') {
            onCloseDrawer();
        }
    };

    // Fallback si el tema no está listo
    if (!theme) return <Box sx={{ p: 2 }}>Cargando...</Box>;

    return (
        <Box sx={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden', bgcolor: 'background.paper' }}>
            {/* Lista principal */}
            <List sx={{ pt: 2, pb: 2, px: 0 }}>

                {/* === Cabecera "Gestionar" Desplegable (Restaurada) === */}
                <ListItemButton
                    onClick={handleGestionarClick}
                    sx={{
                        mx: 1.5,
                        mb: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        color: 'text.primary',
                        '&:hover': { bgcolor: 'action.hover' },
                    }}
                >
                    <ListItemIcon sx={{ minWidth: '40px', color: 'inherit' }}>
                        <SettingsIcon fontSize="small"/>
                    </ListItemIcon>
                    <ListItemText
                        primary="GESTIONAR"
                        primaryTypographyProps={{
                            fontWeight: 700,
                            variant: 'overline',
                            letterSpacing: '0.5px',
                            fontSize: '0.8rem'
                        }}
                    />
                    <Box sx={{
                        ml: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        transition: theme.transitions.create('transform', { duration: theme.transitions.duration.short }),
                        transform: openGestionar ? 'rotate(0deg)' : 'rotate(-90deg)' // Rotación -90 grados
                    }}>
                        {/* Mantenemos ExpandLess/ExpandMore para lógica arriba/abajo visualmente */}
                        {openGestionar ? <ExpandLess /> : <ExpandMore />}
                    </Box>
                </ListItemButton>

                {/* === Contenedor Colapsable con los Sub-items === */}
                <Collapse in={openGestionar} timeout={300} unmountOnExit>
                    {/* Lista interna SIN padding adicional */}
                    <List component="div" disablePadding>

                        {/* Sub-Item Áreas */}
                        <AdminSubItemButton selected={isActive('areas')} onClick={() => handleItemClick('areas')}>
                            <ListItemIcon><AreasIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Áreas" />
                        </AdminSubItemButton>

                        {/* Sub-Item Tipos Solicitudes */}
                        <AdminSubItemButton selected={isActive('tipos-solicitudes')} onClick={() => handleItemClick('tipos-solicitudes')}>
                            <ListItemIcon><TiposIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Tipos de Solicitudes" />
                        </AdminSubItemButton>

                        {/* Sub-Item Solicitudes */}
                        <AdminSubItemButton selected={isActive('solicitudes')} onClick={() => handleItemClick('solicitudes')}>
                            <ListItemIcon><SolicitudesIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Solicitudes" />
                        </AdminSubItemButton>

                        {/* NUEVO: Sub-Item Respuestas */}
                        <AdminSubItemButton selected={isActive('respuestas')} onClick={() => handleItemClick('respuestas')}>
                            <ListItemIcon><RespuestasIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Respuestas" />
                        </AdminSubItemButton>

                        {/* NUEVO: Sub-Item Preguntas Frecuentes */}
                        <AdminSubItemButton selected={isActive('preguntas-frecuentes')} onClick={() => handleItemClick('preguntas-frecuentes')}>
                            <ListItemIcon><FaqIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Preguntas Frecuentes" />
                        </AdminSubItemButton>

                        {/* Sub-Item Usuarios */}
                        <AdminSubItemButton selected={isActive('usuarios')} onClick={() => handleItemClick('usuarios')}>
                            <ListItemIcon><PeopleIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Usuarios" />
                        </AdminSubItemButton>

                    </List>
                </Collapse>
                {/* Puedes añadir otras cabeceras principales aquí si es necesario */}
            </List>
        </Box>
    );
};

export default SidebarAdmin;