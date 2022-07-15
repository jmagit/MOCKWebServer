const request = require('supertest');
const app = require('../app');

describe("Seguridad", () => {
    let spy
    beforeAll(() => {
        spy = jest.spyOn(console, 'log');
        spy.mockImplementation(() => { })
        return Promise.resolve()
    });
    describe("Login", () => {
        describe("OK", () => {
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
        })
        describe("KO", () => {
            it("POST: Sin body", done => {
                request(app)
                    .post("/login")
                    .expect(400, done)
            });
            it("POST: Usuario invalido", async () => {
                await request(app)
                    .post("/login")
                    .set('Content-Type', 'application/json')
                    .send({ "name": "admina", "password": "P@$$w0rd" })
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .expect(response => expect(response.body.success).toBeFalsy())
            });
            it("POST: Usuario invalido", () => {
                return request(app)
                    .post("/login")
                    .set('Content-Type', 'application/json')
                    .send({ "name": "admin", "password": "P@$Sw0rd" })
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .expect('{"success":false}')
            });
        });
    })
});
