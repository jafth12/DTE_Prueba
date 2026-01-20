const db = require('../config/db');
const { v4: uuidv4 } = require('uuid'); // Para generar código único

exports.crearFactura = async (req, res) => {
    const connection = await db.getConnection(); // Obtener una conexión del pool para la transacción
    try {
        // 1. Recibir datos del frontend (Vue.js)
        // Se espera un JSON así: { cliente_id: 1, items: [ {producto_id: 5, cantidad: 2, precio: 10}, ... ] }
        const { cliente_id, items } = req.body;

        await connection.beginTransaction(); // INICIAR TRANSACCIÓN

        // 2. Preparar datos de cabecera de factura
        const fechaHoy = new Date().toISOString().slice(0, 19).replace('T', ' '); // Formato MySQL
        const codigoGeneracion = uuidv4(); // Generar un UUID único para el DTE

        // 3. Insertar Factura (Cabecera)
        const [facturaResult] = await connection.query(
            'INSERT INTO facturas (cliente_id, fecha, codigo_generacion) VALUES (?, ?, ?)',
            [cliente_id, fechaHoy, codigoGeneracion]
        );
        const nuevoFacturaId = facturaResult.insertId;

        // 4. Insertar Detalles (Items) en bucle
        for (const item of items) {
            const subtotal = item.cantidad * item.precio; // Asegúrate que el frontend o backend calcule esto bien
            await connection.query(
                'INSERT INTO factura_detalles (factura_id, producto_id, cantidad, subtotal) VALUES (?, ?, ?, ?)',
                [nuevoFacturaId, item.producto_id, item.cantidad, subtotal]
            );
        }

        // ==================================================================
        // === ZONA DE INTEGRACIÓN DTE (Ministerio de Hacienda) ===
        // ==================================================================
        console.log("--- Inicio Proceso DTE ---");
        
        // A) OBTENER DATOS COMPLETOS: Consultar la DB para tener los datos del cliente y productos completos
        //    que acabamos de insertar para armar el JSON final.

        // B) ARMAR EL JSON ESTRUCTURADO: Aquí debes seguir el manual de Hacienda al pie de la letra.
        // const jsonParaHacienda = {
        //    identificacion: { codigoGeneracion: codigoGeneracion, ... },
        //    emisor: { ... tus datos ... },
        //    receptor: { ... datos del cliente consultados ... },
        //    cuerpoDocumento: [ ... items formateados ... ],
        //    resumen: { totalLetras: "...", totalPagar: ... }
        // };

        // C) FIRMAR EL JSON: Usar tu certificado digital para firmar este JSON.
        // const jsonFirmado = firmadorService.firmar(jsonParaHacienda);

        // D) ENVIAR A HACIENDA (API CALL):
        // const respuestaMH = await axios.post('URL_HACIENDA', jsonFirmado, headers...);

        // E) GUARDAR RESPUESTA: Si Hacienda responde OK, deberías actualizar la tabla 'facturas'
        //    para guardar el 'sello_recepcion' que te devuelven.
        // await connection.query('UPDATE facturas SET sello_recepcion = ? WHERE id = ?', [respuestaMH.sello, nuevoFacturaId]);
        
        console.log("--- Fin Proceso DTE (Simulado) ---");
        // ==================================================================

        await connection.commit(); // SI TODO SALIÓ BIEN, CONFIRMAR CAMBIOS EN DB
        
        res.status(201).json({ 
            message: 'Factura creada y procesada exitosamente',
            factura_id: nuevoFacturaId,
            codigo_generacion: codigoGeneracion
            // dte_respuesta: respuestaMH (si la tuvieras)
        });

    } catch (error) {
        await connection.rollback(); // SI ALGO FALLA, DESHACER TODO EN DB
        console.error("Error al crear factura:", error);
        res.status(500).json({ message: 'Error al procesar la factura', error: error.message });
    } finally {
        connection.release(); // Liberar la conexión
    }
};