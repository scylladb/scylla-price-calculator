<template>
  <div class="pricing" id="dynamodb">
    <template v-for="price in prices" :key="price.id">
      <div>
        <div class="price-name text-capitalize">
          {{ price.name }}
          <div class="font-weight-light d-inline-block">
            {{ price.subname }}
          </div>
        </div>
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
import {DynamoDB} from '../Calculator'

export default {
  props: {
    workload: {
      type: Object
    }
  },
  computed: {
    prices: (vm: Vue.DefineComponent) => {
      const _prices = DynamoDB.prices(vm.workload)
      vm.$emit('update:modelValue', _prices)

      return _prices
    }
  }
}
</script>
