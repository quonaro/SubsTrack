# Base stage
FROM node:20-alpine as base
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Development stage
FROM base as development
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# Build stage
FROM base as build
COPY . .
RUN npm run build

# Production stage
FROM nginx:stable-alpine as production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8001
CMD ["nginx", "-g", "daemon off;"]
