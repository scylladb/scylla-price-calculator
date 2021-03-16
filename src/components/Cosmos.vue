<template>
  <div class="pricing" id="cosmos">
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
import { hoursPerMonth } from '../common'

// hourly ($0.008 per 100RU)
const provisionedPricing = {
  wcu: 0.00008,
  rcu: 0.00008
}

// per 1M ops
const onDemandPricing = {
  wcu: 0.25,
  rcu: 0.25
}

const storagePricing = 0.25 // GB/month
const CrossAZRUModifier = 1.25
const ThroughputAvgFactor = 0.33

export default {
  props: ['workload'],
  computed: {
    prices: (vm: Vue.DefineComponent) => {
      const wcu = Math.ceil(vm.workload.itemSize) * vm.workload.writes * CrossAZRUModifier
      const rcu = Math.ceil(vm.workload.itemSize / 4) * vm.workload.reads * CrossAZRUModifier
      const storage = vm.workload.storage * storagePricing
      const onDemand =
        ((rcu * onDemandPricing.rcu + wcu * onDemandPricing.wcu) *
          3600 *
          hoursPerMonth) /
        1e6 * ThroughputAvgFactor
      const provisioned =
        (wcu * provisionedPricing.wcu + rcu * provisionedPricing.rcu) *
        hoursPerMonth

      const _prices = [
        {
          id: 'on-demand',
          name: 'On demand',
          total: storage + onDemand,
          storage,
          ops: onDemand,
          database: 'cosmos'
        },
        {
          id: 'provisioned',
          name: 'Provisioned',
          total: storage + provisioned,
          storage,
          ops: provisioned,
          database: 'cosmos'
        }
      ]

      vm.$emit('update:modelValue', _prices)
      return _prices
    }
  }
}
</script>
