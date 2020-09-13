import * as syntax from "../syntax"
import { Syntax } from '../syntax'
import { InputStream, Interpreter, OutputStream } from '../types'
import { BinaryDispatcher, UnaryDispatcher } from '../util/dispatch'
import { Dictionary } from '../util/types'
import { Environment, inheritEnv } from './environment'
import { And, Atom, Definition, Model, Name, Num, Or, ParentEnvironment, SemanticsError, Str, structEqual, Sym, SyntaxError } from './model'
import { getNativeEnvironment } from './native'
import { Rank, thresholdJoin, thresholdMeet } from './threshold'

// A native, non-extendable interpreter based on resolution.

export class NativeInterpreter implements Interpreter {
  env: Environment

  constructor ({ inputs, outputs, args = new syntax.EmptyList() }: {
    inputs: Dictionary<InputStream>
    outputs: Dictionary<OutputStream>
    args?: syntax.List
  }) {
    const nativeEnv = getNativeEnvironment()
    const parentEnv = new ParentEnvironment(nativeEnv.program, true)
    this.env = new Environment(parentEnv, inputs, outputs, args)
  }

  extend (syntax: Syntax): Syntax {
    return this.env.extend(syntax).reflect()
  }

  current (): Syntax {
    return this.env.program.reflect()
  }
}

// constants

export const undef = new Atom(Rank.MetaFailure, new syntax.Name('undefined'))
export const success = new Atom(Rank.Top, new syntax.Name('success'))
export const failure = new Atom(Rank.Bottom, new syntax.Name('failure'))
export const truth = new Atom(Rank.True, new syntax.Name('true'))
export const falsehood = new Atom(Rank.False, new syntax.Name('false'))
export const noLookup = new Atom(Rank.Bottom, new syntax.Name('noLookup'))

// operations

export function evaluate (env: Environment, syntax: Syntax): Model {
  return evaluationRules.apply(env, syntax)
}

export function derive (env: Environment, a: Model, b: Model): Model {
  return derivationRules.apply(env, a, b)
}

export function resolve (env: Environment, a: Model, b: Model): Model {
  return resolutionRules.apply(env, a, b)
}

export function lookup (env: Environment, a: Model, b: Name | Sym): Model {
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

// logical connectives

// Find all alternatives.
export const upperJoin = thresholdJoin(Rank.Top, join)

// Find the first alternative.
export const lowerJoin = thresholdJoin(Rank.Bottom + 1, join)

export const upperMeet = thresholdMeet(Rank.Top - 1, meet)

export const lowerMeet = thresholdMeet(Rank.Bottom, meet)

// Rules

const evaluationRules = new UnaryDispatcher<Environment, Syntax, Model>(
  // default case
  (env, t) => new SyntaxError('cannot interpret syntax', t))

  .add(syntax.Sequence,
    (env, t) => {
      try {
        const childEnv = inheritEnv(env, t.body)
        const head = evaluate(env, childEnv.next())
        return head.invoke(childEnv)
      }
      catch (e) {
        return new SyntaxError(e.message, t)
      }
    })
  .add(syntax.Brackets,
    (env, t) => {
      let args = t.body
      let program: Model = failure
      while (args instanceof syntax.Cons) {
        const arg = args.next
        const childEnv = inheritEnv(env)
        program = upperJoin(childEnv, program, () => evaluate(childEnv, arg))
        args = args.rest
      }
      return program
    })
  .add(syntax.Braces,
    (env, t) => {
      const childEnv = inheritEnv(env)
      let args = t.body
      let program: Model = success
      while (args instanceof syntax.Cons) {
        const arg = args.next
        program = lowerMeet(childEnv, program, () => evaluate(childEnv, arg))
        args = args.rest
      }
      return program
    })
  .add(syntax.Name,
    (env, t) => {
      const name = new Name(t.value)
      const l = lookup(env, env.program, name)
      return l === noLookup ? name : l
    })
  .add(syntax.Sym,
    (env, t) => {
      const name = new Sym(t.value)
      const l = lookup(env, env.program, name)
      return l === noLookup ? name : l
    })
  .add(syntax.Str,
    (env, t) => new Str(t.value))
  .add(syntax.Num,
    (env, t) => new Num(t.value))

const lookupRules = new BinaryDispatcher<Environment, Model, Name | Sym, Model>(
  // default case
  (env) => noLookup)

  // structural rules
  .add(Or, null,
    (env, a, b) => lowerMeet(env, lookup(env, a.a, b), () => lookup(env, a.b, b)))
  .add(And, null,
    (env, a, b) => lowerJoin(env, lookup(env, a.b, b), () => lookup(env, a.a, b)))

  // specific rules
  .add(ParentEnvironment, null,
    (env, a, b) => lookup(env, a.model, b))
  .add(Definition, Name,
    (env, a, b) => structEqual(a.a, b) ? a.b : noLookup)
  .add(Definition, Sym,
    (env, a, b) => structEqual(a.a, b) ? a.b : noLookup)

const derivationRules = new BinaryDispatcher<Environment, Model, Model, Model>(
  // default case
  (env, a, b) => b)

  // structural rules
  .add(Or, null,
    (env, a, b) => lowerMeet(env, derive(env, a.a, b), () => derive(env, a.b, b)))
  .add(And, null,
    (env, a, b) => upperJoin(env, derive(env, a.a, b), () => derive(env, a.b, b)))

  // specific rules
  .add(Atom, Atom,
    (env, a, b) => (a === b) ? success : undef)
  .add(Definition, Definition,
    (env, a, b) => a.a === b.a
      ? structEqual(a.b, b.b)
        ? success
        : new SemanticsError('conflicting definition', b)
      : b)

const resolutionRules = new BinaryDispatcher<Environment, Model, Model, Model>(
  // default case
  (env, a, b) => a)

  // structural rules
  .add(Or, null,
    (env, a, b) => upperJoin(env, resolve(env, a.a, b), () => resolve(env, a.b, b)))
  .add(And, null,
    (env, a, b) => lowerMeet(env, resolve(env, a.a, b), () => resolve(env, a.b, b)))

  // specific rules
  .add(Name, Definition,
    (env, a, b) => structEqual(a, b.a) ? b.b : a)
  .add(Definition, Definition,
    (env, a, b) => new Definition(resolve(env, a.a, b.a), resolve(env, a.b, b.b)))

const joinRules = new BinaryDispatcher<Environment, Model, Model, Model>(
  // default case
  (env, a, b) => a.constructor === b.constructor ? a.join(b, env) : undef)

const meetRules = new BinaryDispatcher<Environment, Model, Model, Model>(
  // default case
  (env, a, b) => a.constructor === b.constructor ? a.meet(b, env) : undef)
