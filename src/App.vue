<script setup>
    import { ref, onMounted, computed } from 'vue';
import e from 'express';

    const listaClientes = ref([]);
    const listaProductos = ref([]);

    const clienteSeleccionado = ref(null);
    const productoSeleccionado = ref(null);
    const cantidad = ref(1);
    const carrito = ref([]);

    onMounted(async () => {
        const res = await axios.get('http://localhost:3000/api/datos');
        listaClientes.value = res.data.clientes;
        listaProductos.value = res.data.productos;
    });

    const agregarProducto = () => {
        if (!productoSeleccionado.value) return alert("Selecciona un producto");
        
        const subtotal = productoSeleccionado.value.precio * cantidad.value;
        
        carrito.value.push({
            id: productoSeleccionado.value.id,
            nombre: productoSeleccionado.value.precio * cantidad.value,
            precio: productoSeleccionado.value.nombre,
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
            const res = await axios.post('http://localhost:3000/api/facturar', {
                cliente_id: clienteSeleccionado.value,
                items: carrito.value,
                total: totalFactura.value
            });
            alert(`Factura Creada con Éxito!\nCódigo DTE: ${res.data.codigo}`);
            carrito.value = [];
        } catch (e) {
            console.error(e);
            alert("Error al facturar");
        }
    };
</script>

<template>
    <div class="seccion">
        <label >Cliente:</label>
        <select v-model="clienteSeleccionado">
            <option v-for="c in listaClientes" :key="c.id" :value="c.id">{{ c.nombre }}</option>
        </select>
    </div>

    <div class="seccion linea-producto">
        <select v-model="productoSeleccionado">
            <option :value="null">Selecciona Producto...</option>
            <option v-for="p in listaProductos" :key="p.id" :value="p">{{ p.nombre }}</option>
        </select>
    </div>

    <table>
        <thead><tr><th>Producto</th><th>Cant</th><th>Subtotal</th></tr></thead>
        <tbody>
            <tr v-for="(item, index) in carrito" :key="index">
                <td>{{ item.nombre }}</td>
                <td>{{ item.cantidad }}</td>
                <td>{{ item.subtotal }}</td>
            </tr>
        </tbody>
    </table>

    <div>
        <h3>Total a Pagar: ${{ totalFactura }}</h3>
        <button class="btn-emitir" @click="emitirFactura">EMITIR DTE</button>
    </div>
</template>

<style>
    .facturador { max-width: 500px; margin: 20px auto; font-family: sans-serif;}
    .seccion {margin-bottom: 15px; display: flex; gap: 10px;}
    table {width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border:1px solid #ddd; padding: 8px; text-align: left; }
    .total {margin-top: 20px; text-align: right; }
    .btn-emitir {background: #2c3e50; color: white; padding: 10px 20px; font-size: 18px; cursor: pointer; }
</style>