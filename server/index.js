const express = require('express');
const crypto = require('crypto');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const fetch = require('node-fetch');

app.get('/ipinfo', async (req, res) => {
    const ip = await fetch('https://api.ipify.org/?format=json')
        .then((res) => res.json())
        .catch((err) => err);

    const hash = crypto.createHash('sha256');
    const user = `0x${hash.update(ip.ip).digest('hex')}`;

    res.send(JSON.stringify({ user }));
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

const queue = [];

const log = (arr) => {
    console.log('Queue: ');
    for (let i = arr.length; i--; ) {
        console.log(arr[i].id);
    }
    console.log('\n');
};

function findChatPartner(socket) {
    if (queue.length > 0) {
        const peer = queue.pop();
        console.log(peer.id + ' was popped from queue\n');
        log(queue);

        const hash = crypto.createHash('sha256');
        const roomName = `room-${hash.update(`${socket.id}-${peer.id}`).digest('hex')}`;
        console.log(roomName);

        socket.join(roomName);
        peer.emit('chat start', { name: socket.id, room: room });
        socket.emit('chat start', { name: peer.id, room: room });
    } else {
        queue.push(socket);
        console.log(socket.id + ' was pushed to queue\n');
        log(queue);
    }
}

io.on('connection', (socket) => {
    queue.push(socket);
    socket.emit('connection');
    console.log('A user connected');

    socket.on('find partner', () => {
        findChatPartner(socket);
    });

    socket.on('new message', function (info) {
        const { user, msg } = info;

        io.emit('receive message', { user, msg, key: crypto.randomBytes(16).toString('hex') });
    });

    socket.on('typing', (user) => {
        io.emit('typing', user);
    });

    socket.on('stop typing', (user) => {
        io.emit('stop typing', user);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

// START THE SERVER
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Express server listening on port ${port}`);
});
