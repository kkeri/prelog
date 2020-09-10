import { Interpreter, InputStream, OutputStream } from '../types'
import * as syntax from "../syntax"
import { Syntax } from '../syntax'
import { BinaryDispatcher, UnaryDispatcher } from '../util/dispatch'
import { Environment, inheritEnv } from './environment'
import { And, Atom, Definition, Model, Name, Num, Or, SemanticsError, Str, structEqual, Sym, SyntaxError, ParentEnvironment } from './model'
import { getNativeEnvironment } from './native'
import { Rank, thresholdJoin, thresholdMeet } from './threshold'
import { Dictionary } from '../util/types'

// A native, non-extendable interpreter based on resolution.

export class NativeInterpreter implements Interpreter {
  env: Environment

  constructor (
    inputs: Dictionary<InputStream>,
    outputs: Dictionary<OutputStream>,
    args: Syntax[] = [],
    argIdx: number = 0,
  ) {
    const nativeEnv = getNativeEnvironment()
    const parentEnv = new ParentEnvironment(nativeEnv.program, true)
    this.env = new Environment(parentEnv, inputs, outputs, args, argIdx)
  }

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

export function evaluate (env: Environment, syntax: Syntax): Model {
  return evaluationRules.apply(env, syntax)
}

export function resolve (env: Environment, a: Model, b: Model): Model {
  return resolutionRules.apply(env, a, b)
}

export function lookup (env: Environment, a: Model, b: Model): Model {
  return lookupRules.apply(env, a, b)
}

export function join (env: Environment, a: Model, b: Model): Model {
  const j = joinRules.apply(env, a, b)
  return j === undef ? new Or(a, b, a.rank) : j
}

export function meet (env: Environment, a: Model, b: Model): Model {
  const m = meetRules.apply(env, a, b)
  return m === undef ? new And(a, b, a.rank) : m
}

// Rules

const evaluationRules = new UnaryDispatcher<Environment, Syntax, Model>(
  // default case
  (env, t) => new SyntaxError('cannot interpret syntax', t))

  .add(syntax.Sequence,
    (env, t) => {
      try {
        const childEnv = inheritEnv(env)
        childEnv.args = t.body
        childEnv.argIdx = 0
        const head = evaluate(env, childEnv.next())
        return head.invoke(childEnv)
      }
      catch (e) {
        return new SyntaxError(e.message, t)
      }
    })
  .add(syntax.Brackets,
    (env, t) => {
      const childEnv = inheritEnv(env)
      return t.body.reduce<Model>(
        (m: Model, e: Syntax) => upperJoin(childEnv, m, () => evaluate(childEnv, e)),
        failure,
      )
    })
  .add(syntax.Braces,
    (env, t) => t.body.reduce<Model>(
      (m: Model, e: Syntax) => {
        const childEnv = inheritEnv(env)
        return lowerMeet(childEnv, m, () => evaluate(childEnv, e))
      },
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

  // structural rules
  .add(Or, null,
    (env, a, b) => lowerMeet(env, resolve(env, a.a, b), () => resolve(env, a.b, b)))
  .add(And, null,
    (env, a, b) => upperJoin(env, resolve(env, a.a, b), () => resolve(env, a.b, b)))

  // specific rules
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

  // structural rules
  .add(Or, null,
    (env, a, b) => lowerMeet(env, lookup(env, a.a, b), () => lookup(env, a.b, b)))
  .add(And, null,
    (env, a, b) => lowerJoin(env, lookup(env, a.b, b), () => lookup(env, a.a, b)))

  // specific rules
  .add(ParentEnvironment, null,
    (env, a, b) => lookup(env, a.model, b))
  .add(Definition, Name,
    (env, a, b) => structEqual(a.a, b) ? a.b : undef)
  .add(Definition, Sym,
    (env, a, b) => structEqual(a.a, b) ? a.b : undef)

const joinRules = new BinaryDispatcher<Environment, Model, Model, Model>(
  // default case
  (env, a, b) => a.constructor === b.constructor ? a.join(b, env) : undef)

// structural rules

const meetRules = new BinaryDispatcher<Environment, Model, Model, Model>(
  // default case
  (env, a, b) => a.constructor === b.constructor ? a.meet(b, env) : undef)

// Find all alternatives.
export const upperJoin = thresholdJoin(Rank.Top, join)

// Find the first alternative.
export const lowerJoin = thresholdJoin(Rank.Bottom + 1, join)

export const upperMeet = thresholdMeet(Rank.Top - 1, meet)

export const lowerMeet = thresholdMeet(Rank.Bottom, meet)
