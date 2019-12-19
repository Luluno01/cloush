<template>
  <v-app>
    <v-navigation-drawer
      v-model="drawer"
      :mini-variant.sync="miniDrawer"
      bottom
      app
    >
      <v-list-item>
        <v-list-item-avatar>
          <v-img src="https://randomuser.me/api/portraits/men/64.jpg"></v-img>
        </v-list-item-avatar>

        <v-list-item-title>Cloush</v-list-item-title>

        <v-btn
          icon
          @click.stop="miniDrawer = !miniDrawer"
          :hidden="$vuetify.breakpoint.mdAndDown"
        >
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>
      </v-list-item>

      <v-divider></v-divider>

      <v-list dense nav>
        <v-list-item-group v-model="currentActionIndex" color="primary" mandatory>
          <v-list-item
            v-for="(item, i) in functionItems"
            :key="i"
            link
            @click.stop="item.onClick(item.action)"
          >
            <v-list-item-icon>
              <v-icon>{{ item.icon }}</v-icon>
            </v-list-item-icon>

            <v-list-item-content>
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-list>

      <v-divider></v-divider>

      <v-list dense nav subheader>
        <v-subheader v-show="!miniDrawer" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Sessions {{ sessionItems.length ? '' : '(no active session)' }}</v-subheader>
        <v-list-group
          v-for="(group, groupIndex) in sessionItems"
          :key="groupIndex"
          sub-group
        >
          <template v-slot:activator>
            <v-list-item-title>{{ group.group || 'Default Group' }}</v-list-item-title>
          </template>
          <v-list-item
            v-for="session in group.sessions"
            :key="session.sessionID"
            link
            @click.stop="onSessionClick(session)"
          >
            <v-list-item-icon>
              <v-icon>mdi-console</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>{{ session.name }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-group>
      </v-list>
    </v-navigation-drawer>
    <v-app-bar
      app
      :dense="$vuetify.breakpoint.mdAndDown"
      color="primary"
      dark
    >
      <v-toolbar-title>{{ currentTitle }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn
        icon
        v-if="$route.name == 'server-list'"
        @click.stop="onToggleDeleteClick"
      >
        <v-icon>mdi-trash-can</v-icon>
      </v-btn>
      <v-btn
        icon
        v-if="$route.name == 'server-list'"
        @click.stop="onRefreshServerListClick"
      >
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
      <v-btn
        icon
        v-if="$route.name == 'consoles'"
        @click.stop="onCloseConsoleClick"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
      <v-btn
        icon
        :hidden="$vuetify.breakpoint.lgAndUp"
        @click.stop="drawer = true"
      >
        <v-icon>mdi-dots-vertical</v-icon>
      </v-btn>

    </v-app-bar>

    <v-content>
      <keep-alive>
        <router-view ref="view" :style="`max-height: calc(100vh - ${$vuetify.breakpoint.lgAndUp ? '64px' : '48px'});`"/>
      </keep-alive>
    </v-content>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { View } from '@/router'
import store from './store'
import { Target } from './store/SSHConsoles'
import Consoles from './views/Consoles.vue'
import ServerList from './views/ServerList.vue'


/**
 * Enum alias
 */
type DrawerAction = View
const DrawerAction = View

interface DrawerItem {
  icon: string
  title: string
  action?: DrawerAction
  onClick: (action: DrawerAction) => void
}

@Component
export default class App extends Vue {
  public drawer: boolean = false
  protected miniDrawerVal = false
  public get miniDrawer() {
    return (this as any /* Stupid unknown type bug */).$vuetify.breakpoint.mdAndDown ? false : this.miniDrawerVal
  }
  public set miniDrawer(value: boolean) {
    this.miniDrawerVal = value
  }
  protected DrawerAction = DrawerAction
  public goTo = this.doGoTo.bind(this)
  public functionItems: DrawerItem[] = [
    {
      icon: 'mdi-key',
      title: 'Credential Storage',
      action: DrawerAction.CREDENTIAL_STORAGE,
      onClick: this.goTo
    },
    {
      icon: 'mdi-format-list-bulleted-type',
      title: 'Server List',
      action: DrawerAction.SERVER_LIST,
      onClick: this.goTo
    },
    {
      icon: 'mdi-console',
      title: 'Consoles',
      action: DrawerAction.CONSOLES,
      onClick: this.goTo
    },
    {
      icon: 'mdi-settings',
      title: 'Settings',
      action: DrawerAction.SETTINGS,
      onClick: this.goTo
    }
  ]
  public currentActionIndex = 0
  public get currentAction(): DrawerAction | undefined {
    return this.functionItems[this.currentActionIndex].action
  }
  public set currentAction(action: DrawerAction | undefined) {
    if(!action) return
    let i = 0
    for(const { action: act } of this.functionItems) {
      if(action == act) {
        this.currentActionIndex = i
        return
      }
      i++
    }
  }

  public currentTitle = 'Cloush'

  @Watch('$route.name')
  private async onRouteChange(newRouteName: View) {
    this.currentAction = newRouteName
    if(newRouteName == View.CONSOLES) {
      await this.$nextTick()
      const consoles = this.$refs.view as Consoles
      if(consoles instanceof Consoles && consoles.currentSessionName) {
        this.currentTitle = consoles.currentSessionName
      }
    } else {
      this.currentTitle = 'Cloush'
    }
  }

  public sessionItems: { group: string | null, sessions: Target[] }[] = []

  private _onAddSession!: (target: Target) => void
  private onAddSession(target: Target) {
    const { group } = target
    for(const { group: _group, sessions } of this.sessionItems) {
      if(group == _group) {
        sessions.push(target)
        return
      }
    }
    this.sessionItems.push({
      group,
      sessions: [ target ]
    })
  }

  private _onRemoveSession!: (target: Target, index: number) => void
  private onRemoveSession(target: Target, index: number) {
    const { group } = target
    let i = 0
    for(const _group of this.sessionItems) {
      const { group: g, sessions } = _group
      if(group == g) {
        sessions.splice(index, 1)
        if(sessions.length == 0) {
          // Delete this empty group
          this.sessionItems.splice(i, 1)
        }
        return
      }
      i++
    }
  }

  public generateSessionItems() {
    this.sessionItems = Array.from(store.get('SSHConsoles')!.state).map(([ group, sessions ]) => {
      return {
        group,
        sessions
      }
    })
  }

  public async onSessionClick(target: Target) {
    if(this.$route.name != View.CONSOLES) {
      await this.doGoTo(DrawerAction.CONSOLES)
    }
    if(this.$vuetify.breakpoint.mdAndDown) this.drawer = false
    ;(this.$refs.view as Consoles).switchTo(target)
    this.currentTitle = (this.$refs.view as Consoles).currentSessionName!
  }

  public mounted() {
    this.drawer = (this as any /* Stupid unknown type bug */).$vuetify.breakpoint.lgAndUp
    this.generateSessionItems()
    store.get('SSHConsoles')!
      .on('add', this._onAddSession = this.onAddSession.bind(this) as typeof App.prototype.onAddSession)
      .on('remove', this._onRemoveSession = this.onRemoveSession.bind(this) as typeof App.prototype.onRemoveSession)
    this.onRouteChange(this.$route.name as View)
  }

  public beforeDestroy() {
    store.get('SSHConsoles')!
      .off('add', this._onAddSession)
      .off('remove', this._onRemoveSession)
  }

  protected async doGoTo(action: DrawerAction) {
    try {
      await this.$router.replace('/' + action)
    } catch(err) {
      return
    }
  }

  protected onToggleDeleteClick() {
    const { $refs: { view } } = this
    if(view instanceof ServerList) view.onToggleClick()
  }

  protected onRefreshServerListClick() {
    const { $refs: { view } } = this
    if(view instanceof ServerList) view.onRefreshClick()
  }

  protected onCloseConsoleClick() {
    const { $refs: { view } } = this
    if(view instanceof Consoles) {
      view.onCloseClick()
    }
  }
}
</script>

<style>
html { overflow-y: auto!important }
</style>
