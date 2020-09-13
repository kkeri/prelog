import { Syntax, List, EmptyList, Cons } from "../syntax"
import { InputStream, OutputStream } from "../types"
import { Dictionary } from "../util/types"
import { evaluate, lowerMeet, resolve } from "./interpreter"
import { Model, ParentEnvironment } from "./model"
import { Rank } from "./threshold"

export class Environment {

  constructor (
    public program: Model,
    public inputs: Dictionary<InputStream>,
    public outputs: Dictionary<OutputStream>,
    public args: List = new EmptyList(),
  ) {
    this.program
  }

  // Extends the internal program with the interpretation of a term.
  extend (syntax: Syntax): Model {
    const model = evaluate(this, syntax)
    this.program = lowerMeet(this, resolve(this, this.program, model), () => model)
    return model
  }

  // Returns the current program.
  current (): Model {
    return this.program
  }

  // Returns true if the program cannot be usefully extended any more,
  // e.g. due to PoE in a conjunctive environment.
  saturated (): boolean {
    return this.program.rank > Rank.Bottom
  }

  // Returns and drops the next argument.
  // Throws EvalError if there are no more arguments.
  next () {
    if (this.args instanceof Cons) {
      const arg = this.args.next
      this.args = this.args.rest
      return arg
    }
    else {
      throw new Error('too few arguments')
    }
  }

  // Returns the list of remaining arguments.
  rest () {
    return this.args
  }

  // Returns the upcoming argument.
  // Returns null if there are no more arguments.
  peek () {
    return this.args instanceof Cons ? this.args.next : null
  }
}

export function inheritEnv (env: Environment, args?: List): Environment {
  return new Environment(new ParentEnvironment(env.program),
    env.inputs, env.outputs, args ?? env.args)
}
