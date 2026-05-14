# Dockerfile minimal - usa frontend já pré-buildado
FROM node:20-alpine

WORKDIR /app

# Copia package.json e instala dependências de produção
COPY package*.json ./
RUN npm install --omit=optional --omit=dev

# Copia o código backend e o frontend já pré-buildado
COPY backend ./backend
COPY frontend/dist ./frontend/dist

# Cria diretório de uploads
RUN mkdir -p backend/uploads

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "backend/server.js"]
