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
import { mostrarAlertaError, mostrarAlertaExito } from '../../utils/alertUtils'; // Importar funciones de alertUtils
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
    const apiUrl = import.meta.env.VITE_BACKEND_API_URL || '';

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
            mostrarAlertaError('Error de Validación', 'Por favor, ingrese un correo y contraseña válidos.');
            return;
        }

        setLoading(true); // Iniciar carga

        try {

            // Llamada a la API (sin cambios)
            const response = await fetch(`${apiUrl}/auth/trabajadores/login`, {
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
                mostrarAlertaError('Acceso Denegado', 'Rol no permitido para esta sección.');
                setLoading(false);
                return;
            }

            // *** PASO 8.2 (Aplicado): LLAMAR A login DEL CONTEXTO con user Y token ***
            login(data.user, data.token); // <--- ¡Se pasan ambos argumentos!

            // Mostrar alerta y navegar (sin cambios)
            mostrarAlertaExito('¡Bienvenido!', mensaje);
            setTimeout(() => {
                navigate(destino);
            }, 1500);

        } catch (error) {
            // Manejo de errores (sin cambios)
            console.error("Error en el login:", error.message);
            mostrarAlertaError('Error de Inicio de Sesión', error.message || "Ocurrió un error inesperado. Intenta nuevamente.");
        } finally {
            // Detener la carga (sin cambios)
            setLoading(false);
        }
    };

    // --- JSX (Renderizado) - Restaurado completamente ---
    return (
        <Grid container sx={{ minHeight: '100vh', fontFamily: 'Montserrat, Arial, sans-serif', bgcolor: 'background.default' }}>
            {/* Panel Izquierdo (Información) */}
            <Grid
                item xs={12} md={5}
                sx={{
                    bgcolor: 'primary.main',
                    color: theme.palette.primary.contrastText,
                    p: { xs: 3, md: 4 },
                    display: 'flex', flexDirection: 'column', justifyContent: 'center',
                    borderRight: { md: `1.5px solid ${theme.palette.primary.light}` },
                    boxShadow: { md: theme.shadows[4] },
                }}
            >
                <Fade in={true} timeout={1000}>
                    <Box sx={{ textAlign: 'center', mb: { xs: 2, md: 3 } }}>
                        <Box
                            component="img"
                            src="/LOGO PITRUFQUEN.png"
                            alt="Logo Municipalidad"
                            sx={{ width: { xs: '120px', md: '140px' }, mb: 2, mx: 'auto', display: 'block' }}
                        />
                        <Typography variant="h4" fontWeight={800} gutterBottom component="h1" sx={{ letterSpacing: 0.7, textTransform: 'uppercase', color: 'textWhite', fontFamily: 'Montserrat, Arial, sans-serif' }}>
                            Municipalidad de Pitrufquén
                        </Typography>
                    </Box>
                </Fade>
                <Fade in={true} timeout={1500}>
                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: 0.7, textTransform: 'uppercase', color: 'textWhite', fontFamily: 'Montserrat, Arial, sans-serif' }}>
                            Sistema de Gestión de Solicitudes
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 2, color: 'textWhite', fontFamily: 'Montserrat, Arial, sans-serif' }}>
                            Estimado funcionario, utilice esta nueva plataforma para gestionar sus Solicitudes Respetivas.
                        </Typography>
                        <Typography fontWeight={700} variant="body1" sx={{ mt: 2, color: 'textWhite', fontFamily: 'Montserrat, Arial, sans-serif' }}>
                            Por favor siga los pasos detallados a continuación:
                        </Typography>
                        <List sx={{ mt: 2, mb: 2, listStyleType: 'disc', pl: 4, textAlign: 'left', maxWidth: 450, mx:'auto', color: 'textWhite', fontFamily: 'Montserrat, Arial, sans-serif' }}>
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
                        <Typography fontWeight={700} variant="body1" sx={{ mt: 2, color: 'textWhite', fontFamily: 'Montserrat, Arial, sans-serif' }}>
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
                    position: 'relative',
                }}
            >
                {/* Botón para cambiar tema */}
                <Box sx={{ position: 'absolute', top: { xs: 16, md: 24 }, right: { xs: 16, md: 24 } }}>
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
                            boxShadow: { xs: 2, md: 4 },
                            borderRadius: 3,
                            p: { xs: 3, md: 4 },
                            border: `1.5px solid ${theme.palette.primary.light}`,
                            fontFamily: 'Montserrat, Arial, sans-serif',
                        }}
                    >
                        <Typography variant="h5" fontWeight={800} gutterBottom align="center" component="h2" sx={{ letterSpacing: 0.7, textTransform: 'uppercase', color: 'primary.main', fontFamily: 'Montserrat, Arial, sans-serif' }}>
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
                                sx={{ borderRadius: 2, fontFamily: 'Montserrat, Arial, sans-serif' }}
                                InputProps={{
                                    sx: {
                                        borderRadius: 2,
                                        fontFamily: 'Montserrat, Arial, sans-serif',
                                    },
                                }}
                                InputLabelProps={{ sx: { fontFamily: 'Montserrat, Arial, sans-serif' } }}
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
                                sx={{ borderRadius: 2, fontFamily: 'Montserrat, Arial, sans-serif' }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" aria-label="toggle password visibility">
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                    sx: {
                                        borderRadius: 2,
                                        fontFamily: 'Montserrat, Arial, sans-serif',
                                    },
                                }}
                                InputLabelProps={{ sx: { fontFamily: 'Montserrat, Arial, sans-serif' } }}
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
                                        borderRadius: 3,
                                        fontWeight: 700,
                                        fontFamily: 'Montserrat, Arial, sans-serif',
                                        fontSize: '1.08rem',
                                        letterSpacing: 0.5,
                                        boxShadow: theme.shadows[2],
                                        transition: 'transform 0.15s, box-shadow 0.15s',
                                        '&:hover': {
                                            transform: 'translateY(-1px) scale(1.03)',
                                            boxShadow: theme.shadows[4],
                                            bgcolor: 'primary.dark',
                                        },
                                    }}
                                    disabled={!!errors.email || !!errors.password || !email || !password || loading}
                                >
                                    {loading ? 'Ingresando...' : 'Ingresar'}
                                </Button>
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