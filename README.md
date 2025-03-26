# Servicios-Municipales

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS servicios_municipales;
USE servicios_municipales;

-- Crear la tabla Áreas
CREATE TABLE IF NOT EXISTS Areas (
    id_area INT AUTO_INCREMENT PRIMARY KEY,
    nombre_area VARCHAR(255) NOT NULL
);

-- Crear la tabla Usuarios
CREATE TABLE IF NOT EXISTS Usuarios (
    RUT VARCHAR(12) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    correo_electronico VARCHAR(255) DEFAULT NULL,
    hash_password VARCHAR(255) DEFAULT NULL,
    rol ENUM('Usuario', 'Trabajador', 'Administrador') DEFAULT 'Usuario',
    area_id INT DEFAULT NULL,
    FOREIGN KEY (area_id) REFERENCES Areas(id_area)
);

-- Crear la tabla Tipos_Solicitudes (actualizada con el campo descripción)
CREATE TABLE IF NOT EXISTS Tipos_Solicitudes (
    id_tipo INT AUTO_INCREMENT PRIMARY KEY,
    nombre_tipo VARCHAR(255) NOT NULL,
    descripcion VARCHAR(500) DEFAULT NULL,  -- Nuevo campo descripción
    area_id INT NOT NULL,
    FOREIGN KEY (area_id) REFERENCES Areas(id_area)
);

-- Crear la tabla Solicitudes
CREATE TABLE IF NOT EXISTS Solicitudes (
    id_solicitud INT AUTO_INCREMENT PRIMARY KEY,
    id_tipo INT NOT NULL,
    fecha_hora_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Se llena automáticamente
    estado ENUM('Pendiente', 'Aprobada', 'Rechazada') DEFAULT 'Pendiente',
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
INSERT INTO Usuarios (RUT, nombre, apellido, correo_electronico, hash_password, rol, area_id) VALUES
('12345678-9', 'Juan', 'Pérez', NULL, NULL, 'Usuario', NULL),
('23456789-0', 'María', 'González', NULL, NULL, 'Usuario', NULL),
('34567890-1', 'Carlos', 'López', 'c.lopez@municipalidad.cl', 'hash1', 'Trabajador', 1),
('45678901-2', 'Ana', 'Rodríguez', 'a.rodriguez@municipalidad.cl', 'hash2', 'Trabajador', 2),
('56789012-3', 'Pedro', 'Sánchez', 'p.sanchez@municipalidad.cl', 'hash3', 'Administrador', NULL);

-- Poblar la tabla Tipos_Solicitudes (ahora incluyendo la descripción)
INSERT INTO Tipos_Solicitudes (nombre_tipo, descripcion, area_id) VALUES
('Reparación de calles', 'Reparación y mantenimiento de las calles dañadas.', 1),
('Limpieza de espacios públicos', 'Mantenimiento y limpieza en parques y plazas.', 2),
('Denuncia de incivilidades', 'Recepción de denuncias por comportamientos inadecuados.', 3),
('Subsidios y ayudas sociales', 'Información y gestión de subsidios y ayudas sociales.', 4),
('Consulta sobre transporte público', 'Consulta de rutas y horarios del transporte público.', 5);




proteger rutas:
Verificar el token JWT en cada ruta: En cada ruta protegida (como /panel-administrador), verifica si el usuario tiene un token JWT válido en su cookie. Si no tiene un token válido, redirige al usuario a la página de login.
Verificar el rol del usuario en cada ruta: Además de verificar si el usuario tiene un token JWT válido, también verifica si el rol del usuario (que está almacenado en el token JWT) es el rol correcto para acceder a esa ruta. Por ejemplo, si el usuario intenta acceder a /panel-administrador, verifica si su rol es "Administrador".
Utilizar un componente de protección de rutas: Crea un componente de protección de rutas que se encargue de verificar el token JWT y el rol del usuario antes de permitir el acceso a una ruta protegida.
(implementar eso en el frontend)

Backend
npm start (iniciar y si hay cambios hay que apagarlo y prenderlo de nuevo)
npm run server (si uno hace un cambio se reinicia automáticamente gracias a nodemon)


NODE_ENV=development npm start
NODE_ENV=production npm start



Frontend
npm run dev