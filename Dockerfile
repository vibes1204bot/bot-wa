FROM node:18

RUN apt update && apt install -y git

WORKDIR /src
COPY . .
RUN npm install

CMD ["npm", "start"]
