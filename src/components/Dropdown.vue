<template>
    <div class="form-group row">
        <label class="col-form-label col" for="{{name}}">{{description}}</label>
        <select class="form-control col" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" name="{{name}}" id="{{name}}">
            <option v-for="(value, name) in options" :value="value" v-bind:key="name">{{name}}</option>
        </select>
    </div>
</template>

<script lang="ts">
import { PropType } from 'vue'
export default {
    props: {
        options: {
            type: Object as PropType<Record<string, string>>
        },
        description: {
            type: String
        },
        modelValue: {
            type: String
        }
    }   
}
</script>