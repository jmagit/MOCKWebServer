const app = require('./app');

// Servidor
const server = app.listen(app.PUERTO, function () {
  app.URL_SERVER = `http://${server.address().address == '::' ? 'localhost' : server.address().address}:${server.address().port}`
  console.log('Servidor: %s', app.URL_SERVER)
  console.log('Petición SPY %s/form', app.URL_SERVER)
  console.log('Servicio REST %s%s', app.URL_SERVER, `/eco`)
})