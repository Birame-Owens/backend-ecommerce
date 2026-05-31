# ─── Stage 1 : build Vite ─────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

COPY . .

ARG VITE_API_URL=https://api.nd-world.site
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ─── Stage 2 : Nginx serving static files ────────────────────────────────────
FROM nginx:1.25-alpine AS production

COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
