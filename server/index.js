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

app.get('/ipinfo', async (req, res) => {
    const ip = await fetch('https://api.ipify.org/?format=json')
        .then((res) => res.json())
        .catch((err) => err);

    const hash = crypto.createHash('sha256');
    const user = `0x${hash.update(ip.ip).digest('hex')}`;

    // save user to db
    // saveUserInfo(user);

    res.send({ statusCode: 200, body: JSON.stringify({ user }) });
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

function pushToStack(socket) {
    queue.push(socket);
    queue.print();
}

function removeFromStack(id) {
    queue.remove(id);
    queue.print();
}

let searchCount = 0;

function delaySearch(socket) {
    setTimeout(() => {
        searchCount++;

        if (searchCount >= 10) {
            return socket.emit('no partners');
        } else if (searchCount > 5) {
            socket.emit('still searching');
        }

        findChatPartner(socket);
    }, 2500);
}

function findChatPartner(socket) {
    if (queue.isEmpty()) {
        return delaySearch(socket);
    } else {
        const peer = queue.next();

        // if the sockets are the same IP, keep searching
        if (peer.handshake.address === socket.handshake.address) {
            return delaySearch(socket);
        }

        const hash = crypto.createHash('sha256');
        const roomName = `room-${hash.update(`${socket.id}-${peer.id}`).digest('hex')}`;
        console.log('\n');
        console.log('room created:', roomName);

        socket.join(roomName);
        peer.join(roomName);
        io.in(roomName).emit('chat start');

        return peer;
    }
}

io.on('connection', (socket) => {
    socket.partner = null;

    pushToStack(socket);

    socket.emit('connection');
    console.log('A user connected');

    socket.on('find partner', () => {
        socket.emit('searching');
        socket.partner = findChatPartner(socket);
    });

    socket.on('new message', function (info) {
        const { user, msg } = info;

        io.to(socket.id).emit('receive message', { user, msg, key: crypto.randomBytes(16).toString('hex') });
    });

    socket.on('typing', function () {
        socket.broadcast.to(socket.partner).emit('typing');
    });

    socket.on('stop typing', () => {
        socket.broadcast.to(socket.partner).emit('stop typing');
    });

    socket.on('disconnect', () => {
        if (socket.partner != null) {
            socket.broadcast.to(socket.partner).emit('typing', false);
            socket.broadcast
                .to(socket.partner)
                .emit('disconnecting now', 'Your Partner has disconnected . Refresh page to chat again');
        }

        removeFromStack(socket.id);
        console.log('user disconnected');
    });
});

// START THE SERVER
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Boho server listening on port ${port}`);
});
