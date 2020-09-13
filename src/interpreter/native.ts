import { DummyOutputStream } from "../stream"
import * as syntax from "../syntax"
import { OutputStream } from "../types"
import { Dictionary } from "../util/types"
import { falsehood, success, truth } from "./const"
import { Environment } from "./environment"
import { derive, evaluate, lowerMeet } from "./interpreter"
import { And, Definition, Model, Name, NativeProcess, Num, ParentEnvironment, Process, SyntaxError } from "./model"

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
  const v = typeof value === 'function'
    ? new NativeProcess(new syntax.Name(name), value)
    : value
  return new Definition(new Name(name), v)
}

const nativeDefs: Dictionary<NativeDefinition> = {
  true: truth,
  false: falsehood,

  def (env: Environment): Model {
    const name = env.next()
    if (!(name instanceof syntax.Name)) return new SyntaxError('the first argument of a definition must be a name', name)
    const def = new Definition(new Name(name.value), evaluate(env, env.next()))
    return derive(env, env.program, def)
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
