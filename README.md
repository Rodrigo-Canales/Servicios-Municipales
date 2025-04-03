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

-- Crear la tabla Tipos_Solicitudes
CREATE TABLE IF NOT EXISTS Tipos_Solicitudes (
    id_tipo INT AUTO_INCREMENT PRIMARY KEY,
    nombre_tipo VARCHAR(255) NOT NULL,
    descripcion VARCHAR(500) DEFAULT NULL,
    area_id INT NOT NULL,
    FOREIGN KEY (area_id) REFERENCES Areas(id_area)
);

-- Crear la tabla Solicitudes
CREATE TABLE IF NOT EXISTS Solicitudes (
    id_solicitud INT AUTO_INCREMENT PRIMARY KEY,
    id_tipo INT NOT NULL,
    fecha_hora_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('Pendiente', 'Aprobada', 'Rechazada') DEFAULT 'Pendiente',
    ruta_carpeta VARCHAR(255) NOT NULL,
    RUT_ciudadano VARCHAR(12) NOT NULL,
    -- MODIFICADO: Añadir campo para correo específico de notificación
    correo_notificacion VARCHAR(255) DEFAULT NULL, -- Email al que notificar sobre ESTA solicitud
    FOREIGN KEY (RUT_ciudadano) REFERENCES Usuarios(RUT),
    FOREIGN KEY (id_tipo) REFERENCES Tipos_Solicitudes(id_tipo)
);

-- Crear la tabla Respuestas
CREATE TABLE IF NOT EXISTS Respuestas (
    id_respuesta INT AUTO_INCREMENT PRIMARY KEY,
    id_solicitud INT NOT NULL,
    fecha_hora_respuesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    RUT_trabajador VARCHAR(12) NOT NULL,
    FOREIGN KEY (id_solicitud) REFERENCES Solicitudes(id_solicitud),
    FOREIGN KEY (RUT_trabajador) REFERENCES Usuarios(RUT)
);

CREATE TABLE IF NOT EXISTS Preguntas_Frecuentes (
    id_pregunta INT AUTO_INCREMENT PRIMARY KEY,
    pregunta TEXT NOT NULL, -- Usar TEXT para preguntas potencialmente largas
    respuesta TEXT NOT NULL, -- Usar TEXT para respuestas potencialmente largas
    id_tipo INT NOT NULL,    -- Clave foránea para asociar con un tipo de solicitud
    FOREIGN KEY (id_tipo) REFERENCES Tipos_Solicitudes(id_tipo)
        ON DELETE CASCADE  -- Si se elimina el tipo de solicitud, eliminar sus preguntas frecuentes
        ON UPDATE CASCADE  -- Si cambia el id_tipo (raro), actualizar aquí
);


-- Usa la base de datos creada previamente
USE servicios_municipales;

-- ------------------------------
-- Poblar la tabla Áreas
-- ------------------------------
INSERT INTO Areas (nombre_area) VALUES
('Rentas y Patentes'),                    -- ID 1
('Medio Ambiente'),                       -- ID 2
('Unidad Vial'),                          -- ID 3
('OIRS'),                                 -- ID 4
('Tránsito'),                             -- ID 5
('Seguridad Pública'),                    -- ID 6
('Riesgos y Desastres'),                  -- ID 7
('Juzgado de Policía Local')              -- ID 8
('Programa Organizaciones Comunitarias')  -- ID 9
ON DUPLICATE KEY UPDATE nombre_area=nombre_area; -- Evita error si ya existen

-- ------------------------------
-- Poblar la tabla Usuarios
-- ------------------------------
INSERT INTO Usuarios (RUT, nombre, apellido, correo_electronico, hash_password, rol, area_id) VALUES
-- Vecinos
('11111111-1', 'Benito', 'Ordoñez', NULL, NULL, 'Vecino', NULL),
('22222222-2', 'Rodrigo', 'Canales', NULL, NULL, 'Vecino', NULL),

-- Funcionarios (Hashes de ejemplo para 'password123')
('33333333-3', 'Benito', 'Ordoñez', 'b.ordoñez@municipalidad.cl', '$2b$10$E9pwsV9yv9jmnmxcMpX.Ne94PCHfAU0j7yqAP5Q9./wJp3RfzUfZe', 'Funcionario', 1),
('44444444-4', 'Rodrigo', 'Canales', 'r.canales@municipalidad.cl', '$2b$10$E9pwsV9yv9jmnmxcMpX.Ne94PCHfAU0j7yqAP5Q9./wJp3RfzUfZe', 'Funcionario', 2),

-- Administradores
('55555555-5', 'Benito', 'Ordoñez', 'b.admin@municipalidad.cl', '$2b$10$E9pwsV9yv9jmnmxcMpX.Ne94PCHfAU0j7yqAP5Q9./wJp3RfzUfZe', 'Administrador', NULL),
('66666666-6', 'Rodrigo', 'Canales', 'r.admin@municipalidad.cl', '$2b$10$E9pwsV9yv9jmnmxcMpX.Ne94PCHfAU0j7yqAP5Q9./wJp3RfzUfZe', 'Administrador', NULL)
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), apellido=VALUES(apellido), correo_electronico=VALUES(correo_electronico), hash_password=VALUES(hash_password), rol=VALUES(rol), area_id=VALUES(area_id); -- Evita error si ya existen

-- ------------------------------
-- Poblar la tabla Tipos_Solicitudes
-- ------------------------------
INSERT INTO Tipos_Solicitudes (id_tipo, nombre_tipo, descripcion, area_id) VALUES
(1, 'Reparación de calles y veredas', 'Solicitud para reparar baches, grietas o daños en calles y aceras.', 1),
(2, 'Mantención de alumbrado público', 'Informar sobre luminarias apagadas, intermitentes o dañadas.', 1),
(3, 'Limpieza de microbasurales', 'Solicitud para retirar acumulación ilegal de basura en sitios eriazos o vía pública.', 2),
(4, 'Poda o extracción de árboles', 'Solicitud para podar o retirar árboles en la vía pública que presenten riesgo o problemas.', 2),
(5, 'Denuncia por ruidos molestos', 'Informar sobre ruidos excesivos que alteran la tranquilidad vecinal (fiestas, construcciones fuera de horario).', 3),
(6, 'Solicitud de patrullaje preventivo', 'Pedir mayor presencia de seguridad ciudadana en un sector específico.', 3),
(7, 'Inscripción a Taller Comunitario', 'Registrarse en talleres ofrecidos por el municipio (manualidades, deporte, etc.).', 4),
(8, 'Postulación a Subsidio de Agua Potable', 'Solicitar información y postular al subsidio de agua potable.', 4),
(9, 'Consulta sobre recorridos de locomoción colectiva', 'Obtener información actualizada sobre rutas y horarios del transporte público.', 5),
(10, 'Instalación de señalética de tránsito', 'Solicitar la instalación o reparación de señales de Pare, Ceda el Paso, nombres de calles, etc.', 5),
(11, 'Solicitud de permiso de evento cultural', 'Tramitar permisos para realizar eventos culturales en espacios públicos.', 6),
(12, 'Consulta de actividades culturales', 'Información sobre la agenda cultural del municipio (conciertos, exposiciones, teatro).', 6),
(13, 'Solicitud de matrícula escolar municipal', 'Proceso de inscripción para establecimientos educacionales municipales.', 7),
(14, 'Información sobre becas estudiantiles', 'Consultar requisitos y plazos para becas municipales o gubernamentales.', 7),
(15, 'Solicitud de hora médica en CESFAM', 'Pedir hora para atención médica general o especialidad en Centros de Salud Familiar.', 8),
(16, 'Programa de vacunación', 'Información sobre campañas de vacunación y horarios.', 8)
ON DUPLICATE KEY UPDATE nombre_tipo=VALUES(nombre_tipo), descripcion=VALUES(descripcion), area_id=VALUES(area_id); -- Evita error si ya existen

------------------------------
-- Poblar la tabla Preguntas Frecuentes
------------------------------
INSERT INTO Preguntas_Frecuentes (id_tipo, pregunta, respuesta) VALUES

-- Ejemplos para Reparación de calles (id_tipo = 1)
(1, '¿Cuánto tiempo tarda la reparación de un bache?', 'El tiempo de reparación varía según la carga de trabajo y la urgencia, pero generalmente intentamos abordar los baches reportados dentro de 5 a 10 días hábiles.'),

-- Ejemplos para Alumbrado público (id_tipo = 2)
(2, 'Mi poste de luz no enciende, ¿qué hago?', 'Por favor, ingrese una solicitud indicando la dirección exacta o el número del poste (si es visible) para que nuestro equipo técnico pueda revisarlo.'),





Backend
-------
    - npm start (iniciar y si hay cambios hay que apagarlo y prenderlo de nuevo)
    - npm run server (si uno hace un cambio se reinicia automáticamente gracias a nodemon)



Frontend
--------
    - npm run dev