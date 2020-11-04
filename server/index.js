const express = require('express');
const crypto = require('crypto');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const fetch = require('node-fetch');
const faunadb = require('faunadb');
const Stack = require('./stack');

async function saveUserInfo(user) {
    const q = faunadb.query;
    const client = new faunadb.Client({
        secret: process.env.FAUNA_SECRET_KEY
    });

    // Check and see if the doc exists.
    const doesUserExist = await client.query(q.Exists(q.Match(q.Index('user_by_id'), user)));

    if (!doesUserExist) {
        console.log(`new user being created`);

        await client.query(
            q.Create(q.Collection('users'), {
                data: { user }
            })
        );
    }
    // Fetch the document for-real
    // const document = await client.query(q.Get(q.Match(q.Index('user_by_id'), user)));
    // await client.query(
    //     q.Update(document.ref, {
    //         data: {
    //             visits: document.data.visits + 1
    //         }
    //     })
    // );
}

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
    saveUserInfo(user);

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
    const existingSocket = queue.find(
        (existingSocket) =>
            existingSocket.id === socket.id || socket.handshake.address === existingSocket.handshake.address
    );

    if (!existingSocket) {
        queue.push(socket);
        queue.print();
    }
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
        delaySearch(socket);
    } else {
        const peer = queue.next();

        // check for dupes and same IP
        if (socket.id === peer.id || socket.handshake.address === peer.handshake.address) {
            findChatPartner(socket);
        } else {
            const hash = crypto.createHash('sha256');
            const roomName = `room-${hash.update(`${socket.id}-${peer.id}`).digest('hex')}`;
            console.log('room created:', roomName);

            socket.join(roomName);
            peer.join(roomName);
            io.in(roomName).emit('chat start');
        }
    }
}

io.on('connection', (socket) => {
    pushToStack(socket);

    socket.emit('connection');
    console.log('A user connected');

    socket.on('find partner', () => {
        socket.emit('searching');
        findChatPartner(socket);
    });

    socket.on('new message', function (info) {
        const { user, msg } = info;

        io.emit('receive message', { user, msg, key: crypto.randomBytes(16).toString('hex') });
    });

    // socket.on('typing', (user) => {
    //     socket.emit('typing', user);
    // });

    // socket.on('stop typing', (user) => {
    //     socket.emit('stop typing', user);
    // });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

// START THE SERVER
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Express server listening on port ${port}`);
});
