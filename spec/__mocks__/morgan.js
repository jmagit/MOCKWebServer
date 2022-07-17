// eslint-disable-next-line no-unused-vars
module.exports = (_format, _options) => {
    return function logger (_req, _res, next) {
        next()
    }
}