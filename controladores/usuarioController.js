const db = require ('../config/db');

exports.login = async (req, res) => {
    const { usuario, password } = req.body;
    
    try{
        const [users] = await db.query('SELECTO * FROM usuarios WHERE usuario = ?', [usuario]);

        if (users.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado '});
            }

            const user = users[0];

            if (password === user.password) {
                res.json({
                    mensaje: 'Inicio exitoso',
                    usuario: { id: user.id, nombre: user.nombre, rol: user.rol }
                });
            } else {
                res.status(401).json({error: 'Contraseña incorrecta' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Error en el servidor '});
        }
    };