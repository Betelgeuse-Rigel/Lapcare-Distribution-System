# Stage 1: Build the Vite React app
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source code
COPY . .

# Build application
RUN npm run build

# Stage 2: Serve the build output with Nginx
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 to the outer world
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
