const db = require('../config/db');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

exports.crearFactura = async (req, res) => {
    // Verificar conexión
    if (!db.getConnection) return res.status(500).json({ message: 'Error de configuración de DB' });
    
    const connection = await db.getConnection();
    
    try {
        const { cliente_id, items } = req.body;
        
        // 1. Validaciones
        if (!items || items.length === 0) return res.status(400).json({ message: 'El carrito está vacío' });

        await connection.beginTransaction();

        // 2. Obtener datos del Cliente (IMPORTANTE: Necesitamos el correo)
        const [clientes] = await connection.query('SELECT * FROM clientes WHERE id = ?', [cliente_id]);
        if (clientes.length === 0) throw new Error('Cliente no encontrado');
        const cliente = clientes[0];

        // 3. Insertar Factura
        const totalFactura = items.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);
        const fechaHoy = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const codigoGeneracion = uuidv4();

        const [facturaResult] = await connection.query(
            'INSERT INTO facturas (cliente_id, fecha, total, codigo_generacion) VALUES (?, ?, ?, ?)',
            [cliente_id, fechaHoy, totalFactura, codigoGeneracion]
        );
        const facturaId = facturaResult.insertId;

        // 4. Insertar Detalles
        const itemsParaPDF = []; // Guardamos datos limpios para el PDF
        for (const item of items) {
            const subtotal = item.cantidad * item.precio;
            
            // Guardar en BD
            await connection.query(
                'INSERT INTO factura_detalles (factura_id, producto_id, cantidad, subtotal) VALUES (?, ?, ?, ?)',
                [facturaId, item.producto_id, item.cantidad, subtotal]
            );

            // Buscar nombre real del producto para que salga bonito en el PDF
            const [prod] = await connection.query('SELECT nombre FROM productos WHERE id = ?', [item.producto_id]);
            itemsParaPDF.push({
                nombre: prod[0]?.nombre || 'Producto',
                cantidad: item.cantidad,
                precio: item.precio,
                subtotal: subtotal
            });
        }

        await connection.commit(); // ¡GUARDADO EXITOSO EN BD!
        console.log(`Factura ${facturaId} guardada. Iniciando generación de PDF...`);

        // =======================================================
        // 5. GENERAR PDF Y ENVIAR CORREO
        // =======================================================
        
        // Crear PDF en memoria (RAM)
        const doc = new PDFDocument({ margin: 50 });
        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));

        // --- DIBUJAR PDF ---
        doc.fontSize(20).text('Factura Electrónica (DTE)', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Factura #: ${facturaId}`);
        doc.text(`Código: ${codigoGeneracion}`);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`);
        doc.moveDown();
        doc.text(`Cliente: ${cliente.nombre}`);
        doc.text(`DUI/NIT: ${cliente.nit_dui}`);
        doc.moveDown();
        
        // Tabla simple
        doc.text('-------------------------------------------------------');
        itemsParaPDF.forEach(item => {
            doc.text(`${item.cantidad} x ${item.nombre} ($${item.precio}) = $${item.subtotal.toFixed(2)}`);
        });
        doc.text('-------------------------------------------------------');
        doc.fontSize(14).text(`TOTAL: $${totalFactura.toFixed(2)}`, { align: 'right' });

        doc.end(); // Finalizar dibujo

        // Cuando el PDF termine de dibujarse, enviamos el correo
        doc.on('end', async () => {
            const pdfData = Buffer.concat(buffers);
            const correoCliente = cliente.correo || cliente.email;

            // Intentar enviar correo solo si el cliente tiene uno
            if (correoCliente) {
                try {
                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: process.env.EMAIL_USER,
                            pass: process.env.EMAIL_PASS
                        }
                    });

                    await transporter.sendMail({
                        from: process.env.EMAIL_USER,
                        to: correoCliente,
                        subject: `Tu Factura de Compra #${facturaId}`,
                        text: `Hola ${cliente.nombre}, gracias por tu compra. Adjuntamos tu factura.`,
                        attachments: [{ filename: `factura-${facturaId}.pdf`, content: pdfData }]
                    });
                    console.log(`Correo enviado a ${correoCliente}`);
                } catch (mailError) {
                    console.error("Error enviando correo:", mailError);
                    // No fallamos la petición porque la factura YA se guardó
                }
            } else {
                console.log("El cliente no tiene correo registrado.");
            }

            // Responder al Frontend (Todo salió bien)
            res.status(201).json({ 
                message: 'Factura creada y procesada',
                factura_id: facturaId,
                correo_enviado: !!correoCliente
            });
        });

    } catch (error) {
        // Si falló la BD, deshacemos todo
        if (connection) await connection.rollback();
        console.error("Error crítico:", error);
        res.status(500).json({ message: 'Error al procesar la factura', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};