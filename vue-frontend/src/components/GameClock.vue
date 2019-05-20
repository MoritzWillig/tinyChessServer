<template>
  <div class="wrapper" :style="{'text-align': align}">
    <div class="name" v-if="align == 'right'">
      {{name}}
    </div>
    <div class="clock-border">
      {{timeAsString}}
    </div>
    <div class="name" v-if="align == 'left'">
      {{name}}
    </div>
  </div>
</template>

<script>

export default {
  name: 'GameClock',
  props: {
    time: {
      type: Number,
      default: 0
    },
    name: {
      type: String,
      default: "No engine name defined"
    },
    align: {
      type: String,
      default: "left"
    },
  },
  computed: {
    timeAsString: function () {
      var ms = this.time % 1000;
      var s = (this.time - ms) / 1000;
      var secs = s % 60;
      s = (s - secs) / 60;
      var mins = s % 60;
      var hrs = (s - mins) / 60;

      var pad = function (n) {
          return (n < 10) ? ("0" + n) : n;
      }

      // return hrs + ':' + mins + ':' + secs + '.' + ms;
      return pad(mins) + ':' + pad(secs);
    }
  }
}
</script>

<style scoped>
.wrapper {
  margin: 0.3em 0em;
  text-align: left;
  padding: 1em 0em;
}
.clock-border {
  border: 2px solid rgb(196, 196, 196);
  border-radius: 3px;
  text-align: center;
  padding: 4px;
  background-color: black;
  color: white;
  font-weight: 600;
  display: inline-block;
  min-width: 4em
}
.name {
  padding: 0em 1em;
  display: inline-block;
  font-style: italic;
}
</style>
