FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies with appropriate flags to handle conflicts
RUN npm install --legacy-peer-deps

# Copy the rest of the code
COPY . .

# Set environment variables for the backend URL
ENV REACT_APP_BACKEND_URL=http://localhost:8002
ENV VITE_BACKEND_URL=http://localhost:8002

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Create simple nginx config
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"] 