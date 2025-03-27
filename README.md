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
('Obras Públicas'),               -- ID 1
('Medio Ambiente Aseo y Ornato'), -- ID 2
('Seguridad Ciudadana'),          -- ID 3
('Desarrollo Comunitario'),       -- ID 4
('Tránsito y Transporte Público'),-- ID 5
('Cultura'),                      -- ID 6
('Educación'),                    -- ID 7
('Salud Municipal')               -- ID 8
ON DUPLICATE KEY UPDATE nombre_area=nombre_area; -- Evita error si ya existen

-- ------------------------------
-- Poblar la tabla Usuarios
-- ------------------------------
INSERT INTO Usuarios (RUT, nombre, apellido, correo_electronico, hash_password, rol, area_id) VALUES
-- Vecinos
('11111111-1', 'Elena', 'Martínez', 'elena.m@email.com', NULL, 'Vecino', NULL),
('22222222-2', 'Roberto', 'Silva', 'r.silva@email.com', NULL, 'Vecino', NULL),
('12345678-9', 'Juan', 'Pérez', 'juan.perez@email.com', NULL, 'Vecino', NULL),
('23456789-0', 'María', 'González', 'maria.g@email.com', NULL, 'Vecino', NULL),
('98765432-1', 'Luisa', 'Fernández', 'luisa.f@email.com', NULL, 'Vecino', NULL),
-- Funcionarios (Hashes de ejemplo para 'password123')
('34567890-1', 'Carlos', 'López', 'c.lopez@municipalidad.cl', '$2b$10$E9pwsV9yv9jmnmxcMpX.Ne94PCHfAU0j7yqAP5Q9./wJp3RfzUfZe', 'Funcionario', 1),
('45678901-2', 'Ana', 'Rodríguez', 'a.rodriguez@municipalidad.cl', '$2b$10$E9pwsV9yv9jmnmxcMpX.Ne94PCHfAU0j7yqAP5Q9./wJp3RfzUfZe', 'Funcionario', 2),
('87654321-0', 'Jorge', 'Ramírez', 'j.ramirez@municipalidad.cl', '$2b$10$E9pwsV9yv9jmnmxcMpX.Ne94PCHfAU0j7yqAP5Q9./wJp3RfzUfZe', 'Funcionario', 5),
('76543210-9', 'Sofía', 'Castro', 's.castro@municipalidad.cl', '$2b$10$E9pwsV9yv9jmnmxcMpX.Ne94PCHfAU0j7yqAP5Q9./wJp3RfzUfZe', 'Funcionario', 4),
('65432109-8', 'Andrés', 'Vargas', 'a.vargas@municipalidad.cl', '$2b$10$E9pwsV9yv9jmnmxcMpX.Ne94PCHfAU0j7yqAP5Q9./wJp3RfzUfZe', 'Funcionario', 1),
-- Administradores
('56789012-3', 'Pedro', 'Sánchez', 'p.sanchez@municipalidad.cl', '$2b$10$E9pwsV9yv9jmnmxcMpX.Ne94PCHfAU0j7yqAP5Q9./wJp3RfzUfZe', 'Administrador', NULL),
('10101010-1', 'Isidora', 'Díaz', 'i.diaz@municipalidad.cl', '$2b$10$E9pwsV9yv9jmnmxcMpX.Ne94PCHfAU0j7yqAP5Q9./wJp3RfzUfZe', 'Administrador', NULL)
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

-- ------------------------------
-- Poblar la tabla Solicitudes
-- ------------------------------
-- MODIFICADO: Añadir columna correo_notificacion (ejemplos con NULL, puedes poner emails)
INSERT INTO Solicitudes (id_solicitud, id_tipo, estado, ruta_carpeta, RUT_ciudadano, correo_notificacion, fecha_hora_envio) VALUES
(1, 1, 'Pendiente', '/srv/sol/11111111-1/1', '11111111-1', 'elena.notif@email.com', NOW() - INTERVAL 7 DAY), -- Correo específico
(2, 3, 'Aprobada', '/srv/sol/22222222-2/3', '22222222-2', NULL, NOW() - INTERVAL 5 DAY),
(3, 5, 'Rechazada', '/srv/sol/12345678-9/5', '12345678-9', NULL, NOW() - INTERVAL 4 DAY),
(4, 8, 'Pendiente', '/srv/sol/23456789-0/8', '23456789-0', NULL, NOW() - INTERVAL 3 DAY),
(5, 2, 'Pendiente', '/srv/sol/98765432-1/2', '98765432-1', NULL, NOW() - INTERVAL 2 DAY),
(6, 10, 'Aprobada', '/srv/sol/11111111-1/10', '11111111-1', 'elena.notif@email.com', NOW() - INTERVAL 1 DAY), -- Correo específico
(7, 15, 'Pendiente', '/srv/sol/22222222-2/15', '22222222-2', NULL, NOW()),
(8, 4, 'Pendiente', '/srv/sol/12345678-9/4', '12345678-9', 'juan.perez@email.com', NOW() - INTERVAL 6 HOUR) -- Usa el mismo correo del usuario
ON DUPLICATE KEY UPDATE id_tipo=VALUES(id_tipo), estado=VALUES(estado), ruta_carpeta=VALUES(ruta_carpeta), RUT_ciudadano=VALUES(RUT_ciudadano), correo_notificacion=VALUES(correo_notificacion), fecha_hora_envio=VALUES(fecha_hora_envio); -- Evita error si ya existen

-- ------------------------------
-- Poblar la tabla Respuestas
-- ------------------------------
INSERT INTO Respuestas (id_respuesta, id_solicitud, RUT_trabajador) VALUES
(1, 2, '45678901-2'),
(2, 3, '56789012-3'),
(3, 6, '87654321-0')
ON DUPLICATE KEY UPDATE id_solicitud=VALUES(id_solicitud), RUT_trabajador=VALUES(RUT_trabajador); -- Evita error si ya existen

------------------------------
-- Poblar la tabla Preguntas Frecuentes
------------------------------
INSERT INTO Preguntas_Frecuentes (id_tipo, pregunta, respuesta) VALUES
-- Ejemplos para Reparación de calles (id_tipo = 1)
(1, '¿Cuánto tiempo tarda la reparación de un bache?', 'El tiempo de reparación varía según la carga de trabajo y la urgencia, pero generalmente intentamos abordar los baches reportados dentro de 5 a 10 días hábiles.'),
(1, '¿Puedo solicitar la repavimentación completa de mi calle?', 'La repavimentación completa se planifica según un catastro general del estado de las vías. Puede ingresar una solicitud para que se evalúe la condición de su calle.'),
-- Ejemplos para Alumbrado público (id_tipo = 2)
(2, 'Mi poste de luz no enciende, ¿qué hago?', 'Por favor, ingrese una solicitud indicando la dirección exacta o el número del poste (si es visible) para que nuestro equipo técnico pueda revisarlo.'),
(2, '¿Puedo solicitar un nuevo punto de luz para mi pasaje?', 'Sí, puede ingresar una solicitud detallando la ubicación donde considera necesario un nuevo punto de luz. Se evaluará la factibilidad técnica y presupuestaria.'),
-- Ejemplos para Limpieza (id_tipo = 3)
(3, '¿Con qué frecuencia limpian los microbasurales?', 'Intentamos limpiar los puntos críticos identificados regularmente, pero dependemos de los reportes ciudadanos. Ingrese su solicitud para asegurar la limpieza del punto específico.'),
-- Ejemplos para Árboles (id_tipo = 4)
(4, '¿Necesito permiso para podar un árbol fuera de mi casa?', 'Sí, los árboles en la vía pública son gestionados por el municipio. Debe ingresar una solicitud para que el equipo de Ornato evalúe y realice la poda si corresponde.'),
-- Ejemplos para Ruidos molestos (id_tipo = 5)
(5, '¿Qué pasa después de denunciar ruidos molestos?', 'Inspectores municipales o personal de seguridad ciudadana pueden acudir al lugar para verificar la situación y cursar las infracciones correspondientes si la normativa se está incumpliendo.'),
-- Ejemplos para Hora Médica (id_tipo = 15)
(15, '¿Cómo pido hora para un especialista en el CESFAM?', 'La derivación a especialistas generalmente requiere una evaluación previa por médico general en el CESFAM. Solicite primero una hora con médico general para evaluar su caso.'),
(15, '¿Puedo pedir hora por teléfono?', 'Dependiendo del CESFAM, puede haber horarios específicos para solicitar hora telefónicamente o a través de alguna plataforma online. Consulte directamente con su CESFAM para conocer las vías disponibles.')
ON DUPLICATE KEY UPDATE pregunta=VALUES(pregunta), respuesta=VALUES(respuesta), id_tipo=VALUES(id_tipo); -- Evita duplicados si se ejecuta de nuevo





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