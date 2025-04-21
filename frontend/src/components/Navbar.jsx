import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    AppBar, Toolbar, Typography, Box, IconButton, Tooltip,
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
            elevation={0}
            sx={{
                zIndex: (theme) => theme.zIndex.drawer + 1,
                background: (theme) => theme.palette.primary.main,
                boxShadow: (theme) => theme.shadows[4],
                borderBottom: (theme) => `1.5px solid ${theme.palette.primary.dark}`,
                color: (theme) => theme.palette.primary.contrastText,
                backdropFilter: 'blur(7px)',
                WebkitBackdropFilter: 'blur(7px)',
                transition: (theme) => theme.transitions.create(['background-color', 'box-shadow'], {
                    duration: theme.transitions.duration.standard,
                }),
            }}
        >
            <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: { xs: 56, sm: 64 }, px: { xs: 1, sm: 2 } }}>

                {/* Left Side: Menu Button (Mobile), Logo, and Title */}
                <Stack direction="row" spacing={{ xs: 1, sm: 2 }} alignItems="center" sx={{ flexShrink: 0 }}>
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
                                borderRadius: 2.5,
                                background: (theme) => theme.palette.primary.dark,
                                boxShadow: (theme) => theme.shadows[1],
                                transition: (theme) => theme.transitions.create(['background-color', 'transform', 'box-shadow'], { duration: theme.transitions.duration.short }),
                                '&:hover': {
                                    bgcolor: (theme) => theme.palette.secondary.main,
                                    color: (theme) => theme.palette.secondary.contrastText,
                                    transform: 'scale(1.1)',
                                    boxShadow: (theme) => theme.shadows[4],
                                }
                            }}>
                            <MenuIcon />
                        </IconButton>
                    )}

                    {/* Logo con Link, solo imagen grande sin Box ni borde ni fondo */}
                    <Link to={logoLink} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                        <img
                            src="/LOGO PITRUFQUEN.png"
                            alt="Logo Municipalidad"
                            style={{
                                width: '60px',
                                height: '60px',
                                objectFit: 'contain',
                                display: 'block',
                                marginRight: 12,
                            }}
                        />
                    </Link>

                     {/* Title (Moved to the left stack) */}
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{
                            fontWeight: 800,
                            color: (theme) => theme.palette.primary.contrastText,
                            fontSize: { xs: "1rem", sm: "1.1rem", md: "1.25rem" },
                            userSelect: 'none',
                            whiteSpace: 'nowrap',
                            letterSpacing: 0.7,
                            textShadow: (theme) => `0 2px 8px ${theme.palette.primary.dark}22`,
                            textTransform: 'uppercase',
                            display: { xs: 'none', sm: 'block' }
                        }}>
                        {title}
                    </Typography>

                </Stack>

                 {/* Spacer Box - Pushes Right Side Content */}
                <Box sx={{ flexGrow: 1 }} />


                {/* Right Side: Controls */}
                <Stack direction="row" spacing={1} alignItems="center" ml={1} sx={{ flexShrink: 0 }}>
                    {/* Theme Toggle */}
                    {typeof toggleTheme === 'function' && <ThemeToggle toggleTheme={toggleTheme} />}

                    {/* User Info & Logout */}
                    {user && (
                        <Stack direction="row" spacing={1} alignItems="center" >
                            <Tooltip title={userFullName}>
                                <Avatar sx={{
                                    width: { xs: 30, sm: 34 }, height: { xs: 30, sm: 34 },
                                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                    bgcolor: (theme) => theme.palette.secondary.main, color: (theme) => theme.palette.secondary.contrastText,
                                    fontWeight: 700,
                                    border: (theme) => `2px solid ${theme.palette.primary.light}`,
                                    boxShadow: (theme) => theme.shadows[1],
                                    transition: 'box-shadow 0.18s, border 0.18s',
                                    cursor: 'default',
                                    '&:hover': {
                                        boxShadow: (theme) => theme.shadows[4],
                                        border: (theme) => `2px solid ${theme.palette.secondary.main}`,
                                    },
                                }}>
                                    {userInitials}
                                </Avatar>
                            </Tooltip>

                            <Tooltip title="Cerrar Sesión">
                                <IconButton color="inherit" aria-label="cerrar sesión" onClick={handleLogout}
                                    sx={{
                                        padding: '8px',
                                        borderRadius: 2.5,
                                        background: (theme) => theme.palette.primary.dark,
                                        boxShadow: (theme) => theme.shadows[1],
                                        transition: (theme) => theme.transitions.create(['background-color', 'transform', 'box-shadow'], { duration: theme.transitions.duration.short }),
                                        '&:hover': {
                                            bgcolor: (theme) => theme.palette.secondary.main,
                                            color: (theme) => theme.palette.secondary.contrastText,
                                            transform: 'scale(1.1)',
                                            boxShadow: (theme) => theme.shadows[4],
                                        }
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