FROM node:18

WORKDIR /src

COPY package.json .

RUN npm install

COPY . .

CMD ["node", "index.js"]
