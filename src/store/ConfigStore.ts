import { State } from './index'
import { EventEmitter } from 'events'


export interface PlainConfig {
  useWebGL: boolean
}

export const PlainConfigKeys: (keyof PlainConfig)[] = [ 'useWebGL' ]

export class Config implements PlainConfig {
  public useWebGL = false

  public save() {
    for(const key of PlainConfigKeys) {
      localStorage.setItem('config.' + key, this[key] ? '1' : '0')
    }
    return this
  }

  public load() {
    for(const key of PlainConfigKeys) {
      const value = localStorage.getItem('config.' + key)
      if(value !== null) {
        if(typeof this[key] == 'boolean') {
          this[key] = value == '1' ? true : false
        } else (this as any)[key] = value
      }
    }
    return this
  }
}

export class ConfigStore extends EventEmitter implements State<Config> {
  public readonly state = new Config

  constructor() {
    super()
    this.state.load()
  }

  public set<T extends keyof PlainConfig>(key: T, value: PlainConfig[T]) {
    this.state[key] = value
    this.emit('set', key, value)
    return this
  }

  public get<T extends keyof PlainConfig>(key: T): PlainConfig[T] {
    return this.state[key]
  }

  public save() {
    this.state.save()
    this.emit('save', this.state)
    return this
  }

  public reset() {
    Object.defineProperty(this, 'state', {
      writable: false,
      enumerable: true,
      configurable: true,
      value: new Config
    })
    return this
  }

  public load() {
    this.state.load()
    this.emit('load', this.state)
    return this
  }
}
