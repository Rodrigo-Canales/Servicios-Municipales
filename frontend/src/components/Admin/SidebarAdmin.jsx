import React, { useState } from 'react';
import {
    List, ListItemButton, ListItemIcon, ListItemText, Collapse, Box,
    Typography, useTheme, styled // Asegúrate que alpha esté aquí
} from "@mui/material";
import {
    ExpandLess, ExpandMore, Settings as SettingsIcon, // Icono cabecera
    People as PeopleIcon,                           // Icono Usuarios
    Business as AreasIcon,                          // Icono Áreas
    Category as TiposIcon,                          // Icono Tipos Solicitudes
    Description as SolicitudesIcon                  // Icono Solicitudes
} from "@mui/icons-material";

// --- Función Helper para Opacidad (copiada de SidebarVecino) ---
function alphaHelper(color, opacity) {
    // Implementación simple, espera rgb() o rgba() o colores del tema que se resuelven a eso
    if (!color || typeof color !== 'string') return 'rgba(0,0,0,0)'; // Fallback más robusto
    // Intenta hacer match con rgb/rgba
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (match) {
        return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${opacity})`;
    }
    // Si es un color hexadecimal #rgb o #rrggbb
    const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (hexMatch) {
        const r = parseInt(hexMatch[1], 16);
        const g = parseInt(hexMatch[2], 16);
        const b = parseInt(hexMatch[3], 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
     // Si es #rgba o #rrggbbaa
     const hexAlphaMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
     if (hexAlphaMatch) {
         const r = parseInt(hexAlphaMatch[1], 16);
         const g = parseInt(hexAlphaMatch[2], 16);
         const b = parseInt(hexAlphaMatch[3], 16);
         // La opacidad viene del color, pero la función pide una, priorizamos la pedida.
         return `rgba(${r}, ${g}, ${b}, ${opacity})`;
     }

    // Si no coincide con formatos conocidos, devuelve un color transparente o loggea un warning
    console.warn("alphaHelper function received unexpected color format:", color);
    // Podrías intentar usar el theme.palette.augmentColor si estuviera disponible aquí,
    // pero es más complejo. Devolver transparente es más seguro.
    return 'rgba(0,0,0,0)';
}


// --- Componente Estilizado para Sub-Items (ESTILOS DE AreaListItemButton) ---
const AdminSubItemButton = styled(ListItemButton)(({ theme, selected }) => ({
    paddingLeft: theme.spacing(4), // Indentación consistente (igual que AreaListItemButton)
    paddingTop: theme.spacing(1),    // Igual que AreaListItemButton
    paddingBottom: theme.spacing(1), // Igual que AreaListItemButton
    marginBottom: theme.spacing(0.5), // Espacio entre ítems (igual)
    borderRadius: theme.shape.borderRadius, // Usa el borde redondeado del tema (igual)
    marginInline: theme.spacing(1.5), // Margen horizontal (igual)
    transition: theme.transitions.create(['background-color', 'color', 'transform'], { // Transiciones suaves (igual)
        duration: theme.transitions.duration.short,
    }),
    // Color diferente si está seleccionado (lógica igual que AreaListItemButton)
    color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
    // Fondo diferente si está seleccionado (lógica igual que AreaListItemButton, usando alphaHelper)
    backgroundColor: selected ? alphaHelper(theme.palette.primary.main, 0.12) : 'transparent',
    // Estilos de fuente específicos cuando está seleccionado
    '& .MuiListItemText-primary': {
        fontWeight: selected ? 600 : 500, // Peso del texto (igual que AreaListItemButton)
        fontSize: '0.92rem', // Tamaño de fuente (igual que AreaListItemButton)
    },
    // Estilo del icono (puedes ajustar el color si prefieres que coincida con el texto)
    '& .MuiListItemIcon-root': {
        color: selected ? theme.palette.primary.main : theme.palette.text.secondary, // Coincide con el color del texto
        minWidth: '38px', // Ajusta según necesites espacio antes del texto
        transition: theme.transitions.create(['color'], { duration: theme.transitions.duration.short }),
    },
    // Estilos en hover (igual que AreaListItemButton, usando alphaHelper)
    '&:hover': {
        backgroundColor: selected ? alphaHelper(theme.palette.primary.main, 0.16) : theme.palette.action.hover,
        color: theme.palette.text.primary, // Texto primario al hacer hover (igual)
        // Icono también cambia color en hover para consistencia
        '& .MuiListItemIcon-root': {
            color: theme.palette.text.primary,
        },
    },
}));
// --- Fin Componente Estilizado ---


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

    // Fallback si el tema no está listo (aunque debería estarlo via ThemeProvider padre)
    if (!theme) return <Box sx={{ p: 2 }}>Cargando...</Box>;

    return (
        <Box sx={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden', bgcolor: 'background.paper' }}>
            {/* Lista principal con padding igual que SidebarVecino */}
            <List sx={{ pt: 2, pb: 2, px: 0 }}>

                {/* === Cabecera "Gestionar" Desplegable (ESTILO DE SidebarVecino) === */}
                <ListItemButton
                    onClick={handleGestionarClick}
                    sx={{
                        // Estilos copiados de la cabecera "AREAS" de SidebarVecino
                        mx: 1.5,
                        mb: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        color: 'text.primary',
                        '&:hover': { bgcolor: 'action.hover' },
                    }}
                >
                    <ListItemIcon sx={{ minWidth: '40px', color: 'inherit' }}> {/* Icono hereda color */}
                        <SettingsIcon fontSize="small"/> {/* Icono puede ser small o default */}
                    </ListItemIcon>
                    <ListItemText
                        primary="GESTIONAR" // Texto en mayúsculas como "AREAS"
                        primaryTypographyProps={{
                            // Estilos copiados de la cabecera "AREAS" de SidebarVecino
                            fontWeight: 700,
                            variant: 'overline',
                            letterSpacing: '0.5px',
                            fontSize: '0.8rem'
                        }}
                    />
                    {/* Icono de flecha animado (igual que SidebarVecino) */}
                    <Box sx={{
                        ml: 'auto', // Empuja el icono a la derecha
                        display: 'flex',
                        alignItems: 'center',
                        transition: theme.transitions.create('transform', { duration: theme.transitions.duration.short }),
                        transform: openGestionar ? 'rotate(0deg)' : 'rotate(-90deg)' // Rotación -90 grados como en Vecino
                    }}>
                        {openGestionar ? <ExpandLess /> : <ExpandMore />}
                        {/* Nota: SidebarVecino usa ExpandMore cuando está cerrado y rota -90. Aquí usamos la lógica inversa para que la flecha apunte hacia abajo al cerrar. Si quieres que sea idéntico a Vecino (flecha derecha al cerrar), invierte el icono y la rotación:
                        transform: openGestionar ? 'rotate(0deg)' : 'rotate(-90deg)'
                           {openGestionar ? <ExpandLess /> : <ExpandMore />} // -> Cambia a ExpandMore por defecto y ExpandLess cuando está abierto si usas la rotación -90
                        Decidí mantener la flecha abajo/arriba que es más intuitivo para un menú vertical, pero la rotación -90 está aplicada como en Vecino. Si prefieres la flecha derecha/abajo, descomenta la línea de abajo y comenta la de arriba.
                        */}
                         {/* {openGestionar ? <ExpandLess /> : <ExpandMore />} */}
                    </Box>
                </ListItemButton>

                {/* === Contenedor Colapsable con los Sub-items === */}
                <Collapse in={openGestionar} timeout={300} unmountOnExit>
                    {/* Lista interna SIN padding adicional, el estilo viene del botón */}
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

                        {/* Sub-Item Usuarios */}
                        <AdminSubItemButton selected={isActive('usuarios')} onClick={() => handleItemClick('usuarios')}>
                            <ListItemIcon><PeopleIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Usuarios" />
                        </AdminSubItemButton>

                        {/* Puedes añadir más items aquí si es necesario */}

                    </List>
                </Collapse>
                {/* Puedes añadir otras cabeceras principales aquí si es necesario */}
            </List>
        </Box>
    );
};

export default SidebarAdmin;