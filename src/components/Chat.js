import React, { useEffect, useState, useRef } from 'react';
import { useImmer } from 'use-immer';
import useSocket from '../hooks/useSocket';

import Message from './Message';

export default function Chat({ isVideoChat = false }) {
    const socketURL = process.env.NODE_ENV === 'development' ? 'ws://localhost:3000' : 'wss://www.bohochat.com';
    const [socket] = useSocket(socketURL);

    const videoRef = useRef();
    const textRef = useRef();
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

        setUser(info.body.user);

        socket.emit('find partner', info.body.user);
    }, []);

    useEffect(() => {
        // add updated messages
        socket.on('receive message', (message) =>
            setMessages((draft) => {
                draft.push(message);
            })
        );

        socket.on('connection', () => {
            setSystemMessage('Looking for someone you can chat with...');
            setConnection(true);
        });

        socket.on('searching', () => {
            setSystemMessage('Looking for someone you can chat with...');
        });

        socket.on('still searching', () => {
            setSystemMessage('Still looking for a partner...');
        });

        socket.on('chat start', (roomName) => {
            console.log(`joined ${roomName}`);
            setSystemMessage("You're now chatting with a random stranger.");
            setPartnerConnection(true);
            textRef.current.focus();
        });

        socket.on('no partners', () => {
            setSystemMessage("Couldn't find anyone available to chat with :(");
            setPartnerConnection(false);
        });

        // show the typing message if the one typing is not the user
        socket.on('typing', () => setTyping(true));

        return () => {
            socket.off('receive message');
            socket.off('no partners');
            socket.off('typing');
            socket.off('searching');
            socket.off('still searching');
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
            e.preventDefault();

            sendMessage(message);
            setMessage('');

            socket.emit('stop typing', user);
        }
    }

    function inputHandler(e) {
        setMessage(e.target.value);
    }

    function findNewPartner() {
        socket.emit('find partner', user);
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
                    <textarea
                        ref={textRef}
                        onChange={inputHandler}
                        value={message}
                        onKeyDown={typingHandler}
                        disabled={!isConnectedToPartner || !isConnected}
                    />
                    <button type="submit" disabled={!message || !isConnectedToPartner || !isConnected}>
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}
