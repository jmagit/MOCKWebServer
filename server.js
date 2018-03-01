var fs = require('fs')
var express = require('express')
var bodyParser = require('body-parser')
var jwt = require('jsonwebtoken')

const PUERTO = 4321;
const APP_SECRET = 'mysecureapp'
const USERNAME = 'admin'
const PASSWORD = 'P@$$w0rd'

var app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// Cross-origin resource sharing (CORS)
app.use(function (req, res, next) {
  var origen = req.header("Origin")
  if (!origen) origen = '*'
  res.header('Access-Control-Allow-Origin', origen)
  res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization, X-Requested-With, X-SRF-TOKEN')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Credentials', 'true')
  next()
})

// Ficheros publicos
app.use(express.static('public'))

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
app.options('/login', function (req, res) {
  res.status(200).end()
})
app.post('/login', function (req, res) {
  var rslt = { success: false }
  if (req.body != null && req.body.name == USERNAME
    && req.body.password == PASSWORD) {
    let token = jwt.sign({ data: USERNAME, expiresIn: '1h' }, APP_SECRET)
    rslt = { success: true, token: token }
  }
  res.status(200).end(JSON.stringify(rslt))
})
function isAutenticated(readonly, req, res) {
  if (readonly) {
    let token = req.headers['authorization']
    try {
      var decoded = jwt.verify(token, APP_SECRET)
    } catch (err) { }
    if (!decoded || decoded.data !== USERNAME) {
      res.status(401).end()
      return false
    }
  }
  return true
}

// Servicios web
const lstServicio = [
  { url: '/personas', pk: 'id', fich: __dirname + '/data/personas.json', readonly: false },
  { url: '/libros', pk: 'idLibro', fich: __dirname + '/data/libros.json', readonly: false },
  { url: '/biblioteca', pk: 'id', fich: __dirname + '/data/biblioteca.json', readonly: false },
  { url: '/vehiculos', pk: 'id', fich: __dirname + '/data/vehiculos.json', readonly: false },
  { url: '/marcas', pk: 'marca', fich: __dirname + '/data/marcas-modelos.json', readonly: false }
]

lstServicio.forEach(servicio => {
  app.get(servicio.url, function (req, res) {
    fs.readFile(servicio.fich, 'utf8', function (err, data) {
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
      if(cmp.startsWith("-")) {
        cmp = cmp.substring(1);
        dir = -1;
      }
      lst = lst.sort((a, b) => dir * (a[cmp] == b[cmp] ? 0 : (a[cmp] < b[cmp] ? -1 : 1)));
      if (req.query._page != undefined || req.query._rows != undefined) {
        const rows = req.query._rows && !isNaN(+req.query._rows) ? Math.abs(+req.query._rows) : 20;
        if(req.query._page && req.query._page.toUpperCase() == "COUNT") {
          res.end(`{ "pages": ${Math.ceil(lst.length/rows)}, "rows": ${lst.length}}`)
          return;
        }
        const page = req.query._page && !isNaN(+req.query._page) ? Math.abs(+req.query._page) : 0;
        lst = lst.slice(page * rows, page * rows + rows)
      }
      let rslt = JSON.stringify(lst);
      console.log(rslt)
      res.cookie('XSRF-TOKEN', '123456790ABCDEF')
      res.end(rslt)
    })
  })
  app.get(servicio.url + '/:id', function (req, res) {
    fs.readFile(servicio.fich, 'utf8', function (err, data) {
      var lst = JSON.parse(data)
      var ele = lst.find(ele => ele[servicio.pk] == req.params.id)
      console.log(ele)
      res.cookie('XSRF-TOKEN', '123456790ABCDEF')
      res.end(JSON.stringify(ele))
    })
  })
  app.post(servicio.url, function (req, res) {
    if (!isAutenticated(servicio.readonly, req, res)) return
    fs.readFile(servicio.fich, 'utf8', function (err, data) {
      var lst = JSON.parse(data)
      var ele = req.body
      if(ele[servicio.pk] == undefined) {
        res.status(500).end('Falta clave primaria.')
      } else if (lst.find(item => item[servicio.pk] == ele[servicio.pk]) == undefined) {
        lst.push(ele)
        console.log(lst)
        fs.writeFile(servicio.fich, JSON.stringify(lst), 'utf8', function (err) {
          res.status(500).end('Error de escritura')
        })
        res.status(201).end(JSON.stringify(lst))
      } else {
        res.status(500).end('Clave duplicada.')
      }
    })
  })
  app.put(servicio.url, function (req, res) {
    if (!isAutenticated(servicio.readonly, req, res)) return
    fs.readFile(servicio.fich, 'utf8', function (err, data) {
      var lst = JSON.parse(data)
      var ele = req.body
      var ind = lst.findIndex(row => row[servicio.pk] == ele.id)
      if (ind == -1) {
        res.status(404).end()
      } else {
        lst[ind] = ele
        console.log(lst)
        fs.writeFile(servicio.fich, JSON.stringify(lst), 'utf8', function (err) {
          res.status(500).end('Error de escritura')
        })
        res.status(200).end(JSON.stringify(lst))
      }
    })
  })
  app.put(servicio.url + '/:id', function (req, res) {
    if (!isAutenticated(servicio.readonly, req, res)) return
    fs.readFile(servicio.fich, 'utf8', function (err, data) {
      var lst = JSON.parse(data)
      var ele = req.body
      var ind = lst.findIndex(row => row[servicio.pk] == req.params.id)
      if (ind == -1) {
        res.status(404).end()
      } else {
        lst[ind] = ele
        console.log(lst)
        fs.writeFile(servicio.fich, JSON.stringify(lst), 'utf8', function (err) {
          res.status(500).end('Error de escritura')
        })
        res.status(200).end(JSON.stringify(lst))
      }
    })
  })
  app.delete(servicio.url + '/:id', function (req, res) {
    if (!isAutenticated(servicio.readonly, req, res)) return
    fs.readFile(servicio.fich, 'utf8', function (err, data) {
      var lst = JSON.parse(data)
      var ind = lst.findIndex(row => row[servicio.pk] == req.params.id)
      if (ind == -1) {
        res.status(404).end()
      } else {
        lst.splice(ind, 1)
        console.log(lst)
        fs.writeFile(servicio.fich, JSON.stringify(lst), 'utf8', function (err) {
          res.status(500).end('Error de escritura')
        })
        res.status(200).end(JSON.stringify(lst))
      }
    })
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
    <li>Formulario AUTH <br>action=${srv}/login <br>method=post: name=${USERNAME}&password=${PASSWORD}<br>
    <form action='${srv}/login' method='post'>
    <label>name: <input type='text' name='name' value='${USERNAME}'></label>
    <label>password: <input type='text' name='password' value='${PASSWORD}'></label>
    <input type='submit' value='Log In'>
    </form></li>
    <li><a href='${srv}/form'>Peticion SPY ${srv}/form</a></li>
    <li>Servicios REST<ul>`
  lstServicio.forEach(servicio => {
    rslt += `<li><a href='${srv}${servicio.url}'>${srv}${servicio.url}</a></li>`
  })
  rslt += `</ul></li></ul>`
  res.status(200).end(plantillaHTML('MOCK Server', rslt))
})


// Servidor
var server = app.listen(PUERTO, function () {
  var srv = `http://${server.address().address == '::' ? 'localhost' : server.address().address}:${server.address().port}`
  console.log('Peticion SPY %s/form', srv)
  console.log('Formulario AUTH %s/login post: name=%s&password=%s', srv, USERNAME, PASSWORD)
  lstServicio.forEach(servicio => {
    console.log('Servicio REST %s%s', srv, servicio.url)
  })
})
