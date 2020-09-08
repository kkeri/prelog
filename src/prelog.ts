import { createReadStream } from 'fs'
import { createCommandProcessor } from './cmd'
import { ResolverInterpreter } from './resolver/interpreter'
import { repl } from './util/repl'

// Command line interface

const input = process.argv[2]
  ? createReadStream(process.argv[2])
  : process.stdin

repl(input, process.stdout, createCommandProcessor(() => new ResolverInterpreter()))
