import * as colors from 'colors'
import { createReadStream, readFileSync } from 'fs'
import * as readline from 'readline'
import { parser } from '../core/parser'
import { printActions } from '../core/print'
import { PrintStream } from '../core/stream'
import { thaLanguages } from '../ip-tha/interpreter'
import { lispLanguages } from '../ip-lisp/language'
import { Diagnostics } from '../util/diag'
import { PrettyFormatter } from '../util/format'
import { ModelPrinter } from '../util/printer'
import yargs = require('yargs')
import { Cons, List, nil } from '../core/syntax'

// Command line interface

const MultiStream = require('multistream')
const pkg = require('../../package.json')

const languages = {
  ...thaLanguages,
  ...lispLanguages,
}

const argv = yargs
  .options({
    'eval': {
      alias: 'e',
      describe: 'evaluation mode',
      type: 'boolean'
    },
    'language': {
      alias: 'l',
      describe: 'language',
      type: 'string',
      choices: Object.getOwnPropertyNames(languages),
      default: 'prop',
    },
    'file': {
      alias: 'f',
      describe: 'read program from file',
      type: 'string',
    },
  })
  .version(`prelog v${pkg.version}`)
  .usage(`Prelog interpreter v${pkg.version}\nUsage:\n  prelog <options>`)
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

const ip = languages[argv.language].createInterpreter(new PrintStream(printer), () => {
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

// rl.on('close', () => {
//   if (inputIsTTY && outputIsTTy) output.write('\n')
// })

process.once('SIGINT', () => output.write('exit\n'))

function processSequence (text: string) {
  const diag = new Diagnostics()
  const tokens = parser.parse(text, { diag, rule: 'Tokens' })
  // convert the array of tokens into a list
  if (tokens) {
    let list: List = nil

    for (let i = tokens.length; --i >= 0;) list = new Cons(tokens[i], list)
    ip.send(list)
  }
  for (const msg of diag.messages) {
    process.stderr.write(msg.message + '\n')
  }
}
