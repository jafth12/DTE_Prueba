require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const apiRutas = require('./rutas/apiRutas');
const db = require ('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.use('/api', apiRutas);

app.get('/', (req, res) => {
    res.send('API de Facturacion Electronica funcionando');
});

db.query('SELECT 1 + 1 AS solution')
.then(([rows, fields]) => {
    console.log('!La base de datos respondio el resultado es:', rows[0].solution);
})
.catch(err => {
    console.error('ERROR GRAVE: No pudo conectar a la DB')
    console.error('Revisa tu archivo .env detalle del error:', err.message);
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});