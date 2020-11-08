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
    socket.user = user;
    queue.push({ socket: socket, user });
    queue.print();
}

function removeFromStack(id) {
    queue.remove(id);
}

function delaySearch(socket, user) {
    setTimeout(() => {
        socket.searchCount++;

        if (socket.partner) {
            socket.searchCount = 0;
            return io.to(socket.roomName).emit('chat start', socket.roomName);
        }

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
        // look at the next partner without mutating the queue
        const nextUp = queue.peek();

        // if the sockets are the same IP, keep searching
        if (nextUp.user === user) {
            return delaySearch(socket, user);
        }

        // get the peer socket and remove both both from queue
        const peer = queue.next();
        queue.remove(socket.id);

        socket.partner = peer.socket;
        peer.partner = socket;

        // create room name
        const hash = crypto.createHash('sha256');
        const roomName = `room-${hash.update(`${user}-${peer.user}`).digest('hex')}`;

        socket.roomName = roomName;
        peer.roomName = roomName;
        socket.searchCount = 0;

        socket.join(roomName);
        socket.partner.join(roomName);

        console.log('\n');
        console.log('MATCH MADE!!!');

        io.to(socket.roomName).emit('chat start', socket.roomName);
    }
}

io.on('connection', (socket) => {
    socket.emit('connection');

    socket.on('find partner', (user) => {
        io.to(socket.id).emit('searching');

        findChatPartner(socket, user);
        pushToStack(socket, user);
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

    socket.on('disconnecting now', () => {
        if (socket.partner) {
            io.to(socket.roomName).emit('disconnecting now', socket.user);
            socket.leave(socket.roomName);
            socket.partner.leave(socket.roomName);

            socket.partner = null;
            socket.roomName = '';
        }
    });

    socket.on('disconnect', () => {
        if (socket.partner) {
            io.to(socket.roomName).emit('disconnecting now', socket.user);
            socket.partner = null;
            socket.user = null;
            socket.roomName = '';
        }

        removeFromStack(socket.id);
    });
});

// START THE SERVER
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Boho server listening on port ${port}`);
});
