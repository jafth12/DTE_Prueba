const express = require('express');
const router = express.Router();

const clienteController = require('../controladores/clienteController');
const productoController = require('../controladores/productoController')
const facturaController = require('../controladores/facturaController');

router.get('/clientes', clienteController.getAllClientes);
router.get('/productos', productoController.getAllProductos)
router.post('/facturas/crear', facturaController.crearFactura);

module.exports = router;