import * as readline from 'readline'
import { EventEmitter } from 'events'
import stream = require('stream')
import { ReadLineInterface } from './iface'

// Generic readline interface.
export class ReadLineClass extends EventEmitter implements ReadLineInterface {
  rl: readline.Interface
  closed = false

  constructor (
    input: stream.Readable = process.stdin,
    output: stream.Writable = process.stdout
  ) {
    super()
    this.rl = readline.createInterface({ input, output })
    this.rl
      .on('line', (line) => {
        try {
          this.emit('line', line)
        }
        finally {
          // calling prompt after closing prevents termination
          if (!this.closed) this.rl.prompt(true)
        }
      })
      .on('close', () => {
        this.emit('close')
      })
  }

  setPrompt (prompt: string): void {
    // todo
  }

  prompt (): void {
    this.rl.prompt(true)
  }

  write (str: string): void {
    this.rl.write(str)
  }

  writeLine (str: string): void {
    this.rl.write(str)
    this.rl.write('\n')
  }

  close () {
    this.closed = true
    this.rl.close()
  }
}
