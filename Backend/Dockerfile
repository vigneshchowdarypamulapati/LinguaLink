# Use Node.js LTS
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for now since some deps are misplaced)
RUN npm install

# Copy app source
COPY . .

# Expose port (Cloud Run sets PORT env variable)
EXPOSE 8080

# Cloud Run uses PORT environment variable
ENV PORT=8080

# Start the server
CMD ["npm", "start"]
