const DbJSON = require('../src/dbJSON')

jest.mock('fs/promises');

const sourceFile = [{
    "id": 1,
    "product": "Onions - Spanish",
    "price": 3.66,
    "disontinued": true,
    "date": "2001-09-30T04:38:30Z"
}, {
    "id": 2,
    "product": "Stock - Chicken, White",
    "price": 14.78,
    "disontinued": false,
    "date": "2008-09-02T12:11:24Z"
}, {
    "id": 3,
    "product": "Wine - Red, Pinot Noir, Chateau",
    "price": 9.15,
    "disontinued": false,
    "date": "2026-09-09T17:53:51Z"
}, {
    "id": 4,
    "product": "Lamb - Ground",
    "price": 1.05,
    "disontinued": true,
    "date": "2013-09-25T20:43:41Z"
}, {
    "id": 5,
    "product": "Pie Shell - 5",
    "price": 3.66,
    "disontinued": false,
    "date": "2023-11-08T04:55:03Z"
}, {
    "id": 6,
    "product": "Bread - Roll, Soft White Round",
    "price": 12.24,
    "disontinued": true,
    "date": "2029-12-06T12:41:49Z"
}, {
    "id": 7,
    "product": "Tomatoes Tear Drop Yellow",
    "price": 16.25,
    "disontinued": false,
    "date": "2009-06-22T03:38:37Z"
}, {
    "id": 10,
    "product": "Kaffir Lime Leaves",
    "price": 6.65,
    "disontinued": true,
    "date": "2005-11-19T21:04:42Z"
}, {
    "id": 19,
    "product": "Beer - Molson Excel",
    "price": 12.7,
    "disontinued": true,
    "date": "2003-11-10T23:05:12Z"
}, {
    "id": 20,
    "product": "Beans - Turtle, Black, Dry",
    "price": 3.14,
    "disontinued": true,
    "date": "2001-01-12T17:35:12Z"
}]

const elemento = {
    "id": 10,
    "product": "Wine - Champagne Brut Veuve",
    "price": 19.04,
    "disontinued": false,
    "date": "2006-05-01T11:54:10Z"
}

describe('dbJSON: Base de datos JSON', () => {
    let fsMock
    const nombreFichero = './datos.json'

    beforeEach(() => {
        jest.mock('fs/promises');
        fsMock = require('fs/promises')
        fsMock.__setMockFiles({
            [nombreFichero]: JSON.stringify(sourceFile),
        });
    });
    describe('sin load inicial', () => {
        let db;
        beforeEach(() => {
            jest.mock('fs/promises');
            db = new DbJSON(nombreFichero, 'id');
        });
        it('list con load', async () => {
            await db.load()
            let result = db.list
            expect(result.length).toBe(10)
            expect(result[0].id).toBe(1)
            expect(result[9]).toEqual(sourceFile[9])
        })
        it('loadList', async () => {
            let result = await db.loadList
            expect(result.length).toBe(10)
            expect(result[0].id).toBe(1)
            expect(result[9]).toEqual(sourceFile[9])
        })
        it('loadList sin recargar', async () => {
            await db.load()
            let result = await db.loadList
            expect(result.length).toBe(10)
            expect(result[0].id).toBe(1)
            expect(result[9]).toEqual(sourceFile[9])
        })
        it('list sin load', async () => {
            expect(() => db.list).toThrow(/Data not loading/)
        })
    });
    describe('sin autoSave', () => {
        let db;
        beforeEach(async () => {
            db = new DbJSON(nombreFichero, 'id');
            await db.load()
        });
        describe('OK', () => {
            it('list', () => {
                let result = db.list
                expect(result.length).toBe(10)
                expect(result[0].id).toBe(1)
                expect(result[9]).toEqual(sourceFile[9])
            })
            it('ordenar por propiedad asc', () => {
                let result = db.sortByProperty('product')
                expect(result[0].id).toBe(20)
                expect(result[9]).toEqual(sourceFile[2])
            });
            it('ordenar por propiedad desc', () => {
                let result = db.sortByProperty('product', true)
                expect(result[0]).toEqual(sourceFile[2])
                expect(result[9]).toEqual(sourceFile[9])
            });
            it('ordenar por propiedades', () => {
                let result = db.sortByProperties('-price,product')
                expect(result.length).toBe(10)
                for (let i = 0; i < result.length - 1; i++)
                    expect(result[i].price).toBeGreaterThanOrEqual(result[i + 1].price)
            });
            it('filtrar', () => {
                let result = db.select('*', item => item.id < 10 && !item.disontinued)

                expect(result.length).toBe(4)
                result.forEach(item => {
                    expect(Object.keys(item).length).toBe(5)
                })
            });
            it('proyecciones', () => {
                let result = db.select('id,product')

                expect(result.length).toBe(10)
                result.forEach(item => {
                    expect(Object.keys(item).length).toBe(2)
                    expect(Object.keys(item)[0]).toBe('id')
                    expect(Object.keys(item)[1]).toBe('product')
                })
            });
            it('proyecta, filtra, ordena', () => {
                let result = db.select('id,price,disontinued', item => item.disontinued, 'disontinued,-price,id')

                expect(result.length).toBe(6)
                for (let i = 0; i < result.length - 1; i++) {
                    expect(Object.keys(result[i]).length).toBe(3)
                    expect(Object.keys(result[i])[0]).toBe('id')
                    expect(result[i].price).toBeGreaterThanOrEqual(result[i + 1].price)
                    expect(result[i].disontinued).toBeTruthy()
                }
            });
            it('getById', () => {
                let result = db.getById(5)
                expect(result).toEqual(sourceFile[4])
            });
            it('getById con proyección', () => {
                let result = db.getById(7, 'product,disontinued,date')
                expect(Object.keys(result).length).toBe(3)
                expect(result.product).toEqual(sourceFile[6].product)
                expect(result.disontinued).toEqual(sourceFile[6].disontinued)
                expect(result.date).toEqual(sourceFile[6].date)
            })
            it('indexById', () => {
                for (let i = sourceFile.length - 1; i >= 0; i--)
                    expect(db.indexById(sourceFile[i].id)).toBe(i)
            })
            it('add autonumérico', () => {
                let nuevo = Object.assign({}, elemento, { id: 0 })
                db.add(nuevo)
                db.save()
                let data = JSON.parse(fsMock.__getMockFile(nombreFichero))
                expect(data.length).toBe(11);
                expect(data[10]).toEqual(Object.assign({}, elemento, { id: 21 }))
            });
            it('add sin PK', () => {
                let nuevo = { ...elemento }
                delete nuevo.id
                db.add(nuevo)
                db.save()
                let data = JSON.parse(fsMock.__getMockFile(nombreFichero))
                expect(data.length).toBe(11);
                expect(data[10]).toEqual(Object.assign({}, elemento, { id: 21 }))
            });
            it('add con PK inexistente', () => {
                let nuevo = Object.assign({}, elemento, { id: 33 })
                db.add(nuevo)
                db.save()
                let data = JSON.parse(fsMock.__getMockFile(nombreFichero))
                expect(data.length).toBe(11);
                expect(data[10]).toEqual(Object.assign({}, elemento, { id: 33 }))
            });
            it('add con persist', () => {
                let nuevo = Object.assign({}, elemento, { id: 0 })
                db.add(nuevo, true)
                let data = JSON.parse(fsMock.__getMockFile(nombreFichero))
                expect(data.length).toBe(11);
                expect(data[10]).toEqual(Object.assign({}, elemento, { id: 21 }))
            });
            it('update', () => {
                let nuevo = { ...elemento }
                db.update(nuevo)
                db.save()
                let data = JSON.parse(fsMock.__getMockFile(nombreFichero))
                expect(data.length).toBe(10);
                for (let i = 0; i < sourceFile.length; i++)
                    expect(data[i]).toEqual(i == 7 ? nuevo : sourceFile[i])
            });
            it('update con persist', () => {
                let nuevo = { ...elemento }
                db.update(nuevo, true)
                let data = JSON.parse(fsMock.__getMockFile(nombreFichero))
                expect(data.length).toBe(10);
                for (let i = 0; i < sourceFile.length; i++)
                    expect(data[i]).toEqual(i == 7 ? nuevo : sourceFile[i])
            });
            it('change', () => {
                let cambios = { product: 'nuevo', price: 10 }
                db.change(10, cambios)
                db.save()
                let nuevo = Object.assign({}, sourceFile[7], cambios)
                let data = JSON.parse(fsMock.__getMockFile(nombreFichero))
                expect(data.length).toBe(10);
                for (let i = 0; i < sourceFile.length; i++)
                    expect(data[i]).toEqual(i == 7 ? nuevo : sourceFile[i])
            });
            it('change con persist', () => {
                let cambios = { product: 'nuevo', price: 10 }
                db.change(10, cambios, true)
                let nuevo = Object.assign({}, sourceFile[7], cambios)
                let data = JSON.parse(fsMock.__getMockFile(nombreFichero))
                expect(data.length).toBe(10);
                for (let i = 0; i < sourceFile.length; i++)
                    expect(data[i]).toEqual(i == 7 ? nuevo : sourceFile[i])
            });
            it('delete', () => {
                db.delete(10)
                db.save()
                let data = JSON.parse(fsMock.__getMockFile(nombreFichero))
                expect(data.length).toBe(9);
                for (let i = 0; i < data.length; i++)
                    expect(data[i]).toEqual(sourceFile[i >= 7 ? i + 1 : i])
            });
            it('delete con persist', () => {
                db.delete(10, true)
                let data = JSON.parse(fsMock.__getMockFile(nombreFichero))
                expect(data.length).toBe(9);
                for (let i = 0; i < data.length; i++)
                    expect(data[i]).toEqual(sourceFile[i >= 7 ? i + 1 : i])
            });
        })
        describe('KO', () => {
            it('getById no encontrado', () => {
                expect(db.getById(999)).toBeUndefined()
            });
            it('indexById no encontrado', () => {
                expect(db.indexById(0)).toBe(-1)
            });
            it.each([
                ['', 5],
                ['idx,xproduct', 5],
                ['idx,product', 1],
            ])('proyección invalida: "%s"', (caso, campos) => {
                let result = db.select(caso)
                expect(result.length).toBe(10)
                expect(Object.keys(result[0]).length).toBe(campos)
                //console.log(result)
            })
            it('ordenar por propiedad inexistente', () => {
                let result = db.sortByProperty('xproduct')
                expect(result.length).toBe(10)
                expect(result).toEqual(sourceFile)
            });
            it('ordenar por propiedades vacía', () => {
                let result = db.sortByProperties('')
                expect(result.length).toBe(10)
                expect(result).toEqual(sourceFile)
            });
            it('ordenar por propiedades inexistentes', () => {
                let result = db.sortByProperties('xproduct,-id')
                expect(result.length).toBe(10)
                expect(result[0]).toEqual(sourceFile[9])
                expect(result[9]).toEqual(sourceFile[0])
            });
            it('add: Duplicate key', () => {
                let nuevo = { ...elemento }
                expect(() => db.add(nuevo)).toThrow(/Duplicate key/)
                let data = JSON.parse(fsMock.__getMockFile(nombreFichero))
                expect(data).toEqual(sourceFile)
            })
            it('update: Missing key', () => {
                let nuevo = { ...elemento }
                delete nuevo.id
                expect(() => db.update(nuevo)).toThrow(/Missing key/)
                let data = JSON.parse(fsMock.__getMockFile(nombreFichero))
                expect(data).toEqual(sourceFile)
            });
            it('update: Missing data', () => {
                let nuevo = Object.assign({}, elemento, { id: 0 })
                expect(() => db.update(nuevo)).toThrow(/Missing data/)
                let data = JSON.parse(fsMock.__getMockFile(nombreFichero))
                expect(data).toEqual(sourceFile)
            });
            it('change: Missing data', () => {
                expect(() => db.change(999, {})).toThrow(/Missing data/)
                let data = JSON.parse(fsMock.__getMockFile(nombreFichero))
                expect(data).toEqual(sourceFile)
            });
            it('delete: Missing data', () => {
                expect(() => db.delete(999, {})).toThrow(/Missing data/)
                let data = JSON.parse(fsMock.__getMockFile(nombreFichero))
                expect(data).toEqual(sourceFile)
            });
        });
    })
    describe('con autoSave', () => {
        let db;
        beforeEach(async () => {
            db = new DbJSON(nombreFichero, 'id', true);
            await db.load()
        });
        it('add sin save ni persist', () => {
            let nuevo = Object.assign({}, elemento, { id: 0 })
            db.add(nuevo)
            let data = JSON.parse(fsMock.__getMockFile(nombreFichero))
            expect(data.length).toBe(11);
            expect(data[10]).toEqual(Object.assign({}, elemento, { id: 21 }))
        });
        it('update sin save ni persist', () => {
            let nuevo = { ...elemento }
            db.update(nuevo)
            let data = JSON.parse(fsMock.__getMockFile(nombreFichero))
            expect(data.length).toBe(10);
            for (let i = 0; i < sourceFile.length; i++)
                expect(data[i]).toEqual(i == 7 ? nuevo : sourceFile[i])
        });
        it('change sin save ni persist', () => {
            let cambios = { product: 'nuevo', price: 10 }
            db.change(10, cambios)
            let nuevo = Object.assign({}, sourceFile[7], cambios)
            let data = JSON.parse(fsMock.__getMockFile(nombreFichero))
            expect(data.length).toBe(10);
            for (let i = 0; i < sourceFile.length; i++)
                expect(data[i]).toEqual(i == 7 ? nuevo : sourceFile[i])
        });
        it('delete sin save ni persist', () => {
            db.delete(10)
            let data = JSON.parse(fsMock.__getMockFile(nombreFichero))
            expect(data.length).toBe(9);
            for (let i = 0; i < data.length; i++)
                expect(data[i]).toEqual(sourceFile[i >= 7 ? i + 1 : i])
        });
    })
});

