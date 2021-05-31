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
              {{formatPrice(price.compute + price.license)}}
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
                      ${{formatPrice(price.dataTransfer)}}
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
                      ${{formatPrice(price.compute + price.license)}}
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
                      ${{formatPrice(price.total)}}
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
                  <b>op/sec</b>
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
import {prices as scyllaCloudPrices, clusterCapacity as scyllaCloudClusterCapacity, MODE} from '../models/ScyllaCloud'

const modes: Record<string, MODE> = {
  CQL: MODE.CQL,
  'Alternator with LWT': MODE.LWT,
  'Alternator without LWT': MODE.NoLWT
}

const data = {
  modes,
  mode: MODE.CQL,
  replicationFactor: 3,
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
  methods: {
    formatPrice(price: number): string {
      return price > 1000 ? price.toLocaleString(undefined, {maximumFractionDigits: 0}) : price.toLocaleString(undefined, {maximumFractionDigits: 2})
    }
  },
  computed: {
    filteredPrices(vm: Vue.DefineComponent) {
      if (!vm.pricing) return vm.prices
      return vm.prices.filter((p: any) => p.id === vm.pricing)
    },
    clusterSpecs(vm: Vue.DefineComponent) {
      return scyllaCloudPrices(vm.workload, vm.replicationFactor)
    },
    cluster(vm: Vue.DefineComponent) {
      return vm.clusterSpecs.cluster
    },
    prices(vm: Vue.DefineComponent)  {
      const {prices: _prices} = vm.clusterSpecs
      vm.$emit('update:modelValue', _prices)
      return _prices
    },
    clusterCapacity(vm: Vue.DefineComponent) {
      return scyllaCloudClusterCapacity(vm.clusterSpecs.cluster, vm.replicationFactor)
    } 
  }
}

/* TODO: 
4. show peak workload capability 
*/
</script>
