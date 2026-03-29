# Sử dụng Node.js bản 20
FROM node:20

# Tạo thư mục app
WORKDIR /app

# Copy package.json và cài đặt dependencies
COPY package*.json ./
RUN npm install

# Copy toàn bộ code vào container
COPY . .

# Use the new Hugging Face package to pre-download the model
RUN node -e "require('@huggingface/transformers').pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')"

# Set environment variable to cache model in the correct location inside the container
ENV TRANSFORMERS_CACHE=/app/.cache
EXPOSE 7860

# Run server
CMD ["node", "server.js"]