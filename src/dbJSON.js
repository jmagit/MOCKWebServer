const fs = require('fs/promises');

class DbJSONError extends Error {
    constructor(message, code) {
        super(message);
        this.name = "dbJSONError";
        this.code = code;
    }
}

class DbJSON {
    constructor(filename, pk, autoSave = false) {
        this.__filename = filename
        this.__pk = pk
        this.__autoSave = autoSave
        this.__data = null
    }
    async load(force = false) {
        if (this.__data && !force && process.env.NODE_ENV !== 'test')
            return

        let result = await fs.readFile(this.__filename, 'utf8')
        this.__data = JSON.parse(result)
    }
    async save() {
        await fs.writeFile(this.__filename, JSON.stringify(this.__data), 'utf8');
    }
    get isLoad() { return this.__data !== null }
    get list() {
        if (!this.isLoad)
            throw new DbJSONError('Data not loading', 500)
        return this.__data;
    }
    get loadList() {
        if (!this.isLoad)
            return new Promise((resolve, rejects) => {
                this.load().then(() => resolve(this.__data), err => rejects(err))
            })
        return Promise.resolve(this.__data);
    }

    __comparaValores(a, b) {
        return a == b ? 0 : (a < b ? -1 : 1)
    }
    __comparaMultiplesPropiedades(a, b, properties, index) {
        let result = properties[index].dir * this.__comparaValores(a[properties[index].cmp], b[properties[index].cmp])
        if (result !== 0 || index + 1 === properties.length) return result;
        return this.__comparaMultiplesPropiedades(a, b, properties, index + 1);
    }
    __proyectar(projection) {
        const propiedades = projection.split(',');
        return item => {
            let e = {};
            propiedades.forEach(c => {
                if (item[c] !== undefined) e[c] = item[c]
            });
            return Object.keys(e).length > 0 ? e : item;
        }
    }
    getById(id, projection) {
        const result = this.list.find(item => item[this.__pk] == id)
        if (projection && result)
            return this.__proyectar(projection)(result)
        return result
    }
    indexById(id) {
        return this.list.findIndex(item => item[this.__pk] == id)
    }

    orderByProperty(source, property, des = false) {
        const dir = des ? -1 : 1
        return source.sort((a, b) => dir * this.__comparaValores(a[property], b[property]))
    }
    sortByProperty(property, des = false) {
        return this.orderByProperty(this.list, property, des)
    }

    orderByProperties(source, properties) {
        let orderBy = properties.split(',').map(cmp => {
            cmp = cmp.trim()
            if (cmp.startsWith("-")) {
                cmp = cmp.substring(1).trim();
                return { cmp, dir: -1 }
            }
            return { cmp, dir: 1 }
        })
        return source.sort((a, b) => this.__comparaMultiplesPropiedades(a, b, orderBy, 0))
    }
    sortByProperties(properties) {
        return this.orderByProperties(this.list, properties)
    }
    select(projection, where, orderBy) {
        let result = this.list;
        if (where)
            result = result.filter(where)
        if (orderBy)
            result = this.orderByProperties(result, orderBy)
        if (projection && projection !== '*')
            result = result.map(this.__proyectar(projection))
        return result
    }
    add(element, persist = false) {
        if (element[this.__pk] == undefined) {
            element[this.__pk] = 0
        }
        if (this.getById(element[this.__pk]) !== undefined)
            throw new DbJSONError('Duplicate key', 400)
        if (element[this.__pk] == 0) {
            if (this.list.length == 0)
                element[this.__pk] = 1;
            else {
                let newId = +this.sortByProperty(this.__pk, true)[0][this.__pk];
                element[this.__pk] = newId + 1;
            }
        }
        this.__data.push(element)
        if (persist || this.__autoSave) this.save()
        return element
    }
    update(element, persist = false) {
        if (element[this.__pk] === undefined)
            throw new DbJSONError('Missing key', 400)
        let index = this.indexById(element[this.__pk])
        if (index < 0)
            throw new DbJSONError('Missing data', 404)
        this.__data[index] = element
        if (persist || this.__autoSave) this.save()
        return element
    }
    change(key, element, persist = false) {
        let index = this.indexById(key)
        if (index < 0)
            throw new DbJSONError('Missing data', 404)
        this.__data[index] = Object.assign({}, this.__data[index], element)
        if (persist || this.__autoSave) this.save()
        return this.__data[index]
    }
    delete(key, persist = false) {
        let index = this.indexById(key)
        if (index < 0)
            throw new DbJSONError('Missing data', 404)
        this.__data.splice(index, 1)
        if (persist || this.__autoSave) this.save()
    }
}

module.exports = DbJSON
module.exports.dbJSONError = DbJSONError