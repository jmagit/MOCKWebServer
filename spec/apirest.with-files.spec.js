// eslint-disable-next-line node/no-unpublished-require
const request = require('supertest');
const seguridad = require('../src/seguridad')
const utils = require('../src/utils')

const token = seguridad.generarTokenScheme({ "idUsuario": "admin", "password": "", "nombre": "Administrador", "roles": ["Usuarios", "Administradores"] })

describe('API Rest: Ficheros reales', () => {
    const app = require('../src/app');
    const serviciosConfig = utils.getServiciosConfig()
    it.each(serviciosConfig.map(item => [item.endpoint.toUpperCase(), item.security]))('API %s', async (endpoint, security) => {
        let auth = token;
        if (typeof (security) === 'string')
            auth = seguridad.generarTokenScheme({ "idUsuario": "admin", "password": "", "nombre": "Administrador", "roles": security.split(",") })
        let response = await request(app)
            .get("/api/" + endpoint)
            .set('authorization', auth)
        expect(response.statusCode).toBe(200)
        expect(response.body.length).toBeGreaterThan(1)
    });
});
