const { json } = require('body-parser');
const db = require('../config/db');

exports.getAllProductos = async (req, res) => {
    try{
        const [rows] = await db.query('SELECT id, nombre, precio FROM productos');
        res.json(rows);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

exports.crearProducto = async (req, res) => {
    const {  nombre, precio } = req.body;
    try {
        await db.query('INSERT INTO productos (nombre, precio) VALUES (?, ?, ?)',
            [nombre, precio]);
            res.json({ message: 'producto creado con exito' });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear producto: ' + error.message });
        
    }
};