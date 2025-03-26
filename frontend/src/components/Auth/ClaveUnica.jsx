import axios from 'axios';
import { Box, Button, Grid, Typography, List, ListItem } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import { useTheme } from '@mui/material/styles';
import ThemeToggle from '../ThemeToggle';

const ClaveUnica = ({ toggleTheme }) => {
    const theme = useTheme();

    const handleLogin = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/auth/claveunica/login');
            window.location.href = response.data.redirectUrl;
        } catch (error) {
            console.error('Error al iniciar sesión con Clave Única:', error);
        }
    };

    return (
        <Grid container sx={{ minHeight: '100vh' }}>
            {/* Panel Izquierdo: Solo logo y nombre en fondo con gradiente basado en el tema */}
            <Grid
                item
                xs={12}
                md={5}
                sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark || theme.palette.primary.main} 0%, ${theme.palette.primary.main} 100%)`,
                    color: theme.palette.common.white,
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Box
                        component="img"
                        src="/LOGO PITRUFQUEN.png"
                        alt="Logo Municipalidad"
                        sx={{ width: '200px', mb: 2 }}
                    />
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Municipalidad de Pitrufquén
                    </Typography>
                    <Typography variant="h6" sx={{ fontStyle: 'italic' }}>
                        Municipio Ciudadano
                    </Typography>
                </Box>
            </Grid>

            {/* Panel Derecho: Tarjeta con texto informativo y botón */}
            <Grid
                item
                xs={12}
                md={7}
                sx={{
                    bgcolor: 'background.default',
                    color: 'text.primary',
                    p: 6,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    position: 'relative'
                }}
            >
                {/* Botón de cambio de tema en la esquina superior derecha */}
                <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                    <ThemeToggle toggleTheme={toggleTheme} />
                </Box>

                {/* Tarjeta (card) con la información */}
                <Box
                    sx={{
                        maxWidth: 600,
                        mx: 'auto',
                        backgroundColor: 'background.paper',
                        boxShadow: 4,
                        borderRadius: 2,
                        p: { xs: 2, md: 4 },
                    }}
                >
                    <Typography variant="h5" fontWeight="bold" gutterBottom align="center">
                        Sistema de Solicitudes Ciudadanas
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 2 }}>
                        Estimado ciudadano, utilice esta nueva plataforma para ingresar sus requerimientos al Municipio.
                    </Typography>

                    <List sx={{ mt: 2, listStyleType: 'disc', pl: 4 }}>
                        <ListItem sx={{ display: 'list-item' }}>
                            Deje su Clave Única.
                        </ListItem>
                        <ListItem sx={{ display: 'list-item' }}>
                            Ingrese los datos del requerimiento que el Municipio pone a su disposición.
                        </ListItem>
                        <ListItem sx={{ display: 'list-item' }}>
                            Ingrese los datos del requirente y la modalidad.
                        </ListItem>
                        <ListItem sx={{ display: 'list-item' }}>
                            Usted recibirá inmediatamente un NÚMERO DE TICKET.
                        </ListItem>
                        <ListItem sx={{ display: 'list-item' }}>
                            Con ese número de ticket podrá realizar seguimiento.
                        </ListItem>
                    </List>

                    <Box sx={{ textAlign: 'center' }}>
                        <Button
                            variant="contained"
                            color="primary"
                            sx={{
                                py: 1.5,
                                fontSize: '1rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 1,
                                borderRadius: 2,
                                fontWeight: 'bold',
                                mt: 2
                            }}
                            onClick={handleLogin}
                        >
                            <LoginIcon /> Iniciar sesión con Clave Única
                        </Button>
                    </Box>
                </Box>
            </Grid>
        </Grid>
    );
};

export default ClaveUnica;