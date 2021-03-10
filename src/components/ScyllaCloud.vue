<template>
  <div class="pricing" id="scylla-cloud">
    <!--        <form>-->
    <!--            &lt;!&ndash; <dropdown v-model="mode" :options="modes" description="Mode"></dropdown> &ndash;&gt;-->
    <!--            <dropdown v-model="replicationFactor" readonly :options="[3, 4, 5]" description="Replication factor"></dropdown>-->
    <!--        </form>-->
    <template v-if="cluster">
      <div v-for="(price, i) in filteredPrices" :key="i">
        <div>
          <div class="price-name text-capitalize">{{ price.name }}</div>
          <div class="price__wrapper">
            <div class="price d-flex align-items-baseline">
              <small>$</small>
              {{price.compute > 1000 ? price.compute.toLocaleString(undefined, {maximumFractionDigits: 0}) :
                price.compute.toLocaleString(undefined, {
                  maximumFractionDigits: 2
                })
              }}
            </div>
            <button
              class="btn btn-link collapsed"
              data-bs-toggle="collapse"
              :data-bs-target="'#scylla-details-' + price.id"
              aria-expanded="true"
              aria-controls="scylla-details"
            >
              Details
              <i class="bi bi-chevron-bar-down"></i>
            </button>
          </div>
          <div
            class="collapse details__wrapper"
            :id="'scylla-details-' + price.id"
          >
            <table class="table mt-2">
              <tbody>
                <tr>
                  <td>
                    {{ pricing == 'reserved' ? '1 Year commitment' : 'No commitment!' }}
                  </td>
                </tr>
                <tr>
                  <td class="d-flex">
                    <div>Cross AZ data transfer (replication)</div>
                    <div class="dashline"></div>
                  </td>
                  <td>
                    <strong>
                      ${{price > 10 ? price.dataTransfer.toLocaleString(undefined, {maximumFractionDigits: 0}) :
                        price.dataTransfer.toLocaleString(undefined, {
                          maximumFractionDigits: 2
                        })
                      }}
                    </strong>
                  </td>
                </tr>
                <tr>
                  <td class="d-flex">
                    <div>Cluster nodes</div>
                    <div class="dashline"></div>
                  </td>
                  <td>
                    <strong>
                      ${{
                        price.compute.toLocaleString(undefined, {
                          maximumFractionDigits: 0
                        })
                      }}
                    </strong>
                  </td>
                </tr>
                                <tr>
                  <td class="d-flex">
                    <div>Total</div>
                    <div class="dashline"></div>
                  </td>
                  <td>
                    <strong>
                      ${{
                        price.total.toLocaleString(undefined, {
                          maximumFractionDigits: 0
                        })
                      }}
                    </strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-if="!hideSpecs" class="tech-specs">
          <h2 class="mb-3">Technical Specs</h2>
          <h3>Cluster capacity</h3>
          <table class="table">
            <colgroup>
              <col span="1" style="width: 30%;" />
              <col span="1" style="width: 70%;" />
            </colgroup>
            <tbody>
              <tr v-tooltip="'Total usable (net) online storage, after accounting for compaction and replication overhead.'">
                <td>Max dataset size</td>
                <td>
                  <strong>{{
                    (clusterCapacity.dataset / 2**10).toLocaleString()
                  }}</strong>
                  <b>TB</b>
                </td>
              </tr>
              <tr v-tooltip="'Total read and write combined throughput'">
                <td>Peak throughput</td>
                <td>
                  <strong>{{
                    clusterCapacity.peakLoad.toLocaleString()
                  }}</strong>
                  <b>ops/sec</b>
                </td>
              </tr>
            </tbody>
          </table>
          <h3>Cluster specs</h3>
          <table class="table">
            <colgroup>
              <col span="1" style="width: 30%;" />
              <col span="1" style="width: 70%;" />
            </colgroup>
            <tbody>
              <tr>
                <td>Nodes</td>
                <td>
                  <strong>
                    {{ cluster.nodes }} x {{ cluster.instanceType.name }}
                  </strong>
                  <b>({{ cluster.instanceType.vcpu.toLocaleString() }} vCPUs,
                    {{ cluster.instanceType.memory.toLocaleString() }}GB RAM,
                    {{ cluster.instanceType.storage.toLocaleString() }}GB
                    storage)</b
                  >
                </td>
              </tr>
              <tr>
                <td>Disk storage</td>
                <td>
                  <strong>{{
                    (clusterCapacity.storage / 2**10).toLocaleString()
                  }}</strong>
                  <b>TB</b>
                </td>
              </tr>
              <tr>
                <td>Total vCPU</td>
                <td>
                  <strong>{{ clusterCapacity.vcpu.toLocaleString() }}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
    <div v-else class="alert alert-warning">
      Could not find suitable configuration
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { WorkloadSpec, hoursPerMonth } from '../common'
import _ from 'lodash'

enum MODE {
  CQL = 'CQL',
  LWT = 'LWT',
  NoLWT = 'NoLWT'
}

const OPTIMIZED_FOR = {
  CPU: 'vcpu',
  STORAGE: 'storage'
}

export interface PerfModeData {
  reads: number
  writes: number
}

const vcpuPerf: Record<MODE, PerfModeData> = {
  [MODE.CQL]: {
    reads: 8000,
    writes: 10000
  },
  [MODE.LWT]: {
    writes: 1200,
    reads: 4000
  },
  [MODE.NoLWT]: {
    writes: 6000,
    reads: 4000
  }
}

const AWSDataTransferPrice = 0.01 // GB/month
const DataThroughputAvgFactor = 0.33
const CompactionOverhead = 1.4 // ICS
const RAMtoDiskRatio = 100
const RAMtoDataRatio = 75 // ICS

const modes: Record<string, MODE> = {
  CQL: MODE.CQL,
  'Alternator with LWT': MODE.LWT,
  'Alternator without LWT': MODE.NoLWT
}
const data = {
  modes,
  mode: MODE.CQL,
  replicationFactor: 3,
  optimizeFor: OPTIMIZED_FOR.CPU
}

interface ResourceSpec {
  readonly vcpu: number
  readonly memory: number
  readonly storage: number
}

interface Instance extends ResourceSpec {
  readonly name: string
  readonly hourlyPrice: HourlyPrice
  readonly reservedPrice: MonthlyPrice
}

interface ClusterSpec {
  readonly nodes: number
  readonly instanceType: Instance
}

type HourlyPrice = number
type MonthlyPrice = number

const instanceTypes = {
  aws: [
    {
      name: 'i3.large',
      vcpu: 2,
      memory: 15.25,
      storage: 475,
      hourlyPrice: 0.327,
      reservedPrice: 155
    },
    {
      name: 'i3.xlarge',
      vcpu: 4,
      memory: 30.5,
      storage: 950,
      hourlyPrice: 0.654,
      reservedPrice: 310
    },
    {
      name: 'i3.2xlarge',
      vcpu: 8,
      memory: 61,
      storage: 1900,
      hourlyPrice: 1.309,
      reservedPrice: 620
    },
    {
      name: 'i3.4xlarge',
      vcpu: 16,
      memory: 122,
      storage: 3800,
      hourlyPrice: 2.618,
      reservedPrice: 1240
    },
    {
      name: 'i3.8xlarge',
      vcpu: 32,
      memory: 244,
      storage: 7600,
      hourlyPrice: 5.236,
      reservedPrice: 2480
    },
    {
      name: 'i3.16xlarge',
      vcpu: 64,
      memory: 488,
      storage: 15200,
      hourlyPrice: 10.471,
      reservedPrice: 4960
    },
    {
      name: 'i3en.large',
      vcpu: 2,
      memory: 16,
      storage: 1250,
      hourlyPrice: 0.568,
      reservedPrice: 269.83
    },
    {
      name: 'i3en.xlarge',
      vcpu: 4,
      memory: 32,
      storage: 2500,
      hourlyPrice: 1.137,
      reservedPrice: 539.75
    },
    {
      name: 'i3en.2xlarge',
      vcpu: 8,
      memory: 64,
      storage: 5000,
      hourlyPrice: 2.274,
      reservedPrice: 1079.5
    },
    {
      name: 'i3en.3xlarge',
      vcpu: 12,
      memory: 96,
      storage: 7500,
      hourlyPrice: 3.411,
      reservedPrice: 1619.25
    },
    {
      name: 'i3en.6xlarge',
      vcpu: 24,
      memory: 192,
      storage: 15000,
      hourlyPrice: 6.822,
      reservedPrice: 3238.42
    },
    {
      name: 'i3en.12xlarge',
      vcpu: 48,
      memory: 384,
      storage: 30000,
      hourlyPrice: 13.643,
      reservedPrice: 6476.83
    },
    {
      name: 'i3en.24xlarge',
      vcpu: 96,
      memory: 768,
      storage: 60000,
      hourlyPrice: 27.286,
      reservedPrice: 12953.75
    }
  ]
}

function ondemandPrice(cluster: ClusterSpec): HourlyPrice {
  return cluster.nodes * cluster.instanceType.hourlyPrice
}

function reservedPrice(cluster: ClusterSpec): MonthlyPrice {
  return cluster.nodes * cluster.instanceType.reservedPrice
}

function toMonthlyPrice(price: HourlyPrice): MonthlyPrice {
  return price * hoursPerMonth
}

function clusterResources(cluster: ClusterSpec): ResourceSpec {
  return {
    storage: cluster.instanceType.storage * cluster.nodes,
    vcpu: cluster.instanceType.vcpu * cluster.nodes,
    memory: cluster.instanceType.memory * cluster.nodes
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
function selectClusterConfigs(specs: ResourceSpec): ClusterSpec[] {
  return instanceTypes.aws.map(instanceType => {
    const nodes = _.find(_.range(1, 300), n => (
        instanceType.vcpu * n >= specs.vcpu &&
        instanceType.memory * n >= specs.memory &&
        instanceType.storage * n >= specs.storage
      )) || 0
    return {instanceType, nodes}
  }).filter(({nodes}) => nodes > 0)
}


function selectClusterInstances<K extends keyof Instance>(
  perf: PerfModeData,
  workload: WorkloadSpec,
  replicationFactor: number,
  optimizedFor: K
): ClusterSpec | undefined {
  const diskSpace = workload.storage * CompactionOverhead
  const recommendedResources: ResourceSpec = {
    vcpu: (workload.reads / perf.reads + workload.writes / perf.writes) / itemSizePerfFactor(workload.itemSize),
    storage: diskSpace,
    memory: Math.ceil(workload.storage / RAMtoDataRatio)
  }

  const minimalResources: ResourceSpec = {
    ...recommendedResources,
    memory: Math.ceil(diskSpace / RAMtoDiskRatio)
  }

  const recommendedConfigs = selectClusterConfigs(recommendedResources)
  const minimalConfigs = selectClusterConfigs(minimalResources)

  const lowestPrice = _.chain(minimalConfigs)
    .map(ondemandPrice)
    .min()
    .value()
  
  const bestConfig = (configs: ClusterSpec[]) => _.chain(configs)
    .filter(spec => ondemandPrice(spec) < lowestPrice * 1.2)
    .sortBy('nodes')
    .head()
    .value()

  const selectedConfig = bestConfig(recommendedConfigs) || bestConfig(minimalConfigs)

  return {
    ...selectedConfig,
    nodes: selectedConfig.nodes*replicationFactor
  }
}

export default {
  data() {
    return data
  },
  props: {
    workload: {
      type: Object
    },
    pricing: {
      type: String,
      enum: ['reserved', 'ondemand']
    },
    hideSpecs: {
      type: Boolean,
      default: false
    }
  },
  components: {},
  computed: {
    filteredPrices(vm: Vue.DefineComponent) {
      if (!vm.pricing) return vm.prices
      return vm.prices.filter((p: any) => p.id === vm.pricing)
    },
    dimensions() {
      return Object.fromEntries(Object.entries(OPTIMIZED_FOR))
    },
    cluster: (vm: Vue.DefineComponent): ClusterSpec | undefined => {
      return selectClusterInstances(
        vcpuPerf[vm.mode as MODE],
        vm.workload,
        vm.replicationFactor,
        vm.optimizeFor
      )
    },
    clusterCapacity: (vm: Vue.DefineComponent) => {
      const cluster: ClusterSpec = vm.cluster
      const perf = vcpuPerf[vm.mode as MODE]
      const totalResources = clusterResources(cluster)
      const dataset =
        totalResources.storage / vm.replicationFactor / CompactionOverhead
      const peakLoad =
        (totalResources.vcpu * (perf.writes + perf.reads)) /
        2 /
        vm.replicationFactor
      const sustainedLoad = peakLoad * 0.66

      return { sustainedLoad, peakLoad, dataset, ...totalResources }
    },
    prices: (vm: Vue.DefineComponent) => {
      const workload: WorkloadSpec = vm.workload
      const replicationFactor = vm.replicationFactor
      // currently, Scylla requires each replica to be in a different AZ
      const replicationTraffic =
        hoursPerMonth * 3600 * ((workload.reads + workload.writes) *
          workload.itemSize *
          (replicationFactor - 1)) /
        1e6 * DataThroughputAvgFactor
      const dataTransfer = replicationTraffic * AWSDataTransferPrice
      const cluster: ClusterSpec = vm.cluster!
      const onDemand = toMonthlyPrice(ondemandPrice(cluster))
      const reserved = reservedPrice(cluster)
      const prices = [
        {
          id: 'ondemand',
          name: 'On demand',
          compute: onDemand,
          dataTransfer,
          total: onDemand + dataTransfer
        },
        {
          id: 'reserved',
          name: 'Reserved',
          compute: reserved,
          dataTransfer,
          total: reserved + dataTransfer
        }
      ]
      vm.$emit('update:modelValue', prices)

      return prices
    }
  }
}

/* TODO: 
4. show peak workload capability 
*/
</script>
