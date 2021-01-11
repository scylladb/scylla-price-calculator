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
import { hoursPerMonth } from '../common'

// hourly
const provisionedPricing = {
  wcu: 0.00065,
  rcu: 0.00013
}

const reservedPricing = {
  wcu: 0.000299232876712328,
  rcu: 5.92e-5
}

// per 1M ops
const onDemandPricing = {
  wcu: 1.25,
  rcu: 0.25
}

const storagePricing = 0.25 // GB/month

export default {
  props: {
    workload: {
      type: Object
    }
  },
  computed: {
    prices: (vm: Vue.DefineComponent) => {
      const wcu = Math.ceil(vm.workload.itemSize) * vm.workload.writes
      const rcu = Math.ceil(vm.workload.itemSize / 4) * vm.workload.reads
      const storage = vm.workload.storage * storagePricing
      const onDemand =
        ((rcu * onDemandPricing.rcu + wcu * onDemandPricing.wcu) *
          3600 *
          hoursPerMonth) /
        1e6
      const provisioned =
        (wcu * provisionedPricing.wcu + rcu * provisionedPricing.rcu) *
        hoursPerMonth
      const reserved =
        (wcu * reservedPricing.wcu + rcu * reservedPricing.rcu) * hoursPerMonth

      const _prices = [
        {
          id: 'dynamodb-on-demand',
          name: 'On demand',
          total: storage + onDemand,
          storage,
          ops: onDemand,
          database: 'DynamoDB'
        },
        {
          id: 'dynamodb-provisioned',
          name: 'Provisioned',
          total: storage + provisioned,
          storage,
          ops: provisioned,
          database: 'DynamoDB'
        },
        {
          id: 'dynamodb-reserved',
          name: 'Provisioned',
          subname: '(1y reserved)',
          total: storage + reserved,
          storage,
          ops: reserved,
          database: 'DynamoDB'
        }
      ]

      vm.$emit('update:modelValue', _prices)

      return _prices
    }
  }
}
</script>
