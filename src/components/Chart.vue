<template>
    <div :id="id"></div>
</template>

<script>
import c3 from 'c3'
import _ from 'lodash'

function toGraphData(data) {
    return {
        type: 'bar',
        columns: data || [],
        color: (color, d) => _.startsWith(d.id ? d.id : d, 'Scylla') ? 'blue' : 'red' 
    }
}

export default {
    props: ['data', 'name', 'xlabel', 'ylabel'],
    computed: {
        id() {
            return `chart-${this.name}`
        }
    },
    mounted() {
        this._chart = c3.generate({
            bindto: '#' + this.id,
            data: toGraphData(this.data),
            point: {
                show: false
            },
            axis: {
                x: {
                    label: this.xlabel,
                    type: 'category'
                },
                y: {
                    label: this.ylabel
                }
            }
        })
    },
    watch: {
        data(_data) {
            if (!_.isEmpty(_data)) {
                this._chart.load({...toGraphData(_data), unload: true})
            }
        }
    }
}
</script>