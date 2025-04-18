// frontend/src/components/Funcionarios/SidebarFuncionario.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
    Box, List, ListItemButton, ListItemIcon, ListItemText,
    Collapse, Typography, useTheme, styled,
    CircularProgress, Divider
} from '@mui/material';
import {
    ExpandLess, ExpandMore,
    AccountBox as TipoSolicitudIcon,
    CircleOutlined as PendientesIcon,
    CheckCircleOutline as ResueltasIcon,
    Logout as LogoutIcon
} from '@mui/icons-material';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../contexts/useAuth';
import api from '../../services/api';

// Helper function for rgba colors
function alphaHelper(color, opacity) {
    if (!color || typeof color !== 'string') return 'rgba(0,0,0,0)';
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (match) { return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${opacity})`; }
    const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (hexMatch) {
        const r = parseInt(hexMatch[1], 16);
        const g = parseInt(hexMatch[2], 16);
        const b = parseInt(hexMatch[3], 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return color;
}

// Styled component for sub-items
const StyledSubItemButton = styled(ListItemButton)(({ theme, selected }) => ({
    paddingLeft: theme.spacing(4),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    marginBottom: theme.spacing(0.5),
    borderRadius: theme.shape.borderRadius,
    marginInline: theme.spacing(1.5),
    transition: theme.transitions.create(['background-color', 'color', 'transform'], {
        duration: theme.transitions.duration.short
    }),
    color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
    backgroundColor: selected ? alphaHelper(theme.palette.primary.main, 0.12) : 'transparent',
    '& .MuiListItemText-primary': {
        fontWeight: selected ? 600 : 500,
        fontSize: '0.92rem',
    },
    '& .MuiListItemIcon-root': {
        color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
        minWidth: '38px',
        transition: theme.transitions.create(['color'], {
            duration: theme.transitions.duration.short
        }),
    },
    '&:hover': {
        backgroundColor: selected ? alphaHelper(theme.palette.primary.main, 0.16) : theme.palette.action.hover,
        color: theme.palette.text.primary,
        '& .MuiListItemIcon-root': {
            color: theme.palette.text.primary,
        },
    },
}));

function SidebarFuncionario({ currentSection, onSelectSection, onCloseDrawer }) {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [openArea, setOpenArea] = useState(true);
    const [tiposDelArea, setTiposDelArea] = useState([]);
    const [loadingTipos, setLoadingTipos] = useState(true);
    const [errorTipos, setErrorTipos] = useState(null);

    useEffect(() => {
        let isMounted = true;
        setLoadingTipos(true);
        setErrorTipos(null);

        if (user?.area_id) {
            api.get(`/tipos_solicitudes/area/${user.area_id}`)
                .then(response => {
                    if (!isMounted) return;
                    if (response && response.data && Array.isArray(response.data)) {
                        setTiposDelArea(response.data);
                    } else {
                        console.error("Unexpected response format:", response);
                        setErrorTipos("Formato de respuesta inesperado del servidor.");
                        setTiposDelArea([]);
                    }
                    setLoadingTipos(false);
                })
                .catch(error => {
                    if (!isMounted) return;
                    console.error("Error fetching tipos:", error);
                    setErrorTipos("Error al cargar tipos de solicitud.");
                    setTiposDelArea([]);
                    setLoadingTipos(false);
                });
        } else {
            setTiposDelArea([]);
            setLoadingTipos(false);
            if (user && !user.area_id) {
                setErrorTipos("Usuario no tiene área asignada.");
            } else {
                setErrorTipos(null);
            }
        }

        return () => {
            isMounted = false;
        };
    }, [user, user?.area_id]);

    const handleAreaHeaderClick = () => { setOpenArea(!openArea); };
    const handleSelectionClick = (selectionId) => {
        if (currentSection !== selectionId) {
            if (typeof onSelectSection === 'function') {
                onSelectSection(selectionId);
            }
        }
        if (typeof onCloseDrawer === 'function') {
            onCloseDrawer();
        }
    };
    const handleLogout = () => {
        logout();
        navigate('/login');
        if (typeof onCloseDrawer === 'function') {
            onCloseDrawer();
        }
    };

    // Estilo para el Header del Área
    const getAreaHeaderSx = () => ({
        mx: 1.5,
        mb: 1.5,
        py: 0.5,
        borderRadius: 1,
        color: 'text.primary',
        backgroundColor: 'transparent',
        '&:hover': { bgcolor: 'action.hover' },
        '& .MuiListItemText-primary': {
            fontWeight: 700,
            variant: 'overline',
            letterSpacing: '0.5px',
            fontSize: '0.8rem'
        },
        '& .MuiListItemIcon-root': {
            minWidth: '40px',
            color: 'inherit',
        },
    });

    const isSubItemSelected = (tipoId, estado) => {
        return currentSection === `tipo-${tipoId}-${estado}`;
    };

    const getLogoutButtonSx = () => ({
        mx: 1.5,
        mb: 1.5,
        py: 0.5,
        borderRadius: 1,
        color: 'text.primary',
        backgroundColor: 'transparent',
        '&:hover': { bgcolor: 'action.hover' },
        '& .MuiListItemText-primary': {
            fontWeight: 500,
            fontSize: '0.9rem',
        },
        '& .MuiListItemIcon-root': {
            minWidth: '40px',
            color: 'inherit',
        },
    });

    if (!user) {
        return <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress size={30} /></Box>;
    }

    if (!user.area_id || !user.nombre_area) {
        return (
            <Box sx={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column' }}>
                <List sx={{ pt: 2, pb: 2, px: 0, flexGrow: 1 }}>
                    <Typography sx={{ px: 2, py: 1, color: 'error.main', textAlign: 'center', fontStyle: 'italic' }}>
                        Usuario no tiene área asignada.
                    </Typography>
                </List>
                <Divider sx={{ mt: 'auto' }} />
                <List sx={{ p:0, pb: 1 }}>
                    <ListItemButton onClick={handleLogout} sx={getLogoutButtonSx()}>
                        <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Cerrar Sesión" primaryTypographyProps={{fontWeight: 500}}/>
                    </ListItemButton>
                </List>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden', bgcolor: 'background.paper' }}>
            <List sx={{ pt: 2, pb: 2, px: 0 }}>
                {/* Header dinámico con nombre de área */}
                <ListItemButton
                    onClick={handleAreaHeaderClick}
                    sx={getAreaHeaderSx()}
                >
                    <ListItemIcon>
                        <TipoSolicitudIcon fontSize="small"/>
                    </ListItemIcon>
                    <ListItemText
                        primary={user?.nombre_area ? user.nombre_area.toUpperCase() : 'ÁREA FUNCIONARIO'}
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
                        transition: theme.transitions.create('transform', {
                            duration: theme.transitions.duration.short
                        }),
                        transform: openArea ? 'rotate(0deg)' : 'rotate(-90deg)'
                    }}>
                        {openArea ? <ExpandLess /> : <ExpandMore />}
                    </Box>
                </ListItemButton>

                {/* Contenedor Colapsable */}
                <Collapse in={openArea} timeout={300} unmountOnExit>
                    <List component="div" disablePadding>
                        {loadingTipos && (
                            <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
                                <CircularProgress size={24} />
                            </Box>
                        )}
                        
                        {errorTipos && (
                            <Typography variant="caption" sx={{ pl: 4, py: 1, color: 'error.main', display: 'block' }}>
                                {errorTipos}
                            </Typography>
                        )}
                        
                        {!loadingTipos && !errorTipos && tiposDelArea.length === 0 && (
                            <Typography variant="caption" sx={{ pl: 4, py: 1, color: 'text.secondary', fontStyle: 'italic', display: 'block' }}>
                                No hay tipos de solicitud para esta área.
                            </Typography>
                        )}

                        {!loadingTipos && !errorTipos && tiposDelArea.map((tipo) => {
                            const pendientesId = `tipo-${tipo.id_tipo}-pendientes`;
                            const resueltasId = `tipo-${tipo.id_tipo}-resueltas`;

                            return (
                                <Box key={tipo.id_tipo}>
                                    <Typography
                                        sx={{
                                            paddingLeft: theme.spacing(4),
                                            paddingRight: theme.spacing(2),
                                            paddingTop: theme.spacing(1.5),
                                            paddingBottom: theme.spacing(0.5),
                                            fontWeight: 500,
                                            fontSize: '0.9rem',
                                            color: theme.palette.text.primary,
                                            display: 'block',
                                        }}
                                    >
                                        {tipo.nombre_tipo}
                                    </Typography>
                                    {/* Pendientes */}
                                    <StyledSubItemButton
                                        selected={isSubItemSelected(tipo.id_tipo, 'pendientes')}
                                        onClick={() => handleSelectionClick(pendientesId)}
                                    >
                                        <ListItemIcon>
                                            <PendientesIcon fontSize="small"/>
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Pendientes"
                                            primaryTypographyProps={{
                                                style: { fontSize: '0.9rem' }
                                            }}
                                        />
                                    </StyledSubItemButton>
                                    {/* Resueltas */}
                                    <StyledSubItemButton
                                        selected={isSubItemSelected(tipo.id_tipo, 'resueltas')}
                                        onClick={() => handleSelectionClick(resueltasId)}
                                    >
                                        <ListItemIcon>
                                            <ResueltasIcon fontSize="small"/>
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Resueltas"
                                            primaryTypographyProps={{
                                                style: { fontSize: '0.9rem' }
                                            }}
                                        />
                                    </StyledSubItemButton>
                                </Box>
                            );
                        })}
                    </List>
                </Collapse>
            </List>
        </Box>
    );
}

SidebarFuncionario.propTypes = {
    currentSection: PropTypes.string,
    onSelectSection: PropTypes.func.isRequired,
    onCloseDrawer: PropTypes.func
};

export default SidebarFuncionario;