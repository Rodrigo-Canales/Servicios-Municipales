# Servicios Municipales

## Introducción
Servicios Municipales es una plataforma integral diseñada para gestionar solicitudes y trámites municipales de manera eficiente. Este sistema permite a los ciudadanos interactuar con el municipio a través de solicitudes específicas, mientras que los funcionarios y administradores pueden gestionar dichas solicitudes, responderlas y mantener un registro organizado de las mismas.

---

## Ventajas de Utilizar Servicios Municipales
- **Eficiencia en la Gestión:** Centraliza la administración de solicitudes, reduciendo tiempos de respuesta y mejorando la organización.
- **Accesibilidad:** Los ciudadanos pueden realizar solicitudes desde cualquier lugar con acceso a internet.
- **Transparencia:** Permite a los usuarios rastrear el estado de sus solicitudes y recibir notificaciones.
- **Escalabilidad:** Diseñado para adaptarse a las necesidades de diferentes municipios.
- **Automatización:** Generación automática de PDFs y notificaciones por correo electrónico.

---

## Flujo de Trabajo
1. **Creación de Solicitudes:**
   - Los ciudadanos pueden crear solicitudes seleccionando un tipo específico (e.g., reparación de calles, poda de árboles).
   - Se pueden adjuntar documentos y proporcionar un correo electrónico para notificaciones.

2. **Gestión por Funcionarios:**
   - Los funcionarios revisan las solicitudes asignadas a su área.
   - Pueden aprobar, rechazar o responder las solicitudes, generando documentos PDF como comprobantes.

3. **Notificaciones:**
   - Los ciudadanos reciben notificaciones por correo electrónico sobre el estado de sus solicitudes.

4. **Administración:**
   - Los administradores tienen acceso a todas las áreas y pueden gestionar usuarios, áreas y tipos de solicitudes.

---

## Estructura del Proyecto

### Backend
- **Tecnología:** Node.js con Express.
- **Base de Datos:** MySQL.
- **Características:**
  - API RESTful para gestionar usuarios, áreas, tipos de solicitudes, solicitudes y respuestas.
  - Generación de PDFs para solicitudes y respuestas.
  - Envío de correos electrónicos mediante Nodemailer.

### Frontend
- **Tecnología:** React con Vite.
- **Características:**
  - Interfaces separadas para ciudadanos, funcionarios y administradores.
  - Diseño responsivo y moderno.
  - Uso de Material-UI para componentes estilizados.

### Docker
- Contenedores para el backend, frontend y base de datos MySQL.
- Configuración simplificada mediante `docker-compose`.

---

## Configuración de la Base de Datos

### Crear la Base de Datos
Ejecuta los siguientes comandos SQL para crear y poblar la base de datos:

```sql
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
```

---

## Poblar la Base de Datos

### Poblar la tabla Áreas
```sql
INSERT INTO Areas (nombre_area) VALUES
('Rentas y Patentes'),                    -- ID 1
('Medio Ambiente'),                       -- ID 2
('Unidad Vial'),                          -- ID 3
('OIRS'),                                 -- ID 4
('Tránsito'),                             -- ID 5
('Seguridad Pública'),                    -- ID 6
('Riesgos y Desastres'),                  -- ID 7
('Juzgado de Policía Local'),             -- ID 8
('Programa Organizaciones Comunitarias')  -- ID 9
ON DUPLICATE KEY UPDATE nombre_area=nombre_area; -- Evita error si ya existen
```

### Poblar la tabla Usuarios
```sql
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
```

### Poblar la tabla Tipos_Solicitudes
```sql
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
```

### Poblar la tabla Preguntas Frecuentes
```sql
INSERT INTO Preguntas_Frecuentes (id_tipo, pregunta, respuesta) VALUES

-- Ejemplos para Reparación de calles (id_tipo = 1)
(1, '¿Cuánto tiempo tarda la reparación de un bache?', 'El tiempo de reparación varía según la carga de trabajo y la urgencia, pero generalmente intentamos abordar los baches reportados dentro de 5 a 10 días hábiles.'),

-- Ejemplos para Alumbrado público (id_tipo = 2)
(2, 'Mi poste de luz no enciende, ¿qué hago?', 'Por favor, ingrese una solicitud indicando la dirección exacta o el número del poste (si es visible) para que nuestro equipo técnico pueda revisarlo.');
```

---

## Ejecución del Backend

### Comandos
- Iniciar el servidor:
  ```bash
  npm start
  ```
  Nota: Si realizas cambios en el código, reinicia el servidor manualmente.

- Iniciar el servidor con reinicio automático (usando nodemon):
  ```bash
  npm run server
  ```

---

## Ejecución del Frontend

### Comandos
- Iniciar el servidor de desarrollo:
  ```bash
  npm run dev
  ```

---

## Uso de Docker

### Crear un Contenedor MySQL
Ejecuta el siguiente comando para crear un contenedor MySQL:

```bash
docker run --name mysql_servicios_municipales \
  -e MYSQL_ROOT_PASSWORD=root123 \
  -e MYSQL_DATABASE=servicios_municipales \
  -e MYSQL_USER=usuario \
  -e MYSQL_PASSWORD=clave123 \
  -p 3306:3306 \
  -d mysql:latest
```

### Comandos Útiles de Docker

- Reiniciar un contenedor:
  ```bash
  docker restart <nombre_del_contenedor>
  ```

- Ver el estado de un contenedor:
  ```bash
  docker ps | grep <nombre_del_contenedor>
  ```

- Ver los últimos 50 logs de un contenedor:
  ```bash
  docker logs --tail 50 <nombre_del_contenedor>
  ```

- Activar módulos de Apache en un contenedor:
  ```bash
  docker exec <nombre_del_contenedor> a2enmod proxy proxy_http rewrite headers
  ```

---

## Comandos Adicionales

### Copiar Archivos al Contenedor
- Copiar un archivo editable al contenedor:
  ```bash
  docker cp /ruta/local/archivo.conf <nombre_del_contenedor>:/ruta/destino/archivo.conf
  ```

### Listar Módulos de Apache
- Ver los módulos habilitados en Apache dentro de un contenedor:
  ```bash
  docker exec <nombre_del_contenedor> ls -l /etc/apache2/mods-enabled/
  ```

---

## Documentación de comandos de despliegue Docker y configuración de servidores

Este documento recopila los comandos utilizados para la gestión de contenedores Docker, configuración de Apache y Nginx dentro de contenedores, y operaciones relacionadas con el firewall y la red. Se presentan en el orden en que fueron ejecutados, con una breve descripción de lo que hace cada uno y su propósito.

---

### 1. Copiar configuración de Apache al contenedor
```bash
docker cp /root/sgd/000-default.conf.editable sgd_fe:/etc/apache2/sites-available/000-default.conf
```
- **Qué hace**: Copia el archivo `000-default.conf.editable` desde el host al contenedor `sgd_fe`, sobrescribiendo `000-default.conf`.
- **Para qué sirve**: Actualizar la configuración por defecto de Apache dentro del contenedor con la versión personalizada.

### 2. Habilitar módulos de Apache en el contenedor
```bash
docker exec sgd_fe a2enmod proxy proxy_http rewrite headers
```
- **Qué hace**: Activa los módulos `proxy`, `proxy_http`, `rewrite` y `headers` de Apache dentro del contenedor `sgd_fe`.
- **Para qué sirve**: Permitir que Apache funcione como proxy inverso, gestione reescrituras de URL y manipule cabeceras HTTP.

### 3. Reiniciar Apache en el host o contenedor
```bash
service apache2 restart
```
- **Qué hace**: Reinicia el servicio de Apache.
- **Para qué sirve**: Aplicar inmediatamente los cambios de configuración.

### 4. Reiniciar el contenedor `sgd_fe`
```bash
docker restart sgd_fe
```
- **Qué hace**: Detiene y arranca nuevamente el contenedor `sgd_fe`.
- **Para qué sirve**: Asegurar que todos los procesos dentro del contenedor se inicien con la configuración actualizada.

### 5. Verificar que el contenedor esté en ejecución
```bash
docker ps | grep sgd_fe
```
- **Qué hace**: Lista los contenedores activos y filtra por `sgd_fe`.
- **Para qué sirve**: Confirmar que el contenedor está corriendo.

### 6. Detener y eliminar recursos de Docker Compose
```bash
docker compose down
```
- **Qué hace**: Detiene y elimina contenedores, redes y volúmenes anónimos definidos en el archivo `docker-compose.yml`.
- **Para qué sirve**: Realizar un apagado limpio antes de reconstruir o modificar servicios.

### 7. Reconstruir imágenes y levantar servicios en segundo plano
```bash
docker compose up --build -d
```
- **Qué hace**: Reconstruye las imágenes según los Dockerfiles y levanta todos los servicios en modo detached.
- **Para qué sirve**: Actualizar el código o dependencias y mantener la terminal libre.

### 8. Listar contenedores activos
```bash
docker ps
```
- **Qué hace**: Muestra todos los contenedores en ejecución.
- **Para qué sirve**: Obtener una visión general del estado del entorno Docker.

### 9. Ver logs del servicio de base de datos
```bash
docker compose logs db
```
- **Qué hace**: Muestra la salida de logs del servicio `db` definido en Docker Compose.
- **Para qué sirve**: Depurar errores o revisar el arranque y funcionamiento de la base de datos.

### 10. Consultar el estado del firewall UFW
```bash
sudo ufw status
```
- **Qué hace**: Muestra las reglas activas del firewall UFW en el host.
- **Para qué sirve**: Verificar que los puertos necesarios estén abiertos.

### 11. Reconstruir y levantar sólo el frontend
```bash
docker compose up --build -d frontend
```
- **Qué hace**: Reconstruye la imagen del servicio `frontend` y lo levanta en segundo plano.
- **Para qué sirve**: Actualizar únicamente la parte de frontend sin afectar otros servicios.

### 12. Reiniciar el servicio backend
```bash
docker compose restart backend
```
- **Qué hace**: Detiene y arranca nuevamente el contenedor `backend`.
- **Para qué sirve**: Aplicar cambios de código o configuración en el backend.

### 13. Conectar un contenedor a una red Docker
```bash
docker network connect servicios_municipales_net <nombre_contenedor>
```
- **Qué hace**: Añade el contenedor especificado a la red `servicios_municipales_net`.
- **Para qué sirve**: Permitir comunicación entre contenedores en la misma red.

### 14. Reconstruir el frontend sin cache
```bash
docker compose build --no-cache frontend
```
- **Qué hace**: Fuerza la reconstrucción completa de la imagen `frontend` ignorando capas cacheadas.
- **Para qué sirve**: Asegurar que todos los cambios, incluidas dependencias, se apliquen.

### 15. Levantar todos los servicios en segundo plano
```bash
docker compose up -d
```
- **Qué hace**: Inicia todos los servicios definidos en modo detached.
- **Para qué sirve**: Mantener el entorno corriendo sin bloquear la terminal.

### 16. Ver logs del contenedor frontend
```bash
docker logs frontend_servicios_municipales
```
- **Qué hace**: Muestra los logs del contenedor `frontend_servicios_municipales`.
- **Para qué sirve**: Depurar errores o confirmar el arranque correcto del frontend.

### 17. Ver logs del contenedor backend
```bash
docker logs backend_servicios_municipales
```
- **Qué hace**: Muestra los logs del contenedor `backend_servicios_municipales`.
- **Para qué sirve**: Revisar errores o información de arranque del backend.

### 18. Copiar configuración de Apache nuevamente
```bash
docker cp /root/sgd/000-default.conf.editable sgd_fe:/etc/apache2/sites-available/000-default.conf
```
- **Qué hace**: Sobrescribe la configuración de Apache en el contenedor `sgd_fe`.
- **Para qué sirve**: Asegurar que la última versión del archivo esté presente antes de probar la sintaxis.

### 19. Verificar sintaxis de Apache
```bash
docker exec sgd_fe apachectl configtest
```
- **Qué hace**: Ejecuta la prueba de configuración de Apache dentro de `sgd_fe`.
- **Para qué sirve**: Comprobar que no hay errores de sintaxis antes de reiniciar.

### 20. Reiniciar Apache en el contenedor
```bash
docker exec sgd_fe service apache2 restart
```
*(o `apachectl restart`)*
- **Qué hace**: Reinicia el servicio de Apache dentro del contenedor.
- **Para qué sirve**: Aplicar la configuración validada sin salir del contenedor.

### 21. Probar sintaxis de Nginx en el contenedor gateway
```bash
docker exec sgd_gtw nginx -t
```
- **Qué hace**: Verifica la sintaxis de la configuración de Nginx en `sgd_gtw`.
- **Para qué sirve**: Asegurar que no hay errores antes de recargar el servicio.

### 22. Reiniciar el contenedor gateway
```bash
docker restart sgd_gtw
```
- **Qué hace**: Detiene y arranca de nuevo el contenedor `sgd_gtw`.
- **Para qué sirve**: Recargar todo el contenedor, incluido Nginx, con la nueva configuración.

### 23. Recargar configuración de Nginx sin interrumpir conexiones
```bash
docker exec sgd_gtw nginx -s reload
```
- **Qué hace**: Envía la señal de recarga a Nginx dentro de `sgd_gtw`.
- **Para qué sirve**: Aplicar cambios de configuración en caliente, sin detener el servicio.

---

docker network ls
docker network connect servicios_municipales_net sgd_gtw
docker exec -it sgd_gtw curl http://backend_servicios_municipales:3000/api
cat /etc/apache2/apache2.conf

Para parar y eliminar los contenedores

    docker-compose down

Para los contenedores de Docker Compose

    docker-compose up -d --build

Cuando hago un cambio en el front

    docker compose up -d --no-deps --build frontend

Cuando hago un cambio en el back

    docker compose restart backend

Cuando agregas o cambias dependencias en el backend (por ejemplo, si agregas date-fns-tz en package.json), debes reconstruir la imagen del backend para que se instalen correctamente:

    docker compose up -d --no-deps --build backend

Esto fuerza la reconstrucción solo del backend y asegura que todas las dependencias estén instaladas en el contenedor.
