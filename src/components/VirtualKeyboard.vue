<template>
  <v-sheet
    :color="color"
    :dark="dark"
    :tile="tile"
    style="width: 100%"
  >
    <v-container pa-0 ma-0 fluid>
      <v-row no-gutters>
        <v-col>
          <v-row no-gutters>
            <v-col
              v-for="(button, i) in keys[currentPage].line1"
              :key="i"
            >
              <v-btn-toggle
                v-if="button.toggle"
                group
                tile
                style="height: 28px; width: 100%;"
              >
                <v-btn
                  block
                  text
                  tile
                  small
                  height="28px"
                  @input="value => onKeyPress(button, value)"
                  class="pa-0 ma-0"
                >{{ button.name }}</v-btn>
              </v-btn-toggle>
              <v-btn
                v-else
                block
                text
                tile
                small
                height="28px"
                @click.stop="onKeyPress(button)"
                class="pa-0"
              >{{ button.name }}</v-btn>
            </v-col>
          </v-row>
          <v-row no-gutters>
            <v-col
              v-for="(button, i) in keys[currentPage].line2"
              :key="i"
            >
              <v-btn-toggle
                v-if="button.toggle"
                group
                tile
                style="height: 28px; width: 100%;"
              >
                <v-btn
                  block
                  text
                  tile
                  small
                  height="28px"
                  @input="value => onKeyPress(button, value)"
                  class="pa-0 ma-0"
                >{{ button.name }}</v-btn>
              </v-btn-toggle>
              <v-btn
                v-else
                block
                text
                tile
                small
                height="28px"
                @click.stop="onKeyPress(button)"
                class="pa-0"
              >{{ button.name }}</v-btn>
            </v-col>
          </v-row>
        </v-col>
        <v-col cols="1">
          <v-btn block text tile height="56px" width="0%" @click.stop="onTogglePageClick">
            <v-icon v-text="currentPage == 0 ? 'mdi-chevron-right' : 'mdi-chevron-left'"></v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </v-sheet>
</template>

<script lang="ts">
import { Component, Vue, Prop, Model } from 'vue-property-decorator'
import io from 'socket.io-client'


export interface Key {
  name: string
  toggle?: boolean
  keyboardEventInit?: KeyboardEventInit & { keyCode: number }
}
export const Keys: { [key: string]: Key } = {
  ESC: {
    name: 'ESC',
    keyboardEventInit: {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27
    }
  },
  SLASH: {
    name: '/',
    keyboardEventInit: {
      key: '/',
      code: 'Slash',
      keyCode: 191
    }
  },
  VERTICAL_BAR: {
    name: '|',
    keyboardEventInit: {
      key: '|',
      code: 'Backslash',
      keyCode: 220,
      shiftKey: true
    }
  },
  DASH: {
    name: '-',
    keyboardEventInit: {
      key: '-',
      code: 'Minus',
      keyCode: 189
    }
  },
  HOME: {
    name: 'HOME',
    keyboardEventInit: {
      key: 'Home',
      code: 'Home',
      keyCode: 36
    }
  },
  ARROW_UP: {
    name: '↑',
    keyboardEventInit: {
      key: 'ArrowUp',
      code: 'ArrowUp',
      keyCode: 38
    }
  },
  END: {
    name: 'END',
    keyboardEventInit: {
      key: 'End',
      code: 'End',
      keyCode: 35
    }
  },
  TAB: {
    name: 'TAB',
    keyboardEventInit: {
      key: 'Tab',
      code: 'Tab',
      keyCode: 9
    }
  },
  CTRL: {
    name: 'CTRL',
    toggle: true
  },
  ALT: {
    name: 'ALT',
    toggle: true
  },
  DEL: {
    name: 'DEL',
    keyboardEventInit: {
      key: 'Delete',
      code: 'Delete',
      keyCode: 46
    }
  },
  ARROW_LEFT: {
    name: '←',
    keyboardEventInit: {
      key: 'ArrowLeft',
      code: 'ArrowLeft',
      keyCode: 37
    }
  },
  ARROW_DOWN: {
    name: '↓',
    keyboardEventInit: {
      key: 'ArrowDown',
      code: 'ArrowDown',
      keyCode: 40
    }
  },
  ARROW_RIGHT: {
    name: '→',
    keyboardEventInit: {
      key: 'ArrowRight',
      code: 'ArrowRight',
      keyCode: 39
    }
  },
  F1: {
    name: 'F1',
    keyboardEventInit: {
      key: 'F1',
      code: 'F1',
      keyCode: 112
    }
  },
  F2: {
    name: 'F2',
    keyboardEventInit: {
      key: 'F2',
      code: 'F2',
      keyCode: 113
    }
  },
  F3: {
    name: 'F3',
    keyboardEventInit: {
      key: 'F3',
      code: 'F3',
      keyCode: 114
    }
  },
  F4: {
    name: 'F4',
    keyboardEventInit: {
      key: 'F4',
      code: 'F4',
      keyCode: 115
    }
  },
  F5: {
    name: 'F5',
    keyboardEventInit: {
      key: 'F4',
      code: 'F4',
      keyCode: 116
    }
  },
  F6: {
    name: 'F6',
    keyboardEventInit: {
      key: 'F4',
      code: 'F4',
      keyCode: 117
    }
  },
  F7: {
    name: 'F7',
    keyboardEventInit: {
      key: 'F4',
      code: 'F4',
      keyCode: 118
    }
  },
  F8: {
    name: 'F8',
    keyboardEventInit: {
      key: 'F4',
      code: 'F4',
      keyCode: 119
    }
  },
  F9: {
    name: 'F9',
    keyboardEventInit: {
      key: 'F4',
      code: 'F4',
      keyCode: 120
    }
  },
  F10: {
    name: 'F10',
    keyboardEventInit: {
      key: 'F4',
      code: 'F4',
      keyCode: 121
    }
  },
  F11: {
    name: 'F11',
    keyboardEventInit: {
      key: 'F4',
      code: 'F4',
      keyCode: 122
    }
  },
  F12: {
    name: 'F12',
    keyboardEventInit: {
      key: 'F4',
      code: 'F4',
      keyCode: 123
    }
  },
  PAGE_UP: {
    name: 'PGUP',
    keyboardEventInit: {
      key: 'PageUp',
      code: 'PageUp',
      keyCode: 33
    }
  },
  PAGE_DOWN: {
    name: 'PGDN',
    keyboardEventInit: {
      key: 'PageDown',
      code: 'PageDown',
      keyCode: 34
    }
  }
}

@Component
export default class VirtualKeyboard extends Vue {
  @Prop()
  protected elem!: Element | null
  @Prop({
    default: true
  })
  protected dark!: boolean
  @Prop({
    default: 'grey darken-4'
  })
  protected color!: string
  @Prop({
    default: true
  })
  protected tile!: boolean
  @Model('change', {
    default: () => []
  })
  protected toggled!: string[]
  protected keys = [
    {
      line1: [
        Keys.ESC,
        Keys.SLASH,
        Keys.VERTICAL_BAR,
        Keys.DASH,
        Keys.HOME,
        Keys.ARROW_UP,
        Keys.END
      ],
      line2: [
        Keys.TAB,
        Keys.CTRL,
        Keys.ALT,
        Keys.DEL,
        Keys.ARROW_LEFT,
        Keys.ARROW_DOWN,
        Keys.ARROW_RIGHT
      ]
    },
    {
      line1: [
        Keys.F1,
        Keys.F2,
        Keys.F3,
        Keys.F4,
        Keys.F5,
        Keys.F6,
        Keys.PAGE_UP
      ],
      line2: [
        Keys.F7,
        Keys.F8,
        Keys.F9,
        Keys.F10,
        Keys.F11,
        Keys.F12,
        Keys.PAGE_DOWN
      ]
    }
  ]
  protected currentPage = 0

  public onTogglePageClick() {
    this.currentPage = (this.currentPage + 1) % this.keys.length
  }

  public mounted() {
    this.resetToggle()
  }

  public resetToggle() {
    this.toggled.splice(0, this.toggled.length)
  }

  /**
   * On vertual key pressed
   * @param key Pressed key
   * @param toggleState The toggle state of the key
   */
  public onKeyPress(key: Key, toggleState?: boolean) {
    const { toggled, elem } = this
    if (key.toggle) {
      const index = toggled.indexOf(key.name)
      if (!toggleState && index >= 0) {
        toggled.splice(index, 1)
      } else if (toggleState && index < 0) {
        toggled.push(key.name)
      }
    } else if (elem && key.keyboardEventInit) {
      const textarea = elem.querySelector('textarea')
      if (textarea) {
        const init = Object.assign({}, key.keyboardEventInit)
        init.view = window
        if (toggled.includes(Keys.CTRL.name)) {
          init.ctrlKey = true
        }
        if (toggled.includes(Keys.ALT.name)) {
          init.altKey = true
        }
        const keydown = new KeyboardEvent('keydown', init)
        ;(keydown as any).virtualKeyboard = true
        const keyup = new KeyboardEvent('keyup', init)
        ;(keyup as any).virtualKeyboard = true
        textarea.dispatchEvent(keydown)
        textarea.dispatchEvent(keyup)
      }
    }
  }
}
</script>