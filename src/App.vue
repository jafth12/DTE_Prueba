<script setup>
import { ref, onMounted, computed } from 'vue';
import api from './api.js'; // Usamos el puente que configuraste

const listaClientes = ref([]);
const listaProductos = ref([]);

const clienteSeleccionado = ref(null);
const productoSeleccionado = ref(null);
const cantidad = ref(1);
const carrito = ref([]);

onMounted(async () => {
    try {
        // Llamamos a las rutas que sí existen en tu backend
        const resClientes = await api.get('/clientes');
        const resProductos = await api.get('/productos');
        listaClientes.value = resClientes.data;
        listaProductos.value = resProductos.data;
    } catch (error) {
        console.error("Error cargando datos iniciales:", error);
    }
});

const agregarProducto = () => {
    if (!productoSeleccionado.value) return alert("Selecciona un producto");
    
    const subtotal = productoSeleccionado.value.precio * cantidad.value;
    
    // Corregimos el mapeo de datos
    carrito.value.push({
        id: productoSeleccionado.value.id,
        nombre: productoSeleccionado.value.nombre, // Ahora sí guarda el nombre
        precio: productoSeleccionado.value.precio,
        cantidad: cantidad.value,
        subtotal: subtotal
    });
};

const totalFactura = computed(() => {
    return carrito.value.reduce((suma, item) => suma + item.subtotal, 0);
});

const emitirFactura = async () => {
    if (!clienteSeleccionado.value || carrito.value.length === 0) return alert("Faltan datos");

    try {
        // Usamos la ruta correcta definida en apiRutas.js
        const res = await api.post('/facturas/crear', {
            cliente_id: clienteSeleccionado.value,
            items: carrito.value
        });
        alert(`Factura Creada con Éxito!\nCódigo DTE: ${res.data.codigo_generacion}`);
        carrito.value = [];
    } catch (e) {
        console.error(e);
        alert("Error al facturar");
    }
};
</script>

<template>
    <div class="facturador">
        <h1>Nueva Factura Electrónica</h1>
        
        <div class="seccion">
            <label>Cliente:</label>
            <select v-model="clienteSeleccionado">
                <option :value="null">Seleccione un cliente...</option>
                <option v-for="c in listaClientes" :key="c.id" :value="c.id">
                    {{ c.nombre }}
                </option>
            </select>
        </div>

        <div class="seccion linea-producto">
            <select v-model="productoSeleccionado">
                <option :value="null">Selecciona Producto...</option>
                <option v-for="p in listaProductos" :key="p.id" :value="p">
                    {{ p.nombre }} - ${{ p.precio }}
                </option>
            </select>
            <input type="number" v-model="cantidad" min="1" style="width: 50px;">
            <button @click="agregarProducto">Agregar</button>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Cant</th>
                    <th>Subtotal</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(item, index) in carrito" :key="index">
                    <td>{{ item.nombre }}</td>
                    <td>{{ item.cantidad }}</td>
                    <td>${{ item.subtotal.toFixed(2) }}</td>
                </tr>
            </tbody>
        </table>

        <div class="total">
            <h3>Total a Pagar: ${{ totalFactura.toFixed(2) }}</h3>
            <button class="btn-emitir" @click="emitirFactura">EMITIR DTE</button>
        </div>
    </div>
</template>

<style>
    .facturador { max-width: 600px; margin: 20px auto; font-family: sans-serif; padding: 20px; border: 1px solid #ccc; }
    .seccion { margin-bottom: 15px; display: flex; align-items: center; gap: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    .total { margin-top: 20px; text-align: right; }
    .btn-emitir { background: #2c3e50; color: white; padding: 10px 20px; font-size: 18px; cursor: pointer; border: none; border-radius: 5px; }
    .btn-emitir:hover { background: #34495e; }
</style>