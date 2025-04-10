// frontend/src/services/api.js
import axios from 'axios';

// Crea una instancia de Axios con configuración base
const api = axios.create({
    // Define la URL base de tu API backend.
    // Asegúrate de que coincida con donde está corriendo tu backend (puerto 3001 en tu caso).
    baseURL: '/api',
    // Puedes añadir otras configuraciones por defecto si las necesitas
    // headers: { 'Content-Type': 'application/json' }, // Axios lo hace por defecto para POST/PUT JSON
});

// --- Interceptor de Peticiones (Request Interceptor) ---
// Este interceptor se ejecuta ANTES de que cada petición realizada con esta instancia 'api' sea enviada.
api.interceptors.request.use(
    (config) => {
        // 1. Obtener el token JWT desde localStorage (donde lo guarda AuthContext)
        const token = localStorage.getItem('authToken');

        // 2. Si existe un token, añadirlo a la cabecera 'Authorization'
        if (token) {
            // El formato estándar es 'Bearer <token>'
            config.headers['Authorization'] = `Bearer ${token}`;
        } else {
            console.log('[API Interceptor] No se encontró token para añadir a la cabecera.');
        }

        // 3. Devolver la configuración modificada (o la original si no había token)
        return config;
    },
    (error) => {
        // Manejar errores que ocurran ANTES de enviar la petición
        console.error('[API Interceptor] Error en configuración de petición:', error);
        return Promise.reject(error);
    }
);

// --- Interceptor de Respuestas (Response Interceptor) - Opcional pero Recomendado ---
// Este interceptor se ejecuta DESPUÉS de recibir una respuesta (o error) del backend.
api.interceptors.response.use(
    (response) => {
        // Si la respuesta es exitosa (status 2xx), simplemente la devuelve.
        return response;
    },
    (error) => {
        // Si la respuesta es un error...
        console.error('[API Interceptor] Error en respuesta:', error.response?.status, error.config?.url, error.message);

        // Manejar específicamente errores 401 (No Autorizado)
        if (error.response && error.response.status === 401) {
            console.warn('[API Interceptor] Error 401 detectado (Token inválido/expirado?). Limpiando sesión y redirigiendo a login.');

            // Limpiar datos de sesión del localStorage (simulando un logout forzado)
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');

            // Redirigir a la página de login.
            // Usar window.location.href fuerza una recarga completa, limpiando el estado de React.
            // Si estuvieras usando el hook useAuth aquí (lo cual no es directo en interceptores),
            // podrías llamar a logout() del contexto.
            if (window.location.pathname !== '/login') { // Evitar bucle si ya está en login
                    window.location.href = '/login';
                 // Podrías añadir un mensaje o estado en la URL para indicar por qué se redirigió
                 // ej: window.location.href = '/login?sessionExpired=true';
            }
        }

        // Rechazar la promesa para que el .catch() en la llamada original pueda manejar el error.
        return Promise.reject(error);
    }
);

// Exportar la instancia configurada de Axios para usarla en otros archivos
export default api;