const os = require('os');
const { access, constants } = require('fs/promises');
const rateLimit = require('express-rate-limit')
const { WebSocketServer, WebSocket } = require('ws');
const { Faker, faker, es } = require('@faker-js/faker');
const { randomInt } = require('crypto');
const config = require('../config')
const fakerES = new Faker({ locale: [es], });

module.exports.createWSServer = app => {
    // limitación de velocidad para evitar ataques de denegación de servicio
    app.use(rateLimit({
        windowMs: 1 * 60 * 1000, // 1 minutes
        max: 1000, // Limit each IP to 100 requests per `window` (here, per 1 minutes)
        standardHeaders: false, // Disable rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    }))

    app.get('/ws/xss.min.js', async (_req, res) => {
        try {
            await access(config.paths.APP_ROOT + '/node_modules/xss/dist/xss.min.js', constants.R_OK);
            res.sendFile(config.paths.APP_ROOT + '/node_modules/xss/dist/xss.min.js');
        } catch {
            res.sendFile('/node_modules/xss/dist/xss.min.js');
        }
    });
    app.get('/ws/chat', (_req, res) => {
        res.sendFile(config.paths.APP_ROOT + '/static/chat.html');
    });
    app.get('/ws/auto-chat', (_req, res) => {
        res.sendFile(config.paths.APP_ROOT + '/static/chat.html');
    });
    app.get('/ws/dashboard', (_req, res) => {
        res.sendFile(config.paths.APP_ROOT + '/static/dashboard.html');
    });
    app.get('/ws/listener', (_req, res) => {
        res.sendFile(config.paths.APP_ROOT + '/static/listener.html');
    });

    const wss = new WebSocketServer({ server: app.server });
    const generaAleatorio = (rango = 100) => randomInt(0, rango);
    const dashboard = { count: 0, interval: null }
    const resources = { count: 0, interval: null }
    const autoChat = { count: 0, interval: null }

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
    function broadcastExcludeById(data) {
        wss.clients.forEach(client => {
            if (client.clientId != data.clientId) {
                client.send(JSON.stringify(data), { binary: false });
            }
        });
    }

    function wssDashboard(ws) {
        if (dashboard.count) return;
        console.log('stating client interval');
        dashboard.count++;
        dashboard.interval = setInterval(function () {
            broadcastInclude(ws, JSON.stringify(['developer', 'staging', 'production 1', 'production 2']
                .map(srv => ({
                    name: srv,
                    cpu: generaAleatorio(),
                    memory: generaAleatorio(),
                    disk: generaAleatorio(),
                    network: generaAleatorio(),
                }))), false);
        }, 1000);
        ws.on('close', function () {
            dashboard.count--;
            if (!dashboard.count && dashboard.interval) {
                console.log('stopping client interval');
                clearInterval(dashboard.interval);
                dashboard.interval = null;
            }
        });
    }

    function wssResources(ws) {
        if (resources.count) return;
        console.log('stating client interval');
        resources.count++;
        resources.interval = setInterval(function () {
            broadcastInclude(ws, JSON.stringify({ memory: process.memoryUsage(), cpu: os.cpus() }), false);
        }, 500);
        ws.on('close', function () {
            resources.count--;
            if (!resources.count && resources.interval) {
                console.log('stopping client interval');
                clearInterval(resources.interval);
                resources.interval = null;
            }
        });
    }

    function wssChat(ws, clientId, channel) {
        ws.clientId = clientId;
        ws.send(JSON.stringify({ clientId: 0, message: `Te has conectado al canal ${channel} como ${clientId}` }));
        ws.on('message', function (message, isBinary) {
            console.log(`Received message of ${ws.clientId} to ${ws.channel}: ${message}`);
            // broadcastInclude(ws, message, isBinary)
            broadcastExclude(ws, JSON.stringify({ clientId: ws.clientId, message: `${message}` }), isBinary);
        });
        ws.on('close', () => console.log('stopping client chat'));
    }

    function wssAutoChat(ws, clientId, channel) {
        if (autoChat.count) return;
        ws.clientId = clientId;
        autoChat.count++;
        ws.send(JSON.stringify({ clientId: 0, message: `Te has conectado al canal ${channel} como ${clientId}` }));
        ws.on('message', function (message, isBinary) {
            console.log(`Received message of ${ws.clientId} to ${ws.channel}: ${message}`);
            broadcastExclude(ws, JSON.stringify({ clientId: ws.clientId, message: `${message}` }), isBinary);
        });
        ws.on('close', function () {
            if (autoChat.count > 1) {
                autoChat.count--;
            } else {
                console.log('stopping client chat');
                if (autoChat.interval) {
                    console.log('stopping char interval');
                    clearInterval(autoChat.interval);
                    autoChat.interval = null;
                    autoChat.count = 0;
                }
            }
        });
        if (!autoChat.interval)
            autoChat.interval = setInterval(function () {
                const clientRnd = generaAleatorio();
                try {
                    broadcastExcludeById({ clientId: clientRnd, message: `${clientRnd % 2 ? fakerES.company.catchPhrase() : fakerES.hacker.phrase()}` });
                } catch {
                    broadcastExcludeById({ clientId: clientRnd, message: `${clientRnd % 2 ? faker.company.catchPhrase() : faker.hacker.phrase()}` });
                }
            }, 2000);
    }

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
                wssResources(ws);
                break;
            case 'dashboard':
                wssDashboard(ws);
                break;
            case 'auto-chat':
                wssAutoChat(ws, clientId, channel);
                break;
            case 'chat':
                wssChat(ws, clientId, channel);
                break;
            default:
                ws.on('message', function (message, isBinary) {
                    broadcastInclude(ws, message, isBinary)
                });
                ws.on('close', () => console.log('stopping client chat'));
                break;
        }
        console.log(`started client ${channel}`);
    });
    return wss
}