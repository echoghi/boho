import React from 'react';
import { useAppState } from '../context/appContext';

export default function Header() {
    const { setPage } = useAppState();

    return (
        <header>
            <div>
                <h1 onClick={() => setPage('HOME')}>Boho</h1>
                <h2>An easy way to meet random people</h2>
            </div>
        </header>
    );
}
