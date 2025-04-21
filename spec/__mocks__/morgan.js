module.exports = (_format, _options) => {
    return function logger (_req, _res, next) {
        next()
    }
}