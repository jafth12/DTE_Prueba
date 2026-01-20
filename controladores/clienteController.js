const db = require('../config/db');

exports.getAllClientes = async (req, res) => {
    try{
        const [rows] = await db.query('SELECT * FROM clientes');
        res.json(rows);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

exports.crearCliente = async (req , res) => {
 const { nombre, nit_dui, correo } = req.body;
    try {
        await db.query('INSERT INTO clientes (nombre, nit_dui, correo) VALUES (?, ?, ?)', 
        [nombre, nit_dui, correo]);
        res.json({ message: 'Cliente creado con éxito' });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear cliente: ' + error.message });
    }
};
