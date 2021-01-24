import { createApp } from 'vue'
import Calculator from './Calculator.vue'
import './assets/style.scss'
declare const bootstrap: any

const app = createApp(Calculator)
const tooltipHandles = []
app.directive('tooltip', {
    mounted(el: Element, binding) {
        el.setAttribute('data-bs-toggle', 'tooltip')
        el.setAttribute('title', binding.value.toString())
        new bootstrap.Tooltip(el, {delay: 100})
    }
})
app.mount('#app')
