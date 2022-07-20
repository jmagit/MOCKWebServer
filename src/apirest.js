const express = require('express');
const fs = require('fs/promises')
const router = express.Router();
const { onlyAuthenticated, onlyInRole, readOnly } = require('./seguridad')
const { generateError, generateErrorByStatus, generateErrorByError, getServiciosConfig } = require('./utils');
const serviciosConfig = getServiciosConfig();

const _DATALOG = false
const DIR_DATA = './data/'

const apis = {
  router, serviciosConfig
}

const filtrar = (req, list) => {
  if (Object.keys(req.query).length === 0)
    return list
  if ('_search' in req.query)
    list = list.filter(item => JSON.stringify(Object.values(item)).includes(req.query._search))
  const q = Object.keys(req.query).filter(item => !item.startsWith('_'));
  if (q.length === 0)
    return list
  for (let cmp in q) {
    if (req.query[q[cmp]] === 'true') req.query[q[cmp]] = true;
    if (req.query[q[cmp]] === 'false') req.query[q[cmp]] = false;
  }
  return list.filter(function (item) {
    for (let cmp in q) {
      if (item[q[cmp]] != req.query[q[cmp]]) return false;
    }
    return true;
  })
}

const extraePropiedadesSort = list => list.map(cmp => {
  if (cmp.startsWith("-")) {
    cmp = cmp.substring(1);
    return { cmp, dir: -1 }
  }
  return { cmp, dir: 1 }
})
const comparaValores = function (a, b) {
  return a == b ? 0 : (a < b ? -1 : 1)
}
const comparaMultiplesPropiedades = function (a, b, propiedades, index) {
  let result = propiedades[index].dir * comparaValores(a[propiedades[index].cmp], b[propiedades[index].cmp])
  if (result !== 0 || index + 1 === propiedades.length) return result;
  return comparaMultiplesPropiedades(a, b, propiedades, index + 1);
}
const generaPagina = (req, list, rows) => {
  const page = req.query._page && !isNaN(+req.query._page) ? Math.abs(+req.query._page) : 0;
  list = {
    content: list.slice(page * rows, page * rows + rows),
    totalElements: list.length,
    totalPages: Math.ceil(list.length / rows),
    number: list.length === 0 ? 0 : page + 1,
    size: rows,
  }
  list.empty = list.content.length === 0;
  list.first = !list.empty && page === 0;
  list.last = !list.empty && page === (list.totalPages - 1);
  list.numberOfElements = list.content.length
  return list
}
const proyectar = projection => {
  const propiedades = projection.split(',');
  return item => { let e = {}; propiedades.forEach(c => e[c] = item[c]); return e; }
}

apis.getAll = async (servicio, req, res, next) => {
  try {
    let data = await fs.readFile(servicio.file, 'utf8');
    let list = JSON.parse(data)
    list = filtrar(req, list)
    let orderBy = extraePropiedadesSort(req.query._sort ? req.query._sort.split(',') : [servicio.pk]);
    list = list.sort((a, b) => comparaMultiplesPropiedades(a, b, orderBy, 0));
    if (req.query._page != undefined || req.query._rows != undefined) {
      const rows = req.query._rows && !isNaN(+req.query._rows) ? Math.abs(+req.query._rows) : 20;
      if (req.query._page && req.query._page.toUpperCase() == "COUNT") {
        res.json({ pages: Math.ceil(list.length / rows), rows: list.length }).end()
        return;
      }
      list = generaPagina(req, list, rows)
    }
    if ('_projection' in req.query) {
      if (list.content) {
        list.content = list.content.map(proyectar(req.query._projection))
      } else {
        list = list.map(proyectar(req.query._projection))
      }
    }
    res.json(list)
  } catch (error) {
    next(generateErrorByError(error))
  }
}
apis.getOne = async (servicio, req, res, next) => {
  try {
    let data = await fs.readFile(servicio.file, 'utf8');
    let list = JSON.parse(data)
    let element = list.find(item => item[servicio.pk] == req.params.id)
    if (element) {
      if ('_projection' in req.query) {
        element = proyectar(req.query._projection)(element);
      }
      if (_DATALOG) console.log(element)
      res.status(200).json(element)
    } else {
      return next(generateErrorByStatus(404))
    }
  } catch (err) {
    next(generateErrorByError(err))
  }
}
apis.post = async (servicio, req, res, next) => {
  // if (servicio.readonly && !res.locals.isAuthenticated) {
  //   return next(generateErrorByStatus(401))
  // }
  if (!req.is('json') || !req.body) {
    return next(generateErrorByStatus(406))
  }
  if (Object.keys(req.body).length == 0) {
    return next(generateError('Faltan los datos.', 400))
  }
  try {
    let data = await fs.readFile(servicio.file, 'utf8');
    let list = JSON.parse(data)
    let element = req.body
    if (element[servicio.pk] == undefined) {
      element[servicio.pk] = 0
    }
    if (list.find(item => item[servicio.pk] == element[servicio.pk]) == undefined) {
      if (element[servicio.pk] == 0) {
        if (list.length == 0)
          element[servicio.pk] = 1;
        else {
          let newId = +list.sort((a, b) => comparaValores(a[servicio.pk], b[servicio.pk]))[list.length - 1][servicio.pk];
          element[servicio.pk] = newId + 1;
        }
      }
      list.push(element)
      if (_DATALOG) console.log(list)
      await fs.writeFile(servicio.file, JSON.stringify(list), 'utf8');
      res.status(201).header('location', `${req.protocol}://${req.hostname}:${req.connection.localPort}${req.originalUrl}/${element[servicio.pk]}`).end()
    } else {
      next(generateError('Clave duplicada.', 400))
    }
  } catch (error) {
    next(generateErrorByError(error))
  }
}
apis.put = async (servicio, req, res, next) => {
  // if (servicio.readonly && !res.locals.isAuthenticated) {
  //   return next(generateErrorByStatus(401))
  // }

  if (!req.is('json') || !req.body) {
    return next(generateErrorByStatus(406))
  }
  let element = req.body
  if (!req.body[servicio.pk]) {
    if (Object.keys(req.body).length == 0) {
      return next(generateError('Faltan los datos.', 400))
    }
    element[servicio.pk] = req.params.id
  } else if (req.body[servicio.pk] != req.params.id) {
    return next(generateError('Invalid identifier', 400))
  }
  try {
    let data = await fs.readFile(servicio.file, 'utf8');
    let list = JSON.parse(data)
    let index = list.findIndex(row => row[servicio.pk] == req.params.id)
    if (index == -1) {
      return next(generateErrorByStatus(404))
    } else {
      list[index] = element
      if (_DATALOG) console.log(list)
      await fs.writeFile(servicio.file, JSON.stringify(list), 'utf8');
      res.status(200).json(list[index]).end()
    }
  } catch (error) {
    next(generateErrorByError(error))
  }
}
apis.putWithoutId = async (servicio, req, res, next) => {
  // if (servicio.readonly && !res.locals.isAuthenticated) {
  //   return next(generateErrorByStatus(401))
  // }
  if (!req.is('json') || !req.body) {
    return next(generateErrorByStatus(406))
  }
  if (req.body[servicio.pk] == undefined) {
    return next(generateError('Invalid identifier', 400))
  }
  try {
    let data = await fs.readFile(servicio.file, 'utf8');
    let list = JSON.parse(data)
    let element = req.body
    let index = list.findIndex(row => row[servicio.pk] == element[servicio.pk])
    if (index == -1)
      return next(generateErrorByStatus(404))
    list[index] = element
    if (_DATALOG) console.log(list)
    await fs.writeFile(servicio.file, JSON.stringify(list), 'utf8');
    res.status(200).json(list[index]).end()
  } catch (error) {
    next(generateErrorByError(error))
  }
}
apis.patch = async (servicio, req, res, next) => {
  // if (servicio.readonly && !res.locals.isAuthenticated) {
  //   return next(generateErrorByStatus(401))
  // }
  if (!req.is('json') || !req.body) {
    return next(generateErrorByStatus(406))
  }
  let element = req.body
  if (Object.keys(req.body).length == 0) {
    return next(generateError('Faltan los datos.', 400))
  }
  if (req.body[servicio.pk] && req.body[servicio.pk] != req.params.id) {
    return next(generateError('Invalid identifier', 400))
  }
  try {
    let data = await fs.readFile(servicio.file, 'utf8');
    let list = JSON.parse(data)
    let index = list.findIndex(row => row[servicio.pk] == req.params.id)
    if (index == -1)
      return next(generateErrorByStatus(404))
    list[index] = Object.assign({}, list[index], element)
    if (_DATALOG) console.log(list)
    await fs.writeFile(servicio.file, JSON.stringify(list), 'utf8');
    res.status(200).json(list[index]).end()
  } catch (error) {
    next(generateErrorByError(error))
  }
}
apis.delete = async (servicio, req, res, next) => {
  // if (servicio.readonly && !res.locals.isAuthenticated) {
  //   return next(generateErrorByStatus(401))
  // }
  try {
    let data = await fs.readFile(servicio.file, 'utf8');
    let list = JSON.parse(data)
    let index = list.findIndex(row => row[servicio.pk] == req.params.id)
    if (index == -1)
      return next(generateErrorByStatus(404))
    list.splice(index, 1)
    if (_DATALOG) console.log(list)
    await fs.writeFile(servicio.file, JSON.stringify(list), 'utf8');
    res.sendStatus(204)
  } catch (error) {
    next(generateErrorByError(error))
  }
}
apis.options = async (_servicio, _req, res) => {
  res.status(200).end()
}

serviciosConfig.forEach(servicio => {
  const apiRouter = express.Router();
  servicio.file = DIR_DATA + servicio.file
  if (!servicio.operations || servicio.operations.length === 0) servicio.operations = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
  if (servicio.security) {
    if (typeof (servicio.security) === 'string')
      apiRouter.use(onlyInRole(servicio.security))
    else
      apiRouter.use(onlyAuthenticated)
  } else if (servicio.readonly)
    apiRouter.use(readOnly)

  if (servicio.endpoint === 'usuarios') {
    apiRouter.use(onlyInRole('Administradores'))
  }
  let sinID = apiRouter.route('/')
  let conID = apiRouter.route('/:id')
  if (servicio.operations.includes('GET')) {
    sinID.get((req, res, next) => apis.getAll(servicio, req, res, next))
    conID.get((req, res, next) => apis.getOne(servicio, req, res, next))
  }
  if (servicio.operations.includes('POST'))
    sinID.post((req, res, next) => apis.post(servicio, req, res, next))
  if (servicio.operations.includes('PUT')) {
    sinID.put((req, res, next) => apis.putWithoutId(servicio, req, res, next))
    conID.put((req, res, next) => apis.put(servicio, req, res, next))
  }
  if (servicio.operations.includes('OPTIONS')) {
    sinID.options((req, res, next) => apis.options(servicio, req, res, next));
    conID.options((req, res, next) => apis.options(servicio, req, res, next));
  }
  if (servicio.operations.includes('PATCH'))
    conID.patch((req, res, next) => apis.patch(servicio, req, res, next))
  if (servicio.operations.includes('DELETE'))
    conID.delete((req, res, next) => apis.delete(servicio, req, res, next))
  router.use('/' + servicio.endpoint, apiRouter)
})

module.exports = apis; 
