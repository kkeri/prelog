import * as syntax from "../syntax"
import { Model, SyntaxError, Definition, Name, Process } from "./model"
import { Rank } from "./threshold"
import { Environment, evaluate, resolve } from "./interpreter"

export class DefProc extends Model {
  rank = Rank.Neutral

  structEqual (other: this): boolean {
    return true
  }

  reflect () {
    return new syntax.Name('def')
  }

  invoke (env: Environment): Model {
    const name = env.next()
    if (!(name instanceof syntax.Name)) return new SyntaxError('the first argument of a definition must be a name', name)
    const def = new Definition(new Name(name.value), evaluate(env, env.next()))
    return resolve(env, env.program, def)
  }
}

export class ProcProc extends Model {
  rank = Rank.Neutral

  structEqual (other: this): boolean {
    return true
  }

  reflect () {
    return new syntax.Name('proc')
  }

  invoke (env: Environment): Model {
    return new Process(env.next())
  }
}
