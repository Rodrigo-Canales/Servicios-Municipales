# Servicios-Municipales

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS servicios_municipalidad;
USE servicios_municipalidad;

-- Crear la tabla Áreas
CREATE TABLE IF NOT EXISTS Areas (
    id_area INT AUTO_INCREMENT PRIMARY KEY,
    nombre_area VARCHAR(255) NOT NULL
);

-- Crear la tabla Usuarios
CREATE TABLE IF NOT EXISTS Usuarios (
    RUT VARCHAR(12) PRIMARY KEY,
    nombres VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255) NOT NULL,
    correo_electronico VARCHAR(255) DEFAULT NULL,
    hash_contraseña VARCHAR(255) DEFAULT NULL,
    rol ENUM('Usuario', 'Trabajador', 'Administrador') DEFAULT 'Usuario',
    area_id INT DEFAULT NULL,
    FOREIGN KEY (area_id) REFERENCES Areas(id_area)
);

-- Crear la tabla Tipos_Solicitudes
CREATE TABLE IF NOT EXISTS Tipos_Solicitudes (
    id_tipo INT AUTO_INCREMENT PRIMARY KEY,
    nombre_tipo VARCHAR(255) NOT NULL,
    area_id INT NOT NULL,
    FOREIGN KEY (area_id) REFERENCES Areas(id_area)
);

-- Crear la tabla Solicitudes
CREATE TABLE IF NOT EXISTS Solicitudes (
    id_solicitud INT AUTO_INCREMENT PRIMARY KEY,
    id_tipo INT NOT NULL,
    fecha_hora_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Se llena automáticamente
    estado ENUM('Pendiente', 'Aceptada', 'Rechazada') DEFAULT 'Pendiente',
    ruta_carpeta VARCHAR(255) NOT NULL,
    RUT_ciudadano VARCHAR(12) NOT NULL,  
    FOREIGN KEY (RUT_ciudadano) REFERENCES Usuarios(RUT),
    FOREIGN KEY (id_tipo) REFERENCES Tipos_Solicitudes(id_tipo)
);

-- Crear la tabla Respuestas
CREATE TABLE IF NOT EXISTS Respuestas (
    id_respuesta INT AUTO_INCREMENT PRIMARY KEY,
    id_solicitud INT NOT NULL,
    fecha_hora_respuesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Se llena automáticamente
    RUT_trabajador VARCHAR(12) NOT NULL,  
    FOREIGN KEY (id_solicitud) REFERENCES Solicitudes(id_solicitud),
    FOREIGN KEY (RUT_trabajador) REFERENCES Usuarios(RUT)
);







-- Poblar la tabla Áreas
INSERT INTO Areas (nombre_area) VALUES 
('Obras Públicas'),
('Medio Ambiente'),
('Seguridad Ciudadana'),
('Desarrollo Social'),
('Transporte');

-- Poblar la tabla Usuarios (ciudadanos y trabajadores)
INSERT INTO Usuarios (RUT, nombres, apellidos, correo_electronico, hash_contraseña, rol, area_id) VALUES
('12345678-9', 'Juan', 'Pérez', NULL, NULL, 'Usuario', NULL),
('23456789-0', 'María', 'González', NULL, NULL, 'Usuario', NULL),
('34567890-1', 'Carlos', 'López', 'c.lopez@municipalidad.cl', 'hash1', 'Trabajador', 1),
('45678901-2', 'Ana', 'Rodríguez', 'a.rodriguez@municipalidad.cl', 'hash2', 'Trabajador', 2),
('56789012-3', 'Pedro', 'Sánchez', 'p.sanchez@municipalidad.cl', 'hash3', 'Administrador', NULL);

-- Poblar la tabla Tipos_Solicitudes
INSERT INTO Tipos_Solicitudes (nombre_tipo, area_id) VALUES
('Reparación de calles', 1),
('Limpieza de espacios públicos', 2),
('Denuncia de incivilidades', 3),
('Subsidios y ayudas sociales', 4),
('Consulta sobre transporte público', 5);



proteger rutas:
Verificar el token JWT en cada ruta: En cada ruta protegida (como /panel-administrador), verifica si el usuario tiene un token JWT válido en su cookie. Si no tiene un token válido, redirige al usuario a la página de login.
Verificar el rol del usuario en cada ruta: Además de verificar si el usuario tiene un token JWT válido, también verifica si el rol del usuario (que está almacenado en el token JWT) es el rol correcto para acceder a esa ruta. Por ejemplo, si el usuario intenta acceder a /panel-administrador, verifica si su rol es "Administrador".
Utilizar un componente de protección de rutas: Crea un componente de protección de rutas que se encargue de verificar el token JWT y el rol del usuario antes de permitir el acceso a una ruta protegida.
(implementar eso en el frontend)


npm start
npm run server



Dependencias:
"bcrypt": "^5.1.1", Librería para encriptar contraseñas de forma segura usando hashing.
"dotenv": "^16.4.7", // Permite cargar variables de entorno desde un archivo .env.
"express": "^4.21.2", // Framework web para Node.js que facilita la creación de servidores HTTP.
"express-validator": "^7.2.1", // Middleware para validar y sanitizar datos en las solicitudes HTTP.
"helmet": "^8.1.0", // Ayuda a proteger la aplicación configurando encabezados de seguridad HTTP.
"jsonwebtoken": "^9.0.2", // Permite crear y verificar tokens JWT para autenticación de usuarios.
"multer": "^1.4.5-lts.1", // Middleware para manejar la carga de archivos en solicitudes HTTP.
"mysql2": "^3.13.0", // Cliente de MySQL para Node.js que permite interactuar con bases de datos MySQL.
"nodemon": "^3.1.9", // Herramienta que reinicia automáticamente el servidor cuando se detectan cambios en el código.
"pdfkit": "^0.16.0", // Librería para generar archivos PDF dinámicamente desde el backend.
"resend": "^4.1.2" // Servicio para enviar correos electrónicos de manera sencilla en Node.js.