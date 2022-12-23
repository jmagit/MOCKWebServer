const app = require('./src/app');
let lstServicio = require('./data/__servicios.json')

// Servidor
app.server.listen(app.PUERTO, function () {
  app.URL_SERVER = `http://${app.server.address().address == '::' ? 'localhost' : app.server.address().address}:${app.server.address().port}`
  console.info('Servidor: %s', app.URL_SERVER)
  console.info('Petición SPY %s/form', app.URL_SERVER)
  console.group('Servicios web')
  console.info('API REST: %s%s', app.URL_SERVER, `/eco`)
  lstServicio.forEach(servicio => {
    console.log('API REST: %s%s/%s', app.URL_SERVER, app.DIR_API_REST, servicio.endpoint)
  })
  console.groupEnd()
})
