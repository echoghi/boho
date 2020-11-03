import React, { useEffect, useState, useRef } from 'react';
import useSocket from 'use-socket.io-client';
import { useImmer } from 'use-immer';

export default function Chat({ isVideoChat = false }) {
    const socketURL = process.env.NODE_ENV === 'development' ? 'ws://localhost:3000' : 'ws://134.122.119.104';
    const [socket] = useSocket(socketURL);
    socket.connect();

    const videoRef = useRef();
    const [user, setUser] = useState('');
    const [isConnected, setConnection] = useState(false);
    const [isConnectedToPartner, setPartnerConnection] = useState(false);
    const [systemMessage, setSystemMessage] = useState('Connecting to server...');
    const [message, setMessage] = useState('');
    const [isTyping, setTyping] = useState(false);
    const [messages, setMessages] = useImmer([]);

    // request user video feed
    useEffect(async () => {
        if (!videoRef || !isVideoChat) {
            return;
        }

        try {
            // navigator.mediaDevices only available on prod with HTTPS
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            const video = videoRef.current;

            video.srcObject = stream;
            video.play();
        } catch (err) {
            console.log(err);
        }
    }, [videoRef]);

    // save user to the chat queue
    useEffect(async () => {
        const info = await fetch('/ipinfo')
            .then((res) => res.json())
            .catch((err) => err);

        setUser(info.user);
    }, []);

    useEffect(() => {
        // add updated messages
        socket.on('receive message', (message) =>
            setMessages((draft) => {
                draft.push(message);
            })
        );

        socket.on('connection', () => {
            socket.emit('find partner');
            setSystemMessage('Looking for someone you can chat with...');
            setConnection(true);
        });

        socket.on('searching', () => {
            setSystemMessage('Looking for someone you can chat with...');
        });

        socket.on('chat start', () => {
            setSystemMessage("You're now chatting with a random stranger.");
            setPartnerConnection(true);
        });

        socket.on('no partners', () => {
            setSystemMessage('Could not find anyone available to chat with :(');
            setPartnerConnection(false);
        });

        // show the typing message if the one typing is not the user
        socket.on('typing', (userName) => setTyping(userName !== user));

        return () => {
            socket.off('receive message');
            socket.off('no partner');
            socket.off('typing');
            socket.off('searching');
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

    function findNewPartner() {
        socket.emit('find partner');
    }

    return (
        <div className={`chat__wrapper ${isVideoChat ? 'video' : ''}`}>
            {isVideoChat && (
                <div className="video__container">
                    <video autoPlay />
                    <video autoPlay id="selfvideo" ref={videoRef} />
                </div>
            )}
            <div className="text__chat--container">
                <div className="text__chat">
                    <div className="message__container">
                        <p className="message message__system">{systemMessage}</p>
                    </div>
                    {messages.map((message) => (
                        <Message {...message} key={message.key} isUser={user === message.user} />
                    ))}

                    {isTyping && <p>Stranger is typing...</p>}
                </div>
                <form className="text__chat--controls" onSubmit={formHandler}>
                    <button type="button" onClick={findNewPartner}>
                        New
                    </button>
                    <textarea onChange={inputHandler} value={message} onKeyDown={typingHandler} />
                    <button type="submit" disabled={message === '' || !isConnectedToPartner || !isConnected}>
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}
