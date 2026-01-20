import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";
import SistemaView from "../views/SistemaView.vue";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'login',
            component: LoginView
        },
        {
            path: '/sistema',
            name: 'sistema',
            component: SistemaView
        }
    ]
});

export default router;