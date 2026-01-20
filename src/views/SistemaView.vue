<script setup>
    import { onMounted, ref } from 'vue';
    import { useRouter } from 'vue-router';
    import api from '../api.js';

    const router = useRouter();
    const usuarioLogueado = ref('null');
    const listaClientes = ref([]);
    const listaProductos = ref([]);

    const clienteSeleccionado = ref(null);
    const productoSeleccionado = ref(null);
    const cantidad = ref(1);
    const carrito = ref([]);

    onMounted(() => {
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
            usuarioLogueado.value = JSON.parse(usuarioGuardado);
            cargarDatos();
        } else {
            router.push('/');
        }
    });

    const cargarDatos = async () => {
        try {
            const c = await api.get('/clientes');
            listaClientes.value = c.data;
            const p = await api.get('/productos');
            listaProductos.value = p.data;
        } catch (e) { console.error(e); }
    };

    const agregaerAlCarrito = () => {
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

    const generarFactura = async () => {
        alert("Factura generada (simulacion)");
        carrito.value = [];
    };
</script>

<template>
  <div class="sistema-box" v-if="usuarioLogueado">
    <header class="barra-superior">
        <h2>Hola {{ usuarioLogueado.nombre }}</h2>
        <button @click="cerrarSesion" class="btn-danger">Salir</button>
    </header>
    
    <main>
    <div v-if="usuarioLogueado.rol === 'admin'" class="panel-admin">
      <h3>Panel Admin</h3>
      <button>Opciones del admin</button>
    </div>
    
    <div class="panel-facturacion">
      <h3>Nueva Factura</h3>
        <div class="fila">
            <label>Cliente:</label>
            <select v-model="clienteSeleccionado">
            <option v-for="c in listaClientes" key="c.id" :value="c.id">{{ c.nombre }}</option>
            </select>
        </div>
    </div>
    </main>
  </div>
</template>

<style scoped>
/* Tus estilos del sistema */
.barra-superior { display: flex; justify-content: space-between; padding: 10px; background: #eee; }
.btn-danger { background: red; color: white; border: none; padding: 5px; cursor: pointer;}
</style>