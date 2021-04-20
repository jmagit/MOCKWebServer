const fs = require('fs')
const util = require('util');
const express = require('express')
// var bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
var formidable = require("formidable");
var cookieParser = require('cookie-parser')

//const readFile = util.promisify(fs.readFile)
//const writeFile = util.promisify(fs.writeFile)

let PUERTO = process.env.PORT || '4321';
const DIR_API_REST = '/api/'
const DIR_API_AUTH = '/' // DIR_API_REST
const APP_SECRET = 'Es segura al 99%'
const AUTHENTICATION_SCHEME = 'Bearer '
const USERNAME = 'admin'
const PASSWORD = 'P@$$w0rd'

const PROP_USERNAME = 'idUsuario'
const PROP_PASSWORD = 'password'
const PROP_NAME = 'idUsuario'
const USR_FILENAME = __dirname + '/data/usuarios.json'

const VALIDATE_XSRF_TOKEN = false;

process.argv.forEach((val, index) => {
  if(val.toLocaleLowerCase().startsWith('--port='))
    PUERTO = val.substr('--port='.length)
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

var app = express()

// parse application/json
app.use(express.json())
// parse application/x-www-form-urlencoded
app.use(express.urlencoded({
  extended: false
}))
// parse header/cookies
app.use(cookieParser())
function generateXsrfTokenCookie(res) {
  res.cookie('XSRF-TOKEN', '123456790ABCDEF', { httpOnly: false })
}

// Cross-origin resource sharing (CORS)
app.use(function (req, res, next) {
  var origen = req.header("Origin")
  if (!origen) origen = '*'
  res.header('Access-Control-Allow-Origin', origen)
  res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization, X-Requested-With, X-XSRF-TOKEN')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  res.header('Access-Control-Allow-Credentials', 'true')
  generateXsrfTokenCookie(res)
  next()
})
// Autenticación
app.use(function (req, res, next) {
  res.locals.isAutenticated = false;
  if (!req.headers['authorization']) {
    next();
    return;
  }
  let token = req.headers['authorization'].substr(AUTHENTICATION_SCHEME.length)
  try {
    var decoded = jwt.verify(token, APP_SECRET);
    res.locals.isAutenticated = true;
    res.locals.usr = decoded.usr;
    res.locals.name = decoded.name;
    res.locals.roles = decoded.roles;
    next();
  } catch (err) {
    res.status(401).end();
  }
})

// Cookie-to-Header Token
app.use(function (req, res, next) {
  if (VALIDATE_XSRF_TOKEN) {
    if ('POST|PUT|DELETE|PATCH'.indexOf(req.method.toUpperCase()) >= 0 && req.cookies['XSRF-TOKEN'] !== req.headers['x-xsrf-token']) {
      res.status(401).end('No autorizado.')
      return
    }
    generateXsrfTokenCookie(res)
  }
  next()
})

// Ficheros publicos
app.use(express.static('public'))
app.use('/files', express.static('uploads'))
app.get('/fileupload', function (req, res) {
  res.status(200).end(plantillaHTML('fileupload', `
    <form action="fileupload" method="post" enctype="multipart/form-data">
      <input type="file" name="filetoupload"><input type="submit">
    </form>
  `))
})
app.post('/fileupload', function (req, res) {
  let form = new formidable.IncomingForm();
  form.uploadDir = __dirname + "/uploads/";
  form.parse(req, async function (err, fields, files) {
    try {
      if (err) throw err;
      let oldpath = files.filetoupload.path;
      let newpath = __dirname + "/uploads/" + files.filetoupload.name;
      await fs.promises.rename(oldpath, newpath);
      newpath = "files/" + files.filetoupload.name;
      res.status(200).end(`<a href="${newpath}">${newpath}</a>`);
    } catch (error) {
      res.status(500).json(error).end();
    }
  });
})

// Autorespondedor de formularios
function plantillaHTML(titulo, body) {
  return `<!DOCTYPE html>
  <html>
    <head>
      <title>${titulo}</title>
      <link rel="stylesheet" href="style.css">
    </head>
    <body>
      ${body}
    </body>
  </html>`
}

function formatColeccion(titulo, col) {
  var rslt = `<tr><th colspan="2" style="text-align: center">${titulo}</th></tr>`;
  for (let c in col)
    rslt += `<tr><th>${c}</th><td>${col[c]}</td></tr>`
  return rslt
}
app.all('/form', function (req, res) {
  var rslt = ''
  var peticion = [];
  peticion['Method'] = req.method + ' ' + req.protocol + ' ' + req.httpVersion
  peticion['AJAX'] = req.xhr
  var volver = ''
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
app.options(DIR_API_AUTH + 'login', function (req, res) {
  res.status(200).end()
})
app.post(DIR_API_AUTH + 'login', function (req, res) {
  var rslt = {
    success: false
  }
  if (req.body && req.body.name && req.body.password) {
    let usr = req.body.name
    let pwd = req.body.password
    fs.readFile(USR_FILENAME, 'utf8', function (err, data) {
      var lst = JSON.parse(data)
      var ele = lst.find(ele => ele[PROP_USERNAME] == usr && ele[PROP_PASSWORD] == pwd)
      if (ele) {
        let token = jwt.sign({
          usr: ele[PROP_USERNAME],
          name: ele.nombre,
          roles: ele.roles
        }, APP_SECRET, { expiresIn: '1h' })
        rslt = {
          success: true,
          token: AUTHENTICATION_SCHEME + token,
          name: ele[PROP_NAME]
        }
      }
      res.status(200).json(rslt).end()
    })
  } else {
    res.status(200).json(rslt).end()
  }
})
app.get(DIR_API_AUTH + 'register', function (req, res) {
  if(!res.locals.isAutenticated) {
    res.status(401).end()
    return
  }
  let usr = res.locals.usr;
  fs.readFile(USR_FILENAME, 'utf8', function (err, data) {
    var lst = JSON.parse(data)
    var ele = lst.find(ele => ele[PROP_USERNAME] == usr)
    if (ele) {
      res.status(200).json(ele).end()
    } else {
      res.status(401).end()
    }
  })
})
app.post(DIR_API_AUTH + 'register', function (req, res) {
  fs.readFile(USR_FILENAME, 'utf8', function (err, data) {
    var lst = JSON.parse(data)
    var ele = req.body
    if (ele[PROP_USERNAME] == undefined) {
      res.status(400).end('Falta clave primaria.')
    } else if (lst.find(item => item[PROP_USERNAME] == ele[PROP_USERNAME]) == undefined) {
      lst.push(ele)
      console.log(lst)
      fs.writeFile(USR_FILENAME, JSON.stringify(lst), 'utf8', function (err) {
        if (err)
          res.status(500).end('Error de escritura')
        else
          res.status(201).end()
      })
    } else {
      res.status(400).end('Clave duplicada.')
    }
  })
})
app.put(DIR_API_AUTH + 'register', function (req, res) {
  var ele = req.body
  if (res.locals.usr !== ele[PROP_USERNAME]) {
    res.status(403).end()
    return false
  }
  fs.readFile(USR_FILENAME, 'utf8', function (err, data) {
    var lst = JSON.parse(data)
    var ind = lst.findIndex(row => row[PROP_USERNAME] == ele[PROP_USERNAME])
    if (ind == -1) {
      res.status(404).end()
    } else {
      lst[ind] = ele
      console.log(lst)
      fs.writeFile(USR_FILENAME, JSON.stringify(lst), 'utf8', function (err) {
        if (err)
          res.status(500).end('Error de escritura')
        else
          res.status(20).end()
      })
    }
  })
})
app.get(DIR_API_AUTH + 'auth', function (req, res) {
  res.status(200).json({ isAutenticated: res.locals.isAutenticated, usr: res.locals.usr, name: res.locals.name })
})

app.all('/eco(/*)?', function (req, res) {
  res.status(200).json({
    url: req.url,
    method: req.method,
    headers: req.headers,
    autentication: res.locals,
    cookies: req.cookies,
    params: req.params,
    query: req.query,
    body: req.body,
  }).end();
});
// Servicios web
lstServicio.forEach(servicio => {
  app.get(servicio.url, async function (req, res) {
    try {
      let data = await fs.promises.readFile(servicio.fich, 'utf8');
      let lst = JSON.parse(data)
      if (Object.keys(req.query).length > 0) {
        if ('_search' in req.query) {
          lst = lst.filter(function (item) {
            return JSON.stringify(Object.values(item)).includes(req.query._search);
          })
        } else {
          const q = Object.keys(req.query).filter(item => !item.startsWith('_'));
          if (q.length > 0) {
            lst = lst.filter(function (item) {
              for (let cmp in q) {
                if (item[q[cmp]] != req.query[q[cmp]]) return false;
              }
              return true;
            })
          }
        }
      }
      let cmp = req.query._sort ? req.query._sort : servicio.pk;
      let dir = 1;
      if (cmp.startsWith("-")) {
        cmp = cmp.substring(1);
        dir = -1;
      }
      lst = lst.sort((a, b) => dir * (a[cmp] == b[cmp] ? 0 : (a[cmp] < b[cmp] ? -1 : 1)));
      if (req.query._page != undefined || req.query._rows != undefined) {
        const rows = req.query._rows && !isNaN(+req.query._rows) ? Math.abs(+req.query._rows) : 20;
        if (req.query._page && req.query._page.toUpperCase() == "COUNT") {
          res.json({pages: Math.ceil(lst.length / rows), rows: lst.length }).end()
          return;
        }
        const page = req.query._page && !isNaN(+req.query._page) ? Math.abs(+req.query._page) : 0;
        lst = lst.slice(page * rows, page * rows + rows)
      }
      console.log(JSON.stringify(lst))
      res.json(lst).end()
    } catch (error) {
      res.status(500).json(error).end()
    }
  })
  app.get(servicio.url + '/:id', async function (req, res) {
    try {
      let data = await fs.promises.readFile(servicio.fich, 'utf8');
      var lst = JSON.parse(data)
      var ele = lst.find(ele => ele[servicio.pk] == req.params.id)
      if (ele) {
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
    if (servicio.readonly && !res.locals.isAutenticated) {
      res.status(401).end('No autorizado.')
      return
    }
    let data = await fs.promises.readFile(servicio.fich, 'utf8');
    try {
      var lst = JSON.parse(data)
      var ele = req.body
      if (ele[servicio.pk] == undefined) {
        res.status(400).end('Falta clave primaria.')
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
        console.log(lst)
        await fs.promises.writeFile(servicio.fich, JSON.stringify(lst), 'utf8');
        res.status(201).json(lst).end()
      } else {
        res.status(400).end('Clave duplicada.')
      }
    } catch (error) {
      res.status(500).json(error).end()
    }
  })
  app.put(servicio.url, async function (req, res) {
    if (servicio.readonly && !res.locals.isAutenticated) {
      res.status(401).end('No autorizado.')
      return
    }
    let data = await fs.promises.readFile(servicio.fich, 'utf8');
    try {
      var lst = JSON.parse(data)
      var ele = req.body
      var ind = lst.findIndex(row => row[servicio.pk] == ele[servicio.pk])
      if (ind == -1) {
        res.status(404).end()
      } else {
        lst[ind] = ele
        console.log(lst)
        await fs.promises.writeFile(servicio.fich, JSON.stringify(lst), 'utf8');
        res.status(200).json(lst).end()
      }
    } catch (error) {
      res.status(500).json(error).end()
    }
  })
  app.put(servicio.url + '/:id', async function (req, res) {
    if (servicio.readonly && !res.locals.isAutenticated) {
      res.status(401).end('No autorizado.')
      return
    }
    let data = await fs.promises.readFile(servicio.fich, 'utf8');
    try {
      var lst = JSON.parse(data)
      var ele = req.body
      var ind = lst.findIndex(row => row[servicio.pk] == req.params.id)
      if (ind == -1) {
        res.status(404).end()
      } else {
        lst[ind] = ele
        console.log(lst)
        await fs.promises.writeFile(servicio.fich, JSON.stringify(lst), 'utf8');
        res.status(200).json(lst).end()
      }
    } catch (error) {
      res.status(500).json(error).end()
    }
  })
  app.patch(servicio.url + '/:id', async function (req, res) {
    if (servicio.readonly && !res.locals.isAutenticated) {
      res.status(401).end('No autorizado.')
      return
    }
    let data = await fs.promises.readFile(servicio.fich, 'utf8');
    try {
      var lst = JSON.parse(data)
      var ele = req.body
      var ind = lst.findIndex(row => row[servicio.pk] == req.params.id)
      if (ind == -1) {
        res.status(404).end()
      } else {
        lst[ind] = Object.assign(lst[ind], ele)
        console.log(lst)
        await fs.promises.writeFile(servicio.fich, JSON.stringify(lst), 'utf8');
        res.status(200).json(lst).end()
      }
    } catch (error) {
      res.status(500).json(error).end()
    }
  })
  app.delete(servicio.url + '/:id', async function (req, res) {
    let c = { "name": "admin", "password": "P@$$w0rd" }
    if (servicio.readonly && !res.locals.isAutenticated) {
      res.status(401).end('No autorizado.')
      return
    }
    let data = await fs.promises.readFile(servicio.fich, 'utf8');
    try {
      var lst = JSON.parse(data)
      var ind = lst.findIndex(row => row[servicio.pk] == req.params.id)
      if (ind == -1) {
        res.status(404).end()
      } else {
        lst.splice(ind, 1)
        console.log(lst)
        await fs.promises.writeFile(servicio.fich, JSON.stringify(lst), 'utf8');
        res.status(204).json(lst).end()
      }
    } catch (error) {
      res.status(500).json(error).end()
    }
  })
  app.options(servicio.url + '/:id', function (req, res) {
    res.status(200).end()
  })
})

app.get('/', function (req, res) {
  var rslt = ''
  var srv = `http://${server.address().address == '::' ? 'localhost' : server.address().address}:${server.address().port}`
  rslt = `<h1>MOCK Server</h1>
  <ul>
    <li><b>Esp&iacute;a de la Petici&oacute;n</b><ul><a href='${srv}/form'>${srv}/form</a></li></ul></li>
    <li><b>Subir ficheros</b><ul><a href='${srv}/fileupload'>${srv}/fileupload</a></li></ul></li>
    <li><b>Servicios REST</b><ul><li><a href='${srv}/eco'>${srv}/eco</a></li>`
  lstServicio.forEach(servicio => {
    rslt += `<li><a href='${srv}${servicio.url}'>${srv}${servicio.url}</a></li>`
  })
  rslt += `</ul></li>
    <li><b>Formulario AUTH</b> <br>action=${srv}${DIR_API_AUTH}login <br>method=post: name=${USERNAME}&password=${PASSWORD}<br><br>
    <form action='${srv}${DIR_API_AUTH}login' method='post'>
    <label>Name: <input type='text' name='name' value='${USERNAME}'></label><br>
    <label>Password: <input type='text' name='password' value='${PASSWORD}'></label><br>
    <input type='submit' value='Log In'>
    </form></li>
    </ul>`
  rslt += `<center><a href='https://github.com/jmagit/MOCKWebServer/blob/master/README.md' target='_blank'>Documentaci&oacute;n</center>`
  res.status(200).end(plantillaHTML('MOCK Server', rslt))
})

app.use(function (err, req, res, next) {
  res.status(500).json(err).end();
});


// Servidor
var server = app.listen(PUERTO, function () {
  var srv = `http://${server.address().address == '::' ? 'localhost' : server.address().address}:${server.address().port}`
  console.log('Servidor: %s', srv)
  console.log('Peticion SPY %s/form', srv)
  console.log('Formulario AUTH %s/login post: name=%s&password=%s', srv, USERNAME, PASSWORD)
  console.log('Servicio REST %s%s', srv, `/eco`)
  lstServicio.forEach(servicio => {
    console.log('Servicio REST %s%s', srv, servicio.url)
  })
})