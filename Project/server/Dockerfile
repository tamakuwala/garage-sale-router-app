FROM node:latest

WORKDIR /app

EXPOSE 8080

RUN npm init -y
RUN npm install express body-parser nodemon mongodb mongoose mongodb-client-encryption

CMD ["npx", "nodemon", "src/server.js"]