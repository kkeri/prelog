import * as syntax from "../core/syntax"
import { arrayToList } from "../core/syntax"
import { Interpreter } from "./interpreter"
import { Model, structEqual } from "./model/base-model"
import { And, Definition, SyntaxErr } from "./model/comp-model"

const metaPrefix = '@'

// Evaluates a meta level command.
// Returns true if the term has been evaluated.
// Note: these commands don't use semantic rules, so they can be called
// even if something goes wrong with semantics.
export function evalMetaCommand (ip: Interpreter, input: syntax.List): boolean {
  if (input instanceof syntax.Nil) return false
  const term = input.first
  if (!(term instanceof syntax.Sym)) return false
  if (term.value.substr(0, metaPrefix.length) !== metaPrefix) return false
  const cmdName = term.value.substr(metaPrefix.length)
  for (const cmd of metaCommands) {
    for (const name of cmd.names) {
      if (name === cmdName) {
        try {
          cmd.fn(ip)
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
  fn: (ip: Interpreter) => void
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
      ip.program = ip.sgn.initial
    }
  },
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

// helpers

function buildCommandHelp (cmd: MetaCommand) {
  const keyword = new syntax.Sym('command')
  const names = new syntax.Brackets(arrayToList(cmd.names.map(
    name => new syntax.Str(metaPrefix + name)
  )))
  const descr = new syntax.Str(cmd.help)
  return arrayToList([keyword, names, descr])
}

function printEnvironment (ip: Interpreter, model: Model) {
  if (structEqual(model, ip.sgn.initial)) {
    // don't include the unit into sequences
  }
  else if (model instanceof And) {
    printEnvironment(ip, model.a)
    printEnvironment(ip, model.b)
  }
  else if (model instanceof Definition) {
    if (model.native) {
      // don't print a native definition
    }
    else {
      ip.writer.send(model.reflect())
    }
  }
  else {
    ip.writer.send(model.reflect())
  }
}
