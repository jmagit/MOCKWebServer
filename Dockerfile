FROM node:lts-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent && mv node_modules ../
COPY . .
EXPOSE 4321
VOLUME [ "/app/uploads", "/app/public", "/app/data", "/app/log" ]
CMD [ "node", "server.js" ]

# docker build --rm -t jamarton/mock-web-server .
# docker run -d --name mock-web-server -p 4321:4321 jamarton/mock-web-server
# docker run -d --name mock-web-server -p 4321:4321 -v C:\Archivos\docker\volumes\mock\data:/app/data -v C:\Archivos\docker\volumes\mock\uploads:/app/uploads -v C:\Archivos\docker\volumes\mock\log:/app/log jamarton/mock-web-server
