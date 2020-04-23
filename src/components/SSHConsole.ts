import { SocketHandler, On } from '@/helpers/SocketHandler'
import { Terminal, IDisposable } from 'xterm'
import { WebLinksAddon } from 'xterm-addon-web-links'
import { FitAddon } from 'xterm-addon-fit'
import { WebglAddon } from 'xterm-addon-webgl'
import { Credential } from '@/store/CredentialStore'
import { EventEmitter } from 'events'
import store from '@/store'
import sha512 from '@/helpers/sha512'


export enum ForegroundColor {
  BLACK = '\x1b[30m',
  RED = '\x1b[31m',
  GREEN = '\x1b[32m',
  YELLOW = '\x1b[33m',
  BLUE = '\x1b[34m',
  MAGENTA = '\x1b[35m',
  CYAN = '\x1b[36m',
  WHITE = '\x1b[37m'
}

export enum BackgroundColor {
  BLACK = '\x1b[40m',
  RED = '\x1b[41m',
  GREEN = '\x1b[42m',
  YELLOW = '\x1b[43m',
  BLUE = '\x1b[44m',
  MAGENTA = '\x1b[45m',
  CYAN = '\x1b[46m',
  WHITE = '\x1b[47m'
}

export enum OtherColor {
  RESET = '\x1b[0m',
  BOLD = '\x1b[1m'
}

export interface SSHConsoleTarget {
  uri: string
  name: string
  group: string | null
}

export class SSHConsole extends SocketHandler {
  public term: Terminal
  public auth!: { username: string, password: string }
  public eventEmitter = new EventEmitter
  protected fitAddon: FitAddon
  protected disposables: IDisposable[] = []
  constructor(term: Terminal) {
    super()
    this.term = term
    term.loadAddon(new WebLinksAddon)
    const fitAddon = this.fitAddon = new FitAddon
    term.loadAddon(fitAddon)
    try {
      fitAddon.fit()
    } catch(err) {
      console.error('Unable to fit terminal', err)
    }
    if(store.get('ConfigStore').get('useWebGL')) term.loadAddon(new WebglAddon(true))
    // this.disposables.push(term.onResize(newSize => this.socket.emit('resize', newSize)))
    this.disposables.push(term.onData(data => this.socket.send(data)))
  }

  public connectSSH(credential: Pick<Credential, 'uri' | 'username' | 'password'>) {
    this.auth = credential
    this.term.writeln(`${ForegroundColor.CYAN}Connecting to ${credential.uri}${OtherColor.RESET}`)
    this.connect(credential.uri)
  }

  @On('connect')
  public onConnect() {
    this.eventEmitter.emit('connect')
    this.term.writeln(`${ForegroundColor.CYAN}Connected, authenticating${OtherColor.RESET}`)
    const { username } = this.auth
    this.socket.emit('username', username)
  }

  @On()
  public salts(salts: string[]) {
    if (!(salts instanceof Array) || !salts[0] || !salts[1] ) {
      this.eventEmitter.emit('failed')
      this.term.writeln(`${ForegroundColor.RED}Unknown response from server${OtherColor.RESET}`)
      this.socket.emit('disconnect')
      this.destroy()
    }
    const { password } = this.auth
    const [ staticSalt, dynamicSalt ] = salts
    this.socket.emit('password', sha512(dynamicSalt + sha512(staticSalt + password)))
  }

  @On()
  public authenticated() {
    this.eventEmitter.emit('authenticated')
    this.term.writeln(`${ForegroundColor.GREEN}Authenticated${OtherColor.RESET}\n\n`)
    this.socket.once('message', () => this.term.clear())
    this.fit()
  }

  @On('remote-ready')
  public remoteReady() {
    this.eventEmitter.emit('remote-ready')
    this.term.writeln(`${ForegroundColor.GREEN}Remote logged in${OtherColor.RESET}\n\n`)
    this.socket.once('message', () => this.term.clear())
    this.fit()
  }

  @On('username-or-password-incorrect')
  public authFailed() {
    this.eventEmitter.emit('username-or-password-incorrect')
    this.term.writeln(`${ForegroundColor.RED}Username or password incorrect${OtherColor.RESET}`)
  }

  @On()
  public failed(msg?: string) {
    this.eventEmitter.emit('failed', msg)
    this.term.writeln(`${ForegroundColor.RED}${msg || 'Remote failure'}${OtherColor.RESET}`)
  }

  @On()
  public timeout() {
    this.eventEmitter.emit('timeout')
    this.term.writeln(`${ForegroundColor.RED}Authentication timeout${OtherColor.RESET}`)
  }

  @On()
  public disconnect() {
    this.eventEmitter.emit('disconnect')
    this.term.writeln(`\r\n\n${ForegroundColor.YELLOW}Disconnected${OtherColor.RESET}`)
    this.destroy()
  }

  @On()
  public exit(exitCode: number, signal?: number) {
    this.eventEmitter.emit('exit')
    this.term.writeln(`\r\n\n${ForegroundColor.YELLOW}Exit code: ${exitCode}${typeof signal == 'number' ? `, signal: ${signal}` : ''}${OtherColor.RESET}`)
    this.destroy()
  }

  @On('remote-exit')
  public remoteExit(exitCode: number, signalName: string | null, didCoreDump: boolean | null, description: string | null) {
    this.eventEmitter.emit('remote-exit')
    this.term.write(`\r\n\n${ForegroundColor.YELLOW}Exit code: ${exitCode}`)
    if (signalName) this.term.write(`\r\nSignal: ${signalName}`)
    if (typeof didCoreDump == 'boolean') this.term.write(`\r\nDid core dump: ${didCoreDump}`)
    if (description) this.term.write(`\r\nDescription: ${description}`)
    this.term.writeln(OtherColor.RESET)
    this.destroy()
  }

  @On()
  public message(data: string) {
    if (data) this.term.write(data)
  }

  @On()
  public error(err: Error | string | number) {
    this.term.writeln(`\r\n\n${ForegroundColor.RED}Connection error, disconnecting (if connected)${OtherColor.RESET}`)
    this.destroy()
  }

  public fit() {
    this.fitAddon.fit()
    this.emitResize()
  }

  protected $resizeTimer?: ReturnType<typeof setTimeout>
  protected emitResize() {
    if (this.$resizeTimer) {
      clearTimeout(this.$resizeTimer)
    }
    this.$resizeTimer = setTimeout(() => {
      this.$resizeTimer = undefined
      const { term: { rows, cols, element } } = this
      if (element) this.socket.emit('resize', {
        cols,
        rows,
        height: element.clientHeight,
        width: element.clientWidth
      })
    }, 500)
  }

  public refresh() {
    this.term.refresh(0, this.term.rows - 1)
  }

  public focus() {
    this.term.focus()
  }

  public destroy() {
    super.destroy()
    this.eventEmitter.emit('destroy')
    this.disposables.forEach(disposable => disposable.dispose())
    this.disposables = []
  }
}

export default SSHConsole
