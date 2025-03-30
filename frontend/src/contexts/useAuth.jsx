// frontend/src/contexts/useAuth.jsx 
import { useContext } from 'react';
// Importa el CONTEXTO desde el archivo donde se creó (AuthContextValue)
import { AuthContext } from './AuthContextValue.jsx'; // Asegúrate que la extensión coincida

// Hook personalizado para usar el contexto fácilmente en otros componentes
export const useAuth = () => {
    // Obtiene el valor actual proporcionado por AuthProvider
    // (el objeto { user, loading, token, login, logout })
    const context = useContext(AuthContext);

    // Verificación importante: Si context es undefined, significa que
    // este hook se está usando fuera de un componente envuelto por <AuthProvider>
    if (context === undefined) {
        // Lanza un error claro para facilitar la depuración
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }

    // Devuelve el objeto completo del contexto para que los componentes puedan usarlo
    // Ej: const { user, login, token } = useAuth();
    return context;
};

