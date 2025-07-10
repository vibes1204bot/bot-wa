FROM node:18

WORKDIR /app

# Salin kedua file agar dependency terinstall dengan benar
COPY package.json package-lock.json ./

RUN npm install

COPY . .

CMD ["npm", "start"]
