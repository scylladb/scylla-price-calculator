<template>
  <div class="container-fluid calculator">
    <div class="row ma-0">
      <div class="col-md-5 col-sm-12 pa-0 border-right">
        <form class="input-controls">
          <SliderInput
            v-for="(slider, i) in sliders"
            :key="i"
            v-model="inputWorkload[slider.title]"
            :title="slider.title"
            :label="slider.label"
            :tooltip="slider.tooltip"
            :min="slider.min"
            :max="slider.max"
            :min-marker="slider.minMarker"
            :max-marker="slider.maxMarker"
            :interval="slider.interval"
            :disabled="slider.disabled"
            :logarithmic="slider.logarithmic || false"
          ></SliderInput>
        </form>
      </div>
      <div class="col-md-7 col-sm-12 right-column d-flex flex-column">
        <div class="right-column__header d-flex">
          <div
            v-show="selectedDropdownItem.name === 'details'"
            class="billing-toggle-wrapper align-items-center"
          >
            <div>On demand</div>
            <Toggle
              class="mx-3"
              :toggled-right="billAnnually"
              @click="billAnnually = !billAnnually"
            ></Toggle>
            <div>Reserved (1 year)</div>
            <div class="ml-2 save">Save 33%</div>
          </div>
          <div
            v-show="selectedDropdownItem.name !== 'details'"
            class="scylla-comparison align-items-center"
          >
            Scylla vs.<span
              class="mx-1"
              :class="{
                trademarked: selectedDropdownItem.name !== 'details'
              }"
              >{{ selectedDropdownItem.title }}</span
            >
            Comparison
          </div>
          <div class="dropdown">
            <button
              class="dropdown__btn-toggle btn btn-outline-primary dropdown-toggle"
              type="button"
              id="dropdownMenuButton"
              data-bs-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
            >
              <span v-show="selectedDropdownItem.name !== 'details'">
                vs.
              </span>
              <span
                :class="{
                  trademarked: selectedDropdownItem.name !== 'details'
                }"
              >
                {{ selectedDropdownItem.title }}
              </span>
              <i class="fa fa-chevron-down"></i>
            </button>
            <div
              class="dropdown-menu dropdown-menu-right"
              aria-labelledby="dropdownMenuButton"
            >
              <div
                class="dropdown-item"
                v-for="(item, i) in dropdownItems"
                :key="i"
                @click="selectedDropdownItem = item"
              >
                <span v-show="item.name !== 'details'">
                  vs.
                </span>
                <span :class="{ trademarked: item.name !== 'details' }">
                  {{ item.title }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="right-column__content">
          <div v-if="selectedDropdownItem.name === 'details'">
            <div class="total">Your estimated payment will be</div>
            <component
              :is="calc1.name"
              :workload="workload"
              :pricing="billAnnually ? 'reserved' : 'ondemand'"
              v-model="scyllaPrices"
            ></component>
          </div>
          <div v-else>
            <div class="row">
              <div class="col-6 px-0">
                <div class="calculator-header">
                  <img :src="getIconPath(calc1.icon)" :alt="calc1.name" />
                  <h3>{{ calc1.title }}</h3>
                </div>
                <component
                  :is="calc1.name"
                  v-model="scyllaPrices"
                  :workload="workload"
                  hide-specs
                ></component>
              </div>
              <div class="col-6 pl-3 pr-0">
                <div class="calculator-header">
                  <img
                    v-if="getIconPath(selectedDropdownItem.icon)"
                    :src="getIconPath(selectedDropdownItem.icon)"
                    :alt="selectedDropdownItem.name"
                  />
                  <h3 class="trademarked">{{ selectedDropdownItem.title }}</h3>
                </div>
                <component
                  :is="selectedDropdownItem.name"
                  :workload="workload"
                  hide-specs
                  v-model="rivalPrices"
                ></component>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <teleport to="#share">
    <button class="btn btn-sm btn-outline-primary" v-on:click="copyLink" v-tooltip="'Click to copy permalink to clipboard'">Permalink <i class="bi bi-link-45deg"></i></button>
    <div class="alert alert-success invisible shadow rounded rounded-4 mt-2" id="copy-indicator">Copied!</div>
  </teleport>
</template>

<script lang="ts">
import ScyllaCloud from './components/ScyllaCloud.vue'
import DynamoDB from './components/DynamoDB.vue'
import Keyspaces from './components/Keyspaces.vue'
import Dropdown from './components/Dropdown.vue'
import Astra from './components/Astra.vue'
import Toggle from './components/Toggle.vue'
import SliderInput from './components/SliderInput.vue'
import _ from 'lodash'
import { ComponentPublicInstance, DefineComponent, defineComponent } from 'vue'
const scyllaCalcs = [{title: 'Scylla Cloud', name: 'ScyllaCloud', icon: 'ScyllaCloud' }]

export default defineComponent({
  data() {
    return {
      // note that inputWorkload has different units than workload
      // The calculator uses GB for RAM and storage calculations, but input and displayed output might have different unit because reasons
      inputWorkload: {
        writes: 100000,
        reads: 500000,
        storage: 1, // TB
        itemSize: 1,
        replication: 3
      },
      calc1: scyllaCalcs[0],
      scyllaPrices: [],
      rivalPrices: [],
      billAnnually: true,
      sliders: [
        {
          title: 'reads',
          min: 10000,
          max: 10000000,
          interval: 1000,
          minMarker: '10K ops/sec',
          maxMarker: '10M ops/sec',
          label: 'Read ops/sec',
          logarithmic: true
        },
        {
          title: 'writes',
          min: 10000,
          max: 10000000,
          interval: 1000,
          minMarker: '10K ops/sec',
          maxMarker: '10M ops/sec',
          label: 'Write ops/sec',
          logarithmic: true
        },
        {
          title: 'itemSize',
          min: 1,
          max: 20,
          minMarker: '1',
          maxMarker: '20',
          label: 'Average item size (KB)',
        },
        {
          title: 'storage',
          min: 1,
          max: 10000,
          interval: 1,
          minMarker: '1 TB',
          maxMarker: '10,000 TB',
          label: 'Data set size (TB)',
          logarithmic: true
        },
        {
          title: 'replication',
          disabled: true,
          min: 1,
          max: 10,
          label: 'Replication Factor',
          tooltip: 'Number of replicas, currently only 3 is supported'
        }
      ],
      dropdownItems: [
        { title: 'Compare', name: 'details' },
        { title: 'DynamoDB', name: 'DynamoDB', icon: 'DynamoDB' },
        { title: 'DataStax Astra', name: 'Astra', icon: 'Astra' },
        { title: 'Amazon Keyspaces', name: 'Keyspaces', icon: 'Keyspaces' }
      ],
      selectedDropdownItem: {}
    }
  },
  components: {
    SliderInput,
    ScyllaCloud,
    DynamoDB,
    Keyspaces,
    Astra,
    Dropdown,
    Toggle
  },
  methods: {
    copyLink() {
      const url = new URL(window.location.href)
      _.forEach(this.workload, (v, k) => {
        url.searchParams.set(k, v.toString())
      })

      navigator.clipboard.writeText(url.toString()).then(() => {
        document.querySelector('#copy-indicator')?.classList.remove('invisible')
        setTimeout(() => {
          document.querySelector('#copy-indicator')?.classList.add('invisible')
        }, 1000)
      })
    },
    getIconPath(name: string) {
      if (!name) return ''
      const images = require.context('./assets/', false, /\.png$/)
      return images(`./${name}.png`)
    }
  },
  mounted() {
    this.selectedDropdownItem = this.dropdownItems[0]
    const query = new URLSearchParams(window.location.search)
    const getParam = (param: string, defaultValue: number) =>
      _.toNumber(query.get(param) ?? defaultValue)
    this.inputWorkload = _.mapValues(this.inputWorkload, (v, k) => getParam(k, v))
  },
  errorCaptured(
    err: unknown,
    instance: ComponentPublicInstance | null,
    info: string
  ): boolean {
    console.error('Error occurred in component ' + err)
    return false
  },
  computed: {
    // canonical workload in GB units for storage and RAM. Item size is in KB
    // perhaps it would have been better to create some DataUnit class which handles unit conversion but I life is too short to deal with this shit
    workload(vm: DefineComponent) {
      return {
        ...vm.inputWorkload,
        storage: vm.inputWorkload.storage * 1000 // TB to GB
      }
    },
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
<style lang="scss">
@import './assets/style.scss';
.calculator {
  margin-top: 50px;
  font-family: 'Poppins', sans-serif;
  border: 1px solid $borders;
  border-radius: 10px;
  max-width: 1100px;
}
.col-form-label {
  margin-top: 5px;
  width: 100%;
  font-weight: 600;
  font-size: 16px;
}

.input-controls {
  padding: 30px;
  .form-control {
    margin-top: -4px;
    font-family: Roboto;
    font-weight: 500;
    font-size: 16px;
    box-shadow: 5px 6px 18px 0px rgba(0, 0, 0, 0.08);
    border: 1px solid #d8d8d8;
    border-radius: 8px;
    width: 109px;
    height: 50px;
    &:focus {
      border: 1px solid $primary;
    }
    &:disabled {
      background-color: white;
      opacity: 0.5;
    }
  }
  .slider-wrapper {
    margin-right: 32px;
    flex-grow: 1;
    .vue-slider {
      height: 6px !important;
      .vue-slider-rail {
        background-color: $transBlue !important;
      }
      .vue-slider-process {
        background-color: $primary !important;
      }
      .custom-dot {
        width: 40px;
        height: 32px;
        border-radius: 15px;
        background-color: $primary;
        transition: all 0.3s;
        position: relative;
        font-size: 18px;
        &::after {
          content: '<>';
          position: absolute;
          color: white;
          top: 3px;
          left: 10.5px;
          width: 100%;
          height: 100%;
        }
      }
      &-disabled {
        .custom-dot {
          background-color: $transBlue !important;
        }
        .vue-slider-process {
          background-color: $transBlue !important;
        }
      }
    }
    .slider-marker {
      font-size: 14px;
      font-weight: 400;
    }
  }
}

.right-column {
  background-color: $backgroundBlue;
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
  padding: 0;
  &__header {
    padding-right: 18px;
    justify-content: space-between;
    padding-left: 38px;
    height: 83px;
    border-bottom: 1px solid $borders;
    .scylla-comparison {
      display: flex;
    }
    .billing-toggle-wrapper {
      display: flex;
      font-family: Roboto;
      font-style: normal;
      font-weight: normal;
      font-size: 16px;
      .save {
        font-size: 14px;
        color: #36b37e;
        padding: 5px;
      }
    }
  }
  &__content {
    padding: 28px 16px 0 36px;
    @media (min-width: 911px) {
      padding: 28px 28px 0 13%;
    }
    .total {
      font-family: Poppins;
      font-weight: normal;
      font-size: 16px;
      line-height: 24px;
      color: $primary;
    }
  }
}

.pa-0 {
  padding: 0 !important;
}
.dropdown-menu {
  font-family: Roboto;
}
.dropdown {
  align-items: center;
  display: flex;
  &.show {
    .fa-chevron-down {
      transform: rotate(180deg);
    }
  }
  .fa {
    margin-left: 8px;
  }
  &__btn-toggle {
    font-family: Roboto;
    font-size: 13px;
    font-weight: 500;
    padding: 11px 10px 11px 18px;
    box-shadow: none !important;
    background-color: white !important;
    color: $primary !important;
    box-shadow: none !important;
    &:hover,
    &:active {
      background-color: white !important;
      color: $primary !important;
      box-shadow: none !important;
    }
    &::after {
      display: none !important;
    }
  }
  .dropdown-item {
    cursor: pointer;
  }
}
.calculator-header {
  padding-left: 14px;
  margin-bottom: 25px;
  display: inline-flex;
  align-items: center;
  flex-direction: column;
  img {
    height: 36px;
    margin-bottom: 9px;
  }
  h3 {
    font-family: Poppins;
    font-size: 18px;
    font-weight: 600;
    line-height: 22px;
    text-align: center;
  }
}
</style>
