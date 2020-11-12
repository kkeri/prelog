import * as syntax from "../core/syntax"
import { arrayToList } from "../core/syntax"
import { Interpreter } from "./interpreter"
import { Model } from "./model/base-model"
import { SyntaxErr } from "./model/comp-model"
import { printEnvironment } from "./native"
import { BlockSyntaxReader } from "./reader"

const metaPrefix = '@'

export type ip = Interpreter & {
  setProgram (p: Model): void
}

// Evaluates a metalevel command.
// Returns true if the term has been evaluated.
// Note: these commands don't use semantic rules, so they can be called
// even if something goes wrong with semantics.
export function evalMetaCommand (ip: Interpreter, reader: BlockSyntaxReader): boolean {
  const fork = reader.fork()
  const evald = _evalMetaCommand(ip, fork)
  if (evald) reader.join(fork)
  return evald
}

export function _evalMetaCommand (ip: Interpreter, reader: BlockSyntaxReader): boolean {
  const term = reader.read()
  if (!(term instanceof syntax.Sym)) return false
  if (term.value.substr(0, metaPrefix.length) !== metaPrefix) return false
  const cmdName = term.value.substr(metaPrefix.length)
  for (const cmd of metaCommands) {
    for (const name of cmd.names) {
      if (name === cmdName) {
        try {
          cmd.fn(ip, reader)
        }
        catch (e) {
          ip.writer.send(new SyntaxErr(e.message, term).reflect())
        }
        return true
      }
    }
  }
  return false
}

interface MetaCommand {
  names: string[]
  help: string
  fn: (ip: Interpreter, reader: BlockSyntaxReader) => void
}

const metaCommands: MetaCommand[] = [
  {
    names: ['l', 'list'],
    help: 'Lists the current program',
    fn (ip) {
      printEnvironment(ip, ip.program)
    }
  },
  {
    names: ['r', 'reset'],
    help: 'Resets the interpreter',
    fn (ip) {
      ip.program = ip.sgn.unit
    }
  },
  // {
  //   names: ['con'],
  //   help: 'Starts multiline conjunction',
  //   fn (ip, term) {
  //     nestInterpreter(ip, term, signatures.lm)
  //   }
  // },
  // {
  //   names: ['dis'],
  //   help: 'Starts multiline disjunction',
  //   fn (ip, term) {
  //     nestInterpreter(ip, term, signatures.uj)
  //   }
  // },
  {
    names: ['x', 'exit'],
    help: 'Leaves the interpreter',
    fn (ip) {
      ip.exit(ip.program.reflect())
    }
  },
  {
    names: ['h', 'help'],
    help: 'Prints help',
    fn (ip) {
      const out = ip.writer
      metaCommands.forEach(cmd => out.send(buildCommandHelp(cmd)))
    }
  },
]

// function nestInterpreter (
//   ip: ip,
//   term: syntax.Cons,
//   envType: Signature,
// ): void {
//   const name = ip.nextArg()
//   if (!(name instanceof syntax.Sym)) {
//     ip.next.send(new SyntaxErr('expected semantics name as the first argument', term).reflect())
//     return
//   }
//   if (!(name.value in semantics)) {
//     ip.next.send(new SyntaxErr('unknown semantics', term).reflect())
//     return
//   }
//   const sem = semantics[name.value]()
//   const childIp = new ip(sem, envType, ip.program, ip.next,
//     value => {
//       ip.next.send(value)
//       ip.send(value)
//       ip.delegate = undefined
//     },
//   )
//   ip.delegate = childIp
// }

function buildCommandHelp (cmd: MetaCommand) {
  const keyword = new syntax.Sym('command')
  const names = new syntax.Brackets(arrayToList(cmd.names.map(
    name => new syntax.Str(metaPrefix + name)
  )))
  const descr = new syntax.Str(cmd.help)
  return arrayToList([keyword, names, descr])
}
