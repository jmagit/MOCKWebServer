# Instrucciones para GitHub Copilot

Estas instrucciones describen las convenciones de este proyecto para que las sugerencias de código sean coherentes con la base existente.

## Idioma y comunicación

- Responde siempre en español en el chat, comentarios de revisión y explicaciones.
- Mantén un tono técnico, claro y breve.
- Si propones cambios, prioriza soluciones pequeñas, legibles y alineadas con el estilo actual del proyecto.

## Contexto del proyecto

- Proyecto Node.js para un servidor de pruebas y APIs mock.
- Versión mínima de Node.js: `>=24.15.0`.
- El punto de entrada es [`server.js`](/c:/Cursos/MOCKWebServer/server.js).
- La lógica principal está en [`src/`](/c:/Cursos/MOCKWebServer/src).
- La configuración del servicio y de datos vive en [`config.js`](/c:/Cursos/MOCKWebServer/config.js) y [`data/`](/c:/Cursos/MOCKWebServer/data).

## General Architecture & Structure

* **Layered Architecture:** The project follows a clear separation of concerns:
  * **`routes/`:** Handles HTTP request routing and middleware orchestration. It should only call service/controller methods.
  * **`controllers/`:** Contains the request handling logic (input validation, calling services, formatting responses). It should *not* contain business logic.
  * **`services/`:** Houses the core business logic. This layer orchestrates data flow and enforces business rules.
  * **`models/` (or `database/`):** Handles data access logic (interacting with the database/ORM).
  * **`utils/`:** Contains generic, reusable helper functions (e.g., date formatting, hashing).
* **Asynchronous Operations:** All I/O operations (database calls, API requests) must be handled using `async/await` within `try...catch` blocks for robust error handling.
* **Error Handling:**
  * Use custom error classes (e.g., `AppError`) for predictable, catchable errors.
  * The central error middleware must catch these custom errors and format the HTTP response correctly (status code, error message).
  * **Never** let an unhandled promise rejection escape the request lifecycle.

## Convenciones de JavaScript y Node.js

- Usa **CommonJS**: `require(...)` y `module.exports`.
- No introduzcas ESM (`import/export`) ni TypeScript salvo petición explícita.
- Usa `const` por defecto y `let` solo cuando haya reasignación.
- Mantén funciones pequeñas, con una sola responsabilidad.
- Prioriza código explícito y fácil de depurar frente a abstracciones innecesarias.
- Sigue el estilo ya presente en el repo: comillas simples, nombres descriptivos y preferencia por utilidades simples.
- Evita dependencias nuevas salvo que sean necesarias y estén justificadas.
- Reutiliza módulos existentes antes de crear helpers nuevos.

## Estilo del código

- Respeta las reglas de ESLint definidas en [`eslint.config.mjs`](/c:/Cursos/MOCKWebServer/eslint.config.mjs).
- Mantén compatibilidad con el ecosistema actual del proyecto:
  - scripts de Node en CommonJS
  - `module.exports` como estilo de exportación
  - uso de APIs globales de Node cuando ESLint así lo exige
- Conserva los nombres y patrones actuales del proyecto (`apis`, `servicio`, `req`, `res`, `next`, etc.) cuando encajen con el contexto.
- No mezcles refactorizaciones grandes con cambios funcionales pequeños.

## Code Style & Idioms (JavaScript/TypeScript)

* **Naming Conventions:**
  * **Functions/Methods:** `camelCase` (e.g., `getUserProfile`).
  * **Classes/Components:** `PascalCase` (e.g., `UserService`).
  * **Constants/Enums:** `SCREAMING_SNAKE_CASE` (e.g., `MAX_RETRIES`).
* **Imports:** Use absolute imports where possible (e.g., `@/services/userService`). Group imports logically: 1. Node/Built-ins, 2. External Libraries, 3. Local Modules.
* **Comments:** Use JSDoc blocks for all public functions, classes, and complex logic blocks, detailing `@param`, `@returns`, and `@throws`.
* **Immutability:** Favor immutable data structures. When modifying objects, use spread syntax (`{...obj, key: newValue}`) rather than direct mutation.

## Buenas prácticas de backend

- Usa `async/await` para flujo asíncrono y captura errores con `try/catch` cuando el flujo lo requiera.
- En middleware y rutas de Express, propaga los errores con `next(...)`.
- Mantén la validación cerca del punto de entrada de datos.
- Reutiliza las utilidades de errores de [`src/utils.js`](/c:/Cursos/MOCKWebServer/src/utils.js) para mantener respuestas homogéneas.
- Conserva el formato de errores basado en **Problem Details for HTTP APIs** (RFC 7807).
- No expongas detalles sensibles en producción.
- Respeta las capas actuales: enrutado, seguridad, acceso a datos y generación OpenAPI.

## API y Express

- Sigue los patrones existentes en [`src/app.js`](/c:/Cursos/MOCKWebServer/src/app.js) y [`src/apirest.js`](/c:/Cursos/MOCKWebServer/src/apirest.js).
- Mantén consistencia en códigos HTTP:
  - `200` para lectura correcta
  - `201` en creaciones
  - `204` en operaciones sin cuerpo de respuesta
  - `4xx/5xx` con errores normalizados
- Antes de añadir nuevas rutas o comportamientos, comprueba si ya existe una utilidad o convención equivalente.
- Si se modifica la API, revisa también la documentación OpenAPI generada y su impacto.

## Seguridad

- No elimines validaciones de seguridad existentes.
- Conserva el tratamiento actual de autenticación, autorización, CORS, XSRF y sanitización.
- Si añades entradas nuevas, valida y sanea los datos cuando aplique.
- Evita introducir respuestas o logs con credenciales, tokens o información sensible.

### Reglas especificas para la seguridad y validación

- **Validación de entrada:** **Todos** los cuerpos de las solicitudes entrantes, los parámetros de consulta y los parámetros de ruta deben validarse *en el punto de entrada* (controlador o middleware de validación dedicado). Utilice bibliotecas reconocidas (p. ej., `Joi`, `class-validator`).
- **Autenticación/Autorización:**
  - El middleware de autenticación debe ejecutarse *antes* de la lógica de negocio.
  - Las comprobaciones de autorización (p. ej., "¿Tiene este usuario el rol de `ADMIN`?") deben realizarse en la capa de **controlador** o **servicio**, nunca se deben dar por sentadas.
- **Gestión de datos:** Nunca confíe en la entrada del cliente. Siempre sanee y valide los datos antes de utilizarlos en consultas a la base de datos o mostrarlos al cliente.

## Datos y ficheros

- Los datos mock se almacenan en JSON dentro de [`data/`](/c:/Cursos/MOCKWebServer/data).
- Respeta el contrato actual de configuración en [`data/__servicios.json`](/c:/Cursos/MOCKWebServer/data/__servicios.json).
- Si añades un nuevo recurso, mantén la coherencia entre:
  - fichero JSON de datos
  - configuración del servicio
  - rutas REST
  - documentación OpenAPI

## Testing

- Usa **Jest** para pruebas.
- Coloca los tests en [`spec/`](/c:/Cursos/MOCKWebServer/spec) siguiendo el patrón `*.spec.js`.
- Cuando cambies comportamiento, añade o actualiza pruebas cercanas al módulo afectado.
- Prioriza tests de integración para rutas y tests unitarios para utilidades y lógica aislada.
- Mantén los tests legibles y centrados en comportamiento observable.

### Estrategia de pruebas

- **Pruebas unitarias:** Prueba funciones/métodos individuales de forma aislada (por ejemplo, una función de utilidad específica o un método de servicio sin acceder a la base de datos).
- **Pruebas de integración:** Prueba el flujo entre capas (por ejemplo, pruebe un controlador de ruta que llama a un servicio, el cual llama a un modelo).
- **Mocking:** Utiliza ampliamente frameworks de mocking para aislar dependencias (por ejemplo, simule la conexión a la base de datos al probar un controlador).

## Comandos habituales

- Instalar dependencias: `npm install`
- Ejecutar el servidor: `npm start`
- Reinicio en desarrollo: `npm run restart`
- Ejecutar lint: `npm run lint`
- Ejecutar tests: `npm test`
- Actualizar snapshots: `npm run test:snapshot`

## Qué evitar

- No introducir TypeScript, ESM o cambios de arquitectura sin pedirlo.
- No cambiar el estilo de exportación a clases o patrones distintos si no aportan valor claro.
- No duplicar lógica ya existente en `utils`, `seguridad`, `dbJSON` o generadores OpenAPI.
- No hacer refactors masivos sin relación con la tarea.
- No modificar nombres públicos, contratos de API o estructuras JSON sin revisar impacto en tests y documentación.

## Preferencias al generar código

- Propón primero la solución más sencilla que encaje con el diseño actual.
- Si hay varias alternativas, elige la más mantenible y menos invasiva.
- Cuando añadas código nuevo, acompáñalo de pruebas si cambia comportamiento observable.
- Si el cambio afecta a API, validación o seguridad, sé especialmente conservador.

## Summary Checklist for AI Generation

When generating code, please adhere to the following checklist:

1. [ ] **Structure:** Is the logic correctly separated into `routes` $\rightarrow$ `controllers` $\rightarrow$ `services`?
2. [ ] **Validation:** Is input validation present at the entry point?
3. [ ] **Error Handling:** Are `try...catch` blocks used for all async operations, and are custom errors thrown?
4. [ ] **Idioms:** Are JSDoc comments included for public APIs?
5. [ ] **Security:** Are all inputs treated as untrusted?
