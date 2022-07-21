const swaggerJsdoc = require('swagger-jsdoc')
const serviciosConfig = require('../data/__servicios.json');

const Capitalize = cad => cad.charAt(0).toUpperCase() + cad.substring(1).toLowerCase()

const swaggerDocument = {
    "openapi": "3.0.0",
    "info": {
        "title": "MOCK Web Server",
        "version": "1.0.0",
        "description": "Versión NodeJS del **servidor de pruebas** para cursos de FrontEnd",
        "contact": {
            "name": "Javier Martín",
            "url": "https://www.example.com/support",
            "email": "support@example.com"
        },
        "license": {
            "name": "Apache 2.0",
            "url": "https://www.apache.org/licenses/LICENSE-2.0.html"
        },
    },
    "servers": [
        {
            "url": "{protocol}://localhost:{port}/",
            "description": "Servidor local para las pruebas",
            "variables": {
                "protocol": {
                    "enum": [
                        "http",
                        "https"
                    ],
                    "default": "http"
                },
                "port": {
                    "enum": [
                        "4321",
                        "8181"
                    ],
                    "default": "4321"
                },
            }
        }
    ],
    "externalDocs": {
        "description": "Repositorio del proyecto",
        "url": "https://github.com/jmagit/MOCKWebServer"
    },
    "tags": [],
    "paths": {},
    "components": {
        "schemas": {
            "ErrorMessage": {
                "type": "object",
                "title": "Error message",
                "required": [
                    "type",
                    "status",
                    "title"
                ],
                "properties": {
                    "type": {
                        "type": "string",
                    },
                    "status": {
                        "type": "integer",
                    },
                    "title": {
                        "type": "string",
                    },
                    "detail": {
                        "type": "string",
                    },
                    "source": {
                        "type": "string",
                    }
                }
            }
        },
        "requestBodies": {},
        "responses": {
            "Created": {
                "description": "Created",
                "headers": {
                    "location": {
                        "description": "URL al elemento recién creado",
                        "schema": { "type": "string", "format": "uri" }
                    }
                }
            },
            "NoContent": {
                "description": "No content",
            },
            "BadRequest": {
                "description": "Invalid data",
                "content": {
                    "application/json": {
                        "schema": {
                            "$ref": "#/components/schemas/ErrorMessage"
                        }
                    }
                }
            },
            "Unauthorized": {
                "description": "Unauthorized",
                "content": {
                    "application/json": {
                        "schema": {
                            "$ref": "#/components/schemas/ErrorMessage"
                        }
                    }
                }
            },
            "Forbidden": {
                "description": "Forbidden",
                "content": {
                    "application/json": {
                        "schema": {
                            "$ref": "#/components/schemas/ErrorMessage"
                        }
                    }
                }
            },
            "NotFound": {
                "description": "Not found",
                "content": {
                    "application/json": {
                        "schema": {
                            "$ref": "#/components/schemas/ErrorMessage"
                        }
                    }
                }
            },
        },
        "parameters": {
            "pagina": {
                "in": "query",
                "name": "_page",
                "description": "Número de página empezando en 0 (primera página).",
                "required": false,
                "schema": {"oneOf": [
                    { "type": "integer", "minimum": 0 },
                    { "type": "string", "enum": [ "COUNT" ] },
                ]}
            },
            "filas": {
                "in": "query",
                "name": "_rows",
                "description": "Número de filas por página, por defecto 20 si se omite pero aparece el parámetro *_page*.",
                "required": false,
                "schema": {
                    "type": "integer",
                    "minimum": 0
                }
            },
            "ordenar": {
                "in": "query",
                "name": "_sort",
                "description": "Indica la lista de propiedades (separadas por comas) por la que se ordenaran los resultados, en caso de omitirse se utilizará la propiedad que actúa como primary key. Si el nombre de la propiedad está precedido por un guion (signo negativo) la ordenación será descendente.",
                "required": false,
                "schema": {
                    "type": "string"
                }
            },
            "buscar": {
                "in": "query",
                "name": "_search",
                "description": "Selecciona todos aquellos que en alguna de sus propiedades contenga el valor proporcionado.",
                "required": false,
                "schema": {
                    "type": "string"
                }
            },
            "proyeccion": {
                "in": "query",
                "name": "_projection",
                "description": "Devuelve solo aquellas propiedades de la lista suministrada, los nombres de las propiedades deben ir separadas por comas.",
                "required": false,
                "schema": {
                    "type": "string"
                }
            }
        },
        "securitySchemes": {
            "bearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT"
            },
            "cookieAuth": {
                "type": "apiKey",
                "in": "cookie",
                "name": "Authorization"
            }
        },
    },
    // "security": [{ bearerAuth: [], cookieAuth: [] }]
}

const generaGetAll = (servicio) => {
    let result = {
        "get": {
            "tags": [servicio.tag],
            "summary": `Listar ${servicio.models.toLowerCase()}`,
            "parameters": [
                {
                    "$ref": `#/components/parameters/pagina`
                },
                {
                    "$ref": `#/components/parameters/filas`
                },
                {
                    "$ref": `#/components/parameters/ordenar`
                },
                {
                    "$ref": `#/components/parameters/buscar`
                },
                {
                    "$ref": `#/components/parameters/proyeccion`
                },
            ],
            "responses": {
                "200": {
                    "description": "OK",
                    "content": {
                        "application/json": {
                            "schema": {
                                "oneOf": [
                                    { "$ref": `#/components/schemas/${servicio.models}` },
                                    { "$ref": `#/components/schemas/${servicio.models}Page` },
                                ]
                            }
                        }
                    }
                },
                "401": { "$ref": "#/components/responses/Unauthorized" },
                "403": { "$ref": "#/components/responses/Forbidden" },
            }
        }
    }
    if (servicio.security)
        result.get.security = [{ bearerAuth: [], cookieAuth: [] }]
    return result
}
const generaPost = (servicio) => {
    let result = {
        "post": {
            "tags": [servicio.tag],
            "summary": `Crear ${servicio.model.toLowerCase()}`,
            "requestBody": {
                "content": {
                    "application/json": {
                        "schema": {
                            "$ref": `#/components/schemas/${servicio.model}Model`
                        }
                    }
                },
                "required": true,
            },
            "responses": {
                "201": { "$ref": "#/components/responses/Created" },
                "400": { "$ref": "#/components/responses/BadRequest" },
                "401": { "$ref": "#/components/responses/Unauthorized" },
                "403": { "$ref": "#/components/responses/Forbidden" },
            }
        }
    }
    if (servicio.security || servicio.readonly)
        result.post.security = [{ bearerAuth: [], cookieAuth: [] }]
    return result
}
const generaGetOne = (servicio) => {
    let result = {
        "get": {
            "tags": [servicio.tag],
            "summary": `Recuperar ${servicio.model.toLowerCase()}`,
            "parameters": [
                {
                    "in": "query",
                    "name": "_projection",
                    "description": "Devuelve solo aquellas propiedades de la lista suministrada, los nombres de las propiedades deben ir separadas por comas.",
                    "required": false,
                    "schema": {
                        "type": "string"
                    }
                }
            ],
            "responses": {
                "200": {
                    "description": "OK",
                    "content": {
                        "application/json": {
                            "schema": { "$ref": `#/components/schemas/${servicio.model}Projection` }
                        }
                    }
                },
                "401": { "$ref": "#/components/responses/Unauthorized" },
                "403": { "$ref": "#/components/responses/Forbidden" },
                "404": { "$ref": "#/components/responses/NotFound" },
            }
        }
    }
    if (servicio.security)
        result.get.security = [{ bearerAuth: [], cookieAuth: [] }]
    return result
}
const generaPut = (servicio) => {
    let result = {
        "put": {
            "tags": [servicio.tag],
            "summary": `Reemplazar ${servicio.model.toLowerCase()}`,
            "requestBody": {
                "content": {
                    "application/json": {
                        "schema": {
                            "$ref": `#/components/schemas/${servicio.model}Model`
                        }
                    }
                },
                "required": true,
            },
            "responses": {
                "200": {
                    "description": "OK",
                    "content": {
                        "application/json": {
                            "schema": { "$ref": `#/components/schemas/${servicio.model}Projection` }
                        }
                    }
                },
                "400": { "$ref": "#/components/responses/BadRequest" },
                "401": { "$ref": "#/components/responses/Unauthorized" },
                "403": { "$ref": "#/components/responses/Forbidden" },
                "404": { "$ref": "#/components/responses/NotFound" },
            }
        }
    }
    if (servicio.security || servicio.readonly)
        result.put.security = [{ bearerAuth: [], cookieAuth: [] }]
    return result
}
const generaPatch = (servicio) => {
     let result = {
        "patch": {
            "tags": [servicio.tag],
            "summary": `Actualizar parcialmente ${servicio.model.toLowerCase()}`,
            "requestBody": {
                "content": {
                    "application/json": {
                        "schema": { "$ref": `#/components/schemas/${servicio.model}Projection` }
                    }
                },
                "required": true,
            },
            "responses": {
                "200": {
                    "description": "OK",
                    "content": {
                        "application/json": {
                            "schema": { "$ref": `#/components/schemas/${servicio.model}Projection` }
                        }
                    }
                },
                "400": { "$ref": "#/components/responses/BadRequest" },
                "401": { "$ref": "#/components/responses/Unauthorized" },
                "403": { "$ref": "#/components/responses/Forbidden" },
                "404": { "$ref": "#/components/responses/NotFound" },
            }
        }
    }
    if (servicio.security || servicio.readonly)
        result.patch.security = [{ bearerAuth: [], cookieAuth: [] }]
    return result
}
const generaDelete = (servicio) => {
    let result = {
        "delete": {
            "tags": [servicio.tag],
            "summary": `Borrar ${servicio.model.toLowerCase()}`,
            "responses": {
                "204": { "$ref": "#/components/responses/NoContent" },
                "401": { "$ref": "#/components/responses/Unauthorized" },
                "403": { "$ref": "#/components/responses/Forbidden" },
                "404": { "$ref": "#/components/responses/NotFound" },
            }
        }
    }
    if (servicio.security || servicio.readonly)
        result.delete.security = [{ bearerAuth: [], cookieAuth: [] }]
    return result
}
const generaOptions = (servicio) => {
    let result = {
        "options": {
            "tags": [servicio.tag],
            "summary": "Sondeo CORS",
            "responses": {
                "200": { description: "OK" },
                "401": { "$ref": "#/components/responses/Unauthorized" },
                "403": { "$ref": "#/components/responses/Forbidden" },
            }
        }
    }
    if (servicio.security)
        result.options.security = [{ bearerAuth: [], cookieAuth: [] }]
    return result
}
const preparaService = (servicio) => {
    servicio.endpoint = servicio.endpoint.toLowerCase()
    if (!servicio.tag)
        servicio.tag = servicio.endpoint.toLowerCase();
    if (!servicio.models)
        servicio.models = servicio.endpoint;
    servicio.models = Capitalize(servicio.models)
    servicio.model = Capitalize(servicio.model)
    if (!servicio.summary)
        servicio.summary = `Mantenimiento de ${servicio.models.toLowerCase()}`;
    if (!servicio.operations || servicio.operations.length === 0)
        servicio.operations = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
}
const addComponents = (servicio) => {
    let schema;
    if (!servicio.schema) {
        schema = {
            type: "object", "properties": {
                [servicio.pk]: {
                    "type": "integer",
                    "format": "int32",
                    "minimum": 0,
                    "description": "El 0 actúa como autonumérico en la creación"
                },
            }
        }
        servicio.schema = schema
    } else {
        schema = { ...servicio.schema }
        if (schema.additionalProperties == undefined) schema.additionalProperties = false
        if (schema.properties[servicio.pk].type === "integer")
            schema.properties[servicio.pk].description = 'El 0 actúa como autonumérico en la creación'
        delete schema.required
    }
    schema.minProperties = 1

    swaggerDocument.components.schemas[servicio.model + 'Model'] = {
        "title": `${servicio.model} (Modelo)`,
        allOf: [{ "$ref": `#/components/schemas/${servicio.model}Projection` }],
    }
    if (servicio.schema.required)
        swaggerDocument.components.schemas[servicio.model + 'Model'].required = servicio.schema.required
    swaggerDocument.components.schemas[servicio.model + 'Projection'] = schema
    swaggerDocument.components.schemas[servicio.model + 'Projection'].title = `${servicio.model} (Proyección)`
    swaggerDocument.components.schemas[servicio.models] = {
        "type": "array",
        "title": `${servicio.models} (Listado)`,
        "items": { "$ref": `#/components/schemas/${servicio.model}Projection` }
    }
    swaggerDocument.components.schemas[`${servicio.models}Page`] = {
        "type": "object",
        "title": `${servicio.models} (Página)`,
        "properties": {
            "content": { "$ref": `#/components/schemas/${servicio.models}` },
            "totalElements": {
                "type": "integer", "description": "Número total de elementos"
            },
            "totalPages": {
                "type": "integer", "description": "Número total de páginas"
            },
            "size": {
                "type": "integer", "description": "Tamaño de página en elementos"
            },
            "number": {
                "type": "integer", "description": "Número de página actual"
            },
            "numberOfElements": {
                "type": "integer", "description": "Número total de elementos en la página"
            },
            "empty": {
                "type": "boolean", "description": "Si la página está vacía"
            },
            "first": {
                "type": "boolean", "description": "Si la página es la primera"
            },
            "last": {
                "type": "boolean", "description": "Si la página es la última"
            }
        }
    }
}
const addServiceDocumentation = (servicio, dirAPIs) => {
    preparaService(servicio);
    addComponents(servicio);
    let sinID = {}
    let conID = {}
    if (servicio.operations.includes('GET')) {
        sinID = Object.assign(sinID, generaGetAll(servicio))
        conID = Object.assign(conID, generaGetOne(servicio))
    }
    if (servicio.operations.includes('POST'))
        sinID = Object.assign(sinID, generaPost(servicio))
    if (servicio.operations.includes('PUT')) {
        // sinID = Object.assign(sinID, generaGetAll(servicio))
        conID = Object.assign(conID, generaPut(servicio))
    }
    if (servicio.operations.includes('OPTIONS')) {
        sinID = Object.assign(sinID, generaOptions(servicio))
        conID = Object.assign(conID, generaOptions(servicio))
    }
    if (servicio.operations.includes('PATCH'))
        conID = Object.assign(conID, generaPatch(servicio))
    if (servicio.operations.includes('DELETE'))
        conID = Object.assign(conID, generaDelete(servicio))

    if (!swaggerDocument.tags.some(item => item.name === servicio.tag))
        swaggerDocument.tags.push({ name: servicio.tag, description: servicio.summary })
    if (Object.keys(sinID).length > 0)
        swaggerDocument.paths[`${dirAPIs}/${servicio.endpoint}`] = sinID
    if (Object.keys(conID).length > 0) {
        let pkType = "integer"
        if (servicio?.schema?.properties?.[servicio.pk]?.type)
            pkType = servicio.schema.properties[servicio.pk].type
        swaggerDocument.paths[`${dirAPIs}/${servicio.endpoint}/{id}`] = Object.assign({
            "parameters": [
                {
                    "name": "id",
                    "in": "path",
                    "required": true,
                    "description": "Identificador del recurso",
                    "schema": {
                        "type": pkType
                    }
                }
            ]
        }, conID)
    }
}
const generaSwaggerSpecification = (server, dirAPIs) => {
    swaggerDocument.servers[0].variables.port.default = server
    serviciosConfig.forEach(servicio => addServiceDocumentation(servicio, dirAPIs))
    const options = {
        swaggerDefinition: swaggerDocument, //  { openapi: '3.0.0' },
        apis: [`${__dirname}/seguridad.js`],
    };
    return swaggerJsdoc(options);
}

module.exports.generaSwaggerSpecification = (servidor, DIR_API_REST) => generaSwaggerSpecification(servidor, DIR_API_REST)
