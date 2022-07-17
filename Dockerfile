FROM node:alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 4321
VOLUME [ "/app/uploads", "/app/public", "/app/data", "app/log" ]
CMD [ "node", "server.js" ]

# docker build -rm -t mock-web-server .
# docker run -d --name mock-web-server -p 4321:4321 mock-web-server
# docker run -d --name mock-web-server -p 4321:4321 -v D:\Cursos\Docker\volumes\mock\uploads:/app/uploads mock-web-server
