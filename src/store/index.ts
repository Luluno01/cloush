import { SSHConsoles } from './SSHConsoles'
import CredentialStore from './CredentialStore'
import { UpstreamStore } from './UpstreamStore'
import { ConfigStore } from './ConfigStore'


export class Store {
  public static instance = new Store
  private states: Map<string, State> = new Map

  constructor() {
    if(Store.instance) return Store.instance
    Store.instance = this
    this.set('ConfigStore', new ConfigStore)
    this.set('SSHConsoles', new SSHConsoles)
    this.set('CredentialStore', new CredentialStore)
    this.set('UpstreamStore', new UpstreamStore)
  }

  public get(name: 'ConfigStore'): ConfigStore
  public get(name: 'SSHConsoles'): SSHConsoles
  public get(name: 'CredentialStore'): CredentialStore
  public get(name: 'UpstreamStore'): UpstreamStore
  public get<T extends State>(name: string): T | undefined {
    return this.states.get(name) as T
  }

  public set<T>(name: string, state: State<T>) {
    this.states.set(name, state)
    return this
  }

  public delete(name: string) {
    return this.states.delete(name)
  }
}

export interface State<T = any> {
  readonly state: T
}

export default new Store
