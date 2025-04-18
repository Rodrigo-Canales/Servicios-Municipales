// frontend/src/components/Auth/ProtectedRoute.jsx
import React from 'react';
// Asegúrate que la ruta y extensión sean correctas para importar useAuth
// Debe apuntar al archivo donde definiste el hook (ej: ../../contexts/useAuth.jsx)
import { useAuth } from '../../contexts/useAuth.jsx'; // Verifica esta ruta
import { Navigate, useLocation } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';

/**
 * Componente para proteger rutas basado en el estado de autenticación y roles.
 * Redirige a /login si el usuario no está autenticado.
 * Redirige a / (o a otra ruta) si el usuario no tiene el rol permitido.
 * Muestra un indicador de carga mientras se verifica el estado inicial de autenticación.
 *
 * @param {React.ReactNode} children - El componente/página a renderizar si el acceso es permitido.
 * @param {string[]} [allowedRoles] - Opcional. Array de strings con los roles permitidos para esta ruta. Si no se proporciona, solo verifica que el usuario esté logueado.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
    // Obtiene el estado actual del usuario y el estado de carga desde el contexto
    const { user, loading } = useAuth();
    // Obtiene la ubicación actual para poder redirigir de vuelta después del login
    const location = useLocation();

    // 1. Mostrar indicador de carga mientras el AuthContext verifica el estado inicial
    //    Esto evita redirigir a /login brevemente si el usuario ya tiene una sesión válida
    //    guardada en localStorage pero el contexto aún no la ha cargado.
    if (loading) {
        // Log añadido para claridad durante la carga
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
                <CircularProgress />
            </Box>
        );
    }

    // 2. Si la carga terminó y NO hay usuario, redirigir a /login
    if (!user) {
        // `replace` evita que la ruta protegida quede en el historial del navegador.
        // `state={{ from: location }}` pasa la ruta original para que Login pueda redirigir de vuelta.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    // 3. Si se especificaron roles permitidos (`allowedRoles`) Y el rol del usuario
    //    NO está incluido en esa lista, redirigir.
    //    (Asegura que allowedRoles sea un array antes de usar .includes)
    if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(user.rol)) {
        // Permitir acceso a administradores a cualquier ruta
        if (user.rol === 'Administrador') {
            console.info(`[ProtectedRoute] Acceso permitido a ${location.pathname} para rol "Administrador".`);
        } else {
            return <Navigate to="/" state={{ from: location }} replace />;
        }
    }
    return children;
};

// Asegúrate de exportar el componente
export default ProtectedRoute;