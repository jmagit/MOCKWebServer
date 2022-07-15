const request = require('supertest');
const cookieParser = require('cookie-parser');
const express = require('express')
const seguridad = require('../src/seguridad')
const app = require('../src/app');
const fileClient = require('./__mocks__/fileClient.js');

jest.mock('fs/promises');

const cotilla = (req, res) => res.json({ req, res })
const usuarios = [
    {
        "idUsuario": "admin",
        "password": "$2b$10$7EHNhM3dTSyGenDgmxzub.IfYloVNJrbvdjAF5LsrNBpu57JuNV1W",
        "nombre": "Administrador",
        "roles": [
            "Usuarios",
            "Administradores"
        ]
    },
    {
        "idUsuario": "fake@kk.kk",
        "password": "$2b$10$5i7NYY8y3qmK3bmLmU8uMOHTawhPq7ddD7F6SfOf9ZKz76V8XssM6",
        "nombre": "Usuario registrado",
        "roles": [
            "Usuarios"
        ]
    },
]
const usuarioBorrado = {
    "idUsuario": "_borrado_",
    "password": "$2b$10$5i7NYY8y3qmK3bmLmU8uMOHTawhPq7ddD7F6SfOf9ZKz76V8XssM6",
    "nombre": "Usuario registrado",
    "roles": [
        "Usuarios"
    ]
}
describe("Seguridad", () => {
    describe("Pruebas Aisladas", () => {
        let mockApp

        beforeEach(() => {
            mockApp = express()
            mockApp.use(express.json())
            mockApp.use(cookieParser())
            mockApp.use(express.urlencoded({
                extended: false
              }))
            return Promise.resolve()
        });
        describe("Middleware: Autenticación", () => {
            it('Sin cabecera', async () => {
                mockApp.use(seguridad.decodeAuthorization)
                mockApp.all('/', (req, res) => { res.json(res.locals) })
                mockApp.use(function (err, req, res, _next) {
                    console.error('ERROR: %s', req.originalUrl, err)
                    res.status(500).json({ message: err }).end();
                });
                const response = await request(mockApp).get('/')
                // console.log(response.body)
                expect(response.statusCode).toBe(200)
                expect(response.body.isAuthenticated).toBeFalsy()
            })
            it('Con cabecera', async () => {
                mockApp.use(seguridad.decodeAuthorization)
                mockApp.all('/', (req, res) => { res.json({ locals: res.locals, isInRole: res.locals.isInRole('Administradores') }) })
                mockApp.use(function (err, req, res, _next) {
                    console.error('ERROR: %s', req.originalUrl, err)
                    res.status(500).json({ message: err }).end();
                });
                let index = 0

                const response = await request(mockApp).get('/')
                    .set('authorization', seguridad.generarTokenScheme(usuarios[index]))

                expect(response.statusCode).toBe(200)
                expect(response.body.locals.isAuthenticated).toBeTruthy()
                expect(response.body.locals.usr).toBe(usuarios[index].idUsuario)
                expect(response.body.locals.name).toBe(usuarios[index].nombre)
                expect(response.body.locals.roles).toEqual(usuarios[index].roles)
                expect(response.body.isInRole).toBeTruthy()
            })
            it('Con cookies', async () => {
                mockApp.use(seguridad.decodeAuthorization)
                mockApp.all('/', (req, res) => { res.json({ locals: res.locals, isInRole: res.locals.isInRole('Administradores') }) })
                mockApp.use(function (err, req, res, _next) {
                    console.error('ERROR: %s', req.originalUrl, err)
                    res.status(500).json({ message: err }).end();
                });
                let index = 1

                const response = await request(mockApp).get('/')
                    .set('Cookie', [`Authorization=${seguridad.generarTokenJWT(usuarios[index])};`])

                expect(response.statusCode).toBe(200)
                expect(response.body.locals.isAuthenticated).toBeTruthy()
                expect(response.body.locals.usr).toBe(usuarios[index].idUsuario)
                expect(response.body.locals.name).toBe(usuarios[index].nombre)
                expect(response.body.locals.roles).toEqual(usuarios[index].roles)
                expect(response.body.isInRole).toBeFalsy()
            })
            it('Con token expirado', async () => {
                mockApp.use(seguridad.decodeAuthorization)
                mockApp.all('/', (req, res) => { res.json(res.locals) })
                mockApp.use(function (err, req, res, _next) {
                    res.status(500).json({ message: err }).end();
                });

                const response = await request(mockApp).get('/')
                    .set('authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c3IiOiJhZG1pbiIsIm5hbWUiOiJBZG1pbmlzdHJhZG9yIiwicm9sZXMiOlsiVXN1YXJpb3MiLCJBZG1pbmlzdHJhZG9yZXMiXSwiaWF0IjoxNjQ5MzM5MDgwLCJleHAiOjE2NDkzNDI2ODB9.1XAvQTzCSgEjs6NVhA0rgFt5NeEb_DMMVIn4DfNOjvg')

                expect(response.statusCode).toBe(401)
                expect(response.body.message).toEqual('Token expired')
            })
            it('Con token manipulado', async () => {
                mockApp.use(seguridad.decodeAuthorization)
                mockApp.all('/', (req, res) => { res.json(res.locals) })
                mockApp.use(function (err, req, res, _next) {
                    console.error('ERROR: %s', req.originalUrl, err)
                    res.status(500).json({ message: err }).end();
                });
                let token = seguridad.generarTokenJWT(usuarios[0])
                token[30] = token[30] === 'x' ? 'X' : 'x';

                const response = await request(mockApp).get('/')
                    .set('authorization', token)

                expect(response.statusCode).toBe(401)
                expect(response.body.message).toEqual('Invalid token')
            })
        })
        describe("Middleware: Cross-origin resource sharing (CORS)", () => {
            it('Sin Origin', async () => {
                mockApp.use(seguridad.useCORS)
                mockApp.all('/', (req, res) => { res.json(res.locals) })
                mockApp.use(function (err, req, res, _next) {
                    console.error('ERROR: %s', req.originalUrl, err)
                    res.status(500).json({ message: err }).end();
                });
                const response = await request(mockApp).get('/')
                expect(response.statusCode).toBe(200)
                expect(response.headers['access-control-allow-origin']).toBe('*')
                expect(response.headers['access-control-allow-headers']).toBeTruthy()
                expect(response.headers['access-control-allow-methods']).toBeTruthy()
                expect(response.headers['access-control-allow-credentials']).toBeTruthy()
            })
            it('Con Origin', async () => {
                mockApp.use(seguridad.useCORS)
                mockApp.all('/', (req, res) => { res.json(res.locals) })
                mockApp.use(function (err, req, res, _next) {
                    console.error('ERROR: %s', req.originalUrl, err)
                    res.status(500).json({ message: err }).end();
                });
                const response = await request(mockApp).get('/')
                    .set('Origin', 'www.example.com')
                expect(response.statusCode).toBe(200)
                expect(response.headers['access-control-allow-origin']).toBe('www.example.com')
                expect(response.headers['access-control-allow-headers']).toBeTruthy()
                expect(response.headers['access-control-allow-methods']).toBeTruthy()
                expect(response.headers['access-control-allow-credentials']).toBeTruthy()
            })
        })
        describe("Middleware: Cross-Site Request Forgery (XSRF)", () => {
            it('Cookie-to-Header Token', async () => {
                mockApp.use(seguridad.useXSRF)
                mockApp.all('/', (req, res) => { res.json({ token: seguridad.generateXsrfToken(req) }) })
                mockApp.use(function (err, req, res, _next) {
                    console.error('ERROR: %s', req.originalUrl, err)
                    res.status(500).json({ message: err }).end();
                });
                let response = await request(mockApp).get('/')
                expect(response.statusCode).toBe(200)
                expect(response.headers['set-cookie']).toBeTruthy() 

                response = await request(mockApp)
                    .post('/')
                    .set('x-xsrf-token', response.body.token)
                    .set('Cookie', [`XSRF-TOKEN=${response.body.token};`])
                expect(response.statusCode).toBe(200)
            })
            it('Input[type="hidden"]', async () => {
                mockApp.use(seguridad.useXSRF)
                mockApp.all('/', (req, res) => { res.json({ token: seguridad.generateXsrfToken(req) }) })
                mockApp.use(function (err, req, res, _next) {
                    console.error('ERROR: %s', req.originalUrl, err)
                    res.status(500).json({ message: err }).end();
                });
                let response = await request(mockApp).get('/')
                expect(response.statusCode).toBe(200)

                response = await request(mockApp)
                    .post('/')
                    .set('Content-Type', 'application/x-www-form-urlencoded')
                    .set('Cookie', [`XSRF-TOKEN=${response.body.token};`])
                    .send(`xsrftoken=${encodeURIComponent(response.body.token)}&algo=mas`)
                expect(response.statusCode).toBe(200)
            })
            it('Invalid Token', async () => {
                mockApp.use(seguridad.useXSRF)
                mockApp.all('/', (req, res) => { res.json({ token: seguridad.generateXsrfToken(req) }) })
                mockApp.use(function (err, req, res, _next) {
                    console.error('ERROR: %s', req.originalUrl, err)
                    res.status(500).json({ message: err }).end();
                });
                let response = await request(mockApp)
                    .post('/')
                    .set('x-xsrf-token', 'invalid')
                    .set('Cookie', [`XSRF-TOKEN=invalid;`])
                expect(response.statusCode).toBe(401)
            })
        })
    })
    describe('Pruebas con ficheros mockeados', () => {
        const MOCK_FILE_INFO = {
            './data/usuarios.json': JSON.stringify(usuarios),
        };
        let fsMock

        beforeEach(() => {
            jest.mock('fs/promises');
            fsMock = require('fs/promises')
            fsMock.__setMockFiles({
                './data/usuarios.json': JSON.stringify(usuarios),
            });
        });
        describe("Ejemplos de Mock ficheros", () => {
            test('Mock readFile', async () => {
                const data = await fileClient.leer('./data/usuarios.json')
                // console.log(fsMock.__getMockFile('./data/usuarios.json'))
                expect(data.length).toBe(2);
            });
            test('Mock writeFile', async () => {
                await fileClient.escribir('./data/usuarios.json', JSON.stringify([usuarios[1]]))
                let data = JSON.parse(fsMock.__getMockFile('./data/usuarios.json'))
                // console.log(data)
                expect(data.length).toBe(1);
            });
        });
        describe("/login", () => {
            describe("OK", () => {
                it("OPTIONS", done => {
                    request(app)
                        .options("/login")
                        .expect(200, done)
                });
                it("POST: Login Admin", done => {
                    request(app)
                        .post("/login")
                        .set('Content-Type', 'application/json')
                        .send({ "name": "admin", "password": "P@$$w0rd" })
                        .expect('Content-Type', /json/)
                        .then(response => {
                            expect(response.statusCode).toBe(200);
                            expect(response.body.success).toBeTruthy()
                            done();
                        })
                        .catch(err => done(err))
                });
                it("Autenticación por cookies", async () => {
                    let response = await request(app)
                        .post("/login?cookie=true")
                        .set('Content-Type', 'application/json')
                        .send({ "name": "admin", "password": "P@$$w0rd" })
                    expect(response.statusCode).toBe(200)
                    expect(response.headers['set-cookie']).toBeTruthy() 
                    let cookie = response.headers['set-cookie']
    
                    response = await request(app)
                        .get('/register')
                        .set('Cookie', cookie)
                    expect(response.statusCode).toBe(200)
                });
            })
            describe("KO", () => {
                it("POST: Sin body", done => {
                    request(app)
                        .post("/login")
                        .expect(400, done)
                });
                it("POST: Usuario invalido: name", async () => {
                    await request(app)
                        .post("/login")
                        .set('Content-Type', 'application/json')
                        .send({ "name": "admina", "password": "P@$$w0rd" })
                        .expect(200)
                        .expect('Content-Type', /json/)
                        .expect(response => expect(response.body.success).toBeFalsy())
                });
                it("POST: Usuario invalido: password", () => {
                    return request(app)
                        .post("/login")
                        .set('Content-Type', 'application/json')
                        .send({ "name": "admin", "password": "P@$Sw0rd" })
                        .expect(200)
                        .expect('Content-Type', /json/)
                        .expect('{"success":false}')
                });
                it("POST: formato invalido de password", () => {
                    return request(app)
                        .post("/login")
                        .set('Content-Type', 'application/json')
                        .send({ "name": "admin", "password": "P@$Sword" })
                        .expect(400)
                        .expect('Content-Type', /json/)
                        .expect('{"success":false}')
                });
            });
        })
        describe("/logout", () => {
            describe("OK", () => {
                it("GET", done => {
                    request(app)
                        .get("/logout")
                        .expect(200, done)
                });
                it("POST", done => {
                    request(app)
                        .post("/logout")
                        .expect(200, done)
                });
            })
        })
        describe("/register", () => {
            describe("OK", () => {
                it("POST: Nuevo usuario", done => {
                    request(app)
                        .post("/register")
                        .set('Content-Type', 'application/json')
                        .send({ "idUsuario": "usr@kk.kk", "nombre": "Nuevo", "password": "P@$$w0rd", "roles": [] })
                        .expect(201)
                        .then(response => {
                            let data = JSON.parse(fsMock.__getMockFile('./data/usuarios.json'))
                            expect(data.length).toBe(3);
                            expect(data[2].idUsuario).toBe("usr@kk.kk")
                            expect(data[2].nombre).toBe("Nuevo")
                            expect(data[2].roles).toEqual(["Usuarios"])
                            done();
                        })
                        .catch(err => done(err))
                });
                it("GET: Con token", async () => {
                    let index = 0
                    const response = await request(app).get('/register')
                        .set('authorization', seguridad.generarTokenScheme(usuarios[index]))
                    expect(response.statusCode).toBe(200)
                    expect(response.body.idUsuario).toBe(usuarios[index].idUsuario)
                    expect(response.body.nombre).toBe(usuarios[index].nombre)
                    expect(response.body.roles).toEqual(usuarios[index].roles)
                });
                it("PUT: Modificar usuario", async () => {
                    let index = 0
                    const response = await request(app)
                        .put('/register')
                        .set('authorization', seguridad.generarTokenScheme(usuarios[index]))
                        .set('Content-Type', 'application/json')
                        .send({ "idUsuario": "ignorar", "nombre": "Nuevo nombre", "password": "ignorar", "roles": [] })
                    expect(response.statusCode).toBe(204)
                    let data = JSON.parse(fsMock.__getMockFile('./data/usuarios.json'))
                    expect(data.length).toBe(2);
                    expect(data[index].idUsuario).toBe(usuarios[index].idUsuario)
                    expect(data[index].nombre).toBe("Nuevo nombre")
                    expect(data[index].password).toBe(usuarios[index].password)
                    expect(data[index].roles).toEqual(usuarios[index].roles)
                });
            })
            describe("KO", () => {
                it("POST: Falta el nombre de usuario", async () => {
                    await request(app)
                        .post("/register")
                        .set('Content-Type', 'application/json')
                        .send({ "nombre": "Nuevo", "password": "P@$$w0rd" })
                        .expect(400)
                        .expect('Content-Type', /json/)
                        .expect(response => expect(response.body.message).toBe('Falta el nombre de usuario.'))
                });
                it("POST: Formato incorrecto de la password", async () => {
                    await request(app)
                        .post("/register")
                        .set('Content-Type', 'application/json')
                        .send({ "idUsuario": "usr@kk.kk", "nombre": "Nuevo", "password": "p@$$w0rd" })
                        .expect(400)
                        .expect('Content-Type', /json/)
                        .expect(response => expect(response.body.message).toBe('Formato incorrecto de la password.'))
                });
                it("POST: El usuario ya existe", async () => {
                    await request(app)
                        .post("/register")
                        .set('Content-Type', 'application/json')
                        .send({ "idUsuario": usuarios[1].idUsuario, "nombre": "Nuevo", "password": "P@$$w0rd" })
                        .expect(400)
                        .expect('Content-Type', /json/)
                        .expect(response => expect(response.body.message).toBe('El usuario ya existe.'))
                });
                it("GET: Sin token", done => {
                    request(app)
                        .get("/register")
                        .expect(401, done)
                });
                it("GET: Usuario eliminado", async () => {
                    const response = await request(app).get('/register')
                        .set('authorization', seguridad.generarTokenScheme(usuarioBorrado))
                    expect(response.statusCode).toBe(401)
                });
                it("PUT: Sin token", done => {
                    request(app)
                        .put("/register")
                        .set('Content-Type', 'application/json')
                        .send({ "idUsuario": usuarios[0].idUsuario, "nombre": "Nuevo nombre", "password": "ignorar", "roles": [] })
                        .expect(401, done)
                });
                it("PUT: Usuario eliminado", done => {
                    request(app)
                        .put("/register")
                        .set('authorization', seguridad.generarTokenScheme(usuarioBorrado))
                        .set('Content-Type', 'application/json')
                        .send({ "idUsuario": usuarios[0].idUsuario, "nombre": "Nuevo nombre", "password": "ignorar", "roles": [] })
                        .expect(404, done)
                });
                it("PUT: Falta el nombre de usuario", done => {
                    request(app)
                        .put("/register")
                        .set('authorization', seguridad.generarTokenScheme(usuarios[0]))
                        .set('Content-Type', 'application/json')
                        .send({ "nombre": "", "password": "ignorar", "roles": [] })
                        .expect(204, done)
                });
            });
        })
        describe("/register/password", () => {
            describe("OK", () => {
                it("PUT: Cambiar contraseña", async () => {
                    let index = 0
                    const response = await request(app)
                        .put('/register/password')
                        .set('authorization', seguridad.generarTokenScheme(usuarios[index]))
                        .set('Content-Type', 'application/json')
                        .send({ "oldPassword": "P@$$w0rd", "newPassword": "Pa$$w0rd" })
                    expect(response.statusCode).toBe(204)
                    let data = JSON.parse(fsMock.__getMockFile('./data/usuarios.json'))
                    expect(data.length).toBe(2);
                    expect(data[index].idUsuario).toBe(usuarios[index].idUsuario)
                    expect(data[index].nombre).toBe(usuarios[index].nombre)
                    expect(data[index].password).not.toBe(usuarios[index].password)
                    expect(data[index].roles).toEqual(usuarios[index].roles)
                });
            })
            describe("KO", () => {
                it("PUT: Cambiar contraseña sin token", done => {
                    request(app)
                        .put("/register/password")
                        .set('Content-Type', 'application/json')
                        .send({ "oldPassword": "P@$$w0rd", "newPassword": "Pa$$w0rd" })
                        .expect(401, done)
                });
                it("PUT: Cambiar contraseña usuario eliminado", done => {
                    request(app)
                        .put("/register/password")
                        .set('authorization', seguridad.generarTokenScheme(usuarioBorrado))
                        .set('Content-Type', 'application/json')
                        .send({ "oldPassword": "P@$$w0rd", "newPassword": "Pa$$w0rd" })
                        .expect(404, done)
                });
                it("PUT: Contraseña anterior invalida", done => {
                    request(app)
                        .put("/register/password")
                        .set('authorization', seguridad.generarTokenScheme(usuarios[0]))
                        .set('Content-Type', 'application/json')
                        .send({ "oldPassword": "Pa$$w0rd", "newPassword": "P@$$w0rd" })
                        .expect(400, done)
                });
                it("PUT: Contraseña nueva invalida", done => {
                    request(app)
                        .put("/register/password")
                        .set('authorization', seguridad.generarTokenScheme(usuarios[0]))
                        .set('Content-Type', 'application/json')
                        .send({ "oldPassword": "P@$$w0rd", "newPassword": "P@$$W0RD" })
                        .expect(400, done)
                });
            });
        })
        describe("/auth", () => {
            describe("OK", () => {
                it("GET: Con token", done => {
                    let index = 0
                    request(app)
                        .get("/auth")
                        .set('authorization', seguridad.generarTokenScheme(usuarios[index]))
                        .expect(200)
                        .then(response => {
                            expect(response.body.isAuthenticated).toBeTruthy()
                            expect(response.body.name).toBe(usuarios[index].nombre)
                            expect(response.body.roles).toEqual(usuarios[index].roles)
                            done();
                        })
                });
            })
        })
    });
});
