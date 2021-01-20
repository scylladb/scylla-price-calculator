<template>
  <div class="form-group">
    <label class="col-form-label" :for="title">{{ label }}</label>
    <div class="d-flex">
      <div class="slider-wrapper d-flex flex-column">
        <vue-slider
          v-model="getSetValue"
          @input="$emit('update', $event.target.value)"
          :contained="false"
          :min="min"
          :max="max"
          dotSize="32"
          tooltip="none"
          :interval=interval
          :disabled="disabled"
        >
          <template v-slot:dot>
            <div class="custom-dot"></div>
          </template>
        </vue-slider>
        <div class="d-flex justify-content-between">
          <div class="slider-marker">{{ minMarker }}</div>
          <div class="slider-marker">{{ maxMarker }}</div>
        </div>
      </div>
      <input
        v-model="getSetFormattedValue"
        class="form-control"
        type="text"
        :name="title"
        :id="title"
        :disabled="disabled"
        @blur="onBlur"
      />
    </div>
  </div>
</template>

<script lang="ts">
import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/default.css'
import Vue, {
  ComponentPublicInstance,
  DefineComponent,
  defineComponent
} from 'vue'
export default defineComponent({
  name: 'SliderInput',
  props: {
    title: {
      type: String,
      default: ''
    },
    value: {
      type: Number,
      required: true
    },
    min: {
      type: Number,
      default: -Math.max()
    },
    max: {
      type: Number,
      default: Math.max()
    },
    interval: {
      type: Number,
      default: 1
    },
    minMarker: {
      type: String,
      default: ''
    },
    maxMarker: {
      type: String,
      default: ''
    },
    label: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  components: { VueSlider },
  data() {
    return {
      focused: false,
      temp: null
    }
  },
  computed: {
    getSetFormattedValue: {
      get(vm: Vue.DefineComponent): any {
        const amount = vm.value
        return vm.thousandSeprator(amount)
      },
      set(value: any) {
        const textAmount = value.toString() || ''
        const noCommasAmount = textAmount.replace(/,/g, '')
        const numberAmount = Number(noCommasAmount)
        this.$emit('update', Math.min(this.max, numberAmount))
      }
    },
    getSetValue: {
      get(vm: Vue.DefineComponent) {
        return vm.value
      },
      set(value: any) {
        this.$emit('update', value)
      }
    }
  },
  methods: {
    onFocus() {
      this.focused = true
    },
    onBlur() {
      this.focused = false
      this.$emit('update', Math.max(this.min, this.getSetValue))
    },
    thousandSeprator(amount: any) {
      if (
        amount !== '' ||
        amount !== undefined ||
        amount !== 0 ||
        amount !== '0' ||
        amount !== null
      ) {
        return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      } else {
        return amount
      }
    }
  }
})
</script>

<style scoped lang="scss"></style>
