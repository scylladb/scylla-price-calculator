<template>
<div class="pricing container" id="scylla-cloud">
    <h1>Scylla cloud</h1>
    <form>
        <dropdown v-model="mode" :options="modes" description="Mode"></dropdown>
        <div class="form-group row"><label class="col-form-label col-sm-6" for="replication-factor">Replication factor</label><input type="text" id="replication-factor" name="replication-factor" class="form-control col-sm-3" v-model="replicationFactor"></div>
    </form>
    <template v-for="price in prices" :key="price.id">
    <div class="row container">
        <a data-toggle="collapse" :href="'#scylla-' + price.id + '-price'" aria-expanded="false" :aria-controls="'scylla' + price.id + '-price'">{{price.name}}: {{price.total.toLocaleString(undefined, {style: 'currency', currency: 'USD'})}}</a>
        <table class="table collapse" :id="'scylla-' + price.id + '-price'">
            <tbody>
                <tr>
                    <td>Cross AZ data transfer (replication)</td>
                    <td>{{price.dataTransfer.toLocaleString(undefined, {style: 'currency', currency: 'USD'})}}</td>
                </tr>
                <tr>
                    <td>Cluster nodes</td>
                    <td>{{price.nodes.toLocaleString(undefined, {style: 'currency', currency: 'USD'})}}</td>
                </tr>
            </tbody>
        </table>
    </div>
    </template>
</div>    
</template>

<script lang="ts">
import Vue from 'vue'
import Dropdown from './Dropdown.vue'
import { CloudPricing, WorkloadSpec } from '../common'

enum MODE {
    CQL = "CQL",
    LWT = "LWT",
    NoLWT = "NoLWT"
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


const ScyllaCloudvCPUPricing: CloudPricing = {
    onDemand: 120,
    reserved: 77
}

const AWSDataTransfer = 0.01 // GB/month

const ScyllCloudStoragePervCPU = 230
const CompactionOverhead = 2

function estimatePrice(
    workload: WorkloadSpec,
    replicationFactor: number,
    mode: MODE) {
    const perf = vcpuPerf[mode]
    const vcpus = Math.ceil(workload.reads / perf.reads + workload.writes / perf.writes)
    const storageUnits = Math.ceil(workload.storage*replicationFactor*CompactionOverhead / ScyllCloudStoragePervCPU)
    const vcpuUnits = Math.max(vcpus, storageUnits) 
    const replicationTraffic = workload.writes * workload.itemSize * replicationFactor / 2

    return {
        onDemand: vcpuUnits*ScyllaCloudvCPUPricing.onDemand,
        reserved: vcpuUnits*ScyllaCloudvCPUPricing.reserved,
        dataTransfer: replicationTraffic * AWSDataTransfer
    }
}

const modes: Record<string, MODE> = {
    "CQL": MODE.CQL,
    "Alternator with LWT": MODE.LWT,
    "Alternator without LWT": MODE.NoLWT
}
const data = {
        modes,
        mode: MODE.CQL,
        replicationFactor: 3
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
        prices: (vm: Vue.DefineComponent) => {
            const {onDemand, reserved, dataTransfer} = estimatePrice(vm.workload, vm.replicationFactor, vm.mode)
            return [
                {id: 'on-demand', name: 'On demand', total: dataTransfer + onDemand, nodes: onDemand, dataTransfer},
                {id: 'reserved', name: 'Reserved', total: dataTransfer + reserved, nodes: reserved, dataTransfer}
            ]
        }
    }
}
</script>