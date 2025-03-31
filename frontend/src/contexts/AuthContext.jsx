// frontend/src/contexts/AuthContext.jsx
import React, { useState, useEffect } from 'react';
// Importa el contexto desde el archivo separado
import { AuthContext } from './AuthContextValue.jsx'; // O .js si así se llama el archivo

// --- Funciones Auxiliares (Simuladas/Placeholders) ---
const validateToken = async (token) => {
    console.log("[AuthContext] Simulando validación de token:", token);
    // Lógica futura: Llamar a un endpoint del backend '/api/auth/validate-token'
    // que verifique la firma y expiración del token.
    // Por ahora, si existe un token, lo consideramos "válido".
    return !!token;
};

const getUserDataFromToken = (token) => {
    console.log("[AuthContext] Simulando obtención de datos desde token/localStorage:", token);
    // Lógica futura: Decodificar el payload del token JWT (si no contiene info sensible)
    // O usar el token para llamar a un endpoint '/api/users/me' que devuelva los datos.
    // Por ahora, recuperamos de localStorage.
    const storedUser = localStorage.getItem('userData');
    if (storedUser) {
        try {
            return JSON.parse(storedUser);
        } catch (e) {
            console.error("[AuthContext] Error parsing stored user data:", e);
            localStorage.removeItem('authToken'); // Limpia si los datos están corruptos
            localStorage.removeItem('userData');
            return null;
        }
    }
    return null;
};

const logoutUser = () => {
    console.log("[AuthContext] Simulando cierre de sesión (limpieza local)");
    // Lógica futura: Llamar a un endpoint de logout en el backend si es necesario.
};
// --- Fin Funciones Auxiliares ---


// Exporta el Componente Provider (AuthProvider)
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    // *** PASO 7.1: Añadir Estado para el Token ***
    // Inicializa leyendo de localStorage por si ya existe una sesión.
    const [token, setToken] = useState(() => localStorage.getItem('authToken') || null);

    // Efecto para verificar la autenticación al montar
    useEffect(() => {
        const checkAuthState = async () => {
            console.log("[AuthContext] Verificando estado inicial de autenticación...");
            setLoading(true);
            const storedToken = localStorage.getItem('authToken'); // Lee el token real
            // *** PASO 7.2: Actualizar estado del token ***
            setToken(storedToken); // Siempre actualiza el estado con lo que hay en localStorage

            if (storedToken) {
                console.log("[AuthContext] Token encontrado en localStorage.");
                try {
                    const isValid = await validateToken(storedToken); // Usa el token real
                    if (isValid) {
                        console.log("[AuthContext] Token considerado válido.");
                        const userData = getUserDataFromToken(storedToken); // Usa el token real
                        if (userData) {
                            console.log("[AuthContext] Datos de usuario restaurados:", userData);
                            setUser(userData);
                        } else {
                            console.warn("[AuthContext] Token válido pero no se encontraron datos de usuario. Limpiando.");
                            localStorage.removeItem('authToken');
                            localStorage.removeItem('userData');
                            setUser(null);
                            setToken(null); // *** Limpia estado token ***
                        }
                    } else {
                        console.log("[AuthContext] Token inválido. Limpiando.");
                        localStorage.removeItem('authToken');
                        localStorage.removeItem('userData');
                        setUser(null);
                        setToken(null); // *** Limpia estado token ***
                    }
                } catch (error) {
                    console.error("[AuthContext] Error durante checkAuthState:", error);
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('userData');
                    setUser(null);
                    setToken(null); // *** Limpia estado token ***
                }
            } else {
                console.log("[AuthContext] No se encontró token en localStorage.");
                setUser(null);
                setToken(null); // *** Asegura que el estado token sea null si no hay en localStorage ***
            }
            setLoading(false);
            console.log("[AuthContext] Verificación inicial completada.");
        };

        checkAuthState();
    }, []); // Ejecutar solo al montar

    // Función para manejar el inicio de sesión exitoso
    // *** PASO 7.3: Modificar login para aceptar y guardar el token ***
    const login = (userData, receivedToken) => {
        if (!userData || typeof userData !== 'object' || !userData.rut || !receivedToken) {
            console.error("[AuthContext] Intento de login con datos o token inválidos:", {userData, receivedToken});
            return;
        }
        console.log("[AuthContext] Iniciando sesión y guardando datos y token:", {userData, token: receivedToken});
        setUser(userData);
        setToken(receivedToken); // *** Guarda el token en el estado ***
        localStorage.setItem('authToken', receivedToken); // *** Guarda el token real en localStorage ***
        localStorage.setItem('userData', JSON.stringify(userData));
    };

    // Función para limpiar el estado cuando el usuario cierra sesión
    // *** PASO 7.4: Modificar logout para limpiar el token ***
    const logout = () => {
        console.log("[AuthContext] Cerrando sesión...");
        logoutUser();
        localStorage.removeItem('authToken'); // Elimina el token real
        localStorage.removeItem('userData');
        setUser(null);
        setToken(null); // *** Limpia el estado del token ***
    };

    // *** PASO 7.5: Añadir 'token' al valor del contexto ***
    const value = {
        user,
        loading,
        token, // El token JWT actual (o null)
        login,
        logout
    };

    // Retornar el Provider del Contexto importado
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};