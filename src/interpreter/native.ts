import { DummyOutputStream } from "../stream"
import * as syntax from "../syntax"
import { OutputStream } from "../types"
import { Dictionary } from "../util/types"
import { Environment } from "./environment"
import { evaluate, lowerMeet, resolve, success } from "./interpreter"
import { And, Definition, Model, NativeProcess, ParentEnvironment, Process, SyntaxError, Atom, Num } from "./model"
import { Rank } from "./threshold"

export function getNativeEnvironment (): Environment {
  const env = new Environment(success, {}, {})
  for (const name in nativeDefs) {
    env.program = lowerMeet(
      env,
      env.program,
      () => translateNativeDef(name, nativeDefs[name]),
    )
  }
  return env
}

type NativeDefinition = Model | ((env: Environment) => Model)

function translateNativeDef (name: string, value: NativeDefinition): Model {
  const n = new syntax.Name(name)
  const v = typeof value === 'function'
    ? new NativeProcess(n, value)
    : value
  return new Definition(n, v)
}

const nativeDefs: Dictionary<NativeDefinition> = {
  true: new Atom(Rank.True, new syntax.Name('true')),
  false: new Atom(Rank.False, new syntax.Name('false')),

  def (env: Environment): Model {
    const name = env.next()
    if (!(name instanceof syntax.Name)) return new SyntaxError('the first argument of a definition must be a name', name)
    const def = new Definition(name, evaluate(env, env.next()))
    return resolve(env, env.program, def)
  },

  proc (env: Environment): Model {
    return new Process(env.next())
  },

  rank (env: Environment): Model {
    return new Num(evaluate(env, env.next()).rank)
  },

  '@env' (env: Environment): Model {
    printEnvironment(env.program, env.outputs.stdout ?? new DummyOutputStream())
    return success
  },
}

export function printEnvironment (m: Model, out: OutputStream) {
  if (m instanceof And) {
    printEnvironment(m.a, out)
    printEnvironment(m.b, out)
  }
  else if (m instanceof ParentEnvironment) {
    if (m.hidden) {
      // don't print a hidden environment
    }
    else {
      printEnvironment(m.model, out)
    }
  }
  else {
    out.write(m.reflect())
  }
}
