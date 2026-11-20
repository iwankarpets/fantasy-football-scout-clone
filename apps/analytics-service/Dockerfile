# Контекст сборки: корень монорепо
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx nest build analytics-service

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist/apps/analytics-service ./dist
USER node
EXPOSE 3004
CMD ["node", "dist/main.js"]