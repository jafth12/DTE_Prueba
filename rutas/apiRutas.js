const express = require('express');
const router = express.Router();

const clienteController = require('../controladores/clienteController');
const productoController = require('../controladores/productoController')
const facturaController = require('../controladores/facturaController');
const usuarioController = require('../controladores/usuarioController');


router.get('/clientes', clienteController.getAllClientes);
router.get('/productos', productoController.getAllProductos)


router.post('/facturas/crear', facturaController.crearFactura);
router.post('/login', usuarioController.login);
router.post('/clientes', clienteController.crearCliente);
router.post('/productos', productoController.crearProducto);


router.use((req, res) => {
    res.status(400).json({
        estado: false,
        mensaje: "la ruta de la API que buscas no existe."
    });
});

module.exports = router;