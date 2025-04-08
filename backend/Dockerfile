# ---- backend/Dockerfile ----

FROM node:18-alpine

# Establecer el directorio de trabajo DENTRO del contenedor.
# Todas las rutas relativas a partir de ahora serán relativas a /app.
WORKDIR /app

# Copiar los archivos de definición de dependencias PRIMERO.
# Esto aprovecha la caché de capas de Docker. Si estos archivos no cambian,
# Docker no necesita volver a ejecutar 'npm ci' en futuras construcciones,
# incluso si tu código fuente sí cambia.
COPY package.json package-lock.json* ./

# Instalar las dependencias de producción
RUN npm install

# Copiar TODO el resto del código de tu aplicación (desde la carpeta 'backend' local)
COPY . .
EXPOSE 3001

# Ejecuta tu aplicación Node.js usando el archivo 'server.js'.
CMD [ "node", "server.js" ]