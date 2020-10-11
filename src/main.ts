import { createApp } from 'vue'
import { estimatePrice as scyllaPrice,  MODE as scyllaMode} from './scylla'

createApp({
    data() {
        return {
            writes: 0,
            reads: 0,
            itemSize: 0,
            replicationFactor: 3,
            storage: 0,
            scyllaMode: scyllaMode.CQL
        }
    },
    computed: {
        vcpus() {
            return 0;
        },
        price() {
            let scyllaPricing = scyllaPrice(
                this.storage, 
                this.reads, 
                this.writes, 
                this.itemSize,
                this.replicationFactor, 
                this.scyllaMode
            )
            return {
                scylla: {
                    reserved: scyllaPricing.reserved,
                    ondemand: scyllaPricing.onDemand
                }
            }
        }
    }
}).mount('#app')
