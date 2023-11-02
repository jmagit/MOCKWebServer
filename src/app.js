const fs = require('fs/promises')
const path = require('path');
const { createServer } = require('http');
const express = require('express')
const Formidable = require('formidable');
const morgan = require('morgan')
const rfs = require('rotating-file-stream')
const cookieParser = require('cookie-parser')
const swaggerUi = require('swagger-ui-express');
const YAML = require('yaml')
const OpenApiValidator = require('express-openapi-validator');
const validator = require('validator');
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
app.use('/files', express.static('uploads'))
app.get('/fileupload', function (_req, res) {
  res.status(200).end(plantillaHTML('fileupload', `
    <h1>Multiple file uploads</h1>
    <form action="fileupload" method="post" enctype="multipart/form-data">
      <p>
        <input type="file" name="filetoupload" multiple="multiple" required><br>
        <input type="submit">
      </p>
    </form>
  `))
})

app.post('/fileupload', function (req, res) {
  const form = new Formidable();
  form.maxFileSize = 2000000; // 2mb
  form.uploadDir = config.paths.UPLOADS;
  form.keepExtensions = false;
  form.multiples = true;
  form.minFileSize = 1;

  form.parse(req, async function (err, _fields, files) {
    try {
      if (err) throw err;
      let rutas = []
      let ficheros = []
      if (files.filetoupload instanceof Array)
        ficheros = files.filetoupload
      else
        ficheros.push(files.filetoupload);
      for (let file of ficheros) {
        let oldpath = file.path;
        if (file.name) {
          let newpath = config.paths.UPLOADS + file.name;
          try {
            await fs.unlink(newpath)
            // eslint-disable-next-line no-empty
          } catch {
          }
          await fs.rename(oldpath, newpath);
          rutas.push({ url: `${app.URL_SERVER}/files/${file.name}` });
        } else {
          await fs.unlink(oldpath)
        }
      }
      if (req.headers?.accept?.includes('application/json'))
        res.status(200).json(rutas).end();
      else {
        let body = '<ol>'
        for (let ruta of rutas) {
          body += `<li><a href="${ruta.url}">${ruta.url}</a></li>`
        }
        body += '</ol>'
        res.status(200).end(plantillaHTML('Ficheros', body));
      }
    } catch (error) {
      res.status(500).json(error).end();
    }
  });
})

// Cross-origin resource sharing (CORS)
app.use(seguridad.useCORS)

// Cookie-to-Header Token
if (VALIDATE_XSRF_TOKEN) {
  app.use(seguridad.useXSRF)
}

// Autenticación
// app.use(seguridad.useAuthentication)

// Control de acceso
// app.use(DIR_API_REST, seguridad)
app.use(config.paths.API_AUTH, seguridad)

// Validación OpenApi
app.use(
  OpenApiValidator.middleware({
    apiSpec: generaSwaggerSpecification(app.PUERTO, config.paths.API_REST, shutdown, config.paths.API_AUTH),
    validateRequests: {
      allowUnknownQueryParameters: true,
    },
    validateResponses: true, // false by default
    validateSecurity: false,
    ignoreUndocumented: true,
    formats: [
      { name: 'nif', type: 'string', validate: (v) => validator.isIdentityCard(v, 'ES') },
    ]
  })
)

// Servicios web
app.use(config.paths.API_REST, apiRouter.router);

// Documentación OpenApi
app.all('/api-docs/v1/openapi.json', function (_req, res) {
  let result = generaSwaggerSpecification(app.PUERTO, config.paths.API_REST, shutdown, config.paths.API_AUTH)
  res.json(result)
});
app.all('/api-docs/v1/openapi.yaml', function (_req, res) {
  let result = generaSwaggerSpecification(app.PUERTO, config.paths.API_REST, shutdown, config.paths.API_AUTH)
  res.contentType('text/yaml').end(YAML.stringify(result))
});

// Swaggger-ui
const options = {
  explorer: true
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(generaSwaggerSpecification(app.PUERTO, config.paths.API_REST, shutdown, config.paths.API_AUTH), options));


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
  res.status(200).end(plantillaHTML('Petición', rslt))
})

// Eco de la petición
app.all('/eco(/*)?', function (req, res) {
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
    // eslint-disable-next-line no-undef
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
app.all('/favicon.ico', async function (_req, res) {
  res.download(__dirname + '/favicon.ico')
});

// PushState de HTML5
app.get('/*', async function (req, res, next) {
  console.info('NOT FOUND: %s', req.originalUrl)
  try {
    await fs.access(config.paths.PUBLIC + '/index.html', fs.constants.R_OK | fs.constants.W_OK);
    res.sendFile('index.html', { root: config.paths.PUBLIC });
  } catch {
    next();
  }
});

// eslint-disable-next-line no-unused-vars
app.use(function (err, req, res, _next) {
  // console.error('ERROR: %s', req.originalUrl, err)
  let error = err.payload ? err : generateErrorByError(err)
  error.payload.instance = req.originalUrl
  res.status(error.payload.status).json(error.payload);
});

module.exports = app;
