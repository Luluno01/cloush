<template>
  <v-container class="about px-0" fluid>
    <div class="d-flex flex-column align-center">
      <v-avatar
        class="ma-3"
        size="200"
        tile
      >
        <v-img :src="require('@/assets/logo.svg')"></v-img>
      </v-avatar>
      <h1>Cloush</h1>
    </div>
    <v-divider></v-divider>
    <v-list two-line subheader>
      <v-subheader>About</v-subheader>
      <v-list-item
        v-for="(item, i) in items"
        :key="'about-' + i"
        link
        :target="item.link ? '_blank' : undefined"
        :href="item.link"
      >
        <v-list-item-avatar>
          <v-icon v-text="item.icon"></v-icon>
        </v-list-item-avatar>
        <v-list-item-content>
          <v-list-item-title>{{ item.title }}</v-list-item-title>
          <v-list-item-subtitle>{{ item.subtitle }}</v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
      <v-divider></v-divider>
      <v-subheader>Powered by</v-subheader>
      <v-list-item
        v-for="(item, i) in wheels"
        :key="'wheel-' + i"
        link
        :target="item.link ? '_blank' : undefined"
        :href="item.link"
      >
        <v-list-item-avatar>
          <v-icon v-text="item.icon"></v-icon>
        </v-list-item-avatar>
        <v-list-item-content>
          <v-list-item-title>{{ item.title }}</v-list-item-title>
          <v-list-item-subtitle>{{ item.subtitle }}</v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'


@Component
export default class About extends Vue {
  public items = [
    {
      icon: 'mdi-lead-pencil',
      title: 'Author',
      subtitle: 'Untitled',
      link: 'https://blog.untitled.vip/'
    },
    {
      icon: 'mdi-github',
      title: 'Github repository',
      subtitle: 'https://github.com/Luluno01/cloush',
      link: 'https://github.com/Luluno01/cloush'
    }
  ]

  public wheels = [
    {
      icon: 'mdi-vuejs',
      title: 'Vue.js',
      subtitle: 'The progressive javaScript framework',
      link: 'https://vuejs.org/'
    },
    {
      icon: 'mdi-vuetify',
      title: 'Vuetify.js',
      subtitle: 'Material design component framework',
      link: 'https://vuetifyjs.com/'
    },
    {
      icon: 'mdi-package-variant-closed',
      title: 'xterm.js',
      subtitle: 'Terminal component',
      link: 'https://xtermjs.org/'
    },
    {
      icon: 'mdi-package-variant-closed',
      title: 'Socket.IO',
      subtitle: 'WebSocket engine',
      link: 'https://socket.io/'
    },
    {
      icon: 'mdi-package-variant-closed',
      title: 'Koa',
      subtitle: '"Next generation web framework for node.js"',
      link: 'https://koajs.com/'
    },
    {
      icon: 'mdi-package-variant-closed',
      title: 'node-pty',
      subtitle: 'forkpty(3) bindings for node.js',
      link: 'https://github.com/microsoft/node-pty'
    },
    {
      icon: 'mdi-package-variant-closed',
      title: 'Unlib.js',
      subtitle: 'Untitled\'s personal JavaScript library',
      link: 'https://github.com/Luluno01/unlib.js'
    },
    {
      icon: 'mdi-checkbox-multiple-blank',
      title: 'And much more',
      subtitle: 'See repository of this project for more details',
      link: 'https://github.com/Luluno01/cloush'
    }
  ]
}
</script>
