const express = require('express');
const router = express.Router();
const cookie = require('cookie');
const cookieParser = require('cookie-parser');
const { createHash } = require('crypto')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const fs = require('fs/promises');

const APP_SECRET = 'Es segura al 99%'
const AUTHENTICATION_SCHEME = 'Bearer '
const PROP_USERNAME = 'idUsuario'
const PROP_PASSWORD = 'password'
const PROP_NAME = 'idUsuario'
const PASSWORD_PATTERN = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{8,}$/
const USR_FILENAME = './data/usuarios.json'

const seguridad = {
    router
}

// Middleware: Cross-origin resource sharing (CORS)
seguridad.useCORS = (req, res, next) => {
    let origen = req.header("Origin")
    if (!origen) origen = '*'
    res.header('Access-Control-Allow-Origin', origen)
    res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization, X-Requested-With, X-XSRF-TOKEN')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    res.header('Access-Control-Allow-Credentials', 'true')
    next()
}

// Middleware: Autenticación
seguridad.decodeAuthorization = (req, res, next) => {
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
}

// Middleware: Cross-Site Request Forgery (XSRF)
seguridad.generateXsrfToken = (req) => {
    const hash = createHash('sha256')
    let client = `${req.client.remoteFamily}-${req.client.remoteAddress}`
    hash.update(client)
    return hash.digest('base64')
}
function generateXsrfCookie(req, res) {
    res.cookie('XSRF-TOKEN', seguridad.generateXsrfToken(req), { httpOnly: false, expires: 0 })
}
function isInvalidXsrfToken(req) {
    let token = req.headers['x-xsrf-token'] || req.body['xsrftoken']
    let cookie = req.cookies['XSRF-TOKEN']
    let secret = seguridad.generateXsrfToken(req)
    return !token || cookie !== token || token !== secret
}
// Cookie-to-Header Token
seguridad.useXSRF = (req, res, next) => {
    if (!req.cookies['XSRF-TOKEN'])
        generateXsrfCookie(req, res)
    if ('POST|PUT|DELETE|PATCH'.indexOf(req.method.toUpperCase()) >= 0 && isInvalidXsrfToken(req)) {
        if (req.cookies['XSRF-TOKEN'] !== seguridad.generateXsrfToken(req))
            generateXsrfCookie(req, res)
        res.status(401).json({ message: 'Invalid XSRF-TOKEN' })
        return
    }
    res.XsrfToken = seguridad.generateXsrfToken(req)
    next()
}

// Rutas: Control de acceso
async function encriptaPassword(password) {
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)
    return hash
}

seguridad.generarTokenJWT = (usuario) => {
    return jwt.sign({
        usr: usuario[PROP_USERNAME],
        name: usuario.nombre,
        roles: usuario.roles
    }, APP_SECRET, { expiresIn: '1h' })

}
seguridad.generarTokenScheme = (usuario) => {
    return AUTHENTICATION_SCHEME + seguridad.generarTokenJWT(usuario)

}

router.options('/login', function (req, res) {
    res.status(200).end()
})

router.post('/login', async function (req, res) {
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
        setTimeout(() => res.status(400).json(payload).end(), 1000)
        return
    }
    let data = await fs.readFile(USR_FILENAME, 'utf8')
    let list = JSON.parse(data)
    let element = list.find(item => item[PROP_USERNAME] == usr)
    if (element && await bcrypt.compare(pwd, element[PROP_PASSWORD])) {
        let token = seguridad.generarTokenScheme(element)
        payload = {
            success: true,
            token: token,
            name: element[PROP_NAME],
            roles: element.roles
        }
        if (req.query.cookie && req.query.cookie.toLowerCase() === "true")
            res.cookie('Authorization', token.substring(AUTHENTICATION_SCHEME.length), { maxAge: 3600000 })
    }
    res.status(200).json(payload).end()
})
router.all('/logout', function (req, res) {
    res.clearCookie('Authorization');
    res.status(200).end()
})

router.get('/register', async function (req, res) {
    if (!res.locals.isAuthenticated) {
        res.status(401).end()
        return
    }
    let usr = res.locals.usr;
    let data = await fs.readFile(USR_FILENAME, 'utf8')
    let list = JSON.parse(data)
    let element = list.find(item => item[PROP_USERNAME] == usr)
    if (element) {
        delete element[PROP_PASSWORD]
        res.status(200).json(element).end()
    } else {
        res.status(401).end()
    }
})
router.post('/register', async function (req, res) {
    let data = await fs.readFile(USR_FILENAME, 'utf8')
    let list = JSON.parse(data)
    let element = req.body
    if (element[PROP_USERNAME] == undefined) {
        res.status(400).json({ message: 'Falta el nombre de usuario.' })
    } else if (list.find(item => item[PROP_USERNAME] == element[PROP_USERNAME])) {
        res.status(400).json({ message: 'El usuario ya existe.' })
    } else if (PASSWORD_PATTERN.test(element[PROP_PASSWORD])) {
        element[PROP_PASSWORD] = await encriptaPassword(element[PROP_PASSWORD])
        element.roles = ["Usuarios"]
        list.push(element)
        fs.writeFile(USR_FILENAME, JSON.stringify(list))
            .then(() => { res.sendStatus(201) })
            .catch(err => { res.status(500).json({ message: 'Error de escritura'}) })
    } else {
        res.status(400).json({ message: 'Formato incorrecto de la password.' })
    }
})
router.put('/register', async function (req, res) {
    if (!res.locals.isAuthenticated) {
        res.status(401).end()
        return
    }
    let element = req.body
    let data = await fs.readFile(USR_FILENAME, 'utf8')
    let list = JSON.parse(data)
    let index = list.findIndex(row => row[PROP_USERNAME] == res.locals.usr)
    if (index == -1) {
        res.status(404).end()
    } else {
        if (element.nombre)
            list[index].nombre = element.nombre;
        fs.writeFile(USR_FILENAME, JSON.stringify(list))
            .then(() => { res.sendStatus(204) })
            .catch(err => { res.status(500).json({ message: 'Error de escritura'}) })
    }
})

router.put('/register/password', async function (req, res) {
    if (!res.locals.isAuthenticated) {
        res.status(401).end()
        return
    }
    let element = req.body
    let data = await fs.readFile(USR_FILENAME, 'utf8')
    let list = JSON.parse(data)
    let index = list.findIndex(row => row[PROP_USERNAME] == res.locals.usr)
    if (index == -1) {
        res.status(404).end()
    } else if (PASSWORD_PATTERN.test(element.newPassword) && await bcrypt.compare(element.oldPassword, list[index][PROP_PASSWORD])) {
        list[index][PROP_PASSWORD] = await encriptaPassword(element.newPassword)
        fs.writeFile(USR_FILENAME, JSON.stringify(list))
            .then(() => { res.sendStatus(204) })
            .catch(err => { res.status(500).json({ message: 'Error de escritura'}) })
    } else {
        res.status(400).end()
    }
})

router.get('/auth', function (req, res) {
    res.status(200).json({ isAuthenticated: res.locals.isAuthenticated, usr: res.locals.usr, name: res.locals.name, roles: res.locals.roles })
})

module.exports = seguridad;
