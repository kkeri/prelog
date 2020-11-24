import * as colors from 'colors'
import { createReadStream, readFileSync } from 'fs'
import * as readline from 'readline'
import { parser } from '../core/parser'
import { printActions } from '../core/print'
import { PrintStream } from '../core/stream'
import { Cons, List, nil } from '../core/syntax'
import { Diagnostics } from '../util/diag'
import { PrettyFormatter } from '../util/format'
import { ModelPrinter } from '../util/printer'
import yargs = require('yargs')
import { createInterpreter } from '../ip/interpreter'

// Command line interface

const MultiStream = require('multistream')
const pkg = require('../../package.json')

const argv = yargs
  .options({
    'file': {
      alias: 'f',
      describe: 'read program from file',
      type: 'string',
    },
  })
  .version(`prelog v${pkg.version}`)
  .usage(`Prelog v${pkg.version}\nUsage:\n  prelog <options>`)
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
  breakLimit: 70,
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

const rl = readline.createInterface({
  input,
  output,
  terminal: inputIsTTY && outputIsTTy,
})

const ip = createInterpreter(new PrintStream(printer), () => {
  rl.close()
  process.exit()
})

const files = Array.isArray(argv.file)
  ? argv.file as string[]
  : argv.file ? [argv.file] : []

for (const file of files) {
  const text = readFileSync(file, 'utf8')
  processSequence(text)
}

rl.setPrompt('prelog> ')
if (inputIsTTY && outputIsTTy) rl.prompt(true)

rl.on('line', (line) => {
  try {
    if (line.trim() === '') return
    processSequence(line)
  }
  finally {
    // calling prompt after closing prevents termination
    if (inputIsTTY && outputIsTTy) rl.prompt(true)
  }
})

process.once('SIGINT', () => output.write('exit\n'))

function processSequence (text: string) {
  const diag = new Diagnostics()
  const input = parser.parse(text, { diag })
  ip.send(input)
  for (const msg of diag.messages) {
    process.stderr.write(msg.message + '\n')
  }
}
