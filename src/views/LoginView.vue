<script setup>
    import { ref } from 'vue';
    import { useRouter } from 'vue-router';
    import api from '../api.js';

    const router = useRouter();
    const usernameInput = ref('');
    const passwordInput = ref('');
    const errorLogin = ref('');

    const iniciarSesion = async () => {
        try {
            const respuesta = await api.post('/login', {
                usuario: usernameInput.value,
                password: passwordInput.value
            });
            localStorage.setItem('usuario', JSON.stringify(respuesta.data.usuario));

            router.push('/sistema');
        } catch (error) {
            error.Login.value = 'Usuario o contraseña incorrectos';
        }
    };
</script>

<template>
    <div class="Login-box">
        <h1>Bienvenido</h1>
        <p>Sistema de facturacion_DTE</p>

    <div class="from-group">
        <label>Usuario:</label>
        <input v-model="usernameInput" type="text" placeholder="Ej: admin">
    </div>
    
    <div class="from-group">
        <label>contraseña:</label>
        <input v-model="passwordInput" type="password" placeholder="Ej: 1234">
    </div>

    <p v-if="errorLogin" class="error">{{ errorLogin }}</p>

    <button @click="iniciarSesion" class="btn-primario">Entrar</button>
    </div>
</template>

<style scoped>
/* Pega aquí los estilos del login que tenías antes (.login-box, etc.) */
.login-box { max-width: 400px; margin: 100px auto; padding: 40px; border: 1px solid #ddd; border-radius: 10px; text-align: center; }
.form-group { margin-bottom: 15px; text-align: left; }
input { width: 100%; padding: 10px; margin-top: 5px; box-sizing: border-box; }
.btn-primary { background: #007bff; color: white; border: none; padding: 10px 20px; cursor: pointer; }
.error { color: red; }
</style>