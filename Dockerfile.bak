# Multi-stage Dockerfile para VetAssist
# Stage 1: Build do frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Instalar dependências de produção
COPY package*.json ./
RUN npm install --omit=optional --omit=dev

# Copiar backend
COPY backend ./backend

# Copiar frontend buildado do stage anterior
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Criar diretório de uploads
RUN mkdir -p backend/uploads

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "backend/server.js"]
