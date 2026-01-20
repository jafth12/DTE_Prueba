const db = require('../config/db');

exports.getAllClientes = async (req, res) => {
    try{
        const [rows] = await db.query('SELECT id, nombre, nit_dui FROM clientes');
        res.json(rows);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};