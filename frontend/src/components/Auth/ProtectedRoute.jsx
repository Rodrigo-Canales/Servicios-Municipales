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
        console.log(`[ProtectedRoute] Verificando autenticación para ${location.pathname}... (Loading)`);
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
                <CircularProgress />
            </Box>
        );
    }

    // 2. Si la carga terminó y NO hay usuario, redirigir a /login
    if (!user) {
        console.log(`[ProtectedRoute] Acceso denegado a ${location.pathname}. No hay usuario autenticado. Redirigiendo a /login.`);
        // `replace` evita que la ruta protegida quede en el historial del navegador.
        // `state={{ from: location }}` pasa la ruta original para que Login pueda redirigir de vuelta.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // --- Log de Depuración Añadido ---
    // Imprime el rol del usuario y los roles permitidos ANTES de la comprobación
    // Usamos user?.rol y allowedRoles?.join para evitar errores si alguno fuera undefined
    console.log(`[ProtectedRoute] Verificando ruta ${location.pathname}. User Rol: "${user?.rol}", Allowed Roles: [${allowedRoles?.join(', ')}]`);
    // --- Fin Log Añadido ---

    // 3. Si se especificaron roles permitidos (`allowedRoles`) Y el rol del usuario
    //    NO está incluido en esa lista, redirigir.
    //    (Asegura que allowedRoles sea un array antes de usar .includes)
    if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(user.rol)) {
        // TEMPORAL: Permitir acceso al panel de vecinos para cualquier rol
        if (location.pathname === '/vecinos') {
            console.warn(`[ProtectedRoute] Acceso temporal permitido a /vecinos para rol "${user.rol}".`);
        } else {
            console.log(`[ProtectedRoute] Acceso denegado a ${location.pathname}. Rol "${user.rol}" NO está en roles permitidos [${allowedRoles.join(', ')}].`);
            return <Navigate to="/" state={{ from: location }} replace />;
        }
    }

    // 4. Si la carga terminó, hay un usuario Y (si se especificaron roles) el rol es permitido,
    //    renderizar el componente hijo (la página protegida).
    console.log(`[ProtectedRoute] Acceso PERMITIDO a ${location.pathname} para usuario con rol "${user.rol}".`);
    return children;
};

// Asegúrate de exportar el componente
export default ProtectedRoute;