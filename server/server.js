const express = require('express');
var cors = require('cors');
const axios = require('axios');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors());

let port = 3000;

app.use(express.static('dist'));

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
})

module.exports.port = port;
