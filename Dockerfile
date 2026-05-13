# Multi-stage Dockerfile para VetAssist
# Stage 1: Build do frontend
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend

# Copia os arquivos do frontend
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Build da aplicação completa
FROM node:22-alpine

WORKDIR /app

# Copia package.json e instala dependências de produção (sem sqlite3 que é optional)
COPY package*.json ./
RUN npm install --omit=optional --omit=dev

# Copia o código do backend
COPY backend ./backend

# Copia o frontend buildado do stage anterior
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Cria diretório de uploads
RUN mkdir -p backend/uploads

# Expõe a porta (Railway define dinamicamente)
EXPOSE 5000

# Inicia o servidor
CMD ["node", "backend/server.js"]
