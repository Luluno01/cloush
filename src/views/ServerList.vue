<template>
  <v-container class="server-list fill-view px-0" fluid>
    <v-list dense style="margin-bottom: calc(16px + 56px);">
      <v-subheader>Server List</v-subheader>
      <v-list-group
        v-for="(group, groupIndex) in groups"
        :key="groupIndex"
        sub-group
        style="max-width: 100%;"
        value="true"
      >
        <template v-slot:activator>
          <v-list-item-title>{{ group.group || 'Default Group' }}</v-list-item-title>
        </template>
        <v-list-item
          v-for="(credential, credenialIndex) in group.credentials"
          :key="credenialIndex"
          link
          @click.stop="onServerClick(credential)"
        >
          <v-list-item-avatar>
            <v-icon>mdi-console</v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>{{ credential.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ credential.uri }}</v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-action>
            <v-btn icon @click.stop="onItemAction(credential, credenialIndex)">
              <v-icon>{{ deleteMode ? 'mdi-trash-can' : 'mdi-pencil-circle' }}</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
      </v-list-group>
    </v-list>
    <v-dialog v-model="editServerDialog" fullscreen hide-overlay transition="dialog-bottom-transition">
      <edit-server
        ref="editServer"
        :server="editedServer"
        :onCloseClick="onEditServerDialogClose"
        :onSaveClick="onSaveClick"
      />
    </v-dialog>
    <v-snackbar
      v-model="snackbar"
      :timeout="3000"
    >
      {{ snackbarText }}
      <v-btn
        color="pink"
        text
        @click="snackbar = false"
      >
        Close
      </v-btn>
    </v-snackbar>
    <v-btn
      fixed
      dark
      fab
      bottom
      right
      color="pink"
      @click.stop="onAddServerClick"
    >
      <v-icon>mdi-plus</v-icon>
    </v-btn>
    <v-dialog
      v-model="deleteServerDialog"
      max-width="290"
    >
      <v-card>
        <v-card-title class="headline">Delete Server</v-card-title>

        <v-card-text>
          Are you sure you want to delete this server?
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn
            color="red darken-1"
            text
            @click.stop="onDeleteServerConfirmed"
          >
            Yes
          </v-btn>

          <v-btn
            color="green darken-1"
            text
            @click.stop="onDeleteServerCanceled"
          >
            Cancel
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts">
// @ is an alias to /src
import { Component, Vue } from 'vue-property-decorator'
import { SSHConsoleTarget } from '@/components/SSHConsole'
import EditServer from '@/components/EditServer.vue'
import store from '@/store'
import CredentialStore, { Credential } from '@/store/CredentialStore'
import { View } from '@/router'
import SSHConsoles, { Target } from '@/store/SSHConsoles'
import sleep from 'unlib.js/build/Time/sleep'


Component.registerHooks([
  'beforeRouteEnter'
])

@Component({
  components: {
    EditServer
  }
})
export default class ServerList extends Vue {
  public deleteMode = false
  public groups: { group: string | null, credentials: Credential[] }[] = []
  private editingServer?: Credential | (Target & { id?: number })
  private editedServer = this.newEditedServer()
  private editServerDialog = false
  private snackbar = false
  private snackbarText = ''
  private deleteServerDialog = false
  private deletingServer?: Credential

  protected newEditedServer() {
    return { name: '', uri: 'https://', username: '', password: '', group: null } as Target
  }
  protected async onServerClick(target: Credential) {
    await this.$router.replace(View.CONSOLES)
    store.get<SSHConsoles>(SSHConsoles.name)!.add(target.toJSON(true))
  }

  protected _onLoadCredentials!: (credentials: Credential[]) => void
  protected onLoadCredentials(credentials: Credential[]) {
    this.groups = credentials.reduce((prev, curr) => {
      const { group } = curr
      const res = prev.find(({ group: g }) => g === group)
      if(res) {
        res.credentials.push(curr)
        return prev
      } else {
        prev.push({ group, credentials: [ curr ] })
        return prev
      }
    }, [] as { group: string | null, credentials: Credential[] }[])
  }

  protected _onAddCredential!: (credential: Credential) => void
  protected onAddCredential(credential: Credential) {
    const { groups } = this
    const { group } = credential
    const res = groups.find(({ group: g }) => g === group)
    if(res) {
      res.credentials.push(credential)
    } else {
      groups.push({ group, credentials: [ credential ] })
    }
  }

  protected _onRemoveCredential!: (credential: Credential, index: number) => void
  protected onRemoveCredential(credential: Credential, index: number) {
    const { groups } = this
    const { group } = credential
    const res = groups.find(({ group: g }) => g === group)
    if(res) {
      const { credentials } = res
      credentials.splice(credentials.indexOf(credential), 1)
    } else {
      // Reset
      this.onLoadCredentials(store.get<CredentialStore>(CredentialStore.name)!.state)
    }
  }

  public async mounted() {
    try {
      await store.get<CredentialStore>(CredentialStore.name)!
        .on('load-credentials', this._onLoadCredentials = this.onLoadCredentials.bind(this) as typeof ServerList.prototype.onLoadCredentials)
        .on('add', this._onAddCredential = this.onAddCredential.bind(this) as typeof ServerList.prototype.onAddCredential)
        .on('remove', this._onRemoveCredential = this.onRemoveCredential.bind(this) as typeof ServerList.prototype.onRemoveCredential)
        .loadCredentials()
      this.snackbarText = 'Credentials loaded'
    } catch(err) {
      this.snackbarText = 'Failed to load credentials :('
    }
    this.snackbar = true
  }

  public beforeRouteEnter(_to: unknown, _from: unknown, next: (callback: (vm: ServerList) => void) => void) {
    next(vm => {
      vm.deleteMode = false
    })
  }

  public onToggleClick() {
    this.deleteMode = !this.deleteMode
  }

  public async onRefreshClick() {
    try {
      store.get<CredentialStore>(CredentialStore.name)!.loadCredentials()
      this.snackbarText = 'Server list refreshed'
    } catch(err) {
      this.snackbarText = 'Refresh failed :('
    }
    this.snackbar = true
  }

  private onItemAction(credential: Credential, index: number) {
    if(this.deleteMode) {
      this.deletingServer = credential
      this.deleteServerDialog = true
    } else {
      this.editingServer = credential
      this.editedServer = credential.toJSON(true) as Target
      this.editServerDialog = true
    }
  }

  private async onDeleteServerConfirmed() {
    try {
      const { deletingServer } = this
      await deletingServer!.destroy()
      store.get<CredentialStore>(CredentialStore.name)!.remove(deletingServer!)
      this.snackbarText = 'Server deleted'
    } catch(err) {
      this.snackbarText = 'Failed to delete server :('
    }
    this.deleteServerDialog = false
    delete this.deletingServer
    this.snackbar = true
  }

  private onDeleteServerCanceled() {
    this.deleteServerDialog = false
    delete this.deletingServer
  }

  private onEditServerDialogClose() {
    delete this.editingServer
    this.editServerDialog = false
  }

  private verify() {
    if(!(this.editedServer.name = this.editedServer.name.trim())) {
      return false
    }
    if(!(this.editedServer.uri = this.editedServer.uri.trim())) {
      return false
    }
    if(!(this.editedServer.username = this.editedServer.username.trim())) {
      return false
    }
    if(!(this.editedServer.password = this.editedServer.password.trim())) {
      return false
    }
    this.editedServer.group = this.editedServer.group || null
    return true
  }

  private async onSaveClick() {
    if(this.verify()) {
      Object.assign(this.editingServer, this.editedServer)
      if(this.editingServer instanceof Credential) {
        await this.editingServer!.save()
        this.snackbarText = 'Server saved!'
      } else {
        const { editingServer } = this
        const id = await Credential.create(editingServer!)
        if(typeof id == 'number') {
          editingServer!.id = id
          const credential = new Credential(editingServer!)
          store.get<CredentialStore>(CredentialStore.name)!.add(credential)
        } else {
          await sleep(1000)
          this.onRefreshClick()
        }
        this.snackbarText = 'Server created'
      }
      delete this.editingServer
      this.editServerDialog = false
    } else {
      this.snackbarText = 'Name, URI, user name and password are required'
    }
    this.snackbar = true
  }

  private async onAddServerClick() {
    this.editingServer = this.newEditedServer()
    this.editedServer = this.newEditedServer()
    this.editServerDialog = true
  }
}
</script>

<style scoped>
.fill-view {
  width: 100%;
  height: 100%;
}
</style>
