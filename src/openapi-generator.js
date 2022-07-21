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
                "description": "Número de página, siendo 0 la primera",
                "required": false,
                "schema": {
                    "type": "integer",
                    "minimum": 0,
                    "default": 0
                }
            },
            "filas": {
                "in": "query",
                "name": "_rows",
                "description": "Número de filas por página",
                "required": false,
                "schema": {
                    "type": "integer",
                    "minimum": 0,
                    "default": 20
                }
            }

        },
        "securitySchemes": {
            "bearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT"
            }
        },
    },
    // "security": [{ bearerAuth: [] }]
}

const generaGetAll = (servicio) => {
    let result = {
        "get": {
            "tags": [servicio.tag],
            "summary": `Listar ${servicio.models}`,
            "parameters": [
                {
                    "$ref": `#/components/parameters/pagina`
                },
                {
                    "$ref": `#/components/parameters/filas`
                },
            ],
            "responses": {
                "200": {
                    "description": "OK",
                    "content": {
                        "application/json": {
                            "schema": {
                                "oneOf": [
                                    { "$ref": `#/components/schemas/Pagina_${servicio.models}` },
                                    { "$ref": `#/components/schemas/${Capitalize(servicio.models)}` }
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
    if(servicio.security)
        result.get.security = [{ bearerAuth: [] }]
    return result
}
const generaPost = (servicio) => {
    let result =  {
        "post": {
            "tags": [servicio.tag],
            "summary": `Crear ${servicio.model}`,
            "requestBody": {
                "content": {
                    "application/json": {
                        "schema": {
                            "$ref": `#/components/schemas/${servicio.model}`
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
    if(servicio.security || servicio.readonly)
        result.post.security = [{ bearerAuth: [] }]
    return result
}
const generaGetOne = (servicio) => {
    let result = {
        "get": {
            "tags": [servicio.tag],
            "summary": `Recuperar ${servicio.model}`,
            "responses": {
                "200": {
                    "description": "OK",
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": `#/components/schemas/${servicio.model}`
                            }
                        }
                    }
                },
                "401": { "$ref": "#/components/responses/Unauthorized" },
                "403": { "$ref": "#/components/responses/Forbidden" },
                "404": { "$ref": "#/components/responses/NotFound" },
            }
        }
    }
    if(servicio.security)
        result.get.security = [{ bearerAuth: [] }]
    return result
}
const generaPut = (servicio) => {
    let result =  {
        "put": {
            "tags": [servicio.tag],
            "summary": `Reemplazar ${servicio.model}`,
            "requestBody": {
                "content": {
                    "application/json": {
                        "schema": {
                            "$ref": `#/components/schemas/${servicio.model}`
                        }
                    }
                },
                "required": true,
            },
            "responses": {
                "204": { "$ref": "#/components/responses/NoContent" },
                "400": { "$ref": "#/components/responses/BadRequest" },
                "401": { "$ref": "#/components/responses/Unauthorized" },
                "403": { "$ref": "#/components/responses/Forbidden" },
                "404": { "$ref": "#/components/responses/NotFound" },
            }
        }
    }
    if(servicio.security || servicio.readonly)
        result.put.security = [{ bearerAuth: [] }]
    return result
}
const generaPatch = (servicio) => {
    let schema;
    if(servicio.schema) {
        schema = { ...servicio.schema }
        schema.properties = { ...servicio.schema.properties }
        if(schema.additionalProperties === undefined) schema.additionalProperties = false
        delete schema.required
        delete schema.properties[servicio.pk]
    } else {
        schema = { type: "object" }
    }
    let result =  {
        "patch": {
            "tags": [servicio.tag],
            "summary": `Actualiza parte de ${servicio.model}`,
            "requestBody": {
                "content": {
                    "application/json": {
                        "schema": schema
                    }
                },
                "required": true,
            },
            "responses": {
                "204": { "$ref": "#/components/responses/NoContent" },
                "400": { "$ref": "#/components/responses/BadRequest" },
                "401": { "$ref": "#/components/responses/Unauthorized" },
                "403": { "$ref": "#/components/responses/Forbidden" },
                "404": { "$ref": "#/components/responses/NotFound" },
            }
        }
    }
    if(servicio.security || servicio.readonly)
        result.patch.security = [{ bearerAuth: [] }]
    return result
}
const generaDelete = (servicio) => {
    let result =  {
        "delete": {
            "tags": [servicio.tag],
            "summary": `Borrar ${servicio.model}`,
            "responses": {
                "204": { "$ref": "#/components/responses/NoContent" },
                "401": { "$ref": "#/components/responses/Unauthorized" },
                "403": { "$ref": "#/components/responses/Forbidden" },
            }
        }
    }
    if(servicio.security || servicio.readonly)
        result.delete.security = [{ bearerAuth: [] }]
    return result
}
const generaOptions = (servicio) => {
    let result =  {
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
    if(servicio.security)
        result.options.security = [{ bearerAuth: [] }]
    return result
}
const preparaService = (servicio) => {
    if (!servicio.tag)
        servicio.tag = servicio.endpoint.toLowerCase();
    if (!servicio.models)
        servicio.models = servicio.endpoint;
    if (!servicio.summary)
        servicio.summary = `Mantenimiento de ${Capitalize(servicio.models)}`;
    if (!servicio.operations || servicio.operations.length === 0)
        servicio.operations = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
}

const addServiceDocumentation = (servicio, dirAPIs) => {
    preparaService(servicio);

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
                    "schema": {
                        "type": pkType
                    }
                }
            ]
        }, conID)
    }
    swaggerDocument.components.schemas[Capitalize(servicio.models)] = { "type": "array", "items": { "$ref": `#/components/schemas/${servicio.model}` } }
    swaggerDocument.components.schemas[`Pagina_${servicio.models}`] = {
        "type": "object",
        "title": `Pagina de ${servicio.models}`,
        "properties": {
            "content": {
                "$ref": `#/components/schemas/${Capitalize(servicio.models)}`,
                "description": "Listado de elementos"
            },
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
    // swaggerDocument.components.requestBodies[servicio.model] = { "type": "object" }
    swaggerDocument.components.schemas[servicio.model] = servicio.schema || {
        "type": "object", additionalProperties: true, required: [servicio.pk], "properties": {
            [servicio.pk]: {
                "type": "integer",
                "format": "int32",
                "minimum": 0,
                "description": "El 0 actúa como autonumérico en la creación"
            },            
        }
    }
    if (swaggerDocument.components.schemas[servicio.model].properties[servicio.pk].type === "integer")
        swaggerDocument.components.schemas[servicio.model].properties[servicio.pk].description = 'El 0 actúa como autonumérico en la creación'
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
