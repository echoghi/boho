import React from 'react';

export default function SystemMessage({ text }) {
    return (
        <div className="message__container">
            <p className="message message__system">{text}</p>
        </div>
    );
}
