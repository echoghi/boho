import './assets/scss/style.scss';

import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import AppIndex from 'components/AppIndex';
import { AppProvider } from './context/appContext';

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
