<template>
  <div class="toggle-wrapper">
    <div class="toggle">
      <div class="toggle__dot" :class="{'toggled-right': toggledRight}"></div>
    </div>

  </div>
</template>

<script>
  export default {
    name: "Toggle",
    props: {
      toggledRight: {
        type: Boolean,
        default: true
      }
    },
    components: {},
    data() {
      return {}
    },
    computed: {},
    methods: {
    }
  }
</script>

<style scoped lang="scss">
  .toggle {
    background-color: white;
    box-shadow: 0px 10px 20px rgba(0, 0, 0, 0.08);
    border-radius: 18px;
    height: 36px;
    width: 64px;
    position: relative;
    cursor: pointer;
    &__dot {
      transition: all 0.3s;
      position: absolute;
      top: 50%;
      left: 5px;
      transform: translateY(-50%);
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #2277F1;
      box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);
      &.toggled-right {
        left: 50%;
      }
    }
  }
</style>