import { createReadStream } from 'fs'
import { createCommandProcessor } from './cmd'
import { NativeInterpreter } from './interpreter/interpreter'
import { repl } from './util/repl'

// Command line interface

const input = process.argv[2]
  ? createReadStream(process.argv[2])
  : process.stdin

repl(input, process.stdout, createCommandProcessor(() => new NativeInterpreter()))
