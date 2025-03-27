import { useState } from "react";
import { TextField, Button, Typography, Box, Grid, List, ListItem, IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import ThemeToggle from "../ThemeToggle";
import Swal from "sweetalert2";

const Login = ({ toggleTheme }) => {
    const theme = useTheme();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({ email: "", password: "" });
    const navigate = useNavigate();

    // Validación de correo electrónico
    const validateEmail = (email) => /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);

    // Validación de contraseña
    const validatePassword = (password) => password.length >= 6;

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
            password: validatePassword(value) ? "" : "La contraseña debe tener al menos 6 caracteres",
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
    
        if (errors.email || errors.password || !email || !password) {
            Swal.fire({
                title: 'Error',
                text: 'Por favor, corrija los errores antes de continuar.',
                icon: 'error',
                confirmButtonText: 'Cerrar'
            });
            return;
        }
    
        
        try {
            console.log("Datos enviados:", { correo_electronico: email, password: password });
            const response = await fetch('http://localhost:3001/api/auth/trabajadores/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo_electronico: email, password: password }),
            });
    
            const data = await response.json();
            console.log("Respuesta del servidor:", data); // <-- Agregado aquí para ver la respuesta
    
            if (!response.ok) {
                throw new Error(data.message || "Error desconocido. Intenta nuevamente.");
            }
    
            let mensaje = "";
            let destino = "";
    
            if (data.rol === 'Administrador') {
                mensaje = "Inicio de sesión exitoso como Administrador.";
                destino = "/admin";
            } else if (data.rol === 'Funcionario') {
                mensaje = "Inicio de sesión exitoso como Funcionario.";
                destino = "/trabajadores";
            } else {
                Swal.fire({
                    title: 'Error',
                    text: 'No tienes permisos para acceder',
                    icon: 'error',
                    confirmButtonText: 'Cerrar'
                });
                return;
            }
    
            Swal.fire({
                title: '¡Bienvenido!',
                text: mensaje,
                icon: 'success',
                confirmButtonText: 'Aceptar'
            }).then(() => {
                navigate(destino);
            });
    
        } catch (error) {
            console.error("Error en el login:", error.message); // <-- También útil para ver errores
            Swal.fire({
                title: 'Error',
                text: error.message,
                icon: 'error',
                confirmButtonText: 'Cerrar'
            });
        }
    };

    return (
        <Grid container sx={{ minHeight: '100vh' }}>
            <Grid 
                item xs={12} md={5} 
                sx={{ 
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                    color: theme.palette.common.white,
                    p: 4, 
                    display: 'flex', flexDirection: 'column', justifyContent: 'center'
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

                <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Typography variant="h5" fontWeight="bold">
                        Sistema de Solicitudes Ciudadanas
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 2 }}>
                        Estimado ciudadano, utilice esta nueva plataforma para ingresar sus requerimientos al Municipio.
                    </Typography>
                    <List sx={{ mt: 2, listStyleType: 'disc', pl: 4 }}>
                        <ListItem sx={{ display: 'list-item' }}>
                            Deje su clave única.
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
                </Box>
            </Grid>

            <Grid 
                item xs={12} md={7} 
                sx={{ 
                    bgcolor: 'background.default', 
                    color: 'text.primary', 
                    p: 6, 
                    display: 'flex', flexDirection: 'column', justifyContent: 'center',
                    position: 'relative'
                }}
            >
                <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                    <ThemeToggle toggleTheme={toggleTheme} />
                </Box>

                <Box
                    sx={{
                        maxWidth: 400,
                        mx: 'auto',
                        backgroundColor: 'background.paper',
                        boxShadow: 4,
                        borderRadius: 2,
                        p: 4,
                    }}
                >
                    <Typography variant="h5" fontWeight="bold" gutterBottom align="center">
                        Iniciar Sesión
                    </Typography>

                    <form onSubmit={handleSubmit}>
                        <TextField
                            label="Correo Electrónico"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            value={email}
                            onChange={handleEmailChange}
                            error={!!errors.email}
                            helperText={errors.email}
                            sx={{ backgroundColor: 'background.default', borderRadius: 1 }}
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
                            helperText={errors.password}
                            sx={{ backgroundColor: 'background.default', borderRadius: 1 }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            sx={{ mt: 3, py: 1.5, borderRadius: 2, fontWeight: 'bold' }}
                            disabled={!!errors.email || !!errors.password || !email || !password}
                        >
                            Ingresar
                        </Button>
                    </form>
                </Box>
            </Grid>
        </Grid>
    );
};

export default Login;