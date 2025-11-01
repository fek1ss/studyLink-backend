
# Use official Node.js 18 image
FROM node:18-slim

# Create app directory
WORKDIR /app

# Install dependencies only when needed
COPY package*.json ./

RUN npm install --production

# Copy application source
COPY . .

# Expose application port
ENV PORT=5000
EXPOSE 5000

# Start the server
CMD ["node", "src/server.js"]
