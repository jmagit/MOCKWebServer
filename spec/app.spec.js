const request = require('supertest');
const app = require('../src/app');

describe("Test the root path", () => {
    let spy
    beforeAll(() => {
        spy = jest.spyOn(console, 'info');
        spy.mockImplementation(() => { })
        return Promise.resolve()
    });
  it("It should response the GET method", done => {
    request(app)
      .get("/")
      .then(response => {
        expect(response.statusCode).toBe(200);
        done();
      });
  });
});
