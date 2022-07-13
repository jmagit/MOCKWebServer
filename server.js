const fs = require('fs/promises')
const path = require('path');
const util = require('util');
const express = require('express')
// const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const Formidable = require("formidable");
const cookieParser = require('cookie-parser')

//const readFile = util.promisify(fs.readFile)
//const writeFile = util.promisify(fs.writeFile)

let PUERTO = process.env.PORT || '4321';
let URL_SERVER
const _DATALOG = false
const DIR_API_REST = '/api/'
const DIR_API_AUTH = '/' // DIR_API_REST
const DIR_PUBLIC = 'public'
const DIR_UPLOADS = 'uploads/' // __dirname + "/uploads/"
const APP_SECRET = 'Es segura al 99%'
const AUTHENTICATION_SCHEME = 'Bearer '
const USERNAME = 'admin'
const PASSWORD = 'P@$$w0rd'

const PROP_USERNAME = 'idUsuario'
const PROP_PASSWORD = 'password'
const PROP_NAME = 'idUsuario'
const PASSWORD_PATTERN = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{8,}$/
const USR_FILENAME = __dirname + '/data/usuarios.json'

let VALIDATE_XSRF_TOKEN = false;

process.argv.forEach((val, _index) => {
  if (val.toLocaleLowerCase().startsWith('--port='))
    PUERTO = val.substring('--port='.length)
  else if (val.toLocaleLowerCase().startsWith('--xsrf')) {
    VALIDATE_XSRF_TOKEN = true
    console.log('Activada protección XSRF.')
  }
});


const lstServicio = [{
  url: DIR_API_REST + 'personas',
  pk: 'id',
  fich: __dirname + '/data/personas.json',
  readonly: false
},
{
  url: DIR_API_REST + 'contactos',
  pk: 'id',
  fich: __dirname + '/data/contactos.json',
  readonly: false
},
{
  url: DIR_API_REST + 'tarjetas',
  pk: 'id',
  fich: __dirname + '/data/tarjetas.json',
  readonly: false
},
{
  url: DIR_API_REST + 'blog',
  pk: 'id',
  fich: __dirname + '/data/blog.json',
  readonly: false
},
{
  url: DIR_API_REST + 'libros',
  pk: 'idLibro',
  fich: __dirname + '/data/libros.json',
  readonly: false
},
{
  url: DIR_API_REST + 'biblioteca',
  pk: 'id',
  fich: __dirname + '/data/biblioteca.json',
  readonly: false
},
{
  url: DIR_API_REST + 'vehiculos',
  pk: 'id',
  fich: __dirname + '/data/vehiculos.json',
  readonly: false
},
{
  url: DIR_API_REST + 'marcas',
  pk: 'marca',
  fich: __dirname + '/data/marcas-modelos.json',
  readonly: false
},
]

const app = express()
app.disable("x-powered-by");

// parse application/json
app.use(express.json())
// parse application/x-www-form-urlencoded
app.use(express.urlencoded({
  extended: false
}))
// parse header/cookies
app.use(cookieParser())

// Ficheros publicos
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
// const formMiddleWare = (req, res, next) => {
//   const form = formidable({});

//   form.parse(req, (err, fields, files) => {
//     if (err) {
//       next(err);
//       return;
//     }
//     req.fields = fields;
//     req.files = files;
//     next();
//   });
// };
// app.post('/fileupload', formMiddleWare, (req, res, next) => {
//   res.json({ 
//       fields: req.fields,
//       files: req.files,
//   });
// });

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
          } catch {
          }
          await fs.rename(oldpath, newpath);
          rutas.push({ url: `${URL_SERVER}/files/${file.name}` });
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
app.use(function (req, res, next) {
  if (req.method === 'OPTIONS') {
    let origen = req.header("Origin")
    if (!origen) origen = '*'
    res.header('Access-Control-Allow-Origin', origen)
    res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization, X-Requested-With, X-XSRF-TOKEN')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    res.header('Access-Control-Allow-Credentials', 'true')
  }
  next()
})

// Cookie-to-Header Token
if (VALIDATE_XSRF_TOKEN) {
  const { createHash } = require('crypto')
  function generateXsrfToken(req) {
    const hash = createHash('sha256')
    let client = `${req.client.remoteFamily}-${req.client.remoteAddress}`
    hash.update(client)
    return hash.digest('base64')
  }
  function generateXsrfCookie(req, res) {
    res.cookie('XSRF-TOKEN', generateXsrfToken(req), { httpOnly: false, expires: 0 })
  }
  function isInvalidXsrfToken(req) {
    let token = req.headers['x-xsrf-token'] || req.body['xsrftoken']
    let cookie = req.cookies['XSRF-TOKEN']
    let secret = generateXsrfToken(req)
    return !token || cookie !== token || token !== secret
  }
  app.use(function (req, res, next) {
    if (!req.cookies['XSRF-TOKEN'])
      generateXsrfCookie(req, res)
    if ('POST|PUT|DELETE|PATCH'.indexOf(req.method.toUpperCase()) >= 0 && isInvalidXsrfToken(req)) {
      if (req.cookies['XSRF-TOKEN'] !== generateXsrfToken(req))
        generateXsrfCookie(req, res)
      res.status(401).json({ message: 'Invalid XSRF-TOKEN' })
      return
    }
    res.XsrfToken = generateXsrfToken(req)
    next()
  })
}

// Autenticación
app.use(function (req, res, next) {
  res.locals.isAuthenticated = false;
  let token = ''
  if (!req.headers['authorization']) {
    if (!req.cookies['Authorization']) {
      next();
      return;
    }
    token = req.cookies['Authorization'];
  } else
    token = req.headers['authorization'].substring(AUTHENTICATION_SCHEME.length)
  try {
    let decoded = jwt.verify(token, APP_SECRET);
    res.locals.isAuthenticated = true;
    res.locals.usr = decoded.usr;
    res.locals.name = decoded.name;
    res.locals.roles = decoded.roles;
    res.locals.isInRole = role => res.locals.roles.includes(role)
    next();
  } catch (err) {
    res.status(401).json({ message: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token' });
  }
})

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
async function encriptaPassword(password) {
  const salt = await bcrypt.genSalt(10)
  const hash = await bcrypt.hash(password, salt)
  console.log(hash)
  return hash
}

app.options(DIR_API_AUTH + 'login', function (_req, res) {
  res.status(200).end()
})

app.post(DIR_API_AUTH + 'login', async function (req, res) {
  let payload = {
    success: false
  }
  if (!req.body || !req.body.name || !req.body.password) {
    setTimeout(() => res.status(400).json(payload).end(), 1000)
    return
  }
  let usr = req.body.name
  let pwd = req.body.password
  if (!PASSWORD_PATTERN.test(pwd)) {
    setTimeout(() => res.status(200).json(payload).end(), 1000)
    return
  }
  let data = await fs.readFile(USR_FILENAME, 'utf8')
  let lst = JSON.parse(data)
  let ele = lst.find(item => item[PROP_USERNAME] == usr)
  if (ele && await bcrypt.compare(pwd, ele[PROP_PASSWORD])) {
    let token = jwt.sign({
      usr: ele[PROP_USERNAME],
      name: ele.nombre,
      roles: ele.roles
    }, APP_SECRET, { expiresIn: '1h' })
    payload = {
      success: true,
      token: AUTHENTICATION_SCHEME + token,
      name: ele[PROP_NAME],
      roles: ele.roles
    }
    if (req.query.cookie && req.query.cookie.toLowerCase() === "true")
      res.cookie('Authorization', token, { maxAge: 3600000 })
  }
  res.status(200).json(payload).end()
})
app.get(DIR_API_AUTH + 'logout', function (_req, res) {
  res.clearCookie('Authorization');
  res.status(200).end()
})

app.get(DIR_API_AUTH + 'register', async function (_req, res) {
  if (!res.locals.isAuthenticated) {
    res.status(401).end()
    return
  }
  let usr = res.locals.usr;
  let data = await fs.readFile(USR_FILENAME, 'utf8')
  let lst = JSON.parse(data)
  let ele = lst.find(item => item[PROP_USERNAME] == usr)
  if (ele) {
    delete ele[PROP_PASSWORD]
    res.status(200).json(ele).end()
  } else {
    res.status(401).end()
  }
})
app.post(DIR_API_AUTH + 'register', async function (req, res) {
  let data = await fs.readFile(USR_FILENAME, 'utf8')
  let lst = JSON.parse(data)
  let ele = req.body
  if (ele[PROP_USERNAME] == undefined) {
    res.status(400).json({ message: 'Falta el nombre de usuario.' })
  } else if (lst.find(item => item[PROP_USERNAME] == ele[PROP_USERNAME])) {
    res.status(400).json({ message: 'El usuario ya existe' })
  } else if (PASSWORD_PATTERN.test(ele[PROP_PASSWORD])) {
    ele[PROP_PASSWORD] = await encriptaPassword(ele[PROP_PASSWORD])
    lst.push(ele)
    console.log(lst)
    fs.writeFile(USR_FILENAME, JSON.stringify(lst))
      .then(() => { res.sendStatus(200) })
      .catch(_err => { res.status(500).end('Error de escritura') })
  } else {
    res.status(400).json({ message: 'Formato incorrecto de la password.' })
  }
})
app.put(DIR_API_AUTH + 'register', async function (req, res) {
  let ele = req.body
  if (res.locals.usr !== ele[PROP_USERNAME]) {
    res.status(403).end()
    return false
  }
  let data = await fs.readFile(USR_FILENAME, 'utf8')
  let lst = JSON.parse(data)
  let ind = lst.findIndex(row => row[PROP_USERNAME] == ele[PROP_USERNAME])
  if (ind == -1) {
    res.status(404).end()
  } else {
    if (ele.nombre)
      lst[ind].nombre = ele.nombre;
    fs.writeFile(USR_FILENAME, JSON.stringify(lst))
      .then(() => { res.sendStatus(200) })
      .catch(_err => { res.status(500).end('Error de escritura') })
  }
})

app.put(DIR_API_AUTH + 'register/password', async function (req, res) {
  let ele = req.body
  if (!res.locals.isAuthenticated) {
    res.status(401).end()
    return false
  }
  let data = await fs.readFile(USR_FILENAME, 'utf8')
  let lst = JSON.parse(data)
  let ind = lst.findIndex(row => row[PROP_USERNAME] == res.locals.usr)
  if (ind == -1) {
    res.status(404).end()
  } else if (PASSWORD_PATTERN.test(ele.newPassword) && await bcrypt.compare(ele.oldPassword, lst[ind][PROP_PASSWORD])) {
    lst[ind][PROP_PASSWORD] = await encriptaPassword(ele.newPassword)
    fs.writeFile(USR_FILENAME, JSON.stringify(lst))
      .then(() => { res.sendStatus(200) })
      .catch(_err => { res.status(500).end('Error de escritura') })
  } else {
    res.status(400).end()
  }
})

app.get(DIR_API_AUTH + 'auth', function (_req, res) {
  res.status(200).json({ isAuthenticated: res.locals.isAuthenticated, usr: res.locals.usr, name: res.locals.name, roles: res.locals.roles })
})

app.all('/eco(/*)?', function (req, res) {
  res.status(200).json({
    url: req.url,
    method: req.method,
    headers: req.headers,
    authentication: res.locals,
    "XSRF-TOKEN": VALIDATE_XSRF_TOKEN ? generateXsrfToken(req) : 'disabled',
    cookies: req.cookies,
    params: req.params,
    query: req.query,
    body: req.body,
    path: path.parse('../')
  }).end();
});

// Servicios web
lstServicio.forEach(servicio => {
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
        console.log(ele)
        res.status(200).json(ele).end()
      } else {
        res.status(404).end()
      }
    } catch (err) {
      res.status(500).end();
      console.log(err.stack);
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
        if (_DATALOG) console.log(lst)
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
        if (_DATALOG) console.log(lst)
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
        if (_DATALOG) console.log(lst)
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
        if (_DATALOG) console.log(lst)
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
        if (_DATALOG) console.log(lst)
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
})

app.get('/', function (req, res) {
  let rslt = ''
  let srv = `http://${server.address().address == '::' ? 'localhost' : server.address().address}:${server.address().port}`
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
    token = `<input type="hidden" name="xsrftoken" value="${generateXsrfToken(req)}">`
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
  console.log('NOT FOUND: %s', req.originalUrl)
  try {
    await access(DIR_PUBLIC + '/index.html', constants.R_OK | constants.W_OK);
    res.sendFile('index.html', { root: DIR_PUBLIC });
  } catch {
    next();
  }
});

app.use(function (err, req, res, _next) {
  console.log('ERROR: %s', req.originalUrl, err)
  res.status(500).json({ message: err.message }).end();
});


// Servidor
const server = app.listen(PUERTO, function () {
  URL_SERVER = `http://${server.address().address == '::' ? 'localhost' : server.address().address}:${server.address().port}`
  console.log('Servidor: %s', URL_SERVER)
  console.log('Petición SPY %s/form', URL_SERVER)
  console.log('Servicio REST %s%s', URL_SERVER, `/eco`)
  lstServicio.forEach(servicio => {
    console.log('Servicio REST %s%s', URL_SERVER, servicio.url)
  })
})