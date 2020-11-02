import React from 'react';

export default function Message({ msg, isUser }) {
    return (
        <div className={`message__container ${isUser ? 'you' : ''}`}>
            <p className={`message ${isUser ? 'message__you' : 'message__stranger'}`}>{msg}</p>
        </div>
    );
}
