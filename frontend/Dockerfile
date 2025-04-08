# ---- frontend/Dockerfile ----

# --- Etapa 1: Construcción (Build Stage) ---
# Usamos Node.js Alpine como imagen base para construir el proyecto
FROM node:18-alpine AS builder

# Establecer el directorio de trabajo DENTRO del contenedor para esta etapa
WORKDIR /app

# Copiar archivos de definición de dependencias
COPY package.json package-lock.json* ./

# Instalar dependencias usando el lockfile
RUN npm install

# Copiar TODO el resto del código fuente del frontend
COPY . .

# Ejecutar el comando de build definido en tu package.json (usualmente 'npm run build' para Vite)
RUN npm run build

# --- Etapa 2: Servidor (Serve Stage) ---
# Usamos una imagen ligera de Nginx para servir los archivos estáticos
FROM nginx:stable-alpine

# Copiar la configuración personalizada de Nginx (ver Paso 4 abajo)
# Esto es importante para que funcionen las rutas de las Single Page Applications (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos estáticos construidos desde la etapa 'builder'
# Vite por defecto construye en la carpeta 'dist'. Ajusta si es diferente.
# Los copiamos al directorio raíz por defecto de Nginx.
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer el puerto 80 (puerto por defecto de Nginx)
EXPOSE 80

# Nginx se inicia automáticamente por defecto, pero especificamos el comando
# para asegurarnos de que se mantenga en primer plano.
CMD ["nginx", "-g", "daemon off;"]