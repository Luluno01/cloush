<template>
  <v-container class="credential-storage">
    <v-form ref="form" v-model="valid">
      <v-container>
        <v-row>
          <v-col
            cols="12"
            md="4"
            sm="12"
          >
            <v-text-field
              v-model="url"
              :rules="urlRules"
              label="URL"
              required
            ></v-text-field>
          </v-col>

          <v-col
            cols="12"
            md="4"
            sm="12"
          >
            <v-text-field
              v-model="username"
              :rules="usernameRules"
              label="User name"
              required
            ></v-text-field>
          </v-col>

          <v-col
            cols="12"
            md="4"
            sm="12"
          >
            <v-text-field
              v-model="password"
              :rules="passwordRules"
              label="Password"
              required
              :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
              :type="showPassword ? 'text' : 'password'"
              @click:append="showPassword = !showPassword"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-container>
    </v-form>
    <v-btn text block :disabled="!valid" @click.stop="onSubmit">Cloush!</v-btn>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import store from '@/store'
import { UpstreamStore } from '../store/UpstreamStore'
import { View } from '../router'


Component.registerHooks([
  'beforeRouteEnter'
])

@Component
export default class CredentialStorage extends Vue {
  private url = ''
  private username = ''
  private password = ''

  public mounted() {
    this.url = this.username = this.password = ''
  }

  private urlRules = [
    (v: string) => !!v.trim() || 'URL is required'
  ]
  private usernameRules = [
    (v: string) => !!v.trim() || 'User name is required'
  ]
  private passwordRules = [
    (v: string) => !!v.trim() || 'Password is required'
  ]

  private onSubmit() {
    store.get<UpstreamStore>('UpstreamStore')!.set(this.url, { username: this.username, password: this.password })
    this.url = this.username = this.password = ''
    ;(this.$refs.form as any).resetValidation()
    this.$router.replace(View.SERVER_LIST)
  }

  private valid = false
  private showPassword = false
}
</script>
