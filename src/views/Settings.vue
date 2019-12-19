<template>
  <v-container class="settings px-0 full-view" fluid>
    <v-list
      two-line
      subheader
      v-for="(group, i) in settingsGroup"
      :key="i"
    >
      <v-subheader>{{ group.name }}</v-subheader>
      <v-list-item
        v-for="(setting, j) in group.settings"
        :key="j"
        link
      >
        <v-list-item-content>
          <v-list-item-title>{{ setting.title }}</v-list-item-title>
          <v-list-item-subtitle>{{ setting.description }}</v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-action>
          <v-switch
            v-model="setting.value"
          ></v-switch>
        </v-list-item-action>
      </v-list-item>
    </v-list>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import store from '@/store'


@Component
export default class Settings extends Vue {
  public settingsGroup = [
    {
      name: 'Terminal',
      settings: [
        {
          type: 'boolean',
          title: 'Use WebGL',
          description: 'Enable WebGL rendering for terminals (experimental)',
          get value() {
            return store.get('ConfigStore').get('useWebGL')
          },
          set value(newValue: boolean) {
            store.get('ConfigStore').set('useWebGL', newValue).save()
          }
        }
      ]
    }
  ]
}
</script>

<style scoped>
.full-view {
  height: 100%;
  width: 100%;
}
</style>
