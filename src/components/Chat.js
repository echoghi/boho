import React, { useEffect, useState, useRef } from 'react';
import { useImmerReducer } from 'use-immer';
import useSocket from '../hooks/useSocket';
import { throttle } from '../utils';

import Message from './Message';

const socketURL = process.env.NODE_ENV === 'development' ? 'ws://localhost:3000' : 'wss://www.bohochat.com';

const chatState = {
    user: null,
    serverConnection: false,
    searching: false,
    partnerConnection: false,
    isPartnerTyping: false,
    disconnectedMessage: '',
    systemMessage: 'Connecting to server...',
    messages: []
};

const chatReducer = (draft, action) => {
    switch (action.type) {
        case 'SET_MESSAGES':
            draft.messages.push(action.message);
            return;

        case 'CONNECTION':
            draft.serverConnection = true;
            draft.partnerConnection = false;
            draft.systemMessage = 'Looking for someone you can chat with...';
            draft.messages = [];
            return;

        case 'SEARCHING':
            draft.partnerConnection = false;
            draft.searching = true;
            draft.systemMessage = 'Looking for someone you can chat with...';
            draft.disconnectedMessage = '';
            draft.messages = [];
            return;

        case 'STILL_SEARCHING':
            draft.partnerConnection = false;
            draft.systemMessage = 'Still looking for a partner...';
            return;

        case 'CHAT_START':
            draft.partnerConnection = true;
            draft.confirmExit = false;
            draft.systemMessage = "You're now chatting with a random stranger.";
            draft.disconnectedMessage = '';
            return;

        case 'CONFIRM_EXIT':
            draft.confirmExit = true;
            return;

        case 'NO_PARTNERS':
            draft.partnerConnection = false;
            draft.searching = false;
            draft.systemMessage = "Couldn't find anyone available to chat with :(";
            return;

        case 'DISCONNECTING':
            draft.partnerConnection = false;
            draft.searching = false;
            draft.confirmExit = false;
            draft.disconnectedMessage = action.message;
            return;

        case 'SET_USER':
            draft.user = action.user;
            return;

        case 'SET_TYPING':
            draft.isPartnerTyping = action.status;
            return;

        default:
            return draft;
    }
};

export default function Chat({ isVideoChat = false }) {
    const [state, dispatch] = useImmerReducer(chatReducer, chatState);
    const [socket] = useSocket(socketURL);

    const [message, setMessage] = useState('');

    const videoRef = useRef();
    const textRef = useRef();
    const chatRef = useRef();

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

        const { user } = info.body;

        dispatch({ type: 'SET_USER', user });

        socket.emit('find partner', user);
    }, []);

    useEffect(() => {
        // update messages and scroll to bottom
        socket.on('receive message', (message) => {
            dispatch({ type: 'SET_MESSAGES', message });

            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        });
        // trigger state updates
        socket.on('connection', () => dispatch({ type: 'CONNECTION' }));
        socket.on('searching', () => dispatch({ type: 'SEARCHING' }));
        socket.on('still searching', () => dispatch({ type: 'STILL_SEARCHING' }));
        socket.on('no partners', () => dispatch({ type: 'NO_PARTNERS' }));
        // show the typing message if the one typing is not the user
        socket.on('typing', (userId) => dispatch({ type: 'SET_TYPING', status: state.user !== userId }));
        socket.on('stop typing', () => dispatch({ type: 'SET_TYPING', status: false }));

        socket.on('chat start', (roomName) => {
            dispatch({ type: 'CHAT_START' });

            textRef.current.focus();
        });

        // update system msg and scroll to bottom
        socket.on('disconnecting now', (userName) => {
            const message = userName === state.user ? 'You disconnected.' : 'Your partner disconnected.';

            dispatch({ type: 'DISCONNECTING', message });
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        });

        return () => {
            socket.off('receive message');
            socket.off('no partners');
            socket.off('typing');
            socket.off('searching');
            socket.off('still searching');
            socket.off('chat start');
            socket.off('connection');
            socket.off('disconnecting now');
        };
    });

    function sendMessage(msg) {
        socket.emit('new message', { user: state.user, msg });
    }

    function formHandler(e) {
        e.preventDefault();

        sendMessage(message);
        setMessage('');
    }

    function typingHandler(e) {
        throttle(socket.emit('typing', state.user), 1000);

        if (e.which === 13) {
            e.preventDefault();

            sendMessage(message);
            setMessage('');

            socket.emit('stop typing', state.user);
        }

        setTimeout(() => socket.emit('stop typing', state.user), 1500);
    }

    function inputHandler(e) {
        setMessage(e.target.value);
    }

    function findNewPartner() {
        dispatch({ type: 'FIND_PARTNER' });

        socket.emit('find partner', state.user);
    }

    function confirmExit() {
        dispatch({ type: 'CONFIRM_EXIT' });
    }

    function stopChat() {
        dispatch({ type: 'DISCONNECTING' });
        socket.emit('disconnecting now');
    }

    const Button = () => {
        let handler;
        let text;
        let className = '';

        if (state.partnerConnection || state.searching) {
            className = 'alt';
            if (state.confirmExit) {
                handler = stopChat;
                text = 'Really?';
            } else {
                handler = confirmExit;
                text = 'Stop';
            }
        } else {
            handler = findNewPartner;
            text = 'New';
        }

        return (
            <button type="button" onClick={handler} className={className}>
                {text}
            </button>
        );
    };

    return (
        <div className={`chat__wrapper ${isVideoChat ? 'video' : ''}`}>
            {isVideoChat && (
                <div className="video__container">
                    <video autoPlay />
                    <video autoPlay id="selfvideo" ref={videoRef} />
                </div>
            )}
            <div className="text__chat--container">
                <div className="text__chat" ref={chatRef}>
                    <div className="message__container">
                        <p className="message message__system">{state.systemMessage}</p>
                    </div>
                    {state.messages.map((message) => (
                        <Message {...message} key={message.key} isUser={state.user === message.user} />
                    ))}

                    {state.isPartnerTyping && <p>Stranger is typing...</p>}
                    {!!state.disconnectedMessage && (
                        <div className="message__container">
                            <p className="message message__system">{state.disconnectedMessage}</p>
                        </div>
                    )}
                </div>

                <form className="text__chat--controls" onSubmit={formHandler}>
                    <Button />
                    <textarea
                        ref={textRef}
                        onChange={inputHandler}
                        value={message}
                        onKeyDown={typingHandler}
                        disabled={!state.partnerConnection || !state.serverConnection}
                    />
                    <button type="submit" disabled={!message || !state.partnerConnection || !state.serverConnection}>
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}
