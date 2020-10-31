import React, { useEffect, useState } from 'react';
import useSocket from 'use-socket.io-client';
import { useImmer } from 'use-immer';

export default function Chat({ video = false }) {
    console.log(process.env);
    const [socket] = useSocket('ws://localhost:3000');
    socket.connect();

    const [user, setUser] = useState('');
    const [isConnected, setConnection] = useState(false);
    const [isConnectedToPartner, setPartnerConnection] = useState(false);
    const [message, setMessage] = useState('');
    const [isTyping, setTyping] = useState(false);
    const [messages, setMessages] = useImmer([]);

    useEffect(() => {
        // const info = await fetch('/ipinfo')
        //     .then((res) => res.json())
        //     .catch((err) => err);

        setUser(socket.id);
    }, []);

    useEffect(() => {
        // add updated messages
        socket.on('receive message', (message) =>
            setMessages((draft) => {
                draft.push(message);
            })
        );

        socket.on('connection', () => setConnection(true));

        socket.on('chat start', () => setPartnerConnection(true));

        // show the typing message if the one typing is not the user
        socket.on('typing', (userName) => setTyping(userName !== user));

        return () => {
            socket.off('receive message');
            socket.off('typing');
            socket.off('chat start');
            socket.off('connection');
        };
    });

    function sendMessage(msg) {
        socket.emit('new message', { user, msg });
    }

    function formHandler(e) {
        e.preventDefault();

        sendMessage(message);
        setMessage('');
    }

    function typingHandler(e) {
        socket.emit('typing', user);

        if (e.which === 13) {
            sendMessage(message);
            setMessage('');

            socket.emit('stop typing', user);
        }
    }

    function inputHandler(e) {
        setMessage(e.target.value);
    }

    function SystemMessage() {
        if (isConnected) {
            if (isConnectedToPartner) {
                return "You're now chatting with a random stranger.";
            } else {
                return 'Looking for someone you can chat with...';
            }
        } else {
            return 'Connecting to server...';
        }
    }

    return (
        <div className={`chat__wrapper ${video ? 'video' : ''}`}>
            {video && (
                <div className="video__container">
                    <video autoPlay />
                    <video autoPlay id="selfvideo" />
                </div>
            )}
            <div className="text__chat--container">
                <div className="text__chat">
                    <div className="message__container">
                        <p className="message message__system">
                            <SystemMessage />
                        </p>
                    </div>

                    {messages.map((message) => {
                        return (
                            <div
                                className={`message__container ${user === message.user ? 'you' : ''}`}
                                key={message.key}
                            >
                                <p
                                    className={`message ${
                                        user === message.user ? 'message__you' : 'message__stranger'
                                    }`}
                                >
                                    {message.msg}
                                </p>
                            </div>
                        );
                    })}
                    {isTyping && <p>Stranger is typing...</p>}
                </div>
                <form className="text__chat--controls" onSubmit={formHandler}>
                    <button type="button">New</button>
                    <textarea onChange={inputHandler} value={message} onKeyDown={typingHandler} />
                    <button type="submit" disabled={message === '' || !isConnectedToPartner || !isConnected}>
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}
