import * as colors from 'colors'
import { createReadStream } from 'fs'
import { createCommandProcessor } from './cmd'
import { NativeInterpreter } from './interpreter/interpreter'
import { printActions } from './print'
import { PrintStream } from './stream'
import { PrettyFormatter } from './util/format'
import { ModelPrinter } from './util/printer'
import { repl } from './util/repl'
import yargs = require('yargs')

const MultiStream = require('multistream')
const pkg = require('../package.json')

// Command line interface

const argv = yargs
  .options({
    'i': {
      alias: 'interactive',
      describe: 'interactive mode',
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

repl(input, process.stdout, createCommandProcessor(
  () => new NativeInterpreter(
    {},
    { stdout: new PrintStream(printer) },
  )
))
