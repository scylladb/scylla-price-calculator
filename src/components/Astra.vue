<template>
  <div class="pricing" id="datastax-astra">
    <template v-if="true">
      <template v-for="price in prices" :key="price.id">
        <div>
          <div class="price-name text-capitalize">{{ price.name }}</div>
          <div class="price__wrapper">
            <div class="price d-flex align-items-baseline">
              <small>$</small
              >{{
                price.total.toLocaleString(undefined, {
                  maximumFractionDigits: 2
                })
              }}
            </div>
          </div>
        </div>
      </template>
      <div v-if="!hideSpecs" class="card">
        <div class="card-header">
          <button
            class="btn btn-link"
            data-bs-toggle="collapse"
            data-bs-target="#astra-details"
            aria-expanded="true"
            aria-controls="astra-details"
          >
            More details
          </button>
        </div>
        <div class="collapse" id="astra-details">
          <h3>Detailed pricing</h3>
          <table class="table">
            <tbody>
              <tr>
              </tr>
              <tr>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, DefineComponent} from 'vue'
import {Astra} from '../Calculator'

export default defineComponent({
  data() {
    return {}
  },
  props: {
    workload: {
      type: Object
    },
    hideSpecs: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    prices: (vm: DefineComponent) => {
      const _prices = Astra.prices(vm.workload)

      vm.$emit('update:modelValue', _prices)
      return _prices
    }
  }
})

</script>
