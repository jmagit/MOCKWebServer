const serviciosConfig = require('./data/__servicios.json');

const swaggerDocument = {
    "openapi": "3.0.0",
    "info": {
        "title": "Web4Testing",
        "version": "1.0.0",
        "description": "Servidor demos de **pruebas** para los cursos de front-end",
        "license": {
            "name": "Apache 2.0",
            "url": "https://www.apache.org/licenses/LICENSE-2.0.html"
        },
    },
    "servers": [
        {
            "url": "http://localhost:4321/api",
            "description": "Local"
        }
    ],
    "tags": [],
    "paths": {},
    "components": {
        "schemas": {
            "error message": {
                "type": "object",
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
            "No content": {
                "description": "No content"
            },
            "Bad request": {
                "description": "Invalid data",
                "content": {
                    "application/json": {
                        "schema": {
                            "$ref": "#/components/schemas/error message"
                        }
                    }
                }
            },
            "Unauthorized": {
                "description": "Unauthorized",
                "content": {
                    "application/json": {
                        "schema": {
                            "$ref": "#/components/schemas/error message"
                        }
                    }
                }
            },
            "Forbidden": {
                "description": "Forbidden",
                "content": {
                    "application/json": {
                        "schema": {
                            "$ref": "#/components/schemas/error message"
                        }
                    }
                }
            },
            "Not found": {
                "description": "Not found",
                "content": {
                    "application/json": {
                        "schema": {
                            "$ref": "#/components/schemas/error message"
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
    }
}

const generaGetAll = (servicio) => {
    return {
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
                                {"$ref": `#/components/schemas/pagina de ${servicio.models}`},
                                {"$ref": `#/components/schemas/${servicio.models}`}
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
}
const generaPost = (servicio) => {
    return {
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
                "400": { "$ref": "#/components/responses/Bad request" },
                "401": { "$ref": "#/components/responses/Unauthorized" },
                "403": { "$ref": "#/components/responses/Forbidden" },
            }
        }
    }
}
const generaGetOne = (servicio) => {
    return {
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
                "404": { "$ref": "#/components/responses/Not found" },
            }
        }
    }
}
const generaPut = (servicio) => {
    return {
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
                "204": { "$ref": "#/components/responses/No content" },
                "400": { "$ref": "#/components/responses/Bad request" },
                "401": { "$ref": "#/components/responses/Unauthorized" },
                "403": { "$ref": "#/components/responses/Forbidden" },
                "404": { "$ref": "#/components/responses/Not found" },
            }
        }
    }
}
const generaPatch = (servicio) => {
    return {
        "patch": {
            "tags": [servicio.tag],
            "summary": `Actualiza parte de ${servicio.model}`,
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
                "204": { "$ref": "#/components/responses/No content" },
                "400": { "$ref": "#/components/responses/Bad request" },
                "401": { "$ref": "#/components/responses/Unauthorized" },
                "403": { "$ref": "#/components/responses/Forbidden" },
                "404": { "$ref": "#/components/responses/Not found" },
            }
        }
    }
}

const generaDelete = (servicio) => {
    return {
        "delete": {
            "tags": [servicio.tag],
            "summary": `Borrar ${servicio.model}`,
            "responses": {
                "204": { "$ref": "#/components/responses/No content" },
                "401": { "$ref": "#/components/responses/Unauthorized" },
                "403": { "$ref": "#/components/responses/Forbidden" },
            }
        }
    }
}

const addOpenApi = (servicio) => {
    if (!servicio.tag) servicio.tag = servicio.endpoint
    if (!servicio.models) servicio.models = servicio.endpoint
    if (!servicio.summary) servicio.summary = `Mantenimiento de ${servicio.models}`
    swaggerDocument.tags.push({ name: servicio.tag, description: servicio.summary })
    swaggerDocument.paths[`/${servicio.endpoint}`] = Object.assign({}, generaGetAll(servicio), generaPost(servicio))
    swaggerDocument.paths[`/${servicio.endpoint}/{id}`] = Object.assign({
        "parameters": [
            {
                "name": "id",
                "in": "path",
                "required": true,
                "schema": {
                    "type": "integer",
                    "minimum": 0
                }
            }
        ]
    }, generaGetOne(servicio), generaPut(servicio), generaPatch(servicio), generaDelete(servicio))
    swaggerDocument.components.schemas[servicio.models] = { "type": "array", "items": { "$ref": `#/components/schemas/${servicio.model}` } }
    swaggerDocument.components.schemas[`pagina de ${servicio.models}`] = {
        "type": "object",
        "properties": {
            "content": { 
                "$ref": `#/components/schemas/${servicio.models}`,
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
        "type": "object", "properties": {
            [servicio.pk]: {
                "type": "integer",
                "format": "int32",
                "minimum": 0,
                "description": "El 0 actúa como autonumérico en la creación"
            }
        }
    }
    if(swaggerDocument.components.schemas[servicio.model].properties[servicio.pk].type === "integer")
        swaggerDocument.components.schemas[servicio.model].properties[servicio.pk].description = 'El 0 actúa como autonumérico en la creación'
}
const generaSwaggerDocument = () => {
    serviciosConfig.forEach(servicio => addOpenApi(servicio))
    return swaggerDocument;
}

module.exports.generaSwaggerDocument = generaSwaggerDocument
module.exports.swaggerDocument = swaggerDocument
