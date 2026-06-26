FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY shared/types/package.json ./shared/types/
COPY shared/eslint-config/package.json ./shared/eslint-config/

RUN npm ci

COPY . .
COPY .env.client .

RUN set -a && \
    . ./.env.client && \
    set +a && \
    npm run build --workspace=shared/types && \
    npm run build --workspace=client


FROM nginx:alpine AS production

COPY --from=builder /app/client/dist /usr/share/nginx/html

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
