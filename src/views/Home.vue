<template>
  <v-container class="home fill-view headline" fluid>
    <v-row class="fill-view">
      <v-col cols="12">
        <v-row class="fill-view" align="center" justify="center">
          Cloush
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
// @ is an alias to /src
import { Component, Vue } from 'vue-property-decorator'


@Component
export default class Home extends Vue {
}
</script>

<style scoped>
.fill-view {
  width: 100%;
  height: 100%;
}
</style>
