import { DummyOutputStream } from "../stream"
import * as syntax from "../syntax"
import { OutputStream } from "../types"
import { Dictionary } from "../util/types"
import { success } from "./const"
import { Environment, derive, evaluate } from "./environment"
import { And, Atom, Definition, Model, NativeProcess, SyntaxErr, Sym } from "./model"
import { Semantics } from "./semantics"
import { lowerMeet } from "./threshold"

export function getNativeEnvironment (sem: Semantics): Environment {
  const env = new Environment(sem, success, {}, {})
  for (const name in nativeDefs) {
    const sym = new Sym(name)
    env.program = lowerMeet(
      env,
      env.program,
      () => translateNativeDef(sym, nativeDefs[name]),
    )
  }
  return env
}

type NativeDefinition = Model | ((env: Environment) => Model)

function translateNativeDef (name: Model, value: NativeDefinition): Model {
  const v = typeof value === 'function'
    ? new NativeProcess(name, value)
    : value
  return new Definition(name, v, true)
}

const nativeDefs: Dictionary<NativeDefinition> = {
  // true: truth,
  // false: falsehood,

  def (env: Environment): Model {
    const name = env.next()
    if (!(name instanceof syntax.Sym)) return new SyntaxErr('the first argument of a definition must be a name', name)
    const def = new Definition(new Sym(name.value), evaluate(env, env.next()))
    return derive(env, env.program, def)
  },

  // proc (env: Environment): Model {
  //   return new Process(env.next())
  // },

  // rank (env: Environment): Model {
  //   return new Num(evaluate(env, env.next()).rank)
  // },

  '@env' (env: Environment): Model {
    printEnvironment(env.program, env.outputs.stdout ?? new DummyOutputStream())
    return success
  },
}

export function printEnvironment (model: Model, out: OutputStream) {
  if (model instanceof And) {
    printEnvironment(model.a, out)
    printEnvironment(model.b, out)
  }
  else if (model instanceof Definition) {
    if (model.native) {
      // don't print a native definition
    }
    else {
      out.write(model.reflect())
    }
  }
  else {
    out.write(model.reflect())
  }
}
