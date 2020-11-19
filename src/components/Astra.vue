<template>
<div class="pricing container" id="datastax-astra">
    <h1>Astra</h1>
    <form>
        <dropdown v-model="replicationFactor" readonly :options="[3, 4, 5]" description="Replication factor"></dropdown>
        <dropdown v-model="tier" :options="tiers.concat('AUTOSELECT')" description="Tier"></dropdown>
    </form>
    <template v-for="price in prices" :key="price.id">
    <div class="row container">
        <a data-toggle="collapse" :href="'#astra-' + price.id + '-price'" aria-expanded="false" :aria-controls="'astra' + price.id + '-price'">{{price.name}}: {{price.total.toLocaleString(undefined, {style: 'currency', currency: 'USD'})}}</a>
        <div class="collapse" :id="'astra-' + price.id + '-price'">
            <table class="table">
                <tbody>
                    <tr>
                        <td>Cluster nodes</td>
                        <td>{{price.total.toLocaleString(undefined, {style: 'currency', currency: 'USD'})}}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    </template>
    <div class="card">
        <div class="card-header">
            <button class="btn btn-link" data-toggle="collapse" data-target="#astra-details" aria-expanded="true" aria-controls="astra-details">More details</button>
        </div>
        <div class="collapse" id="astra-details">
            <h3>Cluster capacity</h3>
            <table class="table">
                <tbody>
                    <tr>
                        <td>Storage (post replication)</td>
                        <td>{{clusterCapacity.dataset.toLocaleString()}} GB</td>
                    </tr>
                    <tr>
                        <td>Sustained throughput</td>
                        <td>{{clusterCapacity.sustainedLoad.toLocaleString()}} ops/sec</td>
                    </tr>
                    <tr>
                        <td>Peak throughput</td>
                        <td>{{clusterCapacity.peakLoad.toLocaleString()}} ops/sec</td>
                    </tr>
                </tbody>
            </table>
            <h3>Cluster specs</h3>
            <table class="table">
                <tbody>
                    <tr>
                        <td>Capacity units</td>
                        <td>{{cluster.capacityUnits}} x {{cluster.instanceType.name}} <small>({{cluster.instanceType.vcpu.toLocaleString()}} vCPUs, {{cluster.instanceType.memory.toLocaleString()}}GB RAM, {{cluster.instanceType.storage.toLocaleString()}}GB storage)</small></td>
                    </tr>
                    <tr>
                        <td>Total vCPU</td>
                        <td>{{clusterCapacity.vcpu.toLocaleString()}}</td>
                    </tr>
                </tbody>
            </table>            
        </div>
    </div>
</div>    
</template>

<script lang="ts">
import Vue from 'vue'
import Dropdown from './Dropdown.vue'
import { WorkloadSpec, hoursPerMonth } from '../common'
import _ from 'lodash'

export interface PerfModeData {
    reads: number;
    writes: number;
}


const vcpuPerf: PerfModeData = {
    reads: 1500,
    writes: 1700
}

const RAMtoDiskRatio = 30


interface ResourceSpec {
    readonly vcpu: number;
    readonly memory: number;
    readonly storage: number;
}

interface Instance extends ResourceSpec {
    readonly name: string; 
    readonly hourlyPrice: HourlyPrice;
}

interface ClusterSpec {
    readonly capacityUnits: number;
    readonly instanceType: Instance;
}

type HourlyPrice = number
type MonthlyPrice = number

const instanceTypes = [
    {"name": "C10", "vcpu": 12, "memory": 48, "storage": 500, "hourlyPrice": 2.25},
    {"name": "C20", "vcpu": 24, "memory": 96, "storage": 500, "hourlyPrice": 3.1},
    {"name": "C40", "vcpu": 48, "memory": 192, "storage": 500, "hourlyPrice": 4.9},
    {"name": "D10", "vcpu": 12, "memory": 48, "storage": 1536, "hourlyPrice": 5.42},
    {"name": "D20", "vcpu": 24, "memory": 96, "storage": 1536, "hourlyPrice": 6.69},
    {"name": "D40", "vcpu": 48, "memory": 192, "storage": 1536, "hourlyPrice": 9.86}
]

function toMonthlyPrice(price: HourlyPrice): MonthlyPrice {
    return price * hoursPerMonth
}

function clusterPrice(clusterSpec: ClusterSpec): MonthlyPrice {
    return toMonthlyPrice(clusterSpec.instanceType.hourlyPrice)*clusterSpec.capacityUnits    
}

function clusterResources(cluster: ClusterSpec): ResourceSpec {
    return {storage: cluster.instanceType.storage*cluster.capacityUnits, vcpu: cluster.instanceType.vcpu*cluster.capacityUnits, memory:cluster.instanceType.memory*cluster.capacityUnits}
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

function selectClusterInstances(specs: ResourceSpec, replicationFactor: number, tier: string): ClusterSpec | undefined {
    const validSpecs: ClusterSpec[] = []

    for (const n of _.range(replicationFactor, 100*replicationFactor, replicationFactor)) {
        for (const instanceType of instanceTypes) {
            if ((tier == 'AUTOSELECT' && instanceType.vcpu * n > specs.vcpu && instanceType.memory * n > specs.memory && instanceType.storage * n > specs.storage) 
                ||
               (instanceType.name == tier && instanceType.vcpu * n > specs.vcpu && instanceType.storage * n > specs.storage)
            ) {
                validSpecs.push({instanceType, capacityUnits: n})
            }
        }
    }

    const lowestPrice = _.chain(validSpecs).map(clusterPrice).min().value()
    const x = _.chain(validSpecs).filter()

    return _.chain(validSpecs)
        .filter((spec) => clusterPrice(spec) < (lowestPrice * 1.2))
        .sortBy('capacityUnits')
        .head()
        .value()

}

const data = {
    replicationFactor: 3,
    tier: 'AUTOSELECT',
    tiers: instanceTypes.map(({name}) => name)
}

export default {
    data() {
        return data
    },
    props: ['workload'],
    components: {
        dropdown: Dropdown
    },
    computed: {
        estimatedResources: (vm: Vue.DefineComponent) => {
            const workload: WorkloadSpec = vm.workload
            const replicationFactor = vm.replicationFactor
            const vcpus = Math.ceil((workload.reads / vcpuPerf.reads + workload.writes / vcpuPerf.writes)*replicationFactor/itemSizePerfFactor(workload.itemSize))
            const memory = Math.ceil(workload.storage / RAMtoDiskRatio)*replicationFactor
            return {vcpu: vcpus, storage: workload.storage, memory}
        },
        cluster: (vm: Vue.DefineComponent): ClusterSpec | undefined => {
            return selectClusterInstances(vm.estimatedResources, vm.replicationFactor, vm.tier)
        },
        clusterCapacity: (vm: Vue.DefineComponent) => {
            const cluster: ClusterSpec = vm.cluster
            const totalResources = clusterResources(cluster)
            const dataset = totalResources.storage
            const peakLoad = totalResources.vcpu * (vcpuPerf.writes + vcpuPerf.reads)/2 / vm.replicationFactor
            const sustainedLoad = peakLoad * 0.66

            return {sustainedLoad, peakLoad, dataset, ...totalResources}
        },
        prices: (vm: Vue.DefineComponent) => {
            const workload: WorkloadSpec = vm.workload
            const replicationFactor = vm.replicationFactor
            const cluster: ClusterSpec = vm.cluster!
            const price = clusterPrice(cluster)

            return [
                {id: 'ondemand', name: 'On demand', total: price}
            ]
        }
    }
}

/* TODO: 
4. show peak workload capability 
*/
</script>

 