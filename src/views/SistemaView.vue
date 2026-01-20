<script setup>
    import { computed, onMounted, ref } from 'vue';
    import { useRouter } from 'vue-router';
    import api from '../api.js';

    const router = useRouter();
    const usuarioLogueado = ref(null);

    const vistaActual = ref('menu');

    const listaClientes = ref([]);
    const listaProductos = ref([]);

    const clienteSeleccionado = ref(null);
    const productoSeleccionado = ref(null);
    const cantidad = ref(1);
    const carrito = ref([]);


    const formCliente = ref({ nombre: '', nit_dui: '', correo: ''});
    const formProducto = ref({ nombre: '', precio: ''});


    onMounted(() => {
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
            usuarioLogueado.value = JSON.parse(usuarioGuardado);
            cargarDatos();
        } else {
            router.push('/');
        }
    });

    const cerrarSesion = () => {
        localStorage.removeItem('usuario');
    };

    const cargarDatos = async () => {
        try {
            const c = await api.get('/clientes');
            listaClientes.value = c.data;
            const p = await api.get('/productos');
            listaProductos.value = p.data;
        } catch (e) { console.error(e); }
    };



    const agregarAlCarrito = () => {
        if (!clienteSeleccionado.value || !productoSeleccionado.value) return;
        const producto = listaProductos.value.find(p => p.id === productoSeleccionado.value);
        carrito.value.push({
            productoId: producto.id,
            nombre: producto.nombre, 
            precio: producto.precio,
            cantidad: cantidad.value,
            subtotal: producto.precio * cantidad.value
        });
    };

    const totalFactura = computed(() => {
        return carrito.value.reduce((total, item) => total + parseFloat(item.subtotal), 0).toFixed(2);
    });

    const procesarFactura = async () => {
        if(carrito.value.length ===0 )return alert("Carrito vacio");
        try{
            await api.post('/facturas/crear', {
                cliente_id: clienteSeleccionado.value,
                items: carrito.value.map(i => ({
                    producto_id: i.productoId,
                    precio: i.precio,
                    cantidad: i.cantidad
                }))
            });
            alert("!Factura DTE Creada con Exito");
            carrito.value = [];
            vistaActual.value = 'menu';
        }  catch (error) {
            alert("Error al facturar: " + error.message);
        }
    };

    const guardarCliente = async () => {
        try {
            await api.post('/clientes', formCliente.value);
            alert("Cliente guardado correctamente");
            formCliente.value = { nombre: '', nit_dui: '', correo: ''};
            vistaActual.value = 'menu';
        } catch (error) {
            alert("Error:" + error.response?.message || error.message);
        }
    };


    const guardarProducto = async () => {
        try {
            await api.post('/productos', formProducto.value);
            alert("Producto agregado al inventario");
            formProducto.value = { nombre: '', precio: '' };
            cargarDatos();
            vistaActual.value = 'menu';
        } catch (error) {
            alert ("Error al guardar producto");
        }
    };

</script>

<template>
  <div class="contenedor-principal" v-if="usuarioLogueado">

    <header class="barra-superior">
        <h2>Sistema DTE - {{ usuarioLogueado.nombre }} ({{ usuarioLogueado.rol }})</h2>
       <div class="botones-header">
        <button v-if="vistaActual !== 'menu'" @click="vistaActual = 'menu'" class="btn-secondary">Menu Principal</button>
        <button @click="cerrarSesion" class="btn-danger">Cerrar Sesion</button>
       </div>
    </header>
    
    <main>


        <div v-if="vistaActual === 'menu'" class="menu-grid">

            <div class="tarjeta-menu" @click="vistaActual = 'facturar'">
                <div class="icono">🧾</div>
                <h3>Nueva Factura</h3>
                <p>Crear DTE Consumidor Final</p>
            </div>

            <div class="tarjeta-menu" @click="vistaActual = 'nuevo-cliente'">
                <div class="icono">📦</div>
                <h3>Nuevo Producto</h3>
                <p>Agregar al inventario</p>
            </div>
        </div>

        <div v-if="vistaActual === 'facturar'" class="formulario-box">

        <div class="fila">
            <label>Cliente:</label>
            <select v-model="clienteSeleccionado">
                <option value="">Seleccione un cliente...</option>
                <option v-for="c in listaClientes" :key="c.id" :value="c.id">{{ c.nombre }}</option>
            </select>
        </div>

        <div class="fila fondo-gris">
            <label>Agregar Item:</label>
            <select v-model="productoSeleccionado">
                 <option value="">Producto...</option>
                <option v-for="p in listaProductos" :key="p.id" :value="p.id">{{ c.nombre }} - ${{ p.precio }}</option>
            </select>
            <input type="number" v-model="cantidad" min="1" style="width: 70px;">
            <button @click="agregarAlCarrito" class="btn-add">Agregar</button>
        </div>

        <table class="total-box" v-if="carrito.length > 0">
           <thead><tr><th>Producto</th><th>Cant</th><th>SubTotal</th></tr></thead>
           <tbody>
            <tr v-for="(item, index) in carrito" :key="index">
                <td>{{ item.nombre }}</td>
                <td>{{ item.cantidad }}</td>
                <td>{{ item.subtotal }}</td>
            </tr>
           </tbody>
        </table>

        <div class="total-box" v-if="carrito.length > 0">
            <h3>Total a Pagar: ${{ totalFactura }}</h3>
            <button @click="procesarFactura" class="btn-success">EMITIR FACTURA DTE</button>
        </div>
       </div> 
       <div v-if="vistaActual === 'nuevo-cliente'" class="formulario-box">
        <h3>Registrar Nuevo cliente</h3>
        <div class="form-group">
            <label>Nombre Completo</label>
            <input v-model="formCliente.nombre" type="text" placeholder="ejemplo">
        </div>

        <div class="form-group">
            <label>DUI o NIT:</label>
            <input v-model="formCliente.nit_dui" type="text" placeholder="0000-000000-000-0">
        </div>

        <div class="form-group">
            <label>Correo Electronico Para DTE:</label>
            <input v-model="formCliente.correo" type="text" placeholder="ejemplo@gmail.com">
        </div>
        <button @click="guardarCliente" class="btn-primary">Guardar Cliente</button>
       </div>

       <div v-if="vistaActual === 'nuevo-producto'" class="formulario-box">
        <h3>Agregar Nuevo Producto</h3>
        <div class="form-group">
            <label>Nombre del Producto:</label>
            <input v-model="formProducto.nombre" type="text" placeholder="Ej: Teclado USB">
        </div>
        <div class="form-group">
            <label>Precio Unitario ($):</label>
            <input v-model="formProducto.precio" type="number" step="0.01" placeholder="0.00">
        </div>
        <button @click="guardarProducto" class="btn-primary">Guardar Producto</button>
    </div>

    </main>
  </div>
</template>

<style scoped>
/* Estilos Limpios y Ordenados */
.contenedor-principal { max-width: 900px; margin: 0 auto; padding: 20px; font-family: 'Segoe UI', sans-serif; }
.barra-superior { display: flex; justify-content: space-between; align-items: center; padding-bottom: 15px; border-bottom: 2px solid #eee; margin-bottom: 30px; }
.botones-header { display: flex; gap: 10px; }

/* Grid del Menú */
.menu-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
.tarjeta-menu { background: white; border: 1px solid #e0e0e0; padding: 40px 20px; border-radius: 12px; text-align: center; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
.tarjeta-menu:hover { transform: translateY(-5px); box-shadow: 0 10px 15px rgba(0,0,0,0.1); border-color: #007bff; }
.icono { font-size: 3rem; margin-bottom: 15px; }
.tarjeta-menu h3 { margin: 0; color: #333; font-size: 1.2rem; }
.tarjeta-menu p { color: #666; font-size: 0.9rem; margin-top: 5px; }
.tarjeta-menu.admin { border-top: 4px solid #ffc107; }

/* Formularios */
.formulario-box { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border: 1px solid #eee; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; margin-bottom: 8px; font-weight: 600; color: #444; }
.form-group input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 6px; font-size: 1rem; }
.fila { display: flex; gap: 15px; margin-bottom: 20px; align-items: flex-end; flex-wrap: wrap; }
.fondo-gris { background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef; }

/* Botones y Tablas */
.btn-primary { background: #007bff; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer; width: 100%; font-size: 1rem; font-weight: bold; }
.btn-success { background: #28a745; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer; width: 100%; font-size: 1.1rem; font-weight: bold; margin-top: 15px; }
.btn-danger { background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; }
.btn-secondary { background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; }
.btn-add { background: #ffc107; border: none; padding: 10px 20px; font-weight: bold; cursor: pointer; border-radius: 5px; color: #333; }
.tabla-carrito { width: 100%; border-collapse: collapse; margin-top: 20px; }
.tabla-carrito th { background: #f1f1f1; padding: 10px; text-align: left; }
.tabla-carrito td { padding: 10px; border-bottom: 1px solid #eee; }
.total-box { margin-top: 20px; text-align: right; border-top: 2px solid #eee; padding-top: 10px; }
input, select { padding: 10px; border: 1px solid #ccc; border-radius: 5px; }
</style>