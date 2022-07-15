const request = require('supertest');
const app = require('../src/app');

describe("API Rest", () => {
    let authentication = ''
    let spy
    beforeAll(() => {
        spy = jest.spyOn(console, 'info');
        spy.mockImplementation(() => {})
        return new Promise((resolve, reject) => {
            request(app)
                .post("/login")
                .set('Content-Type', 'application/json')
                .send({ "name": "admin", "password": "P@$$w0rd" })
                .expect('Content-Type', /json/)
                .then(response => {
                    expect(response.statusCode).toBe(200);
                    expect(response.body.success).toBeTruthy()
                    authentication = response.body.token;
                    resolve();
                })
                .catch(err => reject(err))
        });
    });

    describe("GET", () => {
        // it("Config", done => {
        //     let conf = require('../data/__servicios.json')
        //     expect(conf.length).toBe(8)
        //   });
        
        describe("OK", () => {
            it("Sin paginar", done => {
                request(app)
                    .get("/api/tarjetas")
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .then(response => {
                        expect(response.body.length).toBe(100)
                        done();
                    })
                    .catch(err => done(err))
            });
            it("Paginar", done => {
                request(app)
                    .get("/api/tarjetas?_page=1&_rows=10")
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .then(response => {
                        expect(response.body.content.length).toBe(10)
                        done();
                    })
                    .catch(err => done(err))
            });
        })
        describe.skip("KO", () => {
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
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .expect(response => expect(response.body.success).toBeFalsy())
            });
            it("POST: Usuario invalido", () => {
                return request(app)
                    .post("/login")
                    .set('Content-Type', 'application/json')
                    .send({ "name": "admin", "password": "P@$Sw0rd" })
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .expect('{"success":false}')
            });
        });
    })
});
