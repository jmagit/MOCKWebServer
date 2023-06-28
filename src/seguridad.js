const express = require('express');
const router = express.Router();
const { createHash, createPrivateKey, createPublicKey } = require('crypto')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const fs = require('fs/promises');
const config = require('../config')
const { generateErrorByStatus, generateError, generateErrorByError } = require('./utils')

module.exports = router

// Criptografía
async function encriptaPassword(password) {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(password, salt)
}

const RefreshTokenHMAC256 = {
    generar: (usuario) => {
        return jwt.sign({
            usr: usuario[config.security.PROP_USERNAME],
        }, config.security.APP_SECRET, { issuer: 'MicroserviciosJWT', audience: 'authorization', expiresIn: config.security.EXPIRACION_MIN * config.security.REFRESH_FACTOR + 'm', notBefore: config.security.EXPIRACION_MIN + 'm' })
    },
    decode: (token) => {
        return jwt.verify(token, config.security.APP_SECRET);
    }
}

const TokenRS256 = {
    generar: (usuario) => {
        let buff = Buffer.from(config.security.PRIVATE_KEY, 'base64');

        return jwt.sign({
            usr: usuario[config.security.PROP_USERNAME],
            name: usuario.nombre,
            roles: usuario.roles
        }, createPrivateKey({ key: buff, format: 'der', type: 'pkcs8' }), { issuer: 'MicroserviciosJWT', audience: 'authorization', algorithm: 'RS256', expiresIn: config.security.EXPIRACION_MIN + 'm' })
    },
    decode: (token) => {
        let buff = Buffer.from(config.security.PUBLIC_KEY, 'base64');
        return jwt.verify(token, createPublicKey({ key: buff, format: 'der', type: 'spki' }), { algorithms: ['RS256'] });
    }
}
const CreatedTokenHMAC256 = {
    generar: (usuario) => {
        return jwt.sign({
            usr: usuario[config.security.PROP_USERNAME],
        }, config.security.APP_SECRET, { expiresIn: '24h' })
    },
    decode: (token) => {
        return jwt.verify(token, config.security.APP_SECRET);
    }
}
module.exports.CreatedTokenHMAC256 = CreatedTokenHMAC256;

module.exports.generarTokenJWT = TokenRS256.generar

module.exports.generarTokenScheme = (usuario) => {
    return config.security.AUTHENTICATION_SCHEME + module.exports.generarTokenJWT(usuario)
}

// Middleware: Cross-origin resource sharing (CORS)
module.exports.useCORS = (req, res, next) => {
    let origen = req.header("Origin")
    if (!origen) origen = '*'
    res.header('Access-Control-Allow-Origin', origen)
    res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, authorization, X-Requested-With, X-XSRF-TOKEN')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    res.header('Access-Control-Allow-Credentials', 'true')
    next()
}

// Middleware: Autenticación
module.exports.useAuthentication = (req, res, next) => {
    res.locals.isAuthenticated = false;
    let token = ''
    if (!req.headers['authorization']) {
        if (!req.cookies['Authorization']) {
            next();
            return;
        }
        token = req.cookies['Authorization'];
    } else
        token = req.headers['authorization'].substring(config.security.AUTHENTICATION_SCHEME.length)
    try {
        let decoded = TokenRS256.decode(token);
        res.locals.isAuthenticated = true;
        res.locals.usr = decoded.usr;
        res.locals.name = decoded.name;
        res.locals.roles = decoded.roles;
        res.locals.isInRole = role => res.locals.roles.includes(role)
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            res.set('WWW-Authenticate', 'Bearer realm="MicroserviciosJWT", error="invalid_token", error_description="The access token expired"')
            return next(generateError('Invalid token', 401, 'Token expired', `expiredAt: ${err.expiredAt}`))
        }
        return next(generateError('Invalid token', 401))
    }
}
// Middleware: Autorización
module.exports.onlyAuthenticated = (req, res, next) => {
    if (req.method === 'OPTIONS') {
        return next()
    }
    if (!res.locals.isAuthenticated) {
        return next(generateErrorByStatus(401))
    }
    next()
}
module.exports.onlyInRole = (roles) => (req, res, next) => {
    if (req.method === 'OPTIONS') {
        return next()
    }
    if (!res.locals.isAuthenticated) {
        return next(generateErrorByStatus(401))
    }

    if (roles.split(',').some(role => res.locals.isInRole(role))) {
        next()
    } else {
        return next(generateErrorByStatus(403))
    }
}
module.exports.onlySelf = (_req, res, next) => {
    res.locals.onlySelf = true;
    next()
}
module.exports.readOnly = (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'OPTIONS' && !res.locals.isAuthenticated) {
        return next(generateErrorByStatus(401))
    }
    next()
}

const isSelf = (res, id) => {
    return !res.locals.onlySelf || !id || id == res.locals.usr
}
module.exports.isSelf = isSelf

// Middleware: Cross-Site Request Forgery (XSRF)
module.exports.generateXsrfToken = (req) => {
    const hash = createHash('sha256')
    let client = `${req.client.remoteFamily}-${req.client.remoteAddress}`
    hash.update(client)
    return hash.digest('base64')
}
function generateXsrfCookie(req, res) {
    res.cookie('XSRF-TOKEN', module.exports.generateXsrfToken(req), { httpOnly: false, maxAge: 30 * 60 * 1000 })
}
function isInvalidXsrfToken(req) {
    let token = req.headers['x-xsrf-token'] || req.body['xsrftoken']
    let cookie = req.cookies['XSRF-TOKEN']
    let secret = module.exports.generateXsrfToken(req)
    return !token || cookie !== token || token !== secret
}
// Middleware: Cookie-to-Header Token
module.exports.useXSRF = (req, res, next) => {
    if (!req.cookies['XSRF-TOKEN'])
        generateXsrfCookie(req, res)
    if ('POST|PUT|DELETE|PATCH'.indexOf(req.method.toUpperCase()) >= 0 && isInvalidXsrfToken(req)) {
        if (req.cookies['XSRF-TOKEN'] !== module.exports.generateXsrfToken(req))
            generateXsrfCookie(req, res)
        return next(generateError('Invalid XSRF-TOKEN', 401))
    }
    res.XsrfToken = module.exports.generateXsrfToken(req)
    next()
}

// Rutas: Control de acceso
/**
* @swagger
* tags:
*   - name: autenticación
*     description: Login
*   - name: registro
*     description: Cuentas de usuarios
*/
/**
 * @swagger
 * components:
 *   schemas:
 *     Login:
 *       description: Credenciales de autenticación
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *         password:
 *           type: string
 *           format: password
 *     RespuestaLogin:
 *       type: object
 *       title: Respuesta Login
 *       properties:
 *         success:
 *           type: boolean
 *         token:
 *           type: string
 *         refresh:
 *           type: string
 *         name:
 *           type: string
 *         roles:
 *           type: array
 *           items:
 *             type: string
 *         expires_in:
 *           type: integer
 *           format: int32
 *     RefreshToken:
 *       type: object
 *       title: Token de petición de refresco
 *       properties:
 *         token:
 *           type: string
*/
/**
 * @swagger
 *
 * /login:
 *   options:
 *     tags: [ autenticación ]
 *     summary: Sondeo CORS
 *     responses:
 *       "200":
 *         description: "OK"
 */
router.options('/login', function (_req, res) {
    res.sendStatus(200)
})
/**
 * @swagger
 *
 * /login:
 *   post:
 *     tags: [ autenticación ]
 *     summary: Iniciar sesión
 *     parameters:
 *       - name: cookie
 *         in: query
 *         required: false
 *         description: 'true para que genere y envíe la cookie'
 *         schema:
 *           type: boolean
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Login"
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 description: Usuario
 *                 type: string
 *               password:
 *                 description: Contraseña
 *                 type: string
 *                 format: password
 *       required: true
 *     responses:
 *       "200":
 *         headers: 
 *           Set-Cookie:
 *             schema: 
 *               type: string
 *         description: "Resultado de la autenticación"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/RespuestaLogin"
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 */
router.post('/login', async function (req, res, next) {
    if (!req.body || !req.body.username || !req.body.password) {
        // setTimeout(() => next(generateErrorByStatus(400)), 1000)
        return next(generateErrorByStatus(400))
    }
    let usr = req.body.username
    let pwd = req.body.password
    if (!config.security.PASSWORD_PATTERN.test(pwd)) {
        // setTimeout(() => next(generateErrorByStatus(400)), 1000)
        return next(generateErrorByStatus(400))
    }
    let data = await fs.readFile(config.security.USR_FILENAME, 'utf8')
    let list = JSON.parse(data)
    let element = list.find(item => item[config.security.PROP_USERNAME] == usr && item.activo)
    if (element && await bcrypt.compare(pwd, element[config.security.PROP_PASSWORD])) {
        sendLogin(req, res, element)
    } else {
        res.status(200).json({ success: false })
    }
})

/**
 * @swagger
 *
 * /login/refresh:
 *   post:
 *     tags: [ autenticación ]
 *     summary: Volver a iniciar sesión con el token de refresco
 *     parameters:
 *       - name: cookie
 *         in: query
 *         required: false
 *         description: 'true para que genere y envíe la cookie'
 *         schema:
 *           type: boolean
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/RefreshToken"
 *       required: true
 *     responses:
 *       "200":
 *         headers: 
 *           Set-Cookie:
 *             schema: 
 *               type: string
 *         description: "Resultado de la autenticación"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/RespuestaLogin"
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 */
router.post('/login/refresh', async function (req, res, next) {
    if (!req.body || !req.body.token) {
        return next(generateErrorByStatus(400))
    }
    try {
        let decoded = RefreshTokenHMAC256.decode(req.body.token);
        let data = await fs.readFile(config.security.USR_FILENAME, 'utf8')
        let list = JSON.parse(data)
        let element = list.find(item => item[config.security.PROP_USERNAME] == decoded.usr && item.activo)
        if (element) {
            sendLogin(req, res, element)
        } else {
            res.status(200).json({ success: false })
        }
    } catch (err) {
        let rslt;
        switch (err.name) {
            case 'TokenExpiredError':
                res.set('WWW-Authenticate', 'Bearer realm="MicroserviciosJWT", error="invalid_token", error_description="The access token expired"')
                rslt = generateError('Invalid token', 403, 'Token expired', { expiredAt: err.expiredAt })
                break;
            case 'NotBeforeError':
                rslt = generateError('Invalid token', 403, 'Token not active', { date: err.date })
                break;
            default:
                rslt = generateError('Invalid token', 403)
                break;

        }
        res.status(403).json(rslt.payload)
    }
})
/**
 * @swagger
 *
 * /login/signature:
 *   get:
 *     tags: [ autenticación ]
 *     summary: Clave publica para validar el token JWT
 *     responses:
 *       "200":
 *         description: "OK"
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
router.get('/login/signature', function (_req, res) {
    res.contentType('text/plain').send(config.security.PUBLIC_KEY)
})

function sendLogin(req, res, element) {
    let token = module.exports.generarTokenScheme(element)
    let payload = {
        success: true,
        token: module.exports.generarTokenScheme(element),
        refresh: RefreshTokenHMAC256.generar(element),
        name: element.nombre || element[config.security.PROP_NAME],
        roles: element.roles,
        expires_in: config.security.EXPIRACION_MIN * 60
    }
    if (req.query.cookie)
        res.cookie('Authorization', token.substring(config.security.AUTHENTICATION_SCHEME.length), { maxAge: 3600000 })
    res.status(200).json(payload)

}

/**
 * @swagger
 *
 * /logout:
 *   post:
 *     tags: [ autenticación ]
 *     summary: Cerrar sesión
 *     responses:
 *       "200":
 *         description: "OK"
 */
router.all('/logout', function (_req, res) {
    res.clearCookie('Authorization');
    res.sendStatus(200)
})
/**
 * @swagger
 *
 * /register:
 *   post:
 *     tags: [ registro ]
 *     summary: Registrar un nuevo usuario
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idUsuario:
 *                 type: string
 *                 format: email
 *               nombre:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *       required: true
 *     responses:
 *       "202":
 *         description: "Accepted"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: webhook para controlar el registro del usuario
 *               properties:
 *                 statusGetUri:
 *                   description: webhook vía GET para consultar el estado del registro
 *                   type: string
 *                   format: uri
 *                 confirmGetUri:
 *                   description: webhook vía GET para confirmar el email y activar al usuario
 *                   type: string
 *                   format: uri
 *                 rejectGetUri:
 *                   description: webhook vía GET para rechazar el email y borrar al usuario
 *                   type: string
 *                   format: uri
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 */
router.post('/register', async function (req, res, next) {
    let data = await fs.readFile(config.security.USR_FILENAME, 'utf8')
    let list = JSON.parse(data)
    let element = req.body
    if (element[config.security.PROP_USERNAME] == undefined) {
        return next(generateError('Falta el nombre de usuario.', 400))
    } else if (list.find(item => item[config.security.PROP_USERNAME] == element[config.security.PROP_USERNAME])) {
        return next(generateError('El usuario ya existe.', 400))
    } else if (config.security.PASSWORD_PATTERN.test(element[config.security.PROP_PASSWORD])) {
        element[config.security.PROP_PASSWORD] = await encriptaPassword(element[config.security.PROP_PASSWORD])
        element.roles = ["Usuarios"]
        delete element.activo
        list.push(element)
        fs.writeFile(config.security.USR_FILENAME, JSON.stringify(list))
            .then(() => {
                const token = CreatedTokenHMAC256.generar(element)
                const location = `${req.protocol}://${req.hostname}:${req.connection.localPort}${req.originalUrl}`
                res.status(202).json({
                    statusGetUri: `${location}/status?instance=${token}`,
                    confirmGetUri: `${location}/confirm?instance=${token}`,
                    rejectGetUri: `${location}/reject?instance=${token}`
                })
            })
            .catch(err => { return next(generateErrorByError(err, 500)) })
    } else {
        return next(generateError('Formato incorrecto de la password.', 400))
    }
})
/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterStatus:
 *       title: Estado Registro
 *       description: Credenciales de autenticación
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         status:
 *           type: string
 *           enum:
 *             - pending
 *             - complete
 *             - canceled
 *         result:
 *           type: string
 *           enum:
 *             - confirm
 *             - reject
 *             - canceled
 *             - timeout
 * @swagger
 * /register/status:
 *   get:
 *     tags: [ registro ]
 *     summary: Estado del registro un nuevo usuario
 *     parameters:
 *       - name: instance
 *         in: query
 *         required: true
 *         description: Identificador la instancia
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         description: "Finalize"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/RegisterStatus"
 *       "202":
 *         description: "Pending"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/RegisterStatus"
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 */
router.get('/register/status', async function (req, res, next) {
    if (!req.query.instance) {
        return next(generateError('Falta la instancia.', 400))
    }
    let usr;
    try {
        usr = CreatedTokenHMAC256.decode(req.query.instance).usr
    } catch (ex) {
        res.status(200).json({ status: 'canceled', result: 'timeout' }).end()
        return
    }
    let data = await fs.readFile(config.security.USR_FILENAME, 'utf8')
    let list = JSON.parse(data)
    let element = list.find(item => item[config.security.PROP_USERNAME] == usr)
    if (!element) {
        res.status(200).json({ status: 'complete', result: 'reject' }).end()
    } else if (typeof (element.activo) === 'undefined') {
        res.status(202).json({ status: 'pending' }).end()
    } else {
        res.status(200).json({ status: 'complete', result: element.activo ? 'confirm' : 'reject' }).end()
    }
})
/**
* @swagger
* /register/confirm:
*   get:
*     tags: [ registro ]
*     summary: Confirmar el email y activar al usuario
*     parameters:
*       - name: instance
*         in: query
*         required: true
*         description: Identificador la instancia
*         schema:
*           type: string
*     responses:
*       "204":
*         $ref: "#/components/responses/NoContent"
*       "400":
*         $ref: "#/components/responses/BadRequest"
*/
router.get('/register/confirm', async function (req, res, next) {
    if (!req.query.instance) {
        return next(generateError('Falta la instancia.', 400))
    }
    let usr;
    try {
        usr = CreatedTokenHMAC256.decode(req.query.instance).usr
    } catch (ex) {
        return next(generateError('Ya no existe la instancia.', 400))
    }
    let data = await fs.readFile(config.security.USR_FILENAME, 'utf8')
    let list = JSON.parse(data)
    let index = list.findIndex(row => row[config.security.PROP_USERNAME] == usr)
    if (index == -1) {
        return next(generateErrorByStatus(404))
    }
    let element = list.find(item => item[config.security.PROP_USERNAME] == usr)
    if (!element.activo) {
        element.activo = true
        fs.writeFile(config.security.USR_FILENAME, JSON.stringify(list))
            .then(() => { res.sendStatus(204) })
            .catch(err => { return next(generateErrorByError(err, 500)) })
    }
    res.sendStatus(204)
})
/**
* @swagger
* /register/reject:
*   get:
*     tags: [ registro ]
*     summary: Rechazar el email y borrar al usuario
*     parameters:
*       - name: instance
*         in: query
*         required: true
*         description: Identificador la instancia
*         schema:
*           type: string
*     responses:
*       "204":
*         $ref: "#/components/responses/NoContent"
*       "400":
*         $ref: "#/components/responses/BadRequest"
*/
router.get('/register/reject', async function (req, res, next) {
    if (!req.query.instance) {
        return next(generateError('Falta la instancia.', 400))
    }
    let usr;
    try {
        usr = CreatedTokenHMAC256.decode(req.query.instance).usr
    } catch (ex) {
        return next(generateError('Ya no existe la instancia.', 400))
    }
    let data = await fs.readFile(config.security.USR_FILENAME, 'utf8')
    let list = JSON.parse(data)
    let index = list.findIndex(row => row[config.security.PROP_USERNAME] == usr)
    if (index == -1) {
        return next(generateErrorByStatus(404))
    }
    if (list[index].activo) {
        return next(generateError('Ya esta confirmado.', 400))
    }
    list.splice(index, 1)
    fs.writeFile(config.security.USR_FILENAME, JSON.stringify(list))
        .then(() => { res.sendStatus(204) })
        .catch(err => { return next(generateErrorByError(err, 500)) })
})

let autenticados = express.Router();
autenticados.use(module.exports.useAuthentication)
/**
 * @swagger
 *
 * /auth:
 *   get:
 *     tags: [ autenticación ]
 *     summary: Obtener estado de sesión
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       "200":
 *         description: "OK"
 *         content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                isAuthenticated:
 *                  type: boolean
 *                usr:
 *                  type: string
 *                name:
 *                  type: string
 *                roles:
 *                  type: array
 *                  items:
 *                    type: string
 */
autenticados.get('/', function (_req, res) {
    res.status(200).json({ isAuthenticated: res.locals.isAuthenticated, usr: res.locals.usr, name: res.locals.name, roles: res.locals.roles })
})
router.use('/auth', autenticados)

autenticados = express.Router();
autenticados.use(module.exports.useAuthentication)
autenticados.use(module.exports.onlyAuthenticated)
autenticados.use(module.exports.onlySelf)

/**
 * @swagger
 *
 * /register:
 *   get:
 *     tags: [ registro ]
 *     summary: Consultar su usuario
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       "200":
 *         description: "OK"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 idUsuario:
 *                   type: string
 *                   format: email
 *                 nombre:
 *                   type: string
 *                 roles:
 *                   type: array
 *                   items:
 *                     type: string
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 */
autenticados.get('/', async function (_req, res, next) {
    let usr = res.locals.usr;
    let data = await fs.readFile(config.security.USR_FILENAME, 'utf8')
    let list = JSON.parse(data)
    let element = list.find(item => item[config.security.PROP_USERNAME] == usr)
    if (element) {
        delete element[config.security.PROP_PASSWORD]
        res.status(200).json(element)
    } else {
        return next(generateErrorByStatus(401))
    }
})
/**
 * @swagger
 *
 * /register:
 *   put:
 *     tags: [ registro ]
 *     summary: Modificar el nombre de su usuario
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *             required:
 *               - nombre
 *       required: true
 *     responses:
 *       "204":
 *         $ref: "#/components/responses/NoContent"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 */
autenticados.put('/', async function (req, res, next) {
    if (!isSelf(res, req.body.idUsuario))
        return next(generateErrorByStatus(403))
    let element = req.body
    let data = await fs.readFile(config.security.USR_FILENAME, 'utf8')
    let list = JSON.parse(data)
    let index = list.findIndex(row => row[config.security.PROP_USERNAME] == res.locals.usr)
    if (index == -1) {
        return next(generateErrorByStatus(404))
    } else {
        if (element.nombre)
            list[index].nombre = element.nombre;
        fs.writeFile(config.security.USR_FILENAME, JSON.stringify(list))
            .then(() => { res.sendStatus(204) })
            .catch(err => { return next(generateErrorByError(err, 500)) })
    }
})
/**
 * @swagger
 *
 * /register/password:
 *   put:
 *     tags: [ registro ]
 *     summary: Cambiar su contraseña
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     description: Es necesario conocer la contraseña actual antes de cambiarla
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *       required: true
 *     responses:
 *       "204":
 *         $ref: "#/components/responses/NoContent"
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 */
autenticados.put('/password', async function (req, res, next) {
    let element = req.body
    let data = await fs.readFile(config.security.USR_FILENAME, 'utf8')
    let list = JSON.parse(data)
    let index = list.findIndex(row => row[config.security.PROP_USERNAME] == res.locals.usr)
    if (index == -1) {
        return next(generateErrorByStatus(404))
    } else if (config.security.PASSWORD_PATTERN.test(element.newPassword) && await bcrypt.compare(element.oldPassword, list[index][config.security.PROP_PASSWORD])) {
        list[index][config.security.PROP_PASSWORD] = await encriptaPassword(element.newPassword)
        fs.writeFile(config.security.USR_FILENAME, JSON.stringify(list))
            .then(() => { res.sendStatus(204) })
            .catch(err => { return next(generateErrorByError(err, 500)) })
    } else {
        return next(generateError('Invalid data', 400))
    }
})

router.use('/register', autenticados)
