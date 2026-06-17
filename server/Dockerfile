FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY shared/types/package.json ./shared/types/
COPY shared/eslint-config/package.json ./shared/eslint-config/

RUN npm ci

COPY . .

RUN npm run build --workspace=shared/types
RUN npm run build --workspace=server

RUN npm prune --omit=dev


FROM node:24-alpine AS production
WORKDIR /app/server

ENV NODE_ENV=production

COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/package.json ./
COPY --from=builder /app/shared/types/dist /app/shared/types/dist
COPY --from=builder /app/shared/types/package.json /app/shared/types/

EXPOSE 3000

CMD ["node", "dist/index.js"]
