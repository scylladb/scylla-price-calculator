<template>
<div class="pricing container" id="scylla-cloud">
    <h1>Scylla cloud</h1>
    <form>
        <!-- <dropdown v-model="mode" :options="modes" description="Mode"></dropdown> -->
        <dropdown v-model="replicationFactor" readonly :options="[3, 4, 5]" description="Replication factor"></dropdown>
    </form>
    <template v-for="price in prices" :key="price.id">
    <div class="row container">
        <a data-toggle="collapse" :href="'#scylla-' + price.id + '-price'" aria-expanded="false" :aria-controls="'scylla' + price.id + '-price'">{{price.name}}: {{price.total.toLocaleString(undefined, {style: 'currency', currency: 'USD'})}}</a>
        <div class="collapse" :id="'scylla-' + price.id + '-price'">
            <table class="table">
                <tbody>
                    <tr>
                        <td>Cross AZ data transfer (replication)</td>
                        <td>{{price.dataTransfer.toLocaleString(undefined, {style: 'currency', currency: 'USD'})}}</td>
                    </tr>
                    <tr>
                        <td>Cluster nodes</td>
                        <td>{{price.compute.toLocaleString(undefined, {style: 'currency', currency: 'USD'})}}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    </template>
    <div class="card">
        <div class="card-header">
            <button class="btn btn-link" data-toggle="collapse" data-target="#scylla-details" aria-expanded="true" aria-controls="scylla-details">More details</button>
        </div>
        <div class="collapse" id="scylla-details">
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
                        <td>Nodes</td>
                        <td>{{cluster.nodes}} x {{cluster.instanceType.name}} <small>({{cluster.instanceType.vcpu.toLocaleString()}} vCPUs, {{cluster.instanceType.memory.toLocaleString()}}GB RAM, {{cluster.instanceType.storage.toLocaleString()}}GB storage)</small></td>
                    </tr>
                    <tr>
                        <td>Total raw storage</td>
                        <td>{{clusterCapacity.storage.toLocaleString()}}GB</td>
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

enum MODE {
    CQL = "CQL",
    LWT = "LWT",
    NoLWT = "NoLWT"
}

const OPTIMIZED_FOR = {
    CPU: "vcpu",
    STORAGE: "storage"
}

export interface PerfModeData {
    reads: number;
    writes: number;
}


const vcpuPerf: Record<MODE, PerfModeData> = {
    [MODE.CQL]: {
        reads: 6250,
        writes: 8000
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
const CompactionOverhead = 2
const RAMtoDiskRatio = 30

const modes: Record<string, MODE> = {
    "CQL": MODE.CQL,
    "Alternator with LWT": MODE.LWT,
    "Alternator without LWT": MODE.NoLWT
}
const data = {
        modes,
        mode: MODE.CQL,
        replicationFactor: 3,
        optimizeFor: OPTIMIZED_FOR.CPU
    }

interface ResourceSpec {
    readonly vcpu: number;
    readonly memory: number;
    readonly storage: number;
}

interface Instance extends ResourceSpec {
    readonly name: string; 
    readonly hourlyPrice: HourlyPrice;
    readonly reservedPrice: MonthlyPrice;
}

interface ClusterSpec {
    readonly nodes: number;
    readonly instanceType: Instance;
}

type HourlyPrice = number
type MonthlyPrice = number

const instanceTypes = {
    aws: [
        {name: 'i3.large', vcpu: 2, memory: 15.25, storage: 475, hourlyPrice: 0.327, reservedPrice: 155},
        {name: 'i3.xlarge', vcpu: 4, memory: 30.5, storage: 950, hourlyPrice: 0.654, reservedPrice: 310},
        {name: 'i3.2xlarge', vcpu: 8, memory: 61, storage: 1900, hourlyPrice: 1.309, reservedPrice: 620},
        {name: 'i3.4xlarge', vcpu: 16, memory: 122, storage: 3800, hourlyPrice: 2.618, reservedPrice: 1240},
        {name: 'i3.8xlarge', vcpu: 32, memory: 244, storage: 7600, hourlyPrice: 5.236, reservedPrice: 2480},
        {name: 'i3.16xlarge', vcpu: 64, memory: 488, storage: 15200, hourlyPrice: 10.471, reservedPrice: 4960},
        {name: 'i3en.large', vcpu: 2, memory: 16, storage: 1250, hourlyPrice: 0.568, reservedPrice: 269.83},
        {name: 'i3en.xlarge', vcpu: 4, memory: 32, storage: 2500, hourlyPrice: 1.137, reservedPrice: 539.75},
        {name: 'i3en.2xlarge', vcpu: 8, memory: 64, storage: 5000, hourlyPrice: 2.274, reservedPrice: 1079.5},
        {name: 'i3en.3xlarge', vcpu: 12, memory: 96, storage: 7500, hourlyPrice: 3.411, reservedPrice: 1619.25},
        {name: 'i3en.6xlarge', vcpu: 24, memory: 192, storage: 15000, hourlyPrice: 6.822, reservedPrice: 3238.42},
        {name: 'i3en.12xlarge', vcpu: 48, memory: 384, storage: 30000, hourlyPrice: 13.643, reservedPrice: 6476.83},
        {name: 'i3en.24xlarge', vcpu: 96, memory: 768, storage: 60000, hourlyPrice: 27.286, reservedPrice: 12953.75}
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
    return {storage: cluster.instanceType.storage*cluster.nodes, vcpu: cluster.instanceType.vcpu*cluster.nodes, memory:cluster.instanceType.memory*cluster.nodes}
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

function selectClusterInstances<K extends keyof Instance>(specs: ResourceSpec, replicationFactor: number, optimizedFor: K): ClusterSpec | undefined {
    const instances = instanceTypes.aws
    const validSpecs = []

    for (const n of _.range(replicationFactor, 100*replicationFactor, replicationFactor)) {
        for (const instanceType of instances) {
            if (instanceType.vcpu * n > specs.vcpu && instanceType.memory * n > specs.memory && instanceType.storage * n > specs.storage) {
                validSpecs.push({instanceType, nodes: n})
            }
        }
    }

    const lowestPrice = _.chain(validSpecs).map(ondemandPrice).sort().head().value()
    const x = _.chain(validSpecs).filter()

    return _.chain(validSpecs)
        .filter((spec) => ondemandPrice(spec) < (lowestPrice * 1.2))
        .sortBy('nodes')
        .head()
        .value()

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
        dimensions() {
            return Object.fromEntries(Object.entries(OPTIMIZED_FOR))
        },
        estimatedResources: (vm: Vue.DefineComponent) => {
            const workload: WorkloadSpec = vm.workload
            const replicationFactor = vm.replicationFactor
            const perf = vcpuPerf[vm.mode as MODE]
            const vcpus = Math.ceil((workload.reads / perf.reads + workload.writes / perf.writes)*replicationFactor/itemSizePerfFactor(workload.itemSize))
            const memory = Math.ceil(workload.storage / RAMtoDiskRatio)*replicationFactor
            const storage = workload.storage * replicationFactor * CompactionOverhead
            return {vcpu: vcpus, storage, memory}
        },
        cluster: (vm: Vue.DefineComponent): ClusterSpec | undefined => {
            return selectClusterInstances(vm.estimatedResources, vm.replicationFactor, vm.optimizeFor)
        },
        clusterCapacity: (vm: Vue.DefineComponent) => {
            const cluster: ClusterSpec = vm.cluster
            const perf = vcpuPerf[vm.mode as MODE]
            const totalResources = clusterResources(cluster)
            const dataset = totalResources.storage / vm.replicationFactor / CompactionOverhead  
            const sustainedLoad = totalResources.vcpu * (perf.writes + perf.reads)/2 / vm.replicationFactor
            const peakLoad = sustainedLoad * 1.5

            return {sustainedLoad, peakLoad, dataset, ...totalResources}
        },
        prices: (vm: Vue.DefineComponent) => {
            const workload: WorkloadSpec = vm.workload
            const replicationFactor = vm.replicationFactor
            // currently, Scylla requires each replica to be in a different AZ
            const replicationTraffic = (workload.reads + workload.writes)*workload.itemSize*(replicationFactor - 1) / 1E6
            const dataTransfer = replicationTraffic * AWSDataTransferPrice
            const cluster: ClusterSpec = vm.cluster!
            const onDemand = toMonthlyPrice(ondemandPrice(cluster))
            const reserved = reservedPrice(cluster)

            return [
                {id: 'ondemand', name: 'On demand', compute: onDemand, dataTransfer, total: onDemand + dataTransfer},
                {id: 'reserved', name: 'Reserved', compute: reserved, dataTransfer, total: reserved + dataTransfer}
            ]
        }
    }
}

/* TODO: 
4. show peak workload capability 
*/
</script>

 