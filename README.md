# MOCK Web Server NodeJS
Versión NodeJS del servidor de pruebas para cursos de FrontEnd
* Servicios RestFul para probar las conexiones AJAX
* Servicio de Autenticación JWT
* Autorespondedor de formularios.
* Servidor de ficheros

## Instalación
1. Descargar o clonar el repositorio
2. Ejecutar `npm install` para descargar las dependencias.
3. Ejecutar `npm start` o `npm serve` para levantar el servidor. 
4. Navegar a http://localhost:4321/ para comprobar el correcto funcionamiento de los servicios. 

## Servicios RestFul
Para no crear dependencias de bases de datos los servicios utilizan ficheros como `data/personas.json`. El fichero se lee completo y se graba completo, no se ha optimizado el proceso. Los resultados de las peticiones se vuelcan a consola para facilitar las comprobaciones.
  
La estructura de datos del servicio personas:
* id: number
* nombre: string
* apellidos: string
* edad: number

**Nota:** *En algunos casos es necesario marcar en la cabecera de la petición el **Content-Type** como **application/json**.*
### Filtrado, paginación y ordenación
Se han incorporado una serie de parámetros (querystring) para ampliar el control de los resultados del GET:
* ***propiedad=valor*:** Selecciona solo aquellos que el valor de la propiedad dada coincida con el valor proporcionado. Se pueden utilizar varios pares propiedad=valor, en cuyo caso deben cumplirse todos.
* **_search=*valor*:** Selecciona todos aquellos que alguna de sus propiedades contenga el valor proporcionado. Invalida las búsquedas por propiedades individuales.
* **_sort=*propiedad*:** Indica la propiedad por la que se ordenaran los resultados, en caso de omitirse se utilizará la propiedad que actúa como primary key. Si el nombre de la propiedad está precedido por un guion (signo negativo) la ordenación será descendente.
* **_page=*número*:** Número de página empezando en 0 (primera página). Si se omite pero aparece el parámetro *_rows* tomara el valor 0 por defecto.
* **_page=count:** Devuelve el número de páginas y filas de la fuente de datos. Si se omite el Número de filas por página tomara 20 por defecto. Ej:  
`{  
  "pages": 10,
  "rows": 99
}`
* **_rows=*número*:** Número de filas por página, por defecto 20 si se omite pero aparece el parámetro *_page*.
### Para añadir nuevos servicios
1. En el subdirectorio `/data`, añadir un fichero .json con el array de objetos con los valores iniciales del resource.
2. Dar de alta el servicio añadiendo una entrada en el array lstServicio:
    * url: dirección del servicio
    * pk: propiedad del objeto que actúa como primary key
    * fich: referencia al fichero que actúa de contenedor
    * readonly: true cuando requiera autenticación para los métodos de escritura (POST, PUT, DELETE)
3. Rearrancar el servidor.
4. Probar: http://localhost:4321/ws/nuevoservicio

### Seguridad
Para evitar conflictos con los navegadores se han habilitado las siguientes cabeceras CORS:
* Access-Control-Allow-Origin: _dominio-origen-de-la-petición_
* Access-Control-Allow-Headers: Origin, Content-Type, Accept, Authorization, X-Requested-With, X-SRF-TOKEN
* Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS'
* Access-Control-Allow-Credentials: true

## Autenticación
Para simular la autenticación con token JWT de cabecera está disponible el servicio `http://localhost:4321/login` con el método POST.
* action="http://localhost:4321/login"
* method="post"
* body="name=admin&password=P@$$w0rd"
#### Respuesta JSON:
{"success":true,"token":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjoiYWRtaW4iLCJleHBpcmVzSW4iOiIxaCIsImlhdCI6MTU0MzY5NjE0MH0.0KTIt4AGDM377AwBnrVS7woWyC-dEW0vUIcPBvJAbfg"}
#### Envío del token en la cabecera:
'Authorization':Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjoiYWRtaW4iLCJleHBpcmVzSW4iOiIxaCIsImlhdCI6MTU0MzY5NjE0MH0.0KTIt4AGDM377AwBnrVS7woWyC-dEW0vUIcPBvJAbfg
### Gestión de usuarios
En el fichero data/usuarios.json se mantiene la estructura básica de los usuarios registrados que se puede ampliar.

Mediante peticiones AJAX a http://localhost:4321/register se pueden:
* Registrar usuario (POST).
* Modificar usuario autenticado (PUT)
* Consultar usuario autenticado (GET)


## Autorespondedor
Similar al PHPInfo, genera una página con la información enviada al servidor, generalmente con un formulario, separando la información recibida en cabecera, querystring (GET) y cuerpo (POST).  
Está disponible en la página http://localhost:4321/form.

## Servidor de Ficheros
Se ha habilitado el subdirectorio `/public` para los ficheros que se deben servir directamente. Está mapeado a la raíz del servidor.
### Subir ficheros
Se pueden subir ficheros al servidor, mediante peticiones POST AJAX a http://localhost:4321/fileupload, requieren la cabecera **'Content-Type':'multipart/form-data'**.

Los ficheros se almacenan en el subdirectorio `/uploads` y son accesibles mediante la ruta http://localhost:4321/files.

Las peticiones GET a http://localhost:4321/fileupload mostrarán un formulario para subir ficheros.
