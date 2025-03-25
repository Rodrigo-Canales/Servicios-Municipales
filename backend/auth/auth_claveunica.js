const express = require('express');
const axios = require('axios');
const router = express.Router();

// Ruta para iniciar el flujo de autenticación
router.get('/login', (req, res) => {
    const clientId = process.env.CLAVEUNICA_CLIENT_ID; // Asegúrate de tener las variables de entorno configuradas
    const redirectUri = process.env.CLAVEUNICA_REDIRECT_URI; // Asegúrate de tener la URI de redirección registrada en el portal de Clave Única

    // Crear la URL de autorización
    const redirectUrl = `https://accounts.claveunica.gob.cl/openid/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid`;

    // Redirigir al usuario a la página de inicio de sesión de Clave Única
    res.redirect(redirectUrl);
});

// Ruta de Callback que recibe el código de autorización
router.get('/callback', async (req, res) => {
    const authorizationCode = req.query.code;  // Obtiene el código de autorización

    if (!authorizationCode) {
        return res.status(400).send('Error: No se recibió el código de autorización.');
    }

    try {
        // Intercambiar el código por un token
        const response = await axios.post('https://accounts.claveunica.gob.cl/openid/token', new URLSearchParams({
            client_id: process.env.CLAVEUNICA_CLIENT_ID,  // Tu client_id
            client_secret: process.env.CLAVEUNICA_CLIENT_SECRET,  // Tu client_secret
            code: authorizationCode,  // Código de autorización recibido
            grant_type: 'authorization_code',
            redirect_uri: process.env.CLAVEUNICA_REDIRECT_URI,  // Tu redirect_uri
        }));

        const { access_token } = response.data;  // Obtener el access token

        // Puedes realizar lo que necesites con el access token, por ejemplo, guardarlo en una sesión o base de datos
        res.json({
            message: 'Autenticación exitosa',
            access_token: access_token,  // Muestra el access_token
        });
    } catch (error) {
        console.error('Error al obtener el token:', error);
        res.status(500).send('Error al obtener el token');
    }
});

module.exports = router;