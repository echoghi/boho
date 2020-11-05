const express = require('express');
const crypto = require('crypto');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const fetch = require('node-fetch');
const Stack = require('./stack');

app.get('/count', async (req, res) => {
    const socketIDs = Object.keys(io.sockets.connected);
    const count = socketIDs.length;

    res.send({ statusCode: 200, count, socketIDs });
});

app.post('/ipinfo', (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const hash = crypto.createHash('sha256');
    const user = `0x${hash.update(ip).digest('hex')}`;
    console.log(ip, user);
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
    queue.push({ socket: socket, user });
    queue.print();
}

function removeFromStack(id) {
    queue.remove(id);
}

let searchCount = 0;
let roomName = '';

function delaySearch(socket, user) {
    setTimeout(() => {
        searchCount++;

        if (searchCount >= 10) {
            return socket.emit('no partners');
        } else if (searchCount > 5) {
            socket.emit('still searching');
        }

        findChatPartner(socket, user);
    }, 2500);
}

function findChatPartner(socket, user) {
    if (queue.isEmpty()) {
        return delaySearch(socket, user);
    } else {
        const peer = queue.next();
        console.log('socketIsSameUser', user === peer.user);
        // if the sockets are the same IP, keep searching
        if (peer.user === user) {
            return delaySearch(socket, user);
        }

        const hash = crypto.createHash('sha256');
        roomName = `room-${hash.update(`${user}-${peer.user}`).digest('hex')}`;
        console.log('\n');
        console.log('room created:', roomName);

        socket.join(roomName);
        peer.socket.join(roomName);
        io.in(roomName).emit('chat start');
    }
}

io.on('connection', (socket) => {
    socket.emit('connection');

    socket.on('find partner', (user) => {
        pushToStack(socket, user);
        socket.emit('searching');

        findChatPartner(socket, user);
    });

    socket.on('new message', function (info) {
        const { user, msg } = info;

        io.to(roomName).emit('receive message', { user, msg, key: crypto.randomBytes(16).toString('hex') });
    });

    socket.on('typing', function () {
        if (roomName) io.to(roomName).emit('typing');
    });

    socket.on('stop typing', () => {
        if (roomName) io.to(roomName).emit('stop typing');
    });

    socket.on('disconnect', () => {
        io.to(roomName).emit('stop typing');
        io.to(roomName).emit('disconnecting now', 'Your Partner has disconnected . Refresh page to chat again');

        removeFromStack(socket.id);
        roomName = '';
    });
});

// START THE SERVER
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Boho server listening on port ${port}`);
});
