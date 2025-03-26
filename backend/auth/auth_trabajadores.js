const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/db');

const router = express.Router();

router.post('/login', async (req, res) => {
    const { correo_electronico, password } = req.body;

    try {
        // Buscar en Usuarios, filtrando por rol (Trabajador o Administrador)
        const [rows] = await db.query(
            "SELECT * FROM Usuarios WHERE correo_electronico = ? AND rol IN ('Trabajador', 'Administrador')",
            [correo_electronico]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Correo o contraseña incorrectos' });
        }

        const usuario = rows[0];

        // Verificar que existe el hash de la contraseña usando el nombre correcto del campo
        if (!usuario.hash_password) {
            return res.status(400).json({ message: 'No se encontró contraseña almacenada para este usuario.' });
        }

        const validPassword = await bcrypt.compare(password, usuario.hash_password);
        if (!validPassword) {
            return res.status(404).json({ message: 'Correo o contraseña incorrectos' });
        }

        res.status(200).json({ 
            message: 'Inicio de sesión exitoso', 
            trabajadorId: usuario.RUT, 
            rol: usuario.rol 
        });
    } catch (error) {
        console.error('Error al procesar login:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

module.exports = router;
