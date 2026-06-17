FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY shared/types/package.json ./shared/types/
COPY shared/eslint-config/package.json ./shared/eslint-config/

RUN npm ci

COPY . .

ARG VITE_API_URL=/api
ARG VITE_GOOGLE_CLIENT_ID

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

RUN npm run build --workspace=shared/types
RUN npm run build --workspace=client


FROM nginx:alpine AS production

COPY --from=builder /app/client/dist /usr/share/nginx/html

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
