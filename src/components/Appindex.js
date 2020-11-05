import React, { useEffect } from 'react';
import { useAppState } from '../context/appContext';
import Chat from './Chat';
import Header from './Header';
import Home from './Home';

export default function AppIndex() {
    const { page } = useAppState();

    function App() {
        switch (page) {
            case 'HOME':
                return <Home />;

            case 'TEXT':
                return <Chat />;

            case 'VIDEO':
                return <Chat isVideoChat={true} />;

            default:
                return <Home />;
        }
    }

    return (
        <div className="app__container">
            <Header />
            <App />
        </div>
    );
}
