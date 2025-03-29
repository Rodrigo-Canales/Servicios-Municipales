import React from 'react';
import { Link, useNavigate } from 'react-router-dom'; // *** 1. Importar useNavigate ***
import {
    AppBar, Toolbar, Typography, Box, IconButton, Tooltip, alpha
} from "@mui/material";
import { Menu as MenuIcon, Logout as LogoutIcon } from "@mui/icons-material";
// Asumiendo que ThemeToggle está en la misma carpeta o en Common
import ThemeToggle from "./ThemeToggle"; // Ajusta si ThemeToggle está en otra parte
// *** 2. Importar useAuth ***
import { useAuth } from '../contexts/useAuth.jsx'; // O .js si así se llama el archivo

// --- Props ---
// toggleTheme: Función para cambiar el tema (light/dark)
// toggleSidebar: Función para mostrar/ocultar el sidebar en móvil
// title: Título a mostrar (ej: "Portal Ciudadano", "Panel de Administración")
// logoLink: Ruta a la que enlaza el logo (ej: "/", "/admin", "/vecinos") - Opcional

const Navbar = ({ toggleTheme, toggleSidebar, title = "Municipalidad", logoLink = "/" }) => {

    // *** 3. Obtener logout y user (opcionalmente) del contexto ***
    const { logout, user } = useAuth(); // Obtenemos la función logout
    // *** 4. Obtener la función navigate ***
    const navigate = useNavigate();

    // Función para manejar el cierre de sesión
    const handleLogout = () => {
        console.log("Cerrando sesión...");
        logout(); // Llama a la función del contexto para limpiar estado y localStorage
        navigate('/login'); // Redirige al usuario a la página de login
    };

    return (
        <AppBar
            position="fixed"
            elevation={1}
            sx={{
                zIndex: (theme) => theme.zIndex.drawer + 1,
                bgcolor: 'primary.main',
                transition: (theme) => theme.transitions.create(['background-color'], {
                    duration: theme.transitions.duration.short,
                }),
            }}
        >
            <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: { xs: 56, sm: 64 } }}>
                {/* Botón Menú Móvil (Hamburguesa) */}
                {typeof toggleSidebar === 'function' && (
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={toggleSidebar}
                        sx={{
                            display: { md: 'none' },
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
                <Link to={logoLink} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', marginRight: { md: 2 } }}>
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
                        fontSize: { xs: "1rem", sm: "1.1rem", md: "1.2rem" },
                        textAlign: { xs: 'center', md: 'left' },
                        ml: { xs: 1, md: typeof toggleSidebar === 'function' ? 0 : 2 },
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                    {title}
                </Typography>

                {/* Controles a la Derecha */}
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                    {/* Mostrar ThemeToggle si la función existe */}
                    {typeof toggleTheme === 'function' && <ThemeToggle toggleTheme={toggleTheme} />}

                    {/* Botón Logout - Solo se muestra si hay un usuario logueado */}
                    {user && ( // Verifica si hay un usuario en el contexto
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
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;