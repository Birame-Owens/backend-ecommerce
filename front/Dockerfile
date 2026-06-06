# ─── Stage 1 : build Vite ─────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

COPY . .

ARG VITE_API_URL=https://api.nd-world.site
ENV VITE_API_URL=$VITE_API_URL

# DSN Sentry du front (public par nature — part dans le bundle JS).
# Valeur en dur car le toggle "build variable" Coolify est introuvable ici.
ARG VITE_SENTRY_DSN=https://27d0fe985e8b6053553eff13f4568a55@o4511515761639424.ingest.de.sentry.io/4511515788836944
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN

RUN npx vite build

# ─── Stage 2 : Nginx serving static files ────────────────────────────────────
FROM nginx:1.25-alpine AS production

COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
