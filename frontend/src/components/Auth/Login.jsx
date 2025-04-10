// frontend/src/components/Auth/Login.jsx
import React, { useState } from "react"; // Import React y useState
import {
    TextField, Button, Typography, Box, Grid, List, ListItem, IconButton,
    InputAdornment, Fade, CircularProgress, useTheme // Añadir useTheme
} from "@mui/material"; // Añadir Fade y CircularProgress
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
// import { useTheme } from "@mui/material/styles"; // useTheme ya está importado arriba
import ThemeToggle from "../ThemeToggle"; // Asumiendo que este componente existe y funciona y la ruta es correcta
import Swal from "sweetalert2";
// *** RUTA CORREGIDA para importar useAuth desde su propio archivo ***
import { useAuth } from '../../contexts/useAuth.jsx'; // O .js si así se llama el archivo

const Login = ({ toggleTheme }) => {
    const theme = useTheme(); // Obtener el tema actual
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false); // Estado de carga
    const navigate = useNavigate();
    // Obtener la función 'login' del contexto usando el hook 'useAuth'
    const { login } = useAuth();

    // Validación de correo electrónico (sin cambios)
    const validateEmail = (email) => /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);

    // Validación de contraseña (sin cambios)
    const validatePassword = (password) => password.length >= 8;

    // Manejador de cambio de email (sin cambios)
    const handleEmailChange = (e) => {
        const value = e.target.value;
        setEmail(value);
        setErrors((prev) => ({
            ...prev,
            email: validateEmail(value) ? "" : "Correo inválido",
        }));
    };

    // Manejador de cambio de contraseña (sin cambios)
    const handlePasswordChange = (e) => {
        const value = e.target.value;
        setPassword(value);
        setErrors((prev) => ({
            ...prev,
            password: value && !validatePassword(value) ? "La contraseña debe tener al menos 8 caracteres" : "",
        }));
    };

    // Manejador de envío del formulario (ACTUALIZADO para pasar el token)
    const handleSubmit = async (event) => {
        event.preventDefault();

        // Re-validar al enviar (sin cambios)
        const currentEmailError = validateEmail(email) ? "" : "Correo inválido";
        const currentPasswordError = !password ? "Contraseña requerida" : (!validatePassword(password) ? "La contraseña debe tener al menos 8 caracteres" : "");
        setErrors({ email: currentEmailError, password: currentPasswordError });

        // Verificar errores antes de enviar (sin cambios)
        if (currentEmailError || currentPasswordError || !email) {
            Swal.fire({
                title: 'Error de Validación',
                text: 'Por favor, ingrese un correo y contraseña válidos.',
                icon: 'warning',
                confirmButtonText: 'Cerrar',
                confirmButtonColor: theme.palette.primary.main,
            });
            return;
        }

        setLoading(true); // Iniciar carga

        try {

            // Llamada a la API (sin cambios)
            const response = await fetch('http://localhost:3001/api/auth/trabajadores/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo_electronico: email, password: password }),
            });

            // Obtener respuesta (sin cambios)
            const data = await response.json();

            // Verificar si la respuesta NO fue exitosa (sin cambios)
            if (!response.ok) {
                throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
            }

            // --- ÉXITO ---
            // *** PASO 8.1 (Revisión): Verificar user Y token en la respuesta ***
            if (!data.user || !data.token || !data.user.rol /* || otras validaciones */) {
                console.error("Respuesta exitosa pero faltan datos o token:", data);
                throw new Error("Respuesta inesperada del servidor tras login.");
            }

            // Determinar mensaje y destino (sin cambios)
            let mensaje = "";
            let destino = "";
            if (data.user.rol === 'Administrador') {
                mensaje = "Inicio de sesión exitoso como Administrador.";
                destino = "/admin";
            } else if (data.user.rol === 'Funcionario') {
                mensaje = "Inicio de sesión exitoso como Funcionario.";
                destino = "/funcionarios";
            } else {
                // Manejo rol no permitido (sin cambios)
                Swal.fire({
                    title: 'Acceso Denegado',
                    text: 'Rol no permitido para esta sección.',
                    icon: 'error',
                    confirmButtonText: 'Cerrar',
                    confirmButtonColor: theme.palette.primary.main,
                });
                setLoading(false);
                return;
            }

            // *** PASO 8.2 (Aplicado): LLAMAR A login DEL CONTEXTO con user Y token ***
            login(data.user, data.token); // <--- ¡Se pasan ambos argumentos!

            // Mostrar alerta y navegar (sin cambios)
            Swal.fire({
                title: '¡Bienvenido!',
                text: mensaje,
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                willClose: () => {
                    navigate(destino);
                }
            });

        } catch (error) {
            // Manejo de errores (sin cambios)
            console.error("Error en el login:", error.message);
            Swal.fire({
                title: 'Error de Inicio de Sesión',
                text: error.message || "Ocurrió un error inesperado. Intenta nuevamente.",
                icon: 'error',
                confirmButtonText: 'Cerrar',
                confirmButtonColor: theme.palette.primary.main,
            });
        } finally {
            // Detener la carga (sin cambios)
            setLoading(false);
        }
    };

    // --- JSX (Renderizado) - Restaurado completamente ---
    return (
        <Grid container sx={{ minHeight: '100vh' }}>
            {/* Panel Izquierdo (Información) */}
            <Grid
                item xs={12} md={5}
                sx={{
                    bgcolor: 'primary.main', // Mantenido color primario
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
                    {/* Asegúrate que toggleTheme se pase como prop a Login */}
                    {typeof toggleTheme === 'function' && <ThemeToggle toggleTheme={toggleTheme} />}
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
                                helperText={errors.email || " "} // Mantiene espacio para evitar saltos
                                autoComplete="email"
                                sx={{ borderRadius: 1 }}
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
                                helperText={errors.password || " "} // Mantiene espacio
                                autoComplete="current-password"
                                sx={{ borderRadius: 1 }}
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
                                    // Deshabilitar si hay errores, campos vacíos o está cargando
                                    disabled={!!errors.email || !!errors.password || !email || !password || loading}
                                >
                                    {loading ? 'Ingresando...' : 'Ingresar'}
                                </Button>
                                {/* Indicador de carga posicionado sobre el botón */}
                                {loading && (
                                    <CircularProgress
                                        size={24}
                                        sx={{
                                            color: theme.palette.primary.contrastText, // Buen contraste sobre botón primario
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