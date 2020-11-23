<template>
    <div>
        <div class="row">
            <div class="col-6">
                <form>
                    <div class="row form-group">
                        <label class="col-sm-6 col-form-label" for="reads">Read ops/sec</label><input v-model="workload.reads" class="col-sm-3 form-control" type="number" name="reads" id="reads">
                    </div>
                    <div class="row form-group">
                        <label class="col-sm-6 col-form-label" for="writes">Write ops/sec</label><input v-model="workload.writes" class="col-sm-3 form-control" type="number" name="writes" id="writes">
                    </div>
                    <div class="row form-group">
                        <label class="col-sm-6 col-form-label" for="item-size">Average item size (KB)</label><input v-model="workload.itemSize" class="col-sm-3 form-control" type="number" name="items-size" id="item-size">
                    </div>
                    <div class="row form-group"><label class="col-sm-6 col-form-label" for="storage-size">Storage set size (GB)</label><input class="col-sm-3 form-control" type="number" v-model="workload.storage" name="storage-size" id="storage-size"></div>
                </form>
            </div>
            <div class="col-6">
                <Chart chartId="price-comparison" :data="prices"></Chart>
            </div>
        </div>
        <div class="row">
            <button class="btn" @click="copyLink()">Permalink
                <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-link-45deg" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.715 6.542L3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1.001 1.001 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4.018 4.018 0 0 1-.128-1.287z"/>
                    <path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 0 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 0 0-4.243-4.243L6.586 4.672z"/>
                </svg>
            </button>
        </div>
        <hr>
        <div class="row">
            <div class="col-6 m-x-1">
                <dropdown :options="scyllaCalcs" v-model="calc1" description="Scylla offering"></dropdown>
                <component :is="calc1" :workload="workload" v-model="scyllaPrices"></component>
            </div>
            <div class="col-6 m-x-1">
                <dropdown :options="rivalCalcs" v-model="calc2" description="Rival offering"></dropdown>
                <component :is="calc2" :workload="workload" v-model="rivalPrices"></component>
            </div>
        </div>
        <div class="row">
            <p><small>Prices are monthly, but reserved offerings require a 1 year subscription period.</small></p>
        </div>
    </div>
</template>

<script lang="ts">
import ScyllaCloud from './components/ScyllaCloud.vue'
import DynamoDB from './components/DynamoDB.vue'
import Keyspaces from './components/Keyspaces.vue'
import Dropdown from './components/Dropdown.vue'
import Astra from './components/Astra.vue'
import _ from 'lodash'
import {ComponentPublicInstance, DefineComponent, defineComponent} from 'vue'
import Chart from './components/Chart.vue'

export default defineComponent({
    data() {
        return {
            scyllaCalcs: {'Scylla cloud': 'ScyllaCloud'},
            rivalCalcs: {'DynamoDB': 'DynamoDB', 'Keyspaces': 'keyspaces', 'Astra': 'Astra'},
            workload: {writes: 10000, reads: 50000, storage: 200, itemSize: 1},
            calc1: 'ScyllaCloud',
            calc2: 'DynamoDB',
            scyllaPrices: [],
            rivalPrices: []
        }
    },
    components: {
        ScyllaCloud,
        DynamoDB,
        Keyspaces,
        Astra,
        Dropdown,
        Chart
    },
    methods: {
        copyLink() {
            const url = new URL(window.location.href)
            _.forEach(this.workload, (v, k) => {
                url.searchParams.set(k, v.toString())
            })

            navigator.clipboard.writeText(url.toString())
        }
    },
    mounted() {
        const query = new URLSearchParams(window.location.search)
        const getParam = (param: string, defaultValue: number) => _.toNumber(query.get(param) ?? defaultValue)
        this.workload = _.mapValues(this.workload, (v, k) => getParam(k, v))
    },
    errorCaptured(err: unknown, instance: ComponentPublicInstance | null, info: string): boolean {
        console.error("Error occurred in Astra component " + err)
        return false
    },
    computed: {
        prices(vm: DefineComponent) {
            const _prices: [string, number][] = []
            for (const price of vm.scyllaPrices) {
                const key: string = 'Scylla ' + price.name
                _prices.push([key, price.total])
            }

            for (const price of vm.rivalPrices) {
                _prices.push([price.database + ' ' + price.name, price.total])
            }
            return _prices
        }
    }
})
</script>
