FROM node:24

# Create app directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy all code into the container
COPY . .

# Use the new Hugging Face package to pre-download the model
RUN node -e "require('@huggingface/transformers').pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')"

# Set environment variable to cache model in the correct location inside the container
ENV TRANSFORMERS_CACHE=/app/.cache
EXPOSE 7860

# Run server
CMD ["node", "server.js"]