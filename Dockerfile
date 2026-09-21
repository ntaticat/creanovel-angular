# =====================
# STAGE 0: Build de producción (con service worker)
# =====================
FROM node:24-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# El frontend de producción trae la URL de la API en environment.prod.ts (la API real). Para probar el build de
# producción contra otra API (p. ej. la de docker compose) se sustituye aquí, dentro de la imagen y no en el repo.
ARG API_ORIGIN=https://creanovel-api.ntaticat.lat
RUN sed -i \
      -e "s#url: '[^']*'#url: '${API_ORIGIN}/api'#" \
      -e "s#apiOrigin: '[^']*'#apiOrigin: '${API_ORIGIN}'#" \
      src/environments/environment.prod.ts \
    && grep -q "apiOrigin: '${API_ORIGIN}'" src/environments/environment.prod.ts \
    && grep -q "url: '${API_ORIGIN}/api'" src/environments/environment.prod.ts

RUN npx ng build

# =====================
# STAGE 1: Servidor estático (nginx) con fallback de SPA y cabeceras para el service worker
# =====================
FROM nginx:1.25-alpine AS final
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/creanovel/browser /usr/share/nginx/html
EXPOSE 80
