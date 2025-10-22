FROM node:18-alpine
WORKDIR /app

# Copy dependency files and install
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose the backend port
EXPOSE 5000

# Start the backend server
CMD ["npm", "start"]
