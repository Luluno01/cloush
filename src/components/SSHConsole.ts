import { SocketHandler, On } from '@/helpers/SocketHandler'
import { Terminal, IDisposable } from 'xterm'
import { WebLinksAddon } from 'xterm-addon-web-links'
import { FitAddon } from 'xterm-addon-fit'
import { Credential } from '@/store/CredentialStore'
import { EventEmitter } from 'events'


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
    fitAddon.fit()
    this.disposables.push(term.onResize(newSize => this.socket.emit('resize', newSize)))
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
    const { username, password } = this.auth
    this.socket.emit('auth', { username, password })
  }

  @On()
  public authenticated() {
    this.eventEmitter.emit('authenticated')
    this.term.writeln(`${ForegroundColor.GREEN}Authenticated${OtherColor.RESET}\n\n`)
    this.socket.once('message', () => this.term.clear())
    this.fit()
  }

  @On('username-or-password-incorrect')
  public authFailed() {
    this.eventEmitter.emit('username-or-password-incorrect')
    this.term.writeln(`${ForegroundColor.RED}User name or password incorrect${OtherColor.RESET}`)
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
  public message(data: string) {
    this.term.write(data)
  }

  @On()
  public error(err: Error | string | number) {
    this.term.writeln(`\r\n\n${ForegroundColor.RED}Connection error, disconnecting (if connected)${OtherColor.RESET}`)
    this.destroy()
  }

  public fit() {
    this.fitAddon.fit()
    const { term: { rows, cols } } = this
    this.socket.emit('resize', { cols, rows })
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
  }
}

export default SSHConsole
