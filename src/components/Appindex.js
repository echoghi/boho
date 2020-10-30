import React from 'react';
import { useAppState } from '../context/appContext';
import Chat from './Chat';
import Header from './Header';
import Home from './Home';

function AppIndex() {
    const { page } = useAppState();

    function App() {
        switch (page) {
            case 'HOME':
                return <Home />;

            case 'TEXT':
                return <Chat />;

            case 'VIDEO':
                return <Chat />;
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

export default AppIndex;
