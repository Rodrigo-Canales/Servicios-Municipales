import React, { useState } from "react"; // Import React y useState
import { TextField, Button, Typography, Box, Grid, List, ListItem, IconButton, InputAdornment, Fade, CircularProgress } from "@mui/material"; // Añadir Fade y CircularProgress
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import ThemeToggle from "../ThemeToggle"; // Asumiendo que este componente existe y funciona
import Swal from "sweetalert2";

const Login = ({ toggleTheme }) => {
    const theme = useTheme();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false); // Estado de carga
    const navigate = useNavigate();

    // Validación de correo electrónico
    const validateEmail = (email) => /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);

    // Validación de contraseña (>= 8 caracteres)
    const validatePassword = (password) => password.length >= 8;

    const handleEmailChange = (e) => {
        const value = e.target.value;
        setEmail(value);
        setErrors((prev) => ({
            ...prev,
            email: validateEmail(value) ? "" : "Correo inválido",
        }));
    };

    const handlePasswordChange = (e) => {
        const value = e.target.value;
        setPassword(value);
        setErrors((prev) => ({
            ...prev,
            password: value && !validatePassword(value) ? "La contraseña debe tener al menos 8 caracteres" : "",
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const currentEmailError = validateEmail(email) ? "" : "Correo inválido";
        const currentPasswordError = password && !validatePassword(password) ? "La contraseña debe tener al menos 8 caracteres" : "";

        setErrors({ email: currentEmailError, password: currentPasswordError });

        if (currentEmailError || currentPasswordError || !email || !password) {
            Swal.fire({
                title: 'Error de Validación',
                text: 'Por favor, ingrese un correo y contraseña válidos.',
                icon: 'warning',
                confirmButtonText: 'Cerrar',
                confirmButtonColor: theme.palette.primary.main,
            });
            return;
        }

        setLoading(true);

        try {
            console.log("Datos enviados:", { correo_electronico: email, password: password });
            const response = await fetch('http://localhost:3001/api/auth/trabajadores/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo_electronico: email, password: password }),
            });

            const data = await response.json();
            console.log("Respuesta del servidor:", data);

            if (!response.ok) {
                throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
            }

            let mensaje = "";
            let destino = "";

            if (data.rol === 'Administrador') {
                mensaje = "Inicio de sesión exitoso como Administrador.";
                destino = "/admin";
            } else if (data.rol === 'Funcionario') {
                mensaje = "Inicio de sesión exitoso como Funcionario.";
                destino = "/funcionarios";
            } else {
                Swal.fire({
                    title: 'Acceso Denegado',
                    text: data.message || 'Rol no reconocido o sin permisos para esta área.',
                    icon: 'error',
                    confirmButtonText: 'Cerrar',
                    confirmButtonColor: theme.palette.primary.main,
                });
                return;
            }

            // Considera guardar info relevante (ej: rol, nombre) si la API la devuelve
            // localStorage.setItem('userRole', data.rol);

            Swal.fire({
                title: '¡Bienvenido!',
                text: mensaje,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false,
            }).then(() => {
                navigate(destino);
            });

        } catch (error) {
            console.error("Error en el login:", error.message);
            Swal.fire({
                title: 'Error de Inicio de Sesión',
                text: error.message || "Ocurrió un error inesperado. Intenta nuevamente.",
                icon: 'error',
                confirmButtonText: 'Cerrar',
                confirmButtonColor: theme.palette.primary.main,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Grid container sx={{ minHeight: '100vh' }}>
            {/* Panel Izquierdo (Información) */}
            <Grid
                item xs={12} md={5}
                sx={{
                    // MODIFICADO: Usar color sólido primario para coincidir con Navbar
                    bgcolor: 'primary.main', // <-- CAMBIO CLAVE AQUÍ
                    color: theme.palette.primary.contrastText, // Asegurar contraste
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
                    </Box>
                </Fade>

                <Fade in={true} timeout={1500}>
                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                        <Typography variant="h5" fontWeight="bold">
                            Sistema de Gestión de Solicitudes
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 2 }}>
                            Estimado funcionario, utilice esta nueva plataforma para gestionar sus Solicitudes Respetivas.
                        </Typography>
                        <Typography fontWeight="bold" variant="body1" sx={{ mt: 2 }}>
                            Por favor siga los pasos detallados a continuación:
                        </Typography>
                        <List sx={{ mt: 2, mb: 2, listStyleType: 'disc', pl: 4, textAlign: 'left', maxWidth: 450, mx:'auto' }}>
                            <ListItem sx={{ display: 'list-item', py: 0.5 }}>
                                Ingrese su correo institucional en el campo "Correo Institucional".
                            </ListItem>
                            <ListItem sx={{ display: 'list-item', py: 0.5 }}>
                                Ingrese la contraseña de su cuenta municipal en el campo "Contraseña".
                            </ListItem>
                            <ListItem sx={{ display: 'list-item', py: 0.5 }}>
                                Presione el botón de "Ingresar".
                            </ListItem>
                            <ListItem sx={{ display: 'list-item', py: 0.5 }}>
                                Una vez completado el proceso de inicio de sesión, podrá acceder a la plataforma y gestionar sus solicitudes.
                            </ListItem>
                        </List>
                        <Typography fontWeight="bold" variant="body1" sx={{ mt: 2 }}>
                            En caso de haber olvidado algún dato, por favor comunicarse con el administrador del sistema.
                        </Typography>
                    </Box>
                </Fade>
            </Grid>

            {/* Panel Derecho (Formulario de Login) */}
            <Grid
                item xs={12} md={7}
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
                    <ThemeToggle toggleTheme={toggleTheme} />
                </Box>

                {/* Contenedor del Formulario */}
                <Fade in={true} timeout={1000}>
                    <Box
                        sx={{
                            width: '100%',
                            maxWidth: 420,
                            mx: 'auto',
                            backgroundColor: 'background.paper',
                            boxShadow: { xs: 3, md: 6 },
                            borderRadius: 2,
                            p: { xs: 3, md: 4 },
                            border: `1px solid ${theme.palette.divider}`
                        }}
                    >
                        <Typography variant="h5" fontWeight="bold" gutterBottom align="center" component="h2">
                            Iniciar Sesión
                        </Typography>

                        {/* Formulario */}
                        <form onSubmit={handleSubmit} noValidate>
                            <TextField
                                label="Correo Institucional"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={email}
                                onChange={handleEmailChange}
                                error={!!errors.email}
                                helperText={errors.email || " "}
                                autoComplete="email"
                                sx={{ borderRadius: 1 }} // No backgroundColor explícito
                            />
                            <TextField
                                label="Contraseña"
                                type={showPassword ? "text" : "password"}
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={password}
                                onChange={handlePasswordChange}
                                error={!!errors.password}
                                helperText={errors.password || " "}
                                autoComplete="current-password"
                                sx={{ borderRadius: 1 }} // No backgroundColor explícito
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" aria-label="toggle password visibility">
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />
                            {/* Botón de Ingreso con indicador de carga */}
                            <Box sx={{ mt: 3, position: 'relative' }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    sx={{
                                        py: 1.5,
                                        borderRadius: 2,
                                        fontWeight: 'bold',
                                        transition: 'transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
                                        '&:hover': {
                                            transform: 'translateY(-1px)',
                                            boxShadow: theme.shadows[4],
                                        },
                                    }}
                                    disabled={!!errors.email || !!errors.password || !email || !password || loading}
                                >
                                    {loading ? 'Ingresando...' : 'Ingresar'}
                                </Button>
                                {/* Indicador de carga posicionado sobre el botón */}
                                {loading && (
                                    <CircularProgress
                                        size={24}
                                        sx={{
                                            color: theme.palette.primary.contrastText,
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            marginTop: '-12px',
                                            marginLeft: '-12px',
                                        }}
                                    />
                                )}
                            </Box>
                        </form>
                    </Box>
                </Fade>
            </Grid>
        </Grid>
    );
};

export default Login;
