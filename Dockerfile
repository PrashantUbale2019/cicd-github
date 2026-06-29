FROM node:18-alpine

WORKDIR /PME.mjs

COPY package.json .

RUN npm install

COPY . .

EXPOSE 3000

CMD [ "node", "ndex.js" ]

