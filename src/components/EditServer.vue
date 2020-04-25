<template>
  <v-card tile>
    <v-toolbar dark color="primary">
      <v-btn icon dark @click="onClose">
        <v-icon>mdi-close</v-icon>
      </v-btn>
      <v-toolbar-title>Edit Server</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items>
        <v-btn dark text @click="onSave" :disabled="!valid">Save</v-btn>
      </v-toolbar-items>
    </v-toolbar>
    <v-form v-if="server" v-model="valid" ref="form">
      <v-container>
        <v-row>
          <v-col
            cols="12"
            lg="4"
            md="6"
            sm="12"
          >
            <v-text-field
              :counter="128"
              label="Name"
              v-model="server.name"
              required
              :rules="nameRules"
            ></v-text-field>
          </v-col>

          <v-col
            cols="12"
            lg="4"
            md="6"
            sm="12"
          >
            <v-text-field
              :counter="128"
              label="Group"
              v-model="server.group"
            ></v-text-field>
          </v-col>

          <v-col
            cols="12"
            lg="4"
            md="6"
            sm="12"
          >
            <v-text-field
              :counter="512"
              label="URI"
              v-model="server.uri"
              required
              :rules="uriRules"
            ></v-text-field>
          </v-col>

          <v-col
            cols="12"
            lg="4"
            md="6"
            sm="12"
          >
            <v-text-field
              :counter="128"
              label="User Name"
              v-model="server.username"
              required
              :rules="usernameRules"
            ></v-text-field>
          </v-col>

          <v-col
            cols="12"
            lg="4"
            md="6"
            sm="12"
          >
            <v-text-field
              :counter="512"
              label="Password"
              v-model="server.password"
              required
              :rules="passwordRules"
              :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
              :type="showPassword ? 'text' : 'password'"
              @click:append="showPassword = !showPassword"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-container>
    </v-form>
  </v-card>
</template>

<script lang="ts">
import { Component, Vue, Prop, Model } from 'vue-property-decorator'
import { SSHConsoleTarget } from './SSHConsole'


@Component
export default class EditServer extends Vue {
  @Model()
  public server!: SSHConsoleTarget
  public valid: boolean = false
  @Prop()
  public onCloseClick!: () => void
  public onClose() {
    if(this.onCloseClick) this.onCloseClick()
  }
  @Prop()
  public onSaveClick!: () => void
  public onSave() {
    if(this.onSaveClick) this.onSaveClick()
  }

  private nameRules = [
    (v: string) => !!v.trim() || 'Name is required'
  ]
  private uriRules = [
    (v: string) => !!v.trim() || 'URI is required'
  ]
  private usernameRules = [
    (v: string) => !!v.trim() || 'User name is required'
  ]
  private passwordRules = [
    (v: string) => !!v.trim() || 'Password is required'
  ]

  private showPassword = false

  public resetValidation() {
    (this.$refs.form as any).resetValidation()
  }
}
</script>
