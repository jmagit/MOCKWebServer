module.exports = {
    openapi: {
        TITLE: "MOCK Web Server",
        DESCRIPTION: "Versión NodeJS del **servidor de pruebas** para cursos de FrontEnd.",
        REPOSITORIO: "https://github.com/jmagit/MOCKWebServer",

    },
    paths: {
        API_REST: '/api',
        API_AUTH: '/api', // DIR_API_REST
        PUBLIC: './public',
        UPLOADS: './uploads/',
        DATA: './data/',
        APP_ROOT: __dirname,
    },
    security: {
        REFRESH_KEY: process.env.API_KEY ?? 'Es segura al 99%',
        PRIVATE_KEY : 'MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDHp+JR9/LfZAtXeJFLRANM/j3HvnoEqYeK3w294veF0cUZvya9sXoTYR4Pls/wy5IFIW8gxjD35mXUmo3cMsfm0KgxdQDQD0W8qx52bE8Gh5uww4LHSlIwzwnkHFHmgYtg1k56d9s+e8kYLRkq3DGxZ7SwKgzNhQXUVUoNLbsPr4hVZYd7BABC5KCOHhd6rBxZyK6HDLcoNyfmkospNJQHps/SYmbt+MlyTpvFXWrcj4ttVLKXwjefxkaxF4YNrZrO4aCXuOeJG8Q9IOXxdXkdsP5WJEUnWP63Jca8cyJMCS41GAowb9ratjm0eeTA130eHBMJuJyV2UtKcoB/0IoXAgMBAAECggEAGJ8Zh+Y961KZG3Zg5JlElvAbilBxF7YYYwXS2gHtaHFQDzbFfksutMkbPezpQ9a28S8IV1BZpZiiIi/VIryYblx5AXBeY0oe3X90yEHfFP0QNCJING9z51UA8UKUzwpWt+B12SCCxxfY2sRlACYbcrdJTxhAb+/hoifKdAmZsftJqSiGuMlYWbi6Q3Lk+tsHVPVCwqyf8puZEFTf76s2yY/ySTAhNL4drd64++sVlQbgieSGnOqFv6ai12XJbuYOZE0Dce9+r3PRvDVQhMDajG7AuAJd4fmwFjJR3aPwyxGVv0oZk5KmqM6hTV1mxBLuZvqBYLAZojYl45i/GnEzYQKBgQD2yXJsRJyh7l8H4wCHIeUGXrpF+IbSaz5vK6hGqs4Xw5rOiA+wcYKIMqYnG1cfX/rP3hPh5kzz96wsAyL0jzZhbCP2Miz35XYAm+LgQzhAN6VXtwUHWQDAehhmM00y3X/gu1I+3IffB9fVGh4xK1T49mDnq+pZ+HWsORu5Vr/n/wKBgQDPHADLOO+JT7yFmCMP0PQfSy0UPTNDuaDdWVtnQYwZ68a0SIk+ygZNCEbeYEhCO+Kq7/S3DcmQHYq54O7G8LP/+oxCmSXLkA5hwJFOJtC5hea+i0JHG5UvOmDvRBojaSO5xxC17PREL/QOMV0niEd1VYFBcCFt79C1P6DQDiGd6QKBgCiX4jZk4s7QAtmtQTz5Gk797e3sf2DFOzPWHovhNJ08E469WrdPNIVqr2HnYWFLzFm80dBqrWXD65IhwfIwTGWiABhTEIqGN+7JtXvmEq6deJkBBda7kSAX9UN6VMx1Gr/AkDq+06qgA6SN80FrO0LoY/A3mwjJkbGOgzztRAvJAoGBAJa85+sBVn4W9bw6HZK+X1+DZJztailpqqZQChGeCG05SJcgkBuOCIX6dzIU26KxWWlWWkL9Gu30QmrFRqSuviOZ5In4UyTUhVMqR9ecsp/E0Etwqd19Othz4edjJq8NL/5f30651pLmX/gQf59tNa01fWz2Qq50M/AnDlE/Z8I5AoGBALil+ccLACzw2W3qrU44HEpXYY91RLE9ANXUlM9OfbnHYfrI6wZylRA5TjcAcaLHwC88c/yLalVEJXnSgBpm9MNmQPE6tNGU7+IIn6cdIbX1eW6QUPWU5yLwiFlntkp/v+WwURN3sIQWegtOacAp5R78nJLpeWm1WmuFOYJ0glaF',
        PUBLIC_KEY : 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAx6fiUffy32QLV3iRS0QDTP49x756BKmHit8NveL3hdHFGb8mvbF6E2EeD5bP8MuSBSFvIMYw9+Zl1JqN3DLH5tCoMXUA0A9FvKsedmxPBoebsMOCx0pSMM8J5BxR5oGLYNZOenfbPnvJGC0ZKtwxsWe0sCoMzYUF1FVKDS27D6+IVWWHewQAQuSgjh4XeqwcWciuhwy3KDcn5pKLKTSUB6bP0mJm7fjJck6bxV1q3I+LbVSyl8I3n8ZGsReGDa2azuGgl7jniRvEPSDl8XV5HbD+ViRFJ1j+tyXGvHMiTAkuNRgKMG/a2rY5tHnkwNd9HhwTCbicldlLSnKAf9CKFwIDAQAB',
        AUTHENTICATION_SCHEME: 'Bearer ',
        PROP_USERNAME: 'idUsuario',
        PROP_PASSWORD: 'password',
        PROP_NAME: 'idUsuario',
        PASSWORD_PATTERN: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{8,}$/,
        USR_FILENAME: './data/usuarios.json',
        EXPIRACION_MIN: 5,
        REFRESH_FACTOR: 4,
        USERNAME: 'adm@example.com',
        PASSWORD: 'P@$$w0rd',
    }

}
