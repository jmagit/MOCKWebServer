const request = require('supertest');
const seguridad = require('../src/seguridad')
const utils = require('../src/utils')
const config = require('../config');

const usr = { "idUsuario": "admin", "password": "", "nombre": "Administrador", "roles": ["Usuarios", "Administradores", "Empleados"] }
const token = seguridad.generarTokenScheme(usr)
const cookie = `Authorization=${seguridad.generarTokenJWT(usr)};`

describe('API Rest: Ficheros reales', () => {
    const app = require('../src/app');
    const serviciosConfig = utils.getServiciosConfig()
    it.each(serviciosConfig.map(item => [item.endpoint.toUpperCase(), item.security]))('Autenticación bearer %s', async (endpoint) => {
        let response = await request(app)
            .get(`${config.paths.API_REST}/${endpoint.toLowerCase()}`)
            .set('authorization', token)
        expect(response.statusCode).toBe(200)
        expect(response.body.length).toBeGreaterThan(1)
    });
    it.each(serviciosConfig.map(item => [item.endpoint.toUpperCase(), item.security]))('Autenticación cookie %s', async (endpoint) => {
        let response = await request(app)
            .get(`${config.paths.API_REST}/${endpoint.toLowerCase()}`)
            .set('Cookie', cookie)
        expect(response.statusCode).toBe(200)
        expect(response.body.length).toBeGreaterThan(1)
    });
});
