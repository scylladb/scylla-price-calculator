import { createApp } from 'vue'
import Calculator from './Calculator.vue'
import './assets/style.scss'
declare const bootstrap: any

const app = createApp(Calculator)
app.directive('tooltip', {
    mounted(el: Element, binding) {
        el.setAttribute('data-bs-toggle', 'tooltip')
        el.setAttribute('title', binding.value.toString())
        new bootstrap.Tooltip(el)
    }
})
app.mount('#app')
