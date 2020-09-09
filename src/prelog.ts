import { createReadStream } from 'fs'
import { createCommandProcessor } from './cmd'
import { NativeInterpreter } from './interpreter/interpreter'
import { repl } from './util/repl'
import { PrintStream } from './stream'
import * as colors from 'colors'
import { PrettyFormatter } from './util/format'
import { ModelPrinter } from './util/printer'
import { printActions } from './print'

// Command line interface

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

const formatter = new PrettyFormatter(process.stdout, 0, formatOptions)
const printer = new ModelPrinter({
  formatter: formatter,
  actions: printActions,
  styles: styles,
})

const input = process.argv[2]
  ? createReadStream(process.argv[2])
  : process.stdin

repl(input, process.stdout, createCommandProcessor(
  () => new NativeInterpreter(
    {},
    { stdout: new PrintStream(printer) },
  )
))
