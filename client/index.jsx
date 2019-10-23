import React from 'react';
import ReactDOM from 'react-dom';
import Reviews from './Reviews.jsx'
import WebFont from 'webfontloader';

WebFont.load({
    google: {
        families: ['Gentium Basic:400,700', 'serif']
    }
});

ReactDOM.render(<Reviews/>, document.getElementById('root'));