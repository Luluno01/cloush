import { SSHConsoleTarget } from '@/components/SSHConsole'
import store, { State } from './index'
import { EventEmitter } from 'events'
import { Target } from './SSHConsoles'
import { Upstream, UpstreamStore, RequiredField } from './UpstreamStore'


export interface Credential extends SSHConsoleTarget {
  id: number
  username: string
  password: string
}

export const credentialKeys: Set<keyof Credential> = new Set([
  'id',
  'name',
  'uri',
  'username',
  'password',
  'group'
])

export class Credential {
  protected _group: string | null
  public get group() {
    return this._group || null
  }
  public set group(group: string | null) {
    this._group = group || null
  }
  private get upstream(): Upstream {
    return store.get<UpstreamStore>(UpstreamStore.name)!.state
  }
  constructor({ id, name, uri, username, password, group }: Target & { id?: number }) {
    this.id = id || 0
    this.name = name
    this.uri = uri
    this.username = username
    this.password = password
    this._group = group || null
  }

  public async save() {
    await this.upstream.save(this)
  }

  public async destroy() {
    await this.upstream.destroy(this)
  }

  public async sync() {
    await this.upstream.sync(this)
  }

  public toJSON(): Pick<Credential, 'id' | 'name' | 'uri' | 'group'>
  public toJSON(withSecret: false): Pick<Credential, 'id' | 'name' | 'uri' | 'group'>
  public toJSON(withSecret: true): Pick<Credential, 'id' | 'name' | 'uri' | 'username' | 'password' | 'group'>
  public toJSON(withSecret?: boolean) {
    if(withSecret) {
      return {
        id: this.id,
        name: this.name,
        uri: this.uri,
        username: this.username,
        password: this.password,
        group: this.group
      }
    } else {
      return {
        id: this.id,
        name: this.name,
        uri: this.uri,
        group: this.group
      }
    }
  }

  public static async create(credential: Pick<Credential, RequiredField>) {
    const upstream = store.get<UpstreamStore>(UpstreamStore.name)!.state
    return await upstream.create(credential)
  }
}

export class CredentialStore extends EventEmitter implements State<Credential[]> {
  public readonly state: Credential[] = []
  private get upstream(): Upstream {
    return store.get<UpstreamStore>(UpstreamStore.name)!.state
  }
  public async loadCredentials() {
    const { upstream } = this
    const res = await upstream.getAll()
    if(!(res instanceof Array)) {
      throw new Error('Invalid credentials')
    }
    if(!res.every(res => CredentialStore.isValidCredential(res))) {
      throw new Error('Invalid credentials')
    }
    this.state.splice(0, this.state.length, ...res.map(res => new Credential(res)))
    this.emit('load-credentials', this.state)
  }

  public add(credential: Credential) {
    if(credential instanceof Credential) {
      this.state.push(credential)
      this.emit('add', credential)
      return credential
    } else {
      const cred = new Credential(credential)
      this.state.push(cred)
      this.emit('add', cred)
      return cred
    }
  }

  public remove(credential: Credential) {
    const { state } = this
    const index = state.indexOf(credential)
    if(index >= 0) {
      state.splice(index, 1)
      this.emit('remove', credential, index)
      return true
    } else return false
  }

  public static isValidCredential(credential: any): credential is Credential {
    try {
      for(const key of credentialKeys) {
        if(key in credential) {
          if(key == 'group') {
            if(typeof credential.group != 'string' && credential.group !== null) return false
          } else if(key == 'id') {
            if(typeof credential.id != 'number') return false
          } else if(typeof credential[key] != 'string') return false
        } else {
          return false
        }
      }
      return true
    } catch(err) {
      return false
    }
  }
}

export default CredentialStore
