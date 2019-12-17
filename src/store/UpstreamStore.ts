import { State } from './index'
import fetchJSON from '@/helpers/fetchJSON'
import { EventEmitter } from 'events'
import { Target } from './SSHConsoles'
import { Credential } from './CredentialStore'


export type RequiredField = 'name' | 'uri' | 'username' | 'password' | 'group'

/**
 * Credential storage upstream
 */
export class Upstream {
  public base: string
  public auth: { username: string, password: string }
  constructor(base: string, auth: { username: string, password: string }) {
    if(base.endsWith('/')) base = base.substr(0, base.length - 1)
    this.base = base
    this.auth = auth
  }

  public getBaseURL(withSecret: boolean = false) {
    return withSecret ? (this.base + '?with-secret=true') : this.base
  }

  public getURLForID(id: number, withSecret: boolean = false) {
    return this.base + '/' + id + (withSecret ? '?with-secret=true' : '')
  }

  protected async fetchJSON<T>(url: string, init?: RequestInit) {
    const { auth: { username, password } } = this
    const authHeader = `Basic ${btoa(`${username}:${password}`)}`
    if(init) {
      if(init.headers) {
        (init.headers as any).Authorization = authHeader
      } else {
        init.headers = {
          Authorization: authHeader
        }
      }
    } else {
      init = {
        headers: {
          Authorization: authHeader
        }
      }
    }
    return await fetchJSON<T>(url, init)
  }

  public async save({ id, name, uri, username, password, group }: Credential) {
    await this.fetchJSON(this.getURLForID(id), {
      method: 'PUT',
      body: JSON.stringify({
        name: name,
        uri: uri,
        username: username,
        password: password,
        group: group
      })
    })
  }

  public async destroy({ id }: Credential) {
    await this.fetchJSON(this.getURLForID(id), {
      method: 'DELETE'
    })
  }

  public async sync(credential: Credential) {
    const res = await this.fetchJSON<Credential>(this.getURLForID(credential.id, true))
      credential.name = res.name
      credential.uri = res.uri
      credential.username = res.username
      credential.password = res.password
      credential.group = res.group
  }

  public async create(credential: Pick<Credential, RequiredField>) {
    return await this.fetchJSON<number>(this.getBaseURL(), {
      method: 'POST',
      body: JSON.stringify(credential)
    })
  }

  public async getAll() {
    return await this.fetchJSON<(Target & { id: number })[]>(this.getBaseURL(true))
  }
}

export class LocalUpstream extends Upstream {
  private id = 1
  private records: Map<number, Target & { id: number }> = new Map
  constructor() {
    super('webssh://local/credentials', { username: '', password: '' })
  }

  public async save(credential: Credential) {
    const { records } = this
    const { id } = credential
    if(records.has(id)) {
      records.set(id, credential.toJSON(true))
    } else {
      throw Error('Credential not found')
    }
  }

  public async destroy({ id }: Credential) {
    const { records } = this
    if(records.has(id)) {
      records.delete(id)
    } else {
      throw Error('Credential not found')
    }
  }

  public async sync(credential: Credential) {
    const res = this.records.get(credential.id)
    if(!res) throw new Error('Credential not found')
    credential.name = res.name
    credential.uri = res.uri
    credential.username = res.username
    credential.password = res.password
    credential.group = res.group
  }

  public async create({ name, uri, username, password, group }: Pick<Credential, RequiredField>) {
    const id = this.id++
    this.records.set(id, {
      id,
      name,
      uri,
      username,
      password,
      group: group || null
    })
    return id
  }

  public async getAll() {
    return Array.from(this.records.values()).map(value => Object.assign({}, value))
  }
}

export class UpstreamStore extends EventEmitter implements State<Upstream> {
  public readonly state: Upstream = new LocalUpstream

  public set(baseURL: string, auth: { username: string, password: string }) {
    Object.defineProperty(this, 'state', {
      writable: false,
      enumerable: true,
      configurable: true,
      value: new Upstream(baseURL, auth)
    })
    this.emit('set', this.state)
  }

  public reset() {
    Object.defineProperty(this, 'state', {
      writable: false,
      enumerable: true,
      configurable: true,
      value: new LocalUpstream
    })
    this.emit('reset')
  }
}
