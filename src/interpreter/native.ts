import { DummyOutputStream } from "../stream"
import * as syntax from "../syntax"
import { OutputStream } from "../types"
import { Environment } from "./environment"
import { evaluate, lowerMeet, resolve, success } from "./interpreter"
import { And, Definition, Model, Name, NativeProcess, Process, SyntaxError, ParentEnvironment } from "./model"

export function getNativeEnvironment (): Environment {
  const env = new Environment(success, {}, {})
  for (const name in nativeProcesses) {
    env.program = lowerMeet(env, env.program, () => new Definition(
      new syntax.Name(name),
      new NativeProcess(
        new syntax.Name(name),
        nativeProcesses[name]
      )
    ))
  }
  return env
}

const nativeProcesses = {
  def (env: Environment): Model {
    const name = env.next()
    if (!(name instanceof syntax.Name)) return new SyntaxError('the first argument of a definition must be a name', name)
    const def = new Definition(name, evaluate(env, env.next()))
    return resolve(env, env.program, def)
  },

  proc (env: Environment): Model {
    return new Process(env.next())
  },

  '@env' (env: Environment): Model {
    printEnvironment(env.program, env.outputs.stdout ?? new DummyOutputStream())
    return success
  }
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
