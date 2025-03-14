# Servicios-Municipales

Creación de la base de datos:


-- Creación de la base de datos
CREATE DATABASE IF NOT EXISTS municipalidad_solicitudes;

-- Usar la base de datos
USE municipalidad_solicitudes;

-- Tabla: Usuarios
CREATE TABLE Usuarios (
    rut VARCHAR(20) PRIMARY KEY,
    nombres VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255) NOT NULL,
    correo VARCHAR(255) UNIQUE
);

-- Tabla: Areas
CREATE TABLE Areas (
    id_area INT AUTO_INCREMENT PRIMARY KEY,
    nombre_area VARCHAR(255) NOT NULL
);

-- Tabla: Tipos_Solicitudes
CREATE TABLE Tipos_Solicitudes (
    id_solicitud INT AUTO_INCREMENT PRIMARY KEY,
    tipo_solicitud VARCHAR(255) NOT NULL,
    area_id INT,
    FOREIGN KEY (area_id) REFERENCES Areas(id_area)
);

-- Tabla: Trabajadores
CREATE TABLE Trabajadores (
    rut VARCHAR(20) PRIMARY KEY,
    correo_institucional VARCHAR(255) NOT NULL,
    area_id INT,
    rol VARCHAR(50) NOT NULL,
    FOREIGN KEY (rut) REFERENCES Usuarios(rut),
    FOREIGN KEY (area_id) REFERENCES Areas(id_area)
);

-- Tabla: Solicitudes
CREATE TABLE Solicitudes (
    id_solicitud INT AUTO_INCREMENT PRIMARY KEY,
    rut_usuario VARCHAR(20) NOT NULL,
    tipo_solicitud INT NOT NULL,
    fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(50) DEFAULT 'Pendiente',
    archivo_adjunto VARCHAR(255),
    descripcion TEXT,
    FOREIGN KEY (rut_usuario) REFERENCES Usuarios(rut),
    FOREIGN KEY (tipo_solicitud) REFERENCES Tipos_Solicitudes(id_solicitud)
);

-- Tabla: Respuestas
CREATE TABLE Respuestas (
    id_respuesta INT AUTO_INCREMENT PRIMARY KEY,
    id_solicitud INT NOT NULL,
    rut_trabajador VARCHAR(20) NOT NULL,
    fecha_respuesta DATETIME DEFAULT CURRENT_TIMESTAMP,
    respuesta TEXT,
    archivo_adjunto VARCHAR(255),
    FOREIGN KEY (id_solicitud) REFERENCES Solicitudes(id_solicitud),
    FOREIGN KEY (rut_trabajador) REFERENCES Trabajadores(rut)
);


Poblar 4 tablas:

-- Poblar la tabla Areas
INSERT INTO Areas (nombre_area) VALUES
('Secretaría Municipal'),
('Dirección de Desarrollo comunitario'),
('Dirección de Control Interno'),
('Dirección de Administración y Finanzas'),
('Dirección de Obras Municipales (DOM)'),
('Seguridad Pública'),
('Asesoría Jurídica'),
('Secretaría Comunal de Planificación (SECPLAN)'),
('Riesgos y Desastres'),
('Servicios Traspasados');

-- Poblar la tabla Tipos_Solicitudes
INSERT INTO Tipos_Solicitudes (tipo_solicitud, area_id) VALUES
('Solicitud de Certificado de Residencia', 1),
('Solicitud de Información Pública', 1),
('Solicitud de Audiencia con el Alcalde', 1),
('Solicitud de Permiso para Evento Público', 1),

('Solicitud de Inscripción en Programa Social', 2),
('Solicitud de Apoyo para Proyecto Comunitario', 2),
('Solicitud de Capacitación', 2),
('Solicitud de Uso de Espacio Comunitario', 2),

('Solicitud de Revisión de Documentos', 3),
('Solicitud de Informe de Auditoría', 3),
('Solicitud de Aclaración de Procedimientos', 3),
('Solicitud de Denuncia de Irregularidades', 3),

('Solicitud de Autorización de Gasto', 4),
('Solicitud de Rendición de Cuentas', 4),
('Solicitud de Información Financiera', 4),
('Solicitud de Modificación Presupuestaria', 4),

('Solicitud de Permiso de Construcción', 5),
('Solicitud de Inspección de Obra', 5),
('Solicitud de Autorización de Demolición', 5),
('Solicitud de Informe Técnico de Obra', 5),

('Solicitud de Patrullaje Preventivo', 6),
('Solicitud de Denuncia de Delito', 6),
('Solicitud de Información sobre Seguridad', 6),
('Solicitud de Apoyo en Caso de Emergencia', 6),

('Solicitud de Asesoría Legal', 7),
('Solicitud de Dictamen Jurídico', 7),
('Solicitud de Revisión de Contrato', 7),
('Solicitud de Representación Legal', 7),

('Solicitud de Aprobación de Plan Regulador', 8),
('Solicitud de Modificación de Plan Regulador', 8),
('Solicitud de Informe de Uso de Suelo', 8),
('Solicitud de Autorización de Subdivisión', 8),

('Solicitud de Evaluación de Riesgo', 9),
('Solicitud de Plan de Contingencia', 9),
('Solicitud de Informe de Daños y Pérdidas', 9),
('Solicitud de Apoyo en Caso de Desastre', 9),

('Solicitud de Información sobre Servicios Traspasados', 10),
('Solicitud de Reclamo por Servicios Traspasados', 10),
('Solicitud de Autorización para Modificación de Servicios Traspasados', 10),
('Solicitud de Informe sobre el Estado de los Servicios Traspasados', 10);

-- Poblar la tabla Usuarios
INSERT INTO Usuarios (rut, nombres, apellidos, correo) VALUES
('12.345.678-9', 'Juan', 'Pérez', 'juan.perez@example.com'),
('13.456.789-0', 'María', 'González', 'maria.gonzalez@example.com'),
('14.567.890-1', 'Pedro', 'Rodríguez', 'pedro.rodriguez@example.com'),
('15.678.901-2', 'Ana', 'López', 'ana.lopez@example.com'),
('16.789.012-3', 'Carlos', 'Martínez', 'carlos.martinez@example.com'),
('17.890.123-4', 'Sofía', 'Hernández', 'sofia.hernandez@example.com'),
('18.901.234-5', 'Diego', 'Ramírez', 'diego.ramirez@example.com'),
('19.012.345-6', 'Isabela', 'Torres', 'isabela.torres@example.com'),
('20.123.456-7', 'Mateo', 'Vargas', 'mateo.vargas@example.com'),
('21.234.567-8', 'Valentina', 'Silva', 'valentina.silva@example.com'),
('22.345.678-0', 'Sebastián', 'Castro', 'sebastian.castro@example.com'),
('23.456.789-1', 'Camila', 'Reyes', 'camila.reyes@example.com'),
('24.567.890-2', 'Nicolás', 'Díaz', 'nicolas.diaz@example.com'),
('25.678.901-3', 'Lucía', 'Ortiz', 'lucia.ortiz@example.com'),
('26.789.012-4', 'Benjamín', 'Guzmán', 'benjamin.guzman@example.com'),
('27.890.123-5', 'Emilia', 'Mendoza', 'emilia.mendoza@example.com'),
('28.901.234-6', 'Joaquín', 'Paredes', 'joaquin.paredes@example.com'),
('29.012.345-7', 'Renata', 'Soto', 'renata.soto@example.com'),
('30.123.456-8', 'Gaspar', 'Alvarez', 'gaspar.alvarez@example.com'),
('31.234.567-9', 'Florencia', 'Contreras', 'florencia.contreras@example.com');

-- Poblar la tabla Trabajadores
INSERT INTO Trabajadores (rut, correo_institucional, area_id, rol) VALUES
('12.345.678-9', 'juan.perez@municipalidad.cl', 1, 'Administrador'),
('13.456.789-0', 'maria.gonzalez@municipalidad.cl', 2, 'Trabajador'),
('14.567.890-1', 'pedro.rodriguez@municipalidad.cl', 3, 'Trabajador'),
('15.678.901-2', 'ana.lopez@municipalidad.cl', 4, 'Trabajador'),
('16.789.012-3', 'carlos.martinez@municipalidad.cl', 5, 'Trabajador'),
('17.890.123-4', 'sofia.hernandez@municipalidad.cl', 6, 'Trabajador'),
('18.901.234-5', 'diego.ramirez@municipalidad.cl', 7, 'Trabajador'),
('19.012.345-6', 'isabela.torres@municipalidad.cl', 8, 'Trabajador'),
('20.123.456-7', 'mateo.vargas@municipalidad.cl', 9, 'Trabajador'),
('21.234.567-8', 'valentina.silva@municipalidad.cl', 10, 'Trabajador'),
('22.345.678-0', 'sebastian.castro@municipalidad.cl', 1, 'Trabajador'),
('23.456.789-1', 'camila.reyes@municipalidad.cl', 2, 'Trabajador'),
('24.567.890-2', 'nicolas.diaz@municipalidad.cl', 3, 'Trabajador'),
('25.678.901-3', 'lucia.ortiz@municipalidad.cl', 4, 'Trabajador'),
('26.789.012-4', 'benjamin.guzman@municipalidad.cl', 5, 'Trabajador'),
('27.890.123-5', 'emilia.mendoza@municipalidad.cl', 6, 'Trabajador'),
('28.901.234-6', 'joaquin.paredes@municipalidad.cl', 7, 'Trabajador'),
('29.012.345-7', 'renata.soto@municipalidad.cl', 8, 'Trabajador'),
('30.123.456-8', 'gaspar.alvarez@municipalidad.cl', 9, 'Trabajador'),
('31.234.567-9', 'florencia.contreras@municipalidad.cl', 10, 'Trabajador');



