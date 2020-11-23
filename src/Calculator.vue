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
            <button class="btn" @click="copyLink()">
                <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-share" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5zm-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>
                </svg>
                Share
            </button>
            <div class="alert alert-success fade" id="copy-indicator">Copied!</div>
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
            .then(() => {
                document.querySelector('#copy-indicator')?.classList.add('show')
                setTimeout(() => {
                    document.querySelector('#copy-indicator')?.classList.remove('show')
                }, 1000)
            })
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
