const express = require('express');
const crypto = require('crypto');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const fetch = require('node-fetch');
const faker = require('faker');
const Stack = require('./stack');

app.set('trust proxy', true);

app.get('/count', async (req, res) => {
    const socketIDs = Object.keys(io.sockets.connected);
    const count = socketIDs.length;

    res.send({ statusCode: 200, count, socketIDs });
});

app.get('/ipinfo', (req, res) => {
    const ip = req.ip;
    const fakeIp = faker.internet.ip();
    const hash = crypto.createHash('sha256');
    const user = `0x${hash.update(fakeIp).digest('hex')}`;
    console.log(ip, fakeIp);
    res.send({ statusCode: 200, body: { user } });
});

if (process.env.NODE_ENV === 'production') {
    // Serve built client files
    // Serves index.html by default from "/" route
    app.use(express.static('dist'));
} else {
    // Let Parcel handle requests
    const Bundler = require('parcel-bundler');
    const bundler = new Bundler('index.html');
    app.use(bundler.middleware());
}

const queue = new Stack();

function pushToStack(socket, user) {
    socket.searchCount = 0;
    queue.push({ socket: socket, user });
    queue.print();
}

function removeFromStack(id) {
    queue.remove(id);
}

function delaySearch(socket, user) {
    setTimeout(() => {
        socket.searchCount++;

        if (socket.searchCount >= 10) {
            socket.searchCount = 0;
            return io.to(socket.id).emit('no partners');
        } else if (socket.searchCount > 5) {
            io.to(socket.id).emit('still searching');
        }

        findChatPartner(socket, user);
    }, 2500);
}

function findChatPartner(socket, user) {
    if (queue.isEmpty()) {
        return delaySearch(socket, user);
    } else {
        const nextUp = queue.peek();
        console.log('socketIsSameUser', user === nextUp.user);
        // if the sockets are the same IP, keep searching
        if (nextUp.user === user) {
            return delaySearch(socket, user);
        }

        const peer = queue.next();
        socket.partner = peer.socket;

        const hash = crypto.createHash('sha256');
        const roomName = `room-${hash.update(`${user}-${peer.user}`).digest('hex')}`;
        console.log('\n');
        console.log('room created:', roomName);

        socket.roomName = roomName;
        socket.searchCount = 0;

        socket.join(roomName);
        socket.partner.join(roomName);

        io.to(socket.id).emit('chat start', roomName);
        io.to(socket.partner.id).emit('chat start', roomName);
        io.to(roomName).emit('chat start', roomName);
    }
}

io.on('connection', (socket) => {
    socket.emit('connection');

    socket.on('find partner', (user) => {
        pushToStack(socket, user);
        io.to(socket.id).emit('searching');

        findChatPartner(socket, user);
    });

    socket.on('new message', (info) => {
        const { user, msg } = info;

        io.to(socket.roomName).emit('receive message', { user, msg, key: crypto.randomBytes(16).toString('hex') });
    });

    socket.on('typing', (user) => {
        if (socket.roomName) io.to(socket.roomName).emit('typing', user);
    });

    socket.on('stop typing', () => {
        if (socket.roomName) io.to(socket.roomName).emit('stop typing');
    });

    socket.on('disconnect', () => {
        if (socket.partner) {
            io.to(socket.partner.id).emit('stop typing');
            io.to(socket.partner.id).emit('disconnecting now');
        }

        removeFromStack(socket.id);
        socket.roomName = '';
    });
});

// START THE SERVER
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Boho server listening on port ${port}`);
});
