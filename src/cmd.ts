import stream = require('stream')
import * as colors from 'colors'
import { Interpreter } from './types'
import { parser } from './parser'
import { printActions } from './print'
import { Diagnostics } from './util/diag'
import { PrettyFormatter } from './util/format'
import { CommandProcessorFn } from './util/iface'
import { ModelPrinter } from './util/printer'

export const styles = {
  operator: colors.cyan,
  name: colors.white,
  keyword: colors.yellow,
  number: colors.yellow,
  string: colors.green,
  comment: colors.gray,
}

const formatOptions = {
  indentSize: 2,
  breakLimit: 0,
  lineBreak: '\n'
}

export const createCommandProcessor = (createInterpreter: () => Interpreter) =>
  (exit: () => void, output: stream.Writable): CommandProcessorFn => {
    const formatter: PrettyFormatter = new PrettyFormatter(output, 0, formatOptions)
    let ip = createInterpreter()

    output.write(`Prelog - type .h for help.\n`)

    return function processLine (line) {
      line = line.trim()
      if (line.length === 0) {
        // skip empty lines
      } else if (/^.*\/\//.test(line)) {
        // skip comment lines starting with //
      } else if (/^\.[a-zA-Z]/.test(line)) {
        // commands start with .
        processCommand(line)
      } else {
        // everything else goes to the interpreter
        processStatement(line)
      }
      return ''
    }

    function processCommand (line) {
      const parts: string[] = line.trim().substr(1).split(/\s+/)
      const args: string[] = parts.splice(1).join(' ').split(',').map(arg => arg.trim())
      switch (parts[0]) {

        case 'h':
        case 'help':
          help()
          break

        case 'p':
        case 'print':
          printTerm(ip.current()).br()
          break

        case 'r':
        case 'restart':
          ip = createInterpreter()
          formatter.emit('----------------').br()
          break

        case 'x':
        case 'exit':
          exit()
          break

        default:
          formatter.emit('What do you mean?\n').br()
      }
    }

    function processStatement (str: string) {
      const stmt = parseTerm(str)
      if (stmt) {
        try {
          const nf = ip.extend(stmt)
          printTerm(nf).br()
        }
        catch (e) {
          formatter.emit(e.toString()).br()
        }
      }
    }

    // helpers

    function parseTerm (str: string) {
      const diag = new Diagnostics()
      const stmt = parser.parse(str, { diag, rule: 'Term' })
      if (!stmt) {
        for (const msg of diag.messages) {
          formatter.emit(msg.message).br()
        }
      }
      return stmt
    }

    function printTerm (obj) {
      const printer = new ModelPrinter({
        formatter: formatter,
        actions: printActions,
        styles: styles,
      })
      printer.print(obj)
      return formatter
    }

    function help () {
      formatter.emit(helpText).br()
    }
  }

const helpText = `
  .p, .print      Print program
  .r, .restart    Restart the interpreter
  .h, .help       Print the list of available commands
  .x, .exit       Quit read-eval-print loop
`
