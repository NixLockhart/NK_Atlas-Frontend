import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { useThemeStore } from './stores/theme'
import i18n from './locales'

import 'uno.css'
import './styles/variables.css'
import './styles/main.css'
import './styles/responsive.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)

// 初始化主题
const themeStore = useThemeStore()
themeStore.init()

app.mount('#app')
