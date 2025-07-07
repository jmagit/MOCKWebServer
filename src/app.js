const fs = require('fs/promises')
const path = require('path');
const { createServer } = require('http');
const express = require('express')
const morgan = require('morgan')
const multer = require('multer')
const rfs = require('rotating-file-stream')
const cookieParser = require('cookie-parser')
const swaggerUi = require('swagger-ui-express');
const YAML = require('yaml')
const OpenApiValidator = require('express-openapi-validator');
const validator = require('validator');
const xss = require('xss')
const config = require('../config')
const { generaSwaggerSpecification } = require('./openapi-generator');
const { generateErrorByError } = require('./utils')
const { createWSServer } = require('./web-sockets')

const serviciosConfig = require('../data/__servicios.json')
const seguridad = require('./seguridad')
const apiRouter = require('./apirest');

let VALIDATE_XSRF_TOKEN = false;

const app = express()
app.disable('x-powered-by');
app.PUERTO = process.env.PORT || '4321';
app.URL_SERVER = ''
app.DIR_API_REST = config.paths.API_REST
app.server = createServer(app)
app.wss = createWSServer(app)

const shutdown = () => {
  if (app.server) {
    app.server.close()
  }
  process.kill(process.pid, 'SIGTERM');
}

// Argumentos de entrada
process.argv.forEach(val => {
  if (val.toLocaleLowerCase().startsWith('--port='))
    app.PUERTO = val.substring('--port='.length)
  else if (val.toLocaleLowerCase().startsWith('--xsrf')) {
    VALIDATE_XSRF_TOKEN = true
    console.info('Activada protección XSRF.')
  }
});

// Registro
if (process.env.NODE_ENV !== 'test')
  app.use(morgan('combined', {
    stream: rfs.createStream('file.log', {
      path: path.join(__dirname, '../log'), // directory
      size: '10M', // rotate every 10 MegaBytes written
      interval: '1d', // rotate daily
      compress: 'gzip' // compress rotated files
    })
  }))

// parse application/json
app.use(express.json())
// parse application/x-www-form-urlencoded
app.use(express.urlencoded({
  extended: false
}))
// parse header/cookies
app.use(cookieParser())

// Ficheros públicos
app.use(express.static(config.paths.PUBLIC))

const upload = multer({
  storage: {
    destination: (_req, _file, cb) => cb(null, 'uploads/'),
    filename: (_req, file, cb) => cb(null, file.originalname),
    limits: { fileSize: 100000 /* 2 * 1024 * 1024 /* 2mb */ },
  },
  limits: { fileSize: 100000 /* 2 * 1024 * 1024 /* 2mb */ },
})
app.use('/files', express.static('uploads'))
app.get('/fileupload', function (_req, res) {
  res.status(200).end(plantillaHTML('fileupload', `
    <h1>Multiple file uploads</h1>
    <form action="fileupload" method="post" enctype="multipart/form-data">
      <p>
        <input type="file" name="filestoupload" multiple="multiple" required><br>
        <input type="submit">
      </p>
    </form>
  `))
})

app.post('/fileupload', upload.array('filestoupload'), function (req, res, next) {
  try {
    let rutas = req.files.map(f => ({ url: `${app.URL_SERVER}/files/${f.originalname}` }))
    if (req.headers?.accept?.includes('application/json'))
      res.status(200).json(rutas).end();
    else {
      res.status(200).end(plantillaHTML('Ficheros', xss(`
        <h1>Ficheros subidos</h1>
        <ul>${rutas.map(r => `<li><a href="${r.url}">${r.url}</a></li>`).join('')}</ul>
      `)));
    }
  } catch (error) {
    next(generateErrorByError(req, error, 500))
  }
})

// Cross-origin resource sharing (CORS)
app.use(seguridad.useCORS)

// Cookie-to-Header Token
if (VALIDATE_XSRF_TOKEN) {
  app.use(seguridad.useXSRF)
}

// Validación OpenApi
app.use(
  OpenApiValidator.middleware({
    apiSpec: generaSwaggerSpecification(app.PUERTO, config.paths.API_REST, shutdown, config.paths.API_AUTH ?? '/'),
    validateRequests: {
      allowUnknownQueryParameters: true,
    },
    validateResponses: true, // false by default
    validateSecurity: false,
    ignoreUndocumented: true,
    formats: { 
      'nif': { type: 'string', validate: (v) => validator.isIdentityCard(v, 'ES') },
    }
  })
)

// Control de acceso
// app.use(DIR_API_REST, seguridad)
app.use(config.paths.API_AUTH ?? '/', seguridad)
app.use(config.paths.API_REST ?? '/', seguridad)

// Servicios web
app.use(config.paths.API_REST, apiRouter.router);

// Documentación OpenApi
app.all('/api-docs/v1/openapi.json', function (_req, res) {
  let result = generaSwaggerSpecification(app.PUERTO, config.paths.API_REST, shutdown, config.paths.API_AUTH ?? '/')
  res.json(result)
});
app.all('/api-docs/v1/openapi.yaml', function (_req, res) {
  let result = generaSwaggerSpecification(app.PUERTO, config.paths.API_REST, shutdown, config.paths.API_AUTH ?? '/')
  res.contentType('text/yaml').end(YAML.stringify(result))
});

// Swaggger-ui
const options = {
  explorer: true,
  swaggerOptions: {
    url: '/api-docs/v1/openapi.json',
    docExpansion: 'none',
    tagsSorter: 'alpha',
    operationsSorter: 'alpha',
  }
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(generaSwaggerSpecification(app.PUERTO, config.paths.API_REST, shutdown, config.paths.API_AUTH ?? '/'), options));


// Páginas HTML
function plantillaHTML(titulo, body) {
  return `<!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>${titulo}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="/mockwebserver/style.css">
        <link rel="icon" href="/mockwebserver/favicon.ico">
        <style>
        </style>
    </head>
    <body>
      ${body}
    </body>
  </html>`
}

// Autorespondedor de formularios
function formatColeccion(titulo, col) {
  let rslt = `<tr><th colspan="2">${titulo}</th></tr>`;
  for (let c in col)
    rslt += `<tr><th>${c}</th><td>${col[c]}</td></tr>`
  return rslt
}
app.all('/form', function (req, res) {
  let rslt = ''
  let volver = ''
  let peticion = {};
  peticion['Method'] = req.method + ' ' + req.protocol + ' ' + req.httpVersion
  peticion['AJAX'] = req.xhr
  if (req.header('referer'))
    volver = `<center><a href="${req.header('referer')}">Volver</a></center>`
  rslt = `<h1>Datos de la petición</h1>
  <table border="1">
  ${formatColeccion('Petici&oacuten', peticion)}
  ${formatColeccion('Cabeceras', req.headers)}
  ${formatColeccion('Query Strings', req.query)}
  ${formatColeccion('Cuerpo', req.body)}
  </table>
  ${volver}
  `
  res.status(200).end(plantillaHTML('Petición', xss(rslt)))
})

// Eco de la petición
app.all('/eco{/*splat}', function (req, res) {
  seguridad.useAuthentication(req, res, () => {})
  res.status(200).json({
    url: req.url,
    method: req.method,
    headers: req.headers,
    authentication: res.locals,
    'XSRF-TOKEN': VALIDATE_XSRF_TOKEN ? seguridad.generateXsrfToken(req) : 'disabled',
    cookies: req.cookies,
    params: req.params,
    query: req.query,
    body: req.body,
    path: path.parse('../')
  }).end();
});

// Página principal
app.get('/', function (req, res) {
  let rslt = ''
  let srv = app.URL_SERVER
  let apis = `<li><a href='${srv}/eco'>${srv}/eco</a>`
  serviciosConfig.forEach(servicio => {
    apis += `<li><a href='${srv}${config.paths.API_REST}/${servicio.endpoint}'>${srv}${config.paths.API_REST}/${servicio.endpoint}</a></li>`
  })
  let token = ''
  if (VALIDATE_XSRF_TOKEN) {
    token = `<input type="hidden" name="xsrftoken" value="${seguridad.generateXsrfToken(req)}">`
  }
  rslt = `<h1>MOCK Server</h1>
  <div class="flex-container">
  <div class="flex-item-left">
    <h2>Servicios REST</h2>
    <div><a href="${srv}/api-docs">Documentación OpenApi</a> | <a
            href="${srv}/api-docs/v1/openapi.yaml">YAML</a> | <a
            href="${srv}/api-docs/v1/openapi.json">JSON</a></div>
    <ul>
        ${apis}
    </ul>
  </div>
  <div class="flex-item-right">
    <h2>Subir ficheros</h2>
    <ul>
        <li><a href='${srv}/fileupload'>${srv}/fileupload</a></li>
    </ul>
    <h2>Espía de la Petición</h2>
    <ul>
        <li><a href='${srv}/form'>${srv}/form</a></li>
    </ul>
    <h2>Web Socket</h2>
    <ul>
        <li><a href="${srv}/ws/listener">listener</a></li>
        <li><a href="${srv}/ws/chat">chat</a></li>
        <li><a href="${srv}/ws/auto-chat">auto-chat</a></li>
        <li><a href="${srv}/ws/dashboard">dashboard</a></li>
    </ul>
  </div>
</div>
<h2>Formulario AUTH</h2>
  <table>
      <tr>
          <td>
              <form action="${srv}/login?cookie=true" method="post">
                  ${token}
                  <div class="container">
                      <label for="username"><b>Username</b></label>
                      <input type="text" placeholder="Enter Username" name="username" required value="${config.security.USERNAME}">
                      <label for="password"><b>Password</b></label>
                      <input type="password" placeholder="Enter Password" name="password" required pattern= "^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\\W).{8,}$" value="${config.security.PASSWORD}">
                      <button type="submit">Login</button>
                  </div>
              </form>
          </td>
          <td>
              <ul>
                  <li>action="${srv}/login"</li>
                  <li>method="post"</li>
                  <li>enctype="application/x-www-form-urlencoded"</li>
                  <li>body: username=${config.security.USERNAME}&password=${config.security.PASSWORD}</li>
                  <li>password: al menos 8 caracteres con minúsculas, mayúsculas, dígitos y símbolos</li>
              </ul>
          </td>
      </tr>
  </table>
  <footer><span style="margin-right: 15px;">&copy; ${(new Date()).getFullYear()} JMA</span> <a
          href="https://github.com/jmagit/MOCKWebServer/blob/master/README.md" target="_blank"
          rel="noopener">Documentación</a>
  </footer>
`
  res.status(200).end(plantillaHTML('MOCK Server', rslt))
})

// favicon.ico por defecto 
app.all('/favicon.ico', function (_req, res) {
  res.download(__dirname + '/favicon.ico')
});

// PushState de HTML5
app.get('/*splat', function (req, res, next) {
  const fn = async () => {
      try {
        console.info('NOT FOUND 1: %s', req.originalUrl)
        await fs.access(config.paths.PUBLIC + '/index.html', fs.constants.R_OK | fs.constants.W_OK);
        res.sendFile('index.html', { root: config.paths.PUBLIC });
      } catch {
        console.info('NOT FOUND 2: %s', req.originalUrl)
        next();
      }
    }
  fn()
});

app.use(function (err, req, res, _next) {
  const status = err.status ?? err.statusCode ?? 500
  if (req.accepts('application/json') || req.originalUrl.startsWith(`${config.API_REST}/`)) {
    res.status(status).json(err.payload ? err.payload : generateErrorByError(req, err, status).payload)
    return
  }
  // render the error page
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(status);
  res.render('error');

});

module.exports = app;
