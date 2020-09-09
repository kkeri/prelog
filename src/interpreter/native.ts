import { DummyOutputStream } from "../stream"
import * as syntax from "../syntax"
import { OutputStream } from "../types"
import { Environment } from "./environment"
import { evaluate, lowerMeet, resolve, success } from "./interpreter"
import { And, Definition, Model, Name, NativeProcess, Process, SyntaxError } from "./model"

export function getNativeEnvironment (): Environment {
  const env = new Environment(success, {}, {})
  for (const name in nativeProcesses) {
    env.program = lowerMeet(env, env.program, (new Definition(
      new Name(name),
      new NativeProcess(
        new syntax.Name(name),
        nativeProcesses[name]
      )
    )))
  }
  return env
}

const nativeProcesses = {
  def (env: Environment): Model {
    const name = env.next()
    if (!(name instanceof syntax.Name)) return new SyntaxError('the first argument of a definition must be a name', name)
    const def = new Definition(new Name(name.value), evaluate(env, env.next()))
    return resolve(env, env.program, def)
  },

  proc (env: Environment): Model {
    return new Process(env.next())
  },

  '@env' (env: Environment): Model {
    printEnvironment(env, env.outputs.stdout ?? new DummyOutputStream())
    return success
  }
}

export function printEnvironment (env: Environment, out: OutputStream) {
  _printEnvironment(env, out, env.program)
}

export function _printEnvironment (env: Environment, out: OutputStream, model: Model) {
  if (model instanceof And) {
    _printEnvironment(env, out, model.a)
    _printEnvironment(env, out, model.b)
  }
  else {
    out.write(model.reflect())
  }
}
