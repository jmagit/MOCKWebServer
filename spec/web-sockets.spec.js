const request = require('superwstest');
const app = require('../src/app');

describe('Web Sockets', () => {
    beforeEach((done) => {
        app.server.listen(4444, done);
    });

    afterEach((done) => {
        app.server.close(done);
    });

    it('dashboard', async () => {
        await request(app.wss)
            .ws('/ws/dashboard')
            .wait(2010)
            .close()
            .expectClosed();
    });
    it('resources', async () => {
        await request(app.wss)
            .ws('/ws/resources')
            .wait(2010)
            .close()
            .expectClosed();
    });
    it('listener', async () => {
        await request(app.wss)
            .ws('/ws/listener/dashboard')
            .close()
            .expectClosed();
    });
    it('chat', async () => {
        await request(app.wss)
            .ws('/ws/chat/2')
            .sendText('Hola mundo')
            .close()
            .expectClosed();
    });
    it('auto-chat', async () => {
        await request(app.wss)
            .ws('/ws/auto-chat/2')
            .sendText('Hola mundo')
            .wait(2010)
            .close()
            .expectClosed();
    });
    it('otros', async () => {
        await request(app.wss)
            .ws('/ws/otros')
            .sendText('Hola mundo')
            .expectText('Hola mundo')
            .close()
            .expectClosed();
    });
    // it('auto-chat', done => {
    //     const wsClient = require('socket.io-client')('http://localhost:4444/ws/auto-chat/2');
    //     wsClient.on('connection', () => console.log('Client connected'));
    //     wsClient.emit('PING', '');
    //     wsClient.on('PONG', (data) => {
    //     console.log(`${data}`);
    //     done();
    //     });
    // });
});