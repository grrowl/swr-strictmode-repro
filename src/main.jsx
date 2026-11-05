import React, { Fragment, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
const Wrapper = new URLSearchParams(location.search).get('strict') === 'false' ? Fragment : StrictMode;
createRoot(document.getElementById('root')).render(<Wrapper><App /></Wrapper>);
