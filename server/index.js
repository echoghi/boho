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

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.broadcast.emit("You're now chatting with a random stranger.");

    socket.on('new message', function (info) {
        const { user, msg } = info;

        io.emit('receive message', { user, msg, key: crypto.randomBytes(16).toString('hex') });
    });

    // when the client emits 'typing', we broadcast it to others
    socket.on('typing', (user) => {
        io.emit('typing', user);
    });

    // when the client emits 'stop typing', we broadcast it to others
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
