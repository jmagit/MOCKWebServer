const config = require('../config')
const { generaSwaggerSpecification } = require('../src/openapi-generator');

describe('Pruebas unitarias', () => {
    // npx jest --updateSnapshot
    it('Generar OpenApi', () => {
        const actual = generaSwaggerSpecification('8080', config.paths.API_REST, ()=>{}, config.paths.API_AUTH ?? '/')
        expect(actual).toMatchSnapshot()
    })
});
