# Multi-stage Docker build for Node.js Backend API
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma engine compatibility on Alpine
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

ENV DATABASE_URL="file:./dev.db"

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

# Install OpenSSL for Prisma engine runtime on Alpine
RUN apk add --no-cache openssl

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 5000
EXPOSE 10000

ENV NODE_ENV=production
ENV DATABASE_URL="file:./dev.db"

CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
