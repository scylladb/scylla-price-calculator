<template>
<div class="pricing" id="scylla-cloud">
    <h1>Scylla cloud</h1>
    <form>
        <dropdown v-model="mode" :options="modes" description="Mode"></dropdown>
        <div class="form-group row"><label class="col-form-label col-sm-6" for="replication-factor">Replication factor</label><input type="text" id="replication-factor" name="replication-factor" class="form-control col-sm-3" v-model="replicationFactor"></div>
    </form>
    <table>
        <thead>
            <th>Cluster type</th>
            <th>Cost</th>
        </thead>
        <tr>
            <td>On demand</td>
            <td>{{price.onDemand}}</td>
        </tr>
        <tr>
            <td>Reserved</td>
            <td>{{price.reserved}}</td>
        </tr>
    </table>    
</div>    
</template>

<script lang="ts">
import Vue from 'vue'
import Dropdown from './Dropdown.vue'
import {MODE, estimatePrice} from '../scylla'
import { CloudPricing } from '../common'

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