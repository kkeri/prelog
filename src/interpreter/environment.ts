import { Syntax } from "../syntax"
import { InputStream, OutputStream } from "../types"
import { Dictionary } from "../util/types"
import { evaluate, lowerMeet } from "./interpreter"
import { Definition, Model } from "./model"

export class Environment {

  constructor (
    public program: Model,
    public inputs: Dictionary<InputStream>,
    public outputs: Dictionary<OutputStream>,
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
