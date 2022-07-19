// eslint-disable-next-line node/no-unpublished-require
const request = require('supertest');
const app = require('../src/app');
const serviciosConfig = require('../data/__servicios.json');
const seguridad = require('../src/seguridad')

const token = seguridad.generarTokenScheme({ "idUsuario": "admin", "password": "", "nombre": "Administrador", "roles": ["Usuarios", "Administradores"] })

describe('API Rest: Ficheros reales', () => {
    // let spy
    // beforeAll(() => {
    //     spy = jest.spyOn(console, 'info');
    //     spy.mockImplementation(() => { })
    // });
    it.each(serviciosConfig.map(item => item.endpoint.toUpperCase()))('API %s', async endpoint => {
        let response = await request(app)
            .get("/api/" + endpoint)
            .set('authorization', token)
        expect(response.statusCode).toBe(200)
        expect(response.body.length).toBeGreaterThan(1)
    });
});
