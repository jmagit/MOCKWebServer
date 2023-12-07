const utils = require('../src/utils');

const resFake = {protocol: 'http', hostname: 'localhost', connection: { localPort: 8080 }, originalUrl: '/api/fake'}

describe('problem Details', () => {
    it('generateErrorByStatus', () => {
        const result = utils.generateErrorByStatus(resFake)
        expect(result).toBeDefined()
        expect(result.status).toBe(500)
    })
});

describe('utils', () => {

    it('extractURL', () => {
        expect(utils.extractURL(resFake)).toBe('http://localhost:8080/api/fake')
    })

    it('formatLocation', () => {
        expect(utils.formatLocation(resFake, 55)).toBe('http://localhost:8080/api/fake/55')
    })

    it('emptyPropertiesToNull', () => {
        const result = utils.emptyPropertiesToNull({ lleno: 'dato', nulo: null, blanco: ''})
        expect(result.lleno).toBe('dato')
        expect(result.nulo).toBeNull()
        expect(result.blanco).toBeNull()
    })

    it('generateProjection', () => {
        const result = utils.generateProjection({ lleno: 'dato', nulo: null, blanco: '', dato: true }, 'nulo, dato,desconocido')
        expect(Object.keys(result).length).toBe(2)
        expect(result.lleno).toBeUndefined()
        expect(result.nulo).toBeNull()
        expect(result.blanco).toBeUndefined()
        expect(result.dato).toBeTruthy()
    })
});
