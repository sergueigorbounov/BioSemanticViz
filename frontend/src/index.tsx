import React from 'react';
import ReactDOM from 'react-dom/client';
import Router from './router';
import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
); 