import { State } from './index'
import { EventEmitter } from 'events'
import { Credential } from './CredentialStore'


export type Target = Pick<Credential, 'name' | 'uri' | 'username' | 'password' | 'group'> & { sessionID?: number }

export class SSHConsoles extends EventEmitter implements State<Map<string | null, Target[]>> {
  private sessionID = 0
  public readonly state: Map<string | null, Target[]> = new Map
  public add(target: Target) {
    const { state } = this
    const { group } = target
    const targets = state.get(group) || []
    target.sessionID = this.sessionID
    this.sessionID = (this.sessionID + 1) % (2 ** 31)
    targets.push(target)
    state.set(group, targets)
    this.emit('add', target)
  }
  public remove(target: Target) {
    const { state } = this
    const { group } = target
    const targets = state.get(group)
    if(!targets) return false
    const index = targets.indexOf(target)
    if(index >= 0) {
      targets.splice(index, 1)
      if(targets.length == 0) {
        this.state.delete(group)
      }
      this.emit('remove', target, index)
      return true
    } else return false
  }
}

export default SSHConsoles
