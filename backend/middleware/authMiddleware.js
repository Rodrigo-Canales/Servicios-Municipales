// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' }); // *** Carga .env (ajusta ruta si es necesario) ***

/**
 * Middleware para proteger rutas verificando el token JWT.
 * Si el token es válido, añade el payload decodificado a `req.user`.
 */
const protect = async (req, res, next) => {
    let token;
    const authHeader = req.headers.authorization;

    // 1. Verificar si la cabecera Authorization existe y tiene el formato 'Bearer <token>'
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            // 2. Extraer el token (quitando 'Bearer ')
            token = authHeader.split(' ')[1];

            // 3. Verificar el token usando el secreto de .env
            const secret = process.env.JWT_SECRET;
            if (!secret) {
                // Este es un error grave de configuración del servidor
                console.error("¡ERROR CRÍTICO: JWT_SECRET no definido al verificar token!");
                // No dar detalles al cliente, pero loguearlo es vital
                return res.status(500).json({ message: 'Error interno de configuración.' });
            }

            const decoded = jwt.verify(token, secret);

            // 4. ¡Éxito! Token válido. Adjuntar payload decodificado a req.user
            //    Ahora las rutas posteriores tendrán acceso a req.user.rut y req.user.rol
            req.user = decoded; // decoded contendrá { rut, rol } (y iat, exp)

            // 5. Continuar al siguiente middleware o controlador de ruta
            next();

        } catch (error) {
            // 6. Manejar errores de verificación del token
            console.error('Error de autenticación de token:', error.message);
            if (error.name === 'JsonWebTokenError') {
                // Token mal formado o firma inválida
                return res.status(401).json({ message: 'Acceso denegado: Token inválido.' });
            }
            if (error.name === 'TokenExpiredError') {
                // Token ha expirado
                return res.status(401).json({ message: 'Acceso denegado: Token expirado.' });
            }
            // Otro error durante la verificación
            return res.status(401).json({ message: 'Acceso denegado: Problema con el token.' });
        }
    }

    // 7. Si no hay cabecera Authorization o no tiene el formato 'Bearer'
    if (!token) {
        res.status(401).json({ message: 'Acceso denegado: No se proporcionó token.' });
    }
};

/**
 * Middleware para restringir el acceso basado en roles.
 * Debe usarse DESPUÉS del middleware 'protect'.
 * @param  {...string} roles - Lista de roles permitidos para acceder a la ruta.
 */
const restrictTo = (...roles) => {
    return (req, res, next) => {
        // Verifica que 'protect' haya añadido req.user y req.user.rol
        if (!req.user || !req.user.rol) {
            console.error("Middleware restrictTo usado sin req.user.rol válido. ¿Se usó 'protect' antes?");
            return res.status(500).json({ message: 'Error interno de autorización.' });
        }

        // Comprueba si el rol del usuario está en la lista de roles permitidos
        if (!roles.includes(req.user.rol)) {
            // Si no está permitido, devuelve error 403 Forbidden
            return res.status(403).json({ message: 'No tienes permiso para realizar esta acción.' });
        }

        // Si el rol está permitido, continúa al siguiente middleware/controlador
        next();
    };
};


// Exportar las funciones middleware
module.exports = {
    protect,
    restrictTo
};