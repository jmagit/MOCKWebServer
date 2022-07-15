const app = require('./src/app');
let lstServicio = require('./data/__servicios.json')

// Servidor
const server = app.listen(app.PUERTO, function () {
  app.URL_SERVER = `http://${server.address().address == '::' ? 'localhost' : server.address().address}:${server.address().port}`
  console.info('Servidor: %s', app.URL_SERVER)
  console.info('Petición SPY %s/form', app.URL_SERVER)
  console.group('Servicios web')
  console.info('API REST: %s%s', app.URL_SERVER, `/eco`)
  lstServicio.forEach(servicio => {
    console.log('API REST: %s%s', app.URL_SERVER, servicio.url)
  })
  console.groupEnd()
})