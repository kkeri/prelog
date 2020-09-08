import stream = require('stream')
import { EventEmitter } from 'events'

export interface ReadLineInterface extends EventEmitter {
  // Emitted when the user enters a new line.
  emit (event: 'line', line: string): boolean
  // Emitted when the REPL is closed.
  emit (event: 'close'): boolean

  on (event: 'line', listener: (line: string) => void): this
  on (event: 'close', listener: () => void): this

  once (event: 'line', listener: (line: string) => void): this
  once (event: 'close', listener: () => void): this
}

// Executes a command entered into a command line interface.
// Returns the new prompt (excluding '>').
export type CommandProcessorFn = (line: string) => string

export type CreateCommandProcessorFn = (
  // Exits the command interface
  exit: () => void,
  // standard output
  output: stream.Writable,
) => CommandProcessorFn
