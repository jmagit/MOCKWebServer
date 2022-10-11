const express = require('express');
const DbJSON = require('./dbJSON')
const { onlyAuthenticated, onlyInRole, readOnly } = require('./seguridad')
const { generateError, generateErrorByStatus, generateErrorByError, getServiciosConfig } = require('./utils');

const router = express.Router();
const serviciosConfig = getServiciosConfig();
const DIR_DATA = './data/'

const apis = {
  router, serviciosConfig
}

const generaFiltro = (req) => {
  if (!req.query || Object.keys(req.query).length === 0)
    return null
  if ('_search' in req.query)
    return item => JSON.stringify(Object.values(item)).includes(req.query._search)

  const q = Object.keys(req.query).filter(item => !item.startsWith('_'));
  if (q.length === 0)
    return null
  for (let cmp in q) {
    if (req.query[q[cmp]] === 'true') req.query[q[cmp]] = true;
    if (req.query[q[cmp]] === 'false') req.query[q[cmp]] = false;
  }
  return item => {
    for (let cmp in q) {
      if (item[q[cmp]] != req.query[q[cmp]]) return false;
    }
    return true;
  }
}
const generaPagina = (req, list, rows) => {
  const page = req.query._page && !isNaN(+req.query._page) ? Math.abs(+req.query._page) : 0;
  list = {
    content: list.slice(page * rows, page * rows + rows),
    totalElements: list.length,
    totalPages: Math.ceil(list.length / rows),
    number: list.length === 0 ? 0 : page,
    size: rows,
  }
  list.empty = list.content.length === 0;
  list.first = !list.empty && page === 0;
  list.last = !list.empty && page === (list.totalPages - 1);
  list.numberOfElements = list.content.length
  return list
}
apis.getAll = async (servicio, req, res, next) => {
  try {
    await servicio.db.load()
    let list = await servicio.db.select(req.query._projection, generaFiltro(req),
      req.query._sort ? req.query._sort : servicio.pk)
    if (req.query._page != undefined || req.query._rows != undefined) {
      const rows = req.query._rows && !isNaN(+req.query._rows) ? Math.abs(+req.query._rows) : 20;
      if (req.query._page && typeof(req.query._page) === "string" && req.query._page.toUpperCase() == "COUNT") {
        res.json({ pages: Math.ceil(list.length / rows), rows: list.length }).end()
        return;
      }
      list = generaPagina(req, list, rows)
    }
    res.json(list)
  } catch (error) {
    next(generateErrorByError(error))
  }
}
apis.getOne = async (servicio, req, res, next) => {
  try {
    await servicio.db.load()
    let element = servicio.db.getById(req.params.id, req.query._projection)
    if (element) {
      res.status(200).json(element)
    } else {
      return next(generateErrorByStatus(404))
    }
  } catch (err) {
    next(generateErrorByError(err))
  }
}
apis.post = async (servicio, req, res, next) => {
  if (!req.is('json') || !req.body) {
    return next(generateErrorByStatus(406))
  }
  if (Object.keys(req.body).length == 0) {
    return next(generateError('Faltan los datos.', 400))
  }
  try {
    await servicio.db.load()
    let element = req.body
    if (element[servicio.pk] == undefined) {
      element[servicio.pk] = 0
    }
    element = await servicio.db.add(element, true);
    res.status(201).header('location', `${req.protocol}://${req.hostname}:${req.connection.localPort}${req.originalUrl}/${element[servicio.pk]}`).end()
  } catch (error) {
    next(generateErrorByError(error))
  }
}
apis.put = async (servicio, req, res, next) => {
  if (!req.is('json') || !req.body) {
    return next(generateErrorByStatus(406))
  }
  let element = req.body
  if (req.body[servicio.pk] == undefined) {
    if (Object.keys(req.body).length == 0) {
      return next(generateError('Faltan los datos.', 400))
    }
    element[servicio.pk] = req.params.id
  } else if (req.body[servicio.pk] != req.params.id) {
    return next(generateError('Invalid identifier', 400))
  }
  try {
    await servicio.db.load()
    element = await servicio.db.update(element, true);
    res.status(200).json(element).end()
  } catch (error) {
    next(generateErrorByError(error))
  }
}
apis.putWithoutId = async (servicio, req, res, next) => {
  if (!req.is('json') || !req.body) {
    return next(generateErrorByStatus(406))
  }
  if (req.body[servicio.pk] == undefined) {
    return next(generateError('Invalid identifier', 400))
  }
  let element = req.body
  try {
    await servicio.db.load()
    element = await servicio.db.update(element, true);
    res.status(200).json(element).end()
  } catch (error) {
    next(generateErrorByError(error))
  }
}
apis.patch = async (servicio, req, res, next) => {
  if (!req.is('json') || !req.body) {
    return next(generateErrorByStatus(406))
  }
  if (Object.keys(req.body).length == 0) {
    return next(generateError('Faltan los datos.', 400))
  }
  if (req.body[servicio.pk] != undefined && req.body[servicio.pk] != req.params.id) {
    return next(generateError('Invalid identifier', 400))
  }
  let partial = req.body
  try {
    await servicio.db.load()
    let element = await servicio.db.change(req.params.id, partial, true);
    res.status(200).json(element)
  } catch (error) {
    next(generateErrorByError(error))
  }
}
apis.delete = async (servicio, req, res, next) => {
  try {
    await servicio.db.load()
    await servicio.db.delete(req.params.id, true)
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
  // servicio.file = DIR_DATA + servicio.file
  if (!servicio.operations || servicio.operations.length === 0) servicio.operations = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
  if (servicio.security) {
    if (typeof (servicio.security) === 'string') {
      apiRouter.use(onlyInRole(servicio.security))
    } else {
      apiRouter.use(onlyAuthenticated)
    }
  } else if (servicio.readonly) {
    apiRouter.use(readOnly)
  }

  if (servicio.endpoint === 'usuarios') {
    apiRouter.use(onlyInRole('Administradores'))
  }
  servicio.db = new DbJSON(DIR_DATA + servicio.file, servicio.pk);
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
