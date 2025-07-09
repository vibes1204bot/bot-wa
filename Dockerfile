FROM node:22-slim
LABEL "language"="nodejs"

# ✅ Tambahkan perintah ini supaya bisa install `git`
RUN apt update && apt install -y git

# 📁 Atur folder kerja
WORKDIR /src

# ⬇️ Salin semua file project ke folder kerja
COPY . .

# ⚙️ Install library dari package.json
RUN npm install

# 🌐 Buka port 3000 untuk akses bot
EXPOSE 3000

# ▶️ Jalankan file utama bot
CMD ["node", "index.js"]