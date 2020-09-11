import * as readline from 'readline'
import { parser } from "../parser"
import { Syntax } from "../syntax"
import { Interpreter } from "../types"
import { Diagnostics } from "../util/diag"
import { PrettyFormatter } from "../util/format"
import stream = require('stream')
import { ModelPrinter } from '../util/printer'

export type CreateReader = (interpret: Syntax) => void

export interface Closeable {
  close (): void
}

export function createLineReader (opts: {
  stdin: stream.Readable
  stderr?: stream.Writable
  interpreter: Interpreter
  printer?: ModelPrinter
  interactive?: boolean
}): Closeable {
  let closed = false
  const rl = readline.createInterface({
    input: opts.stdin,
    terminal: !!opts.printer,
  })

  rl.on('line', (line) => {
    try {
      const diag = new Diagnostics()
      const term = parser.parse(line, { diag, rule: 'Term' })
      if (term) {
        const result = opts.interpreter.extend(term)
      }
      else if (opts.stderr) {
        for (const msg of diag.messages) {
          opts.stderr.write(msg.message + '\n')
        }
      }
    }
    finally {
      // calling prompt after closing prevents termination
      if (!closed) rl.prompt(true)
    }
  })

  return {
    close () {
      closed = true
      rl.close()
    }
  }
}
