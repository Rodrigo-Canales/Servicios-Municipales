import React from "react"; // No se necesita useState aquí si no hay formulario
import axios from 'axios';
import { Box, Button, Grid, Typography, List, ListItem, Fade } from '@mui/material'; // Añadido Fade
import LoginIcon from '@mui/icons-material/Login';
import { useTheme } from '@mui/material/styles';
import ThemeToggle from '../ThemeToggle'; // Asumiendo que este componente existe

const ClaveUnica = ({ toggleTheme }) => {
    const theme = useTheme();

    // La lógica para llamar al backend de Clave Única se mantiene
    const handleLogin = async () => {
        try {
            // Asegúrate que esta URL sea correcta para tu backend
            const response = await axios.get('http://localhost:3001/api/auth/claveunica/login');
            // Redirigir al usuario a la URL de Clave Única proporcionada por el backend
            if (response.data.redirectUrl) {
                window.location.href = response.data.redirectUrl;
            } else {
                console.error('No se recibió URL de redirección desde el backend.');
                // Podrías mostrar un error al usuario aquí si lo deseas
            }
        } catch (error) {
            console.error('Error al iniciar sesión con Clave Única:', error);
            // Mostrar un mensaje de error al usuario (ej: usando Swal o un Alert de MUI)
            alert(`Error al intentar iniciar sesión con Clave Única: ${error.message || 'Error desconocido'}`);
        }
    };

    return (
        <Grid container sx={{ minHeight: '100vh' }}>
            {/* Panel Izquierdo (Información) - Estilo replicado del Login */}
            <Grid
                item
                xs={12}
                md={5}
                sx={{
                    bgcolor: 'primary.main', // Color sólido primario
                    color: theme.palette.primary.contrastText,
                    p: { xs: 3, md: 4 },
                    display: 'flex', flexDirection: 'column', justifyContent: 'center',
                    borderRight: { md: `1px solid ${theme.palette.divider}` }
                }}
            >
                <Fade in={true} timeout={1000}>
                    <Box sx={{ textAlign: 'center', mb: { xs: 2, md: 3 } }}>
                        <Box
                            component="img"
                            src="/LOGO PITRUFQUEN.png" // Asegúrate que la ruta sea correcta
                            alt="Logo Municipalidad"
                            sx={{ width: { xs: '150px', md: '200px' }, mb: 2 }}
                        />
                        <Typography variant="h4" fontWeight="bold" gutterBottom component="h1">
                            Municipalidad de Pitrufquén
                        </Typography>
                        <Typography variant="h6" sx={{ fontStyle: 'italic', opacity: 0.9 }}>
                            Municipio Ciudadano
                        </Typography>
                    </Box>
                </Fade>
            </Grid>

            {/* Panel Derecho (Botón Clave Única) - Estilo replicado del Login */}
            <Grid
                item
                xs={12}
                md={7}
                sx={{
                    bgcolor: 'background.default',
                    color: 'text.primary',
                    p: { xs: 3, sm: 4, md: 6 },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                }}
            >
                {/* Botón para cambiar tema */}
                <Box sx={{ position: 'absolute', top: { xs: 16, md: 24 }, right: { xs: 16, md: 24 } }}>
                    {typeof toggleTheme === 'function' && <ThemeToggle toggleTheme={toggleTheme} />}
                </Box>

                {/* Contenedor Central (Reemplaza el formulario) */}
                <Fade in={true} timeout={1000}>
                    <Box
                        sx={{
                            width: '100%',
                            maxWidth: 600, // Más ancho que el login
                            mx: 'auto',
                            backgroundColor: 'background.paper',
                            boxShadow: { xs: 2, md: 4 },
                            borderRadius: 3,
                            p: { xs: 3, md: 4 },
                            border: `1.5px solid ${theme.palette.primary.light}`,
                            fontFamily: 'Montserrat, Arial, sans-serif',
                        }}
                    >
                        <Typography variant="h5" fontWeight="bold" gutterBottom component="h2" sx={{ color: 'primary.main' }}>
                            Sistema de Solicitudes Ciudadanas
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 2, mb: 2 }}>
                            Estimado Vecino/a, utilice esta nueva plataforma para ingresar sus solicitudes.
                        </Typography>

                        {/* Lista de instrucciones */}
                        <List sx={{ mt: 2, mb: 3, listStyleType: 'disc', pl: { xs: 2, sm: 4}, textAlign: 'left', display: 'inline-block' }}>
                            <ListItem sx={{ display: 'list-item', py: 0.5 }}>
                                Deje su Clave Única.
                            </ListItem>
                            <ListItem sx={{ display: 'list-item', py: 0.5 }}>
                                Aprete el botón de "Iniciar sesión con Clave Única".
                            </ListItem>
                            <ListItem sx={{ display: 'list-item', py: 0.5 }}>
                                Será redirijido al portal de Clave Única
                            </ListItem>
                            <ListItem sx={{ display: 'list-item', py: 0.5 }}>
                                Ingrese con sus datos (Rut y Contraseña)
                            </ListItem>
                            <ListItem sx={{ display: 'list-item', py: 0.5 }}>
                                Si inicia correctamente será redirijido al "Portal de Vecinos".
                            </ListItem>
                        </List>

                        {/* Botón Clave Única con estilo mejorado */}
                        <Box sx={{ mt: 2 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                sx={{
                                    py: 1.5,
                                    px: 3, // Padding horizontal
                                    fontSize: '1rem',
                                    display: 'inline-flex', // Para que el botón se ajuste al contenido
                                    alignItems: 'center',
                                    gap: 1, // Espacio entre icono y texto
                                    borderRadius: 2,
                                    fontWeight: 'bold',
                                    transition: 'transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
                                    '&:hover': {
                                        transform: 'translateY(-1px)',
                                        boxShadow: theme.shadows[4],
                                    },
                                }}
                                onClick={handleLogin} // Llama a la función handleLogin existente
                                startIcon={<LoginIcon />} // Icono al inicio
                            >
                                Iniciar sesión con Clave Única
                            </Button>
                        </Box>
                    </Box>
                </Fade>
            </Grid>
        </Grid>
    );
};

export default ClaveUnica;