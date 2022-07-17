const fileClient = require('./fileClient');

jest.mock('fs/promises');


const usuarios = [
    {
        "idUsuario": "admin",
        "password": "$2b$10$7EHNhM3dTSyGenDgmxzub.IfYloVNJrbvdjAF5LsrNBpu57JuNV1W",
        "nombre": "Administrador",
        "roles": ["Usuarios", "Administradores"]
    },
    {
        "idUsuario": "fake@kk.kk",
        "password": "$2b$10$5i7NYY8y3qmK3bmLmU8uMOHTawhPq7ddD7F6SfOf9ZKz76V8XssM6",
        "nombre": "Usuario registrado",
        "roles": ["Usuarios", "Empleados"]
    },
]

describe("Ejemplos de Mock ficheros", () => {
  let fsMock

  beforeEach(() => {
    jest.mock('fs/promises');
    fsMock = require('fs/promises')
    fsMock.__setMockFiles({
      './data/usuarios.json': JSON.stringify(usuarios),
    });
  });
  test('Mock readFile', async () => {
    const data = await fileClient.leer('./data/usuarios.json')
    // console.log(fsMock.__getMockFile('./data/usuarios.json'))
    expect(data.length).toBe(2);
  });
  test('Mock writeFile', async () => {
    await fileClient.escribir('./data/usuarios.json', JSON.stringify([usuarios[1]]))
    let data = JSON.parse(fsMock.__getMockFile('./data/usuarios.json'))
    // console.log(data)
    expect(data.length).toBe(1);
  });
});
