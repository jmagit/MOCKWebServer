FROM node:alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 4321
CMD [ "node", "server.js" ]

# docker build -t mock-web-server .
# docker run -d --name mock-web-server -p 4321:4321 mock-web-server