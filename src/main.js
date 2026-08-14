import { createApp } from 'vue'
import App from './App.vue'
import router from './router.js'
import PageHeader from './components/PageHeader.vue'
import './styles.css'

const app = createApp(App)
app.component('PageHeader', PageHeader)
app.use(router)
app.mount('#app')
