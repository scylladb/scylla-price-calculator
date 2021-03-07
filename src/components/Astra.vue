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
import { WorkloadSpec, hoursPerMonth } from '../common'

type MonthlyPrice = number
interface DetailedPricing {
  write: MonthlyPrice,
  read: MonthlyPrice,
  storage: MonthlyPrice,
  dataTransfer: MonthlyPrice
}

const ThroughputAvgFactor = 0.33

const astraPricing = {
  wcu: 1.24,          // per 1M
  rcu: 0.24,          // per 1M
  storage: 0.25,      // GB/month
  dataTransfer: 0.11  // GB/month
}

function estimatedMonthlyThroughput(throughputPerSec: number): number {
  return throughputPerSec * 3600 * hoursPerMonth * ThroughputAvgFactor
}

function calcPrice(workload: WorkloadSpec): DetailedPricing {
  const rcu = estimatedMonthlyThroughput(workload.reads) * Math.ceil(workload.itemSize / 4) / 1E6
  const wcu = estimatedMonthlyThroughput(workload.writes) * Math.ceil(workload.itemSize) / 1E6
  const storageUnits = workload.storage
  const dataTransfer = estimatedMonthlyThroughput(workload.reads) * workload.itemSize / 1E6

  return {
    read: rcu*astraPricing.rcu,
    write: wcu*astraPricing.wcu,
    storage: storageUnits*astraPricing.storage,
    dataTransfer: dataTransfer*astraPricing.dataTransfer
  }
}

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
      const price = calcPrice(vm.workload)
      const totalPrice = price.write + price.read + price.storage + price.dataTransfer

      const _prices = [
        { id: 'ondemand', name: 'On demand', total: totalPrice, database: 'Astra' }
      ]

      vm.$emit('update:modelValue', _prices)
      return _prices
    }
  }
})

/* TODO: 
4. show peak workload capability 
*/
</script>
