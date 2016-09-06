<template>
  <h2 class="red">{{msg}}</h2>
</template>

<script lang='ts'>
const thisIsTypescript: string = 'Hello from TypeScript Component A!'
export default {
  data () {
    return {
      msg: thisIsTypescript
    }
  }
}
</script>

<style>
comp-ts-a h2 {
  color: #f00;
}
</style>
