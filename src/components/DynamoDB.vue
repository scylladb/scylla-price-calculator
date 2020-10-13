<template>
    <div class="pricing container" id="dynamodb">
    <h1>DynamoDB</h1>
    <template v-for="price in prices" :key="price.id">
        <div class="row container">
            <a data-toggle="collapse" :href="'#dynamodb-' + price.id + '-price'" aria-expanded="false" :aria-controls="'dynamodb-' + price.id + '-price'">{{price.name}}: {{price.total.toLocaleString(undefined, {style: 'currency', currency: 'USD'})}}</a>
            <table class="table collapse" :id="'dynamodb-' + price.id + '-price'">
                <tbody>
                <tr>
                    <td>Storage</td>
                    <td>{{price.storage.toLocaleString(undefined, {style: 'currency', currency: 'USD'})}}</td>
                </tr>
                <tr>
                    <td>Workload (operations)</td>
                    <td>{{price.ops.toLocaleString(undefined, {style: 'currency', currency: 'USD'})}}</td>
                </tr>
                </tbody>
            </table>
        </div>        
    </template>
    </div>    
</template>

<script lang="ts">
import Vue from 'vue'
import {hoursPerMonth} from '../common'

// hourly
const provisionedPricing = {
    wcu: 0.00065,
    rcu: 0.00013
}

const reservedPricing = {
    wcu: 0.000299232876712328,
    rcu: 5.92E-05
}

// per 1M ops
const onDemandPricing = {
    wcu: 1.25,
    rcu: 0.25
}

const storagePricing = 0.25 // GB/month

export default {
    props: ["workload"],
    computed: {
        prices: (vm: Vue.DefineComponent) => {
            const wcu = Math.ceil(vm.workload.itemSize) * vm.workload.writes
            const rcu = Math.ceil(vm.workload.itemSize/4)*vm.workload.reads
            const storage = vm.workload.storage * storagePricing
            const onDemand = (rcu * onDemandPricing.rcu + wcu * onDemandPricing.wcu) * 3600* hoursPerMonth / 1E6
            const provisioned = (wcu * provisionedPricing.wcu + rcu * provisionedPricing.rcu) * hoursPerMonth
            const reserved = (wcu * reservedPricing.wcu + rcu * reservedPricing.rcu) * hoursPerMonth

            return [
                {id: 'on-demand', name: 'On demand', total: storage + onDemand, storage, ops: onDemand},
                {id: 'provisioned', name: 'Provisioned', total: storage + provisioned, storage, ops: provisioned},
                {id: 'reserved', name: 'Provisioned (1y reserved)', total: storage + reserved, storage, ops: reserved}
            ]
        }
    }
}
</script>