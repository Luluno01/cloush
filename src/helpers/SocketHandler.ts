import io from 'socket.io-client'
import Obj from 'unlib.js/build/Obj'


export const symbol = Symbol.for('Socket')

export function On(event?: string) {
  return function(_target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // console.log(event, '->', propertyKey)
    Object.defineProperty(descriptor.value, symbol, {
      enumerable: false,
      writable: true,
      configurable: true,
      value: event || propertyKey
    })
  }
}

function *walkSocketEvents(self: SocketHandler) {
  const allEntries = Obj.getPropertyDescriptorsEntries(Object.getPrototypeOf(self))
  for(const [ , { value: func } ] of allEntries) {
    if(func instanceof Function && symbol in func) {
      const event: string = (func as any)[symbol]
      yield { event, func }
    }
  }
}

export class SocketHandler {
  public socket!: ReturnType<typeof io>
  private handlers: [ /* Event */ string, /* Handler */ Function ][] = []
  public get connected() {
    return this.socket.connected
  }
  public connect(uri: string) {
    this.socket = io(uri)
    this.attach()
  }
  private attach() {
    const { socket } = this
    for(const { event, func } of walkSocketEvents(this)) {
      const handler: Function = func.bind(this)
      // console.log(event, '=>', func.name)
      socket.on(event, handler)
      this.handlers.push([ event, handler ])
    }
  }
  private detach() {
    const { socket } = this
    this.handlers.forEach(([ event, handler ]) => socket.off(event, handler))
  }
  public destroy() {
    this.socket.disconnect()
    this.detach()
  }
}

export default SocketHandler
