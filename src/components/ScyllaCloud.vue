<template>
<div class="pricing" id="scylla-cloud">
    <h1>Scylla cloud</h1>
    <form>
        <dropdown v-model="mode" :options="modes" description="Mode"></dropdown>
        <div class="form-group row"><label class="col-form-label col-sm-6" for="replication-factor">Replication factor</label><input type="text" id="replication-factor" name="replication-factor" class="form-control col-sm-3" v-model="replicationFactor"></div>
    </form>
    <table class="table">
        <thead>
            <tr>
            <th>Cluster type</th>
            <th>Cost</th>
            </tr>
        </thead>
        <tr>
            <td>On demand</td>
            <td>{{price.onDemand.toLocaleString(undefined, {style: 'currency', currency: 'USD'})}}</td>
        </tr>
        <tr>
            <td>Reserved</td>
            <td>{{price.reserved.toLocaleString(undefined, {style: 'currency', currency: 'USD'})}}</td>
        </tr>
    </table>    
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

const ScyllCloudStoragePervCPU = 230
const CompactionOverhead = 2

function estimatePrice(
    workload: WorkloadSpec,
    replicationFactor: number,
    mode: MODE): CloudPricing {
        console.log(mode)
    const perf = vcpuPerf[mode]
    const vcpus = Math.ceil(workload.reads / perf.reads + workload.writes / perf.writes)
    const storageUnits = Math.ceil(workload.storage*replicationFactor*CompactionOverhead / ScyllCloudStoragePervCPU)
    const vcpuUnits = Math.max(vcpus, storageUnits) 

    return {
        onDemand: vcpuUnits*ScyllaCloudvCPUPricing.onDemand,
        reserved: vcpuUnits*ScyllaCloudvCPUPricing.reserved 
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
        price: (vm: Vue.DefineComponent): CloudPricing => {
            return estimatePrice(vm.workload, vm.replicationFactor, vm.mode)
        }
    }
}
</script>