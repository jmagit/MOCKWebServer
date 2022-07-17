// eslint-disable-next-line node/no-unpublished-require
const request = require('supertest');
const app = require('../src/app');

describe("Test the root path", () => {
  let spy
  beforeAll(() => {
    spy = jest.spyOn(console, 'info');
    spy.mockImplementation(() => { })
    return Promise.resolve()
  });
  it("Página principal", done => {
    request(app)
      .get("/")
      .then(response => {
        expect(response.statusCode).toBe(200);
        done();
      });
  });
  it("NOT FOUND", async () => {
    const response = await request(app)
      .get('/esta/ruta/no/existe')
    expect(response.statusCode).toBe(404)
  });
  it("/form", done => {
    request(app)
      .get("/form")
      .then(response => {
        expect(response.statusCode).toBe(200);
        done();
      });
  });
  it("/form con volver", done => {
    request(app)
      .get("/form")
      .set('referer', 'https://www.examples.com')
      .then(response => {
        expect(response.statusCode).toBe(200);
        done();
      });
  });
  it("GET /fileupload", done => {
    request(app)
      .get("/fileupload")
      .expect(200)
      .end(done)
  });
  it("/eco", done => {
    request(app)
      .get("/eco/personas/1?_page=1&_rows=10")
      .set('referer', 'https://www.examples.com')
      .then(response => {
        expect(response.statusCode).toBe(200);
        done();
      });
  });
  it("/favicon.ico", done => {
    request(app)
      .get("/favicon.ico")
      .expect(200)
      .end(done)
  });
  it("PushState de HTML5", done => {
    request(app)
      .get("/index.html/ruta/interna")
      .expect(404)
      .end(done)
  });
});
