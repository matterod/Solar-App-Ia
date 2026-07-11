FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose port 8000
EXPOSE 8000

# Run the compiled code
CMD ["npm", "start"]
