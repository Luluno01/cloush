<template>
  <div class="consoles full-view">
    <div :style="'position: absolute; width: 100%; top: 0px; ' + (showVirtualKeyboard ? 'bottom: 56px;' : 'bottom: 0px;')">
      <ssh-console
        v-for="(session, i) in sessions"
        :key="session.sessionID"
        ref="consoles"
        :hidden="i != tabIndex"
        :target="session"
        :keyHandler="boundKeyHandler"
        :beforeInput="onBeforeInput"
      />
    </div>
    <virtual-keyboard
      v-if="showVirtualKeyboard"
      :elem="currentElem"
      style="position: absolute; height: 56px; bottom: 0px;"
      v-model="toggledKeys"
      ref="keyboard"
    ></virtual-keyboard>

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
import VirtualKeyboard, { Keys } from '@/components/VirtualKeyboard.vue'
import io from 'socket.io-client'
import store from '@/store'
import { Target } from '@/store/SSHConsoles'
import sleep from 'unlib.js/build/Time/sleep'


Component.registerHooks([
  'beforeRouteEnter'
])

@Component({
  components: {
    SshConsole,
    VirtualKeyboard
  }
})
export default class Consoles extends Vue {
  protected dialog = false
  protected showVirtualKeyboard = false
  protected toggledKeys: string[] = []
  protected currentElem: Element | null = null
  protected tabIndexVal: number = 0
  public get tabIndex() {
    return this.tabIndexVal
  }
  public set tabIndex(index: number) {
    this.tabIndexVal = index
    if(index >= 0) {
      this.$nextTick(async () => {
        let attempts = 3
        let lastError: Error | string
        while(attempts--) {
          if(this.tabIndexVal == index) {
            await sleep(300)
            try {
              (this.$refs.consoles as SshConsole[])[index].fit().focus()
              this.currentElem = (this.$refs.consoles as SshConsole[])?.[this.tabIndex]?.terminal.element || null
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
    this.currentElem = (this.$refs.consoles as SshConsole[])?.[this.tabIndex]?.terminal.element || null
    this.focus()
  }

  private _onRemoveSession!: (target: Target, index: number) => void
  private async onRemoveSession(target: Target, index: number) {
    const { sessions, tabIndexVal } = this
    if(target == sessions[tabIndexVal]) {
      if(tabIndexVal > 0) this.tabIndexVal--
    }
    this.generateSessions()
    await this.$nextTick()
    this.currentElem = (this.$refs.consoles as SshConsole[])?.[this.tabIndex]?.terminal.element || null
    this.focus()
  }

  private generateSessions() {
    this.sessions = Array.from(store.get('SSHConsoles').state.values()).reduce((sessions, sessionsB) => sessions.concat(sessionsB), [] as Target[])
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

  protected toggleKeyboardTimeout: ReturnType<typeof setTimeout> | null = null
  public onToggleKeyboardClick() {
    this.showVirtualKeyboard = !this.showVirtualKeyboard
    ;(this.$refs.keyboard as VirtualKeyboard)?.resetToggle()
    if (this.toggleKeyboardTimeout) {
      clearTimeout(this.toggleKeyboardTimeout)
    }
    this.toggleKeyboardTimeout = setTimeout(() => {
      this.toggleKeyboardTimeout = null
      if (store.get('SSHConsoles').state.size) {
        try {
          (this.$refs.consoles as SshConsole[])[this.tabIndexVal].fit()
        } catch(err) {
          console.error('Failed to call `fit` on active terminal, target tab:', this.tabIndexVal)
        }
      }
    }, 700)
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
      store.get('SSHConsoles').remove(cons.target)  // `onRemoveSession`
    }
    this.dialog = false
    this.focus()
  }

  protected boundKeyHandler: (event: KeyboardEvent) => boolean = this.keyHandler.bind(this)
  /**
   * Virtual keyboard handling, set CTRL and/or ALT and re-dispatch the event
   * @param event Keyboard event that dispatched either by a physical keyboard
   * or by IME on some devices
   */
  protected keyHandler(event: KeyboardEvent): boolean {
    if ((event as any).virtualKeyboard) return true
    const { toggledKeys } = this
    const { key, code, keyCode, ctrlKey, shiftKey, altKey, metaKey, view } = event
    if (toggledKeys.length) {
      const textarea = this.currentElem?.querySelector('textarea')
      if (textarea) {
        const init: KeyboardEventInit & { keyCode: number } = {
          key, code, keyCode, view,
          ctrlKey: ctrlKey || toggledKeys.includes(Keys.CTRL.name),
          shiftKey,
          altKey: altKey || toggledKeys.includes(Keys.ALT.name),
          metaKey
        }
        const virtualEvent = new KeyboardEvent(event.type, init)
        ;(virtualEvent as any).virtualKeyboard = true
        textarea.dispatchEvent(virtualEvent)
      }
      return false
    }
    return true
  }

  protected beforeInputHandler: (event: InputEvent) => void = this.onBeforeInput.bind(this)
  /**
   * Virtual keyboard handling, set CTRL and/or ALT and re-dispatch the event
   * @param event Input event that dispatched only by IME on some devices,
   * in which case the `keydown` event will not dispatch properly
   */
  protected onBeforeInput(event: InputEvent) {
    const { data, defaultPrevented } = event
    const { toggledKeys } = this
    if (!defaultPrevented && toggledKeys.length && data && data.length == 1 && data.match(/^[0-9a-zA-Z[]$/)) {
      let code = ''
      let keyCode = 0
      if (data.match(/^\d$/)) {
        code = `Digit${data}`
        keyCode = 96 + parseInt(data)
      } else {
        code = `Key${data.toUpperCase()}`
        keyCode = 65 + data.toLowerCase().charCodeAt(0) - 97
      }
      const textarea = this.currentElem?.querySelector('textarea')
      if (textarea) {
        const init: KeyboardEventInit & { keyCode: number } = {
          key: data, code, keyCode, view: window,
          ctrlKey: toggledKeys.includes(Keys.CTRL.name),
          altKey: toggledKeys.includes(Keys.ALT.name)
        }
        const keydown = new KeyboardEvent('keydown', init)
        ;(keydown as any).virtualKeyboard = true
        const keyup = new KeyboardEvent('keyup', init)
        ;(keyup as any).virtualKeyboard = true
        textarea.dispatchEvent(keydown)
        textarea.dispatchEvent(keyup)
        event.preventDefault()
      }
    }
  }

  public beforeRouteEnter(_to: unknown, _from: unknown, next: (callback: (vm: Consoles) => void) => void) {
    next(vm => vm.focus())
  }

  public mounted() {
    if(navigator.userAgent.match(/(Android)|(webOS)|(i(Pad)|(Pod))|(BlackBerry)|(Phone)/i)) {
      this.showVirtualKeyboard = true
    } else {
      this.showVirtualKeyboard = false
    }
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
