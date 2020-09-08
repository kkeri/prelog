import { Model, Definition } from "./model"
import { Syntax } from "../syntax"
import { evaluate, lowerMeet } from "./interpreter"

export class Environment {

  constructor (
    public program: Model,
    public args: Syntax[] = [],
    public argIdx: number = 0,
  ) { }

  extend (syntax: Syntax): Model {
    const model = evaluate(this, syntax)
    if (model instanceof Definition) {
      this.program = lowerMeet(this, this.program, model)
    }
    return model
  }

  // Returns and shifts away the next argument.
  // Throws EvalError if there are no more arguments.
  next () {
    if (this.argIdx < this.args.length) {
      return this.args[this.argIdx++]
    }
    else {
      throw new Error('too few arguments')
    }
  }

  // Returns the upcoming argument.
  // Returns null if there are no more arguments.
  peek () {
    return this.argIdx < this.args.length ? this.args[this.argIdx] : null
  }
}
