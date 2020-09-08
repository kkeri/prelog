import * as syntax from "../syntax"
import { Environment } from "./environment"
import { evaluate, resolve, success, lowerMeet } from "./interpreter"
import { Definition, Model, Name, NativeProcess, Process, SyntaxError } from "./model"

export function getNativeEnvironment (): Environment {
  const env = new Environment(success)
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
}
