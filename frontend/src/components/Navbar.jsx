import React from "react";
import { Link } from 'react-router-dom';
import {
    AppBar, Toolbar, Typography, Box, IconButton, Tooltip, alpha
} from "@mui/material";
import { Menu as MenuIcon, Logout as LogoutIcon } from "@mui/icons-material";
// Asumiendo que ThemeToggle está en la misma carpeta o en Common
import ThemeToggle from "./ThemeToggle"; // Ajusta si ThemeToggle está en otra parte

// --- Props ---
// toggleTheme: Función para cambiar el tema (light/dark)
// toggleSidebar: Función para mostrar/ocultar el sidebar en móvil
// title: Título a mostrar (ej: "Portal Ciudadano", "Panel de Administración")
// logoLink: Ruta a la que enlaza el logo (ej: "/", "/admin", "/vecinos") - Opcional

const Navbar = ({ toggleTheme, toggleSidebar, title = "Municipalidad", logoLink = "/" }) => {

    // Placeholder para logout
    const handleLogout = () => {
        console.log("Cerrar Sesión clickeado (sin funcionalidad)");
        // Aquí iría la lógica real (llamar a contexto, limpiar token, redirigir)
    };

    return (
        <AppBar
            position="fixed"
            elevation={1} // Sombra estándar del tema
            sx={{
                zIndex: (theme) => theme.zIndex.drawer + 1, // Por encima del drawer
                bgcolor: 'primary.main', // Color primario del tema
                transition: (theme) => theme.transitions.create(['background-color'], {
                    duration: theme.transitions.duration.short,
                }),
            }}
        >
            <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: { xs: 56, sm: 64 } }}>
                {/* Botón Menú Móvil (Hamburguesa) */}
                {/* Solo se muestra si toggleSidebar es una función válida */}
                {typeof toggleSidebar === 'function' && (
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={toggleSidebar}
                        sx={{
                            display: { md: 'none' }, // Oculto en escritorio
                            mr: { xs: 1, sm: 1.5 },
                            cursor: 'pointer',
                            padding: '8px',
                            transition: (theme) => theme.transitions.create(['background-color', 'transform'], { duration: theme.transitions.duration.short }),
                            '&:hover': { bgcolor: (theme) => alpha(theme.palette.common.white, 0.1), transform: 'scale(1.1)' }
                        }}>
                        <MenuIcon />
                    </IconButton>
                )}

                {/* Logo con Enlace Dinámico */}
                <Link to={logoLink} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', marginRight: { md: 2 } }}> {/* Añadido margen en escritorio */}
                    <Box component="img" src="/LOGO PITRUFQUEN.png" alt="Logo Municipalidad"
                        sx={{
                            width: { xs: 38, sm: 45 }, height: { xs: 38, sm: 45 }, display: 'block', cursor: 'pointer',
                            transition: (theme) => theme.transitions.create('transform', { duration: theme.transitions.duration.short }),
                            "&:hover": { transform: "scale(1.12)", filter: 'brightness(1.1)' },
                        }} />
                </Link>

                {/* Título Dinámico */}
                <Typography variant="h6" component="div"
                    sx={{
                        flexGrow: 1, fontWeight: "bold", color: 'primary.contrastText',
                        fontSize: { xs: "1rem", sm: "1.1rem", md: "1.2rem" }, // Ajustado tamaño
                        textAlign: { xs: 'center', md: 'left' },
                        // Quita margen izquierdo si el botón hamburguesa no está (escritorio)
                        ml: { xs: 1, md: typeof toggleSidebar === 'function' ? 0 : 2 },
                        userSelect: 'none',
                        whiteSpace: 'nowrap', // Evitar que el título se parta
                        overflow: 'hidden',   // Ocultar si es muy largo
                        textOverflow: 'ellipsis' // Puntos suspensivos si es muy largo
                    }}>
                    {title}
                </Typography>

                {/* Controles a la Derecha */}
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}> {/* Margen izquierdo para separar del título */}
                    {/* Mostrar ThemeToggle si la función existe */}
                    {typeof toggleTheme === 'function' && <ThemeToggle toggleTheme={toggleTheme} />}

                    {/* Botón Logout */}
                    <Tooltip title="Cerrar Sesión">
                        <IconButton color="inherit" aria-label="cerrar sesión" onClick={handleLogout}
                            sx={{
                                ml: 1, cursor: 'pointer', padding: '8px',
                                transition: (theme) => theme.transitions.create(['background-color', 'transform'], { duration: theme.transitions.duration.short }),
                                '&:hover': { bgcolor: (theme) => alpha(theme.palette.common.white, 0.1), transform: 'scale(1.1)' }
                            }}>
                            <LogoutIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;