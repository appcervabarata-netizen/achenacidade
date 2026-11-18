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

COPY package*.json ./

# Instala somente dependências de produção necessárias para o servidor
RUN npm install --omit=dev --legacy-peer-deps --no-audit --no-fund && npm cache clean --force

# Copia os arquivos estáticos compilados e o servidor Express
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts

EXPOSE 3000

# Executa "node server.ts" (suportado nativamente no Node 22+)
CMD ["npm", "start"]
