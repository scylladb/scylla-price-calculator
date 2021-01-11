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
          :interval="1"
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
        v-model="getSetValue"
        :min="min"
        :max="max"
        class="form-control"
        type="number"
        :name="title"
        :id="title"
        :disabled="disabled"
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
      vl: 100000
    }
  },
  computed: {
    getSetValue: {
      get(vm: Vue.DefineComponent) {
        return vm.value
      },
      set(value: any) {
        this.$emit('update', value)
      }
    }
  },
  methods: {}
})
</script>

<style scoped lang="scss"></style>
