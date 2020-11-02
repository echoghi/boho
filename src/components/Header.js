import React, { useState, useEffect } from 'react';
import { useAppState } from '../context/appContext';

export default function Header() {
    const { setPage } = useAppState();
    const [userCount, setUserCount] = useState(0);
    const [formattedCount, setFormattedCount] = useState('');

    function roundCount(num) {
        return Math.ceil(num / 100) * 100;
    }

    function formatCount(num) {
        return `${new Intl.NumberFormat().format(num)}+`;
    }

    useEffect(async () => {
        const info = await fetch('/count')
            .then((res) => res.json())
            .catch((err) => err);

        const count = roundCount(info.count);
        const formattedCount = formatCount(count);
        setUserCount(count);
        setFormattedCount(formattedCount);
    }, []);

    return (
        <header>
            <div>
                <h1 onClick={() => setPage('HOME')}>Boho</h1>
                <h2>An easy way to meet random people</h2>
            </div>
            {userCount >= 100 && (
                <div className="count">
                    {formattedCount}
                    <span>online now</span>
                </div>
            )}
        </header>
    );
}
