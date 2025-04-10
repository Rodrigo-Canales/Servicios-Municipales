import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    AppBar, Toolbar, Typography, Box, IconButton, Tooltip, alpha,
    Avatar,
    Stack
} from "@mui/material";
import { Menu as MenuIcon, Logout as LogoutIcon } from "@mui/icons-material";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from '../contexts/useAuth';

// Helper function to get initials
const getInitials = (nombre = '', apellido = '') => {
    const firstInitial = nombre?.[0]?.toUpperCase() || '';
    const lastInitial = apellido?.[0]?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}` || '?';
};

const Navbar = ({ toggleTheme, toggleSidebar, title = "Municipalidad", logoLink = "/" }) => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const userInitials = user ? getInitials(user.nombre, user.apellido) : '';
    const userFullName = user ? `${user.nombre || ''} ${user.apellido || ''}`.trim() : 'Usuario';

    return (
        <AppBar
            position="fixed"
            elevation={2}
            sx={{
                zIndex: (theme) => theme.zIndex.drawer + 1,
                bgcolor: 'primary.main',
                transition: (theme) => theme.transitions.create(['background-color'], {
                    duration: theme.transitions.duration.standard,
                }),
            }}
        >
            <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: { xs: 56, sm: 64 } }}>

                {/* Left Side: Menu Button (Mobile), Logo, and Title */}
                <Stack direction="row" spacing={{ xs: 1, sm: 2 }} alignItems="center" sx={{ flexShrink: 0 }}> {/* Added flexShrink */}
                    {/* Mobile Menu Button */}
                    {typeof toggleSidebar === 'function' && (
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={toggleSidebar}
                            sx={{
                                display: { md: 'none' },
                                padding: '8px',
                                transition: (theme) => theme.transitions.create(['background-color', 'transform'], { duration: theme.transitions.duration.short }),
                                '&:hover': { bgcolor: (theme) => alpha(theme.palette.common.white, 0.1), transform: 'scale(1.1)' }
                            }}>
                            <MenuIcon />
                        </IconButton>
                    )}

                    {/* Logo with Link */}
                    <Link to={logoLink} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                        <Box component="img" src="/LOGO PITRUFQUEN.png" alt="Logo Municipalidad"
                            sx={{
                                width: { xs: 38, sm: 45 }, height: { xs: 38, sm: 45 }, display: 'block',
                                transition: (theme) => theme.transitions.create('transform', { duration: theme.transitions.duration.short }),
                                "&:hover": { transform: "scale(1.12)" },
                            }}
                        />
                    </Link>

                     {/* Title (Moved to the left stack) */}
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{
                            // Removed flexGrow: 1
                            fontWeight: "bold",
                            color: 'primary.contrastText',
                            fontSize: { xs: "1rem", sm: "1.1rem", md: "1.25rem" },
                            userSelect: 'none',
                            whiteSpace: 'nowrap',
                            // Hide on mobile if too cramped, show from sm upwards
                            display: { xs: 'none', sm: 'block' }
                        }}>
                        {title}
                    </Typography>

                </Stack>

                 {/* Spacer Box - Pushes Right Side Content */}
                <Box sx={{ flexGrow: 1 }} />


                {/* Right Side: Controls */}
                <Stack direction="row" spacing={1} alignItems="center" ml={1} sx={{ flexShrink: 0 }}> {/* Added flexShrink */}
                    {/* Theme Toggle */}
                    {typeof toggleTheme === 'function' && <ThemeToggle toggleTheme={toggleTheme} />}

                    {/* User Info & Logout */}
                    {user && (
                        <Stack direction="row" spacing={1} alignItems="center" >
                            <Tooltip title={userFullName}>
                                <Avatar sx={{
                                    width: {xs: 30, sm: 34 }, height: {xs: 30, sm: 34 },
                                    fontSize: {xs: '0.8rem', sm: '0.875rem'},
                                    bgcolor: 'secondary.main', color: 'secondary.contrastText',
                                    cursor: 'default'
                                    }}>
                                    {userInitials}
                                </Avatar>
                            </Tooltip>

                            <Tooltip title="Cerrar Sesión">
                                <IconButton color="inherit" aria-label="cerrar sesión" onClick={handleLogout}
                                    sx={{
                                        padding: '8px',
                                        transition: (theme) => theme.transitions.create(['background-color', 'transform'], { duration: theme.transitions.duration.short }),
                                        '&:hover': { bgcolor: (theme) => alpha(theme.palette.common.white, 0.1), transform: 'scale(1.1)' }
                                    }}>
                                    <LogoutIcon />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    )}
                </Stack>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;