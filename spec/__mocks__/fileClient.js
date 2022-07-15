const fs = require('fs/promises');

exports.leer = async (file) => {
    let data = await fs.readFile(file, 'utf8')
    return JSON.parse(data)
} 
exports.escribir = (file, data) => {
    return fs.writeFile(file, data)
} 
