const express = require('express');
const router = express.Router();
const { createHash, createPrivateKey, createPublicKey } = require('crypto')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const fs = require('fs/promises');
const { generateErrorByStatus, generateError, generateErrorByError } = require('./utils')
const APP_SECRET = 'Es segura al 99%'
const AUTHENTICATION_SCHEME = 'Bearer '
const PROP_USERNAME = 'idUsuario'
const PROP_PASSWORD = 'password'
const PROP_NAME = 'idUsuario'
const PASSWORD_PATTERN = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{8,}$/
const USR_FILENAME = './data/usuarios.json'
const EXPIRACION_MIN = 60;

module.exports = router

// Criptografía
async function encriptaPassword(password) {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(password, salt)
}

const TokenHMAC256 = {
    generar: (usuario) => {
        return jwt.sign({
            usr: usuario[PROP_USERNAME],
            name: usuario.nombre,
            roles: usuario.roles
        }, APP_SECRET, { issuer: 'MicroserviciosJWT', expiresIn: EXPIRACION_MIN + 'm' })
    },
    decode: (token) => {
        return jwt.verify(token, APP_SECRET);
    }
}

const TokenRS256 = {
    generar: (usuario) => {
        let privateKey = 'MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDHp+JR9/LfZAtXeJFLRANM/j3HvnoEqYeK3w294veF0cUZvya9sXoTYR4Pls/wy5IFIW8gxjD35mXUmo3cMsfm0KgxdQDQD0W8qx52bE8Gh5uww4LHSlIwzwnkHFHmgYtg1k56d9s+e8kYLRkq3DGxZ7SwKgzNhQXUVUoNLbsPr4hVZYd7BABC5KCOHhd6rBxZyK6HDLcoNyfmkospNJQHps/SYmbt+MlyTpvFXWrcj4ttVLKXwjefxkaxF4YNrZrO4aCXuOeJG8Q9IOXxdXkdsP5WJEUnWP63Jca8cyJMCS41GAowb9ratjm0eeTA130eHBMJuJyV2UtKcoB/0IoXAgMBAAECggEAGJ8Zh+Y961KZG3Zg5JlElvAbilBxF7YYYwXS2gHtaHFQDzbFfksutMkbPezpQ9a28S8IV1BZpZiiIi/VIryYblx5AXBeY0oe3X90yEHfFP0QNCJING9z51UA8UKUzwpWt+B12SCCxxfY2sRlACYbcrdJTxhAb+/hoifKdAmZsftJqSiGuMlYWbi6Q3Lk+tsHVPVCwqyf8puZEFTf76s2yY/ySTAhNL4drd64++sVlQbgieSGnOqFv6ai12XJbuYOZE0Dce9+r3PRvDVQhMDajG7AuAJd4fmwFjJR3aPwyxGVv0oZk5KmqM6hTV1mxBLuZvqBYLAZojYl45i/GnEzYQKBgQD2yXJsRJyh7l8H4wCHIeUGXrpF+IbSaz5vK6hGqs4Xw5rOiA+wcYKIMqYnG1cfX/rP3hPh5kzz96wsAyL0jzZhbCP2Miz35XYAm+LgQzhAN6VXtwUHWQDAehhmM00y3X/gu1I+3IffB9fVGh4xK1T49mDnq+pZ+HWsORu5Vr/n/wKBgQDPHADLOO+JT7yFmCMP0PQfSy0UPTNDuaDdWVtnQYwZ68a0SIk+ygZNCEbeYEhCO+Kq7/S3DcmQHYq54O7G8LP/+oxCmSXLkA5hwJFOJtC5hea+i0JHG5UvOmDvRBojaSO5xxC17PREL/QOMV0niEd1VYFBcCFt79C1P6DQDiGd6QKBgCiX4jZk4s7QAtmtQTz5Gk797e3sf2DFOzPWHovhNJ08E469WrdPNIVqr2HnYWFLzFm80dBqrWXD65IhwfIwTGWiABhTEIqGN+7JtXvmEq6deJkBBda7kSAX9UN6VMx1Gr/AkDq+06qgA6SN80FrO0LoY/A3mwjJkbGOgzztRAvJAoGBAJa85+sBVn4W9bw6HZK+X1+DZJztailpqqZQChGeCG05SJcgkBuOCIX6dzIU26KxWWlWWkL9Gu30QmrFRqSuviOZ5In4UyTUhVMqR9ecsp/E0Etwqd19Othz4edjJq8NL/5f30651pLmX/gQf59tNa01fWz2Qq50M/AnDlE/Z8I5AoGBALil+ccLACzw2W3qrU44HEpXYY91RLE9ANXUlM9OfbnHYfrI6wZylRA5TjcAcaLHwC88c/yLalVEJXnSgBpm9MNmQPE6tNGU7+IIn6cdIbX1eW6QUPWU5yLwiFlntkp/v+WwURN3sIQWegtOacAp5R78nJLpeWm1WmuFOYJ0glaF';
        let buff = Buffer.from(privateKey, 'base64');

        return jwt.sign({
            usr: usuario[PROP_USERNAME],
            name: usuario.nombre,
            roles: usuario.roles
        }, createPrivateKey({ key: buff, format: 'der', type: 'pkcs8' }), { issuer: 'MicroserviciosJWT', algorithm: 'RS256', expiresIn: EXPIRACION_MIN + 'm' })
    },
    decode: (token) => {
        let publicKey = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAx6fiUffy32QLV3iRS0QDTP49x756BKmHit8NveL3hdHFGb8mvbF6E2EeD5bP8MuSBSFvIMYw9+Zl1JqN3DLH5tCoMXUA0A9FvKsedmxPBoebsMOCx0pSMM8J5BxR5oGLYNZOenfbPnvJGC0ZKtwxsWe0sCoMzYUF1FVKDS27D6+IVWWHewQAQuSgjh4XeqwcWciuhwy3KDcn5pKLKTSUB6bP0mJm7fjJck6bxV1q3I+LbVSyl8I3n8ZGsReGDa2azuGgl7jniRvEPSDl8XV5HbD+ViRFJ1j+tyXGvHMiTAkuNRgKMG/a2rY5tHnkwNd9HhwTCbicldlLSnKAf9CKFwIDAQAB';
        let buff = Buffer.from(publicKey, 'base64');
        return jwt.verify(token, createPublicKey({ key: buff, format: 'der', type: 'spki' }), { algorithms: ['RS256'] });
    }
}

const jwtCrypto = TokenHMAC256;

module.exports.generarTokenJWT = jwtCrypto.generar

module.exports.generarTokenScheme = (usuario) => {
    return AUTHENTICATION_SCHEME + module.exports.generarTokenJWT(usuario)
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
        token = req.headers['authorization'].substring(AUTHENTICATION_SCHEME.length)
    try {
        let decoded = jwtCrypto.decode(token);
        res.locals.isAuthenticated = true;
        res.locals.usr = decoded.usr;
        res.locals.name = decoded.name;
        res.locals.roles = decoded.roles;
        res.locals.isInRole = role => res.locals.roles.includes(role)
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            res.set('WWW-Authenticate', 'Bearer realm="MicroserviciosJWT", error="invalid_token", error_description="The access token expired"')
            return next(generateError('Invalid token', 401, 'Token expired', { expiredAt: err.expiredAt }))
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
 *  schemas:
 *    Login:
 *      description: Credenciales de autenticación
 *      type: object
 *      required:
 *        - username
 *        - password
 *      properties:
 *        username:
 *          type: string
 *        password:
 *          type: string
 *          format: password
 *    RespuestaLogin:
 *      type: object
 *      title: Respuesta Login
 *      properties:
 *        success:
 *          type: boolean
 *        token:
 *          type: string
 *        name:
 *          type: string
 *        roles:
 *          type: array
 *          items:
 *            type: string
 */
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
    let payload = {
        success: false
    }
    if (!req.body || !req.body.username || !req.body.password) {
        // setTimeout(() => next(generateErrorByStatus(400)), 1000)
        return next(generateErrorByStatus(400))
    }
    let usr = req.body.username
    let pwd = req.body.password
    if (!PASSWORD_PATTERN.test(pwd)) {
        // setTimeout(() => next(generateErrorByStatus(400)), 1000)
        return next(generateErrorByStatus(400))
    }
    let data = await fs.readFile(USR_FILENAME, 'utf8')
    let list = JSON.parse(data)
    let element = list.find(item => item[PROP_USERNAME] == usr)
    if (element && await bcrypt.compare(pwd, element[PROP_PASSWORD])) {
        let token = module.exports.generarTokenScheme(element)
        payload = {
            success: true,
            token: token,
            name: element[PROP_NAME],
            roles: element.roles,
            expires_in: EXPIRACION_MIN * 60
        }
        if (req.query.cookie)
            res.cookie('Authorization', token.substring(AUTHENTICATION_SCHEME.length), { maxAge: 3600000 })
    }
    res.status(200).json(payload)
})

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
router.get('/auth', function (_req, res) {
    res.status(200).json({ isAuthenticated: res.locals.isAuthenticated, usr: res.locals.usr, name: res.locals.name, roles: res.locals.roles })
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
 *       "201":
 *         description: "Created"
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 */
router.post('/register', async function (req, res, next) {
    let data = await fs.readFile(USR_FILENAME, 'utf8')
    let list = JSON.parse(data)
    let element = req.body
    if (element[PROP_USERNAME] == undefined) {
        return next(generateError('Falta el nombre de usuario.', 400))
    } else if (list.find(item => item[PROP_USERNAME] == element[PROP_USERNAME])) {
        return next(generateError('El usuario ya existe.', 400))
    } else if (PASSWORD_PATTERN.test(element[PROP_PASSWORD])) {
        element[PROP_PASSWORD] = await encriptaPassword(element[PROP_PASSWORD])
        element.roles = ["Usuarios"]
        list.push(element)
        fs.writeFile(USR_FILENAME, JSON.stringify(list))
            .then(() => { res.sendStatus(201) })
            .catch(err => { return next(generateErrorByError(err, 500)) })
    } else {
        return next(generateError('Formato incorrecto de la password.', 400))
    }
})

const autenticados = express.Router();

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
    let data = await fs.readFile(USR_FILENAME, 'utf8')
    let list = JSON.parse(data)
    let element = list.find(item => item[PROP_USERNAME] == usr)
    if (element) {
        delete element[PROP_PASSWORD]
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
    let data = await fs.readFile(USR_FILENAME, 'utf8')
    let list = JSON.parse(data)
    let index = list.findIndex(row => row[PROP_USERNAME] == res.locals.usr)
    if (index == -1) {
        return next(generateErrorByStatus(404))
    } else {
        if (element.nombre)
            list[index].nombre = element.nombre;
        fs.writeFile(USR_FILENAME, JSON.stringify(list))
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
    let data = await fs.readFile(USR_FILENAME, 'utf8')
    let list = JSON.parse(data)
    let index = list.findIndex(row => row[PROP_USERNAME] == res.locals.usr)
    if (index == -1) {
        return next(generateErrorByStatus(404))
    } else if (PASSWORD_PATTERN.test(element.newPassword) && await bcrypt.compare(element.oldPassword, list[index][PROP_PASSWORD])) {
        list[index][PROP_PASSWORD] = await encriptaPassword(element.newPassword)
        fs.writeFile(USR_FILENAME, JSON.stringify(list))
            .then(() => { res.sendStatus(204) })
            .catch(err => { return next(generateErrorByError(err, 500)) })
    } else {
        return next(generateError('Invalid data', 400))
    }
})

router.use('/register', autenticados)
