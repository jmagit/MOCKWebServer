const fs = require('fs/promises')
const path = require('path');
const express = require('express')
// const bodyParser = require('body-parser')
const Formidable = require("formidable");
const cookieParser = require('cookie-parser')
const seguridad = require('./seguridad')

const _DATALOG = false
const DIR_API_REST = '/api/'
const DIR_API_AUTH = '/' // DIR_API_REST
const DIR_PUBLIC = './public'
const DIR_UPLOADS = './uploads/'
const DIR_DATA = './data/'
const USERNAME = 'admin'
const PASSWORD = 'P@$$w0rd'

let lstServicio = require('../data/__servicios.json')

let VALIDATE_XSRF_TOKEN = false;

const app = express()
app.disable("x-powered-by");
app.PUERTO = process.env.PORT || '4321';
app.URL_SERVER = ''

process.argv.forEach(val => {
  if (val.toLocaleLowerCase().startsWith('--port='))
    PUERTO = val.substring('--port='.length)
  else if (val.toLocaleLowerCase().startsWith('--xsrf')) {
    VALIDATE_XSRF_TOKEN = true
    console.info('Activada protección XSRF.')
  }
});

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
app.use(seguridad.decodeAuthorization)

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

// Control de acceso
app.use(DIR_API_AUTH, seguridad.router)

// Eco de la petición
app.all('/eco(/*)?', function (req, res) {
  res.status(200).json({
    url: req.url,
    method: req.method,
    headers: req.headers,
    authentication: res.locals,
    "XSRF-TOKEN": VALIDATE_XSRF_TOKEN ? seguridad.generateXsrfToken(req) : 'disabled',
    cookies: req.cookies,
    params: req.params,
    query: req.query,
    body: req.body,
    path: path.parse('../')
  }).end();
});

// Servicios web
lstServicio.forEach(servicio => {
  servicio.url = DIR_API_REST + servicio.url
  servicio.fich = DIR_DATA + servicio.fich
  app.get(servicio.url, async function (req, res) {
    try {
      let data = await fs.readFile(servicio.fich, 'utf8');
      let lst = JSON.parse(data)
      if (Object.keys(req.query).length > 0) {
        if ('_search' in req.query) {
          lst = lst.filter(item => JSON.stringify(Object.values(item)).includes(req.query._search))
        } else {
          const q = Object.keys(req.query).filter(item => !item.startsWith('_'));
          if (q.length > 0) {
            for (let cmp in q) {
              if (req.query[q[cmp]] === 'true') req.query[q[cmp]] = true;
              if (req.query[q[cmp]] === 'false') req.query[q[cmp]] = false;
            }
            lst = lst.filter(function (item) {
              for (let cmp in q) {
                if (item[q[cmp]] != req.query[q[cmp]]) return false;
              }
              return true;
            })
          }
        }
      }
      let orderBy = req.query._sort ? req.query._sort.split(',') : [servicio.pk];
      orderBy = orderBy.map(cmp => {
        let dir = 1;
        if (cmp.startsWith("-")) {
          cmp = cmp.substring(1);
          dir = -1;
        }
        return { cmp, dir }
      })
      const compara = function (a, b, index) {
        let rslt = orderBy[index].dir * (a[orderBy[index].cmp] == b[orderBy[index].cmp] ? 0 : (a[orderBy[index].cmp] < b[orderBy[index].cmp] ? -1 : 1))
        if (rslt !== 0 || index + 1 === orderBy.length) return rslt;
        return compara(a, b, index + 1);
      }
      lst = lst.sort((a, b) => compara(a, b, 0));
      if (req.query._page != undefined || req.query._rows != undefined) {
        const rows = req.query._rows && !isNaN(+req.query._rows) ? Math.abs(+req.query._rows) : 20;
        if (req.query._page && req.query._page.toUpperCase() == "COUNT") {
          res.json({ pages: Math.ceil(lst.length / rows), rows: lst.length }).end()
          return;
        }
        const page = req.query._page && !isNaN(+req.query._page) ? Math.abs(+req.query._page) : 0;
        lst = {
          content: lst.slice(page * rows, page * rows + rows),
          totalElements: lst.length,
          totalPages: Math.ceil(lst.length / rows),
          number: lst.length === 0 ? 0 : page + 1,
          size: rows,
        }
        lst.empty = lst.content.length === 0;
        lst.first = !lst.empty && page === 0;
        lst.last = !lst.empty && page === (lst.totalPages - 1);
        lst.numberOfElements = lst.content.length
      }
      if ('_projection' in req.query) {
        const cmps = req.query._projection.split(',');
        const mapeo = item => { let e = {}; cmps.forEach(c => e[c] = item[c]); return e; }
        if (lst.content) {
          lst.content = lst.content.map(mapeo)
        } else {
          lst = lst.map(mapeo)
        }
      }
      res.json(lst)
    } catch (error) {
      res.status(500).json(error)
    }
  })
  app.get(servicio.url + '/:id', async function (req, res) {
    try {
      let data = await fs.readFile(servicio.fich, 'utf8');
      let lst = JSON.parse(data)
      let ele = lst.find(item => item[servicio.pk] == req.params.id)
      if (ele) {
        if ('_projection' in req.query) {
          const cmps = req.query._projection.split(',');
          let projection = {};
          cmps.forEach(c => projection[c] = ele[c]);
          ele = projection;
        }
        console.info(ele)
        res.status(200).json(ele).end()
      } else {
        res.status(404).end()
      }
    } catch (err) {
      res.status(500).end();
      console.info(err.stack);
    }
  })
  app.post(servicio.url, async function (req, res) {
    if (servicio.readonly && !res.locals.isAuthenticated) {
      res.status(401).json({ message: 'No autorizado.' })
      return
    }
    if (!req.is('json') || !req.body) {
      res.sendStatus(406)
      return
    }
    let data = await fs.readFile(servicio.fich, 'utf8');
    try {
      let lst = JSON.parse(data)
      let ele = req.body
      if (ele[servicio.pk] == undefined) {
        res.status(400).json({ message: 'Falta clave primaria.' })
      } else if (lst.find(item => item[servicio.pk] == ele[servicio.pk]) == undefined) {
        if (ele[servicio.pk] == 0) {
          if (lst.length == 0)
            ele[servicio.pk] = 1;
          else {
            let newId = +lst.sort((a, b) => (a[servicio.pk] == b[servicio.pk] ? 0 : (a[servicio.pk] < b[servicio.pk] ? -1 : 1)))[lst.length - 1][servicio.pk];
            ele[servicio.pk] = newId + 1;
          }
        }
        lst.push(ele)
        if (_DATALOG) console.info(lst)
        await fs.writeFile(servicio.fich, JSON.stringify(lst), 'utf8');
        res.status(201).header('Location', `${req.protocol}://${req.hostname}:${req.connection.localPort}${req.originalUrl}/${ele[servicio.pk]}`).end()
      } else {
        res.status(400).json({ message: 'Clave duplicada.' })
      }
    } catch (error) {
      res.status(500).json(error).end()
    }
  })
  app.put(servicio.url, async function (req, res) {
    if (servicio.readonly && !res.locals.isAuthenticated) {
      res.status(401).json({ message: 'No autorizado.' })
      return
    }
    if (!req.is('json') || !req.body) {
      res.sendStatus(406)
      return
    }
    let data = await fs.readFile(servicio.fich, 'utf8');
    try {
      let lst = JSON.parse(data)
      let ele = req.body
      let ind = lst.findIndex(row => row[servicio.pk] == ele[servicio.pk])
      if (ind == -1) {
        res.status(404).end()
      } else {
        lst[ind] = ele
        if (_DATALOG) console.info(lst)
        await fs.writeFile(servicio.fich, JSON.stringify(lst), 'utf8');
        res.status(200).json(lst[ind]).end()
      }
    } catch (error) {
      res.status(500).json(error).end()
    }
  })
  app.put(servicio.url + '/:id', async function (req, res) {
    if (servicio.readonly && !res.locals.isAuthenticated) {
      res.status(401).json({ message: 'No autorizado.' })
      return
    }

    if (!req.is('json') || !req.body) {
      res.sendStatus(406)
      return
    }
    if (req.body[servicio.pk] != req.params.id) {
      res.status(400).json({ message: "Invalid identifier" })
      return
    }
    let data = await fs.readFile(servicio.fich, 'utf8');
    try {
      let lst = JSON.parse(data)
      let ele = req.body
      let ind = lst.findIndex(row => row[servicio.pk] == req.params.id)
      if (ind == -1) {
        res.status(404).end()
      } else {
        lst[ind] = ele
        if (_DATALOG) console.info(lst)
        await fs.writeFile(servicio.fich, JSON.stringify(lst), 'utf8');
        res.status(200).json(lst[ind]).end()
      }
    } catch (error) {
      res.status(500).json(error).end()
    }
  })
  app.patch(servicio.url + '/:id', async function (req, res) {
    if (servicio.readonly && !res.locals.isAuthenticated) {
      res.status(401).json({ message: 'No autorizado.' })
      return
    }
    if (!req.is('json') || !req.body) {
      res.sendStatus(406)
      return
    }
    if (req.body[servicio.pk] && req.body[servicio.pk] != req.params.id) {
      res.status(400).json({ message: "Invalid identifier" })
      return
    }
    let data = await fs.readFile(servicio.fich, 'utf8');
    try {
      let lst = JSON.parse(data)
      let ele = req.body
      let ind = lst.findIndex(row => row[servicio.pk] == req.params.id)
      if (ind == -1) {
        res.status(404).end()
      } else {
        lst[ind] = Object.assign({}, lst[ind], ele)
        if (_DATALOG) console.info(lst)
        await fs.writeFile(servicio.fich, JSON.stringify(lst), 'utf8');
        res.status(200).json(lst[ind]).end()
      }
    } catch (error) {
      res.status(500).json(error).end()
    }
  })
  app.delete(servicio.url + '/:id', async function (req, res) {
    if (servicio.readonly && !res.locals.isAuthenticated) {
      res.status(401).json({ message: 'No autorizado.' })
      return
    }
    let data = await fs.readFile(servicio.fich, 'utf8');
    try {
      let lst = JSON.parse(data)
      let ind = lst.findIndex(row => row[servicio.pk] == req.params.id)
      if (ind == -1) {
        res.status(404).end()
      } else {
        lst.splice(ind, 1)
        if (_DATALOG) console.info(lst)
        await fs.writeFile(servicio.fich, JSON.stringify(lst), 'utf8');
        res.sendStatus(204)
      }
    } catch (error) {
      res.status(500).json(error).end()
    }
  })
  app.options(servicio.url + '/:id', function (_req, res) {
    res.status(200).end()
  })
  // console.info('Servicio REST %s%s', app.URL_SERVER, servicio.url)
})

app.get('/', function (req, res) {
  let rslt = ''
  let srv = app.URL_SERVER
  rslt = `<h1>MOCK Server</h1>
  <ul>
    <li><b>Esp&iacute;a de la Petici&oacute;n</b><ul><a href='${srv}/form'>${srv}/form</a></li></ul></li>
    <li><b>Subir ficheros</b><ul><a href='${srv}/fileupload'>${srv}/fileupload</a></li></ul></li>
    <li><b>Servicios REST</b><ul><li><a href='${srv}/eco'>${srv}/eco</a></li>`
  lstServicio.forEach(servicio => {
    rslt += `<li><a href='${srv}${servicio.url}'>${srv}${servicio.url}</a></li>`
  })
  let token = ''
  if (VALIDATE_XSRF_TOKEN) {
    // eslint-disable-next-line no-undef
    token = `<input type="hidden" name="xsrftoken" value="${seguridad.generateXsrfToken(req)}">`
  }
  rslt += `</ul></li>
    <li><b>Formulario AUTH</b> <br>action=${srv}${DIR_API_AUTH}login <br>method=post: name=${USERNAME}&password=${PASSWORD}<br><br>
    <form action='${srv}${DIR_API_AUTH}login' method='post'>
    ${token}
    <label>Name: <input type='text' name='name' value='${USERNAME}'></label><br>
    <label>Password: <input type='text' name='password' value='${PASSWORD}'></label><br>
    <input type='submit' value='Log In'>
    </form></li>
    </ul>`
  rslt += `<center><a href='https://github.com/jmagit/MOCKWebServer/blob/master/README.md' target='_blank'>Documentaci&oacute;n</center>`
  res.status(200).end(plantillaHTML('MOCK Server', rslt))
})

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
app.use(function (err, req, res, _next) {
  console.error('ERROR: %s', req.originalUrl, err)
  res.status(500).json({ message: err.message }).end();
});

module.exports = app;
