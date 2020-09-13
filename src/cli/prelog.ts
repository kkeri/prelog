import * as colors from 'colors'
import { createReadStream } from 'fs'
import * as readline from 'readline'
import { NativeInterpreter } from '../interpreter/interpreter'
import { parser } from '../parser'
import { printActions } from '../print'
import { PrintStream } from '../stream'
import { Diagnostics } from '../util/diag'
import { PrettyFormatter } from '../util/format'
import { ModelPrinter } from '../util/printer'
import yargs = require('yargs')

// Command line interface

const MultiStream = require('multistream')
const pkg = require('../../package.json')

const argv = yargs
  .options({
    'e': {
      alias: 'eval',
      describe: 'evaluation mode',
      type: 'boolean'
    },
  })
  .version(`prelog v${pkg.version}`)
  .usage(`Prelog interpreter v${pkg.version}\nUsage:\n  prelog <options> filenames...`)
  .help()
  .argv

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

const input = argv?._.length
  ? new MultiStream(argv._.map(filename => createReadStream(filename)))
  : process.stdin
const output = process.stdout

const inputIsTTY = input === process.stdin && process.stdin.isTTY
const outputIsTTy = output === process.stdout && process.stdout.isTTY

const interpreter = new NativeInterpreter({
  inputs: {},
  outputs: { stdout: new PrintStream(printer) },
})

const rl = readline.createInterface({
  input,
  output,
  terminal: inputIsTTY && outputIsTTy,
})

rl.setPrompt('prelog> ')
if (inputIsTTY && outputIsTTy) rl.prompt(true)

rl.on('line', (line) => {
  try {
    if (line.trim() === '') return
    const diag = new Diagnostics()
    const term = parser.parse(line, { diag, rule: 'Term' })
    if (term) {
      const result = interpreter.extend(term)
      printer.print(result).br()
    }
    for (const msg of diag.messages) {
      process.stderr.write(msg.message + '\n')
    }
  }
  finally {
    // calling prompt after closing prevents termination
    if (inputIsTTY && outputIsTTy) rl.prompt(true)
  }
})

rl.on('close', () => {
  if (inputIsTTY && outputIsTTy) output.write('\n')
})
