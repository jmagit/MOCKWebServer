const express = require('express');
const fs = require('fs/promises')
const router = express.Router();
const { onlyAuthenticated, onlyInRole } = require('./seguridad')
const serviciosConfig = require('../data/__servicios.json');
const { generateError, generateErrorByStatus, generateErrorByError } = require('./utils');

const _DATALOG = false
const DIR_DATA = './data/'

const apis = {
  router, serviciosConfig
}

apis.getAll = async (servicio, req, res, next) => {
  try {
    let data = await fs.readFile(servicio.fichero, 'utf8');
    let list = JSON.parse(data)
    if (Object.keys(req.query).length > 0) {
      if ('_search' in req.query) {
        list = list.filter(item => JSON.stringify(Object.values(item)).includes(req.query._search))
      } else {
        const q = Object.keys(req.query).filter(item => !item.startsWith('_'));
        if (q.length > 0) {
          for (let cmp in q) {
            if (req.query[q[cmp]] === 'true') req.query[q[cmp]] = true;
            if (req.query[q[cmp]] === 'false') req.query[q[cmp]] = false;
          }
          list = list.filter(function (item) {
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
      if (cmp.startsWith("-")) {
        cmp = cmp.substring(1);
        return { cmp, dir: -1 }
      }
      return { cmp, dir: 1 }
    })
    const compara = function (a, b, index) {
      let result = orderBy[index].dir * (a[orderBy[index].cmp] == b[orderBy[index].cmp] ? 0 : (a[orderBy[index].cmp] < b[orderBy[index].cmp] ? -1 : 1))
      if (result !== 0 || index + 1 === orderBy.length) return result;
      return compara(a, b, index + 1);
    }
    list = list.sort((a, b) => compara(a, b, 0));
    if (req.query._page != undefined || req.query._rows != undefined) {
      const rows = req.query._rows && !isNaN(+req.query._rows) ? Math.abs(+req.query._rows) : 20;
      if (req.query._page && req.query._page.toUpperCase() == "COUNT") {
        res.json({ pages: Math.ceil(list.length / rows), rows: list.length }).end()
        return;
      }
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
    }
    if ('_projection' in req.query) {
      const cmps = req.query._projection.split(',');
      const mapeo = item => { let e = {}; cmps.forEach(c => e[c] = item[c]); return e; }
      if (list.content) {
        list.content = list.content.map(mapeo)
      } else {
        list = list.map(mapeo)
      }
    }
    res.json(list)
  } catch (error) {
    next(generateErrorByError(error))
  }
}
apis.getOne = async (servicio, req, res, next) => {
  try {
    let data = await fs.readFile(servicio.fichero, 'utf8');
    let list = JSON.parse(data)
    let element = list.find(item => item[servicio.pk] == req.params.id)
    if (element) {
      if ('_projection' in req.query) {
        const cmps = req.query._projection.split(',');
        let projection = {};
        cmps.forEach(c => projection[c] = element[c]);
        element = projection;
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
  if (servicio.readonly && !res.locals.isAuthenticated) {
    return next(generateErrorByStatus(401))
  }
  if (!req.is('json') || !req.body) {
    return next(generateErrorByStatus(406))
  }
  if (Object.keys(req.body).length == 0) {
    return next(generateError('Faltan los datos.', 400))
  }
  let data = await fs.readFile(servicio.fichero, 'utf8');
  try {
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
          let newId = +list.sort((a, b) => (a[servicio.pk] == b[servicio.pk] ? 0 : (a[servicio.pk] < b[servicio.pk] ? -1 : 1)))[list.length - 1][servicio.pk];
          element[servicio.pk] = newId + 1;
        }
      }
      list.push(element)
      if (_DATALOG) console.log(list)
      await fs.writeFile(servicio.fichero, JSON.stringify(list), 'utf8');
      res.status(201).header('location', `${req.protocol}://${req.hostname}:${req.connection.localPort}${req.originalUrl}/${element[servicio.pk]}`).end()
    } else {
      next(generateError('Clave duplicada.', 400))
    }
  } catch (error) {
    next(generateErrorByError(error))
  }
}
apis.put = async (servicio, req, res, next) => {
  if (servicio.readonly && !res.locals.isAuthenticated) {
    return next(generateErrorByStatus(401))
  }

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
  let data = await fs.readFile(servicio.fichero, 'utf8');
  try {
    let list = JSON.parse(data)
    let index = list.findIndex(row => row[servicio.pk] == req.params.id)
    if (index == -1) {
      return next(generateErrorByStatus(404))
    } else {
      list[index] = element
      if (_DATALOG) console.log(list)
      await fs.writeFile(servicio.fichero, JSON.stringify(list), 'utf8');
      res.status(200).json(list[index]).end()
    }
  } catch (error) {
    next(generateErrorByError(error))
  }
}
apis.putWithoutId = async (servicio, req, res, next) => {
  if (servicio.readonly && !res.locals.isAuthenticated) {
    return next(generateErrorByStatus(401))
  }
  if (!req.is('json') || !req.body) {
    return next(generateErrorByStatus(406))
  }
  if (req.body[servicio.pk] == undefined) {
    return next(generateError('Invalid identifier', 400))
  }
  let data = await fs.readFile(servicio.fichero, 'utf8');
  try {
    let list = JSON.parse(data)
    let element = req.body
    let index = list.findIndex(row => row[servicio.pk] == element[servicio.pk])
    if (index == -1)
      return next(generateErrorByStatus(404))
    list[index] = element
    if (_DATALOG) console.log(list)
    await fs.writeFile(servicio.fichero, JSON.stringify(list), 'utf8');
    res.status(200).json(list[index]).end()
  } catch (error) {
    next(generateErrorByError(error))
  }
}
apis.patch = async (servicio, req, res, next) => {
  if (servicio.readonly && !res.locals.isAuthenticated) {
    return next(generateErrorByStatus(401))
  }
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
  let data = await fs.readFile(servicio.fichero, 'utf8');
  try {
    let list = JSON.parse(data)
    let index = list.findIndex(row => row[servicio.pk] == req.params.id)
    if (index == -1)
      return next(generateErrorByStatus(404))
    list[index] = Object.assign({}, list[index], element)
    if (_DATALOG) console.log(list)
    await fs.writeFile(servicio.fichero, JSON.stringify(list), 'utf8');
    res.status(200).json(list[index]).end()
  } catch (error) {
    next(generateErrorByError(error))
  }
}
apis.delete = async (servicio, req, res, next) => {
  if (servicio.readonly && !res.locals.isAuthenticated) {
    return next(generateErrorByStatus(401))
  }
  let data = await fs.readFile(servicio.fichero, 'utf8');
  try {
    let list = JSON.parse(data)
    let index = list.findIndex(row => row[servicio.pk] == req.params.id)
    if (index == -1)
      return next(generateErrorByStatus(404))
    list.splice(index, 1)
    if (_DATALOG) console.log(list)
    await fs.writeFile(servicio.fichero, JSON.stringify(list), 'utf8');
    res.sendStatus(204)
  } catch (error) {
    next(generateErrorByError(error))
  }
}
apis.options = async (_servicio, _req, res) => {
  res.status(200).end()
}

serviciosConfig.forEach(servicio => {
  const subrouter = express.Router();
  servicio.fichero = DIR_DATA + servicio.fichero
  if (servicio.url === 'personas') {
    subrouter.use(onlyAuthenticated)
  }
  if (servicio.url === 'usuarios') {
    subrouter.use(onlyInRole('Administradores'))
  }
  subrouter.route('/')
    .get((req, res, next) => apis.getAll(servicio, req, res, next))
    .post((req, res, next) => apis.post(servicio, req, res, next))
    .put((req, res, next) => apis.putWithoutId(servicio, req, res, next))
    .options((req, res, next) => apis.options(servicio, req, res, next));
  subrouter.route('/:id')
    .get((req, res, next) => apis.getOne(servicio, req, res, next))
    .put((req, res, next) => apis.put(servicio, req, res, next))
    .patch((req, res, next) => apis.patch(servicio, req, res, next))
    .delete((req, res, next) => apis.delete(servicio, req, res, next))
    .options((req, res, next) => apis.options(servicio, req, res, next));
  router.use('/' + servicio.url, subrouter)
})

module.exports = apis; 
