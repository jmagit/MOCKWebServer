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
4. Navegar a http://localhost:4321/personas y a http://localhost:4321/personas/2 para comprobar el correcto funcionamiento del servicio. 

## Servicios RestFul
Para no crear dependencias de bases de datos los servicios utilizan ficheros como `data/personas.json`. El fichero se lee completo y se graba completo, no se ha optimizado el proceso. Los resultados de las peticiones se vuelcan a consola para facilitar las comprobaciones.
  
La estructura de datos del servicio personas:
* id: number
* nombre: string
* apellidos: string
* edad: number

### Para añadir nuevos servicios
1. En el subdirectorio `/data`, añadir un fichero .json con el array de objetos con los valores iniciales del resource.
2. Dar de alta el servicio añadiendo una entrada en el array lstServicio:
    * url: dirección del servicio
    * pk: propiedad del objeto que actúa como primary key
    * fich: referencia al fichero que actúa de contenedor
    * readonly: true cuando requiera autenticación para los métodos de escritura (POST, PUT, DELETE)
3. Rearrancar el servidor.

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
{"success":true,"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjoiYWRtaW4iLCJleHBpcmVzSW4iOiIxaCIsImlhdCI6MTUxODI2MzM0NX0.hz2Dp3PJ9ryems6IKNAWSwTYu7dzVfT40CPfN7lcKgs"}

## Autorespondedor
Similar al PHPInfo, genera una página con la información enviada al servidor, generalmente con un formulario, separando la información recibida en cabecera, querystring (GET) y cuerpo (POST).  
Está disponible en la página http://localhost:4321/form.

## Servidor de Ficheros
Se ha habilitado el subdirectorio `/public` para los ficheros que se deben servir directamente. Está mapeado a la raíz del servidor.
