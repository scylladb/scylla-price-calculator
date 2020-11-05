<template>
    <div class="form-group row">
        <label class="col-form-label col" :for="name">{{description}}</label>
        <select :disabled="readonly" class="form-control col" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" :name="name" :id="name">
            <option v-for="(value, name) in opts" :value="value" v-bind:key="name">{{name}}</option>
        </select>
    </div>
</template>

<script lang="ts">
import { PropType, DefineComponent } from 'vue'
export default {
    props: {
        options: {
        },
        description: {
            type: String
        },
        modelValue: {
            type: String
        },
        readonly: {
            type: Boolean,
            default: false
        }
    },
    computed: {
        opts: (vm: DefineComponent) => {
            if (vm.options instanceof Array) {
                return vm.options.reduce((prev, v, idx) => {
                    return {...prev, [v]: v}
                }, {})
            } else {
                return vm.options
            }
        }
    }  
}
</script>