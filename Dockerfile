# Gunakan Node.js versi 18
FROM node:18

# Buat direktori kerja di dalam container
WORKDIR /app

# Salin file package.json & package-lock.json (jika ada)
COPY package*.json ./

# Install dependensi
RUN npm install

# Salin semua file ke container
COPY . .

# Jalankan bot saat container start
CMD ["node", "index.js"]
