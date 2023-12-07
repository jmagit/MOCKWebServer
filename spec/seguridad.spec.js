/* eslint-disable jest/no-hooks */
/* eslint-disable jest/prefer-lowercase-title */
/* eslint-disable node/no-unpublished-require */
const request = require('supertest');
const cookieParser = require('cookie-parser');
const express = require('express')
const seguridad = require('../src/seguridad')
const app = require('../src/app');
const config = require('../config')

jest.mock('fs/promises');

const sendOK = (_req, res) => res.sendStatus(200)

const usuarios = [
    {
        "idUsuario": "admin@kk.kk",
        "password": "$2b$10$7EHNhM3dTSyGenDgmxzub.IfYloVNJrbvdjAF5LsrNBpu57JuNV1W",
        "nombre": "Administrador",
        "roles": ["Usuarios", "Administradores"],
        "activo": true
    },
    {
        "idUsuario": "fake@kk.kk",
        "password": "$2b$10$5i7NYY8y3qmK3bmLmU8uMOHTawhPq7ddD7F6SfOf9ZKz76V8XssM6",
        "nombre": "Usuario registrado",
        "roles": ["Usuarios", "Empleados"],
        "activo": false
    },
    {
        "idUsuario": "pending@kk.kk",
        "password": "$2b$10$5i7NYY8y3qmK3bmLmU8uMOHTawhPq7ddD7F6SfOf9ZKz76V8XssM6",
        "nombre": "Usuario registrado",
        "roles": ["Usuarios", "Empleados"]
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
const contraseña = 'P@$$w0rd'

// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, _req, res, _next) => {
    // console.error('ERROR: %s', req.originalUrl, err)
    if (err.payload) {
        res.status(err.payload.status).json(err.payload);
    } else
        res.status(500).json({ status: 500, title: err.message });
}

describe('Seguridad', () => {
    describe('Pruebas Aisladas', () => {
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
        describe('Middleware: Autenticación', () => {
            it('Sin cabecera', async () => {
                mockApp.use(seguridad.useAuthentication)
                mockApp.all('/', sendOK)
                mockApp.use(errorMiddleware);
                const response = await request(mockApp).get('/')
                // console.log(response.body)
                expect(response.statusCode).toBe(200)
                expect(response.body.isAuthenticated).toBeFalsy()
            })
            it('Con cabecera', async () => {
                mockApp.use(seguridad.useAuthentication)
                mockApp.all('/', (req, res) => { res.json({ locals: res.locals, isInRole: res.locals.isInRole('Administradores') }) })
                mockApp.use(errorMiddleware);
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
                mockApp.use(seguridad.useAuthentication)
                mockApp.all('/', (req, res) => { res.json({ locals: res.locals, isInRole: res.locals.isInRole('Administradores') }) })
                mockApp.use(errorMiddleware);
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
                mockApp.use(seguridad.useAuthentication)
                mockApp.all('/', (req, res) => { res.json(res.locals) })
                mockApp.use(errorMiddleware);

                const response = await request(mockApp).get('/')
                    .set('authorization', `${config.security.AUTHENTICATION_SCHEME}eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c3IiOiJhZG1AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW5pc3RyYWRvciIsInJvbGVzIjpbIlVzdWFyaW9zIiwiQWRtaW5pc3RyYWRvcmVzIl0sImlhdCI6MTY3MDM0MjE3MiwiZXhwIjoxNjcwMzQyNDcyLCJhdWQiOiJhdXRob3JpemF0aW9uIiwiaXNzIjoiTWljcm9zZXJ2aWNpb3NKV1QifQ.dlt-d1K6wGoe-VBsPtE6SYx25wPgR0k7RwVdkdzMRKoZxYjVjUCAl9P1o4yd4pemG2B2jVu5cq4birz5EqBRy4cgVeNxD86E9f89QwOimNDr3dKGxbVbiS40RyJ1cm9qJ5_aEiBA-LZunByWp5OOtPf1Eq6Hs-AJoDWxidS0kgdjSZmeojzzzcZiE_sb8AoFhKiWC_UXpJr880YQ1jceqQ-qQmD_WCf6JICDqN-cv9Z4uMtdBCFWuMtc_6RCEd38iURtiDYS1a_oSKEZyQTf7cc3etA-4MuckdIItCRqDLiuUyJcuaJV1ODw0dI40MDU2a6Ju0LVB8QPQyNTNLKQvQ`)

                expect(response.statusCode).toBe(403)
                expect(response.body.detail).toContain('token expired')
            })
            it('Con token manipulado', async () => {
                mockApp.use(seguridad.useAuthentication)
                mockApp.all('/', (req, res) => { res.json(res.locals) })
                mockApp.use(errorMiddleware);
                let token = seguridad.generarTokenJWT(usuarios[0])
                token[30] = token[30] === 'x' ? 'X' : 'x';

                const response = await request(mockApp).get('/')
                    .set('authorization', token)

                expect(response.statusCode).toBe(401)
                expect(response.body.title).toEqual('Unauthorized')
            })
        })
        describe('Middleware: Autorización', () => {
            it('onlyAuthenticated: sin autenticar', async () => {
                mockApp.use(seguridad.useAuthentication)
                mockApp.use(seguridad.onlyAuthenticated)
                mockApp.all('/', sendOK)
                mockApp.use(errorMiddleware);
                const response = await request(mockApp).get('/')
                expect(response.statusCode).toBe(401)
            })
            it('onlyAuthenticated: autenticados', async () => {
                mockApp.use(seguridad.useAuthentication)
                mockApp.use(seguridad.onlyAuthenticated)
                mockApp.all('/', sendOK)
                mockApp.use(errorMiddleware);
                const response = await request(mockApp).get('/')
                    .set('authorization', seguridad.generarTokenScheme(usuarios[0]))
                expect(response.statusCode).toBe(200)
            })
            it('onlyAuthenticated: OPTIONS', async () => {
                mockApp.use(seguridad.useAuthentication)
                mockApp.use(seguridad.onlyAuthenticated)
                mockApp.all('/', sendOK)
                mockApp.use(errorMiddleware);
                const response = await request(mockApp).options('/')
                    .set('authorization', seguridad.generarTokenScheme(usuarios[0]))
                expect(response.statusCode).toBe(200)
            })
            it('onlyInRole: sin autenticar', async () => {
                mockApp.use(seguridad.onlyInRole('Empleados,Administradores'))
                mockApp.all('/', sendOK)
                mockApp.use(errorMiddleware);
                const response = await request(mockApp).get('/')
                expect(response.statusCode).toBe(401)
            })
            it('onlyInRole("Empleados,Administradores"): pertenece', async () => {
                mockApp.use(seguridad.useAuthentication)
                mockApp.use(seguridad.onlyInRole('Empleados,Administradores'))
                mockApp.all('/', sendOK)
                mockApp.use(errorMiddleware);
                const response = await request(mockApp).get('/')
                    .set('authorization', seguridad.generarTokenScheme(usuarios[0]))
                expect(response.statusCode).toBe(200)
            })
            it('onlyInRole: no pertenece', async () => {
                mockApp.use(seguridad.useAuthentication)
                mockApp.use(seguridad.onlyInRole('Inventado'))
                mockApp.all('/', sendOK)
                mockApp.use(errorMiddleware);
                const response = await request(mockApp).get('/')
                    .set('authorization', seguridad.generarTokenScheme(usuarios[0]))
                expect(response.statusCode).toBe(403)
            })
            it('onlyInRole: OPTIONS', async () => {
                mockApp.use(seguridad.useAuthentication)
                mockApp.use(seguridad.onlyInRole('Inventado'))
                mockApp.all('/', sendOK)
                mockApp.use(errorMiddleware);
                const response = await request(mockApp).options('/')
                    .set('authorization', seguridad.generarTokenScheme(usuarios[0]))
                expect(response.statusCode).toBe(200)
            })
            it('onlySelf: OK', async () => {
                mockApp.use(seguridad.useAuthentication)
                mockApp.use(seguridad.onlySelf)
                mockApp.all('/', (req, res) => {
                    res.sendStatus(seguridad.isSelf(res, usuarios[0].idUsuario) ? 200 : 403)
                })
                mockApp.use(errorMiddleware);
                const response = await request(mockApp).put('/')
                    .set('authorization', seguridad.generarTokenScheme(usuarios[0]))
                expect(response.statusCode).toBe(200)
            })
            it('onlySelf: KO', async () => {
                mockApp.use(seguridad.useAuthentication)
                mockApp.use(seguridad.onlySelf)
                mockApp.all('/', (req, res) => {
                    res.sendStatus(seguridad.isSelf(res, usuarios[0].idUsuario) ? 200 : 403)
                })
                mockApp.use(errorMiddleware);
                const response = await request(mockApp).put('/')
                    .set('authorization', seguridad.generarTokenScheme(usuarios[1]))
                expect(response.statusCode).toBe(403)
            })
            it('readOnly: OK', async () => {
                mockApp.use(seguridad.useAuthentication)
                mockApp.use(seguridad.readOnly)
                mockApp.all('/', sendOK)
                mockApp.use(errorMiddleware);
                let response = await request(mockApp).get('/')
                    .set('authorization', seguridad.generarTokenScheme(usuarios[0]))
                expect(response.statusCode).toBe(200)
                response = await request(mockApp).options('/')
                    .set('authorization', seguridad.generarTokenScheme(usuarios[0]))
                expect(response.statusCode).toBe(200)
                response = await request(mockApp).post('/')
                    .set('authorization', seguridad.generarTokenScheme(usuarios[0]))
                expect(response.statusCode).toBe(200)
                response = await request(mockApp).put('/')
                    .set('authorization', seguridad.generarTokenScheme(usuarios[0]))
                expect(response.statusCode).toBe(200)
                response = await request(mockApp).patch('/')
                    .set('authorization', seguridad.generarTokenScheme(usuarios[0]))
                expect(response.statusCode).toBe(200)
                response = await request(mockApp).delete('/')
                    .set('authorization', seguridad.generarTokenScheme(usuarios[0]))
                expect(response.statusCode).toBe(200)
            })
            it('readOnly: KO', async () => {
                mockApp.use(seguridad.useAuthentication)
                mockApp.use(seguridad.readOnly)
                mockApp.all('/', sendOK)
                mockApp.use(errorMiddleware);
                let response = await request(mockApp).get('/')
                expect(response.statusCode).toBe(200)
                response = await request(mockApp).options('/')
                expect(response.statusCode).toBe(200)
                response = await request(mockApp).post('/')
                expect(response.statusCode).toBe(401)
                response = await request(mockApp).put('/')
                expect(response.statusCode).toBe(401)
                response = await request(mockApp).patch('/')
                expect(response.statusCode).toBe(401)
                response = await request(mockApp).delete('/')
                expect(response.statusCode).toBe(401)
            })
        })
        describe('Middleware: Cross-origin resource sharing (CORS)', () => {
            it('Sin Origin', async () => {
                mockApp.use(seguridad.useCORS)
                mockApp.all('/', sendOK)
                mockApp.use(errorMiddleware);
                const response = await request(mockApp).get('/')
                expect(response.statusCode).toBe(200)
                expect(response.headers['access-control-allow-origin']).toBeUndefined()
                expect(response.headers['access-control-allow-headers']).toBeUndefined()
                expect(response.headers['access-control-allow-methods']).toBeUndefined()
                expect(response.headers['access-control-allow-credentials']).toBeUndefined()
            })
            it('Con Origin', async () => {
                mockApp.use(seguridad.useCORS)
                mockApp.all('/', sendOK)
                mockApp.use(errorMiddleware);
                const response = await request(mockApp).get('/')
                    .set('Origin', 'www.example.com')
                expect(response.statusCode).toBe(200)
                expect(response.headers['access-control-allow-origin']).toBe('www.example.com')
                expect(response.headers['access-control-allow-headers']).toBeTruthy()
                expect(response.headers['access-control-allow-methods']).toBeTruthy()
                expect(response.headers['access-control-allow-credentials']).toBeTruthy()
            })
        })
        describe('Middleware: Cross-Site Request Forgery (XSRF)', () => {
            it('Cookie-to-Header Token', async () => {
                mockApp.use(seguridad.useXSRF)
                mockApp.all('/', (req, res) => { res.json({ token: seguridad.generateXsrfToken(req) }) })
                mockApp.use(errorMiddleware);
                let response = await request(mockApp).get('/')
                expect(response.statusCode).toBe(200)
                expect(response.headers['set-cookie']).toBeTruthy()

                response = await request(mockApp)
                    .post('/')
                    .set('x-xsrf-token', response.body.token)
                    .set('Cookie', [`XSRF-TOKEN=${response.body.token};`])
                expect(response.statusCode).toBe(200)
            })
            it('input[type="hidden"]', async () => {
                mockApp.use(seguridad.useXSRF)
                mockApp.all('/', (req, res) => { res.json({ token: seguridad.generateXsrfToken(req) }) })
                mockApp.use(errorMiddleware);
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
                mockApp.use(errorMiddleware);
                let response = await request(mockApp)
                    .post('/')
                    .set('x-xsrf-token', 'invalid')
                    .set('Cookie', [`XSRF-TOKEN=invalid;`])
                expect(response.statusCode).toBe(401)
            })
        })
    })
    describe('Pruebas sin log', () => {
        beforeEach(() => {
            jest.mock('morgan');
            require('morgan')
        });
        it('OPTIONS', done => {
            request(app)
                .options(`${config.paths.API_AUTH}/login`)
                .expect(200, done)
        });
    })

    describe('Pruebas con ficheros simulados', () => {
        let fsMock

        beforeEach(() => {
            jest.mock('fs/promises');
            fsMock = require('fs/promises')
            fsMock.__setMockFiles({
                './data/usuarios.json': JSON.stringify(usuarios),
            });
        });
        describe(`${config.paths.API_AUTH}/login`, () => {
            describe('OK', () => {
                it('POST: Login Admin', done => {
                    request(app)
                        .post(`${config.paths.API_AUTH}/login`)
                        .set('Content-Type', 'application/json')
                        .send({ "username": "admin@kk.kk", "password": contraseña })
                        .expect('Content-Type', /json/)
                        .then(response => {
                            expect(response.statusCode).toBe(200);
                            expect(response.body.success).toBeTruthy()
                            done();
                        })
                        .catch(err => done(err))
                });
                it('Autenticación por cookies', async () => {
                    let response = await request(app)
                        .post(`${config.paths.API_AUTH}/login?cookie=true`)
                        .set('Content-Type', 'application/json')
                        .send({ "username": "admin@kk.kk", "password": contraseña })
                    expect(response.statusCode).toBe(200)
                    expect(response.headers['set-cookie']).toBeTruthy()
                    let cookie = response.headers['set-cookie']

                    response = await request(app)
                        .get(`${config.paths.API_AUTH}/register`)
                        .set('Cookie', cookie)
                    expect(response.statusCode).toBe(200)
                });
            })
            describe('KO', () => {
                it('POST: Sin body', done => {
                    request(app)
                        .post(`${config.paths.API_AUTH}/login`)
                        .expect(400, done)
                });
                it('POST: Usuario invalido: username', async () => {
                    await request(app)
                        .post(`${config.paths.API_AUTH}/login`)
                        .set('Content-Type', 'application/json')
                        .send({ "username": "admina", "password": contraseña })
                        .expect(200)
                        .expect('Content-Type', /json/)
                        .expect(response => expect(response.body.success).toBeFalsy())
                });
                it('POST: Usuario invalido: password', () => {
                    return request(app)
                        .post(`${config.paths.API_AUTH}/login`)
                        .set('Content-Type', 'application/json')
                        .send({ "username": "admin@kk.kk", "password": "P@$Sw0rd" })
                        .expect(200)
                        .expect('Content-Type', /json/)
                        .expect('{"success":false}')
                });
                it('POST: formato invalido de password', () => {
                    return request(app)
                        .post(`${config.paths.API_AUTH}/login`)
                        .set('Content-Type', 'application/json')
                        .send({ "username": "admin", "password": "P@$Sword" })
                        .expect(400)
                });
                it('POST: Usuario no activo', async () => {
                    await request(app)
                        .post(`${config.paths.API_AUTH}/login`)
                        .set('Content-Type', 'application/json')
                        .send({ "username": "fake@kk.kk", "password": contraseña })
                        .expect(200)
                        .expect('Content-Type', /json/)
                        .expect(response => expect(response.body.success).toBeFalsy())
                });
                it('POST: Usuario sin confirmar', async () => {
                    await request(app)
                        .post(`${config.paths.API_AUTH}/login`)
                        .set('Content-Type', 'application/json')
                        .send({ "username": "pending@kk.kk", "password": contraseña })
                        .expect(200)
                        .expect('Content-Type', /json/)
                        .expect(response => expect(response.body.success).toBeFalsy())
                });
            });
        })
        describe(`${config.paths.API_AUTH}/login/signature`, () => {
            it('GET', done => {
                request(app)
                    .get(`${config.paths.API_AUTH}/login/signature`)
                    .expect(200, done)
                    .expect('Content-Type', 'text/plain; charset=utf-8')
                    .expect(config.security.PUBLIC_KEY)
            });
        })
        describe(`${config.paths.API_AUTH}/logout`, () => {
            describe('OK', () => {
                it('GET', done => {
                    request(app)
                        .get(`${config.paths.API_AUTH}/logout`)
                        .expect(200, done)
                });
                it('POST', done => {
                    request(app)
                        .post(`${config.paths.API_AUTH}/logout`)
                        .expect(200, done)
                });
            })
        })
        describe(`${config.paths.API_AUTH}/login/refresh`, () => {
            describe('KO', () => {
                it('POST: sin token', async () => {
                    await request(app)
                        .post(`${config.paths.API_AUTH}/login/refresh`)
                        .set('Content-Type', 'application/json')
                        .expect(400)
                });
                it('POST: Token expirado', async () => {
                    await request(app)
                        .post(`${config.paths.API_AUTH}/login/refresh`)
                        .set('Content-Type', 'application/json')
                        .send({ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c3IiOiJhZG1AZXhhbXBsZS5jb20iLCJpYXQiOjE2NzAzNDIxNzIsIm5iZiI6MTY3MDM0MjQ3MiwiZXhwIjoxNjcwMzQzMzcyLCJhdWQiOiJhdXRob3JpemF0aW9uIiwiaXNzIjoiTWljcm9zZXJ2aWNpb3NKV1QifQ.8q1Nwd9E6ZgpMyOPGUTFrv7EGRwvk_6J-J6Uzvk4o_A" })
                        .expect(403)
                        .expect('Content-Type', /json/)
                        .expect(response => expect(response.body.detail).toContain("token expired"))
                });
            });
        })
        describe(`${config.paths.API_AUTH}/register`, () => {
            describe('OK', () => {
                it('POST: Nuevo usuario', done => {
                    request(app)
                        .post(`${config.paths.API_AUTH}/register`)
                        .set('Content-Type', 'application/json')
                        .send({ "idUsuario": "usr@kk.kk", "nombre": "Nuevo", "password": contraseña, "roles": [], "activo": true })
                        .expect(202)
                        .expect('Content-Type', /json/)
                        .expect(response => {
                            expect(response.body.statusGetUri).toBeDefined()
                            expect(response.body.confirmGetUri).toBeDefined()
                            expect(response.body.rejectGetUri).toBeDefined()
                        })
                        .then(() => {
                            let data = JSON.parse(fsMock.__getMockFile('./data/usuarios.json'))
                            expect(data.length).toBe(4);
                            const last = data[data.length - 1]
                            expect(last.idUsuario).toBe('usr@kk.kk')
                            expect(last.nombre).toBe('Nuevo')
                            expect(last.roles).toEqual(['Usuarios'])
                            expect(last.activo).toBeUndefined()
                            done();
                        })
                        .catch(err => done(err))
                });
                describe(`${config.paths.API_AUTH}/register/status`, () => {
                    it('status: pending', async () => {
                        await request(app)
                            .get(`${config.paths.API_AUTH}/register/status?instance=${seguridad.CreatedTokenHMAC256.generar({ idUsuario: 'pending@kk.kk' })}`)
                            .expect(202)
                            .expect('Content-Type', /json/)
                            .expect(response => {
                                expect(response.body.status).toBe('pending')
                            })
                    });
                    it('status: canceled, result: timeout', async () => {
                        await request(app)
                            .get(`${config.paths.API_AUTH}/register/status?instance=XXX`)
                            .expect(200)
                            .expect('Content-Type', /json/)
                            .expect(response => {
                                expect(response.body.status).toBe('canceled')
                                expect(response.body.result).toBe('timeout')
                            })
                    });
                    it('status: complete, result: confirm', async () => {
                        await request(app)
                            .get(`${config.paths.API_AUTH}/register/status?instance=${seguridad.CreatedTokenHMAC256.generar({ idUsuario: 'admin@kk.kk' })}`)
                            .expect(200)
                            .expect('Content-Type', /json/)
                            .expect(response => {
                                expect(response.body.status).toBe('complete')
                                expect(response.body.result).toBe('confirm')
                            })
                    });
                    it('status: complete, result: reject by activo=false', async () => {
                        await request(app)
                            .get(`${config.paths.API_AUTH}/register/status?instance=${seguridad.CreatedTokenHMAC256.generar({ idUsuario: 'fake@kk.kk' })}`)
                            .expect(200)
                            .expect('Content-Type', /json/)
                            .expect(response => {
                                expect(response.body.status).toBe('complete')
                                expect(response.body.result).toBe('reject')
                            })
                    });
                    it('status: complete, result: reject by delete', async () => {
                        await request(app)
                            .get(`${config.paths.API_AUTH}/register/status?instance=${seguridad.CreatedTokenHMAC256.generar({ idUsuario: 'delete@kk.kk' })}`)
                            .expect(200)
                            .expect('Content-Type', /json/)
                            .expect(response => {
                                expect(response.body.status).toBe('complete')
                                expect(response.body.result).toBe('reject')
                            })
                    });
                });
                describe(`${config.paths.API_AUTH}/register/confirm`, () => {
                    it('status: pending', async () => {
                        const idUsuario = 'pending@kk.kk'
                        await request(app)
                            .get(`${config.paths.API_AUTH}/register/confirm?instance=${seguridad.CreatedTokenHMAC256.generar({ idUsuario })}`)
                            .expect(204)
                            .then(() => {
                                let data = JSON.parse(fsMock.__getMockFile('./data/usuarios.json'))
                                const last = data[data.length - 1]
                                expect(last.idUsuario).toBe(idUsuario)
                                expect(last.activo).toBeTruthy()
                            })
                    });
                    it('status: complete by activo=true', async () => {
                        const idUsuario = 'admin@kk.kk'
                        await request(app)
                            .get(`${config.paths.API_AUTH}/register/confirm?instance=${seguridad.CreatedTokenHMAC256.generar({ idUsuario })}`)
                            .expect(204)
                            .then(() => {
                                let data = JSON.parse(fsMock.__getMockFile('./data/usuarios.json'))
                                expect(data[0].idUsuario).toBe(idUsuario)
                                expect(data[0].activo).toBeTruthy()
                            })
                    });
                    it('status: complete by activo=false', async () => {
                        const idUsuario = 'fake@kk.kk'
                        await request(app)
                            .get(`${config.paths.API_AUTH}/register/confirm?instance=${seguridad.CreatedTokenHMAC256.generar({ idUsuario })}`)
                            .expect(204)
                            .then(() => {
                                let data = JSON.parse(fsMock.__getMockFile('./data/usuarios.json'))
                                expect(data[1].idUsuario).toBe(idUsuario)
                                expect(data[1].activo).toBeTruthy()
                            })
                    });
                    it('BAD instance', async () => {
                        await request(app)
                            .get(`${config.paths.API_AUTH}/register/confirm?instance=XXX`)
                            .expect(400)
                            .expect('Content-Type', /json/)
                    });
                    it('404', async () => {
                        await request(app)
                            .get(`${config.paths.API_AUTH}/register/confirm?instance=${seguridad.CreatedTokenHMAC256.generar({ idUsuario: 'kk@kk.kk' })}`)
                            .expect(404)
                            .expect('Content-Type', /json/)
                    });
                });
                describe(`${config.paths.API_AUTH}/register/reject`, () => {
                    it('status: pending', async () => {
                        const idUsuario = 'pending@kk.kk'
                        await request(app)
                            .get(`${config.paths.API_AUTH}/register/reject?instance=${seguridad.CreatedTokenHMAC256.generar({ idUsuario })}`)
                            .expect(204)
                            .then(() => {
                                let data = JSON.parse(fsMock.__getMockFile('./data/usuarios.json'))
                                expect(data.length).toBe(2);
                            })
                    });
                    it('status: complete by activo=true', async () => {
                        const idUsuario = 'admin@kk.kk'
                        await request(app)
                            .get(`${config.paths.API_AUTH}/register/reject?instance=${seguridad.CreatedTokenHMAC256.generar({ idUsuario })}`)
                            .expect(400)
                    });
                    it('status: complete by activo=false', async () => {
                        const idUsuario = 'fake@kk.kk'
                        await request(app)
                            .get(`${config.paths.API_AUTH}/register/reject?instance=${seguridad.CreatedTokenHMAC256.generar({ idUsuario })}`)
                            .expect(204)
                            .then(() => {
                                let data = JSON.parse(fsMock.__getMockFile('./data/usuarios.json'))
                                expect(data.length).toBe(2);
                            })
                    });
                    it('BAD instance', async () => {
                        await request(app)
                            .get(`${config.paths.API_AUTH}/register/reject?instance=XXX`)
                            .expect(400)
                            .expect('Content-Type', /json/)
                    });
                    it('404', async () => {
                        await request(app)
                            .get(`${config.paths.API_AUTH}/register/reject?instance=${seguridad.CreatedTokenHMAC256.generar({ idUsuario: 'kk@kk.kk' })}`)
                            .expect(404)
                            .expect('Content-Type', /json/)
                    });
                });
                it('GET: Con token', async () => {
                    let index = 0
                    const response = await request(app).get(`${config.paths.API_AUTH}/register`)
                        .set('authorization', seguridad.generarTokenScheme(usuarios[index]))
                    expect(response.statusCode).toBe(200)
                    expect(response.body.idUsuario).toBe(usuarios[index].idUsuario)
                    expect(response.body.nombre).toBe(usuarios[index].nombre)
                    expect(response.body.roles).toEqual(usuarios[index].roles)
                });
                it('PUT: Modificar usuario', async () => {
                    let index = 0
                    const response = await request(app)
                        .put(`${config.paths.API_AUTH}/register`)
                        .set('authorization', seguridad.generarTokenScheme(usuarios[index]))
                        .set('Content-Type', 'application/json')
                        .send({ "nombre": "Nuevo nombre", "password": "ignorar", "roles": [] })
                    expect(response.statusCode).toBe(204)
                    let data = JSON.parse(fsMock.__getMockFile('./data/usuarios.json'))
                    expect(data.length).toBe(3);
                    expect(data[index].idUsuario).toBe(usuarios[index].idUsuario)
                    expect(data[index].nombre).toBe('Nuevo nombre')
                    expect(data[index].password).toBe(usuarios[index].password)
                    expect(data[index].roles).toEqual(usuarios[index].roles)
                });
            })
            describe('KO', () => {
                it('POST: Falta el nombre de usuario', async () => {
                    await request(app)
                        .post(`${config.paths.API_AUTH}/register`)
                        .set('Content-Type', 'application/json')
                        .send({ "nombre": "Nuevo", "password": contraseña })
                        .expect(400)
                        .expect('Content-Type', /json/)
                        .expect(response => expect(response.body.detail).toBe('Falta el nombre de usuario.'))
                });
                it('POST: Formato incorrecto de la password', async () => {
                    await request(app)
                        .post(`${config.paths.API_AUTH}/register`)
                        .set('Content-Type', 'application/json')
                        .send({ "idUsuario": "usr@kk.kk", "nombre": "Nuevo", "password": "contraseña" })
                        .expect(400)
                        .expect('Content-Type', /json/)
                        .expect(response => expect(response.body.detail).toBe('Formato incorrecto de la password.'))
                });
                it('POST: El usuario ya existe', async () => {
                    await request(app)
                        .post(`${config.paths.API_AUTH}/register`)
                        .set('Content-Type', 'application/json')
                        .send({ "idUsuario": usuarios[1].idUsuario, "nombre": "Nuevo", "password": contraseña })
                        .expect(400)
                        .expect('Content-Type', /json/)
                        .expect(response => expect(response.body.detail).toBe('El usuario ya existe.'))
                });
                it('GET: Sin token', done => {
                    request(app)
                        .get(`${config.paths.API_AUTH}/register`)
                        .expect(401, done)
                });
                it('GET: Usuario eliminado', async () => {
                    const response = await request(app).get(`${config.paths.API_AUTH}/register`)
                        .set('authorization', seguridad.generarTokenScheme(usuarioBorrado))
                    expect(response.statusCode).toBe(401)
                });
                it('PUT: Sin token', done => {
                    request(app)
                        .put(`${config.paths.API_AUTH}/register`)
                        .set('Content-Type', 'application/json')
                        .send({ "idUsuario": usuarios[0].idUsuario, "nombre": "Nuevo nombre", "password": "ignorar", "roles": [] })
                        .expect(401, done)
                });
                it('PUT: Otro usuario', done => {
                    request(app)
                        .put(`${config.paths.API_AUTH}/register`)
                        .set('authorization', seguridad.generarTokenScheme(usuarios[0]))
                        .set('Content-Type', 'application/json')
                        .send(usuarios[1])
                        .expect(403, done)
                });
                it('PUT: Usuario eliminado', done => {
                    request(app)
                        .put(`${config.paths.API_AUTH}/register`)
                        .set('authorization', seguridad.generarTokenScheme(usuarioBorrado))
                        .set('Content-Type', 'application/json')
                        .send(usuarioBorrado)
                        .expect(404, done)
                });
                it('PUT: Falta el nombre de usuario', done => {
                    request(app)
                        .put(`${config.paths.API_AUTH}/register`)
                        .set('authorization', seguridad.generarTokenScheme(usuarios[0]))
                        .set('Content-Type', 'application/json')
                        .send({ "nombre": "", "password": "ignorar", "roles": [] })
                        .expect(204, done)
                });
            });
        })
        describe(`${config.paths.API_AUTH}/register/password`, () => {
            describe('OK', () => {
                it('PUT: Cambiar contraseña', async () => {
                    let index = 0
                    const response = await request(app)
                        .put(`${config.paths.API_AUTH}/register/password`)
                        .set('authorization', seguridad.generarTokenScheme(usuarios[index]))
                        .set('Content-Type', 'application/json')
                        .send({ "oldPassword": "P@$$w0rd", "newPassword": "Pa$$w0rd" })
                    expect(response.statusCode).toBe(204)
                    let data = JSON.parse(fsMock.__getMockFile('./data/usuarios.json'))
                    expect(data.length).toBe(3);
                    expect(data[index].idUsuario).toBe(usuarios[index].idUsuario)
                    expect(data[index].nombre).toBe(usuarios[index].nombre)
                    expect(data[index].password).not.toBe(usuarios[index].password)
                    expect(data[index].roles).toEqual(usuarios[index].roles)
                });
            })
            describe('KO', () => {
                it('PUT: Cambiar contraseña sin token', done => {
                    request(app)
                        .put(`${config.paths.API_AUTH}/register/password`)
                        .set('Content-Type', 'application/json')
                        .send({ "oldPassword": "P@$$w0rd", "newPassword": "Pa$$w0rd" })
                        .expect(401, done)
                });
                it('PUT: Cambiar contraseña usuario eliminado', done => {
                    request(app)
                        .put(`${config.paths.API_AUTH}/register/password`)
                        .set('authorization', seguridad.generarTokenScheme(usuarioBorrado))
                        .set('Content-Type', 'application/json')
                        .send({ "oldPassword": "P@$$w0rd", "newPassword": "Pa$$w0rd" })
                        .expect(404, done)
                });
                it('PUT: Contraseña anterior invalida', done => {
                    request(app)
                        .put(`${config.paths.API_AUTH}/register/password`)
                        .set('authorization', seguridad.generarTokenScheme(usuarios[0]))
                        .set('Content-Type', 'application/json')
                        .send({ "oldPassword": "Pa$$w0rd", "newPassword": "P@$$w0rd" })
                        .expect(400, done)
                });
                it('PUT: Contraseña nueva invalida', done => {
                    request(app)
                        .put(`${config.paths.API_AUTH}/register/password`)
                        .set('authorization', seguridad.generarTokenScheme(usuarios[0]))
                        .set('Content-Type', 'application/json')
                        .send({ "oldPassword": "P@$$w0rd", "newPassword": "P@$$W0RD" })
                        .expect(400, done)
                });
            });
        })
        describe(`${config.paths.API_AUTH}/auth`, () => {
            describe('OK', () => {
                it('GET: Con token', done => {
                    let index = 0
                    request(app)
                        .get(`${config.paths.API_AUTH}/auth`)
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
