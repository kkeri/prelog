import { Interpreter } from '../interpreter'
import * as syntax from "../syntax"
import { Syntax } from '../syntax'
import { BinaryDispatcher, UnaryDispatcher } from '../util/dispatch'
import { And, Atom, Definition, Model, Name, Num, Or, SemanticsError, Str, structEqual, Sym, SyntaxError } from './model'
import { Rank, thresholdJoin, thresholdMeet } from './threshold'
import { DefProc, ProcProc } from './native'
import { constructor, number } from 'yargs'

// A native, non-extendable interpreter based on resolution.

export interface ArgumentReader {
  // Returns and shifts away the next argument.
  // Throws EvalError if there are no more arguments.
  next (): Syntax
  // Returns the upcoming argument.
  // Returns null if there are no more arguments.
  peek (): Syntax | null
}

export class Environment implements ArgumentReader {

  constructor (
    public program: Model,
    private args: Syntax[] = [],
    private argIdx: number = 0,
  ) { }

  extend (syntax: Syntax): Model {
    const model = evaluate(this, syntax)
    if (model instanceof Definition) {
      this.program = lowerMeet(this, this.program, model)
    }
    return model
  }

  next () {
    if (this.argIdx < this.args.length) {
      return this.args[this.argIdx++]
    }
    else {
      throw new Error('too few arguments')
    }
  }

  peek () {
    return this.argIdx < this.args.length ? this.args[this.argIdx] : null
  }
}

export class ResolverInterpreter implements Interpreter {
  env: Environment = new Environment(new And(
    new Definition(new Name('def'), new DefProc()),
    new Definition(new Name('proc'), new ProcProc()),
    Rank.Neutral,
  ))

  constructor (
    private args: Syntax[] = [],
    private argIdx: number = 0,
  ) { }

  extend (syntax: Syntax): Syntax {
    return this.env.extend(syntax).reflect()
  }

  current (): Syntax {
    return this.env.program.reflect()
  }
}

export const undef = new Atom(Rank.MetaFailure, new syntax.Name('undefined'))
export const success = new Atom(Rank.Top, new syntax.Name('success'))
export const failure = new Atom(Rank.Bottom, new syntax.Name('failure'))

function verboseFailure (descr: string, model: Model) {
  return new SemanticsError(descr, model)
}

function silentFailure () {
  return failure
}

const fail = verboseFailure

export function evaluate (env: Environment, syntax: Syntax): Model {
  return evaluationRules.apply(env, syntax)
}

export function resolve (env: Environment, a: Model, b: Model): Model {
  return resolutionRules.apply(env, a, b)
}

export function lookup (env: Environment, a: Model, b: Model): Model {
  return lookupRules.apply(env, a, b)
}

// Rules

const evaluationRules = new UnaryDispatcher<Environment, Syntax, Model>(
  // default case
  (env, t) => new SyntaxError('cannot interpret syntax', t))

  .add(syntax.Sequence,
    (env, t) => {
      try {
        env = new Environment(env.program, t.body, 0)
        const head = evaluate(env, env.next())
        return head.invoke(env)
      }
      catch (e) {
        return new SyntaxError(e.message, t)
      }
    })
  .add(syntax.Brackets,
    (env, t) => t.body.reduce<Model>(
      (m: Model, e: Syntax) => upperJoin(env, m, evaluate(env, e)),
      failure,
    ))
  .add(syntax.Braces,
    (env, t) => t.body.reduce<Model>(
      (m: Model, e: Syntax) => lowerMeet(env, m, evaluate(env, e)),
      success,
    ))
  .add(syntax.Name,
    (env, t) => lookup(env, env.program, new Name(t.value)))
  .add(syntax.Sym,
    (env, t) => lookup(env, env.program, new Sym(t.value)))
  .add(syntax.Str,
    (env, t) => new Str(t.value))
  .add(syntax.Num,
    (env, t) => new Num(t.value))

const resolutionRules = new BinaryDispatcher<Environment, Model, Model, Model>(
  // default case
  (env, a, b) => b)

  .add(Or, null,
    (env, a, b) => lowerMeet(env, resolve(env, a.a, b), resolve(env, a.b, b)))
  .add(And, null,
    (env, a, b) => upperJoin(env, resolve(env, a.a, b), resolve(env, a.b, b)))
  .add(Atom, Atom,
    (env, a, b) => (a === b) ? success : undef)
  .add(Definition, Definition,
    (env, a, b) => structEqual(a.a, b.a)
      ? structEqual(a.b, b.b)
        ? success
        : new SemanticsError('conflicting definition', b)
      : b)

const lookupRules = new BinaryDispatcher<Environment, Model, Model, Model>(
  // default case
  (env) => undef)

  .add(Or, null,
    (env, a, b) => lowerMeet(env, lookup(env, a.a, b), lookup(env, a.b, b)))
  .add(And, null,
    (env, a, b) => lowerJoin(env, lookup(env, a.b, b), lookup(env, a.a, b)))
  .add(Definition, Name,
    (env, a, b) => structEqual(a.a, b) ? a.b : undef)
  .add(Definition, Sym,
    (env, a, b) => structEqual(a.a, b) ? a.b : undef)

export function join (env: Environment, a: Model, b: Model): Model {
  const j = joinRules.apply(env, a, b)
  return j === undef ? new Or(a, b, a.rank) : j
}

const joinRules = new BinaryDispatcher<Environment, Model, Model, Model>(
  // default case
  (env, a, b) => a.constructor === b.constructor ? a.join(b, env) : undef)

export function meet (env: Environment, a: Model, b: Model): Model {
  const m = meetRules.apply(env, a, b)
  return m === undef ? new And(a, b, a.rank) : m
}

const meetRules = new BinaryDispatcher<Environment, Model, Model, Model>(
  // default case
  (env, a, b) => a.constructor === b.constructor ? a.meet(b, env) : undef)

// Find all alternatives.
const upperJoin = thresholdJoin(Rank.Top, join)

// Find the first alternative.
const lowerJoin = thresholdJoin(Rank.Bottom + 1, join)

const upperMeet = thresholdMeet(Rank.Top - 1, meet)

const lowerMeet = thresholdMeet(Rank.Bottom, meet)
