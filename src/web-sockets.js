const os = require('os');
const { WebSocketServer, WebSocket } = require('ws');
const { faker } = require('@faker-js/faker');
const config = require('../config')

module.exports.createWSServer = app => {
    app.get('/ws/chat', (_req, res) => {
        res.sendFile(config.paths.APP_ROOT + '/static/chat.html');
    });
    app.get('/ws/dashboard', (_req, res) => {
        res.sendFile(config.paths.APP_ROOT + '/static/dashboard.html');
    });
    app.get('/ws/listener', (_req, res) => {
        res.sendFile(config.paths.APP_ROOT + '/static/listener.html');
    });

    const wss = new WebSocketServer({ server: app.server });

    function broadcastInclude(ws, data, isBinary) {
        wss.clients.forEach(client => {
            if ((client.channel === 'listener' || client.channel === ws.channel) && client.readyState === WebSocket.OPEN) {
                client.send(data, { binary: isBinary });
            }
        });
    }
    function broadcastExclude(ws, data, isBinary) {
        wss.clients.forEach(client => {
            if (client !== ws && (client.channel === 'listener' || client.channel === ws.channel) && client.readyState === WebSocket.OPEN) {
                client.send(data, { binary: isBinary });
            }
        });
    }
    let dashboardCount = 0;
    let dashboardInterval = null;
    let autoChatCount = 0;
    let autoChatInterval = null;
    wss.on('connection', function (ws, req) {
        let path = req.url.toLocaleLowerCase().split('/')
        let index = path[1] === 'ws' ? 2 : 1
        let channel = path[index] ? path[index] : '(default)'
        let clientId = path[index + 1] ? path[index + 1] : '(unknown)'
        ws.channel = channel
        switch (channel) {
            case 'listener':
                if (clientId !== '(unknown)')
                    ws.channel = clientId;
                break;
            case 'resources':
                if (dashboardCount) break;
                console.log('stating client interval');
                dashboardCount++
                dashboardInterval = setInterval(function () {
                    broadcastInclude(ws, JSON.stringify({ memory: process.memoryUsage(), cpu: os.cpus() }), false);
                }, 500);
                ws.on('close', function () {
                    dashboardCount--
                    if (!dashboardCount && dashboardInterval) {
                        console.log('stopping client interval');
                        clearInterval(dashboardInterval);
                        dashboardInterval = null;
                    }
                });
                break;
            case 'dashboard':
                if (dashboardCount) break;
                console.log('stating client interval');
                dashboardCount++
                dashboardInterval = setInterval(function () {
                    broadcastInclude(ws, JSON.stringify(['developer', 'staging', 'production 1', 'production 2']
                        .map(srv => ({
                            name: srv,
                            cpu: Math.floor(Math.random() * 100),
                            memory: Math.floor(Math.random() * 100),
                            disk: Math.floor(Math.random() * 100),
                            network: Math.floor(Math.random() * 100),
                        }))), false);
                }, 1000);
                ws.on('close', function () {
                    dashboardCount--
                    if (!dashboardCount && dashboardInterval) {
                        console.log('stopping client interval');
                        clearInterval(dashboardInterval);
                        dashboardInterval = null;
                    }
                });
                break;
            case 'autochat':
                if (autoChatCount) break;
                console.log('stating chat interval');
                autoChatCount++
                autoChatInterval = setInterval(function () {
                    const clientId = parseInt(Math.random() * 100)
                    broadcastInclude(ws, JSON.stringify({ clientId, message: `${clientId % 2 ? faker.company.buzzPhrase() : faker.hacker.phrase()}` }), false)
                }, 1000);
                ws.on('close', function () {
                    autoChatCount--
                    if (!autoChatCount && autoChatInterval) {
                        console.log('stopping char interval');
                        clearInterval(autoChatInterval);
                        autoChatInterval = null;
                    }
                });
                break;
            case 'chat':
                ws.clientId = clientId
                ws.send(JSON.stringify({ clientId: 0, message: `Te has conectado al canal ${channel} como ${clientId}` }));
                ws.on('message', function (message, isBinary) {
                    console.log(`Received message of ${ws.clientId} to ${ws.channel}: ${message}`);
                    // broadcastInclude(ws, message, isBinary)
                    broadcastExclude(ws, JSON.stringify({ clientId: ws.clientId, message: `${message}` }), isBinary)
                });
                ws.on('close', () => console.log('stopping client chat'));
                break;
            default:
                ws.on('message', function (message, isBinary) {
                    // console.log(`Received message of ${ws.clientId} to ${ws.channel}: ${message}`);
                    broadcastInclude(ws, message, isBinary)
                });
                ws.on('close', () => console.log('stopping client chat'));
                break;
        }
        console.log(`started client ${channel}`);
    });
    return wss
}