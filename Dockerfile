# Use Node.js version 20
FROM node:20

# Create app directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy all code into container
COPY . .

# Run model cache build command (same as on Render) to startup faster
RUN node -e "require('@xenova/transformers').pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')"

# Expose port 7860 (default port for HF Spaces)
EXPOSE 7860

# Run server
CMD ["node", "server.js"]