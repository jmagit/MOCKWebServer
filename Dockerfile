FROM node:lts-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent && mv node_modules ../
COPY . .
EXPOSE 4321
VOLUME [ "/app/uploads", "/app/public", "/app/data", "app/log" ]
CMD [ "node", "start" ]

# docker build -rm -t mock-web-server .
# docker run -d --name mock-web-server -p 4321:4321 mock-web-server
# docker run -d --name mock-web-server -p 4321:4321 -v D:\Cursos\Docker\volumes\mock\uploads:/app/uploads mock-web-server
