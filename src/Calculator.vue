<template>
  <div class="container calculator">
    <div class="row ma-0">
      <div class="col-md-5 col-sm-12 pa-0 border-right">
        <form class="input-controls">
          <div class="form-group">
            <label class="col-form-label" for="reads">Read ops/sec</label>
            <div class="d-flex">
              <div class="slider-wrapper d-flex flex-column">
                <vue-slider
                  v-model="workload.reads"
                  :contained="false"
                  :width="250"
                  :min="10"
                  :max="1000000"
                  :interval="10"
                  dotSize="32"
                  tooltip="none"
                >
                  <template v-slot:dot>
                    <div class="custom-dot"></div>
                  </template>
                </vue-slider>
                <div class="d-flex justify-content-between">
                  <div class="slider-marker">10 ops/sec</div>
                  <div class="slider-marker">1M ops/sec</div>
                </div>
              </div>
              <input
                v-model="workload.reads"
                min="10"
                max="1000000"
                class="form-control"
                type="number"
                name="reads"
                id="reads"
              />
            </div>
          </div>
          <div class="form-group">
            <label class="col-form-label" for="writes">Write ops/sec</label>
            <div class="d-flex">
              <div class="slider-wrapper d-flex flex-column">
                <vue-slider
                  v-model="workload.writes"
                  :contained="false"
                  :width="250"
                  :min="10"
                  :max="1000000"
                  :interval="10"
                  dotSize="32"
                  tooltip="none"
                >
                  <template v-slot:dot>
                    <div class="custom-dot"></div>
                  </template>
                </vue-slider>
                <div class="d-flex justify-content-between">
                  <div class="slider-marker">10 ops/sec</div>
                  <div class="slider-marker">1M ops/sec</div>
                </div>
              </div>
              <input
                v-model="workload.writes"
                min="10"
                max="1000000"
                class="form-control"
                type="number"
                name="writes"
                id="writes"
              />
            </div>
          </div>
          <div class="form-group">
            <label class="col-form-label" for="item-size"
              >Average item size (KB)</label
            >
            <div class="d-flex">
              <div class="slider-wrapper d-flex flex-column">
                <vue-slider
                  v-model="workload.itemSize"
                  :contained="false"
                  :width="250"
                  :min="1"
                  :max="20"
                  dotSize="32"
                  tooltip="none"
                >
                  <template v-slot:dot>
                    <div class="custom-dot"></div>
                  </template>
                </vue-slider>
                <div class="d-flex justify-content-between">
                  <div class="slider-marker">1</div>
                  <div class="slider-marker">20</div>
                </div>
              </div>
              <input
                v-model="workload.itemSize"
                min="1"
                max="20"
                class="form-control"
                type="number"
                name="items-size"
                id="item-size"
              />
            </div>
          </div>
          <div class="form-group">
            <label class="col-form-label" for="storage-size"
              >Storage set size (GB)</label
            >
            <div class="d-flex">
              <div class="slider-wrapper d-flex flex-column">
                <vue-slider
                  v-model="workload.storage"
                  :contained="false"
                  :width="250"
                  :min="10"
                  :max="2000"
                  dotSize="32"
                  tooltip="none"
                >
                  <template v-slot:dot>
                    <div class="custom-dot"></div>
                  </template>
                </vue-slider>
                <div class="d-flex justify-content-between">
                  <div class="slider-marker">10</div>
                  <div class="slider-marker">2000</div>
                </div>
              </div>
              <input
                v-model="workload.storage"
                min="10"
                max="2000"
                class="form-control"
                type="number"
                name="storage-size"
                id="storage-size"
              />
            </div>
          </div>
          <div class="form-group">
            <label class="col-form-label" for="writes"
              >Replication factor</label
            >
            <div class="d-flex">
              <div class="slider-wrapper d-flex flex-column">
                <vue-slider
                  v-model="workload.replication"
                  disabled
                  :contained="false"
                  :width="250"
                  :min="1"
                  :max="10"
                  dotSize="32"
                  tooltip="none"
                >
                  <template v-slot:dot>
                    <div class="custom-dot"></div>
                  </template>
                </vue-slider>
              </div>
              <input
                disabled
                v-model="workload.replication"
                class="form-control"
                type="number"
                name="writes"
                id="writes"
              />
            </div>
          </div>
        </form>
      </div>
      <div class="col-md-7 col-sm-12 right-column d-flex flex-column">
        <div class="right-column__header d-flex">
          <div class="billing-toggle-wrapper d-flex align-items-center">
            <div>Bill Monthly</div>
            <Toggle
              class="mx-3"
              :toggled-right="billAnnually"
              @click="billAnnually = !billAnnually"
            ></Toggle>
            <div>Bill Annually</div>
            <div class="ml-2 save">Save 15%</div>
          </div>
        </div>
        <div class="right-column__content">
          <div class="total">Your total payment will be</div>
          <component
            :is="calc1"
            :workload="workload"
            v-model="scyllaPrices"
          ></component>
        </div>


        <!--initial layout leftovers start-->
        <div class="row">
          <div class="col-6 m-x-1">
            <!--                        <dropdown :options="scyllaCalcs" v-model="calc1" description="Scylla offering"></dropdown>-->

          </div>
          <div class="col-6 m-x-1 d-none">
            <dropdown
              :options="rivalCalcs"
              v-model="calc2"
              description="Rival offering"
            ></dropdown>
            <component
              :is="calc2"
              :workload="workload"
              v-model="rivalPrices"
            ></component>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import ScyllaCloud from './components/ScyllaCloud.vue'
import DynamoDB from './components/DynamoDB.vue'
import Keyspaces from './components/Keyspaces.vue'
import Dropdown from './components/Dropdown.vue'
import Astra from './components/Astra.vue'
import Toggle from './components/Toggle.vue'
import _ from 'lodash'
import { ComponentPublicInstance, DefineComponent, defineComponent } from 'vue'
import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/default.css'

export default defineComponent({
  data() {
    return {
      scyllaCalcs: { 'Scylla cloud': 'ScyllaCloud' },
      rivalCalcs: {
        DynamoDB: 'DynamoDB',
        Keyspaces: 'keyspaces',
        Astra: 'Astra'
      },
      workload: {
        writes: 10000,
        reads: 50000,
        storage: 200,
        itemSize: 1,
        replication: 3
      },
      calc1: 'ScyllaCloud',
      calc2: 'DynamoDB',
      scyllaPrices: [],
      rivalPrices: [],
      billAnnually: false
    }
  },
  components: {
    ScyllaCloud,
    DynamoDB,
    Keyspaces,
    Astra,
    Dropdown,
    VueSlider,
    Toggle
  },
  methods: {
    copyLink() {
      const url = new URL(window.location.href)
      _.forEach(this.workload, (v, k) => {
        url.searchParams.set(k, v.toString())
      })

      navigator.clipboard.writeText(url.toString()).then(() => {
        document.querySelector('#copy-indicator')?.classList.add('show')
        setTimeout(() => {
          document.querySelector('#copy-indicator')?.classList.remove('show')
        }, 1000)
      })
    }
  },
  mounted() {
    const query = new URLSearchParams(window.location.search)
    const getParam = (param: string, defaultValue: number) =>
      _.toNumber(query.get(param) ?? defaultValue)
    this.workload = _.mapValues(this.workload, (v, k) => getParam(k, v))
  },
  errorCaptured(
    err: unknown,
    instance: ComponentPublicInstance | null,
    info: string
  ): boolean {
    console.error('Error occurred in Astra component ' + err)
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
<style lang="scss">
@import './assets/style.scss';
.calculator {
  margin-top: 50px;
  font-family: 'Poppins', sans-serif;
  border: 1px solid $borders;
  border-radius: 10px;
  width: 1100px;
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
    padding-left: 38px;
    height: 83px;
    border-bottom: 1px solid $borders;
    .billing-toggle-wrapper {
      font-family: Roboto;
      font-style: normal;
      font-weight: normal;
      font-size: 16px;
      .save {
        font-size: 14px;
        color: #36b37e;
      }
    }
  }
  &__content {
    padding: 28px 42px 8px;
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
</style>
