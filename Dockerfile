# Dockerfile simples - single stage para Railway
FROM node:20-alpine

WORKDIR /app

# Copia toda a aplicação primeiro
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Instala dependências do backend (sem optional, ex: sqlite3 que requer native build)
RUN npm install --omit=optional --omit=dev

# Instala dependências do frontend
RUN cd frontend && npm install

# Copia o resto do código
COPY backend ./backend
COPY frontend ./frontend

# Build do frontend
RUN cd frontend && npm run build

# Cria diretório de uploads
RUN mkdir -p backend/uploads

# Variáveis padrão
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "backend/server.js"]
