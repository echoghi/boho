import React from 'react';

export default function Message({ msg, isUser }) {
    const userName = isUser ? 'You' : 'Stranger';
    return (
        <div className="message__container">
            <p className={`message ${isUser ? 'message__you' : 'message__stranger'}`}>
                <span>{userName}:</span>
                {msg}
            </p>
        </div>
    );
}
