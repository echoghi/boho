import React, { createContext, useContext, useState } from 'react';

export const AppContext = createContext();
export const AppProvider = ({ children }) => {
    const [page, setPage] = useState('TEXT');

    return <AppContext.Provider value={{ page, setPage }}>{children}</AppContext.Provider>;
};

export const useAppState = () => useContext(AppContext);
