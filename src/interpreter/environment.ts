import * as syntax from "../syntax"
import { Cons, EmptyList, List, Syntax } from "../syntax"
import { InputStream, OutputStream } from "../types"
import { Dictionary } from "../util/types"
import { Atom, Model, Sym } from "./model"
import { Semantics } from "./semantics"
import { lowerMeet, Rank } from "./threshold"

export class Environment {
  internMap: Map<string, Atom> = new Map()

  constructor (
    public sem: Semantics,
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

  internName (name: syntax.Sym): Atom {
    let atom = this.internMap.get(name.value)
    if (!atom) {
      atom = new Atom(Rank.Neutral, name)
      this.internMap.set(name.value, atom)
    }
    return atom
  }

  // operations
}

export function evaluate (env: Environment, syntax: Syntax): Model {
  return env.sem.evaluationRules.apply(env, syntax)
}

export function derive (env: Environment, a: Model, b: Model): Model {
  return env.sem.derivationRules.apply(env, a, b)
}

export function resolve (env: Environment, a: Model, b: Model): Model {
  return env.sem.resolutionRules.apply(env, a, b)
}

export function lookup (env: Environment, a: Model, b: Sym): Model {
  return env.sem.lookupRules.apply(env, a, b)
}

export function join (env: Environment, a: Model, b: Model): Model {
  return env.sem.joinRules.apply(env, a, b)
}

export function meet (env: Environment, a: Model, b: Model): Model {
  return env.sem.meetRules.apply(env, a, b)
}

// helpers

export function inheritEnv (env: Environment, args?: List): Environment {
  return new Environment(env.sem, env.program, env.inputs, env.outputs, args ?? env.args)
}
