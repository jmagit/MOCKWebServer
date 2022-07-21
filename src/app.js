const fs = require('fs/promises')
const path = require('path');
const express = require('express')
const Formidable = require('formidable');
const morgan = require('morgan')
const rfs = require('rotating-file-stream')
const cookieParser = require('cookie-parser')
const swaggerUi = require('swagger-ui-express');
const YAML = require('yaml')
const OpenApiValidator = require('express-openapi-validator');
const validator = require('validator');
const { generaSwaggerSpecification } = require('./openapi-generator');
const { generateErrorByError } = require('./utils')

const serviciosConfig = require('../data/__servicios.json')
const seguridad = require('./seguridad')
const apiRouter = require('./apirest');

const DIR_API_REST = '/api'
const DIR_API_AUTH = '/' // DIR_API_REST
const DIR_PUBLIC = './public'
const DIR_UPLOADS = './uploads/'
const USERNAME = 'admin'
const PASSWORD = 'P@$$w0rd'


let VALIDATE_XSRF_TOKEN = false;

const app = express()
app.disable('x-powered-by');
app.PUERTO = process.env.PORT || '4321';
app.URL_SERVER = ''
app.DIR_API_REST = DIR_API_REST

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
app.use(express.static(DIR_PUBLIC))
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
  form.uploadDir = DIR_UPLOADS;
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
          let newpath = DIR_UPLOADS + file.name;
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
app.use(seguridad.useAuthentication)

// Autorespondedor de formularios
function plantillaHTML(titulo, body) {
  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <title>${titulo}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="/mockwebserver/style.css">
      <link rel="icon" href="/mockwebserver/favicon.ico" >
    </head>
    <body>
      ${body}
    </body>
  </html>`
}

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
  rslt = `<h1>Datos de la petici&oacute;n</h1>
  <table border="1">
  ${formatColeccion('Petici&oacuten', peticion)}
  ${formatColeccion('Cabeceras', req.headers)}
  ${formatColeccion('Query Strings', req.query)}
  ${formatColeccion('Cuerpo', req.body)}
  </table>
  ${volver}
  `
  res.status(200).end(plantillaHTML('Petici&oacute;n', rslt))
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

// Servicios web
app.use(
  OpenApiValidator.middleware({
    apiSpec: generaSwaggerSpecification(app.PUERTO, DIR_API_REST),
    validateRequests: true, // (default)
    validateResponses: true, // false by default
    ignoreUndocumented: true,
    formats: [
      { name: 'nif', type: 'string', validate: (v) =>  validator.isIdentityCard(v, 'ES') },
    ]
  })
)

// Control de acceso
// app.use(DIR_API_REST, seguridad)
app.use(DIR_API_AUTH, seguridad)

app.use(DIR_API_REST, apiRouter.router);

const options = {
  explorer: true
};
app.all('/api-docs/v1/openapi.json', async function (_req, res) {
  let result = await generaSwaggerSpecification(app.PUERTO, DIR_API_REST)
  res.json(result)
});
app.all('/api-docs/v1/openapi.yml', async function (_req, res) {
  let result = await generaSwaggerSpecification(app.PUERTO, DIR_API_REST)
  res.contentType('text/yaml').end(YAML.stringify(result))
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(generaSwaggerSpecification(app.PUERTO, DIR_API_REST), options));

app.get('/', function (req, res) {
  let rslt = ''
  let srv = app.URL_SERVER
  rslt = `<h1>MOCK Server</h1>
  <ul>
    <li><b>Esp&iacute;a de la Petici&oacute;n</b><ul><a href='${srv}/form'>${srv}/form</a></li></ul></li>
    <li><b>Subir ficheros</b><ul><a href='${srv}/fileupload'>${srv}/fileupload</a></li></ul></li>
    <li><b>Servicios REST</b><ul><li><a href='${srv}/eco'>${srv}/eco</a></li>`
  serviciosConfig.forEach(servicio => {
    rslt += `<li><a href='${srv}${DIR_API_REST}/${servicio.endpoint}'>${srv}${DIR_API_REST}/${servicio.endpoint}</a></li>`
  })
  let token = ''
  if (VALIDATE_XSRF_TOKEN) {
    // eslint-disable-next-line no-undef
    token = `<input type="hidden" name="xsrftoken" value="${seguridad.generateXsrfToken(req)}">`
  }
  rslt += `</ul></li>
    <li><b>Formulario AUTH</b> <br>action=${srv}${DIR_API_AUTH}login <br>method=post: name=${USERNAME}&password=${PASSWORD}<br><br>
    <form action='${srv}${DIR_API_AUTH}login?cookie=true' method='post'>
    ${token}
    <label>Name: <input type='text' name='name' value='${USERNAME}'></label><br>
    <label>Password: <input type='text' name='password' value='${PASSWORD}'></label><br>
    <input type='submit' value='Log In'>
    </form></li>
    </ul>`
  rslt += `<center><a href='https://github.com/jmagit/MOCKWebServer/blob/master/README.md' target='_blank'>Documentaci&oacute;n</center>`
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
    await fs.access(DIR_PUBLIC + '/index.html', fs.constants.R_OK | fs.constants.W_OK);
    res.sendFile('index.html', { root: DIR_PUBLIC });
  } catch {
    next();
  }
});

// eslint-disable-next-line no-unused-vars
app.use(function (err, _req, res, _next) {
  // console.error('ERROR: %s', req.originalUrl, err)
  let error = err.payload ? err : generateErrorByError(err)
  res.status(error.payload.status).json(error.payload);
});

module.exports = app;
