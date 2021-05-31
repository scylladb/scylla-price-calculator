<template>
  <div class="pricing" id="keyspaces">
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
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import {prices as keyspacesPrices} from '../models/Keyspaces'

export default {
  props: ['workload'],
  computed: {
    prices: (vm: Vue.DefineComponent) => {
      const _prices = keyspacesPrices(vm.workload)
      vm.$emit('update:modelValue', _prices)
      return _prices
    }
  }
}
</script>
