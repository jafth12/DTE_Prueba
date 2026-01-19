const db = require('../../config/db');

exports.getAllProductos = async (req, res) => {
    try{
        const [rows] = await db.query('SELECT id, nombre, precio');
        res.json(rows);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};