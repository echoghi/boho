import './assets/scss/style.scss';

import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import { AppProvider } from './context/appContext';
import AppIndex from './components/Appindex';

ReactDOM.render(
    <AppProvider>
        <BrowserRouter>
            <Switch>
                <Route path="/" component={AppIndex} />
            </Switch>
        </BrowserRouter>
    </AppProvider>,
    document.getElementById('app')
);
