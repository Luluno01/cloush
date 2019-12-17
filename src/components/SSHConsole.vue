<template>
  <div ref="terminal" class="terminal" v-resize="onResize"></div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import SSHCons from './SSHConsole'
import { Terminal, ITheme } from 'xterm'
import 'xterm/css/xterm.css'
import sleep from 'unlib.js/build/Time/sleep'
import { Target } from '../store/SSHConsoles'


const defaultTheme: ITheme = {
  background: '#1E1E1E',
  foreground: '#CCCCCC',
  cursor: undefined,
  cursorAccent: undefined,
  selection: '#FFFFFF40',
  black: '#000000',
  red: '#cd3131',
  green: '#0DBC79',
  yellow: '#e5e510',
  blue: '#2472c8',
  magenta: '#bc3fbc',
  cyan: '#11a8cd',
  white: '#e5e5e5',
  brightBlack: '#666666',
  brightRed: '#f14c4c',
  brightGreen: '#23d18b',
  brightYellow: '#f5f543',
  brightBlue: '#3b8eea',
  brightMagenta: '#d670d6',
  brightCyan: '#29b8db',
  brightWhite: '#e5e5e5'
}

@Component
export default class SSHConsole extends Vue {
  protected console!: SSHCons
  protected terminal!: Terminal
  protected resizeTimeout: ReturnType<typeof setTimeout> | null = null
  @Prop()
  public target!: Target
  public get eventEmitter() {
    return this.console && this.console.eventEmitter
  }
  public mounted() {
    const term = this.terminal = new Terminal()
    this.setTheme(defaultTheme)
    term.open(this.$refs['terminal'] as HTMLDivElement)
    const cons = this.console = new SSHCons(term)
    cons.connectSSH(this.target)
  }

  public onResize() {
    if(this.resizeTimeout) {
      clearTimeout(this.resizeTimeout)
    }
    this.resizeTimeout = setTimeout(() => {
      this.fit()
      this.resizeTimeout = null
    }, 700)
  }

  public setTheme(theme: ITheme) {
    this.terminal.setOption('theme', theme)
    return this
  }

  public fit() {
    if((this.$el as HTMLDivElement).offsetParent != null) this.console.fit()  // Only call this when visible
    return this
  }

  public refresh() {
    this.console.refresh()
    return this
  }

  public focus() {
    this.console.focus()
    return this
  }

  public destroy() {
    this.console.destroy()
  }

  public beforeDestroy() {
    this.destroy()
  }
}
</script>

<style scoped>
.terminal {
  height: 100%;
  width: 100%;
}
</style>

<style>
.xterm {
  height: 100%;
}
</style>
