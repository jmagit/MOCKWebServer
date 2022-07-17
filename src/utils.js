const http = require('http');

// https://datatracker.ietf.org/doc/html/rfc7807
/*
id: un identificador único para esta ocurrencia particular del problema.
links: un objeto de enlaces que contiene los siguientes miembros:
about: un enlace que conduce a más detalles sobre esta ocurrencia particular del problema.
status: el código de estado HTTP aplicable a este problema, expresado como un valor de cadena.
code: un código de error específico de la aplicación, expresado como un valor de cadena.
title: un breve resumen legible por humanos del problema que NO DEBE cambiar de ocurrencia en ocurrencia del problema, excepto para fines de localización.
detail: una explicación legible por humanos específica para esta aparición del problema. Como title, el valor de este campo se puede localizar.
source: un objeto que contiene referencias al origen del error, que incluye opcionalmente cualquiera de los siguientes miembros:
pointer: un puntero JSON [ RFC6901 ] a la entidad asociada en el documento de solicitud [por ejemplo, "/data"para un objeto de datos primario o "/data/attributes/title"para un atributo específico].
parameter: una cadena que indica qué parámetro de consulta de URI provocó el error.
meta: un metaobjeto que contiene metainformación no estándar sobre el error.

class ApplicationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ApplicationError";
    }
}
*/

const production = process.env.NODE_ENV === 'production';

module.exports.formatError = (error, status = 400) => {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError')
        return {
            type: "https://tools.ietf.org/html/rfc7231#section-6.5.1",
            status: 400,
            title: 'One or more validation errors occurred.',
            errors: Object.assign({}, ...error.errors.map(item => ({ [item.path]: item.message })))
        }
    return { status, title: error.message }
}

const generateError = (title, status = 500, detail, source) => {
    if(!title) title = http.STATUS_CODES[status] || '(desconocido)'
    let error = new Error(title)
    error.name = 'ApplicationError'
    error.payload = { type: error.name, status, title }
    if (detail) error.payload.detail = detail
    if (source) error.payload.source = source
    return error
} 
module.exports.generateError = generateError
module.exports.generateErrorByStatus = (status = 500) => {
    return generateError(http.STATUS_CODES[status] || '(desconocido)', status)
}
module.exports.generateErrorByError = (error, status = 500) => {
    return generateError(error.message, error.statusCode || status, null , production ? null : error.trace)
}

// module.exports.relanzaError = (error, status = 500) => {
//     error.payload = { type: error.name, status, title: error.message }
//     if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
//         error.payload.status = 400,
//             error.payload.title = 'One or more validation errors occurred.',
//             error.payload.source = Object.assign({}, ...error.errors.map(item => ({ [item.path]: item.message })))
//     }
//     throw error
// }
