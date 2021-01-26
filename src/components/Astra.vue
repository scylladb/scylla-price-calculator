<template>
  <div class="pricing" id="datastax-astra">
    <form class="d-none">
      <dropdown
        v-model="replicationFactor"
        readonly
        :options="[3, 4, 5]"
        description="Replication factor"
      ></dropdown>
      <dropdown
        v-model="tier"
        :options="tiers.concat('AUTOSELECT')"
        description="Tier"
      ></dropdown>
    </form>
    <template v-if="cluster">
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
          <h3>Cluster capacity</h3>
          <table class="table">
            <tbody>
              <tr>
                <td>Data set size</td>
                <td>{{ clusterCapacity.storage.toLocaleString() }} GB</td>
              </tr>
              <tr>
                <td>Throughput</td>
                <td>{{ clusterCapacity.throughput.toLocaleString() }} ops/sec</td>
              </tr>
            </tbody>
          </table>
          <h3>Cluster specs</h3>
          <table class="table">
            <tbody>
              <tr>
                <td>Capacity units</td>
                <td>
                  {{ cluster.capacityUnits }} x {{ cluster.instanceType.name }}
                  <small
                    >({{ cluster.instanceType.vcpu.toLocaleString() }} vCPUs,
                    {{ cluster.instanceType.memory.toLocaleString() }}GB RAM,
                    {{ cluster.instanceType.storage.toLocaleString() }}GB
                    storage)</small
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
    <div class="alert alert-warning" v-else>
      <p>Could not find suitable configuration</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, DefineComponent, h } from 'vue'
import Dropdown from './Dropdown.vue'
import { WorkloadSpec, hoursPerMonth } from '../common'
import _ from 'lodash'

export interface PerfModeData {
  reads: number
  writes: number
}

interface ResourceSpec {
  readonly vcpu: number
  readonly memory: number
  readonly storage: number,
  readonly throughput: number
}

interface Instance extends ResourceSpec {
  readonly name: string
  readonly hourlyPrice: HourlyPrice
}

interface ClusterSpec {
  readonly capacityUnits: number
  readonly instanceType: Instance
}

type HourlyPrice = number
type MonthlyPrice = number

const instanceTypes = [
  { name: 'C10', vcpu: 12, memory: 48, storage: 500, hourlyPrice: 2.25, throughput: 5000 },
  { name: 'C20', vcpu: 24, memory: 96, storage: 500, hourlyPrice: 3.1, throughput: 7500 },
  { name: 'C40', vcpu: 48, memory: 192, storage: 500, hourlyPrice: 4.9, throughput: 15000 },
  // { name: 'D10', vcpu: 12, memory: 48, storage: 1536, hourlyPrice: 5.42 },
  // { name: 'D20', vcpu: 24, memory: 96, storage: 1536, hourlyPrice: 6.69 },
  // { name: 'D40', vcpu: 48, memory: 192, storage: 1536, hourlyPrice: 9.86 }
]

function toMonthlyPrice(price: HourlyPrice): MonthlyPrice {
  return price * hoursPerMonth
}

function clusterPrice(clusterSpec: ClusterSpec): MonthlyPrice {
  return (
    toMonthlyPrice(clusterSpec.instanceType.hourlyPrice) *
    clusterSpec.capacityUnits
  )
}

function clusterResources(cluster: ClusterSpec): ResourceSpec {
  return {
    storage: cluster.instanceType.storage * cluster.capacityUnits,
    vcpu: cluster.instanceType.vcpu * cluster.capacityUnits,
    memory: cluster.instanceType.memory * cluster.capacityUnits,
    throughput: cluster.instanceType.throughput * cluster.capacityUnits
  }
}

function itemSizePerfFactor(itemSize: number): number {
  if (itemSize <= 10) {
    return 1
  } else if (itemSize < 100) {
    return 0.75
  } else if (itemSize < 1000) {
    return 0.5
  } else {
    return 0.25
  }
}

/* Cluster size recommendations based on the optimization target:
- performance (CPU) - select nodes with enough storage and max cpu
- storage - select nodes with enough cpu and max storage
- cost - select nodes with just enough cpu and storage, even if smaller nodes
*/

function selectClusterInstances(
  workload: WorkloadSpec,
  tier: string
): ClusterSpec | undefined {
  const validSpecs: ClusterSpec[] = []
  const workloadThroughput = workload.writes + workload.reads

  for (const n of _.range(1, 500)) {
    for (const instanceType of instanceTypes) {
      if (
        (tier == 'AUTOSELECT' &&
          instanceType.throughput * n >= workloadThroughput &&
          instanceType.storage * n >= workload.storage) ||
        (instanceType.name == tier &&
          instanceType.throughput * n >= workloadThroughput &&
          instanceType.storage * n >= workload.storage)
      ) {
        validSpecs.push({ instanceType, capacityUnits: n })
      }
    }
  }

  const lowestPrice = _.chain(validSpecs)
    .map(clusterPrice)
    .min()
    .value()
  return _.chain(validSpecs)
    .filter(spec => clusterPrice(spec) < lowestPrice * 1.1)
    .sortBy('capacityUnits')
    .head()
    .value()
}

const data = {
  replicationFactor: 3,
  tier: 'AUTOSELECT',
  tiers: instanceTypes.map(({ name }) => name)
}

export default defineComponent({
  data() {
    return data
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
  components: {
    dropdown: Dropdown
  },
  computed: {
    cluster: (vm: DefineComponent): ClusterSpec | undefined => {
      return selectClusterInstances(
        vm.workload,
        vm.tier
      )
    },
    clusterCapacity: (vm: DefineComponent) => {
      const cluster: ClusterSpec = vm.cluster
      return clusterResources(cluster)
    },
    prices: (vm: DefineComponent) => {
      const workload: WorkloadSpec = vm.workload
      const cluster: ClusterSpec = vm.cluster!
      const price = clusterPrice(cluster)

      const _prices = [
        { id: 'ondemand', name: 'On demand', total: price, database: 'Astra' }
      ]

      vm.$emit('update:modelValue', _prices)
      return _prices
    }
  },
  render() {
    console.log('render')
    if (_.isEmpty(this.cluster)) {
      return h('p', 'No suitable cluster could be slected')
    } else {
      return this.$slots.default
    }
  }
})

/* TODO: 
4. show peak workload capability 
*/
</script>
