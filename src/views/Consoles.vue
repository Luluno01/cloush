<template>
  <div class="consoles full-view">
    <ssh-console
      v-for="(session, i) in sessions"
      :key="session.sessionID"
      ref="consoles"
      :hidden="i != tabIndex"
      :target="session"
      style="position: absolute"
    />

    <v-dialog
      v-model="dialog"
      max-width="290"
    >
      <v-card>
        <v-card-title class="headline">Close this session?</v-card-title>

        <v-card-text>
          Should you have anything to record, copy and save, kindly do it before closing.
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn
            color="red darken-1"
            text
            @click="close()"
          >
            Yes
          </v-btn>

          <v-btn
            color="green darken-1"
            text
            @click="dialog = false"
          >
            Cancel
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
// @ is an alias to /src
import { Component, Vue, Prop } from 'vue-property-decorator'
import SshConsole from '@/components/SSHConsole.vue'
import io from 'socket.io-client'
import store from '@/store'
import { Target } from '@/store/SSHConsoles'
import sleep from 'unlib.js/build/Time/sleep'


Component.registerHooks([
  'beforeRouteEnter'
])

@Component({
  components: {
    SshConsole
  }
})
export default class Consoles extends Vue {
  protected dialog = false
  protected tabIndexVal: number = 0
  public get tabIndex() {
    return this.tabIndexVal
  }
  public set tabIndex(index: number) {
    this.tabIndexVal = index
    if(index >= 0) this.$nextTick(async () => {
      let attempts = 3
      let lastError: Error | string
      while(attempts--) {
        if(this.tabIndexVal == index) {
          await sleep(300)
          try {
            (this.$refs.consoles as SshConsole[])[index].fit()
            ;(this.$refs.consoles as SshConsole[])[index].focus()
            return
          } catch(err) {
            lastError = err
            continue
          }
        } else return
      }
      console.warn('Failed to call `fit` on active terminal, target tab:', index)
      console.warn('Last error:', lastError!)
    })
  }

  public sessions: Target[] = []
  public get currentSessionName(): string | undefined {
    return this.sessions.length ? this.sessions[this.tabIndexVal].name : undefined
  }

  private _onAddSession!: (target: Target) => void
  private async onAddSession(target: Target) {
    this.generateSessions()
    this.tabIndex = this.sessions.indexOf(target)
    await this.$nextTick()
    this.focus()
  }

  private _onRemoveSession!: (target: Target, index: number) => void
  private onRemoveSession(target: Target, index: number) {
    const { sessions, tabIndexVal } = this
    if(target == sessions[tabIndexVal]) {
      if(tabIndexVal > 0) this.tabIndexVal--
    }
    this.generateSessions()
    this.focus()
  }

  private generateSessions() {
    this.sessions = Array.from(store.get('SSHConsoles').state).reduce((sessions, [ , sessionsB ]) => sessions.concat(sessionsB), [] as Target[])
  }

  public switchTo(target: Target) {
    const index = this.tabIndex = this.sessions.indexOf(target)
  }

  public focus() {
    try {
      (this.$refs.consoles as SshConsole[])[this.tabIndex].focus()
    } catch(err) {
      return
    }
  }

  public onCloseClick() {
    if(this.sessions.length) {
      this.dialog = true
    }
  }

  public close(target?: Target) {
    let cons: SshConsole | undefined
    if(target) {
      const index = this.sessions.indexOf(target)
      if(index >= 0) {
        cons = (this.$refs.consoles as SshConsole[])[index]
      }
    } else {
      const { tabIndex } = this
      if(tabIndex >= 0 && tabIndex < this.sessions.length) {
        cons = (this.$refs.consoles as SshConsole[])[tabIndex]
      }
    }
    if(cons) {
      cons.destroy()
      store.get('SSHConsoles').remove(cons.target)
    }
    this.dialog = false
    this.focus()
  }

  public beforeRouteEnter(_to: unknown, _from: unknown, next: (callback: (vm: Consoles) => void) => void) {
    next(vm => vm.focus())
  }

  public mounted() {
    this.generateSessions()
    store.get('SSHConsoles')
      .on('add', this._onAddSession = this.onAddSession.bind(this) as typeof Consoles.prototype.onAddSession)
      .on('remove', this._onRemoveSession = this.onRemoveSession.bind(this) as typeof Consoles.prototype.onRemoveSession)
  }

  public beforeDestroy() {
    store.get('SSHConsoles')
      .off('add', this._onAddSession)
      .off('remove', this._onRemoveSession)
  }
}
</script>

<style scoped>
.full-view {
  width: 100%;
  height: 100%;
}
</style>
