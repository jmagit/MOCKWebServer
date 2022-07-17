const fs = jest.createMockFromModule('fs/promises');

let mockFiles = Object.create(null);
function __setMockFiles(newMockFiles) {
  mockFiles = newMockFiles
}

function readFile(file) {
  if(mockFiles[file]) {
   return Promise.resolve(mockFiles[file])
  } else {
    return Promise.reject(new Error('File not found'))
  }
}
function writeFile(file, data) {
  if(mockFiles[file]) {
    mockFiles[file] = data
   return Promise.resolve()
  } else {
    return Promise.reject(new Error('File not found'))
  }
}

fs.__setMockFiles = __setMockFiles;
fs.__getMockFile = file => mockFiles[file];
fs.readFile = readFile;
fs.writeFile = writeFile;

module.exports = fs;