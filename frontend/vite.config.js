//frontend/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Define el puerto donde corre tu backend API
// Asegúrate de que este sea el puerto correcto donde escucha tu servidor Node/Express
const backendPort = 3001;
const backendUrl = `http://localhost:${backendPort}`;

export default defineConfig({
    plugins: [react()],
    server: {
    // Opcional: Define un puerto específico para este servidor de desarrollo Vite
    // Si no lo pones, Vite elegirá uno (como 5173)
    // port: 5173,

    // Configuración del Proxy
    proxy: {
      // Regla: Cualquier petición cuya URL empiece con '/api' será redirigida
        '/api': {
        target: backendUrl,   // La URL base de tu servidor backend (http://localhost:3001)
        changeOrigin: true,  // Es importante para que el backend acepte la petición correctamente
        secure: false,       // Usualmente 'false' en desarrollo local (HTTP)

        // NOTA: No necesitas 'rewrite' porque tus rutas backend ya están
        //       preparadas para recibir '/api/...' (ej., GET '/' en areas.js
        //       se convierte en GET '/api/areas' si lo montas correctamente en Express)
        },
        '/solicitudes': {
        target: backendUrl,
        changeOrigin: true,
        secure: false,
        }
      // Podrías añadir más reglas de proxy aquí si tuvieras otras APIs o rutas especiales
    }
    }
});