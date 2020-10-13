<template>
    <div class="pricing" id="dynamodb">
    <h1>DynamoDB</h1>
    <table class="table">
        <thead>
            <tr>
            <th>Type</th>
            <th>Cost</th>
            </tr>
        </thead>
        <tr>
            <td>Storage</td>
            <td>{{price.storage.toLocaleString(undefined, {style: 'currency', currency: 'USD'})}}</td>
        </tr>
        <tr>
            <td>On demand</td>
            <td>{{price.onDemand.toLocaleString(undefined, {style: 'currency', currency: 'USD'})}}</td>
        </tr>
        <tr>
            <td>Provisioned</td>
            <td>{{price.provisioned.toLocaleString(undefined, {style: 'currency', currency: 'USD'})}}</td>
        </tr>
        <tr>
            <td>Provisioned (reserved)</td>
            <td>{{price.reserved.toLocaleString(undefined, {style: 'currency', currency: 'USD'})}}</td>
        </tr>
    </table>    
</div>    
</template>

<script lang="ts">
import Vue from 'vue'
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

const hoursPerMonth = 730
const storagePricing = 0.25 // GB/month

export default {
    props: ["workload"],
    computed: {
        price: (vm: Vue.DefineComponent) => {
            const wcu = Math.ceil(vm.workload.itemSize) * vm.workload.writes
            const rcu = Math.ceil(vm.workload.itemSize/4)*vm.workload.reads
            const storagePrice = vm.workload.storage * storagePricing

            return {
                onDemand: (rcu * onDemandPricing.rcu + wcu * onDemandPricing.wcu) * 3600* hoursPerMonth / 1E6,
                provisioned: (wcu * provisionedPricing.wcu + rcu * provisionedPricing.rcu) * hoursPerMonth,
                reserved: (wcu * reservedPricing.wcu + rcu * reservedPricing.rcu) * hoursPerMonth,
                storage: storagePrice
            }
        }
    }
}
</script>