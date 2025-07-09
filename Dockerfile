# Gunakan image Node.js versi 18
FROM node:18

# Direktori kerja di dalam container
WORKDIR /app

# Salin file dependency terlebih dahulu untuk caching
COPY package*.json ./

# Install dependency
RUN npm install

# Salin semua file ke dalam container
COPY . .

# Jalankan bot
CMD ["node", "index.js"]
