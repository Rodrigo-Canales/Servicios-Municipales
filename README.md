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
    rol ENUM('Vecino', 'Funcionario', 'Administrador') DEFAULT 'Vecino',
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

      
-- Usa la base de datos creada previamente
USE servicios_municipales;

-- Vaciar tablas existentes antes de insertar (OPCIONAL, ¡CUIDADO!)
-- Descomenta estas líneas SOLO si quieres empezar desde cero cada vez.
-- SET FOREIGN_KEY_CHECKS = 0; -- Deshabilitar temporalmente chequeo de claves foráneas
-- TRUNCATE TABLE Respuestas;
-- TRUNCATE TABLE Solicitudes;
-- TRUNCATE TABLE Tipos_Solicitudes;
-- TRUNCATE TABLE Usuarios;
-- TRUNCATE TABLE Areas;
-- SET FOREIGN_KEY_CHECKS = 1; -- Rehabilitar chequeo

-- ------------------------------
-- Poblar la tabla Áreas (con más datos)
-- ------------------------------
INSERT INTO Areas (nombre_area) VALUES
('Obras Públicas'),               -- ID 1 (asumido)
('Medio Ambiente Aseo y Ornato'), -- ID 2 (asumido)
('Seguridad Ciudadana'),          -- ID 3 (asumido)
('Desarrollo Comunitario'),       -- ID 4 (asumido) - Nombre actualizado
('Tránsito y Transporte Público'),-- ID 5 (asumido) - Nombre actualizado
('Cultura'),                      -- ID 6 (asumido)
('Educación'),                    -- ID 7 (asumido)
('Salud Municipal');              -- ID 8 (asumido)

-- ------------------------------
-- Poblar la tabla Usuarios (actualizado con roles y más datos)
-- ------------------------------
-- NOTA: Los hashes son ejemplos, usar bcrypt en la aplicación real. Vecinos sin hash/pass.
INSERT INTO Usuarios (RUT, nombre, apellido, correo_electronico, hash_password, rol, area_id) VALUES
-- Vecinos (antes 'Usuario')
('11111111-1', 'Elena', 'Martínez', 'elena.m@email.com', NULL, 'Vecino', NULL),
('22222222-2', 'Roberto', 'Silva', 'r.silva@email.com', NULL, 'Vecino', NULL),
('12345678-9', 'Juan', 'Pérez', 'juan.perez@email.com', NULL, 'Vecino', NULL),
('23456789-0', 'María', 'González', 'maria.g@email.com', NULL, 'Vecino', NULL),
('98765432-1', 'Luisa', 'Fernández', 'luisa.f@email.com', NULL, 'Vecino', NULL),

-- Funcionarios (antes 'Trabajador') - Hashes de ejemplo para 'password123'
('34567890-1', 'Carlos', 'López', 'c.lopez@municipalidad.cl', '$2b$10$E9pwsV9yv9jmnmxcMpX.Ne94PCHfAU0j7yqAP5Q9./wJp3RfzUfZe', 'Funcionario', 1), -- Obras Públicas
('45678901-2', 'Ana', 'Rodríguez', 'a.rodriguez@municipalidad.cl', '$2b$10$E9pwsV9yv9jmnmxcMpX.Ne94PCHfAU0j7yqAP5Q9./wJp3RfzUfZe', 'Funcionario', 2), -- Medio Ambiente
('87654321-0', 'Jorge', 'Ramírez', 'j.ramirez@municipalidad.cl', '$2b$10$E9pwsV9yv9jmnmxcMpX.Ne94PCHfAU0j7yqAP5Q9./wJp3RfzUfZe', 'Funcionario', 5), -- Tránsito
('76543210-9', 'Sofía', 'Castro', 's.castro@municipalidad.cl', '$2b$10$E9pwsV9yv9jmnmxcMpX.Ne94PCHfAU0j7yqAP5Q9./wJp3RfzUfZe', 'Funcionario', 4), -- Desarrollo Comunitario
('65432109-8', 'Andrés', 'Vargas', 'a.vargas@municipalidad.cl', '$2b$10$E9pwsV9yv9jmnmxcMpX.Ne94PCHfAU0j7yqAP5Q9./wJp3RfzUfZe', 'Funcionario', 1), -- Obras Públicas (otro)

-- Administradores
('56789012-3', 'Pedro', 'Sánchez', 'p.sanchez@municipalidad.cl', '$2b$10$E9pwsV9yv9jmnmxcMpX.Ne94PCHfAU0j7yqAP5Q9./wJp3RfzUfZe', 'Administrador', NULL),
('10101010-1', 'Isidora', 'Díaz', 'i.diaz@municipalidad.cl', '$2b$10$E9pwsV9yv9jmnmxcMpX.Ne94PCHfAU0j7yqAP5Q9./wJp3RfzUfZe', 'Administrador', NULL);

-- ------------------------------
-- Poblar la tabla Tipos_Solicitudes (con más datos y descripción)
-- ------------------------------
INSERT INTO Tipos_Solicitudes (nombre_tipo, descripcion, area_id) VALUES
('Reparación de calles y veredas', 'Solicitud para reparar baches, grietas o daños en calles y aceras.', 1),
('Mantención de alumbrado público', 'Informar sobre luminarias apagadas, intermitentes o dañadas.', 1),
('Limpieza de microbasurales', 'Solicitud para retirar acumulación ilegal de basura en sitios eriazos o vía pública.', 2),
('Poda o extracción de árboles', 'Solicitud para podar o retirar árboles en la vía pública que presenten riesgo o problemas.', 2),
('Denuncia por ruidos molestos', 'Informar sobre ruidos excesivos que alteran la tranquilidad vecinal (fiestas, construcciones fuera de horario).', 3),
('Solicitud de patrullaje preventivo', 'Pedir mayor presencia de seguridad ciudadana en un sector específico.', 3),
('Inscripción a Taller Comunitario', 'Registrarse en talleres ofrecidos por el municipio (manualidades, deporte, etc.).', 4),
('Postulación a Subsidio de Agua Potable', 'Solicitar información y postular al subsidio de agua potable.', 4),
('Consulta sobre recorridos de locomoción colectiva', 'Obtener información actualizada sobre rutas y horarios del transporte público.', 5),
('Instalación de señalética de tránsito', 'Solicitar la instalación o reparación de señales de Pare, Ceda el Paso, nombres de calles, etc.', 5),
('Solicitud de permiso de evento cultural', 'Tramitar permisos para realizar eventos culturales en espacios públicos.', 6),
('Consulta de actividades culturales', 'Información sobre la agenda cultural del municipio (conciertos, exposiciones, teatro).', 6),
('Solicitud de matrícula escolar municipal', 'Proceso de inscripción para establecimientos educacionales municipales.', 7),
('Información sobre becas estudiantiles', 'Consultar requisitos y plazos para becas municipales o gubernamentales.', 7),
('Solicitud de hora médica en CESFAM', 'Pedir hora para atención médica general o especialidad en Centros de Salud Familiar.', 8),
('Programa de vacunación', 'Información sobre campañas de vacunación y horarios.', 8);

-- ------------------------------
-- Poblar la tabla Solicitudes (con más datos)
-- ------------------------------
-- Asumiendo IDs secuenciales para Tipos_Solicitudes (1 a 16) y RUTs de Vecinos
INSERT INTO Solicitudes (id_tipo, estado, ruta_carpeta, RUT_ciudadano, fecha_hora_envio) VALUES
(1, 'Pendiente', '/srv/sol/11111111-1/1', '11111111-1', NOW() - INTERVAL 7 DAY), -- Reparación calle
(3, 'Aprobada', '/srv/sol/22222222-2/3', '22222222-2', NOW() - INTERVAL 5 DAY), -- Limpieza microbasural
(5, 'Rechazada', '/srv/sol/12345678-9/5', '12345678-9', NOW() - INTERVAL 4 DAY), -- Ruidos molestos
(8, 'Pendiente', '/srv/sol/23456789-0/8', '23456789-0', NOW() - INTERVAL 3 DAY), -- Subsidio Agua
(2, 'Pendiente', '/srv/sol/98765432-1/2', '98765432-1', NOW() - INTERVAL 2 DAY), -- Alumbrado
(10, 'Aprobada', '/srv/sol/11111111-1/10', '11111111-1', NOW() - INTERVAL 1 DAY), -- Señalética
(15, 'Pendiente', '/srv/sol/22222222-2/15', '22222222-2', NOW()),             -- Hora Médica
(4, 'Pendiente', '/srv/sol/12345678-9/4', '12345678-9', NOW() - INTERVAL 6 HOUR); -- Poda árbol

-- ------------------------------
-- Poblar la tabla Respuestas (con más datos)
-- ------------------------------
-- Asumiendo IDs secuenciales para Solicitudes (1 a 8) y RUTs de Funcionarios/Admin
INSERT INTO Respuestas (id_solicitud, RUT_trabajador) VALUES
(2, '45678901-2'), -- Solicitud 2 (Limpieza) respondida por Ana Rodríguez (Medio Ambiente)
(3, '56789012-3'), -- Solicitud 3 (Ruidos) respondida por Pedro Sánchez (Admin, quizás derivó)
(6, '87654321-0'); -- Solicitud 6 (Señalética) respondida por Jorge Ramírez (Tránsito)

-- ------------------------------
-- Fin de la Población
-- ------------------------------

    




proteger rutas:
Verificar el token JWT en cada ruta: En cada ruta protegida (como /panel-administrador), verifica si el usuario tiene un token JWT válido en su cookie. Si no tiene un token válido, redirige al usuario a la página de login.
Verificar el rol del usuario en cada ruta: Además de verificar si el usuario tiene un token JWT válido, también verifica si el rol del usuario (que está almacenado en el token JWT) es el rol correcto para acceder a esa ruta. Por ejemplo, si el usuario intenta acceder a /panel-administrador, verifica si su rol es "Administrador".
Utilizar un componente de protección de rutas: Crea un componente de protección de rutas que se encargue de verificar el token JWT y el rol del usuario antes de permitir el acceso a una ruta protegida.
(implementar eso en el frontend)

Backend
-------
    - npm start (iniciar y si hay cambios hay que apagarlo y prenderlo de nuevo)
    - npm run server (si uno hace un cambio se reinicia automáticamente gracias a nodemon)



Frontend
--------
    - npm run dev