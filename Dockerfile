# ============================================
# Stage 1: Build do Frontend (Vite + React)
# ============================================
FROM node:22-slim AS builder

WORKDIR /app

# Copia apenas manifestos de dependências para aproveitar cache de camadas
COPY package*.json ./

# Instala todas as dependências (incluindo devDependencies para o Vite/Tailwind/PWA)
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Copia o restante do código-fonte
COPY . .

# Gera o bundle otimizado de produção em /app/dist
RUN npm run build

# ============================================
# Stage 2: Runtime de Produção (Express + SPA)
# ============================================
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV UPLOADS_DIR=/app/uploads

COPY package*.json ./

# Instala somente dependências de produção necessárias para o servidor
RUN npm install --omit=dev --legacy-peer-deps --no-audit --no-fund && npm cache clean --force

# Copia os arquivos estáticos compilados, o servidor Express e o módulo de banco de dados
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/server ./server

# Prepara pasta padrão para Volume Persistente de imagens no CapRover
RUN mkdir -p /app/uploads

EXPOSE 3000

# Executa "node server.ts" diretamente como PID 1 (suportado nativamente no Node 22+)
CMD ["node", "server.ts"]
