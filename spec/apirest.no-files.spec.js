// eslint-disable-next-line node/no-unpublished-require
const request = require('supertest');
const utils = require('../src/utils')

let spy = jest.spyOn(utils, 'getServiciosConfig');
spy.mockReturnValue([
    {
        "endpoint": "fake",
        "model": "fake",
        "pk": "id",
        "file": "fake.json"
    },
])
const app = require('../src/app');
describe('API Rest: Sin fichero', () => {
    it.each(["GET", "POST", "PUT"])('/%s', async (method) => {
        let response = await request(app)[method.toLowerCase()]("/api/fake")
            .set('Content-Type', 'application/json')
            .send({ "id": "0", "name": "Nuevo" })
        expect(response.statusCode).toBe(500)
    });
    it.each(["GET", "PUT", "PATCH", "DELETE"])('/%s/:id', async (method) => {
        let response = await request(app)[method.toLowerCase()]("/api/fake/1")
            .set('Content-Type', 'application/json')
            .send({ "id": "1", "name": "Nuevo" })
        expect(response.statusCode).toBe(500)
    });
});
